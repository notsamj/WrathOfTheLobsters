class DuelBot extends DuelCharacter {
    constructor(gamemode, model, botExtraDetails){
        super(gamemode, model);
        this.perception = new BotPerception(this, Math.ceil(botExtraDetails["reaction_time_ms"] / calculateMSBetweenTicks()));
        this.disabled = botExtraDetails["disabled"];
        this.randomEventManager = new RandomEventManager(this.getRandom());
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
                        "trying_to_reload": false
                    }
                }
            }
        }
    }

    getEnemyID(){
        return this.getEnemy().getID();
    }

    notifyOfGunshot(shooterTileX, shooterTileY){
        this.inputPerceptionData("enemy_location", {"tile_x": shooterTileX, "tile_y": shooterTileY});
    }

    isDisabled(){
        return this.disabled;
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
        if (this.isDead()){ return; }
        this.perceieve();
        super.tick();
    }

    perceieve(){
        // Focused on enemy

        let enemy = this.getEnemy();
        let canSeeEnemy = this.canSee(enemy);

        this.inputPerceptionData("can_see_enemy", canSeeEnemy);

        if (canSeeEnemy){
            let enemyTileX = enemy.getTileX();
            let enemyTileY = enemy.getTileY();
            let enemyWidth = enemy.getWidth();
            let enemyHeight = enemy.getHeight();
            let enemyInterpolatedTickCenterX = enemy.getInterpolatedTickCenterX();
            let enemyInterpolatedTickCenterY = enemy.getInterpolatedTickCenterY();
            this.inputPerceptionData("enemy_x_velocity", enemy.getXVelocity());
            this.inputPerceptionData("enemy_y_velocity", enemy.getYVelocity());
            this.inputPerceptionData("enemy_width", enemyWidth);
            this.inputPerceptionData("enemy_height", enemyHeight);
            this.inputPerceptionData("enemy_interpolated_tick_center_x", enemyInterpolatedTickCenterX);
            this.inputPerceptionData("enemy_interpolated_tick_center_y", enemyInterpolatedTickCenterY);
            this.inputPerceptionData("enemy_location", {"tile_x": enemyTileX, "tile_y": enemyTileY});

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
            this.inputPerceptionData("enemy_holding_a_melee_weapon", enemyHoldingAMeleeWeapon);
            this.inputPerceptionData("enemy_holding_a_sword", enemyHoldingASword);

            if (enemyHoldingASword){
                let sword = enemyItem;
                let swordSwinging = sword.isSwinging();
                this.inputPerceptionData("enemy_sword_swing_time_ms", sword.getSwingTimeMS());
                this.inputPerceptionData("enemy_swinging_a_sword", swordSwinging);
                if (swordSwinging){
                    this.inputPerceptionData("enemy_sword_swing_start_tick", sword.getSwingStartTick());
                }
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
        this.botDecisionDetails["decisions"]["breaking_stride"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = false;
    }
    
    makeDecisions(){
        if (this.getGamemode().isOver()){ return; }
        if (this.isDisabled()){ return; }
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
        stateDataJSON["last_checked_enemy_x"] = null;
        stateDataJSON["last_checked_enemy_y"] = null;
    }

 exploreAvailableTilesOld(range){
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

    exploreAvailableTiles(maxRouteLength, startTileX, startTileY){
        if (maxRouteLength === undefined){
            debugger;
            throw new Error("Please supply a valid max route length.");
        }

        if (startTileX === undefined){
            debugger;
            throw new Error("Please supply a start tile x.");
        }

        if (startTileY === undefined){
            debugger;
            throw new Error("Please supply a start tile y.");
        }

        let knownTiles = new NotSamXYSortedArrayList();
        let edgeTiles = new NotSamLinkedList();
            
        // Init
        edgeTiles.push({"tile_x": startTileX, "tile_y": startTileY});
        knownTiles.set(startTileX, startTileY, {"tile_x": startTileX, "tile_y": startTileY, "shortest_path": [{"tile_x": startTileX, "tile_y": startTileY}]});

        let selectTile = () => {
            let chosenIndex = null;
            let bestPathLength = null;

            // Find the tile with the lowest path length
            for (let i = 0; i < edgeTiles.getLength(); i++){
                let edgeTile = edgeTiles.get(i);
                let edgeTileX = edgeTile["tile_x"];
                let edgeTileY = edgeTile["tile_y"];
                let pathLength = knownTiles.get(edgeTileX, edgeTileY)["shortest_path"].length;
                if (bestPathLength === null || pathLength < bestPathLength){
                    chosenIndex = i;
                }
            }
            console.log("Popping", edgeTiles.get(chosenIndex))
            return edgeTiles.pop(chosenIndex);
        }

        let exploreTiles = (bestTile) => {
            let bestTileX = bestTile["tile_x"];
            let bestTileY = bestTile["tile_y"];
            let bestTilePath = knownTiles.get(bestTileX, bestTileY)["shortest_path"];
            console.log("Exploring", bestTileX, bestTileY)
            // If we can't add any tiles without exceeding the best path length then don't continue
            if (bestTilePath.length === maxRouteLength){
                console.log("stopping", bestTileX, bestTileY, bestTilePath, bestTilePath.length)
                return;
            }

            let adjacentTiles = [[bestTileX+1,bestTileY], [bestTileX-1, bestTileY], [bestTileX, bestTileY+1], [bestTileX, bestTileY-1]];

            for (let adjacentTile of adjacentTiles){
                let adjacentTileX = adjacentTile[0];
                let adjacentTileY = adjacentTile[1];
                // Check if walkable
                if (this.getScene().tileAtLocationHasAttribute(adjacentTileX, adjacentTileY, "no_walk")){
                    console.log("nowalk", adjacentTileX, adjacentTileY )
                    continue;
                }
                // If it is known then ignore
                if (knownTiles.has(adjacentTileX, adjacentTileY)){
                    console.log("no", adjacentTileX, adjacentTileY)
                    continue;
                }

                // Add to known tiles
                //console.log("new path", appendLists(bestTilePath, [{"tile_x": bestTile["tile_x"], "tile_y": bestTile["tile_y"]}]))
                knownTiles.set(adjacentTileX, adjacentTileY, {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "shortest_path": appendLists(bestTilePath, [{"tile_x": bestTile["tile_x"], "tile_y": bestTile["tile_y"]}])});

                // Add to edge tiles
                console.log("adding", adjacentTileX, adjacentTileY)
                edgeTiles.push({"tile_x": adjacentTileX, "tile_y": adjacentTileY});
            }
        }

        // Keep looping while edge tiles exist
        while (edgeTiles.getLength() > 0){
            let currentTile = selectTile();
            exploreTiles(currentTile);
        }
        debugger;
        return knownTiles.toList();
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
        // TODO
        return {"change": false}
    }

    makeFightingDecisions(){
        // TODO: Movement and stuff?

        let equippedItem = this.getInventory().getSelectedItem();
        if (equippedItem === null){ throw new Error("DuelBot failed to find equipped item"); }


        // TODO: Determine other stuff

        // TODO: Chance weapon if needed
        let changeWeaponResult = this.considerChangingWeapons();
        if (changeWeaponResult["change"]){
            // TODO: Change weapon
            return;
        }

        // Determine what to do with held weapon
        if (equippedItem instanceof Sword){
            this.makeSwordFightingDecisions();
        }else if (equippedItem instanceof Gun){
            this.makeGunFightingDecisions();
        }else{
            throw new Error("DuelBot has unknown weapon equipped");
        }
    }

    searchForEnemy(){
        let stateDataJSON = this.getStateData();
        // Check if you can see the enemy otherwise move around
        let route = stateDataJSON["route"];


        // If there is an enemy location that may be worth checking
        if (this.hasDataToReactTo("enemy_location")){
            let enemyLocation = this.getDataToReactTo("enemy_location");
            let enemyTileX = enemyLocation["tile_x"];
            let enemyTileY = enemyLocation["tile_y"];
            // If this location hasn't been checked 
            if (enemyTileX != stateDataJSON["last_checked_enemy_x"] || enemyTileY != stateDataJSON["last_checked_enemy_y"]){
                stateDataJSON["last_checked_enemy_x"] = enemyTileX;
                stateDataJSON["last_checked_enemy_y"] = enemyTileY;
                let tilesToEndAt = this.exploreAvailableTiles(this.getMaxSearchPathLength(), this.getTileX(), this.getTileY());
                // Try and find a path to the last enemy location
                for (let tileToEndAt of tilesToEndAt){
                    if (tileToEndAt["tile_x"] === enemyTileX && tileToEndAt["tile_y"] === enemyTileY){
                        route = Route.fromPath(tileToEndAt["shortest_path"]);
                        stateDataJSON["route"] = route;
                        break;
                    }
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
    }

    getMaxSearchPathLength(){
        return Math.ceil(this.getGamemode().getEnemyVisibilityDistance() / Math.sqrt(2)); // Basically the idea is you have a 1 / 1 / sqrt(2) triangle and you add up the two 1s to get the search range
        // return Math.ceil(Math.sqrt(2 * Math.pow(RETRO_GAME_DATA["duel"]["area_size"], 2)));
    }

    generateRouteToSearchForEnemy(){
        let tileRange = this.getMaxSearchPathLength();
        let tilesToEndAt = this.exploreAvailableTiles(tileRange, this.getTileX(), this.getTileY());
        let tilesToEndAtOld = this.exploreAvailableTilesOld(tileRange, this.getTileX(), this.getTileY());
        console.log("new")
        console.log(tilesToEndAt)
        console.log("old")
        console.log(tilesToEndAtOld)
        stop();
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

    speculateOnHittingEnemy(bulletRange, enemyCenterX, enemyCenterY, gunEndX, gunEndY){
        let anglesToCheck = [];

        let result = {
            "can_hit": false,
            "left_angle": null,
            "right_angle": null,
            "best_angle": null
        }

        let distance = calculateEuclideanDistance(enemyCenterX, enemyCenterY, gunEndX, gunEndY);

        let directAngleRAD = displacementToRadians(enemyCenterX - gunEndX, enemyCenterY-gunEndY);
        // Add angle directly to enemy center
        anglesToCheck.push(directAngleRAD);

        let inQ1 = angleBetweenCCWRAD(directAngleRAD, toRadians(0), toRadians(90));
        let inQ2 = angleBetweenCCWRAD(directAngleRAD, toRadians(90), toRadians(180));
        let inQ3 = angleBetweenCCWRAD(directAngleRAD, toRadians(180), toRadians(270));
        
        let leftAngle;
        let rightAngle;
        let paddingSize = 1;
        let leftSideX = enemyCenterX - RETRO_GAME_DATA["general"]["tile_size"] + paddingSize; // 1 padding;
        let rightSideX = enemyCenterX + RETRO_GAME_DATA["general"]["tile_size"] - paddingSize; // 1 padding;
        let bottomSideY = enemyCenterY - RETRO_GAME_DATA["general"]["tile_size"] + paddingSize; // 1 padding;
        let topSideY = enemyCenterY + RETRO_GAME_DATA["general"]["tile_size"] - paddingSize; // 1 padding;
       
        // If the direct angle is in quadrant 1
        if (inQ1){
            leftAngle = displacementToRadians(leftSideX-gunEndX, topSideY-gunEndY);
            rightAngle = displacementToRadians(rightSideX-gunEndX, bottomSideY-gunEndY);
        }
        // If the direct angle is in quadrant 2
        else if (inQ2){
            leftAngle = displacementToRadians(leftSideX-gunEndX, bottomSideY-gunEndY);
            rightAngle = displacementToRadians(rightSideX-gunEndX, topSideY-gunEndY);
        }
        // If the direct angle is in quadrant 3
        else if (inQ3){
            leftAngle = displacementToRadians(rightSideX-gunEndX, bottomSideY-gunEndY);
            rightAngle = displacementToRadians(leftSideX-gunEndX, topSideY-gunEndY);
        }
        // Else its in quadrant 4
        else{
            leftAngle = displacementToRadians(rightSideX-gunEndX, topSideY-gunEndY);
            rightAngle = displacementToRadians(leftSideX-gunEndX, bottomSideY-gunEndY);
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

        // Check for errors (in case I screwed up)
        if (leftAngle-rightAngle < 0){
            debugger;
            throw new Error("I must've broke something: " + leftAngle + " " + rightAngle);
        }

        let samplePrecision = toRadians(RETRO_GAME_DATA["duel"]["ai"]["aiming_precision_degrees"]);

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
        let enemy = this.getEnemy();
        let targets = [{"center_x": enemyCenterX, "center_y": enemyCenterY, "width": enemy.getWidth(), "height": enemy.getHeight(), "entity": null}];
        for (let angle of anglesToCheck){
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

    makeGunFightingDecisions(){
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
            let speculationResult = this.speculateOnHittingEnemy(myGun.getBulletRange(), enemyInterpolatedTickCenterX, enemyInterpolatedTickCenterY, gunEndX, gunEndY);
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
                    let mySwayOffsetMagnitude = Math.abs(this.getCurrentAngleOffsetRAD());
                    let myChanceOfHittingAShot = calculateRangeOverlapProportion(speculationResult["right_angle"], speculationResult["left_angle"], speculationResult["best_angle"] - mySwayOffsetMagnitude/2, speculationResult["best_angle"] + mySwayOffsetMagnitude/2);
                    let shotAConstant = RETRO_GAME_DATA["duel"]["ai"]["shot_take_function_a_constant"];
                    let shotBConstant = RETRO_GAME_DATA["duel"]["ai"]["shot_take_function_b_constant"];
                    let secondsToShootWithThisChance = getDeclining1OverXOf(shotAConstant, shotBConstant, myChanceOfHittingAShot);
                    let decideToShoot = this.getRandomEventManager().getResultExpectedMS(secondsToShootWithThisChance * 1000);
                    this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] = decideToShoot;
                }else{
                    // I am aiming but I can't hit so I will stop
                    this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = this.getRandomEventManager().getResultExpectedMS(RETRO_GAME_DATA["duel"]["ai"]["stop_aiming_no_target_ms"]);
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
                    let b4 = Date.now();
                    let newTile = this.determineTileToStandAndShootFrom(enemyTileX, enemyTileY, myGun);
                    console.log("after", Date.now()-b4)
                    let newTileIsTheSame = newTile["tile_x"] === this.getTileX() && newTile["tile_y"] === this.getTileY();
                    
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
                        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = this.getRandomEventManager().getResultExpectedMS(RETRO_GAME_DATA["duel"]["ai"]["good_shot_try_to_aim_delay_ms"]);
                    }
                    // Move to new tile
                    else{
                        // Create a new route
                        stateDataJSON["current_objective"] = "move_to_shooting_position";
                        stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                        stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                        stateDataJSON["route"] = Route.fromPath(newTile["shortest_path"]);

                        // Move based on this new route
                        this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
                    }
                }
            }

            /*
            // TODO Keep this? Figure out how to augment current plans?

            // Check the opponent is holding a loaded gun
            let enemyHoldingALoadedGun = this.getDataToReactTo("enemy_holding_a_loaded_gun");

            // If they are holding a loaded gun
            if (enemyHoldingALoadedGun){

            }*/

        }
        // Gun is NOT loaded
        else{
            if (!myGun.isReloading()){
                let stateDataJSON = this.getStateData();
                let movingToReloadPosition = objectHasKey(stateDataJSON, "current_objective") && stateDataJSON["current_objective"] === "move_to_reload_position";
                // Next ones are only calculated conditionally
                let reloadPositionIsBasedOnCurrentData = movingToReloadPosition && stateDataJSON["relevant_enemy_tile_x"] === enemyTileX && stateDataJSON["relevant_enemy_tile_y"] === enemyTileY;
                let routeLastTile = reloadPositionIsBasedOnCurrentData ? (stateDataJSON["route"].getLastTile()) : null;
                let notAtEndOfRoute = reloadPositionIsBasedOnCurrentData && (routeLastTile["tile_x"] != this.getTileX() || routeLastTile["tile_y"] != this.getTileY());

                // If our current objective is to move to a reload position
                if (movingToBetterPosition && betterPositionIsBasedOnCurrentData && notAtEndOfRoute){
                    this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
                }
                // We are not currently persuing a pre-determined route
                else{
                    let newTile = this.determineTileToReloadFrom(enemyTileX, enemyTileY);

                    let newTileIsTheSame = newTile["tile_x"] === this.getTileX() && newTile["tile_y"] === this.getTileY();
                    
                    // If new tile is where we currently are then start reloading
                    if (newTileIsTheSame){
                        // Start reloading
                        this.botDecisionDetails["decisions"]["weapons"]["gun"]["reload"] = true;
                    }else{
                        // Create a new route
                        stateDataJSON["current_objective"] = "move_to_reload_position";
                        stateDataJSON["relevant_enemy_tile_x"] = enemyTileX;
                        stateDataJSON["relevant_enemy_tile_y"] = enemyTileY;
                        stateDataJSON["route"] = Route.fromPath(newTile["shortest_path"]);

                        // Move based on this new route
                        this.updateFromRouteDecision(stateDataJSON["route"].getDecisionAt(this.getTileX(), this.getTileY()));
                    }
                }
            }else{
                // TODO: Decide whether to cancel reload
            }

        }
    }

    determineTileToReloadFrom(enemyTileX, enemyTileY){
        let allTiles = this.exploreAvailableTiles(this.getMaxSearchPathLength(), this.getTileX(), this.getTileY());

        // Combination scores
        let fromEnemyRouteMult = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["from_enemy_route_mult"]; // positive
        let fromEnemyMult = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["from_enemy_mult"]; // positive
        let canHitMult = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["can_hit_mult"]; // negative
        let angleRangeMult = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["angle_range_mult"]; // negative
        let inSingleCoverMult = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["in_single_cover_mult"]; // positive 
        let inMultiCoverMult = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["in_multi_cover_mult"]; // positive

        let scene = this.getScene();
        let enemyLeftX = scene.getXOfTile(enemyTileX);
        let enemyTopY = scene.getYOfTile(enemyTileY);
        let enemyCenterXAtTile = scene.getCenterXOfTile(enemyTileX);
        let enemyCenterYAtTile = scene.getCenterYOfTile(enemyTileY);

        let enemyVisibilityDistance = this.getGamemode().getEnemyVisibilityDistance();

        let singleCoverFunction = (tileX, tileY) => {
            return scene.tileAtLocationHasAttribute(tileX, tileY, "single_cover") && calculateEuclideanDistance(enemyTileX, enemyTileY, tileX, tileY) > enemyVisibilityDistance;
        }

        let multiCoverFunction = (tileX, tileY) => {
            // Return true if this is multi cover and the enemy IS NOT in it
            return scene.tileAtLocationHasAttribute(tileX, tileY, "multi_cover") && !(scene.tileAtLocationHasAttribute(enemyTileX, enemyTileY, "multi_cover") && scene.tilesInSameMultiCover(enemyTileX, enemyTileY, tileX, tileY));
        }

        // Score each tile
        for (let tile of allTiles){
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            let tileCenterX = scene.getCenterXOfTile(tileX);
            let tileCenterY = scene.getCenterYOfTile(tileY);

            let routeDistanceFromEnemy = this.generateShortestRouteFromPointToPoint(tileX, tileY, enemyTileX, enemyTileY);

            let realDistanceFromEnemy = calculateEuclideanDistance(enemyCenterXAtTile, enemyCenterYAtTile, tileCenterX, tileCenterY);

            let angleToTileCenter = displacementToRadians(tileX - enemyTileX, tileY - enemyTileY);
            // Note: Assuming they will face the estimated best way
            let visualDirectionToFace = angleToBestFaceDirection(angleToTileCenter);
            let pos = gun.getSimulatedGunEndPosition(enemyLeftX, enemyTopY, visualDirectionToFace, angleToTileCenter);
            let gunEndX = pos["x"];
            let gunEndY = pos["y"];
            let bulletRange = gun.getBulletRange();
            let speculation = this.speculateOnHittingEnemy(bulletRange, tileCenterX, tileCenterY, gunEndX, gunEndY);
            let angleRangeToHitEnemy = 0;
            let canBeHitByEnemyValue = 0;
            if (speculation["can_hit"]){
                canBeHitByEnemyValue = 1;
                angleRangeToHitEnemy = speculation["left_angle"] - speculation["right_angle"];
            }

            // Single cover outside of enemy visibility
            let inSingleCoverValue = (this.getScene().tileAtLocationHasAttribute(tileX, tileY, "single_cover") ? 1 : 0);

            let inMutliCoverValue = (this.getScene().tileAtLocationHasAttribute(tileX, tileY, "multi_cover") ? 1 : 0);
        
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
        let xStart = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["shoot_tile_selection_x_start"];
        let xEnd = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["shoot_tile_selection_x_end"];
        let f = RETRO_GAME_DATA["duel"]["ai"]["route_tile_section"]["shoot_tile_selection_f"];
        let randomIndex = biasedIndexSelection(xStart, xEnd, f, allTiles.length, this.getRandom());
        chosenTile = allTiles[randomIndex];

        return chosenTile;
    }

    determineTileToStandAndShootFrom(enemyTileX, enemyTileY, gun){
        let pathLength = this.getMaxSearchPathLength();
        //let allTiles = this.exploreAvailableTiles(pathLength);

        let distanceToSearchForMultiCover = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["multi_cover_search_route_distance"];
        let distanceToSearchForSingleCover = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["single_cover_search_route_distance"];
        let distanceToSearchForPhysicalCover = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["physical_cover_search_route_distance"];

        // Combination multipliers
        let fromMeRouteMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_me_route_mult"];
        let fromEnemyRouteMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_enemy_route_mult"];
        let fromEnemyMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["from_enemy_mult"];
        let angleRangeMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["angle_range_mult"];
        let nearestSingleCoverMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_single_cover_mult"];
        let nearestMultiCoverMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_multi_cover_mult"];
        let nearestPhysicalCoverMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["nearest_physical_cover_mult"];
        let canHitMult = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["can_hit_mult"];

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
            let targets = [{"center_x": targetPositionX, "center_y": targetPositionY, "width": RETRO_GAME_DATA["general"]["tile_size"], "height": RETRO_GAME_DATA["general"]["tile_size"], "entity": null}];
            return this.getScene().findInstantCollisionForProjectileWithTargets(enemyCenterXAtTile, enemyCenterYAtTile, displacementToRadians(tileX-enemyTileX, tileY-enemyTileY), enemyVisibilityDistance, targets)["collision_type"] === "physical_tile";
        }

        // Score each tile
        for (let tile of allTiles){
            let distanceFromMe = tile["shortest_path"].length;
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            let tileCenterX = scene.getCenterXOfTile(tileX);
            let tileCenterY = scene.getCenterYOfTile(tileY);

            let routeDistanceFromEnemy = 0;
            //let routeDistanceFromEnemy = this.generateShortestRouteFromPointToPoint(tileX, tileY, enemyTileX, enemyTileY);

            let realDistanceFromEnemy = calculateEuclideanDistance(enemyCenterXAtTile, enemyCenterYAtTile, tileCenterX, tileCenterY);

            let angleToTileCenter = displacementToRadians(enemyTileX - tileX, enemyTileY - tileY);
            // Note: Assuming they will face the estimated best way
            let visualDirectionToFace = angleToBestFaceDirection(angleToTileCenter);
            let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, visualDirectionToFace, angleToTileCenter);
            let gunEndX = pos["x"];
            let gunEndY = pos["y"];
            let bulletRange = gun.getBulletRange();
            //let speculation = {"can_hit": false}
            let speculation = this.speculateOnHittingEnemy(bulletRange, enemyCenterXAtTile, enemyCenterYAtTile, gunEndX, gunEndY);
            let angleRangeToHitEnemy = 0;
            let canHitEnemyValue = 0;
            if (speculation["can_hit"]){
                canHitEnemyValue = 1;
                angleRangeToHitEnemy = speculation["left_angle"] - speculation["right_angle"];
            }

            // Single cover outside of enemy visibility
            let shortestDistanceToSingleCover = this.calculateShortestRouteDistanceToTileWithCondition(tileX, tileY, singleCoverFunction, distanceToSearchForSingleCover);
            if (shortestDistanceToSingleCover === null){ shortestDistanceToSingleCover = distanceToSearchForSingleCover; }
            let shortestDistanceToMultiCover = this.calculateShortestRouteDistanceToTileWithCondition(tileX, tileY, multiCoverFunction, distanceToSearchForMultiCover);
            if (shortestDistanceToMultiCover === null){ shortestDistanceToMultiCover = distanceToSearchForMultiCover; }
            // Physical cover distance
            let shortestDistanceToPhyiscalCover = this.calculateShortestRouteDistanceToTileWithCondition(tileX, tileY, physicalCoverFunction, distanceToSearchForPhysicalCover);
            if (shortestDistanceToPhyiscalCover === null){ shortestDistanceToPhyiscalCover = distanceToSearchForPhysicalCover; }
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

            // Add the score
            tile["score"] = score;
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
        let xStart = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_x_start"];
        let xEnd = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_x_end"];
        let f = RETRO_GAME_DATA["duel"]["ai"]["shoot_tile_selection"]["shoot_tile_selection_f"];
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

        let CHUNK_SIZE = RETRO_GAME_DATA["general"]["chunk_size"];
        let xDistanceToChunkSide = CHUNK_SIZE - Math.abs(startTileX);
        let yDistanceToChunkSide = CHUNK_SIZE - Math.abs(startTileY);

        // If there is no chunk at specified location
        if (startingChunk === null){
            throw new Error("Chunk at starting location not found");
        }

        // Start by finding all the tiles with attribute in nearby chunks

        let chunksToCheck = [startingChunk];
        let knownPathsFromStart = new NotSamXYSortedArrayList();
        let knownPathsFromEnd = new NotSamXYSortedArrayList();
        let pathsWithAttribute = new NotSamLinkedList();
        let pathsFromStart = new NotSamLinkedList([{"tile_x": startTileX, "tile_y": startTileY, "from_start": true}]);
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
                    Find path with attribute closest to the start name it pEnd
                    Then find path from start closest to pEnd and name it pStart
                    If calculateManhattanDistance(pStart, start) <= calculateManhattanDistance(pEnd, end)
                        return pStart
                    else:
                        return pEnd
            */
            let pEnd = null;
            let pStart = null;
            let bestM = null;
            let bestMinTraversal = null;
            let pStartIndex = null;
            let pEndIndex = null;

            let foundBestPossibleDistance = false;

            // Find the two tiles that could connect and form the shortest possible path
            for (let i = pathsWithAttribute.getLength() - 1; i >= 0; i--){
                let endPath = pathsWithAttribute.get(i);
                let endPathTileX = endPath["tile_x"];
                let endPathTileY = endPath["tile_y"];
                let endPathLength = knownPathsFromEnd.get(endPathTileX, endPathTileY)["path_length"];
                for (let j = pathsFromStart.getLength() - 1; j >= 0; j--){
                    let startPath = pathsFromStart.get(j);
                    let startPathTileX = startPath["tile_x"];
                    let startPathTileY = startPath["tile_y"];
                    let startPathLength = knownPathsFromStart.get(startPathTileX, startPathTileY)["path_length"];
                    let minTraversal = calculateManhattanDistance(startPathTileX, startPathTileY, endPathTileX, endPathTileY);
                    let startToEndDistance = startPathLength + endPathLength + minTraversal + 1; // the +1 is because both path lengths do not include the start tile and the end tile should be included in the total length
                    if (bestM === null || startToEndDistance < bestM){
                        pEnd = endPath;
                        pStart = startPath;
                        bestM = startToEndDistance;
                        bestMinTraversal = minTraversal;
                        pEndIndex = i;
                        pStartIndex = j;
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

            let bestPath;
            // If distance from start of path to current point is lower on the path from the "startTile" then select it
            if (calculateManhattanDistance(pStart["tile_x"], pStart["tile_y"], startTileX, startTileY) <= calculateManhattanDistance(pEnd["tile_x"], pEnd["tile_y"], pEnd["origin_tile_x"], pEnd["origin_tile_y"])){
                bestPath = pStart;
                pathsFromStart.pop(pStartIndex);
            }else{
                bestPath = pEnd;
                pathsWithAttribute.pop(pEndIndex);
            }
            
            let bestPathData = {"path": bestPath, "best_m": bestM, "best_min_traversal": bestMinTraversal};
            return bestPathData;
        }

        let updateKnownPathIfBetter = (knownPathsList, previousTileX, previousTileY, newPathLength) => {
            let adjacentTiles = [[adjacentTileX+1,adjacentTileY], [adjacentTileX-1, adjacentTileY], [adjacentTileX, adjacentTileY+1], [adjacentTileX, adjacentTileY-1]];
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
                for (adjacentTile of adjacentTiles){
                    let adjacentTileX = adjacentTile[0];
                    let adjacentTileY = adjacentTile[1];
                    updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength + 1);
                }
            }
            return true;
        }

        let exploreTiles = (bestPath) => {
            let bPTileX = bestPath["tile_x"];
            let bPTileY = bestPath["tile_y"];
            let adjacentTiles = [[bPTileX+1,bPTileY], [bPTileX-1, bPTileY], [bPTileX, bPTileY+1], [bPTileX, bPTileY-1]];

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
                if (bestPath["from_start"]){
                    knownPathsList = knownPathsFromStart;
                    activePathsList = pathsFromStart;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": true};
                }else{
                    knownPathsList = knownPathsFromEnd;
                    activePathsList = pathsWithAttribute;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": false, "origin_tile_x": bestPath["origin_tile_x"], "origin_tile_y": bestPath["origin_tile_y"]};
                }

                let newPathLength = knownPathsList.get(bPTileX, bPTileY)["path_length"] + 1;

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
                        pathsWithAttribute.push({"tile_x": tileX, "tile_y": tileY, "from_start": false, "origin_tile_x": tileX, "origin_tile_y": tileY});
                        knownPathsFromEnd.set(tileX, tileY, {"path_length": 0});
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
                if (pathsFromStart.getLength() === 0){
                    return null;
                }
                // Else, if there are no paths from attribute tiles then
                else if (pathsWithAttribute.getLength() > 0){
                    let bestPathData = selectBestPath(bestPossibleLengthSoFar);

                    // Update best m
                    bestPossibleMDistanceWithCurrentChunks = bestPathData["best_m"];
                    // Update the best possible length with this set of chunks
                    bestPossibleLengthSoFar = bestPossibleMDistanceWithCurrentChunks;

                    // If the two paths met then distance is found. Note: With current design, the first full path is always the best possible path
                    if (bestPathData["best_min_traversal"] === 1){
                        return bestPossibleMDistanceWithCurrentChunks;
                    }
                    let bestPath = bestPathData["path"];

                    // Explore
                    exploreTiles(bestPath);
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
        let estimatedCombatDistance = RETRO_GAME_DATA["duel"]["ai"]["estimated_melee_distance"];

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
                let routeToEnemy = this.generateShortestRouteToPoint(enemyTileX, enemyTileY);
                let routeDecision = routeToEnemy.getDecisionAt(this.getTileX(), this.getTileY());
                this.updateFromRouteDecision(routeDecision);
            }
            
            return;
        }

        // Otherwise -> We are in sword range

        // Only continue if we can see the enemy
        if (!this.getDataToReactTo("can_see_enemy")){ return; }

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
        let enemyHitbox = new RectangleHitbox(enemyWidth, enemyHeight, enemyInterpolatedTickCenterX, enemyInterpolatedTickCenterY);
        let canCurrentlyHitEnemyWithSword = Sword.swordCanHitCharacter(enemyHitbox, swingHitbox, hitCenterX, hitCenterY, swingAngle, swingRange, startAngle, endAngle)

        let enemySwinging = this.getDataToReactTo("enemy_holding_a_sword") && this.getDataToReactTo("enemy_swinging_a_sword");

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
                    this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"] = this.randomEventManager.getResultExpectedMS(RETRO_GAME_DATA["duel"]["ai"]["expected_swing_delay_ms"]);
                }else{
                    // Consider blocking
                    let deflectProportionRequired = RETRO_GAME_DATA["sword_data"]["blocking"]["deflect_proportion"];
                    if (enemySwordSwingCompletionProportion >= deflectProportionRequired){
                        let stunProportionRequired = RETRO_GAME_DATA["sword_data"]["blocking"]["stun_deflect_proportion"];
                        // If you can stun then definitely block
                        if (enemySwordSwingCompletionProportion >= stunProportionRequired){
                            this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_block"] = true;
                        }
                        // You can block but you won't be stunning
                        else{
                            let numTriesToStunExpected = Math.max(1, Math.floor(enemySwordTotalSwingTimeTicks * RETRO_GAME_DATA["sword_data"]["blocking"]["stun_deflect_proportion"]));
                            let numTriesToDeflectOrStunExpected = Math.max(1, Math.floor(enemySwordTotalSwingTimeTicks * RETRO_GAME_DATA["sword_data"]["blocking"]["deflect_proportion"]));
                            let numTriesToDeflectExpected = Math.max(1, numTriesToDeflectOrStunExpected - numTriesToStunExpected);
                            
                            let probabilityOfDeflectAttempt = RETRO_GAME_DATA["duel"]["ai"]["regular_deflect_attempt_probability"];
                            
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
                if (this.randomEventManager.getResultExpectedMS(RETRO_GAME_DATA["duel"]["ai"]["adjust_close_duel_delay_ms"])){
                    this.decideToMoveToAdjacentTile();
                }
            }else{
                let isAdjacentToEnemy = Math.abs(enemyTileX - myTileX) + Math.abs(enemyTileY - myTileY) === 1;
                let tryAndPivot = false;

                // If we aren't adjacent then maybe try and pivot to be in a proper position to attack
                if (!isAdjacentToEnemy && !this.isBetweenTiles()){
                    tryAndPivot = this.randomEventManager.getResultExpectedMS(RETRO_GAME_DATA["duel"]["ai"]["expected_adjacent_pivot_ms"]);
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
                            let routeToEnemy = this.generateShortestRouteToPoint(enemyTileX, enemyTileY);
                            let routeDecision = routeToEnemy.getDecisionAt(this.getTileX(), this.getTileY());
                            this.updateFromRouteDecision(routeDecision);
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
                    this.botDecisionDetails["decisions"]["weapons"]["sword"]["trying_to_swing_sword"] = this.randomEventManager.getResultExpectedMS(RETRO_GAME_DATA["duel"]["ai"]["expected_swing_delay_ms"]);
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
        this.decisions["breaking_stride"] = this.botDecisionDetails["decisions"]["breaking_stride"];
    }

    isHuman(){ return false; }
}