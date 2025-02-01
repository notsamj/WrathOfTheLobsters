class WTLGameScene {
    constructor(){
        this.objects = [];
        this.entities = new NotSamLinkedList();
        this.focusedEntity = null;
        this.chunks = new NotSamXYSortedArrayList();
        this.expiringVisuals = new NotSamLinkedList();
        this.displayingPhyiscalLayer = false;
    }

    getEntities(){
        return this.entities;
    }

    findInstantCollisionForProjectile(startX, startY, angleRAD, range=Number.MAX_SAFE_INTEGER, entityExceptionFunction=(entity) => { return false; }){
        let targetEntities = [];
        for (let [entity, entityIndex] of this.entities){
            if (entity.isDead()){ continue; }
            if (entityExceptionFunction(entity)){ continue; }
            targetEntities.push({"center_x": entity.getInterpolatedTickCenterX(), "center_y": entity.getInterpolatedTickCenterY(), "width": entity.getWidth(), "height": entity.getHeight(), "entity": entity});
        }
        return this.findInstantCollisionForProjectileWithTargets(startX, startY, angleRAD, range, targetEntities);
    }

    findInstantCollisionForProjectileWithTargets(startX, startY, angleRAD, range=Number.MAX_SAFE_INTEGER, targetEntities=[]){
        let startingTileX = WTLGameScene.getTileXAt(startX);
        let startingTileY = WTLGameScene.getTileYAt(startY);

        let finalOffsetX = range * Math.cos(angleRAD);
        let finalOffsetY = range * Math.sin(angleRAD);

        let xDirection = finalOffsetX < 0 ? -1 : 1;
        let yDirection = finalOffsetY < 0 ? -1 : 1;

        let endX = startX + finalOffsetX;
        let endY = startY + finalOffsetY;

        // Find end x,y for physical tiles and the range
        // Note: This is useful so it doesn't go to check tile x=500 when no tiles exist after x=10
        let chunkXEnd = startX;
        let chunkYEnd = startY;

        // Update based on chunks
        if (!this.chunks.isEmpty()){
            if (xDirection > 0){
                chunkXEnd = Math.max(chunkXEnd, Chunk.getNaturalRightX(this.chunks.getMaxX()) * WTL_GAME_DATA["general"]["tile_size"]);
            }else{
                chunkXEnd = Math.min(chunkXEnd, Chunk.getNaturalLeftX(this.chunks.getMinX()) * WTL_GAME_DATA["general"]["tile_size"]);
            }
            if (yDirection > 0){
                chunkYEnd = Math.max(chunkYEnd, Chunk.getNaturalTopY(this.chunks.getMaxY()) * WTL_GAME_DATA["general"]["tile_size"]);
            }else{
                chunkYEnd = Math.min(chunkYEnd, Chunk.getNaturalBottomY(this.chunks.getMinY()) * WTL_GAME_DATA["general"]["tile_size"]);
            }
        }

        let endTileX = WTLGameScene.getTileXAt(endX);
        let endTileY = WTLGameScene.getTileYAt(endY);

        // Loop through each tile x, tile y
        let x = startX;
        let y = startY;

        let distanceToNextMultipleInDirection = (value, base, direction) => {
            let multiple = value / base;
            if (multiple > 0 && direction > 0){
                return (Math.ceil(multiple) - multiple) * base;
            }else if (multiple > 0 && direction < 0){
                return (multiple - Math.floor(multiple)) * base;
            }else if (multiple < 0 && direction > 0){
                return (multiple - Math.ceil(multiple)) * -1 * base;
            }else{ // (proportion <= 0 && direction <= 0) || direction == 0
                return (Math.floor(multiple) - multiple) * -1 * base;
            }
        }

        let physicalTileCollision = null;

        let tileX = WTLGameScene.getTileXAt(x);
        let tileY = WTLGameScene.getTileYAt(y);

        let currentChunkX = Chunk.tileToChunkCoordinate(tileX);
        let currentChunkY = Chunk.tileToChunkCoordinate(tileY);
        let currentChunk = this.chunks.get(currentChunkX, currentChunkY);
        let tileEntrySide;

        // Come up with initial values (incase shooting from inside a physical tile)
        {
            let distanceToNextTileX = distanceToNextMultipleInDirection(x, WTL_GAME_DATA["general"]["tile_size"], xDirection);
            let distanceToNextTileY = distanceToNextMultipleInDirection(y, WTL_GAME_DATA["general"]["tile_size"], yDirection);
            let timeToNextTileX = safeDivide(distanceToNextTileX, Math.abs(Math.cos(angleRAD)), 1e-7, Number.MAX_SAFE_INTEGER); 
            let timeToNextTileY = safeDivide(distanceToNextTileY, Math.abs(Math.sin(angleRAD)), 1e-7, Number.MAX_SAFE_INTEGER);
            if (timeToNextTileX < timeToNextTileY){
                tileEntrySide = xDirection > 0 ? "right" : "left";
            }else{
                tileEntrySide = yDirection > 0 ? "top" : "bottom";
            }
        }

        // Loop from start to end but stop if you exceed where all existing chunk boundaries

        let lastAdditionalX = 0;
        let lastAdditionalY = 0;

        // Loop through the path
        while (lessThanEQDir(tileX, endTileX, xDirection) && lessThanEQDir(tileY, endTileY, yDirection) && lessThanEQDir(x + lastAdditionalX, chunkXEnd, xDirection) && lessThanEQDir(y + lastAdditionalY, chunkYEnd, yDirection)){
            // Update physical tile position
            let chunkX = Chunk.tileToChunkCoordinate(tileX);
            let chunkY = Chunk.tileToChunkCoordinate(tileY);
            let sameChunk = currentChunkX === chunkX && currentChunkY === chunkY;

            // Same chunk saves a tiny bit of processing
            if (!sameChunk){
                currentChunk = this.chunks.get(chunkX, chunkY);
            }
            let tile = currentChunk.getPhysicalTileCoveringLocation(tileX, tileY);

            let physicalTileIsPresent = tile != null;
            if (physicalTileIsPresent){
                if (tile.hasAttribute("solid")){
                    let hitX;
                    let hitY;
                    if (tileEntrySide === "left"){
                        hitX = tileX * WTL_GAME_DATA["general"]["tile_size"];
                        hitY = startY + Math.abs(safeDivide((hitX - startX), Math.cos(angleRAD), 1e-7, 0)) * Math.sin(angleRAD);
                    }else if (tileEntrySide === "right"){
                        hitX = (tileX+1) * WTL_GAME_DATA["general"]["tile_size"];
                        hitY = startY + Math.abs(safeDivide((hitX - startX), Math.cos(angleRAD), 1e-7, 0)) * Math.sin(angleRAD);
                    }else if (tileEntrySide === "top"){
                        hitY = this.getYOfTile(tileY); // Note: This is because tile y is the bottom left, the display is weird, sorry
                        hitX = startX + Math.abs(safeDivide((hitY - startY), Math.sin(angleRAD), 1e-7, 0)) * Math.cos(angleRAD);
                    }else{ // tileEntrySide === "bottom"
                        hitY = this.getYOfTile(tileY) - WTL_GAME_DATA["general"]["tile_size"];
                        hitX = startX + Math.abs(safeDivide((hitY - startY), Math.sin(angleRAD), 1e-7, 0)) * Math.cos(angleRAD);
                    }
                    let distance = Math.sqrt(Math.pow(hitX - startX, 2) + Math.pow(hitY - startY, 2));
                    physicalTileCollision = {
                        "tile": tile,
                        "distance": distance,
                        "x": hitX,
                        "y": hitY
                    }
                    break;
                }
            }
            let distanceToNextTileX = distanceToNextMultipleInDirection(x, WTL_GAME_DATA["general"]["tile_size"], xDirection);
            let distanceToNextTileY = distanceToNextMultipleInDirection(y, WTL_GAME_DATA["general"]["tile_size"], yDirection);
            if (distanceToNextTileX == 0){
                distanceToNextTileX = WTL_GAME_DATA["general"]["tile_size"];
            }

            if (distanceToNextTileY == 0){
                distanceToNextTileY = WTL_GAME_DATA["general"]["tile_size"];
            }

            let timeToNextTileX = safeDivide(distanceToNextTileX, Math.abs(Math.cos(angleRAD)), 1e-7, Number.MAX_SAFE_INTEGER); 
            let timeToNextTileY = safeDivide(distanceToNextTileY, Math.abs(Math.sin(angleRAD)), 1e-7, Number.MAX_SAFE_INTEGER);
            let additionalX = 0;
            let additionalY = 0;

            let time = Math.min(timeToNextTileX, timeToNextTileY);
            if (timeToNextTileX < timeToNextTileY){
                tileEntrySide = xDirection < 0 ? "right" : "left";
                additionalX = xDirection;
            }else{
                tileEntrySide = yDirection < 0 ? "top" : "bottom";
                additionalY = yDirection;
            }
            x += Math.cos(angleRAD) * time;
            y += Math.sin(angleRAD) * time;
            // Add an extra 1 in whatever direction to 
            tileX = WTLGameScene.getTileXAt(x + additionalX);
            tileY = WTLGameScene.getTileYAt(y + additionalY);

            lastAdditionalX = additionalX;
            lastAdditionalY = additionalY;
        }
        // Located a physical tile (if any) that collides with the projectile
        let collidesWithAPhysicalTile = physicalTileCollision != null;

        // Check all entities for collision
        let hitEntityDetails = null;
        for (let targetEntity of targetEntities){
            let entity = targetEntity["entity"];
            let entityX = targetEntity["center_x"];
            let entityY = targetEntity["center_y"];
            let entityWidth = targetEntity["width"];
            let entityHeight = targetEntity["height"];
            let entityLeftX = entityX - entityWidth/2;
            let entityRightX = entityX + entityWidth/2;
            let entityBottomY = entityY - entityHeight/2;
            let entityTopY = entityY + entityHeight/2;
            // Simple checks
            if (startX < entityLeftX && endX < entityLeftX){ continue; }
            if (startX > entityRightX && endX > entityRightX){ continue; }
            if (startY < entityBottomY && endY < entityBottomY){ continue; }
            if (startY > entityTopY && endY > entityTopY){ continue; }

            // Check if starting inside
            if (startX >= entityLeftX && startX <= entityRightX && startY >= entityBottomY && startY <= entityTopY){
                hitEntityDetails = {
                    "entity": entity,
                    "distance": 0
                }
                break;
            }

            // Find if it hits at some point, we know it either hits left/right/top/bottom at some point
            let timeToLeftX = safeDivide(entityLeftX - startX, finalOffsetX, 1e-7, null);
            let timeToRightX = safeDivide(entityRightX - startX, finalOffsetX, 1e-7, null);
            
            if (timeToLeftX != null && timeToLeftX >= 0){
                let yAtLeftX = startY + finalOffsetY * timeToLeftX;
                if (yAtLeftX >= entityBottomY && yAtLeftX <= entityTopY){
                    if (hitEntityDetails == null || hitEntityDetails["time"] > timeToLeftX){
                        hitEntityDetails = {
                            "entity": entity,
                            "time": timeToLeftX,
                            "distance": Math.sqrt(Math.pow(entityLeftX - startX, 2) + Math.pow(yAtLeftX - startY, 2)),
                            "type": "left"
                        }
                    }
                }
            }
            if (timeToRightX != null && timeToRightX >= 0){
                let yAtRightX = startY + finalOffsetY * timeToRightX;
                if (yAtRightX >= entityBottomY && yAtRightX <= entityTopY){
                    if (hitEntityDetails == null || hitEntityDetails["time"] > timeToRightX){
                        hitEntityDetails = {
                            "entity": entity,
                            "time": timeToRightX,
                            "distance": Math.sqrt(Math.pow(entityRightX - startX, 2) + Math.pow(yAtRightX - startY, 2)),
                            "type": "right"
                        }
                    }
                }
            }

            let timeToTopY = safeDivide(entityTopY - startY, finalOffsetY, 1e-7, null);
            let timeToBottomY = safeDivide(entityBottomY - startY, finalOffsetY, 1e-7, null);
            
            if (timeToTopY != null && timeToTopY >= 0){
                let xAtTopY = startX + finalOffsetX * timeToTopY;
                if (xAtTopY >= entityLeftX && xAtTopY <= entityRightX){
                    if (hitEntityDetails == null || hitEntityDetails["time"] > timeToTopY){
                        hitEntityDetails = {
                            "entity": entity,
                            "time": timeToTopY,
                            "distance": Math.sqrt(Math.pow(xAtTopY - startX, 2) + Math.pow(entityTopY - startY, 2)),
                            "type": "top"
                        }
                    }
                }
            }

            if (timeToBottomY != null && timeToBottomY >= 0){
                let xAtBottomY = startX + finalOffsetX * timeToBottomY;
                if (xAtBottomY >= entityLeftX && xAtBottomY <= entityRightX){
                    if (hitEntityDetails == null || hitEntityDetails["time"] > timeToBottomY){
                        hitEntityDetails = {
                            "entity": entity,
                            "time": timeToBottomY,
                            "distance": Math.sqrt(Math.pow(xAtBottomY - startX, 2) + Math.pow(entityBottomY - startY, 2)),
                            "type": "bottom"
                        }
                    }
                }
            }
        }
        let hitsEntity = hitEntityDetails != null;
        let resultObject = {
            "collision_type": null,
            "x": startX + finalOffsetX,
            "y": startY + finalOffsetY,
        };
        if (collidesWithAPhysicalTile){
            resultObject = {
                "collision_type": "physical_tile",
                "x": physicalTileCollision["x"],
                "y": physicalTileCollision["y"],
            }
        }
        if (hitsEntity && collidesWithAPhysicalTile && hitEntityDetails["distance"] < physicalTileCollision["distance"]){
            resultObject = {
                "collision_type": "entity",
                "entity": hitEntityDetails["entity"]
            }
        }else if (hitsEntity && !collidesWithAPhysicalTile){
            resultObject = {
                "collision_type": "entity",
                "entity": hitEntityDetails["entity"]
            }
        }
        return resultObject;
    }

    setDisplayPhysicalLayer(value){
        this.displayingPhyiscalLayer = value;
    }

    isDisplayingPhysicalLayer(){
        return this.displayingPhyiscalLayer;
    }

    isInSameMultiCover(entity1, entity2){
        let entity1TileX = entity1.getTileX();
        let entity2TileX = entity2.getTileX();

        let entity1TileY = entity1.getTileY();
        let entity2TileY = entity2.getTileY();
        return this.tilesInSameMultiCover(entity1TileX, entity1TileY, entity2TileX, entity2TileY);
    }

    tilesInSameMultiCover(entity1TileX, entity1TileY, entity2TileX, entity2TileY){
        // Note: Function assumes both are in multicover

        let tilesToCheck = [{"checked": false, "x": entity1TileX, "y": entity1TileY}];
        let tilesLeftToCheck = true;

        while (tilesLeftToCheck){
            tilesLeftToCheck = false;
            let currentTile = null;

            // Find a tile to start with
            for (let tile of tilesToCheck){
                if (!tile["checked"]){
                    currentTile = tile;
                    break;
                }
            }
            // If can't find a tile then
            if (currentTile == null){ break; }

            // If currently adjacent to other tile then count as in same multi cover
            if (Math.abs(entity2TileX - currentTile["x"]) + Math.abs(entity2TileY - currentTile["y"]) <= 1){
                return true;
            }

            // Explore tiles around current location
            let pairs = [[currentTile["x"], currentTile["y"]+1], [currentTile["x"], currentTile["y"]-1], [currentTile["x"]+1, currentTile["y"]], [currentTile["x"]-1, currentTile["y"]]];
            for (let pair of pairs){
                let tileX = pair[0];
                let tileY = pair[1];

                let isMultiCover = this.tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
                // Disregard if not mutli cover
                if (!isMultiCover){ continue; }

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
                        "checked": false,
                        "x": tileX,
                        "y": tileY
                    });
                }
            }
            currentTile["checked"] = true;
            // Extra check to see if not done
            if (!tilesLeftToCheck){
                for (let tile of tilesToCheck){
                    if (!tile["checked"]){
                        tilesLeftToCheck = true;
                        break;
                    }
                }
            }
        }
        //stop()
        return false;
    }

    getMultiCoverTilesConnectedTo(givenTileX, givenTileY){
        // Note: Function assumes both are in multicover

        let tilesToCheck = [{"checked": false, "x": givenTileX, "y": givenTileY}];
        let tilesLeftToCheck = true;
        while (tilesLeftToCheck){
            tilesLeftToCheck = false;
            let currentTile = null;

            // Find a tile to start with
            for (let tile of tilesToCheck){
                if (!tile["checked"]){
                    currentTile = tile;
                    break;
                }
            }
            // If can't find a tile then
            if (currentTile == null){ break; }

            // Explore tiles around current location
            let pairs = [[currentTile["x"], currentTile["y"]+1], [currentTile["x"], currentTile["y"]-1], [currentTile["x"]+1, currentTile["y"]], [currentTile["x"]-1, currentTile["y"]]];
            //console.log("pairs", copyArray(pairs))
            for (let pair of pairs){
                let tileX = pair[0];
                let tileY = pair[1];

                let isMultiCover = this.tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
                // Disregard if not mutli cover
                if (!isMultiCover){ continue; }

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
                        "checked": false,
                        "x": tileX,
                        "y": tileY
                    });
                }
            }
            currentTile["checked"] = true;
            // Extra check to see if not done
            if (!tilesLeftToCheck){
                for (let tile of tilesToCheck){
                    if (!tile["checked"]){
                        tilesLeftToCheck = true;
                        break;
                    }
                }
            }
        }
        return tilesToCheck;
    }

    calculateMultiCoverSize(givenTileX, givenTileY){
        return this.getMultiCoverTilesConnectedTo(givenTileX, givenTileY).length;
    }

    tileAtLocationHasAttribute(tileX, tileY, attribute){
        let tileAtLocation = this.getPhysicalTileCoveringLocation(tileX, tileY);
        let tileDoesNotExist = tileAtLocation === null;
        if (tileDoesNotExist){ return false; }
        return tileAtLocation.hasAttribute(attribute);
    }

    async loadMaterialList(materialList){
        // Load materials
        for (let materialObject of materialList){
            // Note: Assuming the user will NEVER use the same name for two different images
            if (objectHasKey(IMAGES, materialObject["name"])){ return; }
            IMAGES[materialObject["name"]] = await loadLocalImage(materialObject["file_link"]);
        }
    }

    async loadTilesFromString(tileJSONStr){
        await this.loadTilesFromJSON(JSON.parse(tileJSONStr));
    }

    async loadTilesFromJSON(tileJSON){
        // Clear current chunks
        this.chunks.clear();
        
        // Load Materials
        await this.loadMaterialList(tileJSON["materials"])

        // Load visual tiles
        for (let tile of tileJSON["visual_tiles"]){
            let material = null;
            // Note: Assuming material exists
            for (let materialObject of tileJSON["materials"]){
                if (materialObject["name"] == tile["material"]){
                    material = materialObject;
                    break;
                }
            }
            this.placeVisualTile(material, tile["tile_x"], tile["tile_y"]);
        }

        // Load Physical Tiles
        for (let tile of tileJSON["physical_tiles"]){
            let material = null;
            // Note: Assuming material exists
            for (let materialObject of tileJSON["materials"]){
                if (materialObject["name"] == tile["material"]){
                    material = materialObject;
                    break;
                }
            }
            this.placePhysicalTile(material, tile["tile_x"], tile["tile_y"]);
        }
    }

    toTileJSON(){
        let tileJSON = {};
        tileJSON["materials"] = [];
        tileJSON["visual_tiles"] = [];
        tileJSON["physical_tiles"] = [];
        // Save Visual Chunks to JSON
        for (let [chunk, chunkX, chunkY] of this.chunks){
            if (chunk === null){ continue; }
            for (let [tile, tI] of chunk.getVisualTiles()){
                if (tile === null){ continue; }
                let material = tile.getMaterial();
                let materialExists = false;
                for (let savedMaterial of tileJSON["materials"]){
                    if (savedMaterial["name"] == material["name"]){
                        materialExists = true;
                        break;
                    }
                }
                // Save material if applicable
                if (!materialExists){
                    tileJSON["materials"].push(material);
                }
                let individualTileJSON = {
                    "material": material["name"],
                    "tile_x": tile.getTileX(),
                    "tile_y": tile.getTileY()
                }
                tileJSON["visual_tiles"].push(individualTileJSON);
            }
        }

        // Save Physical Chunks to JSON
        for (let [chunk, chunkX, chunkY] of this.chunks){
            if (chunk === null){ continue; }
            for (let [tile, tI] of chunk.getPhysicalTiles()){
                if (tile === null){ continue; }
                let material = tile.getMaterial();
                let materialExists = false;
                for (let savedMaterial of tileJSON["materials"]){
                    if (savedMaterial["name"] == material["name"]){
                        materialExists = true;
                        break;
                    }
                }
                // Save material if applicable
                if (!materialExists){
                    tileJSON["materials"].push(material);
                }
                let individualTileJSON = {
                    "material": material["name"],
                    "tile_x": tile.getTileX(),
                    "tile_y": tile.getTileY()
                }
                tileJSON["physical_tiles"].push(individualTileJSON);
            }
        }
        return tileJSON;
    }

    getMaterialImage(materialName){
        return IMAGES[materialName];
    }

    getMaterialXTileSize(materialName){
        return this.getMaterialImage(materialName).width / WTL_GAME_DATA["general"]["tile_size"];
    }

    getMaterialYTileSize(materialName){
        return this.getMaterialImage(materialName).height / WTL_GAME_DATA["general"]["tile_size"];
    }

    hasEntityFocused(){
        return this.focusedEntity != null;
    }

    getFocusedEntity(){
        return this.focusedEntity;
    }

    setFocusedEntity(entity){
        this.focusedEntity = entity;
    }

    getWidth(){
        return getCanvasWidth();
    }

    getHeight(){
        return getCanvasHeight();
    }

    tick(timeMS){
        if (USER_INPUT_MANAGER.isActivated("p_ticked")){
           this.setDisplayPhysicalLayer(!this.isDisplayingPhysicalLayer());
        }
        // Tick the entities
        for (let [entity, itemIndex] of this.entities){
            entity.tick(timeMS);
        }
    }

    placeVisualTile(material, tileX, tileY){
        // Delete all other tiles that are covered by region
        let materialXTileSize = this.getMaterialXTileSize(material["name"]);
        let materialYTileSize = this.getMaterialYTileSize(material["name"]);
        // Only delete if placing an extra large tile
        if (materialXTileSize > 1 || materialYTileSize > 1){
            for (let dTileX = tileX; dTileX < tileX + materialXTileSize; dTileX++){
                for (let dTileY = tileY; dTileY > tileY - materialYTileSize; dTileY--){
                    this.deleteVisualTile(dTileX, dTileY);
                }
            }
        }

        // Place tile
        let chunk = this.getCreateChunkAtLocation(tileX, tileY);
        chunk.placeVisualTile(material, tileX, tileY);
    }

    placePhysicalTile(material, tileX, tileY){
        // Place tile
        let chunk = this.getCreateChunkAtLocation(tileX, tileY);
        chunk.placePhysicalTile(material, tileX, tileY);
    }

    deleteVisualTile(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return null; }

        // Check if the chunk has a physical tile there
        return chunk.getVisualTiles().set(tileX, tileY, null);
    }

    deletePhysicalTile(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return null; }

        // Check if the chunk has a physical tile there
        return chunk.getPhysicalTiles().set(tileX, tileY, null);
    }

    hasVisualTileAtLocation(tileX, tileY){
        return this.getVisualTileAtLocation(tileX, tileY) != null;
    }

    hasVisualTileCoveringLocation(tileX, tileY){
        return this.getVisualTileCoveringLocation(tileX, tileY) != null;
    }


    hasPhysicalTileAtLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY) != null;
    }

    hasPhysicalTileCoveringLocation(tileX, tileY){
        return this.hasPhysicalTileAtLocation(tileX, tileY);
    }


    getVisualTileCoveringLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        if (isRDebugging()){
            debugger;
        }

        let chunkYExpectedIndex = this.chunks.findYActualOrWouldBeLocation(chunkY);

        // Ignore if the index suggests it should be inserted at the end
        if (chunkYExpectedIndex === this.chunks.getYLength()){
            return null;
        }

        let yAxis = this.chunks.grabYAxis();
        let yValueAtIndex = yAxis[chunkYExpectedIndex]["y"];

        // We want to look at chunks that are below or the same y
        if (chunkY > yValueAtIndex){
            chunkYExpectedIndex += 1;
        }

        // Loop from the highest index with a y <= chunkY
        for (let yIndex = chunkYExpectedIndex; yIndex < this.chunks.getYLength(); yIndex++){
            let xArrayObj = yAxis[yIndex];
            let xArray = xArrayObj["array"];
            let xArrayLength = xArrayObj["length"];
            let chunkXExpectedIndex = this.chunks.findXActualOrWouldBeLocation(chunkX, xArrayObj);
            
            // If the right chunk belongs at the end of the list then loop from the last valid one 
            if (chunkXExpectedIndex === xArrayLength){
                chunkXExpectedIndex = xArrayLength - 1;
            }

            let xValueAtIndex = xArray[chunkXExpectedIndex]["x"];
            // We only want chunks that are to the left or at the same chunk x
            if (xValueAtIndex > chunkX){
                chunkXExpectedIndex -= 1;
            }

            // Loop through lower x values
            for (let xIndex = chunkXExpectedIndex; xIndex >= 0; xIndex--){
                let chunk = xArray[xIndex]["value"];
                if (chunk === null){ continue; }
                if (chunk.covers(tileX, tileY)){
                    let visualTile = chunk.getVisualTileCoveringLocation(tileX, tileY);
                    // It can cover naturally but not visually cover it (say a big visual from a chunk above)
                    if (visualTile != null){
                        return visualTile;
                    }
                }
            }
        }
        return null;
    }

    getPhysicalTileCoveringLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY);
    }

    getCreateChunkAtLocation(tileX, tileY){
        let existingChunk = this.getChunkAtLocation(tileX, tileY);
        // Create if not existing
        if (existingChunk == null){
            let chunkX = Chunk.tileToChunkCoordinate(tileX);
            let chunkY = Chunk.tileToChunkCoordinate(tileY);
            existingChunk = new Chunk(this, chunkX, chunkY);
            this.chunks.set(chunkX, chunkY, existingChunk);
        }
        return existingChunk;
    }

    getChunkAtLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);
        return this.chunks.get(chunkX, chunkY);
    }

    getChunks(){
        return this.chunks;
    }

    // Note: This is only tiles naturally at location not just covering
    getPhysicalTileAtLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return null; }

        // Check if the chunk has a physical tile there
        return chunk.getPhysicalTileAtLocation(tileX, tileY);
    }

    // Note: This is only tiles naturally at location not just covering
    getVisualTileAtLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return null; }

        // Check if the chunk has a visual tile there
        return chunk.getVisualTileAtLocation(tileX, tileY);
    }

    hasChunkAtLocation(tileX, tileY){
        return this.getChunkAtLocation(tileX, tileY) != null;
    }

    static getTileXAt(x){
        return Math.floor(x / WTL_GAME_DATA["general"]["tile_size"]);
    }

    static getTileYAt(y){
        return Math.floor(y / WTL_GAME_DATA["general"]["tile_size"]);
    }

    getDisplayXFromTileX(lX, tileX){
        return (this.getXOfTile(tileX) - lX) * gameZoom;
    }

    getXOfTile(tileX){
        return tileX * WTL_GAME_DATA["general"]["tile_size"];
    }

    getCenterXOfTile(tileX){
        return this.getXOfTile(tileX) + (WTL_GAME_DATA["general"]["tile_size"]-1)/2;
    }

    getCenterYOfTile(tileY){
        return this.getYOfTile(tileY) - (WTL_GAME_DATA["general"]["tile_size"]-1)/2;
    }

    getDisplayYFromTileY(bY, tileY){
        return this.changeToScreenY((this.getYOfTile(tileY) - bY)*gameZoom);
    }

    getYOfTile(tileY){
        return (tileY+1) * WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getDisplayX
        Method Parameters:
            centerX:
                The x coordinate of the center of the entity
            width:
                The width of the entity
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            round:
                If rounded down to nearest pixel
        Method Description: Determines the top left corner where an image should be displayed
        Method Return: int
    */
    getDisplayX(centerX, width, lX, round=false){
        // Find relative to bottom left corner
        let displayX = (centerX - lX) * gameZoom;

        // Change coordinate system
        displayX = this.changeToScreenX(displayX);

        // Find top left corner
        displayX = displayX - width / 2;

        // Round down to nearest pixel
        if (round){
            displayX = Math.floor(displayX);
        }
        return displayX;
    }

    getDisplayXOfPoint(x, lX, round=false){
        return this.getDisplayX(x, 0, lX, round);
    }

    getDisplayYOfPoint(y, bY, round=false){
        return this.getDisplayY(y, 0, bY, round);
    }

    /*
        Method Name: getDisplayY
        Method Parameters:
            centerY:
                The y coordinate of the center of the entity
            height:
                The height of the entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
            round:
                If rounded down to nearest pixel
        Method Description: Determines the top left corner where an image should be displayed
        Method Return: int
    */
    getDisplayY(centerY, height, bY, round=false){
        // Find relative to bottom left corner
        let displayY = (centerY - bY) * gameZoom;

        // Change coordinate system
        displayY = this.changeToScreenY(displayY);

        // Find top left corner
        displayY = displayY - height / 2;

        // Round down to nearest pixel
        if (round){
            displayY = Math.floor(displayY);
        }
        return displayY;
    }

    getLX(){
        let lX = 0;
        if (!this.hasEntityFocused()){
            lX = -1 * this.getWidth() / 2 / gameZoom;
        }else{
            lX = this.getFocusedEntity().getInterpolatedCenterX() - (this.getWidth()) / 2 / gameZoom;
        }
        return lX;
    }

    getBY(){
        let bY = 0;
        if (!this.hasEntityFocused()){
            bY = -1 * this.getWidth() / 2 / gameZoom;
        }else{
            bY = this.getFocusedEntity().getInterpolatedCenterY() - (this.getHeight()) / 2 / gameZoom;
        }
        return bY;
    }

    displayTiles(lX, rX, bY, tY){
        let rightChunkX = Chunk.tileToChunkCoordinate(WTLGameScene.getTileXAt(rX));
        let bottomChunkY = Chunk.tileToChunkCoordinate(WTLGameScene.getTileXAt(bY));

        let chunkYExpectedIndex = this.chunks.findYActualOrWouldBeLocation(bottomChunkY);

        // Ignore if the index suggests it should be inserted at the end
        if (chunkYExpectedIndex === this.chunks.getYLength()){
            return null;
        }

        let yAxis = this.chunks.grabYAxis();
        let yValueAtIndex = yAxis[chunkYExpectedIndex]["y"];

        // We only want >=
        if (yValueAtIndex < bottomChunkY){
            chunkYExpectedIndex += 1;
        }

        // Loop from the lowest index to the highest
        for (let yIndex = chunkYExpectedIndex; yIndex < this.chunks.getYLength(); yIndex++){
            let xArrayObj = yAxis[yIndex];
            let xArray = xArrayObj["array"];
            let xArrayLength = xArrayObj["length"];
            let chunkXExpectedIndex = this.chunks.findXActualOrWouldBeLocation(rightChunkX, xArrayObj);
            
            // If the right chunk belongs at the end of the list then loop from the last valid one 
            if (chunkXExpectedIndex === xArrayLength){
                chunkXExpectedIndex = xArrayLength - 1;
            }

            let xValueAtIndex = xArray[chunkXExpectedIndex]["x"];
            // We only want tiles that are to the left or at the same tile x
            if (xValueAtIndex > rightChunkX){
                chunkXExpectedIndex -= 1;
            }

            // Loop through lower x values
            for (let xIndex = chunkXExpectedIndex; xIndex >= 0; xIndex--){
                let chunk = xArray[xIndex]["value"];
                if (chunk === null){ continue; }
                chunk.displayVisualTiles(lX, rX, bY, tY);
            }
        }

        if (this.isDisplayingPhysicalLayer()){
            // Loop from the lowest index to the highest
            for (let yIndex = chunkYExpectedIndex; yIndex < this.chunks.getYLength(); yIndex++){
                let xArrayObj = yAxis[yIndex];
                let xArray = xArrayObj["array"];
                let xArrayLength = xArrayObj["length"];
                let chunkXExpectedIndex = this.chunks.findXActualOrWouldBeLocation(rightChunkX, xArrayObj);
                
                // If the right chunk belongs at the end of the list then loop from the last valid one 
                if (chunkXExpectedIndex === xArrayLength){
                    chunkXExpectedIndex = xArrayLength - 1;
                }

                let xValueAtIndex = xArray[chunkXExpectedIndex]["x"];
                // We only want tiles that are to the left or at the same tile x
                if (xValueAtIndex > rightChunkX){
                    chunkXExpectedIndex -= 1;
                }

                // Loop through lower x values
                for (let xIndex = chunkXExpectedIndex; xIndex >= 0; xIndex--){
                    let chunk = xArray[xIndex]["value"];
                    if (chunk === null){ continue; }
                    chunk.displayPhysicalTiles(lX, rX, bY, tY);
                }
            }
        }
    }

    display(){
        let lX = this.getLX(); // Bottom left x
        let bY = this.getBY(); // Bottom left y
        let rX = lX + this.getWidth() / gameZoom;
        let tY = bY + this.getHeight() / gameZoom;

        // Make sounds play
        SOUND_MANAGER.playAll(lX, rX, bY, tY);

        // Display Page Background
        this.displayPageBackground();

        // Display Tiles

        this.displayTiles(lX, rX, bY, tY);

        // Delete expired visuals
        this.expiringVisuals.deleteWithCondition((visual) => {
            return visual.isExpired();
        });


        // Display Ground Expiring Visuals
        for (let [visual, vI] of this.expiringVisuals){
            if (visual.getYCategory() === "ground"){
                visual.display(this, lX, rX, bY, tY);
            }
        }

        // Display Entities
        for (let [entity, eI] of this.entities){
            if (this.hasEntityFocused() && entity.getID() == this.focusedEntity.getID()){ continue; }
            if (!entity.isVisibleTo(this.focusedEntity)){ continue; }
            entity.display(lX, rX, bY, tY);
        }
        

        // Display Air Expiring Visuals
        for (let [visual, vI] of this.expiringVisuals){
            if (visual.getYCategory() === "air"){
                visual.display(this, lX, rX, bY, tY);
            }
        }

        // Display focused entity
        if (this.hasEntityFocused()){
            this.getFocusedEntity().display(lX, rX, bY, tY);
            this.getFocusedEntity().displayWhenFocused();
        }

        // Display sound indicator
        SOUND_MANAGER.display();
    }

    addExpiringVisual(expiringVisual){
        this.expiringVisuals.push(expiringVisual);
    }


    changeToScreenX(x){
        return x; // Doesn't need to be changed ATM
    }

    changeToScreenY(y){
        return this.getHeight() - y;
    }

    changeFromScreenY(y){
        return this.changeToScreenY(y);
    }

    addEntity(entity){
        if (entity.getID() === null){
            entity.setID(this.entities.getLength());
        } 
        this.entities.push(entity);
    }

    displayPageBackground(){
        drawingContext.drawImage(IMAGES["page_background"], 0, 0); // TODO: This should be variable in the future
    }
}

