class Gun extends RangedWeapon {
    constructor(model, details){
        super();
        this.model = model;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.loaded = true;

        this.reloading = false;
        this.reloadLock = new TickLock(WTL_GAME_DATA["gun_data"][this.model]["reload_time_ms"] / WTL_GAME_DATA["general"]["ms_between_ticks"]);
    
        this.maxSwayVelocityRAD = 1 / getTickRate() * toRadians(objectHasKey(details, "max_sway_velocity_deg") ? details["max_sway_velocity_deg"] : WTL_GAME_DATA["gun_data"][this.getModel()]["max_sway_velocity_deg"]);
        this.swingMaxRandomConstant = 1 / getTickRate() * toRadians(objectHasKey(details, "maximum_random_sway_acceleration_deg") ? details["maximum_random_sway_acceleration_deg"] : WTL_GAME_DATA["gun_data"][this.getModel()]["maximum_random_sway_acceleration_deg"]);
        this.swingMinRandomConstant = 1 / getTickRate() * toRadians(objectHasKey(details, "minimum_random_sway_acceleration_deg") ? details["minimum_random_sway_acceleration_deg"] : WTL_GAME_DATA["gun_data"][this.getModel()]["minimum_random_sway_acceleration_deg"]);
        this.swayCompensationConstant = 1 / getTickRate() * toRadians(objectHasKey(details, "corrective_sway_acceleration_deg") ? details["corrective_sway_acceleration_deg"] : WTL_GAME_DATA["gun_data"][this.getModel()]["corrective_sway_acceleration_deg"]);
        this.swayDeclineA = objectHasKey(details, "sway_decline_a") ? details["sway_decline_a"] : WTL_GAME_DATA["gun_data"][this.getModel()]["sway_decline_a"];
        this.swayDeclineB = objectHasKey(details, "sway_decline_b") ? details["sway_decline_b"] : WTL_GAME_DATA["gun_data"][this.getModel()]["sway_decline_b"];
        this.swayConstantC = objectHasKey(details, "corrective_sway_acceleration_constant_c") ? details["corrective_sway_acceleration_constant_c"] : WTL_GAME_DATA["gun_data"][this.getModel()]["corrective_sway_acceleration_constant_c"];
        this.swayConstantD = objectHasKey(details, "corrective_sway_acceleration_constant_d") ? details["corrective_sway_acceleration_constant_d"] : WTL_GAME_DATA["gun_data"][this.getModel()]["corrective_sway_acceleration_constant_d"];
        this.swayMaxAngleRAD = toRadians(objectHasKey(details, "sway_max_angle_deg") ? details["sway_max_angle_deg"] : WTL_GAME_DATA["gun_data"][this.getModel()]["sway_max_angle_deg"]);
        this.minSwayStartAngleRAD = toRadians(objectHasKey(details, "min_start_sway_deg") ? details["min_start_sway_deg"] : WTL_GAME_DATA["gun_data"][this.getModel()]["min_start_sway_deg"]);
        this.currentAngleOffsetRAD = 0;
        this.currentAngleOffsetVelocity = 0;
        this.swaying = false;
        this.swayStartTick = -1;
    }

    reset(){
        this.currentAngleOffsetRAD = 0;
        this.currentAngleOffsetVelocity = 0;
        this.swaying = false;
        this.swayStartTick = -1;
        this.loaded = true;
        this.reloading = false;
        this.reloadLock.restoreDefault();
    }

    displayUIAssociated(){
        let lX = this.getScene().getLX();
        let bY = this.getScene().getBY();
        if (this.isAiming()){
            this.drawCrosshair(lX, bY);
        }
    }

    getPlayer(){
        return this.player;
    }

    breakAction(){
        this.cancelReload();
        this.resetSway();
    }

    drawCrosshair(lX, bY){
        this.player.drawGunCrosshair(this, lX, bY);
    }

