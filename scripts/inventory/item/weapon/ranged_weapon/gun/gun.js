/*
    Class Name: Gun
    Class Description: A gun
*/
class Gun extends RangedWeapon {
    /*
        Method Name: constructor
        Method Parameters: 
            model:
                Model of the gun (string)
            details:
                JSON details with extra information
        Method Description: constructor
        Method Return: constructor
    */
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

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the gun on equip
        Method Return: void
    */
    reset(){
        this.currentAngleOffsetRAD = 0;
        this.currentAngleOffsetVelocity = 0;
        this.swaying = false;
        this.swayStartTick = -1;
        this.loaded = true;
        this.reloading = false;
        this.reloadLock.restoreDefault();
    }

    /*
        Method Name: displayUIAssociated
        Method Parameters: None
        Method Description: Displays UI associated with the gun - crosshair 
        Method Return: void
    */
    displayUIAssociated(){
        let lX = this.getScene().getLX();
        let bY = this.getScene().getBY();
        if (this.isAiming()){
            this.drawCrosshair(lX, bY);
        }
    }

    /*
        Method Name: getPlayer
        Method Parameters: None
        Method Description: Getter
        Method Return: Character
    */
    getPlayer(){
        return this.player;
    }

    /*
        Method Name: breakAction
        Method Parameters: None
        Method Description: Breaks the current action
        Method Return: void
    */
    breakAction(){
        this.cancelReload();
        this.resetSway();
    }

    /*
        Method Name: drawCrosshair
        Method Parameters: 
            lX:
                The x coordinate of the left of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Draws the crosshair on the screen
        Method Return: void
    */
    drawCrosshair(lX, bY){
        this.player.drawGunCrosshair(this, lX, bY);
    }

    /*
        Method Name: resetSway
        Method Parameters: None
        Method Description: Resets the gun sway
        Method Return: void
    */
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

    /*
        Method Name: startSwaying
        Method Parameters: None
        Method Description: Starts the gun sway
        Method Return: void
    */
    startSwaying(){
        this.swaying = true;
        this.swayStartTick = this.player.getGamemode().getCurrentTick();
    }

    /*
        Method Name: isSwaying
        Method Parameters: None
        Method Description: Checks if the gun is swaying
        Method Return: boolean
    */
    isSwaying(){
        return this.swaying;
    }

    /*
        Method Name: getRandom
        Method Parameters: None
        Method Description: Gets the random instance
        Method Return: SeededRandomizer
    */
    getRandom(){
        return this.player.getRandom();
    }

    /*
        Method Name: getMaxSwayOffsetOverTime
        Method Parameters: 
            timeMS:
                A period of time (ms)
        Method Description: Gets the maximum sway offset over a period of time
        Method Return: void
    */
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

    /*
        Method Name: getNewSwayValues
        Method Parameters: None
        Method Description: Determines new sway values
        Method Return: JSON
    */
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

    /*
        Method Name: updateSway
        Method Parameters: None
        Method Description: Updates the gun sway
        Method Return: void
    */
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

    /*
        Method Name: getCurrentAngleOffsetRAD
        Method Parameters: None
        Method Description: Getter
        Method Return: float [0,2*PI)
    */
    getCurrentAngleOffsetRAD(){
        return this.currentAngleOffsetRAD;
    }

    /*
        Method Name: getSwayedAngleRAD
        Method Parameters: None
        Method Description: Determines the angle - takes into account current sway
        Method Return: float [0,2*PI)
    */
    getSwayedAngleRAD(){
        return fixRadians(this.getDecidedAngleRAD() + this.getCurrentAngleOffsetRAD());
    }

    /*
        Method Name: getSwayConstantA
        Method Parameters: None
        Method Description: Getter
        Method Return: number
    */
    getSwayConstantA(){
        return this.swayDeclineA;
    }

    /*
        Method Name: getSwayConstantB
        Method Parameters: None
        Method Description: Getter
        Method Return: number
    */
    getSwayConstantB(){
        return this.swayDeclineB;
    }

    /*
        Method Name: getMaxSwayVelocityRAD
        Method Parameters: None
        Method Description: Getter
        Method Return: float [0,2*PI)
    */
    getMaxSwayVelocityRAD(){
        return this.maxSwayVelocityRAD;
    }