class Chunk {
    constructor(scene, chunkX, chunkY){
        this.scene = scene;
        this.chunkX = chunkX;
        this.chunkY = chunkY;
        this.visualTiles = new NotSamXYSortedArrayList();
        this.physicalTiles = new NotSamXYSortedArrayList();
        this.recalculateBoundaries();
    }

    getVisualTiles(){
        return this.visualTiles;
    }

    getPhysicalTiles(){
        return this.physicalTiles;
    }

    hasPhysicalTileAtLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY) != null;
    }

    hasVisualTileAtLocation(tileX, tileY){
        return this.getVisualTileAtLocation(tileX, tileY) != null;
    }

    getVisualTileAtLocation(tileX, tileY){
        return this.visualTiles.get(tileX, tileY);
    }

    getPhysicalTileAtLocation(tileX, tileY){
        return this.physicalTiles.get(tileX, tileY);
    }

    getVisualTileCoveringLocation(tileX, tileY){
        let tileYExpectedIndex = this.visualTiles.findYActualOrWouldBeLocation(tileY);

        // Ignore if the index suggests it should be inserted at the end
        if (tileYExpectedIndex === this.visualTiles.getYLength()){
            return null;
        }

        let yAxis = this.visualTiles.grabYAxis();
        let yValueAtIndex = yAxis[tileYExpectedIndex]["y"];

        // We want to look at chunks that are below or the same y
        if (tileY > yValueAtIndex){
            tileYExpectedIndex += 1;
        }


        // Loop from the lowest to highest
        for (let yIndex = tileYExpectedIndex; yIndex < this.visualTiles.getYLength(); yIndex++){
            let xArrayObj = yAxis[yIndex];
            let xArray = xArrayObj["array"];
            let xArrayLength = xArrayObj["length"];
            let tileXExpectedIndex = this.visualTiles.findXActualOrWouldBeLocation(tileX, xArrayObj);
            
            // If the right tile belongs at the end of the list then loop from the last valid one 
            if (tileXExpectedIndex === xArrayLength){
                tileXExpectedIndex = xArrayLength - 1;
            }

            let xValueAtIndex = xArray[tileXExpectedIndex]["x"];
            // We only want tiles that are to the left or at the same tile x
            if (xValueAtIndex > tileX){
                tileXExpectedIndex -= 1;
            }

            // Loop through lower x values
            for (let xIndex = tileXExpectedIndex; xIndex >= 0; xIndex--){
                let tile = xArray[xIndex]["value"];
                if (tile === null){ continue; }
                if (tile.covers(tileX, tileY)){
                    return tile;
                }
            }
        }
        return null;
    }

    getPhysicalTileCoveringLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY);
    }

    displayVisualTiles(lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        // Display all tiles
        for (let [tile, tileX, tileY] of this.visualTiles){
            if (tile === null){ continue; }
            tile.display(lX, rX, bY, tY);
        }
    }

    displayPhysicalTiles(lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        // Display all tiles
        for (let [tile, tileX, tileY] of this.physicalTiles){
            if (tile === null){ continue; }
            tile.display(lX, rX, bY, tY);
        }
    }

    touchesRegion(lX, rX, bY, tY){
        let lChunkX = Chunk.tileToChunkCoordinate(WTLGameScene.getTileXAt(lX));
        let rChunkX = Chunk.tileToChunkCoordinate(WTLGameScene.getTileXAt(rX));
        let myRightChunkX = Chunk.tileToChunkCoordinate(this.getRightX());
        let myLeftChunkX = Chunk.tileToChunkCoordinate(this.getLeftX());
        if (myRightChunkX < lChunkX || myLeftChunkX > rChunkX){ return false; }
        let bChunkY = Chunk.tileToChunkCoordinate(WTLGameScene.getTileYAt(bY));
        let tChunkY = Chunk.tileToChunkCoordinate(WTLGameScene.getTileYAt(tY));
        let myTopChunkY = Chunk.tileToChunkCoordinate(this.getTopY());
        let myBottomChunkY = Chunk.tileToChunkCoordinate(this.getBottomY());
        if (myTopChunkY < bChunkY || myBottomChunkY > tChunkY){ return false; }
        return true;
    }

    getLeftX(){
        return this.leftX;
    }

    // Note: Be careful if you have a 5000 long tile in bottom right it will extend this right
    getRightX(){
        return this.rightX;
    }

    getTopY(){
        return this.topY;
    }

    // Note: Be careful if you have a 5000 long tile in bottom right it will extend this down
    getBottomY(){
        return this.bottomY;
    }

    recalculateBoundaries(){
        let bottomY = this.chunkY * WTL_GAME_DATA["general"]["chunk_size"];
        for (let [tile, tileX, tileY] of this.visualTiles){
            if (tile === null){ continue; }
            let tileBottomY = tile.getBottomY();
            if (tileBottomY < bottomY){
                bottomY = tileBottomY;
            }
        }
        this.bottomY = bottomY;

        let rightX = (this.chunkX + 1) * WTL_GAME_DATA["general"]["chunk_size"] - 1;
        for (let [tile, tileX, tileY] of this.visualTiles){
            if (tile === null){ continue; }
            let tileRightX = tile.getRightX();
            if (tileRightX > rightX){
                rightX = tileRightX;
            }
        }
        this.rightX = rightX;
        this.leftX = this.chunkX * WTL_GAME_DATA["general"]["chunk_size"];
        this.topY = (this.chunkY + 1) * WTL_GAME_DATA["general"]["chunk_size"] - 1;
    }

    static getNaturalLeftX(chunkX){
        return chunkX * WTL_GAME_DATA["general"]["chunk_size"]
    }

    getNaturalLeftX(){
        return this.getLeftX();
    }

    static getNaturalRightX(chunkX){
        return (chunkX + 1) * WTL_GAME_DATA["general"]["chunk_size"] - 1;
    }

    getNaturalRightX(){
        return Chunk.getNaturalRightX(this.chunkX);
    }

    static getNaturalTopY(chunkY){
        return (chunkY + 1) * WTL_GAME_DATA["general"]["chunk_size"] - 1;
    }

    getNaturalTopY(){
        return this.getTopY();
    }

    static getNaturalBottomY(chunkY){
        return chunkY * WTL_GAME_DATA["general"]["chunk_size"];
    }

    getNaturalBottomY(){
        return Chunk.getNaturalBottomY(this.chunkY);
    }

    covers(tileX, tileY){
        let chunkLeftX = this.getNaturalLeftX();
        let chunkRightX = this.getNaturalRightX();
        let chunkTopY = this.getNaturalTopY();
        let chunkBottomY = this.getNaturalBottomY();
        // If within natural boundries
        if (tileX >= chunkLeftX && tileX <= chunkRightX && tileY >= chunkBottomY && tileY <= chunkTopY){ return true; }
        // If to the left then no
        if (tileX < chunkLeftX){ return false; }
        // If above it then no
        if (tileY > chunkTopY){ return false; }
        // Check all tiles
        for (let [tile, tileX, tileY] of this.visualTiles){
            if (tile === null){ continue; }
            if (tile.covers(tileX, tileY)){ return true; }
        }
        return false;
    }

    coversNaturally(tileX, tileY){
        return Chunk.tileToChunkCoordinate(tileX) === this.chunkX && Chunk.tileToChunkCoordinate(tileY) === this.chunkY;
    }

    outsideTileRegion(leftTileX, rightTileX, bottomTileY, topTileY){
        if (this.chunkX < Chunk.tileToChunkCoordinate(leftTileX)){ return true; }
        if (this.chunkX > Chunk.tileToChunkCoordinate(rightTileX)){ return true; }
        if (this.chunkY < Chunk.tileToChunkCoordinate(bottomTileY)){ return true; }
        if (this.chunkY > Chunk.tileToChunkCoordinate(topTileY)){ return true; }
        return false;
    }

    placeVisualTile(material, tileX, tileY){
        let tile = this.getVisualTileCoveringLocation(tileX, tileY);
        // If tile doesn't exist, add it
        if (!tile){
            tile = new VisualTile(this.scene, this, material, tileX, tileY);
            this.visualTiles.set(tileX, tileY, tile);
        }
        // If same tile do nothing
        else if (tile.getMaterialName() == material["name"]){
            return;
        }
        // Else if the tile exists but has a different material then change
        else if (tile.getTileX() == tileX && tile.getTileY() == tileY && tile.getMaterialName() != material["name"]){
            tile.changeMaterial(material);
        }else{
            tile.delete();
            tile = new VisualTile(this.scene, this, material, tileX, tileY);
            this.visualTiles.set(tileX, tileY, tile);
        }
        this.recalculateBoundaries();
    }

    placePhysicalTile(material, tileX, tileY){
        let tile = this.getPhysicalTileCoveringLocation(tileX, tileY);
        // If tile doesn't exist, add it
        if (!tile){
            tile = new PhysicalTile(this.scene, this, material, tileX, tileY);
            this.physicalTiles.set(tileX, tileY, tile);
        }
        // Else if the tile exists but has a different material then change
        else if (tile.getTileX() == tileX && tile.getTileY() == tileY && tile.getMaterialName() != material["name"]){
            tile.changeMaterial(material);
        }else{
            tile.delete();
            tile = new PhysicalTile(this.scene, this, material, tileX, tileY);
            this.physicalTiles.set(tileX, tileY, tile);
        }
    }

    deleteVisualTile(tile){
        let tX = tile.getTileX();
        let tY = tile.getTileY();
        // Find and delete the specified tile
        this.visualTiles.set(tX, tY, null);
        this.recalculateBoundaries();
    }

    deletePhysicalTile(tile){
        let tX = tile.getTileX();
        let tY = tile.getTileY();
        // Find and delete the specified tile
        this.physicalTiles.set(tX, tY, null);
    }

    deletePhysicalTileAt(tileX, tileY){
        this.physicalTiles.set(tileX, tileY, null);
    }

    deleteVisualTileAt(tileX, tileY){
        this.visualTiles.set(tileX, tileY, null);
        this.recalculateBoundaries();
    }

    static tileToChunkCoordinate(tileCoordinate){
        return Math.floor(tileCoordinate / WTL_GAME_DATA["general"]["chunk_size"]);
    }

    static getRightTileXOfChunk(chunkX){
        return ((chunkX+1) * WTL_GAME_DATA["general"]["chunk_size"] - 1);
    }

    static getLeftTileXOfChunk(chunkX){
        return chunkX * WTL_GAME_DATA["general"]["chunk_size"];
    }

    static getTopTileYOfChunk(chunkY){
        return ((chunkY+1) * WTL_GAME_DATA["general"]["chunk_size"] - 1);
    }

    static getBottomTileYOfChunk(chunkY){
        return chunkY * WTL_GAME_DATA["general"]["chunk_size"];
    }
}