    resetSway(){
        // If already acknowledged that swaying is stopped then ignore
        if (!this.isSwaying()){
            return;
        }
        let swayMaxAngleRAD = this.getSwayMaxAngleRAD();
        let maxVelocity = this.getMaxSwayVelocityRAD();
        this.currentAngleOffsetRAD = this.player.getRandom().getFloatInRange(this.minSwayStartAngleRAD, swayMaxAngleRAD);
        this.currentAngleOffsetRAD *= (this.player.getRandom().getIntInRangeInclusive(0,1) === 0) ? -1 : 1;
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

    getMaxSwayOffsetOverTime(timeMS){
        let newAngleOffset = this.currentAngleOffsetRAD;
        let correctiveAcceleration = this.currentAngleOffsetRAD * -1 * this.swayConstantC + this.currentAngleOffsetVelocity * -1 * this.swayConstantD;
        correctiveAcceleration = Math.min(correctiveAcceleration, this.swayCompensationConstant);
        correctiveAcceleration = Math.max(correctiveAcceleration, this.swayCompensationConstant * -1);
        let maxVelocity = this.getMaxSwayVelocityRAD();
        let swayMaxAngleRAD = this.getSwayMaxAngleRAD();

        let declineConstA = this.getSwayConstantA();
        let declineConstB = this.getSwayConstantB();

        let maxRandom = this.swingMaxRandomConstant;
        let minRandom = this.swingMinRandomConstant;

        let numTicksToSimulate = Math.ceil(timeMS / calculateMSBetweenTicks());
        let actualCurrentTick = this.player.getGamemode().getCurrentTick();

        let velocity = this.currentAngleOffsetVelocity;
        let offset = this.currentAngleOffsetRAD;

        let maxOffset = Math.abs(offset);

        for (let i = 0; i < numTicksToSimulate; i++){
            let currentTick = actualCurrentTick + numTicksToSimulate;
            let secondsSinceSwayStarted = calculateMSBetweenTicks() * (currentTick - this.swayStartTick) / 1000; 

            let randomAccelerationOverTimeMultiplier = getDeclining1OverXOf(declineConstA, declineConstB, secondsSinceSwayStarted);

            let randomAccelerationAtTime = minRandom + (maxRandom - minRandom) * randomAccelerationOverTimeMultiplier;
            let randomlyGeneratedMultiplier = this.getRandom().getFloatInRange(-1, 1);
            randomAccelerationAtTime *= randomlyGeneratedMultiplier;

            let acceleration = correctiveAcceleration + randomAccelerationAtTime;

            //  Make sure velocity in bounds
            velocity = velocity + acceleration;
            velocity = Math.min(velocity, maxVelocity);
            velocity = Math.max(velocity, maxVelocity * -1);

            // Make sure offset in bounds
            offset = offset + velocity;
            offset = Math.min(offset, swayMaxAngleRAD);
            offset = Math.max(offset, swayMaxAngleRAD * -1);

            maxOffset = Math.max(Math.abs(offset), maxOffset);
        }

        return maxOffset;

    }

    getNewSwayValues(){
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

        // Make sure offset in bounds
        let newOffset = this.currentAngleOffsetRAD + newVelocity;
        newOffset = Math.min(newOffset, swayMaxAngleRAD);
        newOffset = Math.max(newOffset, swayMaxAngleRAD * -1);
        return {"new_offset": newOffset, "new_velocity": newVelocity} ;
    }

    updateSway(){
        if (this.isAiming()){
            if (!this.isSwaying()){
                this.startSwaying();
            }
            let updatedAmounts = this.getNewSwayValues();
            this.currentAngleOffsetVelocity = updatedAmounts["new_velocity"];
            this.currentAngleOffsetRAD = updatedAmounts["new_offset"];
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
        return WTL_GAME_DATA["gun_data"][this.getModel()]["range"];
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
            "shooter_id": this.player.getID(),
            "shooter_facing_movement_direction": this.player.getFacingUDLRDirection()
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