/*
    Class Name: GentlemanlyDuelBot
    Class Description: A bot in a gentlemanly duel
*/

class GentlemanlyDuelBot extends GentlemanlyDuelCharacter {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Relevant gamemode
            model:
                String. Model of character
            extraDetails:
                Extra details about character json
            botExtraDetails:
                Extra details about bot json
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, model, extraDetails, botExtraDetails){
        super(gamemode, model, extraDetails);
        this.perception = new BotPerception(this, Math.ceil(botExtraDetails["reaction_time_ms"] / calculateMSBetweenTicks()));
        this.disabled = botExtraDetails["disabled"];
        this.randomEventManager = new RandomEventManager(this.getRandom());
        this.temporaryOperatingData = new TemporaryOperatingData();

        // Declare
        this.turnUnlockTick = 0;
        this.startUnlockTick = 0;
        
        this.botDecisionDetails = {
            "enemy": null,
            "state_data": null,
            "decisions": {
                "weapons": {
                    "gun": {
                        "trying_to_aim": false,
                        "trying_to_shoot": false,
                        "trying_to_reload": false
                    }
                }
            }
        }
    }

    /*
        Method Name: drawGunCrosshair
        Method Parameters: 
            gun:
                A gun instance
            lX:
                The x coordinate of the left side of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Draws the crosshair on the screen
        Method Return: void
    */
    drawGunCrosshair(gun, lX, bY){
        let enemy = this.getEnemy();

        let enemyX = enemy.getInterpolatedTickCenterX();
        let enemyY = enemy.getInterpolatedTickCenterY();

        let humanCenterX = this.getInterpolatedTickCenterX();
        let humanCenterY = this.getInterpolatedTickCenterY();

        let distance = Math.sqrt(Math.pow(enemyX - humanCenterX, 2) + Math.pow(enemyY - humanCenterY, 2));
        let swayedAngleRAD = gun.getSwayedAngleRAD();

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

    /*
        Method Name: getEnemyID
        Method Parameters: None
        Method Description: Gets the enemy's id
        Method Return: String
    */
    getEnemyID(){
        return this.getEnemy().getID();
    }

    /*
        Method Name: isDisabled
        Method Parameters: None
        Method Description: Checks if the bot is disabled
        Method Return: boolean
    */
    isDisabled(){
        return this.disabled;
    }

    /*
        Method Name: getDataToReactTo
        Method Parameters: 
            dataKey:
                Key to the requested data
        Method Description: Shortcut to perception function
        Method Return: Variable
    */
    getDataToReactTo(dataKey){
        return this.perception.getDataToReactTo(dataKey, this.getCurrentTick());
    }

    /*
        Method Name: hasDataToReactTo
        Method Parameters: 
            dataKey:
                Key to the requested data
        Method Description: Shortcut to perception function
        Method Return: boolean
    */
    hasDataToReactTo(dataKey){
        return this.perception.hasDataToReactTo(dataKey, this.getCurrentTick());
    }

    /*
        Method Name: inputPerceptionData
        Method Parameters: 
            dataKey:
                Key to the requested data
            dataValue:
                Value to store
        Method Description: Shortcut to perception function
        Method Return: void
    */
    inputPerceptionData(dataKey, dataValue){
        this.perception.inputData(dataKey, dataValue, this.getCurrentTick());
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles actions during a tick
        Method Return: void
    */
    tick(){
        if (this.isDead()){ return; }
        this.perceive();
        super.tick();
    }

    /*
        Method Name: perceive
        Method Parameters: None
        Method Description: Perceives the world
        Method Return: void
    */
    perceive(){
        let duelStarted = this.gamemode.hasDuelStarted();
        this.inputPerceptionData("duel_started", duelStarted);
        if (duelStarted){
            let enemy = this.getEnemy();
            let enemyInterpolatedTickCenterX = enemy.getInterpolatedTickCenterX();
            let enemyInterpolatedTickCenterY = enemy.getInterpolatedTickCenterY();
            this.inputPerceptionData("enemy_interpolated_tick_center_x", enemyInterpolatedTickCenterX);
            this.inputPerceptionData("enemy_interpolated_tick_center_y", enemyInterpolatedTickCenterY);
            this.inputPerceptionData("enemy_location", {"tile_x": enemy.getTileX(), "tile_y": enemy.getTileY()});
        }
        let heldItem = this.getInventory().getSelectedItem();
        if (heldItem instanceof Gun){
            let myGun = heldItem;
            let mySwayOffsetMagnitude = myGun.getMaxSwayOffsetOverTime(WTL_GAME_DATA["gentlemanly_duel"]["ai"]["shoot_offset_sample_time_ms"]);
            this.inputPerceptionData("sway_magnitude", mySwayOffsetMagnitude);
        }
    }
    
    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Makes decisions
        Method Return: void
    */
    makeDecisions(){
        if (this.getGamemode().isOver()){ return; }
        if (this.isDisabled()){ return; }
        // Reset then make bot decisions
        this.resetBotDecisions();
        this.botDecisions();

        // Reset then make decisions (based on bot decisions)
        this.resetDecisions();
        //this.inventory.makeDecisions();
        // Make decisions foe held item
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }
        // Check for commands
        this.updateFromCommands();
    }

    /*
        Method Name: resetBotDecisions
        Method Parameters: None
        Method Description: Resets the bot decisions
        Method Return: void
    */
    resetBotDecisions(){
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"] = false;
    }

    /*
        Method Name: updateFromCommands
        Method Parameters: None
        Method Description: Makes decisions from game commands
        Method Return: void
    */
    updateFromCommands(){
        let command = this.gamemode.getCommandFromGame(this.getID());
        this.amendDecisions(command);
    }

    /*
        Method Name: botDecisions
        Method Parameters: None
        Method Description: Makes bot decisions
        Method Return: void
    */
    botDecisions(){
        // Execute state decisions
        this.engageInDuel();
    }

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Takes actions
        Method Return: void
    */
    actOnDecisions(){
        if (this.getGamemode().isOver()){ return; }
        super.actOnDecisions();
    }

    /*
        Method Name: speculateOnHittingEnemy
        Method Parameters: 
            bulletRange:
                The distance a bullet can reach
            enemyCenterX:
                The x location of the enemy's center
            enemyCenterY:
                The y location of the enemy's center
            gunEndX:
                The x location of the end of my gun
            gunEndY:
                The y location of the end of my gun
            visualDirectionToFace:
                The (visual) direction to face
        Method Description: Speculates on the possibility of hitting the enemy with a gun
        Method Return: JSON Object
    */
speculateOnHittingEnemy(bulletRange, enemyCenterX, enemyCenterY, gunEndX, gunEndY, visualDirectionToFace){
        let anglesToCheck = [];

        let result = {
            "can_hit": false,
            "left_angle": null,
            "right_angle": null,
            "best_angle": null
        }

        let lA = Gun.getLeftAngleForVisualDirection(visualDirectionToFace);
        let rA = Gun.getRightAngleForVisualDirection(visualDirectionToFace);

        let directAngleRAD = displacementToRadians(enemyCenterX - gunEndX, enemyCenterY-gunEndY);

        let enemy = this.getEnemy();
        let enemyHitbox = enemy.getUpdatedHitbox();

        let enemyLeftX = enemyCenterX - (enemy.getWidth()-1)/2;
        let enemyRightX = enemyLeftX + (enemy.getWidth()-1);
        let enemyTopY = enemyCenterY + (enemy.getHeight()-1)/2;
        let enemyBottomY = enemyTopY - (enemy.getHeight()-1);

        // Update with known info
        enemyHitbox.update(enemyLeftX, enemyTopY);
        // if gun end is inside enemy hitbox
        if (enemyHitbox.coversPoint(gunEndX, gunEndY)){
            return {
                "can_hit": true,
                "left_angle": lA,
                "right_angle": rA,
                "best_angle": rotateCWRAD(lA, calculateAngleDiffCCWRAD(rA, lA)/2)
            }
        }

        let distance = calculateEuclideanDistance(enemyCenterX, enemyCenterY, gunEndX, gunEndY);

        // Add angle directly to enemy center
        anglesToCheck.push(directAngleRAD);

        let inQ1 = angleBetweenCCWRAD(directAngleRAD, toRadians(0), toRadians(90));
        let inQ2 = angleBetweenCCWRAD(directAngleRAD, toRadians(90), toRadians(180));
        let inQ3 = angleBetweenCCWRAD(directAngleRAD, toRadians(180), toRadians(270));
        
        let leftAngle;
        let rightAngle;
        let paddingSize = 1;

        // Add pading
        let paddedEnemyLeftX = enemyCenterX - (enemy.getWidth()-1)/2;
        let paddedEnemyRightX = enemyLeftX + (enemy.getWidth()-1);
        let paddedEnemyTopY = enemyCenterY + (enemy.getHeight()-1)/2;
        let paddedEnemyBottomY = enemyTopY - (enemy.getHeight()-1);

        let insideX = gunEndX >= enemyLeftX && gunEndX <= enemyRightX;
        let insideY = gunEndY >= enemyBottomY && gunEndY <= enemyTopY;
        let outside = !(insideX || insideY);

        // If the gunX and gunY are totally outside enemy boundaries
        if (outside){
            // If the direct angle is in quadrant 1
            if (inQ1){
                leftAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyTopY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyBottomY-gunEndY);
            }
            // If the direct angle is in quadrant 2
            else if (inQ2){
                leftAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyBottomY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyTopY-gunEndY);
            }
            // If the direct angle is in quadrant 3
            else if (inQ3){
                leftAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyBottomY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyTopY-gunEndY);
            }
            // Else its in quadrant 4
            else{
                leftAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyTopY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyBottomY-gunEndY);
            }
        }
        // Else if the gunX is inside the enemy x boundaries
        else if (insideX){
            // If the direct angle is in quadrant 1
            if (inQ1){
                leftAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyTopY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyTopY-gunEndY);
            }
            // If the direct angle is in quadrant 2
            else if (inQ2){
                leftAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyTopY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyTopY-gunEndY);
            }
            // If the direct angle is in quadrant 3
            else if (inQ3){
                leftAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyBottomY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyBottomY-gunEndY);
            }
            // Else its in quadrant 4
            else{
                leftAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyBottomY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyBottomY-gunEndY);
            }
        }
        // Else if the gunY is inside the enemy y boundaries
        else{
            // If the direct angle is in quadrant 1
            if (inQ1){
                leftAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyTopY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyBottomY-gunEndY);
            }
            // If the direct angle is in quadrant 2
            else if (inQ2){
                leftAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyBottomY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyTopY-gunEndY);
            }
            // If the direct angle is in quadrant 3
            else if (inQ3){
                leftAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyBottomY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyLeftX-gunEndX, paddedEnemyTopY-gunEndY);
            }
            // Else its in quadrant 4
            else{
                leftAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyTopY-gunEndY);
                rightAngle = displacementToRadians(paddedEnemyRightX-gunEndX, paddedEnemyBottomY-gunEndY);
            }
        }

        /*
            If angle is 0->90 or angle is 181->270
                leftAngle = angleToTopLeft()
                rightAngle = angleToBottomRight()
            If angle is 91->180 or angle is 271->359
                leftAngle = angleToBottomLeft()
                rightAngle = angleToTopRight()

            Take samples (random?) but about equally spaced between the left and right maybe 1 pixel padding so you can check the far left and right 
            If any of the samples can hit then return true;
        */

        // Add left and right angles
        anglesToCheck.push(leftAngle);
        anglesToCheck.push(rightAngle);

        let samplePrecision = toRadians(WTL_GAME_DATA["gentlemanly_duel"]["ai"]["aiming_precision_degrees"]);

        let sampleAngle = rightAngle + samplePrecision;

        // Add the sample angles
        while (angleBetweenCCWRAD(sampleAngle, leftAngle, rightAngle)){
            anglesToCheck.push(sampleAngle);
            sampleAngle = fixRadians(sampleAngle + samplePrecision);
        }

        // Check all the angles
        let canHit = false;
        let bestAngle = null;

        // Sort the angles best to worst (most middle)
        let sortFunction = (angle1, angle2) => {
          return Math.abs(angle1 - directAngleRAD) - Math.abs(angle2 - directAngleRAD);
        }
        anglesToCheck.sort(sortFunction);

        // Loop through the angle
        let targets = [{"center_x": enemyCenterX, "center_y": enemyCenterY, "half_width": enemy.getHalfWidth(), "half_height": enemy.getHalfHeight(), "entity": null}];
        for (let angle of anglesToCheck){
            // if the angle isn't between the two allowable angles then skip
            if (!angleBetweenCCWRAD(angle, rA, lA)){ continue; }
            let collision = this.getScene().findInstantCollisionForProjectileWithTargets(gunEndX, gunEndY, angle, bulletRange, targets);
            if (collision["collision_type"] === "entity"){
                canHit = true;
                bestAngle = angle; // Assuming this loop goes through angles best to worst
                break;
            }
        }

        // Set result values
        result["can_hit"] = canHit;
        result["best_angle"] = bestAngle;
        result["left_angle"] = leftAngle;
        result["right_angle"] = rightAngle;

        // No possibility of collision found
        return result;
    }

    /*
        Method Name: engageInDuel
        Method Parameters: None
        Method Description: Makes shooting decisions while dueling
        Method Return: void
    */
    engageInDuel(){
        // Nothing to do if the duel is yet to start
        if (!this.hasDataToReactTo("duel_started") || !this.getDataToReactTo("duel_started")){ return; }


        // Assume if currently aiming I'd like to continue unless disabled elsewhere
        let myGun = this.getInventory().getSelectedItem();
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = myGun.isAiming() && myGun.isLoaded();

        let scene = this.getScene();

        let enemyInterpolatedTickCenterX = this.getDataToReactTo("enemy_interpolated_tick_center_x");
        let enemyInterpolatedTickCenterY = this.getDataToReactTo("enemy_interpolated_tick_center_y");
        let enemyLocation = this.getDataToReactTo("enemy_location");
        let enemyTileX = enemyLocation["tile_x"];
        let enemyTileY = enemyLocation["tile_y"];

        // Make decisions based on if my gun is loaded
        if (myGun.isLoaded()){
            // Check if I can hit the enemy were I to aim (WITHOUT MOVING)
            let angleToEnemyTileCenter = displacementToRadians(enemyTileX - this.getTileX(), enemyTileY - this.getTileY());
            let bestVisualDirection = angleToBestFaceDirection(angleToEnemyTileCenter);
            let bestMovementDirection = getMovementDirectionOf(bestVisualDirection);
            let playerLeftX = scene.getXOfTile(this.getTileX());
            let playerTopY = scene.getYOfTile(this.getTileY());
            let pos = myGun.getSimulatedGunEndPosition(playerLeftX, playerTopY, bestVisualDirection, angleToEnemyTileCenter);
            let gunEndX = pos["x"];
            let gunEndY = pos["y"];
            let speculationResult = this.speculateOnHittingEnemy(myGun.getBulletRange(), enemyInterpolatedTickCenterX, enemyInterpolatedTickCenterY, gunEndX, gunEndY, bestVisualDirection);
            let canHitEnemyIfIAimAndShoot = speculationResult["can_hit"];

            // If I am aiming
            if (myGun.isAiming() && myGun.isLoaded()){
                if (canHitEnemyIfIAimAndShoot){
                    // Allow bot to estimate the magnitude of the sway offset
                    let mySwayOffsetMagnitude;
                    if (this.hasDataToReactTo("sway_magnitude")){
                        mySwayOffsetMagnitude = this.getDataToReactTo("sway_magnitude");
                    }else{
                        // If no data available -> assume the worst
                        mySwayOffsetMagnitude = myGun.getSwayMaxAngleRAD();
                    }
                    let myChanceOfHittingAShot = calculateAngleRangeOverlapProportion(speculationResult["right_angle"], speculationResult["left_angle"], speculationResult["best_angle"] - mySwayOffsetMagnitude/2, speculationResult["best_angle"] + mySwayOffsetMagnitude/2);

                    let shotAConstant = WTL_GAME_DATA["gentlemanly_duel"]["ai"]["shot_take_function_a_constant"];
                    let shotBConstant = WTL_GAME_DATA["gentlemanly_duel"]["ai"]["shot_take_function_b_constant"];
                    let secondsToShootWithThisChance = getDeclining1OverXOf(shotAConstant, shotBConstant, myChanceOfHittingAShot);
                    secondsToShootWithThisChance = Math.max(secondsToShootWithThisChance, 0);


                    // Convert to ms and acknowledge cap
                    let msToShootWithThisChance = Math.min(secondsToShootWithThisChance * 1000, WTL_GAME_DATA["gentlemanly_duel"]["ai"]["max_expected_ms_to_hold_a_shot"]);
                    let decideToShootBasedOnRandom = this.getRandomEventManager().getResultExpectedMS(msToShootWithThisChance);
                    let guaranteedHit = myChanceOfHittingAShot === 1;
                    let decidedToShoot = guaranteedHit || decideToShootBasedOnRandom;
                    this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] = decidedToShoot;

                }else{
                    // Note: Expect this not to occur so.... 
                    throw new Error("Unexpected behavior.")
                }
            }
            // Else I am not aiming currently
            else{
                // Set angle
                this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = speculationResult["best_angle"];
                this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = this.getRandomEventManager().getResultExpectedMS(WTL_GAME_DATA["gentlemanly_duel"]["ai"]["good_shot_try_to_aim_delay_ms"]);
            }

        }
        // Gun is NOT loaded
        else{
            // Reload
            if (!myGun.isReloading()){
                this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"] = true;
            }
        }
    }   

    /*
        Method Name: getEnemy
        Method Parameters: None
        Method Description: Gets the enemy
        Method Return: void
    */
    getEnemy(){
        // If I've already saved the enemy in storage then just return it
        if (this.botDecisionDetails["enemy"] != null){
            return this.botDecisionDetails["enemy"];
        }

        // Otherwise search for it
        let participants = this.gamemode.getParticipants();
        for (let participant of participants){
            if (!participant.is(this)){
                this.botDecisionDetails["enemy"] = participant;
                return participant;
            }
        }
        throw new Error("DuelBot failed to find enemy.");
    }

    /*
        Method Name: getRandom
        Method Parameters: None
        Method Description: Gets the random instance
        Method Return: SeededRandomizer
    */
    getRandom(){
        return this.gamemode.getRandom();
    }

    /*
        Method Name: getRandomEventManager
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getRandomEventManager(){
        return this.randomEventManager;
    }

    /*
        Method Name: makePistolDecisions
        Method Parameters: None
        Method Description: Make character-level decisions on shooting a pistol
        Method Return: void
    */
    makePistolDecisions(){
        let canShoot = this.gamemode.canShoot(this.getID());
        let tryingToAim = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] && canShoot;
        let tryingToShoot = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] && canShoot;
        let tryingToReload = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"];
        let aimingAngleRAD = this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"];
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": aimingAngleRAD
        });
    }

    /*
        Method Name: isHuman
        Method Parameters: None
        Method Description: Checks if this is a human
        Method Return: boolean
    */
    isHuman(){ return false; }
}