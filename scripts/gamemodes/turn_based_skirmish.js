class TurnBasedSkirmish extends Gamemode {
    constructor(){
        super();

        this.britishTroops = [];
        this.americanTroops = [];
        this.stats = new AfterMatchStats();
        this.gameOver = false;
        this.britishSpawn = null;
        this.americanSpawn = null;

        this.gameState = null;
        this.initializeGameState();

        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    visibleToTeam(observerTeamName, observedTeamName, characterID){
        // Note: Assumed team1 != team2
        let teamVisibilityJSON = this.gameState["visible_characters"][observerTeamName];
        
        // If out of date -> update it
        if (teamVisibilityJSON["last_updated"] < this.gameState["turn_counter"]){
            this.calculateVisibility(observerTeamName, observedTeamName);
        }

        // Check all ids
        let ids = this.gameState["visible_characters"][observerTeamName]["character_ids"];
        for (let id of ids){
            if (id == characterID){
                return true;
            }
        }
        return false;
    }

    calculateVisibility(observerTeamName, observedTeamName){
        let teamVisibilityJSON = this.gameState["visible_characters"][observerTeamName];
        let observerRoster = this.getTeamRosterFromName(observerTeamName);
        let observedRoster = this.getTeamRosterFromName(observedTeamName);
        let ids = [];
        for (let observedTroop of observedRoster){
            let included = false;
            for (let observerTroop of observerRoster){
                if (observedTroop.isVisibleToSuper(observerTroop)){
                    included = true;
                    break;
                }
            }
            if (included){
                ids.push(observedTroop.getID());
            }
        }
        teamVisibilityJSON["character_ids"] = ids;
    }

    getTeamRosterFromName(teamName){
        let teamProperAdjective = getProperAdjective(teamName);
        if (teamProperAdjective == "British"){
            return this.britishTroops;
        }
        return this.americanTroops;
    }

    gameTick(){
        this.makeMove();
    }

    makeMove(){
        // Assuming game still running
        let currentTeamName = this.gameState["turn"];
        let teamRoster = currentTeamName == "British" ? this.britishTroops : this.americanTroops;

        let currentlyMovingCharacter;
        let currentlyMovingCharacterIndex = this.gameState["troop_to_move_index"][currentTeamName];
        let livingCount = 0;
        for (let troop of teamRoster){
            if (troop.isAlive()){
                livingCount++;
            }
        }

        // Adjust the index of the currently moving character based on how many are alive on the team
        if (currentlyMovingCharacterIndex > livingCount){
            currentlyMovingCharacterIndex = 0;
        }

        let characterIndex = 0;
        for (let troop of teamRoster){
            if (troop.isAlive()){
                if (characterIndex == currentlyMovingCharacterIndex){
                    currentlyMovingCharacter = troop;
                    break;
                }
                characterIndex++;
            }
        }

        // Now the currently moving troop is selected
        if (!currentlyMovingCharacter.isMakingAMove()){
            currentlyMovingCharacter.indicateTurn();
            return;
        }

        // currentlyMovingCharacter is making a move

        // If currentlyMovingCharacter is still making the move do nothing
        if (!currentlyMovingCharacter.isMoveDone()){
            return;
        }

        // If currentlyMovingCharacter is done their move

        // Go to next index
        this.gameState["troop_to_move_index"][currentTeamName] = (currentlyMovingCharacterIndex + 1) % livingCount;

        // Switch teams
        this.gameState["turn"] = this.gameState["turn"] == "British" ? "American" : "British";

        // Increase turn counter (used for simplifying some operations)
        this.gameState["turn_counter"] += 1;

        // Call again (state changed so its not an infinite loop)
        this.makeMove();
    }

    initializeGameState(){
        this.gameState = {
            "turn": "British",
            "operation_type": {
                "British": "human",
                "American": "human" // or "bot"
            },
            "troop_to_move_index": {
                "British": 0,
                "American": 0
            },
            "turn_counter": 0,
            "visible_characters": {
                "British": {
                    "character_ids": [],
                    "last_updated": -1
                },
                "American": {
                    "character_ids": [],
                    "last_updated": -1
                }
            }
        }
    }

    async startUp(){
        await this.generateTiles();

        this.spawnTroops();

        this.startUpLock.unlock();
    }

    isOver(){
        return this.gameOver;
    }

    checkWin(){
        let livingAmericans = false;
        for (let american of this.americanTroops){
            if (american.isAlive()){
                livingAmericans = true;
                break;
            }
        }
        if (!livingAmericans){
            this.gameOver = true;
            this.stats.setWinner("British");
            return;
        }
        let livingBritish = false;
        for (let brit of this.britishTroops){
            if (brit.isAlive()){
                livingBritish = true;
                break;
            }
        }
        if (!livingBritish){
            this.gameOver = true;
            this.stats.setWinner("Americans");
        }
    }

    spawnTroops(){
        let samuel = new SkirmishHuman(this, "british_pvt_g", "British");
        samuel.setID("samuel");
        samuel.getInventory().add(new HumanSkirmishMusket("brown_bess", {
            "player": samuel
        }));
        samuel.setTileX(this.britishSpawn["x"]);
        samuel.setTileY(this.britishSpawn["y"]);
        this.scene.addEntity(samuel);
        this.scene.setFocusedEntity(samuel);
        this.britishTroops.push(samuel);

        let enemy = new SkirmishHuman(this, "usa_pvt", "American");
        enemy.setID("npc1");
        console.log(this.americanSpawn)
        enemy.setTileX(this.americanSpawn["x"]);
        enemy.setTileY(this.americanSpawn["y"]);
        this.scene.addEntity(enemy);
        this.americanTroops.push(enemy);
        /*enemy.getInventory().add(new HumanSkirmishMusket("brown_bess", {
            "player": enemy
        }));*/
    }



    async generateTiles(){
        let scene = this.getScene();
        let size = RETRO_GAME_DATA["skirmish"]["area_size"];

        // Visual Details
        let grassDetails = {"name":"grass","file_link":"images/grass.png"};
        let rockDetails = {"name":"rock_on_grass","file_link":"images/rock_on_grass.png"};
        let waterDetails = {"name":"water","file_link":"images/water.png"};
        let brigeDetails = {"name":"bridge","file_link":"images/bridge.png"};
        let bushDetails = {"name":"bush","file_link":"images/bush.png"};
        let bigBushDetails = {"name":"thick_bush","file_link":"images/thick_bush.png"};

        // Physical Details
        let noWalkDetails = getPhysicalTileDetails("unwalkable");
        let multiCoverDetails = getPhysicalTileDetails("multi_cover");
        let singleCoverDetails = getPhysicalTileDetails("single_cover");
        let fullBlockDetails = getPhysicalTileDetails("full_block");

        // Ensure images are loaded
        await ensureImageIsLoadedFromDetails(grassDetails);
        await ensureImageIsLoadedFromDetails(rockDetails);
        await ensureImageIsLoadedFromDetails(waterDetails);
        await ensureImageIsLoadedFromDetails(brigeDetails);
        await ensureImageIsLoadedFromDetails(bushDetails);
        await ensureImageIsLoadedFromDetails(bigBushDetails);


        // Do the border

        // Left
        for (let y = -1; y <= size; y++){
            scene.placePhysicalTile(fullBlockDetails, -1, y);
        }

        // Right
        for (let y = -1; y <= size; y++){
            scene.placePhysicalTile(fullBlockDetails, size, y);
        }

        // Bottom
        for (let x = -1; x <= size; x++){
            scene.placePhysicalTile(fullBlockDetails, x, -1);
        }

        // Top
        for (let x = -1; x <= size; x++){
            scene.placePhysicalTile(fullBlockDetails, x, size);
        }

        // Fill with grass
        for (let x = 0; x < size; x++){
            for (let y = 0; y < size; y++){
                scene.placeVisualTile(grassDetails, x, y);
            }
        }

        let rockClusteres = 16;
        let minRockClusterSize = 3;
        let maxRockClusterSize = 13;
        let smallBushes = 20;
        let minBigBushSize = 8;
        let maxBigBushSize = 20;
        let bigBushes = 5;

        let seed = randomNumberInclusive(0,1000);
        let random = new SeededRandomizer(seed);
        console.log("seed", seed)

        let placeCluster = (visualTileDetails, physicalTileDetails, x, y, clusterSize) => {
            // Note: Assume x and y are within the reasonable borders
            let tilesToCheck = [{"placed": false, "x": x, "y": y}];
            let tilesLeftToCheck = true;
            let placedCount = 0;

            while (tilesLeftToCheck && placedCount < clusterSize){
                tilesLeftToCheck = false;
                let currentTile = null;

                // Find a tile to start with
                let availableTiles = [];
                for (let tile of tilesToCheck){
                    if (!tile["placed"]){
                        availableTiles.push(tile);
                    }
                }
                // If can't find a tile then
                if (availableTiles.length == 0){ break; }
                // Pick a random tile
                currentTile = availableTiles[random.getIntInRangeInclusive(0, availableTiles.length-1)];

                // Explore tiles around current location
                let pairs = [[currentTile["x"], currentTile["y"]+1], [currentTile["x"], currentTile["y"]-1], [currentTile["x"]+1, currentTile["y"]], [currentTile["x"]-1, currentTile["y"]]];
                for (let pair of pairs){
                    let tileX = pair[0];
                    let tileY = pair[1];

                    let isWithinBorders = tileX > -1 && tileX < size && tileY > -1 && tileY < size;
                    // Disregard if not within playable area
                    if (!isWithinBorders){ continue; }

                    let alreadyExists = false;
                    
                    // Check if its already on the todo list
                    for (let tile of tilesToCheck){
                        if (tile["x"] == tileX && tile["y"] == tileY){
                            alreadyExists = true;
                            break;
                        }
                    }
                    // Found a new tile
                    if (!alreadyExists){
                        tilesLeftToCheck = true;
                        tilesToCheck.push({
                            "placed": false,
                            "x": tileX,
                            "y": tileY
                        });
                    }
                }

                // Place the tile
                currentTile["placed"] = true;
                placedCount++;
                scene.placeVisualTile(visualTileDetails, currentTile["x"], currentTile["y"]);

                // If not null -> place, else delete
                if (physicalTileDetails != null){
                    scene.placePhysicalTile(physicalTileDetails, currentTile["x"], currentTile["y"]);
                }else{
                    scene.deletePhysicalTile(currentTile["x"], currentTile["y"]);
                }

                // Extra check to see if not done
                if (!tilesLeftToCheck){
                    for (let tile of tilesToCheck){
                        if (!tile["placed"]){
                            tilesLeftToCheck = true;
                            break;
                        }
                    }
                }
            }
        }

        // Place rock clusters
        for (let i = 0; i < rockClusteres; i++){
            placeCluster(rockDetails, fullBlockDetails, random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(minRockClusterSize, maxRockClusterSize));
        }

        // Place Small Bushes
        for (let i = 0; i < smallBushes; i++){
            let x = random.getIntInRangeInclusive(0, size-1);
            let y = random.getIntInRangeInclusive(0, size-1);
            scene.placeVisualTile(bushDetails, x, y);
            scene.placePhysicalTile(singleCoverDetails, x, y);
        }

        // Place Multi Bushes
        for (let i = 0; i < bigBushes; i++){
            placeCluster(bigBushDetails, multiCoverDetails, random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(minBigBushSize, maxBigBushSize));
        }

        // Place River
        let minRiverWidth = 3;
        let maxRiverWidth = 5;
        let numRivers = 3;

        let makeRiver = (riverAngleRAD, riverStartX, riverStartY, currentWidth, riverType, minRiverWidth, maxRiverWidth) => {
            let startingTileX = Math.min(size, Math.max(0, RetroGameScene.getTileXAt(riverStartX)));
            let startingTileY = Math.min(size, Math.max(0, RetroGameScene.getTileXAt(riverStartY)));

            let range = size*RETRO_GAME_DATA["general"]["tile_size"];
            let finalOffsetX = range * Math.cos(riverAngleRAD);
            let finalOffsetY = range * Math.sin(riverAngleRAD);

            let endX = riverStartX + finalOffsetX;
            let endY = riverStartY + finalOffsetY;

            let endTileX = Math.max(0, Math.min(size, RetroGameScene.getTileXAt(endX)));
            let endTileY = Math.max(0, Math.min(size, RetroGameScene.getTileYAt(endY)));

            let tileX = RetroGameScene.getTileXAt(riverStartX);
            let tileY = RetroGameScene.getTileYAt(riverStartY);
            let widthDir = Math.abs(Math.cos(riverAngleRAD)) > Math.abs(Math.sin(riverAngleRAD)) ? "y" : "x";

            // While not at end 
            while (tileX != endTileX || tileY != endTileY){
                let distanceToEndUp = Math.sqrt(Math.pow(endTileX - tileX, 2) + Math.pow(endTileY - (tileY + 1), 2));
                let distanceToEndDown = Math.sqrt(Math.pow(endTileX - tileX, 2) + Math.pow(endTileY - (tileY - 1), 2));
                let distanceToEndLeft = Math.sqrt(Math.pow(endTileX - (tileX-1), 2) + Math.pow(endTileY - tileY, 2));
                let distanceToEndRight = Math.sqrt(Math.pow(endTileX - (tileX+1), 2) + Math.pow(endTileY - tileY, 2));

                let nextDir = "up";
                let nextDirAmount = distanceToEndUp;
                if (distanceToEndDown < nextDirAmount){
                    nextDir = "down";
                    nextDirAmount = distanceToEndDown;
                }
                if (distanceToEndLeft < nextDirAmount){
                    nextDir = "left";
                    nextDirAmount = distanceToEndLeft;
                }
                if (distanceToEndRight < nextDirAmount){
                    nextDir = "right";
                    nextDirAmount = distanceToEndRight;
                }

                let lowerWidthOffset = Math.floor(currentWidth/2);
                let upperWidthOffset = Math.floor(currentWidth/2);
                if (currentWidth % 2 == 0){
                    if (random.getIntInRangeInclusive(0,1) == 0){
                        lowerWidthOffset--;
                    }else{
                        upperWidthOffset++;
                    }
                }

                if (widthDir == "x"){
                    for (let x = tileX - lowerWidthOffset; x <= tileX + upperWidthOffset; x++){
                        if (x < 0 || x >= size){ continue; }
                        scene.placeVisualTile(waterDetails, x, tileY);
                        scene.placePhysicalTile(noWalkDetails, x, tileY);
                    }
                }else{
                    for (let y = tileY - lowerWidthOffset; y <= tileY + upperWidthOffset; y++){
                        if (y < 0 || y >= size){ continue; }
                        scene.placeVisualTile(waterDetails, tileX, y);
                        scene.placePhysicalTile(noWalkDetails, tileX, y);
                    }
                }

                // Move
                if (nextDir == "left"){
                    tileX--;
                }else if (nextDir == "right"){
                    tileX++;
                }else if (nextDir == "up"){
                    tileY++;
                }else{
                    tileY--;
                }

                currentWidth += random.getIntInRangeInclusive(-1, 1);
                currentWidth = Math.max(minRiverWidth, Math.min(maxRiverWidth, currentWidth));
                widthDir = (nextDir == "up" || nextDir == "down") ? "x" : "y";
            }
        }

        // For each river
        for (let i = 0; i < numRivers; i++){
            let riverType = random.getIntInRangeInclusive(1,4);
            let riverAngleRAD;
            let riverStartX;
            let riverStartY;
            let currentWidth = random.getIntInRangeInclusive(minRiverWidth, maxRiverWidth);
            // Bottom Left
            if (riverType == 1){
                riverAngleRAD = random.getFloatInRange(0, Math.PI/2);
                riverStartX = random.getIntInRangeInclusive(0, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = 0;
            }else if (riverType == 2){ // Top Left
                riverAngleRAD = random.getFloatInRange(2 * Math.PI * 3/4, 2 * Math.PI);
                riverStartX = random.getIntInRangeInclusive(0, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = (size-1) * RETRO_GAME_DATA["general"]["tile_size"];
            }else if (riverType == 3){ // Bottom Right
                riverAngleRAD = random.getFloatInRange(Math.PI/2, Math.PI);
                riverStartX = random.getIntInRangeInclusive(0, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = 0;
            }else{ // Rivertype == 4 // Top Right
                riverAngleRAD = random.getFloatInRange(Math.PI, 2 * Math.PI * 3/4);
                riverStartX = (size-1) * RETRO_GAME_DATA["general"]["tile_size"];
                riverStartY = random.getIntInRangeInclusive((size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]);
            }

            // For each x, find the y tile for the river
            makeRiver(riverAngleRAD, riverStartX, riverStartY, currentWidth, riverType, minRiverWidth, maxRiverWidth);
        }

        // TEMP
        for (let tempX = 45; tempX <= 49; tempX++){
            for (let tempY = 0; tempY < 5; tempY++){
                if (tempX == 49 && tempY == 0){ continue; }
                scene.placeVisualTile(waterDetails, tempX, tempY);
                scene.placePhysicalTile(noWalkDetails, tempX, tempY);
            }
        }


        let spawns = [[0,0], [0,size-1], [size-1,0], [size-1,size-1]];
        // Set british spawn
        let britishSpawnNumber = random.getIntInRangeInclusive(0,3);
        let britishSpawn = spawns[britishSpawnNumber];
        
        // Move around spawns[3] and remove britishSpawnNumber
        spawns[britishSpawnNumber] = spawns[3];
        spawns.pop();

        // Set american spawn
        let americanSpawnNumber = random.getIntInRangeInclusive(0,2);
        let americanSpawn = spawns[americanSpawnNumber];
        spawns[americanSpawnNumber] = spawns[2];
        spawns.pop();

        let createPath = (coordSet1, coordSet2) => {
            let startX = coordSet1[0];
            let startY = coordSet1[1];
            let endX = coordSet2[0];
            let endY = coordSet2[1];

            let canWalk = (x, y) => {
                return !(scene.hasPhysicalTileCoveringLocation(x, y) && scene.getPhysicalTileCoveringLocation(x, y).hasAttribute("no_walk"));
            }

            let tileStorage = [{"x": startX, "y": startY, "can_walk": canWalk(startX, startY), "checked": false}];
            let hasPath = () => {
                for (let element of tileStorage){
                    if (element["x"] == endX && element["y"] == endY && element["can_walk"]){
                        return true;
                    }
                }
                return false;
            }

            let hasUnreadyUnblockedTilesToCheck = () => {
                for (let element of tileStorage){
                    let elementX = element["x"];
                    let elementY = element["y"];
                    // If element isn't ready to walk on and 
                    if (element["can_walk"] && !element["checked"]){
                        return true;
                    }
                }
                return false;
            }

            let withinBoundaries = (x,y) => {
                return x >= 0 && x < size && y >= 0 && y < size;
            } 

            let hasTile = (x,y) => {
                for (let element of tileStorage){
                    if (element["x"] == x && element["y"] == y){
                        return true;
                    }
                }
                return false;
            }

            let destroyTile = (tileObject) => {
                let tileX = tileObject["x"];
                let tileY = tileObject["y"];
                
                // Destroy the physical tile
                scene.deletePhysicalTile(tileX, tileY);

                let visualTile = scene.getVisualTileAtLocation(tileX, tileY);

                // Bridge over water, grass over anything else
                if (visualTile.getMaterialName() == "water"){
                    scene.placeVisualTile(brigeDetails, tileX, tileY);
                }else{
                    scene.placeVisualTile(grassDetails, tileX, tileY);
                }
            }

            // Loop until there is a path found
            while (!hasPath()){
                // Find all accessible tiles that are currentlyn ot blocked
                while (hasUnreadyUnblockedTilesToCheck()){
                    let tile = null; // Note: We know this exists because of while check
                    for (let element of tileStorage){
                        if (element["can_walk"] && !element["checked"]){
                            if (tile == null){
                                tile = element;
                            }else{
                                // Take the closest to end point when possible
                                let distanceToEnd = Math.sqrt(Math.pow(endX-element["x"], 2) + Math.pow(endY-element["y"], 2));
                                let distanceToEndExisting = Math.sqrt(Math.pow(endX-tile["x"], 2) + Math.pow(endY-tile["y"], 2));
                                if (distanceToEnd < distanceToEndExisting){
                                    tile = element;
                                }
                            }
                        }
                    }

                    // So we have the tile to check
                    tile["checked"] = true;
                    let tileX = tile["x"];
                    let tileY = tile["y"];
                    if (withinBoundaries(tileX+1, tileY) && !hasTile(tileX+1, tileY)){
                        tileStorage.push({"x": tileX+1, "y": tileY, "can_walk": canWalk(tileX+1, tileY), "checked": false})
                    }
                    if (withinBoundaries(tileX-1, tileY) && !hasTile(tileX-1, tileY)){
                        tileStorage.push({"x": tileX-1, "y": tileY, "can_walk": canWalk(tileX-1, tileY), "checked": false})
                    }
                    if (withinBoundaries(tileX, tileY+1) && !hasTile(tileX, tileY+1)){
                        tileStorage.push({"x": tileX, "y": tileY+1, "can_walk": canWalk(tileX, tileY+1), "checked": false})
                    }
                    if (withinBoundaries(tileX, tileY-1) && !hasTile(tileX, tileY-1)){
                        tileStorage.push({"x": tileX, "y": tileY-1, "can_walk": canWalk(tileX, tileY-1), "checked": false})
                    }
                }
                // If still haven't found a good path
                if (!hasPath()){
                    let toDestroy = null; // Note: No way we don't have a path unless there is something to be destroyed or invalid input
                    for (let element of tileStorage){
                        if (!element["can_walk"]){
                            if (toDestroy == null){
                                toDestroy = element;
                            }else{
                                // Take the closest to end point when possible
                                let distanceToEnd = Math.sqrt(Math.pow(endX-element["x"], 2) + Math.pow(endY-element["y"], 2));
                                let distanceToEndExisting = Math.sqrt(Math.pow(endX-toDestroy["x"], 2) + Math.pow(endY-toDestroy["y"], 2));
                                if (distanceToEnd < distanceToEndExisting){
                                    toDestroy = element;
                                }
                            }
                        }
                    }
                    destroyTile(toDestroy);
                    toDestroy["can_walk"] = true;
                }
            }
        }

        // Create paths
        createPath(britishSpawn, spawns[0]);
        createPath(americanSpawn, spawns[1]);
        createPath(spawns[0], spawns[1]);

        this.britishSpawn = {
            "x": britishSpawn[0],
            "y": britishSpawn[1]
        }

        this.americanSpawn = {
            "x": americanSpawn[0],
            "y": americanSpawn[1]
        }
    }

    display(){
        if (this.startUpLock.isLocked()){ return; }
        if (this.isOver()){
            this.stats.display();
        }else{
            this.scene.display();
        }
    }

    tick(){
        if (this.startUpLock.isLocked()){ return; }
        this.gameTick();
        this.scene.tick();
    }
}