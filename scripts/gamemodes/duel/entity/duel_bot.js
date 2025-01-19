class DuelBot extends DuelCharacter {
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

    getEnemyID(){
        return this.getEnemy().getID();
    }

    notifyOfGunshot(shooterTileX, shooterTileY, enemyFacingMovementDirection){
        this.inputPerceptionData("enemy_location", {"tile_x": shooterTileX, "tile_y": shooterTileY});
        this.inputPerceptionData("enemy_facing_movement_direction", enemyFacingMovementDirection);
    }

    isDisabled(){
        return this.disabled;
    }

    getDataToReactTo(dataKey){
        return this.perception.getDataToReactTo(dataKey, this.getCurrentTick());
    }

    hasDataToReactTo(dataKey){
        return this.perception.hasDataToReactTo(dataKey, this.getCurrentTick());
    }

    inputPerceptionData(dataKey, dataValue){
        this.perception.inputData(dataKey, dataValue, this.getCurrentTick());
    }

    tick(){
        if (this.isDead()){ return; }
        this.perceieve();
        super.tick();
    }

    perceieve(){
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
            let enemyInterpolatedTickCenterX = enemy.getInterpolatedTickCenterX();
            let enemyInterpolatedTickCenterY = enemy.getInterpolatedTickCenterY();
            let enemyInterpolatedTickLeftX = enemy.getInterpolatedTickX();
            let enemyInterpolatedTickTopY = enemy.getInterpolatedTickY();
            this.inputPerceptionData("enemy_x_velocity", enemy.getXVelocity());
            this.inputPerceptionData("enemy_y_velocity", enemy.getYVelocity());
            this.inputPerceptionData("enemy_width", enemyWidth);
            this.inputPerceptionData("enemy_height", enemyHeight);
            this.inputPerceptionData("enemy_interpolated_tick_center_x", enemyInterpolatedTickCenterX);
            this.inputPerceptionData("enemy_interpolated_tick_center_y", enemyInterpolatedTickCenterY);
            this.inputPerceptionData("enemy_interpolated_tick_left_x", enemyInterpolatedTickLeftX);
            this.inputPerceptionData("enemy_interpolated_tick_top_y", enemyInterpolatedTickTopY);
            this.inputPerceptionData("enemy_location", {"tile_x": enemy.getTileX(), "tile_y": enemy.getTileY()});
        }
        
    }

    resetBotDecisions(){
        // TODO: Something that copies decisions are beginning and pastes it here
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

    botDecisions(){
        // Decide if you want to change state
        this.determineState();

        // Execute state decisions
        this.makeDecisionsBasedOnDecidedState();
    }

    actOnDecisions(){
        if (this.getGamemode().isOver()){ return; }
        super.actOnDecisions();
    }

    getAction(){
        return this.botDecisionDetails["action"];
    }

    setAction(newActionName){
        this.actionName = newActionName;
    }

    cancelAction(){
        this.actionName = null;
    }

    hasAction(){
        return this.botDecisionDetails["action"] === null;
    }

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

    hasNoWeapons(){
        let numberOfWeapons = this.getInventory().getNumberOfContents();
        return numberOfWeapons === 0;
    }

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

    hasWeaponEquipped(){
        if (!this.getInventory().hasSelectedItem()){ return false; }
        let equippedItem = this.getInventory().getSelectedItem();
        return (equippedItem instanceof Gun) || (equippedItem instanceof MeleeWeapon);
    }

    getState(){
        return this.botDecisionDetails["state"];
    }

    changeToState(newStateName){
        this.botDecisionDetails["state"] = newStateName;

        this.setInitialConditions(newStateName);
    }

    setInitialConditions(newStateName){
        // Prepare the state data json object
        this.botDecisionDetails["state_data"] = {};
        if (newStateName === "searching_for_enemy"){
            this.prepareSearchingForEnemyState();
        }
    }

    getStateData(){
        return this.botDecisionDetails["state_data"];
    }

    prepareSearchingForEnemyState(){
        let stateDataJSON = this.getStateData();
        stateDataJSON["route"] = null;
        stateDataJSON["last_checked_enemy_x"] = null;
        stateDataJSON["last_checked_enemy_y"] = null;
    }


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

        debugger;
        throw new Error("DuelBot failed to find enemy.");
    }

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

    getMaxSearchPathLength(){
        return Math.ceil(this.getGamemode().getEnemyVisibilityDistance() / Math.sqrt(2)); // Basically the idea is you have a 1 / 1 / sqrt(2) triangle and you add up the two 1s to get the search range
        // return Math.ceil(Math.sqrt(2 * Math.pow(WTL_GAME_DATA["duel"]["area_size"], 2)));
    }

    generateRouteToSearchForEnemy(){
        let tileRange = this.getMaxSearchPathLength();
        let tilesToEndAt = this.exploreAvailableTiles(tileRange, this.getTileX(), this.getTileY());
        // If no tiles to move to (including current)
        if (tilesToEndAt.length === 0){
            throw new Error("Unable to generate paths.")
        } 

        let chosenIndex = this.getRandom().getIntInRangeInclusive(0, tilesToEndAt.length-1);
        let tileChosen = tilesToEndAt[chosenIndex];
        return Route.fromPath(tileChosen["shortest_path"]);
    }

    getRandom(){
        return this.gamemode.getRandom();
    }

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
        while (sampleAngle < leftAngle){
            anglesToCheck.push(sampleAngle);
            sampleAngle += samplePrecision;
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
        let targets = [{"center_x": enemyCenterX, "center_y": enemyCenterY, "width": enemy.getWidth(), "height": enemy.getHeight(), "entity": null}];
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

    getRandomEventManager(){
        return this.randomEventManager;
    }

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

                    // Allow bot to see the magnitude of current offset
                    let mySwayOffsetMagnitude = Math.abs(myGun.getCurrentAngleOffsetRAD());
                    let myChanceOfHittingAShot = calculateRangeOverlapProportion(speculationResult["right_angle"], speculationResult["left_angle"], speculationResult["best_angle"] - mySwayOffsetMagnitude/2, speculationResult["best_angle"] + mySwayOffsetMagnitude/2);
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
                        if (dataJSON["enemy_tile_x"] === enemyTileX && dataJSON["enemy_tile_y"] && dataJSON["tile_x"] === myTileX && dataJSON["tile_y"] === myTileY){
                            needToCalculate = false;
                            newTile = dataJSON["tile"];
                        }
                    }

                    // if I need to calculate a new tile to stand on
                    if (needToCalculate){
                        newTile = this.determineTileToStandAndShootFrom(enemyTileX, enemyTileY, myGun);
                        // update saved data
                        let dataJSON = {
                            "tile_x": myTileX,
                            "tile_y": myTileY,
                            "enemy_tile_x": enemyTileX,
                            "enemy_tile_y": enemyTileY,
                            "tile": newTile
                        }
                        this.temporaryOperatingData.set("tile_to_stand_and_shoot_from", dataJSON);
                    }
                    
                    let newTileIsTheSame = newTile["tile_x"] === myTileX && newTile["tile_y"] === myTileY;
                
                    // I can hit the enemy if I start aiming
                    if (canHitEnemyIfIAimAndShoot && newTileIsTheSame){
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
                    else{
                        // Create a new route
                        stateDataJSON["current_objective"] = "move_to_shooting_position";
                        stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                        stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                        stateDataJSON["route"] = Route.fromPath(newTile["shortest_path"]);

                        // Move based on this new route
                        this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(myTileX, myTileY));
                        // Consider sprinting
                        this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_shot_stamina_preference"]);
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
                        let myChanceOfHittingAShot = calculateRangeOverlapProportion(speculationResult["right_angle"], speculationResult["left_angle"], speculationResult["best_angle"] - mySwayOffsetMagnitude/2, speculationResult["best_angle"] + mySwayOffsetMagnitude/2);
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
                            if (dataJSON["enemy_tile_x"] === enemyTileX && dataJSON["enemy_tile_y"] && dataJSON["tile_x"] === myTileX && dataJSON["tile_y"] === myTileY){
                                needToCalculate = false;
                                newTile = dataJSON["tile"];
                            }
                        }

                        // if I need to calculate a new tile to stand on
                        if (needToCalculate){
                            newTile = this.determineTileToStandAndShootFrom(enemyTileX, enemyTileY, myMusket);
                            // update saved data
                            let dataJSON = {
                                "tile_x": myTileX,
                                "tile_y": myTileY,
                                "enemy_tile_x": enemyTileX,
                                "enemy_tile_y": enemyTileY,
                                "tile": newTile
                            }
                            this.temporaryOperatingData.set("tile_to_stand_and_shoot_from", dataJSON);
                        }
                        
                        let newTileIsTheSame = newTile["tile_x"] === myTileX && newTile["tile_y"] === myTileY;
                    
                        // I can hit the enemy if I start aiming
                        if (canHitEnemyIfIAimAndShoot && newTileIsTheSame){
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
                        else{
                            // Create a new route
                            stateDataJSON["current_objective"] = "move_to_shooting_position";
                            stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                            stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                            stateDataJSON["route"] = Route.fromPath(newTile["shortest_path"]);

                            // Move based on this new route
                            this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(myTileX, myTileY));
                            // Consider sprinting
                            this.botDecisionDetails["decisions"]["sprint"] = (!this.isSprinting() && this.staminaBar.isFull()) || (this.isSprinting() && this.staminaBar.getStaminaProportion() > WTL_GAME_DATA["duel"]["ai"]["positioning_for_shot_stamina_preference"]);
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
                        let enemyWidth = this.getDataToReactTo("enemy_width");
                        let enemyHeight = this.getDataToReactTo("enemy_height");
                        let enemyCXAtEndOfStab = enemyInterpolatedTickCenterX + enemyXVelocity * stabTimeMS/1000;
                        let enemyCYAtEndOfStab = enemyInterpolatedTickCenterY + enemyYVelocity * stabTimeMS/1000;
                        let myLXAtEndOfStab = this.getInterpolatedTickX() + this.getXVelocity() * stabTimeMS/1000;
                        let myTYAtEndOfStab = this.getInterpolatedTickY() + this.getYVelocity() * stabTimeMS/1000;
                        let pos = myMusket.getSimulatedGunEndPosition(myLXAtEndOfStab, myTYAtEndOfStab, this.getFacingDirection(), angleToEnemyCenter);
                        let endOfGunAtTimeX = pos["x"];
                        let endOfGunAtTimeY = pos["y"];
                        let targets = [{"center_x": enemyCXAtEndOfStab, "center_y": enemyCYAtEndOfStab, "width": enemyWidth, "height": enemyHeight, "entity": this.getEnemy()}];
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

    determineTileToRunawayTo(enemyTileX, enemyTileY){
        let allTiles = this.exploreAvailableTiles(this.getMaxSearchPathLength(), this.getTileX(), this.getTileY());

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

        let myTileX = this.getTileX();
        let myTileY = this.getTileY();

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
                angleRangeToHitEnemy = calculateAngleDiffCCWRAD(speculation["left_angle"], speculation["right_angle"]);
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
            if (isNaN(score)){
                debugger;
            }
        }

        let biggestToSmallestScore = (tile1, tile2) => {
            return tile2["score"] - tile1["score"];
        }

        // Sort scores big to small
        allTiles.sort(biggestToSmallestScore);

        let chosenTile = allTiles[0];

        // If we are on the best one then return it
        if (chosenTile["tile_x"] === this.getTileX() && chosenTile["tile_y"] === this.getTileY()){
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

    determineTileToReloadFrom(enemyTileX, enemyTileY){
        let allTiles = this.exploreAvailableTiles(this.getMaxSearchPathLength(), this.getTileX(), this.getTileY());

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

        let myTileX = this.getTileX();
        let myTileY = this.getTileY();

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
                angleRangeToHitEnemy = calculateAngleDiffCCWRAD(speculation["left_angle"], speculation["right_angle"]);
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

        let biggestToSmallestScore = (tile1, tile2) => {
            return tile2["score"] - tile1["score"];
        }

        // Sort scores big to small
        allTiles.sort(biggestToSmallestScore);

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


    generateShortestEvasiveRouteToPoint(endTileX, endTileY, routeLengthLimit=Number.MAX_SAFE_INTEGER){
        let startTileX = this.getTileX();
        let startTileY = this.getTileY();
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

    determineTileToStandAndShootFrom(enemyTileX, enemyTileY, gun){
        let pathLength = this.getMaxSearchPathLength();
        let allTiles = this.exploreAvailableTiles(pathLength, this.getTileX(), this.getTileY());

        let distanceToSearchForMultiCover = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["multi_cover_search_route_distance"];
        let distanceToSearchForSingleCover = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["single_cover_search_route_distance"];
        let distanceToSearchForPhysicalCover = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["physical_cover_search_route_distance"];

        // Combination multipliers
        let fromMeRouteMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_me_route_mult"]; // positive
        let fromEnemyRouteMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_enemy_route_mult"]; // positive
        let fromEnemyMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_enemy_mult"]; // negative
        let angleRangeMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["angle_range_mult"]; // negative 
        let nearestSingleCoverMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_single_cover_mult"]; // positive
        let nearestMultiCoverMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_multi_cover_mult"]; // positive
        let nearestPhysicalCoverMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_physical_cover_mult"]; // positive
        let canHitMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["can_hit_mult"]; // negative
        let onTileMult = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["on_tile_multiplier"]; // positive

        let scene = this.getScene();
        let playerLeftX = scene.getXOfTile(this.getTileX());
        let playerTopY = scene.getYOfTile(this.getTileY());
        let enemyCenterXAtTile = scene.getCenterXOfTile(enemyTileX);
        let enemyCenterYAtTile = scene.getCenterYOfTile(enemyTileY);

        let enemyVisibilityDistance = this.getGamemode().getEnemyVisibilityDistance();

        let singleCoverFunction = (tile) => {
            return tile.hasAttribute("multi_cover") && calculateEuclideanDistance(enemyTileX, enemyTileY, tile.getTileX(), tile.getTileY()) > enemyVisibilityDistance;
        }

        let multiCoverFunction = (tile) => {
            return tile.hasAttribute("multi_cover");
        }

        let myID = this.getID();

        // If direct line from enemyTile to tile hits a physical tile then this applies
        let physicalCoverFunction = (tileX, tileY) => {
            let targetPositionX = scene.getCenterXOfTile(tileX);
            let targetPositionY = scene.getCenterYOfTile(tileY);
            let targets = [{"center_x": targetPositionX, "center_y": targetPositionY, "width": WTL_GAME_DATA["general"]["tile_size"], "height": WTL_GAME_DATA["general"]["tile_size"], "entity": null}];
            return this.getScene().findInstantCollisionForProjectileWithTargets(enemyCenterXAtTile, enemyCenterYAtTile, displacementToRadians(tileX-enemyTileX, tileY-enemyTileY), enemyVisibilityDistance, targets)["collision_type"] === "physical_tile";
        }

        let foundATileThatICanHitFrom = false;

        // Score each tile
        for (let tile of allTiles){
            let distanceFromMe = tile["shortest_path"].length;
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            let tileCenterX = scene.getCenterXOfTile(tileX);
            let tileCenterY = scene.getCenterYOfTile(tileY);

            //let routeDistanceFromEnemy = 0;
            let routeDistanceFromEnemy = this.generateShortestRouteFromPointToPoint(tileX, tileY, enemyTileX, enemyTileY).getMovementDistance();

            let realDistanceFromEnemy = calculateEuclideanDistance(enemyCenterXAtTile, enemyCenterYAtTile, tileCenterX, tileCenterY);

            let angleToTileCenter = displacementToRadians(enemyTileX - tileX, enemyTileY - tileY);
            // Note: Assuming they will face the estimated best way
            let visualDirectionToFace = angleToBestFaceDirection(angleToTileCenter);
            let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, visualDirectionToFace, angleToTileCenter);
            let gunEndX = pos["x"];
            let gunEndY = pos["y"];
            let bulletRange = gun.getBulletRange();
            //let speculation = {"can_hit": false}
            let speculation = this.speculateOnHittingEnemy(bulletRange, enemyCenterXAtTile, enemyCenterYAtTile, gunEndX, gunEndY, visualDirectionToFace);
            let angleRangeToHitEnemy = 0;
            let canHitEnemyValue = 0;
            if (speculation["can_hit"]){
                canHitEnemyValue = 1;
                foundATileThatICanHitFrom = true;
                angleRangeToHitEnemy = calculateAngleDiffCCWRAD(speculation["left_angle"], speculation["right_angle"]);
            }

            // Single cover outside of enemy visibility
            let shortestDistanceToSingleCover = this.calculateShortestRouteDistanceToTileWithCondition(tileX, tileY, singleCoverFunction, distanceToSearchForSingleCover);
            if (shortestDistanceToSingleCover === null){ shortestDistanceToSingleCover = distanceToSearchForSingleCover; }
            let shortestDistanceToMultiCover = this.calculateShortestRouteDistanceToTileWithCondition(tileX, tileY, multiCoverFunction, distanceToSearchForMultiCover);
            if (shortestDistanceToMultiCover === null){ shortestDistanceToMultiCover = distanceToSearchForMultiCover; }
            // Physical cover distance
            let shortestDistanceToPhyiscalCover = this.calculateShortestRouteDistanceToTileWithCondition(tileX, tileY, physicalCoverFunction, distanceToSearchForPhysicalCover);
            if (shortestDistanceToPhyiscalCover === null){ shortestDistanceToPhyiscalCover = distanceToSearchForPhysicalCover; }

            let onTile = (this.getTileX() === tileX && this.getTileY() === tileY) ? 1 : 0;

            let score = 0;

            // Add linear combination

            score += distanceFromMe * fromMeRouteMult;
            score += routeDistanceFromEnemy * fromEnemyRouteMult;
            score += realDistanceFromEnemy * fromEnemyMult;
            score += canHitEnemyValue * canHitMult;
            score += angleRangeToHitEnemy * angleRangeMult;
            score += shortestDistanceToSingleCover * nearestSingleCoverMult;
            score += shortestDistanceToMultiCover * nearestMultiCoverMult;
            score += shortestDistanceToPhyiscalCover * nearestPhysicalCoverMult;
            score += onTile * onTileMult;

            // Add the score
            tile["score"] = score;
            if (isNaN(score)){
                debugger;
            }
        }

        let biggestToSmallestScore = (tile1, tile2) => {
            return tile2["score"] - tile1["score"];
        }

        // Sort scores big to small
        allTiles.sort(biggestToSmallestScore);

        let chosenTile = allTiles[0];

        // If I can't find a tile to hit the enemy from
        if (!foundATileThatICanHitFrom){
            let routeToEnemy = this.generateShortestEvasiveRouteToPoint(enemyTileX, enemyTileY);
            if (routeToEnemy.getMovementDistance() >= 1){
                // Get a tile in the path to enemy
                let tile = routeToEnemy.getTile(1);
                tile["shortest_path"] = [{"tile_x": this.getTileX(), "tile_y": this.getTileY()}, {"tile_x": tile["tile_x"], "tile_y": tile["tile_y"]}];
                return tile;
            }
            return routeToEnemy.getMovementDistance()
        }

        // If we are on the best one then return it
        if (chosenTile["tile_x"] === this.getTileX() && chosenTile["tile_y"] === this.getTileY()){
            return chosenTile;
        }

        // Else from current tile and pick randomly
        let xStart = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_x_start"];
        let xEnd = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_x_end"];
        let f = WTL_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_f"];
        let randomIndex = biasedIndexSelection(xStart, xEnd, f, allTiles.length, this.getRandom());
        chosenTile = allTiles[randomIndex];

        return chosenTile;
    }

    calculateShortestRouteDistanceToTileWithCondition(startTileX, startTileY, conditionFunction, maxRouteLength){
        if (maxRouteLength === undefined){
            debugger;
            throw new Error("Please supply a valid max route length.");
        }

        let scene = this.getScene();
        let chunks = scene.getChunks();

        let startingChunkX = Chunk.tileToChunkCoordinate(startTileX);
        let startingChunkY = Chunk.tileToChunkCoordinate(startTileY);
        let startingChunk = chunks.get(startingChunkX, startingChunkY);

        let CHUNK_SIZE = WTL_GAME_DATA["general"]["chunk_size"];
        let xDistanceToChunkSide = CHUNK_SIZE - Math.abs(startTileX);
        let yDistanceToChunkSide = CHUNK_SIZE - Math.abs(startTileY);

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
                    let startToEndDistance = edgeTileFromStartLength + edgeTileFromEndLength + minTraversal + 1; // the +1 is because both path lengths do not include the start tile and the end tile should be included in the total length
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
        let infCount = 0;
        while (hasMoreChunksToCheck){
            // Add a ring of chunks around the original chunk at a specified distance
            addMoreChunks();
            // Increase distance for next ring
            distanceToNextChunkSet += 1;
            if (infCount++ > 5000){ debugger; }

            // Loop through all chunks to check
            for (let i = 0; i < chunksToCheck.length; i++){
                let chunkToCheck = chunksToCheck[i];
                let tilesInChunk = chunkToCheck.getPhysicalTiles();
                // Look at all tiles in 
                for (let [tile, tileX, tileY] of tilesInChunk){
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
                    // Update the best possible length with this set of chunks
                    bestPossibleLengthSoFar = bestPossibleMDistanceWithCurrentChunks;

                    // If the two paths met then distance is found. Note: With current design, the first full path is always the best possible path
                    if (bestPathData["best_min_traversal"] === 1){
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

    makeSwordDecisions(){
        let tryingToSwing = this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"];
        let tryingToBlock = this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"];
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
            "trying_to_block": tryingToBlock
        });
    }

    isHuman(){return true;}

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

    makeMovementDecisions(){
        this.decisions["up"] = this.botDecisionDetails["decisions"]["up"];
        this.decisions["down"] = this.botDecisionDetails["decisions"]["down"];
        this.decisions["left"] = this.botDecisionDetails["decisions"]["left"];
        this.decisions["right"] = this.botDecisionDetails["decisions"]["right"];
        this.decisions["sprint"] = this.botDecisionDetails["decisions"]["sprint"];
        this.decisions["breaking_stride"] = this.botDecisionDetails["decisions"]["breaking_stride"];
    }

    isHuman(){ return false; }
}