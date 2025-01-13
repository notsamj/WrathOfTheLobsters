class Gun extends RangedWeapon {
    constructor(model, details){
        super();
        this.model = model;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.loaded = true;

        this.reloading = false;
        this.reloadLock = new TickLock(RETRO_GAME_DATA["gun_data"][this.model]["reload_time_ms"] / RETRO_GAME_DATA["general"]["ms_between_ticks"]);
    
        this.maxSwayVelocityRAD = 1 / getTickRate() * toRadians(objectHasKey(details, "max_sway_velocity_deg") ? details["max_sway_velocity_deg"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["max_sway_velocity_deg"]);
        this.swingMaxRandomConstant = 1 / getTickRate() * toRadians(objectHasKey(details, "maximum_random_sway_acceleration_deg") ? details["maximum_random_sway_acceleration_deg"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["maximum_random_sway_acceleration_deg"]);
        this.swingMinRandomConstant = 1 / getTickRate() * toRadians(objectHasKey(details, "minimum_random_sway_acceleration_deg") ? details["minimum_random_sway_acceleration_deg"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["minimum_random_sway_acceleration_deg"]);
        this.swayCompensationConstant = 1 / getTickRate() * toRadians(objectHasKey(details, "corrective_sway_acceleration_deg") ? details["corrective_sway_acceleration_deg"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["corrective_sway_acceleration_deg"]);
        this.swayDeclineA = objectHasKey(details, "sway_decline_a") ? details["sway_decline_a"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["sway_decline_a"];
        this.swayDeclineB = objectHasKey(details, "sway_decline_b") ? details["sway_decline_b"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["sway_decline_b"];
        this.swayConstantC = objectHasKey(details, "corrective_sway_acceleration_constant_c") ? details["corrective_sway_acceleration_constant_c"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["corrective_sway_acceleration_constant_c"];
        this.swayConstantD = objectHasKey(details, "corrective_sway_acceleration_constant_d") ? details["corrective_sway_acceleration_constant_d"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["corrective_sway_acceleration_constant_d"];
        this.swayMaxAngleRAD = toRadians(objectHasKey(details, "sway_max_angle_deg") ? details["sway_max_angle_deg"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["sway_max_angle_deg"]);
        this.currentAngleOffsetRAD = 0;
        this.currentAngleOffsetVelocity = 0;
        this.swaying = false;
        this.swayStartTick = -1;
    }

    breakAction(){
        this.cancelReload();
        this.resetSway();
    }

    drawCrosshair(lX, bY){
        let mouseX = window.mouseX;
        let mouseY = window.mouseY;

        let canvasX = mouseX;
        let canvasY = this.getScene().changeFromScreenY(mouseY);

        // Don't display if invalid value
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }

        let engineX = canvasX / gameZoom + lX;
        let engineY = canvasY / gameZoom + bY;

        let humanCenterX = this.player.getInterpolatedTickCenterX();
        let humanCenterY = this.player.getInterpolatedTickCenterY();

        let distance = Math.sqrt(Math.pow(engineX - humanCenterX, 2) + Math.pow(engineY - humanCenterY, 2));
        let swayedAngleRAD = this.getSwayedAngleRAD();

        let crosshairCenterX = Math.cos(swayedAngleRAD) * distance + humanCenterX;
        let crosshairCenterY = Math.sin(swayedAngleRAD) * distance + humanCenterY;

        let x = this.getScene().getDisplayXOfPoint(crosshairCenterX, lX);
        let y = this.getScene().getDisplayYOfPoint(crosshairCenterY, bY);
        let crosshairImage = IMAGES["crosshair"];
        let crosshairWidth = crosshairImage.width;
        let crosshairHeight = crosshairImage.height;
        translate(x, y);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(crosshairImage, -1 * crosshairWidth / 2, -1 * crosshairHeight / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * x, -1 * y);
    }

    resetSway(){
        // If already acknowledged that swaying is stopped then ignore
        if (!this.isSwaying()){
            return;
        }
        let swayMaxAngleRAD = this.getSwayMaxAngleRAD();
        let maxVelocity = this.getMaxSwayVelocityRAD();
        this.currentAngleOffsetRAD = this.player.getRandom().getFloatInRange(-1 * swayMaxAngleRAD, swayMaxAngleRAD);
        this.currentAngleOffsetVelocity = this.player.getRandom().getFloatInRange(-1 * maxVelocity, maxVelocity);
        this.swaying = false;
    }

    startSwaying(){
        this.swaying = true;
        this.swayStartTick = this.player.getGamemode().getCurrentTick();
    }

    isSwaying(){
        return this.swaying;
    }

    getRandom(){
        return this.player.getRandom();
    }

    updateSway(){
        if (this.isAiming()){
            if (!this.isSwaying()){
                this.startSwaying();
            }
            let newAngleOffset = this.currentAngleOffsetRAD;
            let correctiveAcceleration = this.currentAngleOffsetRAD * -1 * this.swayConstantC + this.currentAngleOffsetVelocity * -1 * this.swayConstantD;
            correctiveAcceleration = Math.min(correctiveAcceleration, this.swayCompensationConstant);
            correctiveAcceleration = Math.max(correctiveAcceleration, this.swayCompensationConstant * -1);
            let maxVelocity = this.getMaxSwayVelocityRAD();
            let swayMaxAngleRAD = this.getSwayMaxAngleRAD();

            let declineConstA = this.getSwayConstantA();
            let declineConstB = this.getSwayConstantB();

            let secondsSinceSwayStarted = calculateMSBetweenTicks() * (this.player.getGamemode().getCurrentTick() - this.swayStartTick) / 1000; 

            let randomAccelerationOverTimeMultiplier = getDeclining1OverXOf(declineConstA, declineConstB, secondsSinceSwayStarted);
            let maxRandom = this.swingMaxRandomConstant;
            let minRandom = this.swingMinRandomConstant;
            let randomAccelerationAtTime = minRandom + (maxRandom - minRandom) * randomAccelerationOverTimeMultiplier;
            let randomlyGeneratedMultiplier = this.getRandom().getFloatInRange(-1, 1);
            randomAccelerationAtTime *= randomlyGeneratedMultiplier;

            let acceleration = correctiveAcceleration + randomAccelerationAtTime;

            //  Make sure velocity in bounds
            let newVelocity = this.currentAngleOffsetVelocity + acceleration;
            newVelocity = Math.min(newVelocity, maxVelocity);
            newVelocity = Math.max(newVelocity, maxVelocity * -1);
            this.currentAngleOffsetVelocity = newVelocity;

            // Make sure offset in bounds
            let newOffset = this.currentAngleOffsetRAD + this.currentAngleOffsetVelocity;
            newOffset = Math.min(newOffset, swayMaxAngleRAD);
            newOffset = Math.max(newOffset, swayMaxAngleRAD * -1);
            //console.log(this.currentAngleOffsetVelocity, acceleration, newOffset)
            this.currentAngleOffsetRAD = newOffset;
        }else{
            // Reset angle offset if not aiming
            this.resetSway();
        }
    }

    getCurrentAngleOffsetRAD(){
        return this.currentAngleOffsetRAD;
    }

    getSwayedAngleRAD(){
        return fixRadians(this.getDecidedAngleRAD() + this.getCurrentAngleOffsetRAD());
    }

    getSwayConstantA(){
        return this.swayDeclineA;
    }

    getSwayConstantB(){
        return this.swayDeclineB;
    }

    getMaxSwayVelocityRAD(){
        return this.maxSwayVelocityRAD;
    }

    getSwayMaxAngleRAD(){
        return this.swayMaxAngleRAD;
    }

    tick(){
        this.updateSway();
    }

    makeDecisions(){
        this.player.makeGunDecisions();
    }

    forceReload(){
        this.reloading = false;
        this.reloadLock.reset();
        this.loaded = true;
    }

    getDecidedAngleRAD(){
        return this.getDecision("aiming_angle_rad");
    }

    // Abstract
    makeDecisions(){}

    // Abstract
    getSimulatedGunEndPosition(){}

    // Note: Assumes this instance of Gun has decisions
    getDecisions(){
        return this.decisions;
    }

    getScene(){
        return this.player.getScene();
    }

    reload(){
        this.reloading = true;
        this.reloadLock.resetAndLock();
    }

    isReloading(){
        return this.reloading;
    }

    cancelReload(){
        this.reloading = false;
    }

    select(){}
    // Abstract
    deselect(){}

    getModel(){
        return this.model;
    }

    getBulletRange(){
        return RETRO_GAME_DATA["gun_data"][this.getModel()]["range"];
    }

    shoot(){
        // Add smoke where gun is shot
        this.getGamemode().getEventHandler().emit({
            "name": "gun_shot",
            "x": this.getEndOfGunX(),
            "y": this.getEndOfGunY(),
            // tbf lets just say you can sort of extrapolate the shooters location its adjacent at worse anyway
            "shooter_tile_x": this.player.getTileX(),
            "shooter_tile_y": this.player.getTileY(),
            "shooter_id": this.player.getID()
        });
        // Try to kill whenever is there
        let angleRAD = this.getSwayedAngleRAD();
        let range = this.getBulletRange();
        let myID = this.player.getID();
        let collision = this.getScene().findInstantCollisionForProjectile(this.getEndOfGunX(), this.getEndOfGunY(), angleRAD, range, (enemy) => { return enemy.getID() === myID; });
        // If it hits an entity
        if (collision["collision_type"] === "entity"){
            collision["entity"].getShot(this.player.getModel(), this.player.getID());
        }
        // If it hits a physical tile or nothing then create bullet collision particle
        else if (collision["collision_type"] === null || collision["collision_type"] === "physical_tile"){
            // If the shot didn't hit anything alive then show particles when it hit
            // TODO: Add an event for this
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }
        this.loaded = false;
    }

    isLoaded(){
        return this.loaded;
    }

    isAiming(){
        return this.getDecision("trying_to_aim") && this.directionToAimIsOk() && !this.player.isMoving() && !this.isReloading();
    }

    directionToAimIsOk(){
        let angleTryingToAimAtRAD = this.getDecidedAngleRAD();
        let playerVisualDirection = this.player.getFacingDirection();
        return Gun.isAngleValidForVisualDirection(angleTryingToAimAtRAD, playerVisualDirection);
    }

    static getLeftAngleForVisualDirection(visualDirection){
        if (visualDirection === "front"){
            return toRadians(0);
        }else if (visualDirection === "left"){
            return toRadians(270);
        }else if (visualDirection === "right"){
            return toRadians(90);
        }else if (visualDirection === "back"){
            return toRadians(180);
        }
        throw new Error(`Invalid player direction: ${visualDirection}`);
    }

    static getRightAngleForVisualDirection(visualDirection){
        if (visualDirection === "front"){
            return toRadians(180);
        }else if (visualDirection === "left"){
            return toRadians(90);
        }else if (visualDirection === "right"){
            return toRadians(270);
        }else if (visualDirection === "back"){
            return toRadians(0);
        }
        throw new Error(`Invalid player direction: ${visualDirection}`);
    }

    static isAngleValidForVisualDirection(angleRAD, visualDirection){
        return angleBetweenCCWRAD(angleRAD, Gun.getRightAngleForVisualDirection(visualDirection), Gun.getLeftAngleForVisualDirection(visualDirection));
    }
}