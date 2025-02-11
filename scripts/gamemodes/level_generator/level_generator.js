/*
    Class Name: LevelGenerator
    Class Description: A gamemode for viewing generated levels
*/
class LevelGenerator extends Gamemode {
    /*
        Method Name: constructor
        Method Parameters: 
            presetData:
                JSON details about a preset
            seed:
                int. Seed for generation
        Method Description: constructor
        Method Return: constructor
    */
    constructor(presetData, seed){
        super();

        //this.camera = new DebuggerCamera(this);
        this.camera = new LevelGeneratorCamera(this);

        this.loadingLock = new Lock();

        this.uiEnabled = false;
        this.ingameUI = new LevelGeneratorMenu(this);

        this.startUp(presetData, seed);
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Gets the name of the game
        Method Return: String
    */
    getName(){ return "level_generator"; }

    /*
        Method Name: startUp
        Method Parameters: 
            presetData:
                JSON details about a preset
            seed:
                int. Seed for generation
        Method Description: Starts up the game
        Method Return: Promise (implicit)
    */
    async startUp(presetData, seed){
        // Setup camera
        this.scene.setFocusedEntity(this.camera);

        await this.loadPreset(presetData, seed);
    }

    /*
        Method Name: loadPreset
        Method Parameters: 
            presetData:
                JSON details about a preset
            seed:
                int. Seed for generation
        Method Description: Loads a preset
        Method Return: Promise (implicit)
    */
    async loadPreset(presetData, seed){
        this.loadingLock.lock();

        this.seed = seed;
        this.presetData = presetData;

        let presetName = this.presetData["name"];

        let chosenPresetFunction;
        if (presetName === "river_1"){
            chosenPresetFunction = LevelGenerator.generateRiver1Preset;
        }else if (presetName === "oak_forest_1"){
            chosenPresetFunction = LevelGenerator.generateOakForest1Preset;
        }else{
            throw new Error("Unknown preset: " + presetName);
        }

        // Generate
        await chosenPresetFunction(this.scene, seed, presetData);

        this.loadingLock.unlock();
    }

    /*
        Method Name: loadCornerSpawnsPreset
        Method Parameters: 
            scene:
                Associated scene
            presetData:
                JSON details about a preset
            seed:
                int. Seed for generation
            size:
                int. Size of level
        Method Description: Loads a preset and adds corner spawns and does cutting
        Method Return: Promise (implicit)
    */
    static async loadCornerSpawnsPreset(scene, presetData, seed, size){
        let presetName = presetData["name"];

        let chosenPresetFunction;
        let chosenPresetRefitForCornerSpawnsFunction;
        if (presetName === "river_1"){
            chosenPresetFunction = LevelGenerator.generateRiver1Preset;
            chosenPresetRefitForCornerSpawnsFunction = LevelGenerator.refitRiver1PresetForCornerSpawns;
        }else if (presetName === "oak_forest_1"){
            chosenPresetFunction = LevelGenerator.generateOakForest1Preset;
            chosenPresetRefitForCornerSpawnsFunction = LevelGenerator.refitOakForest1PresetForCornerSpawns;
        }else{
            throw new Error("Unknown preset: " + presetName);
        }

        // Generate
        await chosenPresetFunction(scene, seed, presetData);

        // Add corner spawns
        let spawns = await chosenPresetRefitForCornerSpawnsFunction(scene, seed, size, presetData);

        return spawns;
    }

    /*
        Method Name: refitOakForest1PresetForCornerSpawns
        Method Parameters: 
            scene:
                Associated scene
            seed:
                int. Seed for generation
            size:
                int. Size of level
            presetData:
                JSON details about a oak forest 1
        Method Description: adds corner spawns and does cutting
        Method Return: Promise (implicit)
    */
    static async refitOakForest1PresetForCornerSpawns(scene, seed, size, presetData){
        let defaultSize = presetData["size"];
        if (defaultSize < size){
            throw new Error("Provided size too large");
        }
        let apr = new AsyncProcessingRegulator();
        let random = new SeededRandomizer(seed);

        let maxXStart = defaultSize - size;
        let maxYStart = defaultSize - size;

        let chosenXStart = random.getIntInRangeInclusive(0, maxXStart);
        let chosenYStart = random.getIntInRangeInclusive(0, maxYStart);

        let spawns = [[chosenXStart, chosenYStart], [chosenXStart+size-1, chosenYStart], [chosenXStart, chosenYStart+size-1], [chosenXStart+size-1, chosenYStart+size-1]];

        let grassDetails = {"name":"grass","file_link":"images/grass.png"};

        // Set the spawns

        await LevelGenerator.deleteAllOutsideOfRegion(scene, chosenXStart, chosenXStart + size, chosenYStart, chosenYStart + size);
        // Fill voids with grass
        for (let [chunk, chunkX, chunkY] of scene.getChunks()){
            if (chunk === null){ continue; }
            await apr.attemptToWait();

            let visualTiles = chunk.getVisualTiles();
            for (let [tile, tileX, tileY] of visualTiles){
                let tileIsNull = tile === null;
                if (tileIsNull){
                    let insideRegion = tileX >= chosenXStart && tileX < chosenXStart + size && tileY >= chosenYStart && tileY < chosenYStart + size;
                    if (insideRegion){
                        let uncovered = !scene.hasVisualTileCoveringLocation(tileX, tileY);
                        if (uncovered){
                            chunk.placeVisualTile(grassDetails, tileX, tileY);
                            chunk.deletePhysicalTileAt(tileX, tileY);
                        }
                    }
                }
            }
        }
        
        // Redo border
        let fullBlockDetails = getPhysicalTileDetails("full_block");

        // Delete trees by the border

        // Right
        let treeDetails = {"name":"tree","file_link":"images/tree.png"};
        let treeWidth = Math.ceil(IMAGES[treeDetails["name"]].width / WTL_GAME_DATA["general"]["tile_size"]);
        let treeHeight = Math.ceil(IMAGES[treeDetails["name"]].height / WTL_GAME_DATA["general"]["tile_size"]);
        for (let y = chosenYStart; y < chosenYStart + size; y++){
            let visualTile = scene.getVisualTileAtLocation(chosenXStart + size - 1, y);
            await apr.attemptToWait();
            // May be null because of big tiles to the left
            if (visualTile === null){
                continue;
            }
            if (visualTile.getMaterialName() === "tree"){
                for (let oY = y; oY > Math.max(y - treeHeight, -1); oY--){
                    scene.placeVisualTile(grassDetails, chosenXStart + size - 1, oY);
                    scene.deletePhysicalTile(chosenXStart + size - 1, oY);
                }
            }
        }

        // Bottom
        for (let x = chosenXStart; x < chosenXStart + size; x++){
            let visualTile = scene.getVisualTileAtLocation(x, chosenYStart);
            // May be null because of big tiles to the left
            if (visualTile === null){
                continue;
            }
            await apr.attemptToWait();
            if (visualTile.getMaterialName() === "tree"){
                for (let oX = x; oX < Math.min(x + treeWidth, chosenXStart + size); oX++){
                    scene.placeVisualTile(grassDetails, oX, chosenYStart);
                    scene.deletePhysicalTile(oX, chosenYStart);
                }
            }
        }

        let spawnDetails = getPhysicalTileDetails("spawn");

        let destroyTile = (tileObject, scene) => {
            let tileX = tileObject["tile_x"];
            let tileY = tileObject["tile_y"];

            let visualTile = scene.getVisualTileCoveringLocation(tileX, tileY);
            let originX = visualTile.getTileX();
            let originY = visualTile.getTileY();
            let visualTileWidth = visualTile.getTileWidth();
            let visualTileHeight = visualTile.getTileHeight();
            for (let oX = originX; oX < originX + visualTileWidth; oX++){
                for (let oY = originY; oY > originY - visualTileHeight; oY--){
                    // Destroy the physical tile
                    scene.deletePhysicalTile(oX, oY);
                    scene.placeVisualTile(grassDetails, oX, oY);
                }
            }
        }

        // Create paths between the spawns
        for (let i = 0; i < spawns.length - 1; i++){
            await apr.attemptToWait();
            await LevelGenerator.createPath(spawns[i], spawns[i+1], scene, destroyTile);
        }

        for (let i = 0; i < spawns.length; i++){
            // Place spawn tiles on the spawn points
            scene.placePhysicalTile(spawnDetails, spawns[i][0], spawns[i][1]);
        }

        // Left
        for (let y = chosenYStart - 1; y <= chosenYStart + size; y++){
            await apr.attemptToWait();
            scene.placePhysicalTile(fullBlockDetails, chosenXStart - 1, y);
            scene.deleteVisualTile(chosenXStart - 1, y);
        }

        // Right
        for (let y = chosenYStart - 1; y <= chosenYStart + size; y++){
            await apr.attemptToWait();
            scene.placePhysicalTile(fullBlockDetails, chosenXStart + size, y);
            scene.deleteVisualTile(chosenXStart + size, y);
        }

        // Bottom
        for (let x = chosenXStart - 1; x <= chosenXStart + size; x++){
            await apr.attemptToWait();
            scene.placePhysicalTile(fullBlockDetails, x, chosenYStart - 1);
            scene.deleteVisualTile(x, chosenYStart - 1);
        }

        // Top
        for (let x = chosenXStart - 1; x <= chosenXStart + size; x++){
            await apr.attemptToWait();
            scene.placePhysicalTile(fullBlockDetails, x, chosenYStart + size);
            scene.deleteVisualTile(x, chosenYStart + size);
        }

        return spawns;
    }

    /*
        Method Name: createPath
        Method Parameters: 
            coordSet1:
                int array, 2 elements
            coordSet2:
                int array, 2 elements
            scene:
                Relevant scene
            destroyTileFunc:
                Function that destroys tiles (usually replaces with grass)
        Method Description: Creates a path between two points
        Method Return: Promsie (implicit)
    */
    static async createPath(coordSet1, coordSet2, scene, destroyTileFunc){
        let startTileX = coordSet1[0];
        let startTileY = coordSet1[1];
        let endTileX = coordSet2[0];
        let endTileY = coordSet2[1];

        let knownTilesFromStart = new NotSamXYSortedArrayList();
        knownTilesFromStart.set(startTileX, startTileY, null);
        let edgeTilesFromStart = new NotSamLinkedList([{"tile_x": startTileX, "tile_y": startTileY}]);

        // Make sure both ends are clear
        if (scene.tileAtLocationHasAttribute(startTileX, startTileY, "no_walk")){
            destroyTileFunc({"tile_x": startTileX, "tile_y": startTileY}, scene);
        }
        if (scene.tileAtLocationHasAttribute(endTileX, endTileY, "no_walk")){
            destroyTileFunc({"tile_x": endTileX, "tile_y": endTileY}, scene);
        }

        let foundEndTile = false;

        let getTileToDestroy = () => {
            let bestTileX = null;
            let bestTileY = null;
            let bestDistance = null;

            // Find the closest physical obstruction to the tile
            for (let [dud, tileX, tileY] of knownTilesFromStart){
                let adjacentTiles = [[tileX+1,tileY], [tileX-1, tileY], [tileX, tileY+1], [tileX, tileY-1]];
                // Look through adjacent tiles to find obstructions
                for (let adjacentTile of adjacentTiles){
                    let aX = adjacentTile[0];
                    let aY = adjacentTile[1];
                    // If this is already known do nothing
                    if (knownTilesFromStart.has(aX, aY)){ continue; }
                    // if this is a void tile then ignore
                    if (!scene.hasVisualTileCoveringLocation(aX, aY)){ continue; }

                    // Because this function was called we know this MUST not be a walkable tile
                    let mDistance = calculateManhattanDistance(adjacentTile[0], adjacentTile[1], endTileX, endTileY);
                    if (bestDistance === null || mDistance < bestDistance){
                        bestTileX = aX;
                        bestTileY = aY;
                        bestDistance = mDistance;
                    }
                }
            }

            let tileNotFound = bestDistance === null;
            if (tileNotFound){
                throw new Error("Failed to find a tile to destroy");
            }

            return {"tile_x": bestTileX, "tile_y": bestTileY};
        }

        let findBestEdgeTile = () => {
            let bestEdgeTileIndex = null;
            let bestDistance = null;

            // Loop from top to bottom
            for (let [edgeTile, eTI] of edgeTilesFromStart){
                let eX = edgeTile["tile_x"];
                let eY = edgeTile["tile_y"];
                let distance = calculateManhattanDistance(eX, eY, endTileX, endTileY);
                if (bestDistance === null || distance < bestDistance){
                    bestDistance = distance;
                    bestEdgeTileIndex = eTI;
                    // don't continue searching if this is good enough
                    if (bestDistance <= 1){
                        break;
                    }
                }
            }

            let bestEdgeTile = null;
            if (bestEdgeTileIndex != null){
                bestEdgeTile = edgeTilesFromStart.pop(bestEdgeTileIndex);
            }
            return {"manhattan_distance": bestDistance, "edge_tile": bestEdgeTile}
        }

        let exploreEdgeTile = (edgeTile) => {
            let edgeTileX = edgeTile["tile_x"];
            let edgeTileY = edgeTile["tile_y"];
            if (edgeTileX === undefined){ debugger; }
            let adjacentTiles = [[edgeTileX+1,edgeTileY], [edgeTileX-1, edgeTileY], [edgeTileX, edgeTileY+1], [edgeTileX, edgeTileY-1]];
            // Look through adjacent tiles to find obstructions
            for (let adjacentTile of adjacentTiles){
                let aX = adjacentTile[0];
                let aY = adjacentTile[1];
                // If this is already known do nothing
                if (knownTilesFromStart.has(aX, aY)){ continue; }

                // if this is a no walk tile then ignore
                if (scene.tileAtLocationHasAttribute(aX, aY, "no_walk")){ continue; }

                // If there is no visual tile here (border)
                if (!scene.hasVisualTileCoveringLocation(aX, aY)){ continue; }

                // Add to known tiles
                knownTilesFromStart.set(aX, aY, null);

                // Add to edge tiles
                edgeTilesFromStart.push({"tile_x": aX, "tile_y": aY});
            }
        }

        // Loop until the end tile is found
        while (!foundEndTile){
            let edgeTileInfo = findBestEdgeTile();
            let edgeTile = edgeTileInfo["edge_tile"];
            let noTiles = edgeTile === null;
            // If no tiles found then clear a new edge tile
            if (noTiles){
                // This destoys and adds to edge tiles
                let tileToClear = getTileToDestroy();
                destroyTileFunc(tileToClear, scene);
                // Add to edge tiles
                edgeTilesFromStart.push(tileToClear);
                // Because this isn't the normal process of adding to edge tiles I need to remember to add to knowTilesFromStart
                knownTilesFromStart.set(tileToClear["tile_x"], tileToClear["tile_y"], null);
            }else{
                let mDistance = edgeTileInfo["manhattan_distance"];
                // If this is the end (or next to it) then we have a path
                if (mDistance <= 1){
                    foundEndTile = true;
                }else{
                    // Explore around this tile
                    exploreEdgeTile(edgeTile);
                }
            }
        }

        if (!foundEndTile){
            throw new Error("Failed to create a path.");
        }
    }

    /*
        Method Name: deleteAllOutsideOfRegion
        Method Parameters: 
            scene:
                Relevant scene
            lowerX:
                Lower x of region
            higherXEX:
                Higher x of region (not included)
            lowerY:
                Lower y of region
            higherYEX:
                Higher y of region (not included)
        Method Description: Deletes all tiles outside of a given region
        Method Return: Promise (implicit)
    */
    static async deleteAllOutsideOfRegion(scene, lowerX, higherXEX, lowerY, higherYEX){
        let apr = new AsyncProcessingRegulator();
        let chunks = scene.getChunks();
        let higherXINC = higherXEX - 1;
        let higherYINC = higherYEX - 1;

        // Delete chunks fully outside the region
        for (let [chunk, chunkX, chunkY] of chunks){
            if (chunk === null){ continue; }
            await apr.attemptToWait();
            // Delete chunks outside of the region
            if (chunk.outsideTileRegion(lowerX, higherXINC, lowerY, higherYINC)){
                // Delete self
                chunks.set(chunkX, chunkY, null);
            }
        }

        let lowerChunkX = Chunk.tileToChunkCoordinate(lowerX);
        let higherChunkX = Chunk.tileToChunkCoordinate(higherXINC);
        let lowerChunkY = Chunk.tileToChunkCoordinate(lowerY);
        let higherChunkY = Chunk.tileToChunkCoordinate(higherYINC);
        // Delete tiles in edge chunks
        for (let [chunk, chunkX, chunkY] of chunks){
            if (chunk === null){ continue; }
            await apr.attemptToWait();
            let edgeX = chunkX === lowerChunkX || chunkX === higherChunkX;
            let edgeY = chunkY === lowerChunkY || chunkY === higherChunkY;

            // For edge chunks delete the tiles outside the range
            if (edgeX || edgeY){
                let visualTiles = chunk.getVisualTiles();
                for (let [tile, tileX, tileY] of visualTiles){
                    if (tile === null){ continue; }
                    if (tileX >= lowerX && tileX < higherXEX && tileY >= lowerY && tileY < higherYEX){ continue; }
                    visualTiles.set(tileX, tileY, null);
                }

                let physicalTiles = chunk.getPhysicalTiles();
                for (let [tile, tileX, tileY] of physicalTiles){
                    if (tile === null){ continue; }
                    if (tileX >= lowerX && tileX < higherXEX && tileY >= lowerY && tileY < higherYEX){ continue; }
                    physicalTiles.set(tileX, tileY, null);
                }
            }
        }
    }

    /*
        Method Name: generateOakForest1Preset
        Method Parameters: 
            scene:
                Associated scene
            seed:
                int. Seed for generation
            presetData:
                JSON details about a oak forest 1
        Method Description: Loads a the oak forest1 preset.
        Method Return: Promise (implicit)
    */
    static async generateOakForest1Preset(scene, seed, presetData){
        let defaultSize = presetData["size"];
        let apr = new AsyncProcessingRegulator();
        // Visual Details
        let grassDetails = {"name":"grass","file_link":"images/grass.png"};
        let rockDetails = {"name":"rock_on_grass","file_link":"images/rock_on_grass.png"};
        let treeDetails = {"name":"tree","file_link":"images/tree.png"};
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
        await ensureImageIsLoadedFromDetails(treeDetails);
        await ensureImageIsLoadedFromDetails(bushDetails);

        // Processing break
        await apr.attemptToWait();


        // Do the border

        // Left
        for (let y = -1; y <= defaultSize; y++){
            scene.placePhysicalTile(fullBlockDetails, -1, y);
        }

        // Right
        for (let y = -1; y <= defaultSize; y++){
            scene.placePhysicalTile(fullBlockDetails, defaultSize, y);
        }

        // Bottom
        for (let x = -1; x <= defaultSize; x++){
            scene.placePhysicalTile(fullBlockDetails, x, -1);
        }

        // Top
        for (let x = -1; x <= defaultSize; x++){
            scene.placePhysicalTile(fullBlockDetails, x, defaultSize);
        }

        let lowerChunkX = Chunk.tileToChunkCoordinate(0);
        let higherChunkX = Chunk.tileToChunkCoordinate(defaultSize - 1);
        let lowerChunkY = Chunk.tileToChunkCoordinate(0);
        let higherChunkY = Chunk.tileToChunkCoordinate(defaultSize - 1);

        let chunks = scene.getChunks();
        for (let cX = lowerChunkX; cX <= higherChunkX; cX++){
            for (let cY = lowerChunkY; cY <= higherChunkY; cY++){
                chunks.set(cX, cY, new Chunk(scene, cX, cY));
            }
        }

        // Fill with grass
        for (let [chunk, chunkX, chunkY] of chunks){
            // No null check because they're fresh
            await apr.attemptToWait();

            // Fill with grass
            for (let tileY = Math.max(chunk.getNaturalBottomY(), 0); tileY <= Math.min(chunk.getNaturalTopY(), defaultSize - 1); tileY++){
                for (let tileX = Math.max(chunk.getNaturalLeftX(), 0); tileX <= Math.min(chunk.getNaturalRightX(), defaultSize - 1); tileX++){
                    chunk.placeVisualTile(grassDetails, tileX, tileY);
                }
            }
        }

        // Processing break
        await apr.attemptToWait();

        let rockClusteres = 155;
        let minRockClusterSize = 2;
        let maxRockClusterSize = 4;
        let smallBushes = 300;
        let trees = 800;

        let random = new SeededRandomizer(seed);

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

                    let isWithinBorders = tileX > -1 && tileX < defaultSize && tileY > -1 && tileY < defaultSize;
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
                    // Processing break
                    for (let tile of tilesToCheck){
                        if (!tile["placed"]){
                            tilesLeftToCheck = true;
                            break;
                        }
                    }
                }
            }
        }

        // Processing break
        await apr.attemptToWait();

        // Place rock clusters
        for (let i = 0; i < rockClusteres; i++){
            await apr.attemptToWait();
            placeCluster(rockDetails, fullBlockDetails, random.getIntInRangeInclusive(0, defaultSize-1), random.getIntInRangeInclusive(0, defaultSize-1), random.getIntInRangeInclusive(minRockClusterSize, maxRockClusterSize));
        }

        // Processing break
        await apr.attemptToWait();

        // Place Small Bushes
        for (let i = 0; i < smallBushes; i++){
            await apr.attemptToWait();
            let x = random.getIntInRangeInclusive(0, defaultSize-1);
            let y = random.getIntInRangeInclusive(0, defaultSize-1);
            scene.placeVisualTile(bushDetails, x, y);
            scene.placePhysicalTile(singleCoverDetails, x, y);
        }

        let tryToPlaceTree = (x, y) => {
            let treeWidth = Math.ceil(IMAGES[treeDetails["name"]].width / WTL_GAME_DATA["general"]["tile_size"]);
            let treeHeight = Math.ceil(IMAGES[treeDetails["name"]].height / WTL_GAME_DATA["general"]["tile_size"]);
            
            // Place the visual tile
            
            // If tree goes below bottom then don't place it
            if (y - treeWidth + 1 < 0){
                return;
            }
            // If tree goes to the right of the right side then don't plac eit
            if (x + treeWidth > defaultSize){
                return;
            }

            for (let oX = x; oX < x + treeWidth; oX++){
                for (let oY = y; oY > y - treeHeight; oY--){
                    let tileAtLocation = scene.getVisualTileCoveringLocation(oX, oY);
                    // If there's anything but grass then don't place
                    if (tileAtLocation != null && tileAtLocation.getMaterialName() != "grass"){
                        return;
                    }
                }
            }

            // Place the tree
            scene.placeVisualTile(treeDetails, x, y);
            for (let oX = x; oX < x + treeWidth; oX++){
                for (let oY = y; oY > y - treeHeight; oY--){
                    scene.placePhysicalTile(fullBlockDetails, oX, oY);
                }
            }
        }

        // Place Trees
        for (let i = 0; i < trees; i++){
            await apr.attemptToWait();
            let x = random.getIntInRangeInclusive(0, defaultSize-1);
            let y = random.getIntInRangeInclusive(0, defaultSize-1);
            tryToPlaceTree(x, y);
        }
    }

    /*
        Method Name: end
        Method Parameters: None
        Method Description: TODO
        Method Return: TODO
    */
    end(){
        MY_HUD.clearElement("seed");
        MY_HUD.clearElement("Cursor Tile X");
        MY_HUD.clearElement("Cursor Tile Y");
    }

    /*
        Method Name: refitRiver1PresetForCornerSpawns
        Method Parameters: 
            scene:
                Associated scene
            seed:
                int. Seed for generation
            size:
                int. Size of level
            presetData:
                JSON details about a river 1
        Method Description: adds corner spawns and does cutting
        Method Return: Promise (implicit)
    */
    static async refitRiver1PresetForCornerSpawns(scene, seed, size, presetData){
        let defaultSize = presetData["size"];
        if (defaultSize < size){
            throw new Error("Provided size too large");
        }
        let apr = new AsyncProcessingRegulator();
        let random = new SeededRandomizer(seed);

        let maxXStart = defaultSize - size;
        let maxYStart = defaultSize - size;

        let chosenXStart = random.getIntInRangeInclusive(0, maxXStart);
        let chosenYStart = random.getIntInRangeInclusive(0, maxYStart);

        let spawns = [[chosenXStart, chosenYStart], [chosenXStart+size-1, chosenYStart], [chosenXStart, chosenYStart+size-1], [chosenXStart+size-1, chosenYStart+size-1]];

        let grassDetails = {"name":"grass","file_link":"images/grass.png"};
        let brigeDetails = {"name":"bridge","file_link":"images/bridge.png"};
    
        // Clear everything outside
        await LevelGenerator.deleteAllOutsideOfRegion(scene, chosenXStart, chosenXStart + size, chosenYStart, chosenYStart + size);


        // Redo border
        let fullBlockDetails = getPhysicalTileDetails("full_block");

        // Left
        for (let y = chosenYStart - 1; y <= chosenYStart + size; y++){
            scene.placePhysicalTile(fullBlockDetails, chosenXStart - 1, y);
        }

        // Right
        for (let y = chosenYStart - 1; y <= chosenYStart + size; y++){
            scene.placePhysicalTile(fullBlockDetails, chosenXStart + size, y);
        }

        // Bottom
        for (let x = chosenXStart - 1; x <= chosenXStart + size; x++){
            scene.placePhysicalTile(fullBlockDetails, x, chosenYStart - 1);
        }

        // Top
        for (let x = chosenXStart - 1; x <= chosenXStart + size; x++){
            scene.placePhysicalTile(fullBlockDetails, x, chosenYStart + size);
        }

        let spawnDetails = getPhysicalTileDetails("spawn");

        let destroyTile = (tileObject, scene) => {
            let tileX = tileObject["tile_x"];
            let tileY = tileObject["tile_y"];
            // Destroy the physical tile
            scene.deletePhysicalTile(tileX, tileY);

            let visualTile = scene.getVisualTileCoveringLocation(tileX, tileY);
            if (visualTile === null){
                debugger;
            }

            // Bridge over water, grass over anything else
            if (visualTile.getMaterialName() === "water"){
                scene.placeVisualTile(brigeDetails, tileX, tileY);
            }else{
                scene.placeVisualTile(grassDetails, tileX, tileY);
            }
        }

        // Create paths between the spawns
        for (let i = 0; i < spawns.length - 1; i++){
            await LevelGenerator.createPath(spawns[i], spawns[i+1], scene, destroyTile);
        }

        for (let i = 0; i < spawns.length; i++){
            // Place spawn tiles on the spawn points
            scene.placePhysicalTile(spawnDetails, spawns[i][0], spawns[i][1]);
        }
        return spawns;
    }

    /*
        Method Name: generateRiver1Preset
        Method Parameters: 
            scene:
                Associated scene
            seed:
                int. Seed for generation
            presetData:
                JSON details about a river1 preset
        Method Description: Loads a the river1 preset
        Method Return: Promise (implicit)
    */
    static async generateRiver1Preset(scene, seed, presetData){
        let defaultSize = presetData["size"];
        let apr = new AsyncProcessingRegulator();
        // Visual Details
        let grassDetails = {"name":"grass","file_link":"images/grass.png"};
        let rockDetails = {"name":"rock_on_grass","file_link":"images/rock_on_grass.png"};
        let waterDetails = {"name":"water","file_link":"images/water.png"};
        let brigeDetails = {"name":"bridge","file_link":"images/bridge.png"};
        //let treeDetails = {"name":"tree","file_link":"images/tree.png"};
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
        //await ensureImageIsLoadedFromDetails(treeDetails);
        await ensureImageIsLoadedFromDetails(bushDetails);
        await ensureImageIsLoadedFromDetails(bigBushDetails);

        // Processing break
        await apr.attemptToWait();


        // Do the border

        // Left
        for (let y = -1; y <= defaultSize; y++){
            scene.placePhysicalTile(fullBlockDetails, -1, y);
        }

        // Right
        for (let y = -1; y <= defaultSize; y++){
            scene.placePhysicalTile(fullBlockDetails, defaultSize, y);
        }

        // Bottom
        for (let x = -1; x <= defaultSize; x++){
            scene.placePhysicalTile(fullBlockDetails, x, -1);
        }

        // Top
        for (let x = -1; x <= defaultSize; x++){
            scene.placePhysicalTile(fullBlockDetails, x, defaultSize);
        }

        // Fill with grass
        for (let x = 0; x < defaultSize; x++){
            for (let y = 0; y < defaultSize; y++){
                // Processing break
                await apr.attemptToWait();
                scene.placeVisualTile(grassDetails, x, y);
            }
        }

        // Processing break
        await apr.attemptToWait();

        let rockClusteres = 125;
        let minRockClusterSize = 3;
        let maxRockClusterSize = 7;
        let smallBushes = 300;
        let minBigBushSize = 3;
        let maxBigBushSize = 9;
        let bigBushes = 75;

        let random = new SeededRandomizer(seed);

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

                    let isWithinBorders = tileX > -1 && tileX < defaultSize && tileY > -1 && tileY < defaultSize;
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
                    // Processing break
                    for (let tile of tilesToCheck){
                        if (!tile["placed"]){
                            tilesLeftToCheck = true;
                            break;
                        }
                    }
                }
            }
        }

        // Processing break
        await apr.attemptToWait();

        // Place rock clusters
        for (let i = 0; i < rockClusteres; i++){
            await apr.attemptToWait();
            placeCluster(rockDetails, fullBlockDetails, random.getIntInRangeInclusive(0, defaultSize-1), random.getIntInRangeInclusive(0, defaultSize-1), random.getIntInRangeInclusive(minRockClusterSize, maxRockClusterSize));
        }

        // Processing break
        await apr.attemptToWait();

        // Place Small Bushes
        for (let i = 0; i < smallBushes; i++){
            let x = random.getIntInRangeInclusive(0, defaultSize-1);
            let y = random.getIntInRangeInclusive(0, defaultSize-1);
            scene.placeVisualTile(bushDetails, x, y);
            scene.placePhysicalTile(singleCoverDetails, x, y);
        }

        // Processing break
        await apr.attemptToWait();

        // Place Multi Bushes
        for (let i = 0; i < bigBushes; i++){
            placeCluster(bigBushDetails, multiCoverDetails, random.getIntInRangeInclusive(0, defaultSize-1), random.getIntInRangeInclusive(0, defaultSize-1), random.getIntInRangeInclusive(minBigBushSize, maxBigBushSize));
        }

        // Processing break
        await apr.attemptToWait();

        // Place River
        let minRiverWidth = 3;
        let maxRiverWidth = 6;
        let numRivers = 7;

        let makeRiver = (riverAngleRAD, riverStartX, riverStartY, currentWidth, riverType, minRiverWidth, maxRiverWidth) => {
            let range = defaultSize*WTL_GAME_DATA["general"]["tile_size"];
            let finalOffsetX = range * Math.cos(riverAngleRAD);
            let finalOffsetY = range * Math.sin(riverAngleRAD);

            let xDirection = finalOffsetX < 0 ? -1 : 1;
            let yDirection = finalOffsetY < 0 ? -1 : 1;

            let endX = riverStartX + finalOffsetX;
            let endY = riverStartY + finalOffsetY;

            let endTileX = xDirection > 0 ? defaultSize : -1;
            let endTileY = yDirection > 0 ? defaultSize : -1;

            let tileX = WTLGameScene.getTileXAt(riverStartX);
            let tileY = WTLGameScene.getTileYAt(riverStartY);
            let widthDir = Math.abs(Math.cos(riverAngleRAD)) > Math.abs(Math.sin(riverAngleRAD)) ? "y" : "x";

            // While not at end
            while (tileX != endTileX && tileY != endTileY){
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
                if (currentWidth % 2 === 0){
                    if (random.getIntInRangeInclusive(0,1) === 0){
                        lowerWidthOffset--;
                    }else{
                        upperWidthOffset++;
                    }
                }

                if (widthDir === "x"){
                    for (let x = tileX - lowerWidthOffset; x <= tileX + upperWidthOffset; x++){
                        if (x < 0 || x >= defaultSize){ continue; }
                        scene.placeVisualTile(waterDetails, x, tileY);
                        scene.placePhysicalTile(noWalkDetails, x, tileY);
                    }
                }else{
                    for (let y = tileY - lowerWidthOffset; y <= tileY + upperWidthOffset; y++){
                        if (y < 0 || y >= defaultSize){ continue; }
                        scene.placeVisualTile(waterDetails, tileX, y);
                        scene.placePhysicalTile(noWalkDetails, tileX, y);
                    }
                }

                // Move
                if (nextDir === "left"){
                    tileX--;
                }else if (nextDir === "right"){
                    tileX++;
                }else if (nextDir === "up"){
                    tileY++;
                }else{
                    tileY--;
                }

                currentWidth += random.getIntInRangeInclusive(-1, 1);
                currentWidth = Math.max(minRiverWidth, Math.min(maxRiverWidth, currentWidth));
                widthDir = (nextDir === "up" || nextDir === "down") ? "x" : "y";
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
                riverStartX = random.getIntInRangeInclusive(0, (defaultSize-1) * WTL_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = 0;
            }else if (riverType == 2){ // Top Left
                riverAngleRAD = random.getFloatInRange(2 * Math.PI * 3/4, 2 * Math.PI);
                riverStartX = random.getIntInRangeInclusive(0, (defaultSize-1) * WTL_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = (defaultSize-1) * WTL_GAME_DATA["general"]["tile_size"];
            }else if (riverType == 3){ // Bottom Right
                riverAngleRAD = random.getFloatInRange(Math.PI/2, Math.PI);
                riverStartX = random.getIntInRangeInclusive(0, (defaultSize-1) * WTL_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = 0;
            }else{ // Rivertype == 4 // Top Right
                riverAngleRAD = random.getFloatInRange(Math.PI, 2 * Math.PI * 3/4);
                riverStartX = (defaultSize-1) * WTL_GAME_DATA["general"]["tile_size"];
                riverStartY = random.getIntInRangeInclusive((defaultSize-1) * WTL_GAME_DATA["general"]["tile_size"]/2, (defaultSize-1) * WTL_GAME_DATA["general"]["tile_size"]);
            }

            // For each x, find the y tile for the river
            makeRiver(riverAngleRAD, riverStartX, riverStartY, currentWidth, riverType, minRiverWidth, maxRiverWidth);

            // Processing break
            await apr.attemptToWait();
        }
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the game
        Method Return: void
    */
    display(){
        if (this.loadingLock.isLocked()){
            LOADING_SCREEN.display();
            return;
        }
        this.scene.display();
        if (this.uiEnabled){
            this.ingameUI.display();
        }
        MY_HUD.updateElement("seed", this.seed);
        this.camera.display();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Performs tick processes
        Method Return: void
    */
    tick(){
        if (this.loadingLock.isLocked()){ return; }
        this.tickUI();
        this.camera.tick();
        this.scene.tick();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Performs tick processes for the UI
        Method Return: void
    */
    tickUI(){
        let togglingUI = GAME_USER_INPUT_MANAGER.isActivated("u_ticked");
        if (togglingUI){
            this.uiEnabled = !this.uiEnabled;
        }

        let clicking = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        if (this.uiEnabled && clicking){
            this.ingameUI.click(gMouseX, MENU_MANAGER.changeFromScreenY(gMouseY));
        }
    }
}