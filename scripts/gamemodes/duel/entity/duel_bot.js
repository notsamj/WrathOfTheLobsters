class DuelBot extends DuelCharacter {
    constructor(gamemode, model){
        super(gamemode, model);
        this.perception = new BotPerception();
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
                "sprint": false
            },
            "weapons": {
                "sword": { 
                    "trying_to_swing_sword": false,
                    "trying_to_block": false
                }
            }
        }
    }

    getCurrentTick(){
        return this.gamemode.getCurrentTick();
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
        this.perceieve();
        super.tick();
    }

    perceieve(){
        let enemy = this.getEnemy();
        let canSeeEnemy = this.canSee(enemy);

        this.inputPerceptionData("can_see_enemy", canSeeEnemy);

        if (canSeeEnemy){
            let enemyTileX = enemy.getTileX();
            let enemyTileY = enemy.getTileY();
            this.inputPerceptionData("enemy_location", {"tile_x": enemyTileX, "tile_y": enemyTileY});

            let enemyInventory = enemy.getInventory();
            let enemyHoldingAnItem = enemyInventory.hasSelectedItem();
            let enemyHoldingAWeapon = false;
            let enemyHoldingARangedWeapon = false;
            let enemyHoldingAMeleeWeapon = false;
            let enemyHoldingASword = false;
            let enemyItem;
            if (enemyHoldingAnItem){
                enemyItem = enemyInventory.getSelectedItem();
                enemyHoldingAWeapon = enemyItem instanceof Weapon;
                enemyHoldingARangedWeapon = enemyHoldingAWeapon && (enemyItem instanceof RangedWeapon);
                enemyHoldingAMeleeWeapon = enemyHoldingAWeapon && (enemyItem instanceof MeleeWeapon);
                enemyHoldingASword = enemyHoldingAMeleeWeapon && (enemyItem instanceof Sword);
            }
            this.inputPerceptionData("enemy_holding_a_weapon", enemyHoldingAWeapon);
            this.inputPerceptionData("enemy_holding_a_ranged_weapon", enemyHoldingARangedWeapon);
            this.inputPerceptionData("enemy_holding_a_melee_weapon", enemyHoldingAMeleeWeapon);
            this.inputPerceptionData("enemy_holding_a_sword", enemyHoldingASword);

            if (enemyHoldingASword){
                let sword = enemyItem;
                this.inputPerceptionData("enemy_swinging_a_sword", sword.isSwinging());
            }
        }
    }

    resetBotDecisions(){
        this.botDecisionDetails["decisions"]["select_slot"] = null;
        this.botDecisionDetails["decisions"]["up"] = false;
        this.botDecisionDetails["decisions"]["down"] = false;
        this.botDecisionDetails["decisions"]["left"] = false;
        this.botDecisionDetails["decisions"]["right"] = false;
        this.botDecisionDetails["decisions"]["sprint"] = false;
    }
    
    makeDecisions(){
        this.resetDecisions();
        this.resetBotDecisions();
        this.botDecisions();
        this.makeMovementDecisions();
        this.inventory.makeDecisions();
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }
    }

    botDecisions(){
        // Decide if you want to change state
        this.determineState();

        // Execute state decisions
        this.makeDecisionsBasedOnDecidedState();

        /*
        if (this.botDecisionDetails["state"] === "starting"){
            this.pickAStartingWeapon();
        }

        // Run check before acting
        if (!this.canSee(this.getEnemy())){
            this.botDecisionDetails["state"] = "searching_for_enemy";
        }else{
            this.botDecisionDetails["state"] = "fighting_enemy";
        }

        // Act
        if (this.botDecisionDetails["state"] === "searching_for_enemy"){
            this.searchForEnemy();
        }else if (this.botDecisionDetails["state"] === "fighting_enemy"){
            this.makeFightingDecisions();
        }
        */
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

        // Else determine which on to pick (TODO)
    }

    determineState(){
        let state = this.getState();
        if (state === "starting"){
            // when starting you just want to equip a weapon
            this.changeToState("equip_a_weapon");
        }else if (state === "equip_a_weapon"){
            // If done equipping a weapon then start looking for the enemy
            if (this.hasWeaponEquipped()){
                if (this.getDataToReactTo("can_see_enemy")){
                    this.changeToState("searching_for_enemy");
                }else{
                    this.changeToState("fighting_enemy");
                }
            }else{
                this.equipAWeapon();
            }
        }else if (state === "searching_for_enemy"){
            if (this.getDataToReactTo("can_see_enemy")){
                this.changeToState("fighting_enemy");
            }
        }else if (state === "fighting_enemy"){
            if (!this.getDataToReactTo("can_see_enemy")){
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
    }

    exploreAvailableTiles(range){
        let tiles = [];
        let startTileX = this.tileX;
        let startTileY = this.tileY;

        let addAdjacentTilesAsUnchecked = (tileX, tileY, pathToTile, startToEnd) => {
            tryToAddTile(tileX+1, tileY, pathToTile, startToEnd);
            tryToAddTile(tileX-1, tileY, pathToTile, startToEnd);
            tryToAddTile(tileX, tileY+1, pathToTile, startToEnd);
            tryToAddTile(tileX, tileY-1, pathToTile, startToEnd);
        }

        let getTileIndex = (tileX, tileY) => {
            for (let i = 0; i < tiles.length; i++){
                if (tiles[i]["tile_x"] == tileX && tiles[i]["tile_y"] == tileY){
                    return i;
                }
            }
            return -1;
        }

        let tileAlreadyChecked = (tileX, tileY, startToEnd) => {
            let tileIndex = getTileIndex(tileX, tileY);
            if (tileIndex == -1){ return false; }
            return tiles[tileIndex]["checked"][startToEnd.toString()];
        }

        let tileCanBeWalkedOn = (tileX, tileY) => {
            return !this.getScene().tileAtLocationHasAttribute(tileX, tileY, "no_walk");
        }

        let tileTooFar = (pathToTileLength) => {
            return pathToTileLength + 1 > range;
        }

        let tryToAddTile = (tileX, tileY, pathToTile, startToEnd=true) => {
            if (!tileCanBeWalkedOn(tileX, tileY)){ return; }
            if (tileAlreadyChecked(tileX, tileY, startToEnd)){ return; }
            if (tileTooFar(pathToTile.length)){ return; }
            let tileIndex = getTileIndex(tileX, tileY);
            let newPath;
            if (startToEnd){
                newPath = appendLists(pathToTile, [{"tile_x": tileX, "tile_y": tileY}]);
            }else{
                newPath = appendLists([{"tile_x": tileX, "tile_y": tileY}], pathToTile);
            }
            // If the tile has not been found then add
            if (tileIndex == -1){
                tiles.push({
                    "tile_x": tileX,
                    "tile_y": tileY,
                    "checked": {
                        "true": false,
                        "false": false
                    },
                    "path_direction": startToEnd,
                    "shortest_path": newPath
                });
            }else{
                let tileObj = tiles[tileIndex];
                if (tileObj["path_direction"] != startToEnd){
                    tileObj["checked"][startToEnd.toString()] = true;
                    let forwardPath;
                    let backwardPath;
                    // If function called on a forward path
                    if (startToEnd){
                        forwardPath = copyArray(newPath);
                        backwardPath = copyArray(tileObj["shortest_path"]);
                    }else{
                        forwardPath = copyArray(tileObj["shortest_path"]);
                        backwardPath = copyArray(newPath);
                    }

                    // Shift the first element out from backward path to avoid having the same tile twice
                    backwardPath.shift();

                    let combinedPath = appendLists(forwardPath, backwardPath);
                    let bestPath = getBestPath();
                    let newLength = combinedPath.length;
                    if (bestPath == null || bestPath.length > newLength){
                        // Set start tile path
                        startTile["path_direction"] = false; 
                        startTile["shortest_path"] = combinedPath;
                        // Set end tile path
                        endTile["path_direction"] = true; 
                        endTile["shortest_path"] = combinedPath;
                    }
                }
                // see if the path is worth replacing
                if (tileObj["shortest_path"].length > newPath.length){
                    tileObj["shortest_path"] = newPath;
                    tileObj["path_direction"] = startToEnd;
                }
            }
        }

        let hasUncheckedTiles = () => {
            for (let tile of tiles){
                // if tile hasn't been checked in its current direction
                if (!tile["checked"][tile["path_direction"].toString()]){
                    return true;
                }
            }
            return false;
        }

        let pickTile = () => {
            let chosenTile = null;
            for (let tile of tiles){
                if (!tile["checked"][tile["path_direction"].toString()]){
                    chosenTile = tile;
                    break;
                }
            }
            return chosenTile;
        }

        // Add first tile
        tryToAddTile(startTileX, startTileY, []);
        let startTile = tiles[0];
        while (hasUncheckedTiles()){
            let currentTile = pickTile();
            currentTile["checked"][currentTile["path_direction"].toString()] = true;
            addAdjacentTilesAsUnchecked(currentTile["tile_x"], currentTile["tile_y"], currentTile["shortest_path"], currentTile["path_direction"]);
        }
        return tiles;
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

        throw new Error("DuelBot failed to find enemy.");
    }

    makeFightingDecisions(){
        // TODO: Movement and stuff
        // TODO: Determine other stuff
        let equippedWeaponType = "sword"; // TODO: Determine this (also maybe change weapons)

        if (equippedWeaponType === "sword"){
            this.makeSwordFightingDecisions();
        }
    }

    searchForEnemy(){
        let stateDataJSON = this.getStateData();
        // Check if you can see the enemy otherwise move around
        let route = stateDataJSON["route"];

        // if not route (or at an end) -> make one
        // Note: Assume route is not empty
        if (route === null || (route.getLastTile()["tile_x"] === this.getTileX() && route.getLastTile()["tile_y"] === this.getTileY())){
            route = this.generateRouteToSearchForEnemy();
            stateDataJSON["route"] = route;
        }

        let updateFromMoveDecisions = (moveObj) => {
            let directions = ["up", "down", "left", "right"];
            for (let direction of directions){
                if (objectHasKey(moveObj, direction)){
                    this.botDecisionDetails["decisions"][direction] = moveObj[direction];
                    return;
                }
            }
        }
        // Move according to the route
        updateFromMoveDecisions(route.getDecisionAt(this.getTileX(), this.getTileY()));
    }

    generateRouteToSearchForEnemy(){
        let tileRange = RETRO_GAME_DATA["duel"]["ai"]["search_path_max_length"];
        let tilesToEndAt = this.exploreAvailableTiles(tileRange);
        // If no tiles to move to (including current)
        if (tilesToEndAt.length === 0){
            throw new Error("Unable to generate paths.")
        }
        let tileChosen = tilesToEndAt[this.getRandom().getIntInRangeInclusive(0, tilesToEndAt.length-1)];
        if (tileChosen === undefined){ debugger; }
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

    makeSwordFightingDecisions(){
        let mySword = this.getInventory().getSelectedItem();
        if (!(mySword instanceof Sword)){
            throw new Error("Failed to find sword");
        }

        // Nothing to do if you can't see the enemy
        if (!this.perception.hasDataToReactTo("enemy_location")){ return; }

        // Nothing to do if you are mid-swing
        if (this.isSwinging()){ return; }

        let enemyLocation = this.perception.getDataToReactTo("enemy_location");
        let enemyTileX = enemyLocation["tile_x"];
        let enemyTileY = enemyLocation["tile_y"];

        // In tile units
        let estimatedCombatDistance = RETRO_GAME_DATA["duel"]["ai"]["estimated_melee_distance"];

        let myTileX = this.getTileX();
        let myTileY = this.getTileY();

        let enemyDistance = calculateEuclidianDistance(myTileX, myTileY, enemyTileX, enemyTileY);

        // If enemy is outside of reasonable fighting distance
        if (enemyDistance > estimatedCombatDistance){
            // If blocking then stop
            if (mySword.isBlocking()){
                this.botDecisionDetails["weapons"]["sword"]["trying_to_block"] = false;
            }

            // No sword action at the moment
            // TODO: Do I need actions?
            /*if (this.hasAction()){
                this.cancelAction();
            }*/

            // TODO: Move to enemy

            return;
        }

        // Otherwise -> We are in sword range


        // Only continue if we can see the enemy
        if (!this.getDataToReactTo("can_see_enemy")){ return; }

        let enemySwinging = this.getDataToReactTo("enemy_swinging_a_sword");

        let mySwordTimeToSwingTicks = Math.ceil(mySword.getSwingTimeMS()/calculateMSBetweenTicks());

        // If enemy is swinging
        if (enemySwinging){
            let enemySwordStartTick = this.getDataToReactTo("enemy_sword_start_tick");
            let enemySwordTotalSwingTimeTicks = Math.max(1, Math.floor(this.getDataToReactTo("enemy_sword_start_tick")));
            let timeUntilEnemySwordSwingIsFinished = this.getCurrentTick() - (enemySwordStartTick + enemySwordTotalSwingTimeTicks);
            let enemySwordSwingCompletionProportion = (this.getCurrentTick() - enemySwordStartTick) / enemySwordTotalSwingTimeTicks;

            // If the enemy sword will take longer to finish it's swing than I can swing
            if (timeUntilEnemySwordSwingIsFinished > mySwordTimeToSwingTicks){
                this.botDecisionDetails["weapons"]["sword"]["trying_to_swing_sword"] = true;
                return;
            }

            // TODO: Try blocking
        }

        // So I am not swinging, enemy is not swinging. Check if my swing would hit the enemy. If so -> swing
        // TODO

        // TODO: IF I can't hit enemy from where I am standing then move to enemy


        /*// Set default
        this.botDecisionDetails["weapons"]["sword"]["trying_to_swing_sword"] = false;
        this.botDecisionDetails["weapons"]["sword"]["trying_to_block"] = false;

        // TODO: Check if currently blocking
        if (sword.isBlocking()){

        }

        // Don't make decisions mid-swing
        if (sword.isSwinging()){
            return;
        }
        let enemy = this.getEnemy();

        // TODO: Determine can I strike enemy with my sword
        // TODO: Determine can enemy strike me with their sword (if they are carrying one)

        // TODO: Make decisions based on this
        this.botDecisionDetails["weapons"]["sword"]["trying_to_block"] = true;*/
    }

    makeSwordDecisions(){
        let tryingToSwing = this.botDecisionDetails["weapons"]["sword"]["trying_to_swing_sword"];
        let tryingToBlock = this.botDecisionDetails["weapons"]["sword"]["trying_to_block"];
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
            "trying_to_block": tryingToBlock
        });
    }

    isHuman(){return true;}

    makePistolDecisions(){
        let tryingToAim = false;
        let tryingToShoot = false;
        let tryingToReload = false;
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": 0
        });
    }

    makeMusketDecisions(){
        let tryingToAim = false;
        let tryingToShoot = false;
        let togglingBayonetEquip = false;
        let tryingToReload = false;
        let tryingToStab = false;
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "toggling_bayonet_equip": togglingBayonetEquip,
            "trying_to_reload": tryingToReload,
            "trying_to_stab": tryingToStab,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    makeMovementDecisions(){
        this.decisions["up"] = this.botDecisionDetails["decisions"]["up"];
        this.decisions["down"] = this.botDecisionDetails["decisions"]["down"];
        this.decisions["left"] = this.botDecisionDetails["decisions"]["left"];
        this.decisions["right"] = this.botDecisionDetails["decisions"]["right"];
        this.decisions["sprint"] = this.botDecisionDetails["decisions"]["sprint"];
    }

    isHuman(){ return false; }
}