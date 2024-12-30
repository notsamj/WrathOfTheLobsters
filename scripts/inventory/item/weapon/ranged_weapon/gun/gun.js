class Gun extends RangedWeapon {
    constructor(model, details){
        super();
        this.model = model;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.loaded = true;

        this.reloading = false;
        this.reloadLock = new TickLock(RETRO_GAME_DATA["gun_data"][this.model]["reload_time_ms"] / RETRO_GAME_DATA["general"]["ms_between_ticks"]);
    
        this.swayAccelerationConstant = objectHasKey(details, "sway_acceleration_constant") ? details["sway_acceleration_constant"] : 0;
        this.swayDeclineA = objectHasKey(details, "sway_decline_a") ? details["sway_decline_a"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["sway_decline_a"];
        this.swayDeclineB = objectHasKey(details, "sway_decline_b") ? details["sway_decline_b"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["sway_decline_b"];
        this.swayVelocityMinCapCoefficient = 1 / (objectHasKey(details, "min_sway_velocity_cap_seconds") ? details["min_sway_velocity_cap_seconds"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["min_sway_velocity_cap_seconds"]);
        this.swayVelocityCoefficient = 1 / (objectHasKey(details, "max_sway_velocity_seconds") ? details["max_sway_velocity_seconds"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["max_sway_velocity_seconds"]);
        this.swayMinCapAngleRAD = toRadians(objectHasKey(details, "sway_min_cap_angle_deg") ? details["sway_min_cap_angle_deg"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["sway_min_cap_angle_deg"]);
        this.swayMaxAngleRAD = toRadians(objectHasKey(details, "sway_max_angle_deg") ? details["sway_max_angle_deg"] : RETRO_GAME_DATA["gun_data"][this.getModel()]["sway_max_angle_deg"]);
        this.currentAngleOffsetRAD = 0;
        this.currentAngleOffsetVelocity = 0;
        this.swaying = false;
        this.swayStartTick = -1;
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
        let maxVelocity = swayMaxAngleRAD / RETRO_GAME_DATA["general"]["ms_between_ticks"] * this.getSwayVelocityCoefficient();
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

    updateSway(){
        if (this.isAiming()){
            if (!this.isSwaying()){
                this.startSwaying();
            }
            let newAngleOffset = this.currentAngleOffsetRAD;
            let acceleration = this.player.getRandom().getFloatInRange(-1 * this.swayAccelerationConstant, this.swayAccelerationConstant);

            let declineConstA = this.getSwayConstantA();
            let declineConstB = this.getSwayConstantB();
            let swayMaxAngleRAD = this.getSwayMaxAngleRAD();
            let minSwayAngle = this.getSwayMinCapAngleRAD();
            let swayAngleDifference = swayMaxAngleRAD - minSwayAngle;
            let minSwayVelocityCoefficient = this.getSwayVelocityMinCapCoefficient();
            let swayVelocityDifferenceCoefficient = this.getSwayVelocityCoefficient() - minSwayVelocityCoefficient;
            let maxVelocityDifference = swayMaxAngleRAD / RETRO_GAME_DATA["general"]["ms_between_ticks"] * swayVelocityDifferenceCoefficient;

            let secondsSinceSwayStarted = RETRO_GAME_DATA["general"]["ms_between_ticks"] * (this.player.getGamemode().getCurrentTick() - this.swayStartTick) / 1000; 

            let maxVelocityAtTime = getDeclining1OverXOf(declineConstA, declineConstB, secondsSinceSwayStarted) / 1 * maxVelocityDifference + minSwayVelocityCoefficient;
            let swayMaxAngleAtTimeRAD = getDeclining1OverXOf(declineConstA, declineConstB, secondsSinceSwayStarted) / 1 * swayAngleDifference + minSwayAngle;

            //  Make sure velocity in bounds
            let newVelocity = this.currentAngleOffsetVelocity + acceleration;
            newVelocity = Math.min(newVelocity, maxVelocityAtTime);
            newVelocity = Math.max(newVelocity, maxVelocityAtTime * -1);
            this.currentAngleOffsetVelocity = newVelocity;

            // Make sure offset in bounds
            let newOffset = this.currentAngleOffsetRAD + this.currentAngleOffsetVelocity;
            newOffset = Math.min(newOffset, swayMaxAngleAtTimeRAD);
            newOffset = Math.max(newOffset, swayMaxAngleAtTimeRAD * -1);
            this.currentAngleOffsetRAD = newOffset;

            console.log(this.currentAngleOffsetVelocity, this.currentAngleOffsetRAD, swayMaxAngleAtTimeRAD, acceleration)
        }else{
            // Reset angle offset if not aiming
            this.resetSway();
        }
    }

    getSwayedAngleRAD(){
        return fixRadians(this.getDecidedAngleRAD() + this.currentAngleOffsetRAD);
    }

    getSwayConstantA(){
        return this.swayDeclineA;
    }

    getSwayConstantB(){
        return this.swayDeclineB;
    }

    getSwayVelocityMinCapCoefficient(){
        return this.swayVelocityMinCapCoefficient;
    }

    getSwayVelocityCoefficient(){
        return this.swayVelocityCoefficient;
    }

    getSwayMinCapAngleRAD(){
        return this.swayMinCapAngleRAD;
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
        let angleTryingToAimAtDEG = toFixedDegrees(this.getDecidedAngleRAD());
        let playerDirection = this.player.getFacingDirection();
        if (playerDirection == "front"){
            return angleTryingToAimAtDEG > 180 && angleTryingToAimAtDEG <= 359;
        }else if (playerDirection == "left"){
            return angleTryingToAimAtDEG > 90 && angleTryingToAimAtDEG < 270;
        }else if (playerDirection == "right"){
            return (angleTryingToAimAtDEG > 270 && angleTryingToAimAtDEG < 360) || (angleTryingToAimAtDEG >= 0 && angleTryingToAimAtDEG < 90);
        }else if (playerDirection == "back"){
            return angleTryingToAimAtDEG > 0 && angleTryingToAimAtDEG < 180;
        }
        throw new Error(`Invalid player direction: ${playerDirection}`);
    }
}