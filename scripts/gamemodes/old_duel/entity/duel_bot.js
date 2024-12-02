class SkirmishBot extends SkirmishCharacter {
    constructor(gamemode, model, rankName, team){
        super(gamemode, model, rankName, team);
        this.shotSinceLastTurn = false;
        this.planLock = new Lock();

        this.gunShotHandlerID = this.getGamemode().getEventHandler().addHandler("gun_shot", (gunShotEventObject) => {
            if (gunShotEventObject["shooter_id"] === this.getID()){
                this.indicateHasShotSinceLastTurn();
            }
            // Well maybe I'm dead so clean up the handler
            else if (this.isDead()){
                this.getGamemode().getEventHandler().removeHandler("gun_shot", this.gunShotHandlerID);
            }
        });
    }

    indicateHasShotSinceLastTurn(){
        return this.shotSinceLastTurn = true;
    }

    hasShotSinceLastTurn(){
        return this.shotSinceLastTurn;
    }

    getBrain(){
        return this.getGamemode().getTeamBrain(this.getTeamName());
    }

    getRandom(){
        return this.getGamemode().getRandom();
    }

    indicateTurn(){
        super.indicateTurn();
        // Async call
        this.generatePlan();
    }

    makeDecisions(){
        this.resetDecisions();
        if (this.isMakingAMove() && !this.hasCommitedToAction()){
            // The plan has finished its creation and is ready to put into place
            if (this.planLock.isUnlocked()){
                this.plan.execute(this.decisions);
            }
        }else{
            this.checkForOfficerCommand();
        }
    }

    exploreAvailableTiles(range=this.walkingBar.getMaxValue()){
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
            return !this.getScene().tileAtLocationHasAttribute(tileX, tileY, "no_walk") && !this.getScene().hasEntityOnLocation(tileX, tileY);
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

    generateSelectedTroopsSets(possibleEndTiles){
        let troopSetsData = [];
        // Note: Using "lots" of storage but really not much its kinda wasteful though

        // Note: Assumes all on same team
        let troopSetIsEquivalent = (troopSet1, troopSet2) => {
            if (troopSet1.length != troopSet2.length){ return false; }
            // Check that at least 1 troop from set 1 is not in set 2
            for (let troopOfSet1 of troopSet1){
                let isPresent = false;
                for (let troopOfSet2 of troopSet2){
                    if (troopOfSet1.getID() === troopOfSet2.getID()){
                        isPresent = true;
                    }
                }
                if (!isPresent){
                    return true;
                }
            }
            return false;
        }

        let hasTroopSet = (troopSet) => {
            for (let presentTroopSetData of troopSetsData){
                if (troopSetIsEquivalent(troopSet, presentTroopSetData["troop_set"])){
                    return true;
                }
            }
            return false;
        }
        // Note: -1 is for the 1 officer which is alive given this function is called
        let numLivingTroops = this.gamemode.getLivingTeamRosterFromName(this.getTeamName()).length - 1;
        // Loop through all ending tiles
        for (let possibleEndTile of possibleEndTiles){
            let troopsToSelect = this.generateSelectedTroopsForPosition(possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
            // Looking for a set of troops that isn't empty and also isn't already recorded
            if (troopsToSelect.length > 0 && !hasTroopSet(troopsToSelect)){
                let troopSetData = {"tile_x": possibleEndTile["tile_x"], "tile_y": possibleEndTile["tile_y"], "troop_set": troopsToSelect};
                // Don't bother with combinations if you can get all of them
                if (troopsToSelect.length === numLivingTroops){
                    return [troopSetData];
                }
                troopSetsData.push(troopSetData);
            }
        }

        return troopSetsData;
    }

    async generatePlan(){
        // Indicate that the plan is being created
        this.planLock.lock();
        let possibleEndTiles = this.exploreAvailableTiles();

        let comparisonFunction = (element1, element2) => {
            if (element1["value"] < element2["value"]){
                return 1;
            }else if (element2["value"] < element1["value"]){
                return -1;
            }else{
                return 0;
            }
        };

        let random = this.getRandom();
        /* So basically if it was basic then
           let array=[5,1,1,1];
           You would have a 5/8 chance of getting array[0] with normal weighting
           but you can instead make it so in something like this case you would have a 7.434234/8 chance
           of getting array[0] because of a particular weighting function
        */

        let randomlySelectIndex = (n) => {
            let xStart = RETRO_GAME_DATA["bot"]["plan_choosing_x_start"];
            let xEnd = RETRO_GAME_DATA["bot"]["plan_choosing_x_end"];
            let f = RETRO_GAME_DATA["bot"]["plan_choosing_f"];
            let func = (x) => { return 1/Math.pow(x,f); }
            let endY = func(xEnd);
            let startY = func(xStart);
            let pickedX = random.getRandomFloat() * (xEnd - xStart) + xStart;
            let valueAtPickedX = func(pickedX);
            let progressionInY = (startY - valueAtPickedX) / (startY - endY);
            let chosenIndex = Math.floor(n * (1 - progressionInY));
            return chosenIndex;
        }

        // Stores all plans for ranking and selection
        let collectivePlans = [];

        // Find tiles where you can go to shoot an enemy
        let shootStabCalculationResults = this.determineRoughShootAndStabTiles(copyArrayOfJSONObjects(possibleEndTiles));
        let shootOneTiles = shootStabCalculationResults["rough_shoot_tiles"];

        // Find tiles where you can go to stab an enemy
        // Note: This is a subset of the shootOneTiles unless you had some massive gun, for now assuming d<=1 for stabbing
        let stabOneTiles = shootStabCalculationResults["rough_stab_tiles"];

        // Find tiles closer to enemy (from start position) where you can't be immediately shot/stabbed 
        let closerTiles = this.determineCloserTiles(copyArrayOfJSONObjects(possibleEndTiles), shootOneTiles);

        // Find tiles that help explore
        let explorationTiles = this.determineExplorationTiles(copyArrayOfJSONObjects(possibleEndTiles));

        // Find tiles where you can hide in a single-bush
        let singleBushTiles = this.determineSingleBushTiles(copyArrayOfJSONObjects(possibleEndTiles));

        // Find tiles where you can hide in a multi-bush
        let multiBushTiles = this.determineMultiBushTiles(copyArrayOfJSONObjects(possibleEndTiles));

        // Add shoot tiles to collectiveplans
        for (let shootOneTile of shootOneTiles){
            shootOneTile["type"] = "shoot";
            // In this case, there is a score in [0,1] so directly assign the weight
            shootOneTile["value"] = shootOneTile["score"] * RETRO_GAME_DATA["bot"]["weights"]["shoot"];
            // Apply the confidence
            shootOneTile["value"] *= shootOneTile["confidence"];
            collectivePlans.push(shootOneTile);
        }

        // Add stab tiles to collectiveplans
        for (let stabOneTile of stabOneTiles){
            stabOneTile["type"] = "stab";
            // In this case, there is no existing value so directly assign the weight
            stabOneTile["value"] = RETRO_GAME_DATA["bot"]["weights"]["stab"];
            // Apply the confidence
            stabOneTile["value"] *= stabOneTile["confidence"];
            collectivePlans.push(stabOneTile);
        }

        // Add closer tiles to collectiveplans
        for (let closerTile of closerTiles){
            closerTile["type"] = "move_closer";
            // In this case, there is an existing value. It is already between [0,1] so multiply by weight
            closerTile["value"] = closerTile["score"] * RETRO_GAME_DATA["bot"]["weights"]["move_closer"];
            //console.log(closerTile["value"])
            collectivePlans.push(closerTile);
        }

        // Add closer tiles to collectiveplans
        for (let explorationTile of explorationTiles){
            explorationTile["type"] = "explore";
            // In this case, there is an existing value. It is already between [0,1] so multiply by weight
            explorationTile["value"] = explorationTile["score"] * RETRO_GAME_DATA["bot"]["weights"]["explore"];
            collectivePlans.push(explorationTile);
        }

        // Add singleBushTiles to collectiveplans
        for (let singleBushTile of singleBushTiles){
            singleBushTile["type"] = "single_bush";
            // In this case, there is no existing value so directly assign the weight
            singleBushTile["value"] = RETRO_GAME_DATA["bot"]["weights"]["single_bush"];
            //console.log(singleBushTile["value"])
            collectivePlans.push(singleBushTile);
        }

        // Add multiBushTiles to collectiveplans
        for (let multiBushTile of multiBushTiles){
            multiBushTile["type"] = "multi_bush";
            // In this case, score is in [0,1] so multiply by weight
            multiBushTile["value"] = multiBushTile["score"] * RETRO_GAME_DATA["bot"]["weights"]["multi_bush"];
            collectivePlans.push(multiBushTile);
        }

        // Officer stuff
        if (this.rankName === "officer"){
            let selectedTroopsSets = this.generateSelectedTroopsSets(possibleEndTiles);

            // Come up with positions to move to close to troops
            let positionsCloseToMyTroops = this.determinePositionsCloseToMyTroops(possibleEndTiles, shootOneTiles);

            // Add positionsCloseToMyTroops tiles to collectiveplans
            for (let positionCloseToMyTroops of positionsCloseToMyTroops){
                positionCloseToMyTroops["type"] = "move_to_friends";
                positionCloseToMyTroops["value"] = positionCloseToMyTroops["score"] * RETRO_GAME_DATA["bot"]["weights"]["move_to_friends"];
                collectivePlans.push(positionCloseToMyTroops);
            }

            // Only generate this if it will be used
            if (!this.cannonIsOnCooldown() || selectedTroopsSets.length > 0){
                let squaresAroundEnemies = this.getSquaresAroundEnemies();

                // Come up with locations you can move if you are doing a command (just not the move command that will have a different position)
                let locationsToMoveIfOrderingButNotMoveOrder = appendLists(closerTiles, explorationTiles);
                locationsToMoveIfOrderingButNotMoveOrder = appendLists(locationsToMoveIfOrderingButNotMoveOrder, singleBushTiles);
                locationsToMoveIfOrderingButNotMoveOrder = appendLists(locationsToMoveIfOrderingButNotMoveOrder, multiBushTiles);
                locationsToMoveIfOrderingButNotMoveOrder = appendLists(locationsToMoveIfOrderingButNotMoveOrder, positionsCloseToMyTroops);

                // Sort the locations for selection
                locationsToMoveIfOrderingButNotMoveOrder.sort(comparisonFunction);
                // Just incase its empty add current location
                if (locationsToMoveIfOrderingButNotMoveOrder.length === 0){
                    locationsToMoveIfOrderingButNotMoveOrder.push({"tile_x": this.getTileX(), "tile_y": this.getTileY(), "type": "debugger"});
                }

                let chosenIndex = randomlySelectIndex(locationsToMoveIfOrderingButNotMoveOrder.length);
                let locationToMoveIfOrderingButNotMoveOrder =  locationsToMoveIfOrderingButNotMoveOrder[chosenIndex];
                
                // If cannon is ready
                if (!this.cannonIsOnCooldown()){
                    // Determine targets to destroy rocks
                    let rockTargets = this.determineRockTargets();

                    // Determine troop damage spots
                    let troopDamageTargets = this.determineTroopCannonDamageSpots(squaresAroundEnemies);

                    // Add cannon rock tiles to collectiveplans
                    for (let rockTarget of rockTargets){
                        rockTarget["type"] = "cannon_rock";
                        // In this case, rock tiles have values in [-180,180]
                        rockTarget["value"] = (rockTarget["score"] + 180) / (180*2) * RETRO_GAME_DATA["bot"]["weights"]["cannon_rock"];
                        rockTarget["attached_location"] = locationToMoveIfOrderingButNotMoveOrder;
                        collectivePlans.push(rockTarget);
                    }

                    // Add cannon troop tiles to collectiveplans
                    for (let troopDamageTarget of troopDamageTargets){
                        troopDamageTarget["type"] = "cannon_troops";
                        // In this case, rock tiles have values in (-4,4)
                        troopDamageTarget["value"] = (troopDamageTarget["score"] + 4) / (4*2) * RETRO_GAME_DATA["bot"]["weights"]["cannon_troops"];
                        troopDamageTarget["attached_location"] = locationToMoveIfOrderingButNotMoveOrder;
                        collectivePlans.push(troopDamageTarget);
                    }
                }

                // Determine orders for troop sets
                for (let troopSetData of selectedTroopsSets){
                    let troopSelectionTile = {"tile_x": troopSetData["tile_x"], "tile_y": troopSetData["tile_y"]}
                    let selectedTroops = troopSetData["troop_set"];
                    // Note: troopSet is not empty

                    let orderShootTargets = this.determineOrderShootPossibilities(squaresAroundEnemies, selectedTroops);
                    // Create a reference list of tiles to order walk to
                    let orderTroopWalkToLocationTiles = appendLists(closerTiles, explorationTiles);
                    orderTroopWalkToLocationTiles = appendLists(orderTroopWalkToLocationTiles, singleBushTiles);
                    orderTroopWalkToLocationTiles = appendLists(orderTroopWalkToLocationTiles, multiBushTiles);
                    // Turn the reference list into a value-copy
                    orderTroopWalkToLocationTiles = copyArrayOfJSONObjects(orderTroopWalkToLocationTiles);
                    for (let orderTroopWalkToLocationTile of orderTroopWalkToLocationTiles){
                        orderTroopWalkToLocationTile["attached_location"] = {"tile_x": locationToMoveIfOrderingButNotMoveOrder["tile_x"], "tile_y": locationToMoveIfOrderingButNotMoveOrder["tile_y"], "type": locationToMoveIfOrderingButNotMoveOrder["type"]}
                    }

                    /*
                    // TODO: Testing
                    let locationsToOrderAMoveTo = appendLists(closerTiles, explorationTiles);
                    locationsToOrderAMoveTo = appendLists(locationsToOrderAMoveTo, singleBushTiles);
                    locationsToOrderAMoveTo = appendLists(locationsToOrderAMoveTo, multiBushTiles);

                    // Sort the locations for selection
                    locationsToOrderAMoveTo.sort(comparisonFunction);
                    // Just in case it's empty add current location
                    if (locationsToOrderAMoveTo.length === 0){
                        locationsToOrderAMoveTo.push({"tile_x": this.getTileX(), "tile_y": this.getTileY(), "type": "debugger"});
                    }

                    let chosenIndex = randomlySelectIndex(locationsToOrderAMoveTo.length);
                    let locationToOrderAMoveTo =  locationsToOrderAMoveTo[chosenIndex];
                    let orderTroopWalkToLocationTiles = [{"tile_x": locationToOrderAMoveTo["tile_x"], "tile_y": locationToOrderAMoveTo["tile_y"], "score": locationToOrderAMoveTo["score"]}];
                    orderTroopWalkToLocationTiles[0]["attached_location"] = {"tile_x": locationToMoveIfOrderingButNotMoveOrder["tile_x"], "tile_y": locationToMoveIfOrderingButNotMoveOrder["tile_y"], "type": locationToMoveIfOrderingButNotMoveOrder["type"]}
                    */
                    // Add orderShootTargets tiles to collectiveplans
                    for (let orderShootTarget of orderShootTargets){
                        orderShootTarget["type"] = "order_shoot";
                        // In this case, order shoot tiles have scores in (-4,4)
                        orderShootTarget["value"] = (orderShootTarget["score"] + 4) / (4*2) * RETRO_GAME_DATA["bot"]["weights"]["order_shoot"];
                        orderShootTarget["num_selected_troops"] = selectedTroops.length;
                        orderShootTarget["select_location"] = troopSelectionTile;
                        orderShootTarget["attached_location"] = locationToMoveIfOrderingButNotMoveOrder;
                        collectivePlans.push(orderShootTarget);
                    }

                    // Add orderTroopWalkToLocationTiles to collectiveplans
                    for (let orderTroopWalkToLocationTile of orderTroopWalkToLocationTiles){
                        orderTroopWalkToLocationTile["type"] = "order_move";
                        // In this case, there is an existing value. It is already between [0,1] so multiply by weight
                        orderTroopWalkToLocationTile["value"] = orderTroopWalkToLocationTile["score"] * RETRO_GAME_DATA["bot"]["weights"]["order_move"] * RETRO_GAME_DATA["bot"]["weights"][orderTroopWalkToLocationTile["attached_location"]["type"]];
                        orderTroopWalkToLocationTile["num_selected_troops"] = selectedTroops.length;
                        orderTroopWalkToLocationTile["select_location"] = troopSelectionTile;
                        // Attached location already here
                        collectivePlans.push(orderTroopWalkToLocationTile);
                    }
                }
            }
        }

        // Add extra value to stab, shoot, orders that involve bushes
        let addBushValueToTile = (tileX, tileY, value) => {
            for (let plan of collectivePlans){
                let planType = plan["type"];
                if (planType === "shoot"){
                    if (plan["tile_x"] === tileX && plan["tile_y"] === tileY){
                        plan["value"] += value;
                    }
                }else if (planType === "stab"){
                    if (plan["tile_x"] === tileX && plan["tile_y"] === tileY){
                        plan["value"] += value;
                    }
                }else if (planType === "cannon_rock"){
                    if (plan["attached_location"]["tile_x"] === tileX && plan["attached_location"]["tile_y"] === tileY){
                        plan["value"] += value;
                    }
                }else if (planType === "cannon_troops"){
                    if (plan["attached_location"]["tile_x"] === tileX && plan["attached_location"]["tile_y"] === tileY){
                        plan["value"] += value;
                    }
                }else if (planType === "order_shoot"){
                    if (plan["attached_location"]["tile_x"] === tileX && plan["attached_location"]["tile_y"] === tileY){
                        plan["value"] += value;
                    }
                }else if (planType === "order_move"){
                    if (plan["attached_location"]["tile_x"] === tileX && plan["attached_location"]["tile_y"] === tileY){
                        plan["value"] += value;
                    }
                }
            }
        }

        // Add bush values
        let allBushTiles = appendLists(singleBushTiles, multiBushTiles);
        for (let bushTile of allBushTiles){
            addBushValueToTile(bushTile["tile_x"], bushTile["tile_y"], bushTile["value"]);
        }

        // Sort collective plans
        collectivePlans.sort(comparisonFunction);

        let chosenIndex = randomlySelectIndex(collectivePlans.length);
        let bestPlan = collectivePlans[chosenIndex];

        let selectBestPlanOfTypeForDebugging = (replacementTypes) => {
            for (let replacementType of replacementTypes){
                let best = null;
                for (let i = 0; i < collectivePlans.length; i++){
                    if (collectivePlans[i]["type"] === replacementType){
                        let isBetter = best === null || collectivePlans[i]["value"] > best["value"];
                        if (isBetter){
                            best = collectivePlans[i];
                        }
                    }
                }
                if (best != null){
                    return best;
                }
            }
            return null;
        }
        let replacementTypes = [];
        let replacementPlan = selectBestPlanOfTypeForDebugging(replacementTypes);
        if (replacementPlan != null){
            bestPlan = replacementPlan;
        }
        //console.log(this.getID(), " has a plan!")
        //console.log(bestPlan)

        let debugPlanSelection = () => {
            let totalString = "";
            totalString += '\n' + "My ID: " + this.getID();
            totalString += '\n' + "My team: " + this.getTeamName();
            totalString += '\n' + "My rank: " + this.getRankName();
            totalString += '\n' + "Chosen:";
            totalString += '\n' + this.explainPlan(bestPlan);
            totalString += "\n\n";

            let coveredTypes = [];
            let hasCoveredType = (typeName) => {
                return listHasElement(coveredTypes, typeName);
            }
            for (let i = 0; i < collectivePlans.length; i++){
                let plan = collectivePlans[i];
                let typeName = plan["type"];
                if (!hasCoveredType(typeName)){
                    coveredTypes.push(typeName);
                    totalString += '\n';
                    totalString += '\n' + "Best of " + typeName + ":";
                    totalString += '\n' + this.explainPlan(plan);
                }
            }
            console.log(totalString);
        }

        debugPlanSelection();
        this.plan = new BotPlan(this, bestPlan);
        if (isRDebugging()){
            debugger;
        }

        // Clean up
        this.shotSinceLastTurn = false;

        // Indicate that the plan has been created
        this.planLock.unlock();
    }

    explainPlan(plan){
        //let explanationString = "My ID: " + this.getID();
        //explanationString += '\n' + "My team: " + this.getTeamName();
        let explanationString = "Value: " + plan["value"].toString();
        explanationString += '\n' + "Type: " + plan["type"];
        if (plan["type"] === "move_closer"){
            explanationString += '\n' + "Moving troop from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to closer tile at " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();
        }
        else if (plan["type"] === "order_move"){
            explanationString += '\n' + "Moving officer from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to " + plan["attached_location"]["type"] + " tile at " + plan["attached_location"]["tile_x"].toString() + "," + plan["attached_location"]["tile_y"].toString();
            explanationString += '\n' + "Number of selected troops: " + plan["num_selected_troops"];
            explanationString += '\n' + "Telling troops to move to: " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();  
        }
        else if (plan["type"] === "cannon_rock"){
            explanationString += '\n' + "Moving officer from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to " + plan["attached_location"]["type"] + " tile at " + plan["attached_location"]["tile_x"].toString() + "," + plan["attached_location"]["tile_y"].toString();
            explanationString += '\n' + "Aiming cannon at rock at " + plan["cannon_center_x"] + ", " + plan["cannon_center_y"];
        }
        else if (plan["type"] === "cannon_troops"){
            explanationString += '\n' + "Moving officer from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to " + plan["attached_location"]["type"] + " tile at " + plan["attached_location"]["tile_x"].toString() + "," + plan["attached_location"]["tile_y"].toString();
            explanationString += '\n' + "Aiming cannon at troops at " + plan["cannon_center_x"] + ", " + plan["cannon_center_y"];
        }
        else if (plan["type"] === "order_shoot"){
            explanationString += '\n' + "Moving officer from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to " + plan["attached_location"]["type"] + " tile at " + plan["attached_location"]["tile_x"].toString() + "," + plan["attached_location"]["tile_y"].toString();
            explanationString += '\n' + "Number of selected troops: " + plan["num_selected_troops"];
            explanationString += '\n' + "Aiming selected troops at " + plan["x"] + ", " + plan["y"];
        }
        else if (plan["type"] === "shoot"){
            explanationString += '\n' + "Moving troop from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to shoot location at " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();
            explanationString += '\n' + "Aiming troop at angle " + toDegrees(plan["angle_rad"]).toString();
            explanationString += '\n' + "Shot distance (tiles) " + plan["distance_to_enemy"]/RETRO_GAME_DATA["general"]["tile_size"];
            explanationString += '\n' + "Facing " + plan["direction_to_face"];
        }
        else if (plan["type"] === "stab"){
            explanationString += '\n' + "Moving troop from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to stab location at " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();
            explanationString += '\n' + "Facing " + plan["direction_to_face"];
        }
        else if (plan["type"] === "single_bush"){
            explanationString += '\n' + "Moving troop from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to single bush at " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();
        }
        else if (plan["type"] === "multi_bush"){
            explanationString += '\n' + "Moving troop from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to multi bush at " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();
        }
        else if (plan["type"] === "explore"){
            explanationString += '\n' + "Moving troop from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to exploration tile at " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();
        }
        else if (plan["type"] === "move_to_friends"){
            explanationString += '\n' + "Moving troop from " + this.getTileX().toString() + "," + this.getTileY().toString() + " to tile closer to friends at " + plan["tile_x"].toString() + "," + plan["tile_y"].toString();
        }
        else{
            explanationString = plan.toString();
        }
        return explanationString;
    }

    determineOrderShootPossibilities(squaresAroundEnemies, selectedTroops){
        let shootPossibilities = [];
        let scene = this.getScene();
        // Loop through all the squares around enemies
        for (let tile of squaresAroundEnemies){
            let tileCenterX = scene.getCenterXOfTile(tile["tile_x"]);
            let tileCenterY = scene.getCenterYOfTile(tile["tile_y"]);
            let enemyKills = 0;
            let enemyExtraDamage = 0;
            
            let friendlyKills = 0;
            let friendlyExtraDamage = 0;

            // Check what each of your troops would hit
            for (let selectedTroop of selectedTroops){
                let playerLeftX = scene.getXOfTile(selectedTroop.getTileX());
                let playerTopY = scene.getYOfTile(selectedTroop.getTileY());
                let angleToTileCenter = displacementToRadians(tileCenterX - selectedTroop.getInterpolatedTickCenterX(), tileCenterY - selectedTroop.getInterpolatedTickY());
                let visualDirectionToFace = angleToBestFaceDirection(angleToTileCenter);
                let gun = selectedTroop.getGun();
                let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, visualDirectionToFace, angleToTileCenter);
                let x = pos["x"];
                let y = pos["y"];
                let range = gun.getBulletRange();
                let myID = selectedTroop.getID();
                // Check shoot directory at enemy
                let collision = scene.findInstantCollisionForProjectile(x, y, angleToTileCenter, range, (entity) => { return entity.getID() === myID; });
               // console.log("findInstantCollisionForProjectile", x, y, angleToTileCenter, range, collision)
                if (collision["collision_type"] === "entity"){
                    let troop = collision["entity"];
                    let isFriendly = troop.isOnSameTeam(selectedTroop);
                    tile["angle_rad"] = angleToTileCenter;
                    tile["direction_to_face"] = getMovementDirectionOf(visualDirectionToFace);
                    let damage = RETRO_GAME_DATA["skirmish"]["shot_damage"];
                    if (isFriendly){
                        if (damage > troop.getHealth()){
                            friendlyKills++;
                        }else{
                            friendlyExtraDamage += damage;
                        }
                    }else{
                        let enemyConfidence = this.getBrain().getEnemyConfidence(troop.getID(), troop.getTeamName());
                        if (damage > this.getBrain().getHealthOfEnemy(troop.getID())){
                            enemyKills += 1 * enemyConfidence;
                        }else{
                            enemyExtraDamage += damage * enemyConfidence;
                        }
                    }
                }
            }

            // Calculate score
            /*
                Notes on score calculation:
                We know enemyKills is between 0 and num enemies
                We know enemyExtraDamage is between 0 and num enemies
                We know friendlyKills is between 0 and num friendlies
                We know friendlyExtraDamage is between 0 and num friendlies
            */
            let enemies = this.getEnemyData();
            let friends = this.getFriends();
            let killScore = enemyKills / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyKills / friends.length;
            let damageScore = enemyExtraDamage / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyExtraDamage / friends.length;
            let score = killScore * RETRO_GAME_DATA["bot"]["kill_to_damage_importance_ratio"] + damageScore;
            // Score will be in range (-4, 4)
            // Skip if <= 0
            //console.log("score for order shoot", score);
            if (score <= 0){ continue; }
            shootPossibilities.push({"x": tileCenterX, "y": tileCenterY, "score": score})
        }
        return shootPossibilities;
    }

    determineTroopCannonDamageSpots(squaresAroundEnemies){
        let cannonTargets = [];
        let scene = this.getScene();
        let enemies = this.getEnemyData();
        let friends = this.getFriends();

        let humanMultiplier = RETRO_GAME_DATA["cannon"]["human_damage_multiplier"];
        let calculateCannonDamage = (distanceInTiles, multiplier) => {
            return multiplier * 1 / (Math.pow(distanceInTiles+1, RETRO_GAME_DATA["cannon"]["damage_f"] * RETRO_GAME_DATA["cannon"]["damage_g"] * distanceInTiles));
        }
        let tileDamageRadius = RETRO_GAME_DATA["cannon"]["aoe_tile_radius"];
        let damageRadius = tileDamageRadius * RETRO_GAME_DATA["general"]["tile_size"];

        // Loop around each tile around enemies and see how much damage you'd get for a cannon shot there
        for (let tile of squaresAroundEnemies){
            let tileCenterX = scene.getCenterXOfTile(tile["tile_x"]);
            let tileCenterY = scene.getCenterYOfTile(tile["tile_y"]);
            let enemyKills = 0;
            let enemyExtraDamage = 0;
            
            let friendlyKills = 0;
            let friendlyExtraDamage = 0;

            // Calculate enemy damage
            for (let enemy of enemies){
                // Don't even guess for unknown enemies
                if (enemy["status"] === "unknown"){ continue; }
                let enemyTileX = enemy["tile_x"];
                let enemyTileY = enemy["tile_y"];
                let enemyX = scene.getCenterXOfTile(enemyTileX);
                let enemyY = scene.getCenterXOfTile(enemyTileY);
                let distanceFromHitLocation = calculateEuclideanDistance(tileCenterX, tileCenterY, enemyX, enemyY);
                if (distanceFromHitLocation > damageRadius){
                    continue;
                }
                let distanceFromHitLocationInTiles = distanceFromHitLocation/RETRO_GAME_DATA["general"]["tile_size"];
                let damage = calculateCannonDamage(distanceFromHitLocationInTiles, humanMultiplier);
                let enemyConfidence = this.getBrain().getEnemyConfidence(enemy["entity_id"], this.gamemode.getOtherTeam(this.getTeamName()));
                if (damage > this.getBrain().getHealthOfEnemy(enemy["entity_id"])){
                    enemyKills += 1 * enemyConfidence;
                }else{
                    enemyExtraDamage += damage * enemyConfidence;
                }
            }

            // Calculate friendly damage
            for (let friendly of friends){
                let friendlyX = friendly.getInterpolatedTickCenterX();
                let friendlyY = friendly.getInterpolatedTickCenterY();
                let distanceFromHitLocation = calculateEuclideanDistance(tileCenterX, tileCenterY, friendlyX, friendlyY);
                if (distanceFromHitLocation > damageRadius){
                    continue;
                }
                let distanceFromHitLocationInTiles = distanceFromHitLocation/RETRO_GAME_DATA["general"]["tile_size"];
                let damage = calculateCannonDamage(distanceFromHitLocationInTiles, humanMultiplier);
                if (damage > friendly.getHealth()){
                    friendlyKills++;
                }else{
                    friendlyExtraDamage += damage;
                }
            }

            // Calculate score
            /*
                Notes on score calculation:
                We know enemyKills is between 0 and num enemies
                We know enemyExtraDamage is between 0 and num enemies
                We know friendlyKills is between 0 and num friendlies
                We know friendlyExtraDamage is between 0 and num friendlies
            */
            let killScore = enemyKills / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyKills / friends.length;
            let damageScore = enemyExtraDamage / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyExtraDamage / friends.length;
            let score = killScore * RETRO_GAME_DATA["bot"]["kill_to_damage_importance_ratio"] + damageScore;
            // Score will be in range (-4, 4)
            // Skip if <= 0 
            if (score <= 0){ continue; }
            if (isNaN(tileCenterX)){ debugger; }
            cannonTargets.push({"cannon_center_x": tileCenterX, "cannon_center_y": tileCenterY, "score": score})
        }
        return cannonTargets;
    }

    getSquaresAroundEnemies(){
        let squaresAroundEnemies = [];
        let enemyData = this.getEnemyData();

        let tryToAddSquare = (tileX, tileY) => {
            // See if present, return if it is 
            for (let square of squaresAroundEnemies){
                if (square["tile_x"] === tileX && square["tile_y"] === tileY){
                    return;
                }
            }

            // So its not present
            if (isNaN(tileX) || tileX === undefined || isNaN(tileY) || tileY === undefined){
                debugger;
            }
            squaresAroundEnemies.push({"tile_x": tileX, "tile_y": tileY});
        }
        let addSquaresAroundSpot = (tileX, tileY) => {
            // Top left
            tryToAddSquare(tileX-1, tileY+1);
            // Top
            tryToAddSquare(tileX, tileY+1);
            // Top right
            tryToAddSquare(tileX+1, tileY+1);
            // Left
            tryToAddSquare(tileX-1, tileY);
            // Center
            tryToAddSquare(tileX, tileY);
            // Right
            tryToAddSquare(tileX+1, tileY);
            // Bottom left
            tryToAddSquare(tileX-1, tileY-1);
            // Bottom
            tryToAddSquare(tileX, tileY-1);
            // Bottom right
            tryToAddSquare(tileX+1, tileY-1);
        }

        let tileInSingleCover = (tileX, tileY) => {
            return this.getScene().tileAtLocationHasAttribute(tileX, tileY, "single_cover");
        }

        let tileInMultiCover = (tileX, tileY) => {
            return this.getScene().tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
        }

        // Add squares around each enemy
        for (let enemyObj of enemyData){
            let sightingType = enemyObj["status"];
            if (sightingType === "known"){
                addSquaresAroundSpot(enemyObj["tile_x"], enemyObj["tile_y"]);
            }
            // Else we have the last known location
            else if (sightingType === "last_known"){
                // If single cover then add tiles around it
                if (tileInSingleCover(enemyObj["tile_x"], enemyObj["tile_y"])){
                    addSquaresAroundSpot(enemyObj["tile_x"], enemyObj["tile_y"]);
                }
                // If mutli cover then add all tiles within multi cover
                else if (tileInMultiCover(enemyObj["tile_x"], enemyObj["tile_y"])){
                    let multiCoverTiles = this.getScene().getMultiCoverTilesConnectedTo(enemyObj["tile_x"], enemyObj["tile_y"]);
                    for (let tile of multiCoverTiles){
                        // Note: For these tiles x,y are used instead of tile_x and tile_y
                        addSquaresAroundSpot(tile["x"], tile["y"]);
                    }
                }
                // Else just a regular last known then add tiles around it
                else{
                    addSquaresAroundSpot(enemyObj["tile_x"], enemyObj["tile_y"]);
                }
    
            }
            // Else unknown
            else{
                // Do nothing
                continue;
            }
        }
        return squaresAroundEnemies;
    }

    determineRockTargets(){
        // Determine rock spots
        let rockTargets = [];
        let friends = this.getFriends();
        let enemies = this.getEnemyData();
        let rockHitboxes = this.gamemode.getRockHitboxes();
        let scene = this.getScene();

        // Using formula 1/(x^f)
        let hitBoxValueByHealth = (hitboxHealth) => {
            return Math.min(1/(Math.pow(hitboxHealth, RETRO_GAME_DATA["bot"]["rock_health_f_value"])), RETRO_GAME_DATA["bot"]["max_rock_value"]);
        }

        // Loop through each living rock hitbox locations
        for (let rockHitbox of rockHitboxes){
            if (rockHitbox.isDead()){ continue; }
            // Calculate the rock density of the location
            let tileX = rockHitbox.getTileX();
            let tileY = rockHitbox.getTileY();
            let healthScore = 0;
            let enemyScore = 0;
            let friendlyScore = 0;

            // Check all rock hitboxes to calculate the score for this location
            for (let rockHitboxForCalculation of rockHitboxes){
                // Weigh by making more low health rocks worth more
                healthScore += hitBoxValueByHealth(rockHitboxForCalculation.getHealth());
            }
            // Weigh by enemy distance to rock (use cannon aoe as distance)
            for (let enemy of enemies){
                // Don't even guess for unknown enemies
                if (enemy["status"] === "unknown"){ continue; }
                let distanceToEnemyInTile = calculateEuclideanDistance(enemy["tile_x"], enemy["tile_y"], tileX, tileY);
                if (distanceToEnemyInTile > RETRO_GAME_DATA["cannon"]["aoe_tile_radius"]){
                    continue;
                }
                let enemyConfidence = this.getBrain().getEnemyConfidence(enemy["entity_id"], this.gamemode.getOtherTeam(this.getTeamName()));
                enemyScore += 1 * enemyConfidence; 
            }

            // Weigh by friendly distance to rock (use cannon aoe as distance)
            for (let friend of friends){
                let distanceToEnemyInTile = calculateEuclideanDistance(friend.getTileX(), friend.getTileY(), tileX, tileY);
                if (distanceToEnemyInTile > RETRO_GAME_DATA["cannon"]["aoe_tile_radius"]){
                    continue;
                }
                friendlyScore += 1; 
            }
            /*
                Notes on score calculation:
                We know health score is between 1 and 180 (20 * 9)
                We know enemy score is between 0 and num enemies
                We know friendly score is between 0 and num friendlies
            */
            let score = healthScore * (enemyScore / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyScore / friends.length);
            // Score will be in [-180,180]
            // Skip if <= 0 
            if (score <= 0){ continue; }
            let cannonCenterX = scene.getCenterXOfTile(tileX);
            let cannonCenterY = scene.getCenterYOfTile(tileY);
            rockTargets.push({"cannon_center_x": cannonCenterX, "cannon_center_y": cannonCenterY, "score": score})
        }
        return rockTargets;
    }

    getEnemyData(){
        return this.getBrain().getEnemyData();
    }

    getFriends(){
        return this.getGamemode().getLivingTeamRosterFromName(this.getTeamName());
    }

    determineFurthestOutTiles(possibleEndTiles){
        let furtherTiles = [];
        let friendlies = this.getFriends();
        let scene = this.getScene();

        // Check tiles
        let highestFurthestDistance = 0;
        let highestTotalDistance = 0;
        for (let tile of possibleEndTiles){
            let x = scene.getCenterXOfTile(tile["tile_x"]);
            let y = scene.getCenterYOfTile(tile["tile_y"]);
            let totalDistance = 0;
            let furthestDistance = 0;
            // Find the distances to enemies
            for (let friend of friendlies){
                let friendX = scene.getCenterXOfTile(friend.getTileX());
                let friendY = scene.getCenterXOfTile(friend.getTileY());
                let distance = calculateEuclideanDistance(x, y, friendX, friendY);
                totalDistance += distance;
                furthestDistance = Math.max(distance, furthestDistance);
            }
            tile["furthest_distance"] = furthestDistance;
            tile["total_distance"] = totalDistance;
            highestFurthestDistance = Math.max(furthestDistance, highestFurthestDistance);
            highestTotalDistance = Math.max(totalDistance, highestTotalDistance);
            furtherTiles.push(tile);
        }

        // Value the tiles with a score of [0,1]
        for (let tile of furtherTiles){
            if (highestFurthestDistance === 0){
                tile["score"] = 0.5;
            }else{
                tile["score"] = 0.5 * tile["furthest_distance"] / highestFurthestDistance;
            }
            if (highestTotalDistance === 0){
                tile["score"] += 0.5;
            }else{
                tile["score"] += 0.5 * tile["total_distance"] / highestTotalDistance;
            }
        }
        // Score in range [0,1]
        // Keys: tile_x, tile_y, score
        return furtherTiles;
    }

    getTilesCloserToUnexploredSpawnpoints(possibleEndTiles){
        let unexploredSpawnpoints = this.getBrain().getUnexploredSpawnpoints();
        let routes = [];

        // Note: If this function is called at least 1 route will exist

        // Come up with routes to the location
        for (let unexploredSpawnpointObj of unexploredSpawnpoints){
            let spawnPointTileX = unexploredSpawnpointObj["tile_x"];
            let spawnPointTileY = unexploredSpawnpointObj["tile_y"];
            // Note: Route cannot be null/empty/whatever because it is known there are no obstructions to spawn points
            let routeToLocation = this.generateShortestRouteToPoint(spawnPointTileX, spawnPointTileY);
            //console.log(this.getTeamName(), routeToLocation)
            routes.push(routeToLocation);
        }

        // Clip the routes so that they are the length to the point where they can first see the spawn point
        let bestRoute = null;
        for (let route of routes){
            let lengthOfRouteUntilSpawnpointIsVisible = route.getLength();
            for (let i = 0; i < route.getLength(); i++){
                let tileAtI = route.getTileInRouteAtIndex(i);
                let currentLengthIfThisTileIsFinal = i + 1;
                // If this tile can see the spawn point then clip route to this length
                let routeEnd = route.getLastTile();
                // Check if standing on tile at i, you could see the round end
                if (this.couldISeeEntityAtTileFromTile(tileAtI["tile_x"], tileAtI["tile_y"], routeEnd["tile_x"], routeEnd["tile_y"])){
                    lengthOfRouteUntilSpawnpointIsVisible = currentLengthIfThisTileIsFinal;
                    break;
                }
            }

            // Clip route to length
            route.shortenToLength(lengthOfRouteUntilSpawnpointIsVisible);

            // If the best route is null or longer than this route, replace it
            if (bestRoute === null || bestRoute.getLength() > route.getLength()){
                bestRoute = route;
            }
        }

        // Rather than return the route, return the last tile on the route
        let tilesGoodForExploring = [];
        
        // Loop through possible end tiles and determine the score for each
        // Note: I know the efficiency is questionable but its good enough for me idc
        let highestIndex = 0; // 0 is the best placeholder I won't explain
        for (let tile of possibleEndTiles){
            // If this tile isn't part of the route....
            if (!bestRoute.containsTile(tile["tile_x"], tile["tile_y"])){
                continue;
            }
            let routeIndex = bestRoute.getIndexOfTile(tile["tile_x"], tile["tile_y"]);
            // Attach route index
            tile["route_index"] = routeIndex;
            highestIndex = Math.max(routeIndex, highestIndex);
            tilesGoodForExploring.push(tile);
        }

        // Score the tiles in [0,1]
        for (let tile of tilesGoodForExploring){
            // Add 1 so we don't get division by 0
            tile["score"] = (tile["route_index"] + 1) / (highestIndex + 1);
        }
        return tilesGoodForExploring;
    }

    determineExplorationTiles(possibleEndTiles){
        let enemies = this.getEnemyData();
        let noEnemiesVisible = true;

        // Find the shortest distance to enemy at the start of the turn
        for (let enemy of enemies){
            if (enemy["status"] != "unknown"){
                noEnemiesVisible = false;
                break;
            }
        }

        // If no enemies are visible then instead choose a new strategy
        if (noEnemiesVisible){
            // If there are still spawn points left to check
            if (this.getBrain().hasUnexploredSpawnpoints()){
                return this.getTilesCloserToUnexploredSpawnpoints(possibleEndTiles);
            }
            // Else this is the last option to explore
            return this.determineFurthestOutTiles(possibleEndTiles);
        }
        // Nothing to explore in this case
        return [];
    }

    determineCloserTiles(possibleEndTiles, shootOneTiles){
        let closerTiles = [];
        let enemies = this.getEnemyData();
        let noEnemiesVisible = true;

        // Find the shortest distance to enemy at the start of the turn
        for (let enemy of enemies){
            if (enemy["status"] != "unknown"){
                noEnemiesVisible = false;
                break;
            }
        }

        // If no enemies are visible then return nothing
        if (noEnemiesVisible){
            return [];
        }

        let isUnsafeTile = (tileX, tileY) => {
            for (let tile of shootOneTiles){
                // Don't worry about confidence < 1 tiles
                if (tile["tile_x"] === tileX && tile["tile_y"] === tileY && tile["confidence"] === 1){
                    return true;
                }
            }
            return false;
        }

        let scene = this.getGamemode().getScene();
        // Check tiles
        let lowestShortestDistance = Number.MAX_SAFE_INTEGER;
        let lowestTotalDistance = Number.MAX_SAFE_INTEGER;
        let distanceMovePerTurn = RETRO_GAME_DATA["skirmish"]["distance_per_turn"][this.getRankName()];

        // Create routes to all enemies
        let routes = {};
        let shortestRouteToEnemy = null;
        for (let enemyObj of enemies){
            if (enemyObj["status"] === "unknown"){ continue; }
            let routeToEnemy = this.generateShortestRouteToPoint(enemyObj["tile_x"], enemyObj["tile_y"]);
            routes[enemyObj["entity_id"]] = routeToEnemy;
            if (shortestRouteToEnemy === null || routeToEnemy.getLength() < shortestRouteToEnemy.getLength()){
                shortestRouteToEnemy = routeToEnemy;
            }
        }
        // Loop through all tiles and find out how they compare to tiles along the routes
        for (let tile of possibleEndTiles){
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            // Ignore unsafe tiles
            if (isUnsafeTile(tileX, tileY)){ continue; }
            let shortestDistance;
            let totalDistance = 0;
            // Determine shortest distance
            if (distanceMovePerTurn >= shortestRouteToEnemy.getLength()){
                shortestDistance = shortestRouteToEnemy.getLength();
            }else{
                let tileAtMaxDistance = shortestRouteToEnemy.getTileInRouteAtIndex(distanceMovePerTurn);
                shortestDistance = calculateEuclideanDistance(tileX, tileY, tileAtMaxDistance["tile_x"], tileAtMaxDistance["tile_y"]);
            }

            // Find the total distance to the perfect path to enemy
            for (let enemyObj of enemies){
                if (enemyObj["status"] === "unknown"){ continue; }
                let routeToEnemy = routes[enemyObj["entity_id"]];
                // If distance from current to this tile is longer than the distance to this enemy
                if (distanceMovePerTurn >= routeToEnemy.getLength()){
                    totalDistance += routeToEnemy.getLength();
                }else{
                    let tileAtMaxDistance = routeToEnemy.getTileInRouteAtIndex(distanceMovePerTurn);
                    totalDistance += calculateEuclideanDistance(tileX, tileY, tileAtMaxDistance["tile_x"], tileAtMaxDistance["tile_y"]);
                }
            }
            tile["shortest_distance"] = shortestDistance;
            tile["total_distance"] = totalDistance;
            lowestShortestDistance = Math.min(shortestDistance, lowestShortestDistance);
            lowestTotalDistance = Math.min(totalDistance, lowestTotalDistance);
            closerTiles.push(tile);
        }

        // Value the tiles with a score of [0,1]
        for (let tile of closerTiles){
            if (lowestShortestDistance === 0){
                tile["score"] = 0.5;
            }else{
                tile["score"] = 0.5 * lowestShortestDistance / tile["shortest_distance"];
            }
            if (lowestTotalDistance === 0){
                tile["score"] += 0.5;
            }else{
                tile["score"] += 0.5 * lowestTotalDistance / tile["total_distance"];
            }
        }

        return closerTiles;
    }

    determinePositionsCloseToMyTroops(possibleEndTiles, shootOneTiles){
        let closerTiles = [];
        let friends = this.getFriends();

        let isUnsafeTile = (tileX, tileY) => {
            for (let tile of shootOneTiles){
                // Don't worry about confidence < 1 tiles
                if (tile["tile_x"] === tileX && tile["tile_y"] === tileY && tile["confidence"] === 1){
                    return true;
                }
            }
            return false;
        }

        // Create routes to all friends
        let routes = {};
        let shorestRouteToFriend = null;
        let totalRouteToFriendLength = 0;
        for (let friend of friends){
            let routeToFriend = this.generateShortestRouteToPoint(friend.getTileX(), friend.getTileY());
            routes[friend.getID()] = routeToFriend;
            if (shorestRouteToFriend === null || routeToFriend.getLength() < shorestRouteToFriend.getLength()){
                shorestRouteToFriend = routeToFriend;
            }
            totalRouteToFriendLength += routeToFriend.getLength();
        }

        let averageRouteToFriendLength = totalRouteToFriendLength / friends.length;
        // Don't search for friends if they are all close
        if (averageRouteToFriendLength < RETRO_GAME_DATA["bot"]["min_avg_route_to_friend_length_to_ignore"]){
            return [];
        }

        let scene = this.getGamemode().getScene();
        // Check tiles
        let lowestShortestDistance = Number.MAX_SAFE_INTEGER;
        let lowestTotalDistance = Number.MAX_SAFE_INTEGER;
        // Note: Not hard coding "officer" because maybe I add some lower ranking troop at some point
        let distanceMovePerTurn = RETRO_GAME_DATA["skirmish"]["distance_per_turn"][this.getRankName()];

        // Loop through all tiles and find out how they compare to tiles along the routes
        for (let tile of possibleEndTiles){
            let tileX = tile["tile_x"];
            let tileY = tile["tile_y"];
            // Ignore unsafe tiles
            if (isUnsafeTile(tileX, tileY)){ continue; }
            let shortestDistance;
            let totalDistance = 0;
            // Determine shortest distance
            if (distanceMovePerTurn >= shorestRouteToFriend.getLength()){
                shortestDistance = shorestRouteToFriend.getLength();
            }else{
                let tileAtMaxDistance = shorestRouteToFriend.getTileInRouteAtIndex(distanceMovePerTurn);
                shortestDistance = calculateEuclideanDistance(tileX, tileY, tileAtMaxDistance["tile_x"], tileAtMaxDistance["tile_y"]);
            }

            // Find the total distance to the perfect path to friend
            for (let friend of friends){
                let routeToFriend = routes[friend.getID()];
                // If distance from current to this tile is longer than the distance to this enemy
                if (distanceMovePerTurn >= routeToFriend.getLength()){
                    totalDistance += routeToFriend.getLength();
                }else{
                    let tileAtMaxDistance = routeToFriend.getTileInRouteAtIndex(distanceMovePerTurn);
                    totalDistance += calculateEuclideanDistance(tileX, tileY, tileAtMaxDistance["tile_x"], tileAtMaxDistance["tile_y"]);
                }
            }
            tile["shortest_distance"] = shortestDistance;
            tile["total_distance"] = totalDistance;
            lowestShortestDistance = Math.min(shortestDistance, lowestShortestDistance);
            lowestTotalDistance = Math.min(totalDistance, lowestTotalDistance);
            closerTiles.push(tile);
        }

        // Value the tiles with a score of [0,1]
        for (let tile of closerTiles){
            if (lowestShortestDistance === 0){
                tile["score"] = 0.5;
            }else{
                tile["score"] = 0.5 * lowestShortestDistance / tile["shortest_distance"];
            }
            if (lowestTotalDistance === 0){
                tile["score"] += 0.5;
            }else{
                tile["score"] += 0.5 * lowestTotalDistance / tile["total_distance"];
            }
        }

        return closerTiles;
    }

    determineSingleBushTiles(possibleEndTiles){
        let singleBushTiles = [];
        // Note: Weed out multi-bushes
        let scene = this.getGamemode().getScene();
        let enemyData = this.getEnemyData();
        let maxDistanceInTiles = Math.sqrt(2 * Math.pow(RETRO_GAME_DATA["skirmish"]["area_size"], 2));
        let calculateTileScore = (possibleEndTile) => {
            // Do not stay at the same tile if you just shot from there
            if (this.hasShotSinceLastTurn() && possibleEndTile["tile_x"] === this.getTileX() && possibleEndTile["tile_y"] === this.getTileY()){
                return 0;
            }
            let totalDistanceToEnemiesInTiles = 0;
            for (let enemyObj of enemyData){
                if (enemyObj["status"] === "unknown"){
                    totalDistanceToEnemiesInTiles += maxDistanceInTiles;
                    continue;
                }
                // If this bush would be visible to this enemy (if they are at the stored location)
                let distanceToEnemyInTiles = calculateEuclideanDistance(enemyObj["tile_x"], enemyObj["tile_y"], possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
                // Note: This isn't a perfect indicator of the entry being visible, more of a rough approximation
                let entryToTileVisibleToThisEnemy = distanceToEnemyInTiles < this.gamemode.getEnemyVisibilityDistance();
                let alreadyOnThisTile = possibleEndTile["tile_x"] === this.getTileX() && possibleEndTile["tile_y"] === this.getTileY();
                // A single bush you are already in isn't affected by the entry visibility
                if (alreadyOnThisTile){
                    entryToTileVisibleToThisEnemy = false;
                }
                // Worth nothing if the entry to tile is visible to the enemies
                if (entryToTileVisibleToThisEnemy){
                    return 0;
                }
                totalDistanceToEnemiesInTiles += distanceToEnemyInTiles;
            }
            let averageDistanceToEnemiesInTiles = totalDistanceToEnemiesInTiles / enemyData.length;
            // Score in range [0,1]
            return 1 - averageDistanceToEnemiesInTiles / maxDistanceInTiles;
        }
        // Find good single cover and value them
        for (let possibleEndTile of possibleEndTiles){
            if (!scene.hasPhysicalTileAtLocation(possibleEndTile["tile_x"], possibleEndTile["tile_y"])){ continue; }
            let physicalTile = scene.getPhysicalTileAtLocation(possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
            if (physicalTile.hasAttribute("single_cover")){
                // Ignore single bushes that are visible to enemies given their last known positions
                let score = calculateTileScore(possibleEndTile);
                // Don't even bother with such a bad score
                if (score === 0) { continue; }
                // Determine the score
                possibleEndTile["score"] = score;
                singleBushTiles.push(possibleEndTile);
            }
        }
        return singleBushTiles;
    }

    determineMultiBushTiles(possibleEndTiles){
        let multiBushTiles = [];
        // Note: Weed out single-bushes

        let enemyData = this.getEnemyData();
        let friendlies = this.getFriends();
        let scene = this.getScene();

        let tileInMultiCover = (tileX, tileY) => {
            return scene.tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
        }

        let containsEnemy = (tileX, tileY) => {
            let bestEnemyConfidence = 0;
            for (let enemyObj of enemyData){
                if (enemyObj["status"] === "unknown"){ continue; }
                if (!tileInMultiCover(enemyObj["tile_x"], enemyObj["tile_y"])){ continue; }
                // If this enemy is in the same multi cover
                if (scene.tilesInSameMultiCover(enemyObj["tile_x"], enemyObj["tile_y"], tileX, tileY)){
                    bestEnemyConfidence = Math.max(bestEnemyConfidence, this.getBrain().getEnemyConfidence(enemyObj["entity_id"], this.gamemode.getOtherTeam(this.getTeamName())));
                }
            }
            return bestEnemyConfidence;
        }

        let containsFriendly = (tileX, tileY) => {
            for (let friendly of friendlies){
                if (!tileInMultiCover(friendly.getTileX(), friendly.getTileY())){ continue; }
                // If this troop is in the same multi cover
                if (scene.tilesInSameMultiCover(friendly.getTileX(), friendly.getTileY(), tileX, tileY)){
                    return true;
                }
            }
            return false;
        }

        let maxDistanceInTiles = Math.sqrt(2 * Math.pow(RETRO_GAME_DATA["skirmish"]["area_size"], 2));
        let calculateDistanceToEnemyScore = (possibleEndTile) => {
            let totalDistanceToEnemiesInTiles = 0;
            for (let enemyObj of enemyData){
                if (enemyObj["status"] === "unknown"){
                    totalDistanceToEnemiesInTiles += maxDistanceInTiles;
                    continue;
                }
                // If this bush would be visible to this enemy (if they are at the stored location)
                let distanceToEnemyInTiles = calculateEuclideanDistance(enemyObj["tile_x"], enemyObj["tile_y"], possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
                // Note: This isn't a perfect indicator of the entry being visible, more of a rough approximation
                let entryToTileVisibleToThisEnemy = distanceToEnemyInTiles < this.gamemode.getEnemyVisibilityDistance();
                let alreadyInThisMultiCover = this.isInMultipleCover() && this.gamemode.getScene().tilesInSameMultiCover(this.getTileX(), this.getTileY(), possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
                // A multi bush you are already in isn't affected by the entry visibility
                if (alreadyInThisMultiCover){
                    entryToTileVisibleToThisEnemy = false;
                }
                // Worth nothing if the entry to tile is visible to the enemies
                if (entryToTileVisibleToThisEnemy){
                    return 0;
                }
                totalDistanceToEnemiesInTiles += distanceToEnemyInTiles;
            }
            let averageDistanceToEnemiesInTiles = totalDistanceToEnemiesInTiles / enemyData.length;
            // Score in range [0,1]
            return 1 - averageDistanceToEnemiesInTiles / maxDistanceInTiles;
        }

        // Determine a score for each multi bush tile
        for (let possibleEndTile of possibleEndTiles){
            if (!tileInMultiCover(possibleEndTile["tile_x"], possibleEndTile["tile_y"])){ continue; }
            let enemyConfidence = containsEnemy(possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
            let spotContainsEnemy = enemyConfidence > 0;
            let distanceScore = calculateDistanceToEnemyScore(possibleEndTile);
            // If contains an enemy then add it
            if (spotContainsEnemy){
                possibleEndTile["score"] = enemyConfidence * RETRO_GAME_DATA["bot"]["multi_cover_enemy_weight"];
            }
            // Else if it contains a friendly
            else if (containsFriendly(possibleEndTile["tile_x"], possibleEndTile["tile_y"])){
                possibleEndTile["score"] = calculateDistanceToEnemyScore(possibleEndTile) * RETRO_GAME_DATA["bot"]["multi_cover_friendly_occupied_weight"];
            }
            // Else empty
            else{
                possibleEndTile["score"] = calculateDistanceToEnemyScore(possibleEndTile) * RETRO_GAME_DATA["bot"]["multi_cover_empty_weight"];
            }

            // Do not stay at the same tile if you just shot from there
            if (this.hasShotSinceLastTurn() && possibleEndTile["tile_x"] === this.getTileX() && possibleEndTile["tile_y"] === this.getTileY()){
                possibleEndTile["score"] = 0;
            }

            multiBushTiles.push(possibleEndTile);
        }

        return multiBushTiles;
    }

    determineRoughShootAndStabTiles(tileSelection){
        let roughShootTiles = [];
        let roughStabTiles = [];
        let scene = this.getGamemode().getScene();
        let angleIntervalDEG = 5;
        let gun = this.getGun();
        let range = gun.getBulletRange();
        let myID = this.getID();
        let enemies = this.getEnemyData();
        // Look at each tile you can stand on to shoot
        for (let tile of tileSelection){
            let playerLeftX = scene.getXOfTile(tile["tile_x"]);
            let playerTopY = scene.getYOfTile(tile["tile_y"]);
            // Loop through enemies
            for (let enemyObj of enemies){
                if (enemyObj["status"] === "unknown"){ continue; }
                let myXLeftWhenOnTile = scene.getXOfTile(tile["tile_x"]);
                let myYTopWhenOnTile = scene.getYOfTile(tile["tile_y"]);
                // Note: Assuming all troops have a melee weapon
                let meleeWeapon = this.getMeleeWeapon();
                let myCenterXWhenOnTile = scene.getCenterXOfTile(tile["tile_x"]);
                let myCenterYWhenOnTile = scene.getCenterYOfTile(tile["tile_y"]);
                let enemyX = scene.getCenterXOfTile(enemyObj["tile_x"]);
                let enemyY = scene.getCenterYOfTile(enemyObj["tile_y"]);
                let distanceToEnemy = calculateEuclideanDistance(myCenterXWhenOnTile, myCenterYWhenOnTile, enemyX, enemyY);
                
                // Ignore possibility of stabbing or shooting
                if (distanceToEnemy < RETRO_GAME_DATA["general"]["tile_size"]){
                    continue;
                }

                let confidenceInEnemyPosition = this.getBrain().getEnemyConfidence(enemyObj["entity_id"], this.gamemode.getOtherTeam(this.getTeamName()));

                let yDiff = enemyY - myCenterYWhenOnTile;
                let angleToEnemy = displacementToRadians(enemyX - myCenterXWhenOnTile, yDiff);
                let visualDirectionToFace = angleToBestFaceDirection(angleToEnemy);
                let directionToEnemyAlt = getMovementDirectionOf(visualDirectionToFace);
                let swingCenterX = meleeWeapon.getSwingCenterX(myXLeftWhenOnTile, visualDirectionToFace);
                let swingCenterY = meleeWeapon.getSwingCenterY(myYTopWhenOnTile, visualDirectionToFace);
                // Note: It's actually to their center when you only need a corner but I'll let bots be conservative
                let swingDistanceToEnemy = calculateEuclideanDistance(swingCenterX, swingCenterY, enemyX, enemyY);
                // If the swing distance is low enough then try swinging
                if (swingDistanceToEnemy < meleeWeapon.getSwingRange()){
                    let tileCopy = copyObject(tile);
                    tileCopy["direction_to_face"] = directionToEnemyAlt;
                    tileCopy["confidence"] = confidenceInEnemyPosition;
                    roughStabTiles.push(tileCopy);
                }
                let offsetAmount = RETRO_GAME_DATA["general"]["tile_size"]/4;
                let offsetAngleAtRange = Math.atan(offsetAmount/distanceToEnemy);

                let anglesToShootAt = [angleToEnemy, rotateCWRAD(angleToEnemy, offsetAngleAtRange), rotateCCWRAD(angleToEnemy, offsetAngleAtRange)];
                for (let angleToShootAt of anglesToShootAt){
                    visualDirectionToFace = angleToBestFaceDirection(angleToShootAt);
                    let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, visualDirectionToFace, angleToShootAt);
                    let x = pos["x"];
                    let y = pos["y"];
                    // Check shoot directory at enemy
                    let collision = scene.findInstantCollisionForProjectile(x, y, angleToShootAt, range, (entity) => { return entity.getID() == myID; });
                    if (collision["collision_type"] === "entity"){
                        if (!collision["entity"].isOnSameTeam(this)){
                            // Copy so you can reuse
                            let tileCopy = copyObject(tile);
                            tileCopy["enemy_health"] = this.getBrain().getHealthOfEnemy(collision["entity"].getID());
                            tileCopy["angle_rad"] = angleToShootAt;
                            tileCopy["direction_to_face"] = getMovementDirectionOf(visualDirectionToFace);
                            tileCopy["distance_to_enemy"] = collision["entity"].distanceToTile(tile["tile_x"], tile["tile_y"]);
                            // Even though we might hit a different enemy, the confidence is based on the enemy being aimed at
                            tileCopy["confidence"] = confidenceInEnemyPosition;
                            roughShootTiles.push(tileCopy);
                        }
                    }
                }
            }
        }

        // Score the shoot tiles
        let bestHealth = Number.MAX_SAFE_INTEGER;
        for (let roughShootTile of roughShootTiles){
            bestHealth = Math.min(roughShootTile["enemy_health"]);
        }
        for (let roughShootTile of roughShootTiles){
            roughShootTile["score"] = bestHealth / roughShootTile["enemy_health"];
        }

        return {"rough_shoot_tiles": roughShootTiles, "rough_stab_tiles": roughStabTiles};
    }

    getGun(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            let item = items[i];
            if (item instanceof Gun){
                return item;
            }
        }
        return null;
    }

    getMeleeWeapon(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            let item = items[i];
            if (item instanceof Sword){
                return item;
            }
        }
        return null;
    }

    cannonIsOnCooldown(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            let item = items[i];
            if (item instanceof PointToShootCannon){
                return item.isOnCooldown();
            }
        }
        return null;
    }

    getWhiteFlag(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            let item = items[i];
            if (item instanceof WhiteFlag){
                return item;
            }
        }
        return null;
    }

    // TODO: Move this to character.js or something this is defined in at least 2 other classes. Well not exactly but similar.
    generateSelectedTroopsForPosition(myPlayerTileX, myPlayerTileY){
        let allTroopsOnMyTeam = this.getGamemode().getLivingTeamRosterFromName(this.getTeamName());
        let selectedTroops = [];
        for (let otherTroop of allTroopsOnMyTeam){
            // Ignore me
            if (otherTroop.is(this)){ continue; }

            let otherTroopTileX = otherTroop.getTileX();
            let otherTroopTileY = otherTroop.getTileY();
            let distance = Math.sqrt(Math.pow(myPlayerTileX - otherTroopTileX, 2) + Math.pow(myPlayerTileY - otherTroopTileY, 2));
            if (distance < RETRO_GAME_DATA["skirmish"]["troop_selection_distance"]){
                selectedTroops.push(otherTroop);
            }
        }
        return selectedTroops;
    }
}