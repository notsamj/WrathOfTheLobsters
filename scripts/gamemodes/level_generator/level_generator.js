class LevelGenerator extends Gamemode {
    constructor(presetData, seed){
        super();

        this.camera = new LevelGeneratorCamera(this);

        this.loadingLock = new Lock();

        this.uiEnabled = false;
        this.ingameUI = new LevelGeneratorMenu(this);

        this.startUp(presetData, seed);
    }

    async startUp(presetData, seed){
        // Setup camera
        this.scene.setFocusedEntity(this.camera);

        await this.loadPreset(presetData, seed);
    }

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

        let createPath = async (coordSet1, coordSet2) => {
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
                    if (element["x"] === endX && element["y"] === endY && element["can_walk"]){
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
                return x >= 0 && x < defaultSize && y >= 0 && y < defaultSize;
            } 

            let hasTile = (x,y) => {
                for (let element of tileStorage){
                    if (element["x"] === x && element["y"] === y){
                        return true;
                    }
                }
                return false;
            }

            let destroyTile = (tileObject) => {
                let tileX = tileObject["x"];
                let tileY = tileObject["y"];

                let visualTile = scene.getVisualTileCoveringLocation(tileX, tileY);
                let originX = visualTile.getTileX();
                let originY = visualTile.getTileY();
                for (let oX = originX; oX < originX + treeWidth; oX++){
                    for (let oY = originY; oY > originY - treeHeight; oY--){
                        // Destroy the physical tile
                        scene.deletePhysicalTile(tileX, tileY);
                        scene.placeVisualTile(grassDetails, tileX, tileY);
                    }
                }
            }

            // Loop until there is a path found
            while (!hasPath()){
                await apr.attemptToWait();
                // Find all accessible tiles that are currentlyn ot blocked
                while (hasUnreadyUnblockedTilesToCheck()){
                    let tile = null; // Note: We know this exists because of while check
                    for (let element of tileStorage){
                        if (element["can_walk"] && !element["checked"]){
                            if (tile === null){
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
                    // Processing break
                    await apr.attemptToWait();
                    let toDestroy = null; // Note: No way we don't have a path unless there is something to be destroyed or invalid input
                    for (let element of tileStorage){
                        if (!element["can_walk"]){
                            if (toDestroy === null){
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
        
        // Cut everything outside the chosen zone (extra 1 is because of border)
        for (let x = -1; x < defaultSize + 1; x++){
            for (let y = -1; y < defaultSize + 1; y++){
                // Skip chosen zone
                if (x >= chosenXStart && x < chosenXStart + size && y >= chosenYStart && y < chosenYStart + size){
                    continue;
                }
                await apr.attemptToWait();
                scene.deletePhysicalTile(x, y);
                scene.deleteVisualTile(x, y);
            }
        }

        // Fill with grass
        for (let x = chosenXStart; x < chosenXStart + size; x++){
            for (let y = chosenYStart; y < chosenYStart + size; y++){
                // Processing break
                await apr.attemptToWait();
                if (!scene.hasVisualTileCoveringLocation(x, y)){
                    scene.placeVisualTile(grassDetails, x, y);
                    scene.deletePhysicalTile(x, y);
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
            let visualTile = scene.getVisualTileAtLocation(x, chosenYStart - 1 - 1);
            // May be null because of big tiles to the left
            if (visualTile === null){
                continue;
            }
            await apr.attemptToWait();
            if (visualTile.getMaterialName() === "tree"){
                for (let oX = x; oX < Math.max(x + treeWidth, chosenXStart + size); oX++){
                    scene.placeVisualTile(grassDetails, oX, chosenYStart - 1 - 1);
                    scene.deletePhysicalTile(oX, chosenYStart - 1 - 1);
                }
            }
        }

        let spawnDetails = getPhysicalTileDetails("spawn");
        // Create paths between the spawns
        for (let i = 0; i < spawns.length - 1; i++){
            await createPath(spawns[i], spawns[i+1]);
            // Place spawn tiles on the spawn points
            scene.placePhysicalTile(spawnDetails, spawns[i][0], spawns[i][1]);
        }

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

        return spawns;
    }

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

        let rockClusteres = 155;
        let minRockClusterSize = 2;
        let maxRockClusterSize = 4;
        let smallBushes = 300;
        let trees = 500;

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
                    // If there's a tree then don't place
                    if (tileAtLocation != null && tileAtLocation.getMaterialName() === "tree"){
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
        for (let i = 0; i < smallBushes; i++){
            let x = random.getIntInRangeInclusive(0, defaultSize-1);
            let y = random.getIntInRangeInclusive(0, defaultSize-1);
            tryToPlaceTree(x, y);
        }
    }

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

        // Set the spawns

        let createPath = async (coordSet1, coordSet2) => {
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
                    if (element["x"] === endX && element["y"] === endY && element["can_walk"]){
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
                return x >= 0 && x < defaultSize && y >= 0 && y < defaultSize;
            } 

            let hasTile = (x,y) => {
                for (let element of tileStorage){
                    if (element["x"] === x && element["y"] === y){
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
                if (visualTile.getMaterialName() === "water"){
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
                            if (tile === null){
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
                    // Processing break
                    await apr.attemptToWait();
                    let toDestroy = null; // Note: No way we don't have a path unless there is something to be destroyed or invalid input
                    for (let element of tileStorage){
                        if (!element["can_walk"]){
                            if (toDestroy === null){
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
        
        // Cut everything outside the chosen zone (extra 1 is because of border)
        for (let x = -1; x < defaultSize + 1; x++){
            for (let y = -1; y < defaultSize + 1; y++){
                // Skip chosen zone
                if (x >= chosenXStart && x < chosenXStart + size && y >= chosenYStart && y < chosenYStart + size){
                    continue;
                }

                await apr.attemptToWait();
                scene.deletePhysicalTile(x, y);
                scene.deleteVisualTile(x, y);
            }
        }
        

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
        // Create paths between the spawns
        for (let i = 0; i < spawns.length - 1; i++){
            await createPath(spawns[i], spawns[i+1]);
        }
        for (let i = 0; i < spawns.length; i++){
            // Place spawn tiles on the spawn points
            scene.placePhysicalTile(spawnDetails, spawns[i][0], spawns[i][1]);
        }
        return spawns;
    }

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

    tick(){
        if (this.loadingLock.isLocked()){ return; }
        this.tickUI();
        this.camera.tick();
        this.scene.tick();
    }

    tickUI(){
        let togglingUI = USER_INPUT_MANAGER.isActivated("u_ticked");
        if (togglingUI){
            this.uiEnabled = !this.uiEnabled;
        }

        let clicking = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        if (this.uiEnabled && clicking){
            this.ingameUI.click(gMouseX, MENU_MANAGER.changeFromScreenY(gMouseY));
        }
    }
}