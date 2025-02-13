/*  
    Class Name: DuelBot
    Class Description: A bot that fights in a duel
*/
class DuelBot extends DuelCharacter {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Relevant gamemode
            model:
                String. A character model
            extraDetails:
                A JSON object with extra information about the character
            botExtraDetails:
                A JSON object with extra information about the bot
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, model, extraDetails, botExtraDetails){
        super(gamemode, model, extraDetails);
        this.perception = new BotPerception(this, Math.ceil(botExtraDetails["reaction_time_ms"] / calculateMSBetweenTicks()));
        this.disabled = botExtraDetails["disabled"];
        this.randomEventManager = new RandomEventManager(this.getRandom());
        this.temporaryOperatingData = new TemporaryOperatingData();
        this.botDecisionDetails = {
            "state": "starting",
            "action" : null,
            "enemy": null,
            "state_data": null,
            "decisions": {
                "select_slot": null,
                "up": false,
                "down": false,
                "left": false,
                "right": false,
                "sprint": false,
                "breaking_stride": false,
                "weapons": {
                    "sword": { 
                        "trying_to_swing_sword": false,
                        "trying_to_block": false
                    },
                    "gun": {
                        "trying_to_aim": false,
                        "trying_to_shoot": false,
                        "trying_to_reload": false,
                        "cancel_reload": false
                    },
                    "musket": {
                        "toggling_bayonet_equip": false,
                        "trying_to_stab": false
                    }
                }
            }
        }
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the bot
        Method Return: void
    */
    reset(){
        this.perception.clear();
        this.resetBotDecisions();
        this.botDecisionDetails["state"] = "starting";
        this.botDecisionDetails["action"] = null;
        this.botDecisionDetails["state_data"] = null;
        this.inventory.resetSelection();
        this.lookingDetails["direction"] = null;
        this.lookingDetails["look_lock"].restoreDefault();
        this.staminaBar.reset();
        this.stunLock.restoreDefault();
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
        Method Name: notifyOfGunshot
        Method Parameters: 
            shooterTileX:
                Tile x coordinate of a shooter
            shooterTileY:
                Tile y coordinate of a shooter
            enemyFacingMovementDirection:
                The facing direction of the enemy
        Method Description: Informs the bot about a shot taken
        Method Return: void
    */
    notifyOfGunshot(shooterTileX, shooterTileY, enemyFacingMovementDirection){
        this.inputPerceptionData("enemy_location", {"tile_x": shooterTileX, "tile_y": shooterTileY});
        this.inputPerceptionData("enemy_facing_movement_direction", enemyFacingMovementDirection);
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
        // Focused on enemy

        let enemy = this.getEnemy();
        let canSeeEnemy = this.canSee(enemy);
        let certainOfEnemyLocation = canSeeEnemy;
        this.inputPerceptionData("can_see_enemy", canSeeEnemy);

        let currentTick = this.getCurrentTick();
        let lastTick = currentTick - 1;

        let hasPossibleLocation = false;
        let hasLocationOnThisLastTick = this.perception.hasDataToReactToExact("enemy_location", lastTick);
        let possibleTileX;
        let possibleTileY;
        let enemyLocation = null;

        // If we could see enemy last tick but not not then see if they are stuck in their location (we can see all around them)
        if (!canSeeEnemy && this.perception.hasDataToReactToExact("can_see_enemy", lastTick) && this.perception.getDataToReactToExact("can_see_enemy", lastTick)){
            // If we saw them previously but can't now
            let lastLocation = this.perception.getDataToReactToExact("enemy_location", lastTick);
            let lastTileX = lastLocation["tile_x"];
            let lastTileY = lastLocation["tile_y"];

            // Check that me moving isn't the reason I can no longer see the enemy
            let myMovementIsNotTheCause = this.couldSeeEntityIfOnTile(lastTileX, lastTileX);
            if (myMovementIsNotTheCause){
                let enemyMovedInDirectionUDLR = this.perception.getDataToReactToExact("enemy_facing_movement_direction", lastTick);
                let newTileX = lastTileX;
                let newTileY = lastTileY;
                // Determine new tile location
                if (enemyMovedInDirectionUDLR === "down"){
                    newTileY -= 1;
                }else if (enemyMovedInDirectionUDLR === "left"){
                    newTileX -= 1;
                }else if (enemyMovedInDirectionUDLR === "right"){
                    newTileX += 1;
                }else{ // Up
                    newTileY += 1;
                }

                // Save the possible location
                hasPossibleLocation = true;
                possibleTileX = newTileX;
                possibleTileY = newTileY;
            }
        }

        if (canSeeEnemy){
            this.inputPerceptionData("enemy_facing_movement_direction", enemy.getFacingUDLRDirection());
            this.inputPerceptionData("enemy_health", enemy.getHealth());
            this.inputPerceptionData("enemy_moving", enemy.isMoving());
            let enemyInventory = enemy.getInventory();
            let enemyHoldingAnItem = enemyInventory.hasSelectedItem();
            let enemyHoldingAWeapon = false;
            let enemyHoldingARangedWeapon = false;
            let enemyHoldingAGun = false;
            let enemyHoldingALoadedGun = false;
            let enemyHoldingAMeleeWeapon = false;
            let enemyHoldingASword = false;
            let enemyItem;
            if (enemyHoldingAnItem){
                enemyItem = enemyInventory.getSelectedItem();
                enemyHoldingAWeapon = enemyItem instanceof Weapon;
                enemyHoldingARangedWeapon = enemyHoldingAWeapon && (enemyItem instanceof RangedWeapon);
                enemyHoldingAGun = enemyHoldingARangedWeapon && (enemyItem instanceof Gun);
                enemyHoldingALoadedGun = enemyHoldingAGun && (enemyItem.isLoaded());
                enemyHoldingAMeleeWeapon = enemyHoldingAWeapon && (enemyItem instanceof MeleeWeapon);
                enemyHoldingASword = enemyHoldingAMeleeWeapon && (enemyItem instanceof Sword);
            }
            this.inputPerceptionData("enemy_holding_a_weapon", enemyHoldingAWeapon);
            this.inputPerceptionData("enemy_holding_a_ranged_weapon", enemyHoldingARangedWeapon);
            this.inputPerceptionData("enemy_holding_a_gun", enemyHoldingAGun);
            this.inputPerceptionData("enemy_holding_a_loaded_gun", enemyHoldingALoadedGun);
            this.inputPerceptionData("enemy_is_aiming_a_loaded_gun", enemyHoldingALoadedGun && enemyItem.isAiming());
            this.inputPerceptionData("enemy_holding_a_melee_weapon", enemyHoldingAMeleeWeapon);
            this.inputPerceptionData("enemy_holding_a_sword", enemyHoldingASword);

            if (enemyHoldingASword){
                let sword = enemyItem;
                let swordSwinging = sword.isSwinging();
                this.inputPerceptionData("enemy_sword_swing_time_ms", sword.getSwingTimeMS());
                this.inputPerceptionData("enemy_swinging_a_sword", swordSwinging);
                this.inputPerceptionData("enemy_sword_model", sword.getModel());
                if (swordSwinging){
                    this.inputPerceptionData("enemy_sword_swing_start_tick", sword.getSwingStartTick());
                }
            }
        }
        // Can't see enemy
        else if (hasPossibleLocation || hasLocationOnThisLastTick){
            // Assuming the possible location (we actually saw the enemy last tick) is the best (or only) option.
            // If I don't have it then try this other thing
            if (!hasPossibleLocation){
                let loc = this.perception.getDataToReactToExact("enemy_location", lastTick);
                possibleTileX = loc["tile_x"];
                possibleTileY = loc["tile_y"];
            }

            let canSeeAll = true;
            // The 4 tiles around the enemy
            let tilesAroundEnemy = [[possibleTileX, possibleTileY+1], [possibleTileX-1, possibleTileY], [possibleTileX+1, possibleTileY], [possibleTileX, possibleTileY-1]];
            for (let tileAroundEnemy of tilesAroundEnemy){
                // If tile is non-walkable OR I can see it then its valid. If NOT then I can't see all
                if (!(this.getScene().tileAtLocationHasAttribute(tileAroundEnemy[0], tileAroundEnemy[1], "no_walk") || this.couldSeeEntityIfOnTile(tileAroundEnemy[0], tileAroundEnemy[1]))){
                    canSeeAll = false;
                    break;
                }
            }

            // If i'm certain I know where the enemy is then save this location
            certainOfEnemyLocation = canSeeAll;

        }

        this.inputPerceptionData("certain_of_enemy_location", certainOfEnemyLocation);
        if (certainOfEnemyLocation){
            let enemyWidth = enemy.getWidth();
            let enemyHeight = enemy.getHeight();
            let enemyHalfWidth = enemy.getHalfWidth();
            let enemyHalfHeight = enemy.getHalfHeight();
            let enemyInterpolatedTickCenterX = enemy.getInterpolatedTickCenterX();
            let enemyInterpolatedTickCenterY = enemy.getInterpolatedTickCenterY();
            let enemyInterpolatedTickLeftX = enemy.getInterpolatedTickX();
            let enemyInterpolatedTickTopY = enemy.getInterpolatedTickY();
            this.inputPerceptionData("enemy_x_velocity", enemy.getXVelocity());
            this.inputPerceptionData("enemy_y_velocity", enemy.getYVelocity());
            this.inputPerceptionData("enemy_width", enemyWidth);
            this.inputPerceptionData("enemy_height", enemyHeight);
            this.inputPerceptionData("enemy_half_width", enemyHalfWidth);
            this.inputPerceptionData("enemy_half_height", enemyHalfHeight);
            this.inputPerceptionData("enemy_interpolated_tick_center_x", enemyInterpolatedTickCenterX);
            this.inputPerceptionData("enemy_interpolated_tick_center_y", enemyInterpolatedTickCenterY);
            this.inputPerceptionData("enemy_interpolated_tick_left_x", enemyInterpolatedTickLeftX);
            this.inputPerceptionData("enemy_interpolated_tick_top_y", enemyInterpolatedTickTopY);
            this.inputPerceptionData("enemy_location", {"tile_x": enemy.getTileX(), "tile_y": enemy.getTileY()});
        }
        
        let heldItem = this.getInventory().getSelectedItem();
        if (heldItem instanceof Gun){
            let myGun = heldItem;
            let mySwayOffsetMagnitude = myGun.getMaxSwayOffsetOverTime(WTL_GAME_DATA["duel"]["ai"]["shoot_offset_sample_time_ms"]);
            this.inputPerceptionData("sway_magnitude", mySwayOffsetMagnitude);
        }
    }

    /*
        Method Name: resetBotDecisions
        Method Parameters: None
        Method Description: Resets the bot decisions
        Method Return: void
    */
    resetBotDecisions(){
        // Note: in the future could use something that copies decisions are beginning and pastes it here
        this.botDecisionDetails["decisions"]["select_slot"] = null;
        this.botDecisionDetails["decisions"]["up"] = false;
        this.botDecisionDetails["decisions"]["down"] = false;
        this.botDecisionDetails["decisions"]["left"] = false;
        this.botDecisionDetails["decisions"]["right"] = false;
        this.botDecisionDetails["decisions"]["sprint"] = false;
        this.botDecisionDetails["decisions"]["breaking_stride"] = false;

        this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = false;

        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["cancel_reload"] = false;

        this.botDecisionDetails["decisions"]["weapons"]["musket"]["toggling_bayonet_equip"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["musket"]["trying_to_stab"] = false;
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

        this.makeMovementDecisions();

        this.inventory.makeDecisions();

        // Make decisions foe held item
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }

    }

    /*
        Method Name: botDecisions
        Method Parameters: None
        Method Description: Makes bot decisions
        Method Return: void
    */
    botDecisions(){
        // Decide if you want to change state
        this.determineState();

        // Execute state decisions
        this.makeDecisionsBasedOnDecidedState();
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
        Method Name: getAction
        Method Parameters: None
        Method Description: Finds a stored action
        Method Return: void
    */
    getAction(){
        return this.botDecisionDetails["action"];
    }

    /*
        Method Name: setAction
        Method Parameters: 
            newActionName:
                Name of the new action
        Method Description: Sets the current stored action
        Method Return: void
    */
    setAction(newActionName){
        this.actionName = newActionName;
    }

    /*
        Method Name: cancelAction
        Method Parameters: None
        Method Description: Cancels the current action
        Method Return: void
    */
    cancelAction(){
        this.actionName = null;
    }

    /*
        Method Name: hasAction
        Method Parameters: None
        Method Description: Checks if there is a current action
        Method Return: boolean
    */
    hasAction(){
        return this.botDecisionDetails["action"] === null;
    }

    /*
        Method Name: makeDecisionsBasedOnDecidedState
        Method Parameters: None
        Method Description: Makes bot-level decisions
        Method Return: void
    */
    makeDecisionsBasedOnDecidedState(){
        let state = this.getState();
        if (state === "equip_a_weapon"){
            this.equipAWeapon();
        }else if (state === "searching_for_enemy"){
            this.searchForEnemy();
        }else if (state === "fighting_enemy"){
            this.makeFightingDecisions();
        }
    }

    /*
        Method Name: hasNoWeapons
        Method Parameters: None
        Method Description: Checks if the character has no weapons
        Method Return: boolean
    */
    hasNoWeapons(){
        let numberOfWeapons = this.getInventory().getNumberOfContents();
        return numberOfWeapons === 0;
    }

    /*
        Method Name: equipAWeapon
        Method Parameters: None
        Method Description: Equips a weapon
        Method Return: void
    */
    equipAWeapon(){
        if (this.hasAction() && this.getAction() === "switching_to_weapon"){
            return;
        }

        // Pick a weapon and set the decision for selected slot to get it
        this.setAction("switching_to_weapon");
        let inventory = this.getInventory();
        let numberOfWeapons = inventory.getNumberOfContents();

        // If we are holding the only weapon or there are no weapons
        if (numberOfWeapons === 0){ return; }
        if (numberOfWeapons === 1 && inventory.hasSelectedItem()){ return; }

        // Else if there is one weapon not equipped
        let inventoryList = inventory.getItems();
        if (numberOfWeapons === 1){
            for (let i = 0; i < inventoryList.length; i++){
                let item = inventoryList[i];
                if (item != null){
                    this.botDecisionDetails["decisions"]["select_slot"] = i;
                    return;
                }
            }
        }
    }

    /*
        Method Name: determineState
        Method Parameters: None
        Method Description: Determines what state the bot should be in
        Method Return: void
    */
    determineState(){
        let state = this.getState();
        if (state === "starting"){
            // when starting you just want to equip a weapon
            this.changeToState("equip_a_weapon");
        }else if (state === "equip_a_weapon"){
            // If done equipping a weapon then start looking for the enemy
            if (this.hasWeaponEquipped() || this.hasNoWeapons()){
                if (!this.getDataToReactTo("certain_of_enemy_location")){
                    this.changeToState("searching_for_enemy");
                }else{
                    this.changeToState("fighting_enemy");
                }
            }else{
                this.equipAWeapon();
            }
        }else if (state === "searching_for_enemy"){
            if (this.getDataToReactTo("certain_of_enemy_location")){
                this.changeToState("fighting_enemy");
            }
        }else if (state === "fighting_enemy"){
            if (!this.getDataToReactTo("certain_of_enemy_location")){
                this.changeToState("searching_for_enemy");
            }
        }
    }

    /*
        Method Name: hasWeaponEquipped
        Method Parameters: None
        Method Description: Checks if the character has a weapon equipped
        Method Return: boolean
    */
    hasWeaponEquipped(){
        if (!this.getInventory().hasSelectedItem()){ return false; }
        let equippedItem = this.getInventory().getSelectedItem();
        return (equippedItem instanceof Gun) || (equippedItem instanceof MeleeWeapon);
    }

    /*
        Method Name: getState
        Method Parameters: None
        Method Description: Gets the current state
        Method Return: String
    */
    getState(){
        return this.botDecisionDetails["state"];
    }

    /*
        Method Name: changeToState
        Method Parameters: 
            newStateName:
                Name of the new state
        Method Description: Changes to a new state
        Method Return: void
    */
    changeToState(newStateName){
        this.botDecisionDetails["state"] = newStateName;

        this.setInitialConditions(newStateName);
    }

    /*
        Method Name: setInitialConditions
        Method Parameters: 
            newStateName:
                Name of the new state
        Method Description: Sets up a new state
        Method Return: void
    */
    setInitialConditions(newStateName){
        // Prepare the state data json object
        this.botDecisionDetails["state_data"] = {};
        if (newStateName === "searching_for_enemy"){
            this.prepareSearchingForEnemyState();
        }
    }

    /*
        Method Name: getStateData
        Method Parameters: None
        Method Description: Gets the stored state data
        Method Return: JSON usually but Variable
    */
    getStateData(){
        return this.botDecisionDetails["state_data"];
    }

    /*
        Method Name: prepareSearchingForEnemyState
        Method Parameters: None
        Method Description: Prepares the searching for enemy state
        Method Return: void
    */
    prepareSearchingForEnemyState(){
        let stateDataJSON = this.getStateData();
        stateDataJSON["route"] = null;
        stateDataJSON["last_checked_enemy_x"] = null;
        stateDataJSON["last_checked_enemy_y"] = null;
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
        Method Name: considerChangingWeapons
        Method Parameters: None
        Method Description: Consider changing weapons
        Method Return: void
    */
    considerChangingWeapons(){
        let heldWeapon = this.getInventory().getSelectedItem();

        // If there is no held weapon assme I have none
        if (heldWeapon === null){
            return;
        }

        // I should ALWAYS be holding a weapon
        if (heldWeapon === null || !(heldWeapon instanceof Weapon)){
            throw new Error("Failed to find weapon.");
        }

        let i = 0;

        let foundSwordIndex = null;
        let loadedGunIndex = null;
        let unloadedGunIndex = null;
        let musketIndex = null;

        // Search through the inventory
        for (let item of this.getInventory().getItems()){
            let currentIndex = i++;
            if (item === null){ continue; }
            if (item instanceof Gun){
                let otherGun = item;
                if (otherGun.isLoaded()){
                    // If none so far then save the index
                    if (loadedGunIndex != null){
                        loadedGunIndex = currentIndex;
                    }
                }else{
                    // If none so far then save the index
                    if (unloadedGunIndex != null){
                        unloadedGunIndex = currentIndex;
                    }
                }
                if (otherGun instanceof Musket){
                    musketIndex = currentIndex;
                }
            }
            // If no swords have been found then record this
            else if (item instanceof Sword && foundSwordIndex === null){
                foundSwordIndex = currentIndex;
            }
        }

        let enemyLocation = this.getDataToReactTo("enemy_location");
        // Always will be known given this is during fighting
        let enemyTileX = enemyLocation["tile_x"];
        let enemyTileY = enemyLocation["tile_y"];
        let euclidianDistanceToEnemy = calculateEuclideanDistance(this.getTileX(), this.getTileY(), enemyTileX, enemyTileY);
        let enemySwingingAtMe = euclidianDistanceToEnemy < WTL_GAME_DATA["duel"]["ai"]["estimated_melee_distance"] && this.getDataToReactTo("can_see_enemy") && this.getDataToReactTo("enemy_holding_a_sword") && this.getDataToReactTo("enemy_swinging_a_sword");

        // If the held weapon is a gun
        if (heldWeapon instanceof Gun){
            let myHeldGun = heldWeapon;
            // If my held gun isn't loaded try to find a loaded gun
            if (!myHeldGun.isLoaded()){
                // if I have a loaded gun somewhere then get it
                if (loadedGunIndex != null){
                    this.botDecisionDetails["decisions"]["select_slot"] = currentIndex;
                    // Indicate changing weapon
                    return true;
                }

                
                if (myHeldGun instanceof Pistol && foundSwordIndex != null){
                    // So no loaded guns but I found a sword
                    // If we are very close to enemy then switch to sword
                    if (euclidianDistanceToEnemy < WTL_GAME_DATA["duel"]["ai"]["estimated_melee_distance"]){
                        this.botDecisionDetails["decisions"]["select_slot"] = foundSwordIndex;
                        return true;
                    }
                }
                // Else, if its a musket
                else if (myHeldGun instanceof Musket && foundSwordIndex != null){
                    // If we are very close to enemy then consider switching to sword
                    if (euclidianDistanceToEnemy < WTL_GAME_DATA["duel"]["ai"]["estimated_melee_distance"]){
                        let enemyHoldingASword = this.getDataToReactTo("can_see_enemy") && this.getDataToReactTo("enemy_holding_a_sword");
                        if (enemyHoldingASword){
                            let myMusketDamage = WTL_GAME_DATA["duel"]["musket_stab_damage"];
                            let estimatedEnemyHealth = this.hasDataToReactTo("enemy_health") ? 1 : this.getDataToReactTo("enemy_health");
                            // if my musket can swing kill the enemy in one hit
                            if (estimatedEnemyHealth < myMusketDamage){
                                let myMusketStabTime = WTL_GAME_DATA["duel"]["stab_time_ms"];
                                let enemySwordModel = this.getDataToReactTo("enemy_sword_model");
                                let enemySwordDamage = WTL_GAME_DATA["sword_data"]["swords"][enemySwordModel]["swing_damage"];
                                let enemySwordSwingTime = WTL_GAME_DATA["sword_data"]["swords"][enemySwordModel]["swing_time_ms"];
                                let enemySwordSwingCooldown = WTL_GAME_DATA["sword_data"]["swords"][enemySwordModel]["swing_cooldown_ms"];
                                let totalDamageDoneByEnemyBeforeDeath = 0;
                                let time = enemySwordSwingTime;
                                while (time < myMusketStabTime){
                                    totalDamageDoneByEnemyBeforeDeath += enemySwordDamage;
                                    time += enemySwordSwingCooldown;
                                    time += enemySwordSwingTime;
                                }
                                // If they could kill me before I could kill them using the musket then its useless
                                if (totalDamageDoneByEnemyBeforeDeath >= this.getHealth()){
                                    this.botDecisionDetails["decisions"]["select_slot"] = foundSwordIndex;
                                    return true;
                                }
                                // Else keep the musket
                            }
                        }
                    }
                    
                }


                // Else just stick to the weapon
            }

            // Else we have a loaded gun

            // If the enemy is swinging their sword NEAR me and I have a sword to switch to then do so
            if (foundSwordIndex != null && enemySwingingAtMe){
                this.botDecisionDetails["decisions"]["select_slot"] = foundSwordIndex
                return true;
            }
        }
        // If I'm holding a sword
        else if (heldWeapon instanceof Sword){
            let myHeldSword = heldWeapon;
            let hasLoadedGun = loadedGunIndex != null;

            // if the enemy is swinging at me then keep my weapon
            if (enemySwingingAtMe){
                return false;
            }
            
            // If I have a loaded gun I can switch to and they aren't swinging at me right now then better to shoot them
            if (hasLoadedGun){
                this.botDecisionDetails["decisions"]["select_slot"] = loadedGunIndex;
                return true;
            }
            // Otherwise an unloaded musket may be good
            else if (musketIndex != null){
                let myMusketDamage = WTL_GAME_DATA["duel"]["musket_stab_damage"];
                let estimatedEnemyHealth = this.hasDataToReactTo("enemy_health") ? 1 : this.getDataToReactTo("enemy_health");
                // if my musket can swing kill the enemy in one hit
                if (estimatedEnemyHealth < myMusketDamage){
                    let myMusketStabTime = WTL_GAME_DATA["duel"]["stab_time_ms"];
                    let totalDamageDoneByEnemyBeforeDeath = 0;
                    // If enemy has a sword then calculate how much damage it can do but I kill the enemy
                    if (this.getDataToReactTo("can_see_enemy") && this.getDataToReactTo("enemy_holding_a_sword")){
                        let enemySwordModel = this.getDataToReactTo("enemy_sword_model");
                        let enemySwordDamage = WTL_GAME_DATA["sword_data"]["swords"][enemySwordModel]["swing_damage"];
                        let enemySwordSwingTime = WTL_GAME_DATA["sword_data"]["swords"][enemySwordModel]["swing_time_ms"];
                        let enemySwordSwingCooldown = WTL_GAME_DATA["sword_data"]["swords"][enemySwordModel]["swing_cooldown_ms"];
                        let time = enemySwordSwingTime;
                        while (time < myMusketStabTime){
                            totalDamageDoneByEnemyBeforeDeath += enemySwordDamage;
                            time += enemySwordSwingCooldown;
                            time += enemySwordSwingTime;
                        }
                    }
                    // If I would kill them first with the musket then go and attack
                    if (totalDamageDoneByEnemyBeforeDeath < this.getHealth()){
                        this.botDecisionDetails["decisions"]["select_slot"] = musketIndex;
                        return true;
                    }
                    // Else keep the sword
                }
            }
            // Else no loaded gun and I'm not being swung at
            else{   
                // If enemy is out of melee range then switch to unloaded gun
                if (euclidianDistanceToEnemy > WTL_GAME_DATA["duel"]["ai"]["estimated_melee_distance"]){
                    this.botDecisionDetails["decisions"]["select_slot"] = unloadedGunIndex;
                }
                // Otherwise close by keep the sword
                else{
                    return false;
                }
            }
        }

        // When in doubt, don't change weapons
        return false;
    }

    /*
        Method Name: makeFightingDecisions
        Method Parameters: None
        Method Description: Makes decisions during a fight
        Method Return: void
    */
    makeFightingDecisions(){
        let equippedItem = this.getInventory().getSelectedItem();

        // Change weapon if needed
        let changingWeapon = this.considerChangingWeapons();
        if (changingWeapon){
            return;
        }

        // Determine what to do with held weapon
        if (equippedItem instanceof Sword){
            this.makeSwordFightingDecisions();
        }else if (equippedItem instanceof Pistol){
            this.makePistolFightingDecisions();
        }else if (equippedItem instanceof Musket){
            this.makeMusketFightingDecisions();
        }else{
            this.makeUnarmedDecisions();
        }
    }

    /*
        Method Name: considerReloadingWhileEnemyIsGone
        Method Parameters: None
        Method Description: Consider reloading because the enemy cannot be found
        Method Return: boolean, true -> need to reload, false -> no need to reload
    */
    considerReloadingWhileEnemyIsGone(){
        // Return true -> Don't do anything I'm reloading false -> I'm not reloading 
        let numGuns = 0;
        let numGunsNeedingAReload = 0;
        let firstUnloadedGunIndex = null;
        let hasGunReloading = false;
        // Loop through hotbar
        let i = 0;
        for (let item of this.getInventory().getItems()){
            i++;
            if (item === null){ continue; }
            if (item instanceof Gun){
                let gun = item;
                if (!gun.isLoaded()){
                    numGunsNeedingAReload += 1;
                    // Set first gun instead if not set
                    if (firstUnloadedGunIndex === null){
                        firstUnloadedGunIndex = i - 1;
                    }

                    // Update has gun reloading
                    hasGunReloading = hasGunReloading || gun.isReloading();
                }
                numGuns++;
            }
        }

        // If no guns then do nothing
        if (numGuns === 0 || numGunsNeedingAReload === 0){
            return false;
        }
        // if it is reloading a gun then skip
        else if (hasGunReloading){
            return true;
        }
        
        let equippedItem = this.getInventory().getSelectedItem();

        // If I have an unloaded gun then get ready to reload
        if ((equippedItem instanceof Gun) && !equippedItem.isLoaded()){
            // If I have the enemy's last position then reload based on it
            if (this.hasDataToReactTo("enemy_location")){
                let enemyLocation = this.getDataToReactTo("enemy_location");
                let enemyTileX = enemyLocation["tile_x"];
                let enemyTileY = enemyLocation["tile_y"];
                this.goToReloadPositionAndReload(enemyTileX, enemyTileY);
            }
            // Otherwise no idea where enemy is
            else{
                // Start reloading on the spot
                this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"] = true;
            }
        }
        // Else switch to an unloaded gun
        else{
            this.botDecisionDetails["decisions"]["select_slot"] = firstUnloadedGunIndex;
        }
        return true;
    }

    /*
        Method Name: searchForEnemy
        Method Parameters: None
        Method Description: Search for the enemy
        Method Return: void
    */
    searchForEnemy(){
        let stateDataJSON = this.getStateData();
        // Check if you can see the enemy otherwise move around
        let route = stateDataJSON["route"];

        let advisableToReloadRatherThanFight = this.considerReloadingWhileEnemyIsGone();

        // If it is advisable to reload rather than to fight at this moment then do so
        if (advisableToReloadRatherThanFight){
            return;
        }

        // If there is an enemy location that may be worth checking
        if (this.hasDataToReactTo("enemy_location")){
            let enemyLocation = this.getDataToReactTo("enemy_location");
            let enemyTileX = enemyLocation["tile_x"];
            let enemyTileY = enemyLocation["tile_y"];
            // If this location hasn't been checked 
            if (enemyTileX != stateDataJSON["last_checked_enemy_x"] || enemyTileY != stateDataJSON["last_checked_enemy_y"]){
                stateDataJSON["last_checked_enemy_x"] = enemyTileX;
                stateDataJSON["last_checked_enemy_y"] = enemyTileY;
                let newRoute = this.generateShortestEvasiveRouteToPoint(enemyTileX, enemyTileY);
                if (newRoute != null){
                    route = newRoute;
                    stateDataJSON["route"] = route;
                }
            }
        }

        // if not route (or at an end) -> make one
        // Note: Assume route is not empty
        if (route === null || (route.getLastTile()["tile_x"] === this.getTileX() && route.getLastTile()["tile_y"] === this.getTileY())){
            route = this.generateRouteToSearchForEnemy();
            stateDataJSON["route"] = route;
        }

        let updateFromMoveDecisions = (moveObj) => {
            return this.updateFromRouteDecision(moveObj)
        }
        // Move according to the route
        updateFromMoveDecisions(route.getDecisionAt(this.getTileX(), this.getTileY()));

        // Consider sprinting
        this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["enemy_search_min_stamina_preference"]);
    }

    /*
        Method Name: getMaxSearchPathLength
        Method Parameters: None
        Method Description: Get the max search path length
        Method Return: int
    */
    getMaxSearchPathLength(){
        return WTL_GAME_DATA["duel"]["ai"]["search_path_max_length"];
        //return Math.ceil(this.getGamemode().getEnemyVisibilityDistance() / Math.sqrt(2)); // Basically the idea is you have a 1 / 1 / sqrt(2) triangle and you add up the two 1s to get the search range
        // return Math.ceil(Math.sqrt(2 * Math.pow(WTL_GAME_DATA["duel"]["area_size"], 2)));
    }

    /*
        Method Name: generateRouteToSearchForEnemy
        Method Parameters: None
        Method Description: Generates a route to search for the enemy
        Method Return: Route
    */
    generateRouteToSearchForEnemy(){
        let tilesToEndAt = this.exploreAvailableTiles(this.getTileX(), this.getTileY());
        // If no tiles to move to (including current)
        if (tilesToEndAt.length === 0){
            throw new Error("Unable to generate paths.")
        } 

        let chosenIndex = this.getRandom().getIntInRangeInclusive(0, tilesToEndAt.length-1);
        let tileChosen = tilesToEndAt[chosenIndex];
        return Route.fromPath(tileChosen["shortest_path"]);
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
        Method Name: makeInventoryDecisions
        Method Parameters: None
        Method Description: Makes decisions in the inventory
        Method Return: void
    */
    makeInventoryDecisions(){
        // Reset
        this.amendDecisions({
            "select_slot": this.inventory.getSelectedSlot(),
        });
        let newSlot = this.botDecisionDetails["decisions"]["select_slot"];
        if (newSlot === null){ return; }
        if (newSlot === this.selectedSlot){ return; }

        this.amendDecisions({
            "select_slot": newSlot
        });
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

        let samplePrecision = toRadians(WTL_GAME_DATA["duel"]["ai"]["aiming_precision_degrees"]);

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
        Method Name: getRandomEventManager
        Method Parameters: None
        Method Description: Getter
        Method Return: RandomEventmManager
    */
    getRandomEventManager(){
        return this.randomEventManager;
    }

    /*
        Method Name: makePistolFightingDecisions
        Method Parameters: None
        Method Description: Makes decisions on how to fight with the pistol
        Method Return: void
    */
    makePistolFightingDecisions(){
        // No decisions to be made when not at rest
        if (this.isBetweenTiles()){ return; }

        // Nothing to do if you can't see the enemy
        if (!this.hasDataToReactTo("enemy_location")){ return; }

        // Assume if currently aiming I'd like to continue unless disabled elsewhere
        let myGun = this.getInventory().getSelectedItem();

        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = myGun.isAiming();

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
            if (myGun.isAiming()){
                if (canHitEnemyIfIAimAndShoot){
                    // Turn to proper direction
                    if (this.getFacingDirection() != bestVisualDirection){
                        this.botDecisionDetails["decisions"][bestMovementDirection] = true;
                        // Just turning not moving
                        this.botDecisionDetails["decisions"]["breaking_stride"] = true;
                    }

                    // Allow bot to estimate the magnitude of the sway offset
                    let mySwayOffsetMagnitude;
                    if (this.hasDataToReactTo("sway_magnitude")){
                        mySwayOffsetMagnitude = this.getDataToReactTo("sway_magnitude");
                    }else{
                        // If no data available -> assume the worst
                        mySwayOffsetMagnitude = myGun.getSwayMaxAngleRAD();
                    }
                    let myChanceOfHittingAShot = calculateAngleRangeOverlapProportion(speculationResult["right_angle"], speculationResult["left_angle"], speculationResult["best_angle"] - mySwayOffsetMagnitude/2, speculationResult["best_angle"] + mySwayOffsetMagnitude/2);

                    let shotAConstant = WTL_GAME_DATA["duel"]["ai"]["shot_take_function_a_constant"];
                    let shotBConstant = WTL_GAME_DATA["duel"]["ai"]["shot_take_function_b_constant"];
                    let secondsToShootWithThisChance = getDeclining1OverXOf(shotAConstant, shotBConstant, myChanceOfHittingAShot);
                    secondsToShootWithThisChance = Math.max(secondsToShootWithThisChance, 0);

                    // Convert to ms and acknowledge cap
                    let msToShootWithThisChance = Math.min(secondsToShootWithThisChance * 1000, WTL_GAME_DATA["duel"]["ai"]["max_expected_ms_to_hold_a_shot"]);

                    let decideToShoot = this.getRandomEventManager().getResultExpectedMS(msToShootWithThisChance);
                    this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] = decideToShoot;
                }else{
                    // I am aiming but I can't hit so I will stop
                    this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = this.getRandomEventManager().getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["stop_aiming_no_target_ms"]);
                }
            }
            // Else I am not aiming currently
            else{

                /*
                    Quick note
                    So I have a gun
                    either I am standing and shooting OR I am moving to a better position OR I am reloading
                    So check here if I am moving 
                */
                let stateDataJSON = this.getStateData();
                let movingToBetterPosition = objectHasKey(stateDataJSON, "current_objective") && stateDataJSON["current_objective"] === "move_to_shooting_position";
                // Next ones are only calculated conditionally
                let betterPositionIsBasedOnCurrentData = movingToBetterPosition && stateDataJSON["relevant_enemy_tile_x"] === enemyTileX && stateDataJSON["relevant_enemy_tile_y"] === enemyTileY;
                let routeLastTile = betterPositionIsBasedOnCurrentData ? (stateDataJSON["route"].getLastTile()) : null;
                let notAtEndOfRoute = betterPositionIsBasedOnCurrentData && (routeLastTile["tile_x"] != this.getTileX() || routeLastTile["tile_y"] != this.getTileY());

                // If our current objective is to move to a better shooting position
                if (movingToBetterPosition && betterPositionIsBasedOnCurrentData && notAtEndOfRoute){
                    this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
                    // Consider sprinting
                    this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_shot_stamina_preference"]);
                }
                // We are not currently persuing a pre-determined route
                else{
                    /*
                        - Get a weighted value map of shooting spots (say maybe X path distance from me and X path distance from victim)
                            - Linear combination of:
                                - Route Distance from me (negative)
                                - Route Distance from enemy (positive)
                                - Distance from enemy (positive)
                                - Angle range to hit enemy (positive)
                                - Route distance to nearest single cover that is outside of enemy view range (negative)
                                - Route distance to nearest multicover (negative)
                                - Route distance to nearest physical cover (like a rock to hide behind) (negative)
                        - Select best tile
                            - If my tile -> stay and start aiming
                            - If not my tile ->
                                - Add apply a random function to select (like in Skirmish choosing a move)
                                    -> Move to new tile
                    */
                    //let b4 = Date.now();
                    let newTile;

                    let myTileX = this.getTileX();
                    let myTileY = this.getTileY();

                    let needToCalculate = true;

                    // Check if we saved data
                    if (this.temporaryOperatingData.has("tile_to_stand_and_shoot_from")){
                        let dataJSON = this.temporaryOperatingData.get("tile_to_stand_and_shoot_from");

                        // If the parameters are the same now as the previously calculated value
                        let enemyLocationIsTheSame = dataJSON["enemy_tile_x"] === enemyTileX && dataJSON["enemy_tile_y"] === enemyTileY;
                        if (enemyLocationIsTheSame && dataJSON["tile_x"] === myTileX && dataJSON["tile_y"] === myTileY){
                            newTile = dataJSON["tile"];
                            if (newTile === undefined){ debugger; }
                            // If we can_hit with the current tile then don't bother changing
                            needToCalculate = false;
                        }
                        // If the enemy hasn't moved and the saved tile can hit the enemy
                        else if (enemyLocationIsTheSame && dataJSON["can_hit"]){
                            newTile = dataJSON["tile"];
                            needToCalculate = false;
                        }
                    }

                    // if I need to calculate a new tile to stand on
                    if (needToCalculate){
                        let ttsfData = this.determineTileToShootFrom(enemyTileX, enemyTileY, myGun);
                        let canHit = ttsfData["can_hit"];
                        newTile = ttsfData["new_tile"];
                        if (newTile === undefined){ debugger; }
                        // update saved data
                        let dataJSON = {
                            "tile_x": myTileX,
                            "tile_y": myTileY,
                            "enemy_tile_x": enemyTileX,
                            "enemy_tile_y": enemyTileY,
                            "can_hit": canHit,
                            "tile": newTile
                        }
                        this.temporaryOperatingData.set("tile_to_stand_and_shoot_from", dataJSON);
                    }
                    
                    let newTileIsTheSame = newTile["tile_x"] === myTileX && newTile["tile_y"] === myTileY;
                    // I can hit the enemy if I start aiming (If new tile is the same then I should)
                    if (canHitEnemyIfIAimAndShoot){
                        // Turn to proper direction
                        if (this.getFacingDirection() != bestVisualDirection){
                            this.botDecisionDetails["decisions"][bestMovementDirection] = true;
                            // Just turning not moving
                            this.botDecisionDetails["decisions"]["breaking_stride"] = true;
                        }

                        // Set angle
                        
                        this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = speculationResult["best_angle"];
                        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = this.getRandomEventManager().getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["good_shot_try_to_aim_delay_ms"]);
                    }
                    // Move to new tile
                    else if (!newTileIsTheSame){
                        // Create a new route
                        stateDataJSON["current_objective"] = "move_to_shooting_position";
                        stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                        stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                        stateDataJSON["route"] = Route.fromPath(newTile["shortest_path"]);

                        // If this newTile was generated from a different start tile that doesn't include my current tile then generate a new route
                        if (!stateDataJSON["route"].includesTile(myTileX, myTileY)){
                            stateDataJSON["route"] = this.generateShortestEvasiveRouteToPoint(newTile["tile_x"], newTile["tile_y"]);
                        }

                        // Move based on this new route
                        this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(myTileX, myTileY));
                        // Consider sprinting
                        this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_shot_stamina_preference"]);
                    }else if (this.getDataToReactTo("enemy_moving")){
                        // If enemy is moving then it's ok that I can't hit them because I will be able to after they hit the next tile or I will at least recompute
                    }else{
                        throw new Error("Bad tile selected to shoot from.");
                    }
                }
            }

        }
        // Gun is NOT loaded
        else{
            // I can just use this function it will move me if circumstances change while reloading

            // Note: Reloading is canceled by movement (and weapon switching) so don't need to use "cancel_reload"
            this.goToReloadPositionAndReload(enemyTileX, enemyTileY);
        }
    }

    /*
        Method Name: makeMusketFightingDecisions
        Method Parameters: None
        Method Description: Makes decisions for fighting with the musket
        Method Return: void
    */
    makeMusketFightingDecisions(){
        // Nothing to do if you can't see the enemy
        if (!this.hasDataToReactTo("enemy_location")){ return; }

        // Assume if currently aiming I'd like to continue unless disabled elsewhere
        let myMusket = this.getInventory().getSelectedItem();

        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = myMusket.isAiming();
        
        // Make sure bayonet is eqipped
        this.botDecisionDetails["decisions"]["weapons"]["musket"]["toggling_bayonet_equip"] = !myMusket.hasBayonetEquipped();

        let scene = this.getScene();

        let enemyInterpolatedTickCenterX = this.getDataToReactTo("enemy_interpolated_tick_center_x");
        let enemyInterpolatedTickCenterY = this.getDataToReactTo("enemy_interpolated_tick_center_y");
        let enemyLocation = this.getDataToReactTo("enemy_location");
        let enemyTileX = enemyLocation["tile_x"];
        let enemyTileY = enemyLocation["tile_y"];

        // Make decisions based on if my gun is loaded
        if (myMusket.isLoaded()){
            if (!this.isBetweenTiles()){
                // Check if I can hit the enemy were I to aim (WITHOUT MOVING)
                let angleToEnemyTileCenter = displacementToRadians(enemyTileX - this.getTileX(), enemyTileY - this.getTileY());
                let bestVisualDirection = angleToBestFaceDirection(angleToEnemyTileCenter);
                let bestMovementDirection = getMovementDirectionOf(bestVisualDirection);
                let playerLeftX = scene.getXOfTile(this.getTileX());
                let playerTopY = scene.getYOfTile(this.getTileY());
                let pos = myMusket.getSimulatedGunEndPosition(playerLeftX, playerTopY, bestVisualDirection, angleToEnemyTileCenter);
                let gunEndX = pos["x"];
                let gunEndY = pos["y"];
                let speculationResult = this.speculateOnHittingEnemy(myMusket.getBulletRange(), enemyInterpolatedTickCenterX, enemyInterpolatedTickCenterY, gunEndX, gunEndY, bestVisualDirection);
                let canHitEnemyIfIAimAndShoot = speculationResult["can_hit"];


                // If I am aiming
                if (myMusket.isAiming()){
                    if (canHitEnemyIfIAimAndShoot){
                        // Turn to proper direction
                        if (this.getFacingDirection() != bestVisualDirection){
                            this.botDecisionDetails["decisions"][bestMovementDirection] = true;
                            // Just turning not moving
                            this.botDecisionDetails["decisions"]["breaking_stride"] = true;
                        }

                        // Allow bot to see the magnitude of current offset
                        let mySwayOffsetMagnitude = Math.abs(myMusket.getCurrentAngleOffsetRAD());
                        let myChanceOfHittingAShot = calculateAngleRangeOverlapProportion(speculationResult["right_angle"], speculationResult["left_angle"], speculationResult["best_angle"] - mySwayOffsetMagnitude/2, speculationResult["best_angle"] + mySwayOffsetMagnitude/2);
                        let shotAConstant = WTL_GAME_DATA["duel"]["ai"]["shot_take_function_a_constant"];
                        let shotBConstant = WTL_GAME_DATA["duel"]["ai"]["shot_take_function_b_constant"];
                        let secondsToShootWithThisChance = getDeclining1OverXOf(shotAConstant, shotBConstant, myChanceOfHittingAShot);
                        // Convert to ms and acknowledge cap
                        let msToShootWithThisChance = Math.min(secondsToShootWithThisChance * 1000, WTL_GAME_DATA["duel"]["ai"]["max_expected_ms_to_hold_a_shot"]);

                        let decideToShoot = this.getRandomEventManager().getResultExpectedMS(msToShootWithThisChance);
                        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] = decideToShoot;
                    }else{
                        // I am aiming but I can't hit so I will stop
                        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = this.getRandomEventManager().getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["stop_aiming_no_target_ms"]);
                    }
                }
                // Else I am not aiming currently
                else{

                    /*
                        Quick note
                        So I have a gun
                        either I am standing and shooting OR I am moving to a better position OR I am reloading
                        So check here if I am moving 
                    */
                    let stateDataJSON = this.getStateData();
                    let movingToBetterPosition = objectHasKey(stateDataJSON, "current_objective") && stateDataJSON["current_objective"] === "move_to_shooting_position";
                    // Next ones are only calculated conditionally
                    let betterPositionIsBasedOnCurrentData = movingToBetterPosition && stateDataJSON["relevant_enemy_tile_x"] === enemyTileX && stateDataJSON["relevant_enemy_tile_y"] === enemyTileY;
                    let routeLastTile = betterPositionIsBasedOnCurrentData ? (stateDataJSON["route"].getLastTile()) : null;
                    let notAtEndOfRoute = betterPositionIsBasedOnCurrentData && (routeLastTile["tile_x"] != this.getTileX() || routeLastTile["tile_y"] != this.getTileY());

                    // If our current objective is to move to a better shooting position
                    if (movingToBetterPosition && betterPositionIsBasedOnCurrentData && notAtEndOfRoute){
                        this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
                        // Consider sprinting
                        this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_shot_stamina_preference"]);
                    }
                    // We are not currently persuing a pre-determined route
                    else{
                        /*
                            - Get a weighted value map of shooting spots (say maybe X path distance from me and X path distance from victim)
                                - Linear combination of:
                                    - Route Distance from me (negative)
                                    - Route Distance from enemy (positive)
                                    - Distance from enemy (positive)
                                    - Angle range to hit enemy (positive)
                                    - Route distance to nearest single cover that is outside of enemy view range (negative)
                                    - Route distance to nearest multicover (negative)
                                    - Route distance to nearest physical cover (like a rock to hide behind) (negative)
                            - Select best tile
                                - If my tile -> stay and start aiming
                                - If not my tile ->
                                    - Add apply a random function to select (like in Skirmish choosing a move)
                                        -> Move to new tile
                        */
                        //let b4 = Date.now();

                        let newTile;

                        let myTileX = this.getTileX();
                        let myTileY = this.getTileY();

                        let needToCalculate = true;

                        // Check if we saved data
                        if (this.temporaryOperatingData.has("tile_to_stand_and_shoot_from")){
                            let dataJSON = this.temporaryOperatingData.get("tile_to_stand_and_shoot_from");

                            // If the parameters are the same now as the previously calculated value
                            let enemyLocationIsTheSame = dataJSON["enemy_tile_x"] === enemyTileX && dataJSON["enemy_tile_y"] === enemyTileY;
                            if (enemyLocationIsTheSame && dataJSON["tile_x"] === myTileX && dataJSON["tile_y"] === myTileY){
                                newTile = dataJSON["tile"];
                                if (newTile === undefined){ debugger; }
                                // If we can_hit with the current tile then don't bother changing
                                needToCalculate = false;
                            }
                            // If the enemy hasn't moved and the saved tile can hit the enemy
                            else if (enemyLocationIsTheSame && dataJSON["can_hit"]){
                                newTile = dataJSON["tile"];
                                needToCalculate = false;
                            }
                        }

                        // if I need to calculate a new tile to stand on
                        if (needToCalculate){
                            let ttsfData = this.determineTileToShootFrom(enemyTileX, enemyTileY, myMusket);
                            let canHit = ttsfData["can_hit"];
                            newTile = ttsfData["new_tile"];
                            if (newTile === undefined){ debugger; }
                            // update saved data
                            let dataJSON = {
                                "tile_x": myTileX,
                                "tile_y": myTileY,
                                "enemy_tile_x": enemyTileX,
                                "enemy_tile_y": enemyTileY,
                                "can_hit": canHit,
                                "tile": newTile
                            }
                            this.temporaryOperatingData.set("tile_to_stand_and_shoot_from", dataJSON);
                        }
                        
                        let newTileIsTheSame = newTile["tile_x"] === myTileX && newTile["tile_y"] === myTileY;
                        // I can hit the enemy if I start aiming (If new tile is the same then I should)
                        if (canHitEnemyIfIAimAndShoot){
                            // Turn to proper direction
                            if (this.getFacingDirection() != bestVisualDirection){
                                this.botDecisionDetails["decisions"][bestMovementDirection] = true;
                                // Just turning not moving
                                this.botDecisionDetails["decisions"]["breaking_stride"] = true;
                            }

                            // Set angle
                            
                            this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = speculationResult["best_angle"];
                            this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = this.getRandomEventManager().getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["good_shot_try_to_aim_delay_ms"]);
                        }
                        // Move to new tile
                        else if (!newTileIsTheSame){
                            // Create a new route
                            stateDataJSON["current_objective"] = "move_to_shooting_position";
                            stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                            stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                            stateDataJSON["route"] = Route.fromPath(newTile["shortest_path"]);

                            // If this newTile was generated from a different start tile that doesn't include my current tile then generate a new route
                            if (!stateDataJSON["route"].includesTile(myTileX, myTileY)){
                                stateDataJSON["route"] = this.generateShortestEvasiveRouteToPoint(newTile["tile_x"], newTile["tile_y"]);
                            }

                            // Move based on this new route
                            this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(myTileX, myTileY));
                            // Consider sprinting
                            this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_shot_stamina_preference"]);
                        }else if (this.getDataToReactTo("enemy_moving")){
                            // If enemy is moving then it's ok that I can't hit them because I will be able to after they hit the next tile or I will at least recompute
                        }else{
                            throw new Error("Bad tile selected to shoot from.");
                        }
                    }
                }
            }
        }
        // Gun is NOT loaded
        else{
            // I can just use this function it will move me if circumstances change while reloading

            if (!myMusket.hasBayonetEquipped()){
                if (!this.isBetweenTiles()){
                    // Note: Reloading is canceled by movement (and weapon switching) so don't need to use "cancel_reload"
                    this.goToReloadPositionAndReload(enemyTileX, enemyTileY);
                }
            }

            // Bayonet is equipped
            else{
                let stateDataJSON = this.getStateData();
                // If I am charging the enemy and have stamina then continue and the enemy is at the same position (but not stabbing right now)
                
                let executeChargePathing = stateDataJSON["current_objective"] === "charging_enemy" && this.staminaBar.hasStamina() && stateDataJSON["relevant_enemy_tile_x"] === enemyTileX && stateDataJSON["relevant_enemy_tile_y"] === enemyTileY && !myMusket.isStabbing();
                // If mid stab then continue in same direction
                if (myMusket.isStabbing()){
                    // Move in same direction
                    this.botDecisionDetails["decisions"][this.getFacingUDLRDirection()] = true;
                    // Consider sprinting
                    this.botDecisionDetails["decisions"]["sprint"] = true;
                }else if (!executeChargePathing && !this.isBetweenTiles()){
                    let routeToEnemy = this.generateShortestEvasiveRouteToPoint(enemyTileX, enemyTileY);
                    let routeDistanceToEnemy = routeToEnemy.getMovementDistance();
                    let realisticTilesTraveled = routeDistanceToEnemy - 1; // Don't need to quite reach them to stab them
                    /*
                        The plan:
                            1. Calculate if I can sprint all the way up to and stab given the route distance
                            IF YES
                                2. Set state data to "charging_enemy"
                                3. Follow path and sprint to enemy
                                4. If run out of stamina early (because the enemy moved) then cancel this plan
                                IF NOT
                                    5. Stab when close enough
                                    6. Set plan to going_to_reload
                    */
                    let pixelsToTravel = realisticTilesTraveled * WTL_GAME_DATA["general"]["tile_size"];
                    let msToMoveDistanceWhileSprinting = pixelsToTravel / (WTL_GAME_DATA["general"]["walk_speed"] * WTL_GAME_DATA["general"]["sprint_multiplier"]);
                    let currentStamina = this.staminaBar.getStamina();
                    let staminaUsedPerTile = WTL_GAME_DATA["human"]["stamina"]["sprinting_stamina_per_tile"];
                    let staminaUsedWhileSprintingDistance = realisticTilesTraveled * staminaUsedPerTile;
                    let staminaSum = currentStamina - staminaUsedWhileSprintingDistance;
                    
                    // If I am currently charging (but need to update location) OR the enemy is outside charge distance then decide to charge
                    let stabMakesSense = stateDataJSON["current_objective"] === "charging_enemy" || routeDistanceToEnemy >= WTL_GAME_DATA["duel"]["ai"]["min_stab_charge_distance"];
                    // If I can sprint to enemy and stab
                    let staminaIsSufficient = staminaSum > 0;

                    if (staminaIsSufficient && stabMakesSense){
                        stateDataJSON["current_objective"] = "charging_enemy";
                        stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                        stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                        stateDataJSON["route"] = routeToEnemy;
                        executeChargePathing = true;
                    }else{
                        // Note: Reloading is canceled by movement (and weapon switching) so don't need to use "cancel_reload"
                        this.goToReloadPositionAndReload(enemyTileX, enemyTileY);
                    }
                }

                if (executeChargePathing){
                    // Move based on this new route
                    let myTileX = this.getTileX();
                    let myTileY = this.getTileY();
                    this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(myTileX, myTileY));
                    // Consider sprinting
                    this.botDecisionDetails["decisions"]["sprint"] = true;
                    // Consider stabbing
                    let angleToEnemyCenter = displacementToRadians(enemyInterpolatedTickCenterX - this.getInterpolatedTickCenterX(), enemyInterpolatedTickCenterY - this.getInterpolatedTickCenterY());
                    let bestVisualDirection = angleToBestFaceDirection(angleToEnemyCenter);
                    let fairlyCloseToEnemy = calculateEuclideanDistance(enemyInterpolatedTickCenterX, enemyInterpolatedTickCenterY, this.getInterpolatedTickCenterX(), this.getInterpolatedTickCenterY()) < WTL_GAME_DATA["gun_data"][myMusket.getModel()]["stab_range"] * WTL_GAME_DATA["duel"]["ai"]["stab_range_close_multiplier"];
                    let facingAndCanHitEnemy = false;
                    // I am facing the enemy then calculate 
                    if (fairlyCloseToEnemy){
                        let stabRange = WTL_GAME_DATA["gun_data"][myMusket.getModel()]["stab_range"];
                        let stabTimeMS = WTL_GAME_DATA["gun_data"][myMusket.getModel()]["stab_time_ms"];
                        let enemyXVelocity = this.getDataToReactTo("enemy_x_velocity");
                        let enemyYVelocity = this.getDataToReactTo("enemy_y_velocity");
                        let enemyHalfWidth = this.getDataToReactTo("enemy_half_width");
                        let enemyHalfHeight = this.getDataToReactTo("enemy_half_height");
                        let enemyCXAtEndOfStab = enemyInterpolatedTickCenterX + enemyXVelocity * stabTimeMS/1000;
                        let enemyCYAtEndOfStab = enemyInterpolatedTickCenterY + enemyYVelocity * stabTimeMS/1000;
                        let myLXAtEndOfStab = this.getInterpolatedTickX() + this.getXVelocity() * stabTimeMS/1000;
                        let myTYAtEndOfStab = this.getInterpolatedTickY() + this.getYVelocity() * stabTimeMS/1000;
                        let pos = myMusket.getSimulatedGunEndPosition(myLXAtEndOfStab, myTYAtEndOfStab, this.getFacingDirection(), angleToEnemyCenter);
                        let endOfGunAtTimeX = pos["x"];
                        let endOfGunAtTimeY = pos["y"];
                        let targets = [{"center_x": enemyCXAtEndOfStab, "center_y": enemyCYAtEndOfStab, "half_width": enemyHalfWidth, "half_height": enemyHalfHeight, "entity": this.getEnemy()}];
                        let collision = this.getScene().findInstantCollisionForProjectileWithTargets(endOfGunAtTimeX, endOfGunAtTimeY, angleToEnemyCenter, stabRange, targets);
                        if (collision["collision_type"] === "entity"){
                            facingAndCanHitEnemy = true;
                        }
                    }
                    this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = true;
                    // If I'm fairly close to the enemy then aim at them
                    if (fairlyCloseToEnemy){
                        this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = angleToEnemyCenter;
                    }
                    // If I'm not close then just aim forward
                    else{
                        let udlrDirection = this.getFacingUDLRDirection();
                        if (udlrDirection === "up"){
                            this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = toRadians(90);
                        }else if (udlrDirection === "down"){
                            this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = toRadians(270);
                        }else if (udlrDirection === "left"){
                            this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = toRadians(180);
                        }else{
                            this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"] = toRadians(0);
                        }
                    }
                    let stabbing = facingAndCanHitEnemy;
                    if (stabbing){
                        // Stabbing
                        this.botDecisionDetails["decisions"]["weapons"]["musket"]["trying_to_stab"] = true;
                        // Reset objective
                        stateDataJSON["current_objective"] = null;
                    }
                }
            }
        }
    }

    /*
        Method Name: makeUnarmedDecisions
        Method Parameters: None
        Method Description: Makes decisions when you have no weapons
        Method Return: void
    */
    makeUnarmedDecisions(){
        let loc = this.getDataToReactTo("enemy_location");
        let enemyTileX = loc["tile_x"];
        let enemyTileY = loc["tile_y"];
        let stateDataJSON = this.getStateData();
        let runningAway = objectHasKey(stateDataJSON, "current_objective") && stateDataJSON["current_objective"] === "running_away";
        // Next ones are only calculated conditionally
        let runawayPositionIsBasedOnCurrentData = runningAway && stateDataJSON["relevant_enemy_tile_x"] === enemyTileX && stateDataJSON["relevant_enemy_tile_y"] === enemyTileY;
        let routeLastTile = runawayPositionIsBasedOnCurrentData ? (stateDataJSON["route"].getLastTile()) : null;
        let notAtEndOfRoute = runawayPositionIsBasedOnCurrentData && (routeLastTile["tile_x"] != this.getTileX() || routeLastTile["tile_y"] != this.getTileY());
        let routeIncludesCurrentTile = runawayPositionIsBasedOnCurrentData && stateDataJSON["route"].includesTile(this.getTileX(), this.getTileY());

        // If our current objective is to move to a reload position
        if (runningAway && runawayPositionIsBasedOnCurrentData && notAtEndOfRoute && routeIncludesCurrentTile){
            this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
            // Consider sprinting
            this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["running_away_stamina_preference"]);
        }
        // We are not currently persuing a pre-determined route
        else{
            let needToCalculate = true;
            let newTile;
            // Check if we saved data
            if (this.temporaryOperatingData.has("tile_to_runaway_to")){
                let dataJSON = this.temporaryOperatingData.get("tile_to_runaway_to");

                // If the parameters are the same now as the previously calculated value
                if (dataJSON["enemy_tile_x"] === enemyTileX && dataJSON["enemy_tile_y"]){
                    needToCalculate = false;
                    newTile = dataJSON["tile"];
                }
            }

            // if I need to calculate a new tile to stand on
            if (needToCalculate){
                newTile = this.determineTileToRunawayTo(enemyTileX, enemyTileY);
                // update saved data
                let dataJSON = {
                    "enemy_tile_x": enemyTileX,
                    "enemy_tile_y": enemyTileY,
                    "tile": newTile
                }
                this.temporaryOperatingData.set("tile_to_runaway_to", dataJSON);
            }

            let newTileIsTheSame = newTile["tile_x"] === this.getTileX() && newTile["tile_y"] === this.getTileY();

            // If new tile is not where we currently are then prepare to move there
            if (!newTileIsTheSame){
                // Create a new route
                stateDataJSON["current_objective"] = "running_away";
                stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                stateDataJSON["my_tile_x"] = this.getTileX();
                stateDataJSON["my_tile_y"] = this.getTileY();
                stateDataJSON["route"] = this.generateShortestEvasiveRouteToPoint(newTile["tile_x"], newTile["tile_y"]);
                
                // Move based on this new route
                this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
                // Consider sprinting
                this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["running_away_stamina_preference"]);
            }
        }
    }

    /*
        Method Name: goToReloadPositionAndReload
        Method Parameters: 
            enemyTileX:
                The tile x location of the enemy
            enemyTileY:
                The tile y location of the enemy
        Method Description: Goes to a location to reload and reloads
        Method Return: void
    */
    goToReloadPositionAndReload(enemyTileX, enemyTileY){
        let stateDataJSON = this.getStateData();
        let movingToReloadPosition = objectHasKey(stateDataJSON, "current_objective") && stateDataJSON["current_objective"] === "move_to_reload_position";
        // Next ones are only calculated conditionally
        let reloadPositionIsBasedOnCurrentData = movingToReloadPosition && stateDataJSON["relevant_enemy_tile_x"] === enemyTileX && stateDataJSON["relevant_enemy_tile_y"] === enemyTileY;
        let routeLastTile = reloadPositionIsBasedOnCurrentData ? (stateDataJSON["route"].getLastTile()) : null;
        let notAtEndOfRoute = reloadPositionIsBasedOnCurrentData && (routeLastTile["tile_x"] != this.getTileX() || routeLastTile["tile_y"] != this.getTileY());
        let routeIncludesCurrentTile = reloadPositionIsBasedOnCurrentData && stateDataJSON["route"].includesTile(this.getTileX(), this.getTileY());

        // If our current objective is to move to a reload position
        if (movingToReloadPosition && reloadPositionIsBasedOnCurrentData && notAtEndOfRoute && routeIncludesCurrentTile){
            this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
            // Consider sprinting
            this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_reload_stamina_preference"]);
        }
        // We are not currently persuing a pre-determined route
        else{
            let needToCalculate = true;
            let newTile;
            // Check if we saved data
            if (this.temporaryOperatingData.has("tile_to_reload_from")){
                let dataJSON = this.temporaryOperatingData.get("tile_to_reload_from");

                // If the parameters are the same now as the previously calculated value
                if (dataJSON["enemy_tile_x"] === enemyTileX && dataJSON["enemy_tile_y"] && dataJSON["my_tile_x"] === this.getTileX() && dataJSON["my_tile_y"] === this.getTileY()){
                    needToCalculate = false;
                    newTile = dataJSON["tile"];
                }
            }

            // if I need to calculate a new tile to stand on
            if (needToCalculate){
                newTile = this.determineTileToReloadFrom(enemyTileX, enemyTileY);
                // update saved data
                let dataJSON = {
                    "enemy_tile_x": enemyTileX,
                    "enemy_tile_y": enemyTileY,
                    "my_tile_x": this.getTileX(),
                    "my_tile_y": this.getTileY(),
                    "tile": newTile
                }
                this.temporaryOperatingData.set("tile_to_reload_from", dataJSON);
            }

            let newTileIsTheSame = newTile["tile_x"] === this.getTileX() && newTile["tile_y"] === this.getTileY();

            // If new tile is where we currently are then start reloading
            if (newTileIsTheSame){
                // Start reloading
                this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"] = true;
            }else{
                // Create a new route
                stateDataJSON["current_objective"] = "move_to_reload_position";
                stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                stateDataJSON["my_tile_x"] = this.getTileX();
                stateDataJSON["my_tile_y"] = this.getTileY();
                stateDataJSON["route"] = this.generateShortestEvasiveRouteToPoint(newTile["tile_x"], newTile["tile_y"]);

                // Move based on this new route
                this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
                // Consider sprinting
                this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_reload_stamina_preference"]);
            }
        }
    }

    /*
        Method Name: determineTilesToRunawayTo
        Method Parameters: 
            myTileX:
                My current Tile x Location
            myTileY:
                My current Tile y Location
            enemyTileX:
                The enemy current Tile x Location
            enemyTileY:
                The enemy current Tile y Location
        Method Description: Finds tiles that are worth running away to
        Method Return: List of JSON objects
    */
    determineTilesToRunawayTo(myTileX, myTileY, enemyTileX, enemyTileY){
        let allTiles = this.exploreAvailableTiles(myTileX, myTileY);

        // Combination scores
        let fromEnemyRouteMult = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["from_enemy_route_mult"]; // positive
        let fromEnemyMult = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["from_enemy_mult"]; // positive
        let canHitMult = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["can_hit_mult"]; // negative
        let angleRangeMult = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["angle_range_mult"]; // negative
        let inSingleCoverMult = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["in_single_cover_mult"]; // positive 
        let inMultiCoverMult = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["in_multi_cover_mult"]; // positive

        let scene = this.getScene();
        let enemyLeftX = scene.getXOfTile(enemyTileX);
        let enemyTopY = scene.getYOfTile(enemyTileY);
        let enemyCenterXAtTile = scene.getCenterXOfTile(enemyTileX);
        let enemyCenterYAtTile = scene.getCenterYOfTile(enemyTileY);

        let enemyVisibilityDistance = this.getGamemode().getEnemyVisibilityDistance();

        // Just use a sample gun
        let gun = new Musket("brown_bess", {"player": this});

        let singleCoverFunction = (tileX, tileY) => {
            let tileIsCover = scene.tileAtLocationHasAttribute(tileX, tileY, "single_cover");
            // Assume if I'm already in it then it was outside enemy visibility
            if (tileIsCover && tileX === myTileX && tileY === myTileY){
                return true;
            }
            return tileIsCover && calculateEuclideanDistance(enemyTileX, enemyTileY, tileX, tileY) > enemyVisibilityDistance;
        }

        let multiCoverFunction = (tileX, tileY) => {
            let tileIsCover = scene.tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
            // Return true if this is multi cover and the enemy IS NOT in it
            return tileIsCover && !(scene.tileAtLocationHasAttribute(enemyTileX, enemyTileY, "multi_cover") && scene.tilesInSameMultiCover(enemyTileX, enemyTileY, tileX, tileY));
        }

        // Score each tile
        for (let tile of allTiles){
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            let tileCenterX = scene.getCenterXOfTile(tileX);
            let tileCenterY = scene.getCenterYOfTile(tileY);

            let routeDistanceFromEnemy = this.generateShortestRouteFromPointToPoint(tileX, tileY, enemyTileX, enemyTileY).getMovementDistance();

            let realDistanceFromEnemy = calculateEuclideanDistance(enemyCenterXAtTile, enemyCenterYAtTile, tileCenterX, tileCenterY);

            let angleToTileCenter = displacementToRadians(tileX - enemyTileX, tileY - enemyTileY);
            // Note: Assuming they will face the estimated best way
            let visualDirectionToFace = angleToBestFaceDirection(angleToTileCenter);
            // Note: This is a fake gun (a brown bess)
            let pos = gun.getSimulatedGunEndPosition(enemyLeftX, enemyTopY, visualDirectionToFace, angleToTileCenter);
            let gunEndX = pos["x"];
            let gunEndY = pos["y"];
            let bulletRange = gun.getBulletRange();
            let speculation = this.speculateOnHittingEnemy(bulletRange, tileCenterX, tileCenterY, gunEndX, gunEndY, visualDirectionToFace);
            let angleRangeToHitEnemy = 0;
            let canBeHitByEnemyValue = 0;
            if (speculation["can_hit"]){
                canBeHitByEnemyValue = 1;
                angleRangeToHitEnemy = calculateAngleDiffCWRAD(speculation["left_angle"], speculation["right_angle"]);
            }

            // Single cover outside of enemy visibility
            let inSingleCoverValue = (singleCoverFunction(tileX, tileY) ? 1 : 0);

            let inMutliCoverValue = (multiCoverFunction(tileX, tileY) ? 1 : 0);
        
            let score = 0;

            // Add linear combination

            score += routeDistanceFromEnemy * fromEnemyRouteMult;
            score += realDistanceFromEnemy * fromEnemyMult;
            score += angleRangeToHitEnemy * angleRangeMult;
            score += canBeHitByEnemyValue * canHitMult;
            score += inSingleCoverValue * inSingleCoverMult;
            score += inMutliCoverValue * inMultiCoverMult;

            // Add the score
            tile["score"] = score;
        }
        return allTiles;
    }

    /*
        Method Name: determineTileToRunawayTo
        Method Parameters: 
            enemyTileX:
                The tile x loc of an enemy
            enemyTileY:
                The tile y loc of an enemy
        Method Description: Picks a tile to run away to
        Method Return: JSON object
    */
    determineTileToRunawayTo(enemyTileX, enemyTileY){
        let allTiles;
        let myTileX = this.getTileX();
        let myTileY = this.getTileY();

        let biggestToSmallestScore = (tile1, tile2) => {
            return tile2["score"] - tile1["score"];
        }

        let hasMyLocData = this.temporaryOperatingData.has("tiles_to_runaway_to");
        let hasEnemyLocData = false;
        let hasAllTilesStored = false;
        let myLocData;
        let enemyLocData;
        let allTilesStored;
        if (hasMyLocData){
            myLocData = this.temporaryOperatingData.get("tiles_to_runaway_to");
            hasEnemyLocData = myLocData.has(myTileX, myTileY);
            if (hasEnemyLocData){
                enemyLocData = myLocData.get(myTileX, myTileY);
                hasAllTilesStored = enemyLocData.has(enemyTileX, enemyTileY);
                if (hasAllTilesStored){
                    allTilesStored = enemyLocData.get(enemyTileX, enemyTileY);
                }
            }
        }
        // If it's saved then request this tile data
        if (hasAllTilesStored){
            if (allTilesStored === null){ debugger;}
            allTiles = allTilesStored;
        }else{
            allTiles = this.determineTilesToRunawayTo(myTileX, myTileY, enemyTileX, enemyTileY);
            if (allTiles === null){ debugger; }
            if (!hasMyLocData){
                myLocData = new NotSamXYCappedLengthSortedArrayList(100);
                this.temporaryOperatingData.set("tiles_to_runaway_to", myLocData);
            }
            if (!hasEnemyLocData){
                enemyLocData = new NotSamXYCappedLengthSortedArrayList(100);
                myLocData.set(myTileX, myTileY, enemyLocData);
            }

            // Save it
            // Sort scores big to small
            allTiles.sort(biggestToSmallestScore);
            enemyLocData.set(enemyTileX, enemyTileY, allTiles);
        }

        // Make it a copy
        allTiles = copyArray(allTiles);

        // Note it was saved sorted

        let chosenTile = allTiles[0];

        // If we are on the best one then return it
        if (chosenTile["tile_x"] === myTileX && chosenTile["tile_y"] === myTileY){
            return chosenTile;
        }

        // Else from current tile and pick randomly
        let xStart = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["tile_selection_x_start"];
        let xEnd = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["tile_selection_x_end"];
        let f = WTL_GAME_DATA["duel"]["ai"]["runaway_tile_selection"]["tile_selection_f"];
        let randomIndex = biasedIndexSelection(xStart, xEnd, f, allTiles.length, this.getRandom());
        chosenTile = allTiles[randomIndex];

        return chosenTile;
    }

    /*
        Method Name: determineTilesToReloadFrom
        Method Parameters: 
            myTileX:
                My current Tile x Location
            myTileY:
                My current Tile y Location
            enemyTileX:
                The enemy current Tile x Location
            enemyTileY:
                The enemy current Tile y Location
        Method Description: Comes up with a list of tiles that would be good to reload from
        Method Return: List of JSON Objects
    */
    determineTilesToReloadFrom(myTileX, myTileY, enemyTileX, enemyTileY){
        let allTiles = this.exploreAvailableTiles(this.getTileX(), this.getTileY());

        // Combination scores
        let fromEnemyRouteMult = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["from_enemy_route_mult"]; // positive
        let fromEnemyMult = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["from_enemy_mult"]; // positive
        let canHitMult = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["can_hit_mult"]; // negative
        let angleRangeMult = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["angle_range_mult"]; // negative
        let inSingleCoverMult = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["in_single_cover_mult"]; // positive 
        let inMultiCoverMult = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["in_multi_cover_mult"]; // positive
        let onTileMult = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["on_tile_multiplier"]; // positive

        let scene = this.getScene();
        let enemyLeftX = scene.getXOfTile(enemyTileX);
        let enemyTopY = scene.getYOfTile(enemyTileY);
        let enemyCenterXAtTile = scene.getCenterXOfTile(enemyTileX);
        let enemyCenterYAtTile = scene.getCenterYOfTile(enemyTileY);

        let enemyVisibilityDistance = this.getGamemode().getEnemyVisibilityDistance();

        let gun = this.getInventory().getSelectedItem();

        let singleCoverFunction = (tileX, tileY) => {
            let tileIsCover = scene.tileAtLocationHasAttribute(tileX, tileY, "single_cover");
            // Assume if I'm already in it then it was outside enemy visibility
            if (tileIsCover && tileX === myTileX && tileY === myTileY){
                return true;
            }
            return tileIsCover && calculateEuclideanDistance(enemyTileX, enemyTileY, tileX, tileY) > enemyVisibilityDistance;
        }

        let multiCoverFunction = (tileX, tileY) => {
            let tileIsCover = scene.tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
            // Return true if this is multi cover and the enemy IS NOT in it
            return tileIsCover && !(scene.tileAtLocationHasAttribute(enemyTileX, enemyTileY, "multi_cover") && scene.tilesInSameMultiCover(enemyTileX, enemyTileY, tileX, tileY));
        }

        // Score each tile
        for (let tile of allTiles){
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            let tileCenterX = scene.getCenterXOfTile(tileX);
            let tileCenterY = scene.getCenterYOfTile(tileY);

            let routeDistanceFromEnemy = this.generateShortestRouteFromPointToPoint(tileX, tileY, enemyTileX, enemyTileY).getMovementDistance();

            let realDistanceFromEnemy = calculateEuclideanDistance(enemyCenterXAtTile, enemyCenterYAtTile, tileCenterX, tileCenterY);

            let angleToTileCenter = displacementToRadians(tileX - enemyTileX, tileY - enemyTileY);
            // Note: Assuming they will face the estimated best way
            let visualDirectionToFace = angleToBestFaceDirection(angleToTileCenter);
            // Note: This is my gun not the enemy's gun so I'm assume they have the same one
            let pos = gun.getSimulatedGunEndPosition(enemyLeftX, enemyTopY, visualDirectionToFace, angleToTileCenter);
            let gunEndX = pos["x"];
            let gunEndY = pos["y"];
            let bulletRange = gun.getBulletRange();
            let speculation = this.speculateOnHittingEnemy(bulletRange, tileCenterX, tileCenterY, gunEndX, gunEndY, visualDirectionToFace);
            let angleRangeToHitEnemy = 0;
            let canBeHitByEnemyValue = 0;
            if (speculation["can_hit"]){
                canBeHitByEnemyValue = 1;
                angleRangeToHitEnemy = calculateAngleDiffCWRAD(speculation["left_angle"], speculation["right_angle"]);
            }

            // Single cover outside of enemy visibility
            let inSingleCoverValue = (singleCoverFunction(tileX, tileY) ? 1 : 0);

            let inMutliCoverValue = (multiCoverFunction(tileX, tileY) ? 1 : 0);
        
            let onTile = (this.getTileX() === tileX && this.getTileY() === tileY) ? 1 : 0;
        
            let score = 0;

            // Add linear combination

            score += routeDistanceFromEnemy * fromEnemyRouteMult;
            score += realDistanceFromEnemy * fromEnemyMult;
            score += angleRangeToHitEnemy * angleRangeMult;
            score += canBeHitByEnemyValue * canHitMult;
            score += inSingleCoverValue * inSingleCoverMult;
            score += inMutliCoverValue * inMultiCoverMult;
            score += onTile * onTileMult;

            // Add the score
            tile["score"] = score;
            if (isNaN(score)){
                debugger;
            }
        }

        return allTiles;
    }

    /*
        Method Name: determineTileToReloadFrom
        Method Parameters: 
            enemyTileX:
                The enemy current Tile x Location
            enemyTileY:
                The enemy current Tile y Location
        Method Description: Picks a tile to reload from 
        Method Return: JSON Object
    */
    determineTileToReloadFrom(enemyTileX, enemyTileY){
        let allTiles;
        let myTileX = this.getTileX();
        let myTileY = this.getTileY();

        let biggestToSmallestScore = (tile1, tile2) => {
            return tile2["score"] - tile1["score"];
        }

        let hasMyLocData = this.temporaryOperatingData.has("tiles_to_runaway_to");
        let hasEnemyLocData = false;
        let hasAllTilesStored = false;
        let myLocData;
        let enemyLocData;
        let allTilesStored;
        if (hasMyLocData){
            myLocData = this.temporaryOperatingData.get("tiles_to_runaway_to");
            hasEnemyLocData = myLocData.has(myTileX, myTileY);
            if (hasEnemyLocData){
                enemyLocData = myLocData.get(myTileX, myTileY);
                hasAllTilesStored = enemyLocData.has(enemyTileX, enemyTileY);
                if (hasAllTilesStored){
                    allTilesStored = enemyLocData.get(enemyTileX, enemyTileY);
                }
            }
        }

        // If it's saved then request this tile data
        if (hasAllTilesStored){
            allTiles = allTilesStored;
        }else{
            allTiles = this.determineTilesToReloadFrom(myTileX, myTileY, enemyTileX, enemyTileY);
            if (!hasMyLocData){
                myLocData = new NotSamXYCappedLengthSortedArrayList(100);
                this.temporaryOperatingData.set("tiles_to_runaway_to", myLocData);
            }
            if (!hasEnemyLocData){
                enemyLocData = new NotSamXYCappedLengthSortedArrayList(100);
                myLocData.set(myTileX, myTileY, enemyLocData);
            }

            // Save it
            // Sort scores big to small
            allTiles.sort(biggestToSmallestScore);
            enemyLocData.set(enemyTileX, enemyTileY, allTiles);
        }

        // Make it a copy
        allTiles = copyArray(allTiles);

        // Note it was saved sorted

        let chosenTile = allTiles[0];

        // If we are on the best one then return it
        if (chosenTile["tile_x"] === this.getTileX() && chosenTile["tile_y"] === this.getTileY()){
            return chosenTile;
        }

        // Else from current tile and pick randomly
        let xStart = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["reload_tile_selection_x_start"];
        let xEnd = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["reload_tile_selection_x_end"];
        let f = WTL_GAME_DATA["duel"]["ai"]["reload_tile_selection"]["reload_tile_selection_f"];
        let randomIndex = biasedIndexSelection(xStart, xEnd, f, allTiles.length, this.getRandom());
        chosenTile = allTiles[randomIndex];

        return chosenTile;
    }

    /*
        Method Name: generateShortestEvasiveRouteToPoint
        Method Parameters: 
            endTileX:
                The tile x of the tile you are trying to reach
            endTileY:
                The tile y of the tile you are trying to reach
            routeLengthLimit:
                The maximum length of the route
        Method Description: Generates a route to a point. An evasive route.
        Method Return: Route or null
    */
    generateShortestEvasiveRouteToPoint(endTileX, endTileY, routeLengthLimit=Number.MAX_SAFE_INTEGER){
        let startTileX = this.getTileX();
        let startTileY = this.getTileY();

        let hasOriginArr = this.temporaryOperatingData.has("shortest_evasive_route_p_to_p");
        let hasDestinationArr = false;
        let hasODRoute = false;
        let originArr;
        let destinationArr;
        let odRoute;
        if (hasOriginArr){
            originArr = this.temporaryOperatingData.get("shortest_evasive_route_p_to_p");
            hasDestinationArr = originArr.has(startTileX, startTileY);
            if (hasDestinationArr){
                destinationArr = originArr.get(startTileX, startTileY);
                hasODRoute = destinationArr.has(endTileX, endTileY);
                if (hasODRoute){
                    odRoute = destinationArr.get(endTileX, endTileY);
                }
            }
        }

        let route;

        // If it's saved then request this tile data
        if (hasODRoute){
            route = odRoute;
        }else{
            route = this.generateShortestEvasiveRoutePointToPoint(startTileX, startTileY, endTileX, endTileY, routeLengthLimit);
            if (!hasOriginArr){
                originArr = new NotSamXYCappedLengthSortedArrayList(100);
                this.temporaryOperatingData.set("shortest_evasive_route_p_to_p", originArr);
            }
            if (!hasDestinationArr){
                destinationArr = new NotSamXYCappedLengthSortedArrayList(100);
                originArr.set(startTileX, startTileY, destinationArr);
            }

            // Save it
            destinationArr.set(endTileX, endTileY, route);
        }

        // Copy route
        if (route != null){
            route = route.copy();
        }

        return route;
    }

    /*
        Method Name: generateShortestEvasiveRoutePointToPoint
        Method Parameters: 
            startTileX:
                The tile x of the tile you are starting from
            startTileX:
                The tile y of the tile you are starting from
            endTileX:
                The tile x of the tile you are trying to reach
            endTileY:
                The tile y of the tile you are trying to reach
            routeLengthLimit:
                The maximum length of the route
        Method Description: Generates a route to a point. An evasive route.
        Method Return: Route or null
    */
    generateShortestEvasiveRoutePointToPoint(startTileX, startTileY, endTileX, endTileY, routeLengthLimit=Number.MAX_SAFE_INTEGER){
        if (startTileX === endTileX && startTileY === endTileY){ return Route.fromPath([{"tile_x": startTileX, "tile_y": startTileY}]); }
        if (!this.canWalkOnTile(startTileX, startTileY)){ throw new Error("Invalid start tile."); }
        if (!this.canWalkOnTile(endTileX, endTileY)){ throw new Error("Invalid end tile."); }

        let knownPathsFromStart = new NotSamXYSortedArrayList();
        let knownPathsFromEnd = new NotSamXYSortedArrayList();

        let edgeTilesFromStart = new NotSamLinkedList([{"tile_x": startTileX, "tile_y": startTileY, "from_start": true}]);
        let edgeTilesFromEnd = new NotSamLinkedList([{"tile_x": endTileX, "tile_y": endTileY, "from_start": false}]);

        knownPathsFromStart.set(startTileX, startTileY, {"path_length": 0, "previous_tile_x": null, "previous_tile_y": null});
        knownPathsFromEnd.set(endTileX, endTileY, {"path_length": 0, "previous_tile_x": null, "previous_tile_y": null});

        /*
            Note: This is just the path finding function from character.js with a minor tweak
            The evasive score thing is used to encourage not moving in straight lines when possible
            This is far from perfect
        */

        let selectBestPath = (bestPossibleLengthSoFar) => {
            let eStart = null;
            let eEnd = null;
            let bestM = null;
            let bestMinTraversal = null;
            let eStartIndex = null;
            let eEndIndex = null;
            let bestEvasiveScore = null;

            // Note: The best possibile evasive score of two just means both tiles represent path turns
            let bestPossiblEvasiveScore = 2;

            let foundBestPossible = false;

            let tileHasEvasivePath = (tX, tY, pathStorage) => {
                let pathToTile = pathStorage.get(tX, tY);
                let previousTileX = pathToTile["previous_tile_x"];
                let previousTileY = pathToTile["previous_tile_y"];
                if (previousTileX === null || previousTileY === null){
                    return true;
                }
                let pathToPreviousTile = pathStorage.get(previousTileX, previousTileY);
                let secondPreviousTileX = pathToTile["previous_tile_x"];
                let secondPreviousTileY = pathToTile["previous_tile_y"];
                if (secondPreviousTileX === null || secondPreviousTileY === null){
                    return true;
                }
                // If there is a straight line here then the path is not evasive
                return secondPreviousTileX === tX || secondPreviousTileY === tY;
            }

            let calculateEvasiveScore = (teX, teY, tsX, tsY) => {
                let endScore = tileHasEvasivePath(teX, teY, knownPathsFromEnd) ? 1 : 0;
                let startScore = tileHasEvasivePath(tsX, tsY, knownPathsFromStart) ? 1 : 0;
                return endScore + startScore;
            }


            // Find the two tiles that could connect and form the shortest possible path
            for (let i = edgeTilesFromEnd.getLength() - 1; i >= 0; i--){
                let edgeTileFromEnd = edgeTilesFromEnd.get(i);
                let edgeTileFromEndTileX = edgeTileFromEnd["tile_x"];
                let edgeTileFromEndTileY = edgeTileFromEnd["tile_y"];
                let edgeTileFromEndLength = knownPathsFromEnd.get(edgeTileFromEndTileX, edgeTileFromEndTileY)["path_length"];
                for (let j = edgeTilesFromStart.getLength() - 1; j >= 0; j--){
                    let edgeTileFromStart = edgeTilesFromStart.get(j);
                    let edgeTileFromStartTileX = edgeTileFromStart["tile_x"];
                    let edgeTileFromStartTileY = edgeTileFromStart["tile_y"];
                    let edgeTileFromStartLength = knownPathsFromStart.get(edgeTileFromStartTileX, edgeTileFromStartTileY)["path_length"];
                    let minTraversal = calculateManhattanDistance(edgeTileFromStartTileX, edgeTileFromStartTileY, edgeTileFromEndTileX, edgeTileFromEndTileY);
                    let startToEndDistance = edgeTileFromStartLength + edgeTileFromEndLength + minTraversal + 1; // the +1 is because both path lengths do not include the start tile and the end tile should be included in the total length
                    let evasiveScore = calculateEvasiveScore(edgeTileFromEndTileX, edgeTileFromEndTileY, edgeTileFromStartTileX, edgeTileFromStartTileY);
                    // Find a better one
                    if (bestM === null || (startToEndDistance < bestM || (startToEndDistance === bestM && evasiveScore > bestEvasiveScore))){
                        eStart = edgeTileFromStart;
                        eEnd = edgeTileFromEnd;
                        bestM = startToEndDistance;
                        bestMinTraversal = minTraversal;
                        eEndIndex = i;
                        eStartIndex = j;
                        bestEvasiveScore = evasiveScore;
                    }

                    // If this is the best possible length then no need to search further
                    foundBestPossible = bestPossibleLengthSoFar != null && bestM === bestPossibleLengthSoFar && bestEvasiveScore === bestPossiblEvasiveScore;
                    if (foundBestPossible){
                        break;
                    }
                }
                // If this is the best possible length then no need to search further
                if (foundBestPossible){
                    break;
                }
            }

            let bestEdgeTile;
            let connectedTile;
            // If distance from start of path to current point is lower on the path from the "startTile" then select it
            if (calculateManhattanDistance(eStart["tile_x"], eStart["tile_y"], startTileX, startTileY) <= calculateManhattanDistance(eEnd["tile_x"], eEnd["tile_y"], endTileX, endTileY)){
                bestEdgeTile = eStart;
                connectedTile = eEnd;
                edgeTilesFromStart.pop(eStartIndex);
            }else{
                bestEdgeTile = eEnd;
                connectedTile = eStart;
                edgeTilesFromEnd.pop(eEndIndex);
            }

            let bestPathData = {"edge_tile": bestEdgeTile, "best_m": bestM, "best_min_traversal": bestMinTraversal, "has_complete_path": false, "connected_path": null};
            let completePath = bestMinTraversal === 1; 
            if (completePath){
                bestPathData["has_complete_path"] = true;
                bestPathData["connected_tile"] = connectedTile;
            }
            return bestPathData;
        }

        let updateKnownPathIfBetter = (knownPathsList, previousTileX, previousTileY, newPathLength, potentialPreviousTileX, potentialPreviousTileY) => {
            let previousTileInfo = knownPathsList.get(previousTileX, previousTileY);
            let exists = previousTileInfo != null;
            // If this doesn't exist then do nothing and return false
            if (!exists){
                return false;
            }

            let oldPathLength = previousTileInfo["path_length"];
            // If old path length was longer then replace it
            if (oldPathLength > newPathLength){
                // Update path length
                previousTileInfo["path_length"] = newPathLength;
                previousTileInfo["previous_tile_x"] = potentialPreviousTileX;
                previousTileInfo["previous_tile_y"] = potentialPreviousTileY;

                // Alert all paths that may be based on this one
                let adjacentTiles = [[previousTileX+1,previousTileY], [previousTileX-1, previousTileY], [previousTileX, previousTileY+1], [previousTileX, previousTileY-1]];
                for (let adjacentTile of adjacentTiles){
                    let adjacentTileX = adjacentTile[0];
                    let adjacentTileY = adjacentTile[1];
                    updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength + 1, previousTileX, previousTileY);
                }
            }
            return true;
        }

        let exploreTiles = (bestEdgeTile) => {
            let bETileX = bestEdgeTile["tile_x"];
            let bETileY = bestEdgeTile["tile_y"];
            let adjacentTiles = [[bETileX+1,bETileY], [bETileX-1, bETileY], [bETileX, bETileY+1], [bETileX, bETileY-1]];
            for (let adjacentTile of adjacentTiles){
                let adjacentTileX = adjacentTile[0];
                let adjacentTileY = adjacentTile[1];
                // Check if walkable
                if (!this.canWalkOnTile(adjacentTileX, adjacentTileY, "no_walk")){ continue; }

                // It's valid

                let knownPathsList;
                let activePathsList;
                let tileInfo;

                // Determine which is applicable
                if (bestEdgeTile["from_start"]){
                    knownPathsList = knownPathsFromStart;
                    activePathsList = edgeTilesFromStart;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": true};
                }else{
                    knownPathsList = knownPathsFromEnd;
                    activePathsList = edgeTilesFromEnd;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": false};
                }

                let newPathLength = knownPathsList.get(bETileX, bETileY)["path_length"] + 1;
                // This is known then update
                let known = updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength, bETileX, bETileY);
                // If it wasn't known then add
                if (!known){
                    // Add it to known paths
                    knownPathsList.set(adjacentTileX, adjacentTileY, {"path_length": newPathLength, "previous_tile_x": bETileX, "previous_tile_y": bETileY});
                    // Add to active path list
                    activePathsList.push(tileInfo);
                }
            }
        }

        // takes two touching tiles and creates a path
        let createPath = (touchingTile1, touchingTile2) => {
            let tileFromStart = touchingTile1["from_start"] ? touchingTile1 : touchingTile2;
            let tileFromEnd = touchingTile1["from_start"] ? touchingTile2 : touchingTile1;

            let startPath = [];
            let endPath = [];
            

            // Add tile to front of the list
            startPath.unshift({"tile_x": tileFromStart["tile_x"], "tile_y": tileFromStart["tile_y"]})

            // Add tiles from start forwards
            let previousData = knownPathsFromStart.get(tileFromStart["tile_x"], tileFromStart["tile_y"]);

            let previousTileX = previousData["previous_tile_x"];
            let previousTileY = previousData["previous_tile_y"];

            let hasPreviousTile = (previousTileX != null && previousTileY != null);
            while (hasPreviousTile){
                // Add tile to front of the list
                startPath.unshift({"tile_x": previousTileX, "tile_y": previousTileY});

                // Go to next
                previousData = knownPathsFromStart.get(previousTileX, previousTileY);
                if (previousData === null){
                    debugger;
                }
                previousTileX = previousData["previous_tile_x"];
                previousTileY = previousData["previous_tile_y"];

                hasPreviousTile = (previousTileX != null && previousTileY != null);
            }

            // Add tile to back of the list
            endPath.unshift({"tile_x": tileFromEnd["tile_x"], "tile_y": tileFromEnd["tile_y"]})

            // Add tiles from start forwards
            previousData = knownPathsFromEnd.get(tileFromEnd["tile_x"], tileFromEnd["tile_y"]);
            previousTileX = previousData["previous_tile_x"];
            previousTileY = previousData["previous_tile_y"];

            hasPreviousTile = (previousTileX != null && previousTileY != null);
            while (hasPreviousTile){
                // Add tile to back of the list
                endPath.push({"tile_x": previousTileX, "tile_y": previousTileY});

                // Go to next
                previousData = knownPathsFromEnd.get(previousTileX, previousTileY);
                if (previousData === null){
                    debugger;
                }
                previousTileX = previousData["previous_tile_x"];
                previousTileY = previousData["previous_tile_y"];

                hasPreviousTile = (previousTileX != null && previousTileY != null);
            }
            return Route.fromPath(appendLists(startPath, endPath)); 
        }

        let bestPossibleRouteLength = calculateManhattanDistance(startTileX, startTileY, endTileX, endTileY);
        let bestFoundPathLengthSoFar = null;

        // While it is possible to create a path from
        while (bestPossibleRouteLength < routeLengthLimit){
            // If I can find no path from start then stop
            if (edgeTilesFromStart.getLength() === 0){
                break;
            }
            // If I can find no path from end then stop
            if (edgeTilesFromEnd.getLength() === 0){
                break;
            }

            let bestPathData = selectBestPath(bestPossibleRouteLength);

            // Update best m
            bestPossibleRouteLength = bestPathData["best_m"];

            // If the two paths met then distance is found. Note: With current design, the first full path is always the best possible path
            if (bestPathData["has_complete_path"]){
                return createPath(bestPathData["edge_tile"], bestPathData["connected_tile"]);
            }

            let bestEdgeTile = bestPathData["edge_tile"];

            // Explore
            exploreTiles(bestEdgeTile);
        }

        // None found
        return null;
    }

    /*
        Method Name: generateShortestRouteFromPointToPoint
        Method Parameters: 
            tile1X:
                Start tile x
            tile1Y:
                Start tile y
            tile2X:
                End tile x
            tile2Y:
                End tile y
        Method Description: Generates or gets from storage the shortest route from one point to another
        Method Return: Route or null,
    */
    generateShortestRouteFromPointToPoint(tile1X, tile1Y, tile2X, tile2Y){
        let hasOriginArr = this.temporaryOperatingData.has("shortest_route_p_to_p");
        let hasDestinationArr = false;
        let hasODRoute = false;
        let originArr;
        let destinationArr;
        let odRoute;
        if (hasOriginArr){
            originArr = this.temporaryOperatingData.get("shortest_route_p_to_p");
            hasDestinationArr = originArr.has(tile1X, tile1Y);
            if (hasDestinationArr){
                destinationArr = originArr.get(tile1X, tile1Y);
                hasODRoute = destinationArr.has(tile2X, tile2Y);
                if (hasODRoute){
                    odRoute = destinationArr.get(tile2X, tile2Y);
                }
            }
        }

        let route;
        // If it's saved then request this tile data
        if (hasODRoute){
            route = odRoute;
        }else{
            route = super.generateShortestRouteFromPointToPoint(tile1X, tile1Y, tile2X, tile2Y);
            if (!hasOriginArr){
                originArr = new NotSamXYCappedLengthSortedArrayList(100);
                this.temporaryOperatingData.set("shortest_route_p_to_p", originArr);
            }
            if (!hasDestinationArr){
                destinationArr = new NotSamXYCappedLengthSortedArrayList(100);
                originArr.set(tile1X, tile1Y, destinationArr);
            }

            // Save it
            destinationArr.set(tile2X, tile2Y, route);
        }

        // Copy route
        if (route != null){
            route = route.copy();
        }
        return route;
    }

    /*
        Method Name: exploreAvailableTiles
        Method Parameters: 
            tileX:
                The starting tileX
            tileY:
                The starting tileY
            pathLength:
                The maximum path length
        Method Description: Comes up with a list of tiles you can walk to
        Method Return: List of JSON Objects
    */
    exploreAvailableTiles(tileX, tileY, pathLength=null){
        // If path length not specified then just use the max search path length
        if (pathLength === null){
            pathLength = this.getMaxSearchPathLength();
        }
        let hasSavedData = this.temporaryOperatingData.has("explore_available_tiles");
        let foundSavedDataForTile = false;
        let allTileSavedData;
        if (hasSavedData){
            allTileSavedData = this.temporaryOperatingData.get("explore_available_tiles");
            foundSavedDataForTile = allTileSavedData.has(tileX, tileY);
        }

        let tiles;
        // If it's saved then request this tile data
        if (foundSavedDataForTile){
            tiles = allTileSavedData.get(tileX, tileY);
        }else{
            tiles = super.exploreAvailableTiles(pathLength, tileX, tileY);
            // Save it
            let xyDataStore = new NotSamXYCappedLengthSortedArrayList(100);
            xyDataStore.set(tileX, tileY, tiles);
            this.temporaryOperatingData.set("explore_available_tiles", xyDataStore);
        }

        // Copy tiles
        tiles = copyArray(tiles);
        return tiles;
    }

    /*
        Method Name: determineTilesToShootFrom
        Method Parameters: 
            myTileX:
                My current tile x Location
            myTileY:
                My current tile y Location
            enemyTileX:
                The enemy current tile x Location
            enemyTileY:
                The enemy current tile y Location
            gun:
                My held gun
        Method Description: Comes up with tiles you can shoot the enemy from
        Method Return: List of JSON objects
    */
    determineTilesToShootFrom(myTileX, myTileY, enemyTileX, enemyTileY, gun){
        let allTiles = this.exploreAvailableTiles(this.getTileX(), this.getTileY(), this.getMaxSearchPathLength());
        // Explore these tiles from the enemy perspective so I can save time calculating path length later
        let pathToEnemyLength = this.generateShortestRouteFromPointToPoint(myTileX, myTileY, enemyTileX, enemyTileY).getMovementDistance();
        let allTilesFromEnemy = super.exploreAvailableTiles(pathToEnemyLength + this.getMaxSearchPathLength(), enemyTileX, enemyTileY);
        let allTilesFromEnemySearchable = new NotSamXYSortedArrayList();

        // Add enemy tiles to the searchable object
        for (let tile of allTilesFromEnemy){
            allTilesFromEnemySearchable.set(tile["tile_x"], tile["tile_y"], tile);
        }

        let distanceToSearchForSingleCover = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["single_cover_search_route_distance"];
        let distanceToSearchForMultiCover = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["multi_cover_search_route_distance"];
        let distanceToSearchForPhysicalCover = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["physical_cover_search_route_distance"];

        // Combination multipliers
        let fromMeRouteMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_me_route_mult"]; // positive
        let fromEnemyRouteMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_enemy_route_mult"]; // positive
        let fromEnemyMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_enemy_mult"]; // negative
        let angleRangeMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["angle_range_mult"]; // negative 
        let nearestSingleCoverMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_single_cover_mult"]; // positive
        let nearestMultiCoverMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_multi_cover_mult"]; // positive
        let nearestPhysicalCoverMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_physical_cover_mult"]; // positive
        let onTileMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["on_tile_multiplier"]; // positive

        let scene = this.getScene();
        let enemyCenterXAtTile = scene.getCenterXOfTile(enemyTileX);
        let enemyCenterYAtTile = scene.getCenterYOfTile(enemyTileY);

        let enemyVisibilityDistance = this.getGamemode().getEnemyVisibilityDistance();

        let singleCoverFunction = (tile) => {
            return tile.hasAttribute("single_cover") && calculateEuclideanDistance(enemyTileX, enemyTileY, tile.getTileX(), tile.getTileY()) > enemyVisibilityDistance;
        }

        let multiCoverFunction = (tile) => {
            return tile.hasAttribute("multi_cover");
        }
        let enemyHalfWidth = (WTL_GAME_DATA["general"]["tile_size"] - 1)/2;
        let enemyHalfHeight = (WTL_GAME_DATA["general"]["tile_size"] - 1)/2;

        let physicalCoverFunction = (tileX, tileY) => {
            let targetPositionX = scene.getCenterXOfTile(tileX);
            let targetPositionY = scene.getCenterYOfTile(tileY);
            let targets = [{"center_x": targetPositionX, "center_y": targetPositionY, "half_width": enemyHalfWidth, "half_height": enemyHalfHeight, "entity": null}];
            return this.getScene().findInstantCollisionForProjectileWithTargets(enemyCenterXAtTile, enemyCenterYAtTile, displacementToRadians(tileX-enemyTileX, tileY-enemyTileY), enemyVisibilityDistance, targets)["collision_type"] === "physical_tile";
        }

        // Determine which tiles one can stand on and hit the enemy
        let canHitTiles = [];
        let minAngleRangeForCanHit = toRadians(WTL_GAME_DATA["duel"]["ai"]["can_hit_min_angle_range_deg"]);
        for (let tile of allTiles){
            // If I wouldn't be able to see the enemy then don't consider it
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];

            // If its too far to see the enemy then don't pick it
            if (!this.couldISeeEntityAtTileFromTile(tileX, tileY, enemyTileX, enemyTileY)){ continue; }
            
            // Note: Assuming they will face the estimated best way
            let angleToTileCenter = displacementToRadians(enemyTileX - tileX, enemyTileY - tileY);
            let visualDirectionToFace = angleToBestFaceDirection(angleToTileCenter);
            let playerLeftX = scene.getXOfTile(tileX);
            let playerTopY = scene.getYOfTile(tileY);
            let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, visualDirectionToFace, angleToTileCenter);
            let gunEndX = pos["x"];
            let gunEndY = pos["y"];
            let bulletRange = gun.getBulletRange();
            let speculation = this.speculateOnHittingEnemy(bulletRange, enemyCenterXAtTile, enemyCenterYAtTile, gunEndX, gunEndY, visualDirectionToFace);
            if (speculation["can_hit"]){
                let angleRangeToHitEnemy = calculateAngleDiffCWRAD(speculation["left_angle"], speculation["right_angle"]);
                if (angleRangeToHitEnemy >= minAngleRangeForCanHit){
                    tile["angle_range_to_hit_enemy"] = angleRangeToHitEnemy;
                    canHitTiles.push(tile);
                }
            }
        }

        // Sort can hit tiles by path length
        let shortestToLongestPath = (tile1, tile2) => {
            return tile1["shortest_path"].length - tile2["shortest_path"].length;
        }
        canHitTiles.sort(shortestToLongestPath);


        // Filter out ones that involve walking through other ones
        let existingEnds = new NotSamXYSortedArrayList();
        let canHitEfficientTiles = [];
        for (let canHitTile of canHitTiles){
            let goesOver = false;
            let path = canHitTile["shortest_path"];
            // Loop from second last tile to beginning to diff if it matches an existing end location
            for (let i = path.length - 2; i >= 0; i--){
                let tileAtPathLoc = path[i];
                // If it has another canhit tile in its path then exclude it
                if (existingEnds.has(tileAtPathLoc["tile_x"], tileAtPathLoc["tile_y"])){
                    goesOver = true;
                    break;
                }
            }
            // If the path to this tile doesn't go over another can_hit tile then save it
            if (!goesOver){
                // Set a marker that its known
                existingEnds.set(canHitTile["tile_x"], canHitTile["tile_y"], null);
                canHitEfficientTiles.push(canHitTile);
            }
        }

        let canHitTilesEfficientSearchable = new NotSamXYSortedArrayList();
         // Add enemy tiles to the searchable object
        for (let tile of canHitEfficientTiles){
            canHitTilesEfficientSearchable.set(tile["tile_x"], tile["tile_y"], tile);
        }
        let singleCoverDistances = this.calculateShortestRouteDistanceFromTilesToTileWithCondition(canHitTilesEfficientSearchable.getNullVersion(), singleCoverFunction, distanceToSearchForSingleCover);
        let multiCoverDistances = this.calculateShortestRouteDistanceFromTilesToTileWithCondition(canHitTilesEfficientSearchable.getNullVersion(), multiCoverFunction, distanceToSearchForMultiCover);
        let physicalCoverDistances = this.calculateShortestRouteDistanceFromTilesToTileWithCondition(canHitTilesEfficientSearchable.getNullVersion(), physicalCoverFunction, distanceToSearchForPhysicalCover);

        // Score each tile
        for (let tile of canHitEfficientTiles){
            let distanceFromMe = tile["shortest_path"].length;
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            let tileCenterX = scene.getCenterXOfTile(tileX);
            let tileCenterY = scene.getCenterYOfTile(tileY);

            //let routeDistanceFromEnemy = 0;
            let tileFromEnemyPos = allTilesFromEnemySearchable.get(tileX, tileY);
            if (tileFromEnemyPos === null){
                throw new Error("Unexpected couldn't find tile from enemy perspective.");
            }
            let routeDistanceFromEnemy = tileFromEnemyPos["shortest_path"].length;

            let realDistanceFromEnemy = calculateEuclideanDistance(enemyCenterXAtTile, enemyCenterYAtTile, tileCenterX, tileCenterY);

            // Single cover outside of enemy visibility
            let shortestDistanceToSingleCover = singleCoverDistances.get(tileX, tileY);
            //let shortestDistanceToSingleCover = null;
            if (shortestDistanceToSingleCover === null){ shortestDistanceToSingleCover = distanceToSearchForSingleCover; }
            //let shortestDistanceToMultiCover = null;
            let shortestDistanceToMultiCover = multiCoverDistances.get(tileX, tileY);
            if (shortestDistanceToMultiCover === null){ shortestDistanceToMultiCover = distanceToSearchForMultiCover; }
            // Physical cover distance
            let shortestDistanceToPhyiscalCover = physicalCoverDistances.get(tileX, tileY);
            if (shortestDistanceToPhyiscalCover === null){ shortestDistanceToPhyiscalCover = distanceToSearchForPhysicalCover; }

            let onTile = (this.getTileX() === tileX && this.getTileY() === tileY) ? 1 : 0;

            let score = 0;

            // Add linear combination

            score += distanceFromMe * fromMeRouteMult;
            score += routeDistanceFromEnemy * fromEnemyRouteMult;
            score += realDistanceFromEnemy * fromEnemyMult;
            score += tile["angle_range_to_hit_enemy"] * angleRangeMult;
            score += shortestDistanceToSingleCover * nearestSingleCoverMult;
            score += shortestDistanceToMultiCover * nearestMultiCoverMult;
            score += shortestDistanceToPhyiscalCover * nearestPhysicalCoverMult;
            score += onTile * onTileMult;

            // Add the score
            tile["score"] = score;
        }

        // Note: Could be an empty array
        return canHitEfficientTiles;
    }

    /*
        Method Name: determineTileToShootFrom
        Method Parameters: 
            enemyTileX:
                The tile x of the enemy
            enemyTileY:
                The tile y of the enemy
            gun:
                My held gun
        Method Description: Picks a tile to shoot the enemy from
        Method Return: JSON Object
    */
    determineTileToShootFrom(enemyTileX, enemyTileY, gun){
        let allTiles;
        let myTileX = this.getTileX();
        let myTileY = this.getTileY();

        let biggestToSmallestScore = (tile1, tile2) => {
            return tile2["score"] - tile1["score"];
        }

        let hasMyLocData = this.temporaryOperatingData.has("tiles_to_stand_and_shoot_from");
        let hasEnemyLocData = false;
        let hasAllTilesStored = false;
        let myLocData;
        let enemyLocData;
        let allTilesStored;
        if (hasMyLocData){
            myLocData = this.temporaryOperatingData.get("tiles_to_stand_and_shoot_from");
            hasEnemyLocData = myLocData.has(myTileX, myTileY);
            if (hasEnemyLocData){
                enemyLocData = myLocData.get(myTileX, myTileY);
                hasAllTilesStored = enemyLocData.has(enemyTileX, enemyTileY);
                if (hasAllTilesStored){
                    allTilesStored = enemyLocData.get(enemyTileX, enemyTileY);
                }
            }
        }


        // If it's saved then request this tile data
        if (hasAllTilesStored){
            if (allTilesStored === null){ debugger;}
            allTiles = allTilesStored;
        }else{
            allTiles = this.determineTilesToShootFrom(myTileX, myTileY, enemyTileX, enemyTileY, gun);
            if (allTiles === null){ debugger; }
            if (!hasMyLocData){
                myLocData = new NotSamXYCappedLengthSortedArrayList(100);
                this.temporaryOperatingData.set("tiles_to_stand_and_shoot_from", myLocData);
            }
            if (!hasEnemyLocData){
                enemyLocData = new NotSamXYCappedLengthSortedArrayList(100);
                myLocData.set(myTileX, myTileY, enemyLocData);
            }

            // Save it
            // Sort scores big to small
            allTiles.sort(biggestToSmallestScore);
            enemyLocData.set(enemyTileX, enemyTileY, allTiles);
        }

        // Make it a copy
        allTiles = copyArray(allTiles);

        // Quick check if any of the tiles can hit
        let foundATileThatICanHitFrom = allTiles.length > 0;

        // If I can't find a tile to hit the enemy from
        if (!foundATileThatICanHitFrom){
            let routeToEnemy = this.generateShortestEvasiveRouteToPoint(enemyTileX, enemyTileY);
            if (routeToEnemy.getMovementDistance() >= 1){
                // Get a tile in the path to enemy
                let tile = routeToEnemy.getTile(1);
                tile["shortest_path"] = [{"tile_x": this.getTileX(), "tile_y": this.getTileY()}, {"tile_x": tile["tile_x"], "tile_y": tile["tile_y"]}];
                return {"new_tile": tile, "can_hit": false};
            }
        }

        let chosenTile = allTiles[0];

        // If we are on the best one then return it
        if (chosenTile["tile_x"] === this.getTileX() && chosenTile["tile_y"] === this.getTileY()){
            return {"new_tile": chosenTile, "can_hit": true};
        }

        // Else from current tile and pick randomly
        let xStart = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_x_start"];
        let xEnd = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_x_end"];
        let f = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_f"];
        let randomIndex = biasedIndexSelection(xStart, xEnd, f, allTiles.length, this.getRandom());

        // Change the chosen tile
        chosenTile = allTiles[randomIndex];

        return {"new_tile": chosenTile, "can_hit": true};
    }

    /*
        Method Name: calculateShortestRouteDistanceFromTilesToTileWithCondition
        Method Parameters: 
            startTileArray:
                The starting tiles
            conditionFunction:
                Function to determine if a tile is a valid end point
            maxRouteLength:
                The maximum route length to explore
        Method Description: Finds the shortest route distance from each tile to a tile with the correction condition
        Method Return: NotSamdXYSortedArrayList
    */
    calculateShortestRouteDistanceFromTilesToTileWithCondition(startTileArray, conditionFunction, maxRouteLength){
        // Note: startTileArray may include null values on function end
        if (maxRouteLength === undefined){
            throw new Error("Please supply a valid max route length.");
        }

        // Do nothing if there are no entries
        if (startTileArray.getLength() === 0){
            return startTileArray;
        }

        let scene = this.getScene();
        let chunks = scene.getChunks();

        let chunksToCheck = new NotSamXYSortedArrayList();
        let CHUNK_SIZE = WTL_GAME_DATA["general"]["chunk_size"];

        // Determine starting chunks
        for (let [value, tileX, tileY] of startTileArray){
            let chunkX = Chunk.tileToChunkCoordinate(tileX);
            let chunkY = Chunk.tileToChunkCoordinate(tileY);
            if (!chunksToCheck.has(chunkX, chunkY)){
                let chunk = chunks.get(chunkX, chunkY);
                if (chunk === null){ continue; }
                // False to indicate the end tiles have not been taken
                chunksToCheck.set(chunkX, chunkY, {"extracted": false, "chunk": chunk});
            }
        }

        let knownPathsFromEndWithAttribute = new NotSamXYSortedArrayList();
        let edgeTilesFromAnEndWithAttribute = new NotSamLinkedList();

        let stillLooking = true;

        let tryToFindMoreChunks = () => {
            for (let [currentBestRouteLength, tileX, tileY] of startTileArray){
                // Skip ones with confirmed paths
                if (currentBestRouteLength === null){ continue; }

                let lowestChunkPossibleEndX = Chunk.tileToChunkCoordinate(tileX - maxRouteLength);
                let highestChunkPossibleEndX = Chunk.tileToChunkCoordinate(tileX + maxRouteLength);
                let lowestChunkPossibleEndY = Chunk.tileToChunkCoordinate(tileY - maxRouteLength);
                let highestChunkPossibleEndY = Chunk.tileToChunkCoordinate(tileY + maxRouteLength);
                let currentChunkX = Chunk.tileToChunkCoordinate(tileX);
                let currentChunkY = Chunk.tileToChunkCoordinate(tileY);

                let distanceToRight = Chunk.getRightTileXOfChunk(tileX) - tileX + 1;
                let distanceToLeft = tileX - Chunk.getLeftTileXOfChunk(tileX) + 1;
                let distanceToBottom = Chunk.getTopTileYOfChunk(tileY) - tileY + 1;
                let distanceToTop = tileY - Chunk.getBottomTileYOfChunk(tileY) + 1;

                for (let chunkX = lowestChunkPossibleEndX; chunkX <= highestChunkPossibleEndX; chunkX++){
                    for (let chunkY = lowestChunkPossibleEndY; chunkY <= highestChunkPossibleEndY; chunkY++){
                        let distanceToChunk = CHUNK_SIZE * Math.abs(currentChunkX - chunkX) + CHUNK_SIZE * Math.abs(currentChunkY - chunkY);

                        // Add distance to just get in that direction
                        if (chunkX < currentChunkX){
                            distanceToChunk += distanceToLeft;
                        }else if (chunkX > currentChunkX){
                            distanceToChunk += distanceToRight;
                        }

                        if (chunkY < currentChunkY){
                            distanceToChunk += distanceToBottom;
                        }else if (chunkY > currentChunkY){
                            distanceToChunk += distanceToTop;
                        }

                        // If the chunk meets the minimum threshold of having a distance there less than maxRouteLength
                        if (distanceToChunk < maxRouteLength){
                            // If the chunk is closer than the best route length OR this is no best route length
                            if (distanceToChunk < currentBestRouteLength){
                                // If the check has not been checked already
                                let chunk = chunks.get(chunkX, chunkY);
                                if (!chunksToCheck.has(chunkX, chunkY) && chunk != null){
                                    chunksToCheck.set(chunkX, chunkY, {"extracted": false, "chunk": chunk});
                                    // Return true to to indicate we found a new chunk to add
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
            // Return false to indicate no new chunks were added
            return false;
        }

        let findEndStartMatch = () => {
            let bestMatch = {"distance": null, "start_x": null, "start_y": null, "end_tile": null, "min_traversal": null, "end_tile_index": null};

            // Loop through all edge tiles from an end
            for (let i = edgeTilesFromAnEndWithAttribute.getLength() - 1; i >= 0; i--){
                let edgeTileFromEnd = edgeTilesFromAnEndWithAttribute.get(i);
                let edgeTileFromEndTileX = edgeTileFromEnd["tile_x"];
                let edgeTileFromEndTileY = edgeTileFromEnd["tile_y"];
                let edgeTileFromEndLength = knownPathsFromEndWithAttribute.get(edgeTileFromEndTileX, edgeTileFromEndTileY)["path_length"];

                // Loop through all starting values
                for (let [value, tileX, tileY] of startTileArray){
                    // The moment that the value is changed it must be the best possible route
                    if (value != null){ continue; }
                    let minTraversal = calculateManhattanDistance(tileX, tileY, edgeTileFromEndTileX, edgeTileFromEndTileY);
                    let startToEndDistance = 0 + edgeTileFromEndLength + minTraversal;
                    let knownDistanceForThisTile = value;
                    // If this is the best
                    if ((knownDistanceForThisTile === null || knownDistanceForThisTile > startToEndDistance) && startToEndDistance < maxRouteLength && (bestMatch["distance"] === null || startToEndDistance < bestMatch["distance"])){
                        bestMatch["end_tile_index"] = i;
                        bestMatch["distance"] = startToEndDistance;
                        bestMatch["start_x"] = tileX;
                        bestMatch["start_y"] = tileY;
                        bestMatch["min_traversal"] = minTraversal;
                    }
                }
            }

            // If a tile has been found
            if (bestMatch["end_tile_index"] != null){
                // Remove
                bestMatch["end_tile"] = edgeTilesFromAnEndWithAttribute.pop(bestMatch["end_tile_index"]);
            }

            return bestMatch;
        }

        let updateKnownPathIfBetter = (knownPathsList, previousTileX, previousTileY, newPathLength) => {
            let adjacentTiles = [[previousTileX+1,previousTileY], [previousTileX-1, previousTileY], [previousTileX, previousTileY+1], [previousTileX, previousTileY-1]];
            let previousTileInfo = knownPathsList.get(previousTileX, previousTileY);
            let exists = previousTileInfo != null;
            // If this doesn't exist then do nothing and return false
            if (!exists){
                return false;
            }

            let oldPathLength = previousTileInfo["path_length"];

            // If old path length was longer then replace it
            if (oldPathLength > newPathLength){
                // Update path length
                previousTileInfo["path_length"] = newPathLength;

                // Alert all paths that may be based on this one
                for (let adjacentTile of adjacentTiles){
                    let adjacentTileX = adjacentTile[0];
                    let adjacentTileY = adjacentTile[1];
                    updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength + 1);
                }
            }
            return true;
        }

        let exploreTiles = (bestEdgeTile) => {
            let bETileX = bestEdgeTile["tile_x"];
            let bETileY = bestEdgeTile["tile_y"];
            let adjacentTiles = [[bETileX+1,bETileY], [bETileX-1, bETileY], [bETileX, bETileY+1], [bETileX, bETileY-1]];

            for (let adjacentTile of adjacentTiles){
                let adjacentTileX = adjacentTile[0];
                let adjacentTileY = adjacentTile[1];
                // Check if walkable
                if (this.getScene().tileAtLocationHasAttribute(adjacentTileX, adjacentTileY, "no_walk")){ continue; }

                // It's valid

                let knownPathsList = knownPathsFromEndWithAttribute;
                let activePathsList = edgeTilesFromAnEndWithAttribute;
                let tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "origin_tile_x": bestEdgeTile["origin_tile_x"], "origin_tile_y": bestEdgeTile["origin_tile_y"]};

                let newPathLength = knownPathsList.get(bETileX, bETileY)["path_length"] + 1;

                // This is known then update
                let known = updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength);

                // If it wasn't known then add
                if (!known){
                    // Add it to known paths
                    knownPathsList.set(adjacentTileX, adjacentTileY, {"path_length": newPathLength});
                    // Add to active path list
                    activePathsList.push(tileInfo);
                }
            }
        }

        // Loop until we need new chunks
        while (stillLooking){
            // Add all end tiles within chunksToChunk
            for (let [chunkJSON, chunkX, chunkY] of chunksToCheck){
                if (chunkJSON["extracted"]){ continue; }
                chunkJSON["extracted"] = true;
                let chunkToCheck = chunkJSON["chunk"];
                let tilesInChunk = chunkToCheck.getPhysicalTiles();
                // Look at all tiles in 
                for (let [tile, tileX, tileY] of tilesInChunk){
                    if (tile === null){ continue; }
                    // Note: Assumes tile is walkable as well...
                    if (conditionFunction(tile)){
                        edgeTilesFromAnEndWithAttribute.push({"tile_x": tileX, "tile_y": tileY, "from_start": false, "origin_tile_x": tileX, "origin_tile_y": tileY});
                        knownPathsFromEndWithAttribute.set(tileX, tileY, {"path_length": 0});
                    }
                }
            }
            let chunksAreSufficient = true;
            // While these chunks are enough and I'm still looking
            
            while (chunksAreSufficient){
                let endStartMatch = findEndStartMatch();
                // If there is no match then the chunks are no longer sufficient
                if (endStartMatch["end_tile"] === null){
                    chunksAreSufficient = false;
                }else{
                    // We have a match -> save it
                    if (endStartMatch["min_traversal"] <= 1){
                        startTileArray.set(endStartMatch["start_x"], endStartMatch["start_y"], endStartMatch["distance"]);
                    }

                    // Continue exploring
                    exploreTiles(endStartMatch["end_tile"]);
                }
            }

            // If we are not able to find what we're looking for with the current chunks to try add more
            // If no new chunks are added then stop
            stillLooking = tryToFindMoreChunks();
        }

        return startTileArray;
    }   

    /*
        Method Name: calculateShortestRouteDistanceToTileWithCondition
        Method Parameters: 
            startTileX:
                Tile x of starting tile
            startTileY:
                Tile y of starting tile
            conditionFunction:
                Function to determine if a tile is a valid end point
            maxRouteLength:
                The maximum route length to explore
        Method Description: Finds the shortest route distance from a tile to another tile with the correction condition
        Method Return: null or integer
    */
    calculateShortestRouteDistanceToTileWithCondition(startTileX, startTileY, conditionFunction, maxRouteLength){
        if (maxRouteLength === undefined){
            throw new Error("Please supply a valid max route length.");
        }

        let scene = this.getScene();
        let chunks = scene.getChunks();

        let startingChunkX = Chunk.tileToChunkCoordinate(startTileX);
        let startingChunkY = Chunk.tileToChunkCoordinate(startTileY);
        let startingChunk = chunks.get(startingChunkX, startingChunkY);

        let CHUNK_SIZE = WTL_GAME_DATA["general"]["chunk_size"];
        let xDistanceToChunkSide = Math.min(Chunk.getRightTileXOfChunk(startingChunkX) - startTileX, startTileX - Chunk.getLeftTileXOfChunk(startingChunkX)) + 1;
        let yDistanceToChunkSide = Math.min(Chunk.getTopTileYOfChunk(startingChunkY) - startTileY, startTileY - Chunk.getBottomTileYOfChunk(startingChunkY)) + 1;

        // If there is no chunk at specified location
        if (startingChunk === null){
            throw new Error("Chunk at starting location not found");
        }


        // Start by finding all the tiles with attribute in nearby chunks

        let chunksToCheck = [startingChunk];
        let knownPathsFromStart = new NotSamXYSortedArrayList();
        let knownPathsFromEndWithAttribute = new NotSamXYSortedArrayList();

        let edgeTilesFromStart = new NotSamLinkedList([{"tile_x": startTileX, "tile_y": startTileY, "from_start": true}]);
        let edgeTilesFromAnEndWithAttribute = new NotSamLinkedList();

        knownPathsFromStart.set(startTileX, startTileY, {"path_length": 0});
        let hasMoreChunksToCheck = true;
        let distanceToNextChunkSet = 1;

        let addMoreChunks = () => {
            // Top
            for (let chunkX = startingChunkX - distanceToNextChunkSet; chunkX <= startingChunkX + distanceToNextChunkSet; chunkX++){
                let newChunk = chunks.get(chunkX, startingChunkY + distanceToNextChunkSet);
                if (newChunk != null){
                    chunksToCheck.push(newChunk);
                }
            }

            // Left
            for (let chunkY = startingChunkY - distanceToNextChunkSet; chunkY <= startingChunkY + distanceToNextChunkSet; chunkY++){
                let newChunk = chunks.get(startingChunkX - distanceToNextChunkSet, chunkY);
                if (newChunk != null){
                    chunksToCheck.push(newChunk);
                }
            }

            // Right
            for (let chunkY = startingChunkY - distanceToNextChunkSet; chunkY <= startingChunkY + distanceToNextChunkSet; chunkY++){
                let newChunk = chunks.get(startingChunkX + distanceToNextChunkSet, chunkY);
                if (newChunk != null){
                    chunksToCheck.push(newChunk);
                }
            }

            // Bottom
            for (let chunkX = startingChunkX - distanceToNextChunkSet; chunkX <= startingChunkX + distanceToNextChunkSet; chunkX++){
                let newChunk = chunks.get(chunkX, startingChunkY - distanceToNextChunkSet);
                if (newChunk != null){
                    chunksToCheck.push(newChunk);
                }
            }
        }

        let selectBestPath = (bestPossibleLengthSoFar) => {
            /*
                Strategy:
                    Find path with attribute closest to the start name it eStart
                    Then find path from start closest to eStart and name it eStart
                    If calculateManhattanDistance(eStart, start) <= calculateManhattanDistance(eStart, end)
                        return eStart
                    else:
                        return eEnd
            */
            let eStart = null;
            let eEnd = null;
            let bestM = null;
            let bestMinTraversal = null;
            let eStartIndex = null;
            let eEndIndex = null;

            let foundBestPossibleDistance = false;

            // Find the two tiles that could connect and form the shortest possible path
            for (let i = edgeTilesFromAnEndWithAttribute.getLength() - 1; i >= 0; i--){
                let edgeTileFromEnd = edgeTilesFromAnEndWithAttribute.get(i);
                let edgeTileFromEndTileX = edgeTileFromEnd["tile_x"];
                let edgeTileFromEndTileY = edgeTileFromEnd["tile_y"];
                let edgeTileFromEndLength = knownPathsFromEndWithAttribute.get(edgeTileFromEndTileX, edgeTileFromEndTileY)["path_length"];
                for (let j = edgeTilesFromStart.getLength() - 1; j >= 0; j--){
                    let edgeTileFromStart = edgeTilesFromStart.get(j);
                    let edgeTileFromStartTileX = edgeTileFromStart["tile_x"];
                    let edgeTileFromStartTileY = edgeTileFromStart["tile_y"];
                    let edgeTileFromStartLength = knownPathsFromStart.get(edgeTileFromStartTileX, edgeTileFromStartTileY)["path_length"];
                    let minTraversal = calculateManhattanDistance(edgeTileFromStartTileX, edgeTileFromStartTileY, edgeTileFromEndTileX, edgeTileFromEndTileY);
                    let startToEndDistance = edgeTileFromStartLength + edgeTileFromEndLength + minTraversal;
                    if (bestM === null || startToEndDistance < bestM){
                        eEnd = edgeTileFromEnd;
                        eStart = edgeTileFromStart;
                        bestM = startToEndDistance;
                        bestMinTraversal = minTraversal;
                        eEndIndex = i;
                        eStartIndex = j;
                    }

                    // If this is the best possible length then no need to search further
                    foundBestPossibleDistance = bestPossibleLengthSoFar != null && startToEndDistance === bestPossibleLengthSoFar;
                    if (foundBestPossibleDistance){
                        break;
                    }
                }
                // If this is the best possible length then no need to search further
                if (foundBestPossibleDistance){
                    break;
                }
            }

            let bestEdgeTile;
            // If distance from start of path to current point is lower on the path from the "startTile" then select it
            if (calculateManhattanDistance(eStart["tile_x"], eStart["tile_y"], startTileX, startTileY) <= calculateManhattanDistance(eEnd["tile_x"], eEnd["tile_y"], eEnd["origin_tile_x"], eEnd["origin_tile_y"])){
                bestEdgeTile = eStart;
                edgeTilesFromStart.pop(eStartIndex);
            }else{
                bestEdgeTile = eEnd;
                edgeTilesFromAnEndWithAttribute.pop(eEndIndex);
            }
            
            let bestPathData = {"edge_tile": bestEdgeTile, "best_m": bestM, "best_min_traversal": bestMinTraversal};
            return bestPathData;
        }

        let updateKnownPathIfBetter = (knownPathsList, previousTileX, previousTileY, newPathLength) => {
            let adjacentTiles = [[previousTileX+1,previousTileY], [previousTileX-1, previousTileY], [previousTileX, previousTileY+1], [previousTileX, previousTileY-1]];
            let previousTileInfo = knownPathsList.get(previousTileX, previousTileY);
            let exists = previousTileInfo != null;
            // If this doesn't exist then do nothing and return false
            if (!exists){
                return false;
            }

            let oldPathLength = previousTileInfo["path_length"];

            // If old path length was longer then replace it
            if (oldPathLength > newPathLength){
                // Update path length
                previousTileInfo["path_length"] = newPathLength;

                // Alert all paths that may be based on this one
                for (let adjacentTile of adjacentTiles){
                    let adjacentTileX = adjacentTile[0];
                    let adjacentTileY = adjacentTile[1];
                    updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength + 1);
                }
            }
            return true;
        }

        let exploreTiles = (bestEdgeTile) => {
            let bETileX = bestEdgeTile["tile_x"];
            let bETileY = bestEdgeTile["tile_y"];
            let adjacentTiles = [[bETileX+1,bETileY], [bETileX-1, bETileY], [bETileX, bETileY+1], [bETileX, bETileY-1]];

            for (let adjacentTile of adjacentTiles){
                let adjacentTileX = adjacentTile[0];
                let adjacentTileY = adjacentTile[1];
                // Check if walkable
                if (this.getScene().tileAtLocationHasAttribute(adjacentTileX, adjacentTileY, "no_walk")){ continue; }

                // It's valid

                let knownPathsList;
                let activePathsList;
                let tileInfo;

                // Determine which is applicable
                if (bestEdgeTile["from_start"]){
                    knownPathsList = knownPathsFromStart;
                    activePathsList = edgeTilesFromStart;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": true};
                }else{
                    knownPathsList = knownPathsFromEndWithAttribute;
                    activePathsList = edgeTilesFromAnEndWithAttribute;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": false, "origin_tile_x": bestEdgeTile["origin_tile_x"], "origin_tile_y": bestEdgeTile["origin_tile_y"]};
                }

                let newPathLength = knownPathsList.get(bETileX, bETileY)["path_length"] + 1;

                // This is known then update
                let known = updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength);

                // If it wasn't known then add
                if (!known){
                    // Add it to known paths
                    knownPathsList.set(adjacentTileX, adjacentTileY, {"path_length": newPathLength});
                    // Add to active path list
                    activePathsList.push(tileInfo);
                }
            }
        }

        // Loop through chunks looking for tiles with this attribute until they get too far away
        while (hasMoreChunksToCheck){
            // Add a ring of chunks around the original chunk at a specified distance
            addMoreChunks();
            // Increase distance for next ring
            distanceToNextChunkSet += 1;

            // Loop through all chunks to check
            for (let i = 0; i < chunksToCheck.length; i++){
                let chunkToCheck = chunksToCheck[i];
                let tilesInChunk = chunkToCheck.getPhysicalTiles();
                // Look at all tiles in 
                for (let [tile, tileX, tileY] of tilesInChunk){
                    if (tile === null){ continue; }
                    // Note: Assumes tile is walkable as well...
                    if (conditionFunction(tile)){
                        edgeTilesFromAnEndWithAttribute.push({"tile_x": tileX, "tile_y": tileY, "from_start": false, "origin_tile_x": tileX, "origin_tile_y": tileY});
                        knownPathsFromEndWithAttribute.set(tileX, tileY, {"path_length": 0});
                    }
                }
            }

            // Reset chunks to check
            chunksToCheck = [];

            // Create paths until it seems that more chunks are needed
            let considerCurrentChunksSufficient = true;
            let newChunkMinDistanceX = (distanceToNextChunkSet - 1) * CHUNK_SIZE + xDistanceToChunkSide;
            let newChunkMinDistanceY = (distanceToNextChunkSet - 1) * CHUNK_SIZE + yDistanceToChunkSide;
            let bestPossibleMDistanceWithNewChunks = newChunkMinDistanceX + newChunkMinDistanceY;

            // Captures the best possible length so far to reduce effort
            let bestPossibleLengthSoFar = null;

            while (considerCurrentChunksSufficient){
                // Assume this is the biggest number possible as a safety vlaue
                let bestPossibleMDistanceWithCurrentChunks = Number.MAX_SAFE_INTEGER;
                // If I can find no path from start then just quit
                if (edgeTilesFromStart.getLength() === 0){
                    return null;
                }
                // Else, if there are no paths from attribute tiles then
                else if (edgeTilesFromAnEndWithAttribute.getLength() > 0){
                    let bestPathData = selectBestPath(bestPossibleLengthSoFar);

                    // Update best m
                    bestPossibleMDistanceWithCurrentChunks = bestPathData["best_m"];

                    // If there is no possible route length then return null
                    if (bestPossibleMDistanceWithCurrentChunks > maxRouteLength && bestPossibleMDistanceWithNewChunks >= maxRouteLength){
                        return null;
                    }

                    // Update the best possible length with this set of chunks
                    bestPossibleLengthSoFar = bestPossibleMDistanceWithCurrentChunks;

                    // If the two paths met then distance is found. Note: With current design, the first full path is always the best possible path
                    if (bestPathData["best_min_traversal"] <= 1){
                        return bestPossibleMDistanceWithCurrentChunks;
                    }
                    let bestEdgeTile = bestPathData["edge_tile"];

                    // Explore
                    exploreTiles(bestEdgeTile);
                }

                // If we can only get a better possible path by adding more chunks then do it
                considerCurrentChunksSufficient = bestPossibleMDistanceWithNewChunks >= bestPossibleMDistanceWithCurrentChunks;
            }

            // Calculate min route distance to each of these new chunks. If NONE have distance <= maxRouteLength then return null
            if (bestPossibleMDistanceWithNewChunks > maxRouteLength){
                return null;
            }
        }

        // If no solution found
        return null;
    }

    /*
        Method Name: updateFromRouteDecision
        Method Parameters: 
            routeDecision:
                A route decision object
        Method Description: Updates bot-level decisions from a route decision
        Method Return: void
    */
    updateFromRouteDecision(routeDecision){
        let directions = ["up", "down", "left", "right"];
        for (let direction of directions){
            if (objectHasKey(routeDecision, direction)){
                this.botDecisionDetails["decisions"][direction] = routeDecision[direction];
                return;
            }
        }

        // Else no instruction to move anywhere so stop
        this.botDecisionDetails["decisions"]["breaking_stride"] = true;
    }

    /*
        Method Name: makeSwordFightingDecisions
        Method Parameters: None
        Method Description: Makes decisions in a sword fight
        Method Return: void
    */
    makeSwordFightingDecisions(){
        let mySword = this.getInventory().getSelectedItem();

        // Nothing to do if you can't see the enemy
        if (!this.hasDataToReactTo("enemy_location")){ return; }

        // Nothing to do if you are mid-swing
        if (mySword.isSwinging()){ return; }

        let enemyLocation = this.getDataToReactTo("enemy_location");
        let enemyInterpolatedTickCenterX = this.getDataToReactTo("enemy_interpolated_tick_center_x");
        let enemyInterpolatedTickCenterY = this.getDataToReactTo("enemy_interpolated_tick_center_y");
        let enemyTileX = enemyLocation["tile_x"];
        let enemyTileY = enemyLocation["tile_y"];

        // In tile units
        let estimatedCombatDistance = WTL_GAME_DATA["duel"]["ai"]["estimated_melee_distance"];

        let myTileX = this.getTileX();
        let myTileY = this.getTileY();

        let enemyXDisplacement = enemyTileX - myTileX;
        let enemyYDisplacement = enemyTileY - myTileY;
        let enemyDistance = calculateEuclideanDistance(myTileX, myTileY, enemyTileX, enemyTileY);
        // If enemy is outside of reasonable fighting distance
        if (enemyDistance > estimatedCombatDistance){
            // If blocking then stop
            if (mySword.isBlocking()){
                this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = false;
            }

            // Make a route to enemy and start going along it here
            if (!this.isBetweenTiles()){
                let routeToEnemy = this.generateShortestEvasiveRouteToPoint(enemyTileX, enemyTileY);
                let routeDecision = routeToEnemy.getDecisionAt(this.getTileX(), this.getTileY());
                this.updateFromRouteDecision(routeDecision);
            }
            
            return;
        }

        // Otherwise -> We are in sword range

        // Only continue if we are certain of the enemy location
        if (!this.getDataToReactTo("certain_of_enemy_location")){ return; }

        let facingDirectionUDLR = this.getFacingUDLRDirection();
        let directionToFaceTheEnemyAtCloseRange;

        // If the enemy is in the square to the right (or multiple)
        if (enemyYDisplacement === 0 && enemyXDisplacement > 0){
            directionToFaceTheEnemyAtCloseRange = "right";
        }
        // If the enemy is in the square to the left (or multiple)
        else if (enemyYDisplacement === 0 && enemyXDisplacement < 0) {
            directionToFaceTheEnemyAtCloseRange = "left";
        }
        // If the enemy is in the square above (or multiple)
        else if (enemyYDisplacement > 0){
            directionToFaceTheEnemyAtCloseRange = "up";
        }
        // If the enemy is in the square below (or multiple)
        else{
            directionToFaceTheEnemyAtCloseRange = "down";
        }

        let swingRange = mySword.getSwingRange();
        let swingHitbox = new CircleHitbox(swingRange);
        let hitCenterX = mySword.getSwingCenterX();
        let hitCenterY = mySword.getSwingCenterY();
        swingHitbox.update(hitCenterX, hitCenterY);
        let playerDirection = this.getFacingDirection();
        let swingAngle = Sword.getSwingAngle(playerDirection);
        let rangeRAD = mySword.getSwingAngleRangeRAD();
        let startAngle = rotateCCWRAD(swingAngle, rangeRAD/2);
        let endAngle = rotateCWRAD(swingAngle, rangeRAD/2);
        let enemyWidth = this.getDataToReactTo("enemy_width");
        let enemyHeight = this.getDataToReactTo("enemy_height");
        let enemyHitbox = new RectangleHitbox(enemyWidth, enemyHeight, enemyInterpolatedTickCenterX-(enemyWidth-1)/2, enemyInterpolatedTickCenterY+(enemyHeight-1)/2);
        let canCurrentlyHitEnemyWithSword = Sword.swordCanHitCharacter(enemyHitbox, swingHitbox, hitCenterX, hitCenterY, swingAngle, swingRange, startAngle, endAngle)

        let enemySwinging = this.getDataToReactTo("can_see_enemy") && this.getDataToReactTo("enemy_holding_a_sword") && this.getDataToReactTo("enemy_swinging_a_sword");

        let mySwordTimeToSwingTicks = Math.ceil(mySword.getSwingTimeMS()/calculateMSBetweenTicks());

        // If enemy is swinging
        if (enemySwinging){
            // If already blocking then continue
            if (mySword.isBlocking()){
                this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = true;
            }else{
                // Not currently blocking so think about it
                let enemySwordStartTick = this.getDataToReactTo("enemy_sword_swing_start_tick");
                let enemySwordTotalSwingTimeTicks = Math.max(1, Math.floor(this.getDataToReactTo("enemy_sword_swing_time_ms") / calculateMSBetweenTicks()));
                let timeUntilEnemySwordSwingIsFinished = this.getCurrentTick() - (enemySwordStartTick + enemySwordTotalSwingTimeTicks);
                let enemySwordSwingCompletionProportion = (this.getCurrentTick() - enemySwordStartTick) / enemySwordTotalSwingTimeTicks;

                // If the enemy sword will take longer to finish it's swing than I can swing
                if (timeUntilEnemySwordSwingIsFinished > mySwordTimeToSwingTicks && canCurrentlyHitEnemyWithSword){
                    // Run a trial to determine whether or not to swing
                    this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"] = this.randomEventManager.getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["expected_swing_delay_ms"]);
                }else{
                    // Consider blocking
                    let deflectProportionRequired = WTL_GAME_DATA["sword_data"]["blocking"]["deflect_proportion"];
                    if (enemySwordSwingCompletionProportion >= deflectProportionRequired){
                        let stunProportionRequired = WTL_GAME_DATA["sword_data"]["blocking"]["stun_deflect_proportion"];
                        // If you can stun then definitely block
                        if (enemySwordSwingCompletionProportion >= stunProportionRequired){
                            this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = true;
                        }
                        // You can block but you won't be stunning
                        else{
                            let numTriesToStunExpected = Math.max(1, Math.floor(enemySwordTotalSwingTimeTicks * WTL_GAME_DATA["sword_data"]["blocking"]["stun_deflect_proportion"]));
                            let numTriesToDeflectOrStunExpected = Math.max(1, Math.floor(enemySwordTotalSwingTimeTicks * WTL_GAME_DATA["sword_data"]["blocking"]["deflect_proportion"]));
                            let numTriesToDeflectExpected = Math.max(1, numTriesToDeflectOrStunExpected - numTriesToStunExpected);
                            
                            let probabilityOfDeflectAttempt = WTL_GAME_DATA["duel"]["ai"]["regular_deflect_attempt_probability"];
                            
                            let doBlock = this.randomEventManager.getResultIndependent(probabilityOfDeflectAttempt, numTriesToDeflectExpected);
                            // Randomly decide wether or not to block
                            if (doBlock){
                                this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = true;
                            }
                        }
                    }

                    // Face enemy

                    // If I'm facing the wrong way then try to face the right way
                    if (facingDirectionUDLR != directionToFaceTheEnemyAtCloseRange){
                        this.botDecisionDetails["decisions"][directionToFaceTheEnemyAtCloseRange] = true;
                        // Just turning not moving
                        this.botDecisionDetails["decisions"]["breaking_stride"] = true;
                    }
                }
            }
        }else{
            // Neither me or opponent is swinging
            // Don't block when they aren't swinging
            if (mySword.isBlocking()){
                this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = false;
            }

            // Make sure you can swing at and hit bot (if not then move)

            // If I'm not moving and I'm on the same tile as the enemy and neither of us are swinging then move away a bit
            if (!this.isBetweenTiles() && myTileX === enemyTileX && myTileY === enemyTileY){
                if (this.randomEventManager.getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["adjust_close_duel_delay_ms"])){
                    this.decideToMoveToAdjacentTile();
                }
            }else{
                let isAdjacentToEnemy = Math.abs(enemyTileX - myTileX) + Math.abs(enemyTileY - myTileY) === 1;
                let tryAndPivot = false;

                // If we aren't adjacent then maybe try and pivot to be in a proper position to attack
                if (!isAdjacentToEnemy && !this.isBetweenTiles()){
                    tryAndPivot = this.randomEventManager.getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["expected_adjacent_pivot_ms"]);
                }

                // If we wouldn't hit the enemy from our current position
                if (!canCurrentlyHitEnemyWithSword || tryAndPivot){
                    // We know that we are close enough so it must be wrongly facing
                    
                    // Face enemy

                    // If I'm facing the wrong way then try to face the right way
                    if (facingDirectionUDLR != directionToFaceTheEnemyAtCloseRange){
                        this.botDecisionDetails["decisions"][directionToFaceTheEnemyAtCloseRange] = true;
                        // Just turning not moving
                        this.botDecisionDetails["decisions"]["breaking_stride"] = true;
                    }
                    // If I'm facing correctly and I still can't hit the opponent
                    else{
                        // Make a route to enemy and start going along it here
                        if (!this.isBetweenTiles()){
                            let routeToEnemy = this.generateShortestEvasiveRouteToPoint(enemyTileX, enemyTileY);
                            let routeDecision = routeToEnemy.getDecisionAt(this.getTileX(), this.getTileY());
                            this.updateFromRouteDecision(routeDecision);

                            // Consider sprinting
                            this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["sword_fight_min_stamina_preference"]);
                        }
                    }


                }
                // You can hit the enemy
                else{
                    // Swing at bot

                    // If I'm facing the wrong way then try to face the right way
                    if (facingDirectionUDLR != directionToFaceTheEnemyAtCloseRange){
                        this.botDecisionDetails["decisions"][directionToFaceTheEnemyAtCloseRange] = true;
                        // Just turning not moving
                        this.botDecisionDetails["decisions"]["breaking_stride"] = true;
                    }
                    
                    // Run a trial to determine whether or not to swing
                    this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"] = this.randomEventManager.getResultExpectedMS(WTL_GAME_DATA["duel"]["ai"]["expected_swing_delay_ms"]);
                }
            }
        }
    }

    /*
        Method Name: decideToMoveToAdjacentTile
        Method Parameters: None
        Method Description: Make a decision to move to a random adjacent tile
        Method Return: void
    */
    decideToMoveToAdjacentTile(){
        let options = [];
        if (this.canWalkOnTile(this.getTileX(), this.getTileY() + 1)){
            options.push("up");
        }
        if (this.canWalkOnTile(this.getTileX(), this.getTileY() - 1)){
            options.push("down");
        }
        if (this.canWalkOnTile(this.getTileX() - 1, this.getTileY())){
            options.push("left");
        }
        if (this.canWalkOnTile(this.getTileX() + 1, this.getTileY())){
            options.push("right");
        }
        // If there are options
        if (options.length > 0){
            let chosenOption = options[this.getRandom().getIntInRangeInclusive(0, options.length - 1)];
            this.botDecisionDetails["decisions"][chosenOption] = true;
        }
        // Consider sprinting
        this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["sword_fight_min_stamina_preference"]);
    }

    /*
        Method Name: makeSwordDecisions
        Method Parameters: None
        Method Description: Make character-level decisions on sword fighting
        Method Return: void
    */
    makeSwordDecisions(){
        let tryingToSwing = this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"];
        let tryingToBlock = this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"];
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
            "trying_to_block": tryingToBlock
        });
    }

    /*
        Method Name: makePistolDecisions
        Method Parameters: None
        Method Description: Make character-level decisions on shooting a pistol
        Method Return: void
    */
    makePistolDecisions(){
        let tryingToAim = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"];
        let tryingToShoot = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"];
        let tryingToReload = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"];
        let tryingToCancelReload = this.botDecisionDetails["decisions"]["weapons"]["gun"]["cancel_reload"];
        let aimingAngleRAD = this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"];
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": aimingAngleRAD,
            "cancel_reload": tryingToCancelReload
        });
    }

    /*
        Method Name: makeMusketDecisions
        Method Parameters: None
        Method Description: Make character-level decisions on using a musket
        Method Return: void
    */
    makeMusketDecisions(){
        let tryingToAim = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"];
        let tryingToShoot = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"];
        let tryingToReload = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"];
        let tryingToCancelReload = this.botDecisionDetails["decisions"]["weapons"]["gun"]["cancel_reload"];
        let togglingBayonetEquip = this.botDecisionDetails["decisions"]["weapons"]["musket"]["toggling_bayonet_equip"];
        let tryingToStab = this.botDecisionDetails["decisions"]["weapons"]["musket"]["trying_to_stab"];
        let aimingAngleRAD = this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"];
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "toggling_bayonet_equip": togglingBayonetEquip,
            "trying_to_reload": tryingToReload,
            "trying_to_stab": tryingToStab,
            "aiming_angle_rad": aimingAngleRAD
        });
    }

    /*
        Method Name: makeMovementDecisions
        Method Parameters: None
        Method Description: Makes character-level decisions on movement
        Method Return: void
    */
    makeMovementDecisions(){
        this.decisions["up"] = this.botDecisionDetails["decisions"]["up"];
        this.decisions["down"] = this.botDecisionDetails["decisions"]["down"];
        this.decisions["left"] = this.botDecisionDetails["decisions"]["left"];
        this.decisions["right"] = this.botDecisionDetails["decisions"]["right"];
        this.decisions["sprint"] = this.botDecisionDetails["decisions"]["sprint"];
        this.decisions["breaking_stride"] = this.botDecisionDetails["decisions"]["breaking_stride"];
    }

    /*
        Method Name: isHuman
        Method Parameters: None
        Method Description: Checks if this is human
        Method Return: boolean
    */
    isHuman(){ return false; }
}