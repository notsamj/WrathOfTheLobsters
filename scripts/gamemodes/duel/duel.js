class Duel extends Gamemode {
    constructor(gameIncludesAHuman=false, aiSeed=null){
        super();

        this.aiRandom = null;
        if (this.aiSeed != null){
            this.aiRandom = new SeededRandomizer(aiSeed);
        }

        this.participants = [];

        this.stats = new DuelMatchStats();
        this.random = null; // Declare

        let scene = this.getScene();
        this.eventHandler.addHandler("kill", (killObject) => {
            scene.addExpiringVisual(BloodPool.create(scene.getCenterXOfTile(killObject["tile_x"]), scene.getCenterYOfTile(killObject["tile_y"])));
        });

        this.eventHandler.addHandler("gun_shot", (eventObj) => {
            scene.addExpiringVisual(SmokeCloud.create(eventObj["x"], eventObj["y"]));
            SOUND_MANAGER.play("gunshot", eventObj["x"], eventObj["y"]);
        });

        this.eventHandler.addHandler("sword_swing", (eventObj) => {
            SOUND_MANAGER.play(eventObj["associated_sound_name"], eventObj["x"], eventObj["y"]);
        });

        // TODO: Create DuelCamera class
        this.camera = gameIncludesAHuman ? new DuelCamera() : null;

        this.gameOver = false;
        this.spawn1 = null;
        this.spawn2 = null;

        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    getEnemyVisibilityDistance(){
        return RETRO_GAME_DATA["skirmish"]["enemy_visibility_distance"];
    }

    getRandom(){
        return this.aiRandom;
    }

    isBotGame(){
        return this.camera != null;
    }

    gameTick(){
        if (this.isOver()){ return; }
        this.makeMove();
    }

    async startUp(){
        await this.generateTiles();

        this.spawnTroops();

        // If this is a bot vs bot game then set up the camera
        if (this.isBotGame()){
            this.scene.setFocusedEntity(this.neutralCamera);
        }

        this.startUpLock.unlock();
    }

    isOver(){
        return this.gameOver;
    }

    checkWin(){
        let aliveCount = 0;
        let winnerID = null;
        for (let participant of this.participants){
            if (participant.isAlive()){
                winnerID = participant.getID(); // Save participant ID as winner (assumed the only one alive)
                // If there is more than 1 alive (counted so far) then the game is not won
                if (++aliveCount > 1){
                    return;
                }
            }
        }

        // Alive count <= 1 but should be 1 because no way for both to die in the same tick?
        this.stats.setWinner(winnerID);
        this.gameOver = true;
    }

    spawnTroops(){
        // TODO:
        // Create officers
        for (let i = 0; i < RETRO_GAME_DATA["skirmish"]["game_play"]["officer_count"]; i++){
            let britishOfficer;
            if (britishAreHuman){
                britishOfficer = new SkirmishHuman(this, "british_officer", "officer", "British");
            }else{
                britishOfficer = new SkirmishBot(this, "british_officer", "officer", "British");
            }
            britishOfficer.setID("british_officer_" + i.toString());
            this.britishTroops.push(britishOfficer);
            officers.push(britishOfficer);

            let americanOfficer;
            if (americansAreHuman){
                americanOfficer = new SkirmishHuman(this, "usa_officer", "officer", "American");
            }else{
                americanOfficer = new SkirmishBot(this, "usa_officer", "officer", "American");
            }
            americanOfficer.setID("american_officer_" + i.toString());
            this.americanTroops.push(americanOfficer);
            officers.push(americanOfficer);
        }

        // Equip officers
        for (let officer of officers){
            officer.getInventory().add(new SkirmishPistol("flintlock", {
                "player": officer
            }));

            officer.getInventory().add(new SkirmishSword("cavalry_sword", {
                "player": officer
            }));

            officer.getInventory().add(new PointToMove({
                "player": officer
            }));

            officer.getInventory().add(new PointToShoot({
                "player": officer
            }));

            officer.getInventory().add(new PointToShootCannon({
                "player": officer
            }));
        }

        // Create privates
        for (let i = 0; i < RETRO_GAME_DATA["skirmish"]["game_play"]["private_count"]; i++){
            let britishPrivate;
            if (britishAreHuman){
                britishPrivate = new SkirmishHuman(this, "british_pvt_g", "private", "British");
            }else{
                britishPrivate = new SkirmishBot(this, "british_pvt_g", "private", "British");
            }

            britishPrivate.setID("british_private_" + i.toString());
            this.britishTroops.push(britishPrivate);
            privates.push(britishPrivate);

            let americanPrivate;
            if (americansAreHuman){
                americanPrivate = new SkirmishHuman(this, "usa_pvt", "private", "American");
            }else{
                americanPrivate = new SkirmishBot(this, "usa_pvt", "private", "American");
            }

            americanPrivate.setID("american_private_" + i.toString());
            this.americanTroops.push(americanPrivate);
            privates.push(americanPrivate);
        } 

        // Equip privates
        for (let privateTroop of privates){
            privateTroop.getInventory().add(new SkirmishMusket("brown_bess", {
                "player": privateTroop
            }));

            privateTroop.getInventory().add(new SkirmishSword("clever", {
                "player": privateTroop
            }));
        }

        let allTroops = appendLists(officers, privates);

        // Equip all troops
        for (let troop of allTroops){
            troop.getInventory().add(new WhiteFlag({
                "player": troop
            }));
            this.scene.addEntity(troop);
        }

        // Spawn British troops
        for (let troop of this.britishTroops){
            troop.setTileX(this.britishSpawn["x"]);
            troop.setTileY(this.britishSpawn["y"]);
        }

        // Spawn American troops
        for (let troop of this.americanTroops){
            troop.setTileX(this.americanSpawn["x"]);
            troop.setTileY(this.americanSpawn["y"]);
        }

        // Check and update team visibility
        this.checkAndUpdateTeamVisibility();
    }

    // Note: I stole this from Skirmish
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

        let seed = randomNumberInclusive(0,RETRO_GAME_DATA["skirmish"]["max_seed"]);

        let setSeed = RETRO_GAME_DATA["skirmish"]["seed"];
        let useSetSeed = setSeed != null;
        if (useSetSeed){
            seed = setSeed;
        }
        this.terrainRandom = new SeededRandomizer(seed);
        // If not otherwise set, use terrain random for ai random
        if (this.aiRandom === null){
            this.aiRandom = this.terrainRandom;
        }
        let random = this.terrainRandom;
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

        // TODO: Adjust this code
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
        this.scene.display();
        this.stats.display();
    }

    tick(){
        if (this.startUpLock.isLocked()){ return; }
        this.gameTick();
        if (this.camera != null){
            this.camera.tick();
        }
        this.scene.tick();
    }
}