    /*
        Method Name: getSwayMaxAngleRAD
        Method Parameters: None
        Method Description: Getter
        Method Return: float [0,2*PI)
    */
    getSwayMaxAngleRAD(){
        return this.swayMaxAngleRAD;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick processes
        Method Return: void
    */
    tick(){
        this.updateSway();
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Tells player to make gun decisions
        Method Return: void
    */
    makeDecisions(){
        this.player.makeGunDecisions();
    }

    /*
        Method Name: forceReload
        Method Parameters: None
        Method Description: Forces a gun reload
        Method Return: void
    */
    forceReload(){
        this.reloading = false;
        this.reloadLock.reset();
        this.loaded = true;
    }

    /*
        Method Name: getDecidedAngleRAD
        Method Parameters: None
        Method Description: Determines the current desired angle of the holder
        Method Return: float [0,2*PI)
    */
    getDecidedAngleRAD(){
        return this.getDecision("aiming_angle_rad");
    }

    /*
        Method Name: getSimulatedGunEndPosition
        Method Parameters: None
        Method Description: abstract
        Method Return: abstract
    */
    getSimulatedGunEndPosition(){}

    /*
        Method Name: getScene
        Method Parameters: None
        Method Description: Gets the scene of the player
        Method Return: WTLGameScene
    */
    getScene(){
        return this.player.getScene();
    }

    /*
        Method Name: reload
        Method Parameters: None
        Method Description: Reloads the gun
        Method Return: void
    */
    reload(){
        this.reloading = true;
        this.reloadLock.resetAndLock();
    }

    /*
        Method Name: isReloading
        Method Parameters: None
        Method Description: Checks if the gun is reloading
        Method Return: boolean
    */
    isReloading(){
        return this.reloading;
    }

    /*
        Method Name: cancelReload
        Method Parameters: None
        Method Description: Cancels the gun reload
        Method Return: void
    */
    cancelReload(){
        this.reloading = false;
    }

    /*
        Method Name: select
        Method Parameters: None
        Method Description: abstract
        Method Return: abstract
    */
    select(){}
    /*
        Method Name: deselect
        Method Parameters: None
        Method Description: abstract
        Method Return: abstract
    */
    deselect(){}

    /*
        Method Name: getModel
        Method Parameters: None
        Method Description: Getter
        Method Return: string
    */
    getModel(){
        return this.model;
    }

    /*
        Method Name: getBulletRange
        Method Parameters: None
        Method Description: Gets the bullet range for this gun
        Method Return: number
    */
    getBulletRange(){
        return WTL_GAME_DATA["gun_data"][this.getModel()]["range"];
    }

    /*
        Method Name: shoot
        Method Parameters: None
        Method Description: Shoots the gun
        Method Return: void
    */
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
            // Note: in the future dd an event for this
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }
        this.loaded = false;
    }

    /*
        Method Name: isLoaded
        Method Parameters: None
        Method Description: Checks if the gun is loaded
        Method Return: boolean
    */
    isLoaded(){
        return this.loaded;
    }

    /*
        Method Name: isAiming
        Method Parameters: None
        Method Description: Checks if conditions are met such that the gun is aiming
        Method Return: boolean
    */
    isAiming(){
        return this.getDecision("trying_to_aim") && this.directionToAimIsOk() && !this.player.isMoving() && !this.isReloading();
    }

    /*
        Method Name: directionToAimIsOk
        Method Parameters: None
        Method Description: Checks if the aiming direction is ok
        Method Return: boolean
    */
    directionToAimIsOk(){
        let angleTryingToAimAtRAD = this.getDecidedAngleRAD();
        let playerVisualDirection = this.player.getFacingDirection();
        return Gun.isAngleValidForVisualDirection(angleTryingToAimAtRAD, playerVisualDirection);
    }

    /*
        Method Name: getLeftAngleForVisualDirection
        Method Parameters: 
            visualDirection:
                A character visual direction
        Method Description: Gets the "left angle" (counter clockwise end) of a range given a facing direction
        Method Return: string
    */
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

    /*
        Method Name: getRightAngleForVisualDirection
        Method Parameters: 
            visualDirection:
                A character visual direction
        Method Description: Gets the "right angle" (clockwise end) of a range given a facing direction
        Method Return: string
    */
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

    /*
        Method Name: isAngleValidForVisualDirection
        Method Parameters: 
            angleRAD:
                An angle in radians (float)
            visualDirection:
                A character visual direction (string)
        Method Description: Checks if an angle is valid to shoot when facing a given direction
        Method Return: boolean
    */
    static isAngleValidForVisualDirection(angleRAD, visualDirection){
        return angleBetweenCCWRAD(angleRAD, Gun.getRightAngleForVisualDirection(visualDirection), Gun.getLeftAngleForVisualDirection(visualDirection));
    }
}