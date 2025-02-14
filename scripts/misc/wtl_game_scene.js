/*
    Class Name: WTLGameScene
    Class Description: A scene where WTL games take place
*/
class WTLGameScene {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        this.objects = [];
        this.entities = new NotSamLinkedList();
        this.focusedEntity = null;
        this.chunks = new NotSamXYSortedArrayList();
        this.expiringVisuals = new NotSamLinkedList();
        this.displayingPhyiscalLayer = false;
    }

    /*
        Method Name: getEntities
        Method Parameters: None
        Method Description: Getter
        Method Return: NotSamLinkedList<Entity>
    */
    getEntities(){
        return this.entities;
    }

    /*
        Method Name: findInstantCollisionForProjectile
        Method Parameters:
            startX:
                The starting x of the projectile
            startY:
                The starting y of the projectile
            angleRAD:
                The angle of travel for the projectile
            range:
                The range of the projectile
            entityExceptionFunction:
                The entity exception function
        Method Description: Finds a collision for a projectile
        Method Return: JSON
    */
    findInstantCollisionForProjectile(startX, startY, angleRAD, range=Number.MAX_SAFE_INTEGER, entityExceptionFunction=(entity) => { return false; }){
        let targetEntities = [];
        for (let [entity, entityIndex] of this.entities){
            if (entity.isDead()){ continue; }
            if (entityExceptionFunction(entity)){ continue; }
            targetEntities.push({"center_x": entity.getInterpolatedTickCenterX(), "center_y": entity.getInterpolatedTickCenterY(), "half_width": entity.getHalfWidth(), "half_height": entity.getHalfHeight(), "entity": entity});
        }
        return this.findInstantCollisionForProjectileWithTargets(startX, startY, angleRAD, range, targetEntities);
    }

    /*
        Method Name: findInstantCollisionForProjectileWithTargets
        Method Parameters:
            startX:
                The starting x of the projectile
            startY:
                The starting y of the projectile
            angleRAD:
                The angle of travel for the projectile
            range:
                The range of the projectile
            targetEntities:
                A list of entities
        Method Description: Finds a collision for a projectile given targets
        Method Return: JSON
    */
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
            // If there is a current chunk
            let tile = null;
            if (currentChunk != null){
                tile = currentChunk.getPhysicalTileCoveringLocation(tileX, tileY);
            }

            let physicalTileIsPresent = tile != null;
            if (physicalTileIsPresent){
                if (tile.hasAttribute("solid")){
                    let hitX;
                    let hitY;
                    if (tileEntrySide === "left"){
                        hitX = tileX * WTL_GAME_DATA["general"]["tile_size"];
                        hitY = startY + Math.abs(safeDivide((hitX - startX), Math.cos(angleRAD), 1e-7, 0)) * Math.sin(angleRAD);
                    }else if (tileEntrySide === "right"){
                        hitX = (tileX+1) * WTL_GAME_DATA["general"]["tile_size"] - 1; // The -1 is important because its the right of the tile NOT the pixel AFTER the right
                        hitY = startY + Math.abs(safeDivide((hitX - startX), Math.cos(angleRAD), 1e-7, 0)) * Math.sin(angleRAD);
                    }else if (tileEntrySide === "top"){
                        hitY = this.getYOfTile(tileY); // Note: This is because tile y is the bottom left, the display is weird, sorry
                        hitX = startX + Math.abs(safeDivide((hitY - startY), Math.sin(angleRAD), 1e-7, 0)) * Math.cos(angleRAD);
                    }else{ // tileEntrySide === "bottom"
                        hitY = this.getYOfTile(tileY) - WTL_GAME_DATA["general"]["tile_size"] + 1; // The +1 is important because its the bottom of the tile NOT the pixel BELOW the BOTTOM
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
            let entityWidth = targetEntity["half_width"];
            let entityHeight = targetEntity["half_height"];
            let entityLeftX = entityX - entityWidth;
            let entityRightX = entityX + entityWidth;
            let entityBottomY = entityY - entityHeight;
            let entityTopY = entityY + entityHeight;
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

    /*
        Method Name: setDisplayPhysicalLayer
        Method Parameters: 
            value:
                boolean value
        Method Description: Sets whether the physical layer is being displayed
        Method Return: void
    */
    setDisplayPhysicalLayer(value){
        this.displayingPhyiscalLayer = value;
    }

    /*
        Method Name: isDisplayingPhysicalLayer
        Method Parameters: None
        Method Description: Checks if the physical layer is being displayed
        Method Return: boolean
    */
    isDisplayingPhysicalLayer(){
        return this.displayingPhyiscalLayer;
    }

    /*
        Method Name: isInSameMultiCover
        Method Parameters: 
            entity1:
                An entity
            entity2:
                An entity
        Method Description: Checks if two entities are in the same multicover
        Method Return: boolean
    */
    isInSameMultiCover(entity1, entity2){
        let entity1TileX = entity1.getTileX();
        let entity2TileX = entity2.getTileX();

        let entity1TileY = entity1.getTileY();
        let entity2TileY = entity2.getTileY();
        return this.tilesInSameMultiCover(entity1TileX, entity1TileY, entity2TileX, entity2TileY);
    }

    /*
        Method Name: tilesInSameMultiCover
        Method Parameters: 
            entity1TileX:
                A tile x coordinate
            entity1TileY:
                A tile y coordinate
            entity2TileX:
                A tile x coordinate
            entity2TileY:
                A tile y coordinate
        Method Description: Checks if two tiles are in the same multicover
        Method Return: boolean
    */
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

    /*
        Method Name: getMultiCoverTilesConnectedTo
        Method Parameters: 
            givenTileX:
                A tile x coordinate
            givenTileY:
                A tile y coodinate
        Method Description: Finds mutli cover tiles connected to a given tile x and tile y
        Method Return: List of JSON
        Method Note: Function assumes tile is in multicover
    */
    getMultiCoverTilesConnectedTo(givenTileX, givenTileY){
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

    /*
        Method Name: getMultiCoverTilesConnectedTo
        Method Parameters: 
            givenTileX:
                A tile x coordinate
            givenTileY:
                A tile y coodinate
        Method Description: Finds mutli cover tiles connected to a given tile x and tile y
        Method Return: List of JSON
        Method Note: Function assumes tile is in mutlicover
    */
    calculateMultiCoverSize(givenTileX, givenTileY){
        return this.getMultiCoverTilesConnectedTo(givenTileX, givenTileY).length;
    }

    /*
        Method Name: tileAtLocationHasAttribute
        Method Parameters: 
            tileX:
                A tile x location
            tileY:
                A tile y location
            attribute:
                An attribute name (string)
        Method Description: Checks if a tile at a given location has a given attribute
        Method Return: boolean
    */
    tileAtLocationHasAttribute(tileX, tileY, attribute){
        let tileAtLocation = this.getPhysicalTileCoveringLocation(tileX, tileY);
        let tileDoesNotExist = tileAtLocation === null;
        if (tileDoesNotExist){ return false; }
        return tileAtLocation.hasAttribute(attribute);
    }

    /*
        Method Name: loadMaterialList
        Method Parameters: 
            materialList:
                A list of JSON material objects
        Method Description: Loads a list of materials to images
        Method Return: Promise (implicit)
    */
    async loadMaterialList(materialList){
        // Load materials
        for (let materialObject of materialList){
            // Note: Assuming the user will NEVER use the same name for two different images
            if (objectHasKey(IMAGES, materialObject["name"])){ return; }
            IMAGES[materialObject["name"]] = await loadLocalImage(materialObject["file_link"]);
        }
    }

    /*
        Method Name: loadTilesFromString
        Method Parameters: 
            tileJSONStr:
                A string containing a tile JSON
        Method Description: Loads tiles from a string
        Method Return: Promise (implicit)
    */
    async loadTilesFromString(tileJSONStr){
        await this.loadTilesFromJSON(JSON.parse(tileJSONStr));
    }

    /*
        Method Name: loadTilesFromJSON
        Method Parameters: 
            tileJSON:
                A tile JSON
        Method Description: Loads tiles from a JSON
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: toTileJSON
        Method Parameters: None
        Method Description: Creates a JSON representation of all tiles
        Method Return: JSON
    */
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

    /*
        Method Name: getMaterialImage
        Method Parameters: 
            materialName:
                The name of a material (string)
        Method Description: Gets the image of a material
        Method Return: Image
    */
    getMaterialImage(materialName){
        return IMAGES[materialName];
    }

    /*
        Method Name: getMaterialXTileSize
        Method Parameters: 
            materialName:
                Name of a material (string)
        Method Description: Finds the x tile size of a material
        Method Return: number
    */
    getMaterialXTileSize(materialName){
        return this.getMaterialImage(materialName).width / WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getMaterialYTileSize
        Method Parameters: 
            materialName:
                Name of a material (string)
        Method Description: Finds the y tile size of a material
        Method Return: number
    */
    getMaterialYTileSize(materialName){
        return this.getMaterialImage(materialName).height / WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: hasEntityFocused
        Method Parameters: None
        Method Description: Checks if there is a focused entity
        Method Return: boolean
    */
    hasEntityFocused(){
        return this.focusedEntity != null;
    }

    /*
        Method Name: getFocusedEntity
        Method Parameters: None
        Method Description: Gets the focused enemy
        Method Return: Entity
    */
    getFocusedEntity(){
        return this.focusedEntity;
    }

    /*
        Method Name: setFocusedEntity
        Method Parameters: 
            entity:
                An entity to focus on
        Method Description: Sets the focused entity
        Method Return: void
    */
    setFocusedEntity(entity){
        this.focusedEntity = entity;
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Gets the current canvas width
        Method Return: int
    */
    getWidth(){
        return getCanvasWidth();
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Gets the current canvas height
        Method Return: int
    */
    getHeight(){
        return getCanvasHeight();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks the entities in the scene and looks for user input wrt displaying physical tiles
        Method Return: void
    */
    tick(){
        if (GAME_USER_INPUT_MANAGER.isActivated("p_ticked")){
           this.setDisplayPhysicalLayer(!this.isDisplayingPhysicalLayer());
        }
        // Tick the entities
        for (let [entity, itemIndex] of this.entities){
            entity.tick();
        }
    }

    /*
        Method Name: placeVisualTile
        Method Parameters: 
            material:
                A material JSON
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Places a visual tile
        Method Return: void
    */
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

    /*
        Method Name: placePhysicalTile
        Method Parameters: 
            material:
                A material JSON
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Places a physical tile
        Method Return: void
    */
    placePhysicalTile(material, tileX, tileY){
        // Place tile
        let chunk = this.getCreateChunkAtLocation(tileX, tileY);
        chunk.placePhysicalTile(material, tileX, tileY);
    }

    /*
        Method Name: deleteVisualTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Deletes the visual tile at a location
        Method Return: void
    */
    deleteVisualTile(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return; }

        // Check if the chunk has a physical tile there
        chunk.getVisualTiles().set(tileX, tileY, null);
    }

    /*
        Method Name: deletePhysicalTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Deletes the physical tile at a location
        Method Return: void
    */
    deletePhysicalTile(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return; }

        // Check if the chunk has a physical tile there
        chunk.getPhysicalTiles().set(tileX, tileY, null);
    }

    /*
        Method Name: hasVisualTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if there is a visual tile at a given location
        Method Return: boolean
    */
    hasVisualTileAtLocation(tileX, tileY){
        return this.getVisualTileAtLocation(tileX, tileY) != null;
    }

    /*
        Method Name: hasVisualTileCoveringLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if there is a visual tile at covering a given location
        Method Return: boolean
    */
    hasVisualTileCoveringLocation(tileX, tileY){
        return this.getVisualTileCoveringLocation(tileX, tileY) != null;
    }


    /*
        Method Name: hasPhysicalTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if there is a physical tile at a given location
        Method Return: boolean
    */
    hasPhysicalTileAtLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY) != null;
    }

    /*
        Method Name: hasPhysicalTileCoveringLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if there is a physical tile at a given location
        Method Return: boolean
    */
    hasPhysicalTileCoveringLocation(tileX, tileY){
        return this.hasPhysicalTileAtLocation(tileX, tileY);
    }


    /*
        Method Name: getVisualTileCoveringLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Finds a visual tile covering a given location
        Method Return: VisualTile / null
    */
    getVisualTileCoveringLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

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

    /*
        Method Name: getPhysicalTileCoveringLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets a physical tile at the location
        Method Return: PhysicalTile / null
    */
    getPhysicalTileCoveringLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY);
    }

    /*
        Method Name: getCreateChunkAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets or creates a chunk at the specified tile location
        Method Return: Chunk
    */
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

    /*
        Method Name: getChunkAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets a chunk at the specified tile location
        Method Return: Chunk
    */
    getChunkAtLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);
        return this.chunks.get(chunkX, chunkY);
    }

    /*
        Method Name: getChunks
        Method Parameters: None
        Method Description: Getter
        Method Return: NotSamSortedXYArray<Chunk>
    */
    getChunks(){
        return this.chunks;
    }

    /*
        Method Name: getPhysicalTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets a physical tile at the location
        Method Return: Physical Tile / null
        Method Note: This is only tiles naturally at location not just covering
    */
    getPhysicalTileAtLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return null; }

        // Check if the chunk has a physical tile there
        return chunk.getPhysicalTileAtLocation(tileX, tileY);
    }

    /*
        Method Name: getVisualTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets a visual tile at the location
        Method Return: VisualTile / null
        Method Note: This is only tiles naturally at location not just covering
    */
    getVisualTileAtLocation(tileX, tileY){
        let chunkX = Chunk.tileToChunkCoordinate(tileX);
        let chunkY = Chunk.tileToChunkCoordinate(tileY);

        let chunk = this.chunks.get(chunkX, chunkY);
        
        // If chunk doesn't exist
        if (chunk === null){ return null; }

        // Check if the chunk has a visual tile there
        return chunk.getVisualTileAtLocation(tileX, tileY);
    }

    /*
        Method Name: hasChunkAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if a chunk exists at the specified tile location
        Method Return: boolean
    */
    hasChunkAtLocation(tileX, tileY){
        return this.getChunkAtLocation(tileX, tileY) != null;
    }

    /*
        Method Name: getTileXAt
        Method Parameters: 
            x:
                An x coordinate
        Method Description: Converts an x coordinate to a tile x coordinate
        Method Return: int
    */
    static getTileXAt(x){
        return Math.floor(x / WTL_GAME_DATA["general"]["tile_size"]);
    }

    /*
        Method Name: getTileYAt
        Method Parameters: 
            y:
                A y coordinate
        Method Description: Converts a y coordinate to a tile y coordinate
        Method Return: int
    */
    static getTileYAt(y){
        return Math.floor(y / WTL_GAME_DATA["general"]["tile_size"]);
    }

    /*
        Method Name: getDisplayXFromTileX
        Method Parameters: 
            lX:
                Left x coordinate of the screen
            tileX:
                A tile x coordinate
        Method Description: Calculates the display x of a tile x
        Method Return: number
    */
    getDisplayXFromTileX(lX, tileX){
        return (this.getXOfTile(tileX) - lX) * gameZoom;
    }

    /*
        Method Name: getXOfTile
        Method Parameters: 
            tileX:
                A tile x coordinate
        Method Description: Gets a x coordinate from a tile x coordinate
        Method Return: int
    */
    getXOfTile(tileX){
        return tileX * WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getCenterXOfTile
        Method Parameters: 
            tileX:
                A tile x coordinate
        Method Description: Gets a x center coordinate from a tile x coordinate
        Method Return: int
    */
    getCenterXOfTile(tileX){
        return this.getXOfTile(tileX) + (WTL_GAME_DATA["general"]["tile_size"]-1)/2;
    }

    /*
        Method Name: getCenterYOfTile
        Method Parameters: 
            tileY:
                A tile y coordinate
        Method Description: Gets a y center coordinate from a tile y coordinate
        Method Return: int
    */
    getCenterYOfTile(tileY){
        return this.getYOfTile(tileY) - (WTL_GAME_DATA["general"]["tile_size"]-1)/2;
    }

    /*
        Method Name: getDisplayYFromTileY
        Method Parameters: 
            bY:
                The y coordinate of the bottom of the screen
            tileY:
                A tile y coordinate
        Method Description: Calculates a display y of a tile y coordinate
        Method Return: number
    */
    getDisplayYFromTileY(bY, tileY){
        return this.changeToScreenY((this.getYOfTile(tileY) - bY)*gameZoom);
    }

    /*
        Method Name: getYOfTile
        Method Parameters: 
            tileY:
                A tile y coordinate
        Method Description: Gets the y coordinate of a tile
        Method Return: int
    */
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

    /*
        Method Name: getDisplayXOfPoint
        Method Parameters: 
            x:
                An x coordinate
            lX:
                The left x of the screen
            round:
                Whether or not rounding should be performed
        Method Description: Gets the display x of a point
        Method Return: number
    */
    getDisplayXOfPoint(x, lX, round=false){
        return this.getDisplayX(x, 0, lX, round);
    }

    /*
        Method Name: getDisplayYOfPoint
        Method Parameters: 
            y:
                A y coordinate
            bY:
                The y coordinate of the bottom of the screen
            round:
                Whether or not rounding should be performed
        Method Description: Gets the display x of a point
        Method Return: number
    */
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

    /*
        Method Name: getLX
        Method Parameters: None
        Method Description: Gets the left x of the screen's left side
        Method Return: number
    */
    getLX(){
        let lX = 0;
        if (!this.hasEntityFocused()){
            lX = -1 * this.getWidth() / 2 / gameZoom;
        }else{
            lX = this.getFocusedEntity().getInterpolatedCenterX() - (this.getWidth()) / 2 / gameZoom;
        }
        return lX;
    }

    /*
        Method Name: getBY
        Method Parameters: None
        Method Description: Gets the bottom y of the screen's bottom
        Method Return: number
    */
    getBY(){
        let bY = 0;
        if (!this.hasEntityFocused()){
            bY = -1 * this.getWidth() / 2 / gameZoom;
        }else{
            bY = this.getFocusedEntity().getInterpolatedCenterY() - (this.getHeight()) / 2 / gameZoom;
        }
        return bY;
    }

    /*
        Method Name: displayTiles
        Method Parameters: 
            lX:
                The x of the left of the screen
            rX:
                The x of the right of the screen
            bY:
                The y of the bottom of the screen
            tY:
                The y of the top of the screen
        Method Description: Displays all tiles
        Method Return: void
    */
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

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the scene
        Method Return: void
    */
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

    /*
        Method Name: addExpiringVisual
        Method Parameters: 
            expiringVisual:
                A visual that will expire
        Method Description: Adds an expiring visual
        Method Return: void
    */
    addExpiringVisual(expiringVisual){
        this.expiringVisuals.push(expiringVisual);
    }


    /*
        Method Name: changeToScreenX
        Method Parameters: 
            x:
                An x coordinate
        Method Description: Converts an x value from the left=0 coordinate system to (the same one)
        Method Return: number
    */
    changeToScreenX(x){
        return x; // Doesn't need to be changed ATM
    }

    /*
        Method Name: changeToScreenY
        Method Parameters: 
            y:
                A y coordinate
        Method Description: Converts an x value from the bottom=0 coordinate system to the top=0 coordinate system
        Method Return: number
    */
    changeToScreenY(y){
        return this.getHeight() - y;
    }

    /*
        Method Name: changeFromScreenY
        Method Parameters: 
            y:
                A y coordinate
        Method Description: Converts an x value from the top=0 coordinate system to the bottom=0 coordinate system
        Method Return: number
    */
    changeFromScreenY(y){
        return this.changeToScreenY(y);
    }

    /*
        Method Name: addEntity
        Method Parameters: 
            entity:
                An entity
        Method Description: Adds an entity to the scene
        Method Return: void
    */
    addEntity(entity){
        if (entity.getID() === null){
            entity.setID(this.entities.getLength());
        } 
        this.entities.push(entity);
    }

    /*
        Method Name: displayPageBackground
        Method Parameters: None
        Method Description: Displays the page background
        Method Return: void
    */
    displayPageBackground(){
        drawingContext.drawImage(IMAGES["page_background"], 0, 0);
    }

    /*
        Method Name: getActivePhysicalTiles
        Method Parameters: None
        Method Description: Gets an active tile iterator
        Method Return: SceneActivePhysicalTileIterator
    */
    getActivePhysicalTiles(){
        return new SceneActivePhysicalTileIterator(this);
    }
}

/*
    Class Name: Chunk
    Class Description: A chunk of tiles
*/
class Chunk {
    /*
        Method Name: constructor
        Method Parameters: 
            scene:
                A WTLGameScene
            chunkX:
                A chunk x coordinate
            chunkY:
                A chunk y coordinate
        Method Description: constructor
        Method Return: constructor
    */
    constructor(scene, chunkX, chunkY){
        this.scene = scene;
        this.chunkX = chunkX;
        this.chunkY = chunkY;
        this.visualTiles = new NotSamXYSortedArrayList();
        this.physicalTiles = new NotSamXYSortedArrayList();
        this.recalculateBoundaries();
    }

    /*
        Method Name: getVisualTiles
        Method Parameters: None
        Method Description: Getter
        Method Return: NotSamXYSortedArrayList<VisualTile>
    */
    getVisualTiles(){
        return this.visualTiles;
    }

    /*
        Method Name: getPhysicalTiles
        Method Parameters: None
        Method Description: Getter
        Method Return: NotSamXYSortedArrayList<VisualTile>
    */
    getPhysicalTiles(){
        return this.physicalTiles;
    }

    /*
        Method Name: hasPhysicalTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if there is a physical tile at a given position
        Method Return: boolean
    */
    hasPhysicalTileAtLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY) != null;
    }

    /*
        Method Name: hasVisualTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y Checks if there is a visual tile at a given position
        Method Description: Checks if there is a visual tile at a location
        Method Return: boolean
    */
    hasVisualTileAtLocation(tileX, tileY){
        return this.getVisualTileAtLocation(tileX, tileY) != null;
    }

    /*
        Method Name: getVisualTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets the visual tile at a position
        Method Return: VisualTile / null
    */
    getVisualTileAtLocation(tileX, tileY){
        return this.visualTiles.get(tileX, tileY);
    }

    /*
        Method Name: getPhysicalTileAtLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets the physical tile at a position
        Method Return: PhysicalTile / null
    */
    getPhysicalTileAtLocation(tileX, tileY){
        return this.physicalTiles.get(tileX, tileY);
    }

    /*
        Method Name: getVisualTileCoveringLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: finds a visual tile covering a given location
        Method Return: VisualTile / null
    */
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

    /*
        Method Name: getPhysicalTileCoveringLocation
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets the physical tile at a position
        Method Return: PhysicalTile / null
    */
    getPhysicalTileCoveringLocation(tileX, tileY){
        return this.getPhysicalTileAtLocation(tileX, tileY);
    }

    /*
        Method Name: displayVisualTiles
        Method Parameters: 
            lX:
                The x of the left of the screen
            rX:
                The x of the right of the screen
            bY:
                The y of the bottom of the screen
            tY:
                The y of the top of the screen
        Method Description: Displays visual tiles in a chunk
        Method Return: void
    */
    displayVisualTiles(lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        // Display all tiles
        for (let [tile, tileX, tileY] of this.visualTiles){
            if (tile === null){ continue; }
            tile.display(lX, rX, bY, tY);
        }
    }

    /*
        Method Name: displayPhysicalTiles
        Method Parameters: 
            lX:
                The x of the left of the screen
            rX:
                The x of the right of the screen
            bY:
                The y of the bottom of the screen
            tY:
                The y of the top of the screen
        Method Description: Displays physical tiles in a chunk
        Method Return: void
    */
    displayPhysicalTiles(lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        // Display all tiles
        for (let [tile, tileX, tileY] of this.physicalTiles){
            if (tile === null){ continue; }
            tile.display(lX, rX, bY, tY);
        }
    }

    /*
        Method Name: touchesRegion
        Method Parameters: 
            lX:
                The x of the left of the screen
            rX:
                The x of the right of the screen
            bY:
                The y of the bottom of the screen
            tY:
                The y of the top of the screen
        Method Description: Checks if a chunk touches a given region
        Method Return: boolean
    */
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

    /*
        Method Name: getLeftX
        Method Parameters: None
        Method Description: Gets the left tile x of the chunk
        Method Return: int
    */
    getLeftX(){
        return this.leftX;
    }

    /*
        Method Name: getRightX
        Method Parameters: None
        Method Description: Gets the right tile x of the chunk
        Method Return: int
        Method Note: Be careful if you have a 5000 long tile in bottom right it will extend this right
    */
    getRightX(){
        return this.rightX;
    }

    /*
        Method Name: getTopY
        Method Parameters: None
        Method Description: Gets the top tile y of the chunk
        Method Return: int
    */
    getTopY(){
        return this.topY;
    }

    /*
        Method Name: getBottomY
        Method Parameters: None
        Method Description: Gets the bottom tile y of the chunk
        Method Return: int
        Method Note: Be careful if you have a 5000 long tile in bottom right it will extend this down
    */
    getBottomY(){
        return this.bottomY;
    }

    /*
        Method Name: recalculateBoundaries
        Method Parameters: None
        Method Description: Recalculates the chunk boundaries
        Method Return: void
    */
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

    /*
        Method Name: getNaturalLeftX
        Method Parameters: 
            chunkX:
                Chunk x coordinate
        Method Description: Determine the natural left x coordinate of a chunk
        Method Return: int
    */
    static getNaturalLeftX(chunkX){
        return chunkX * WTL_GAME_DATA["general"]["chunk_size"]
    }

    /*
        Method Name: getNaturalLeftX
        Method Parameters: None
        Method Description: Determine the natural left x coordinate of a chunk
        Method Return: int
    */
    getNaturalLeftX(){
        return this.getLeftX();
    }

    /*
        Method Name: getNaturalRightX
        Method Parameters: 
            chunkX:
                Chunk x coordinate
        Method Description: Determine the natural right x coordinate of a chunk
        Method Return: int
    */
    static getNaturalRightX(chunkX){
        return (chunkX + 1) * WTL_GAME_DATA["general"]["chunk_size"] - 1;
    }

    /*
        Method Name: getNaturalRightX
        Method Parameters: None
        Method Description: Determine the natural right x coordinate of the chunk
        Method Return: int
    */
    getNaturalRightX(){
        return Chunk.getNaturalRightX(this.chunkX);
    }

    /*
        Method Name: getNaturalTopY
        Method Parameters: 
            chunkY:
                Chunk y coordinate
        Method Description: Determine the natural top y coordinate of a chunk
        Method Return: int
    */
    static getNaturalTopY(chunkY){
        return (chunkY + 1) * WTL_GAME_DATA["general"]["chunk_size"] - 1;
    }

    /*
        Method Name: getNaturalTopY
        Method Parameters: None
        Method Description: Determine the natural top y coordinate of the chunk
        Method Return: int
    */
    getNaturalTopY(){
        return this.getTopY();
    }

    /*
        Method Name: getNaturalBottomY
        Method Parameters: 
            chunkY:
                Chunk y coordinate
        Method Description: Determine the natural bottom y coordinate of a chunk
        Method Return: int
    */
    static getNaturalBottomY(chunkY){
        return chunkY * WTL_GAME_DATA["general"]["chunk_size"];
    }

    /*
        Method Name: getNaturalBottomY
        Method Parameters: None
        Method Description: Determine the natural bottom y coordinate of the chunk
        Method Return: int
    */
    getNaturalBottomY(){
        return Chunk.getNaturalBottomY(this.chunkY);
    }

    /*
        Method Name: covers
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Check if the chunk covers the given tile coordinate set
        Method Return: boolean
    */
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

    /*
        Method Name: coversNaturally
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Check if the chunk naturally covers the given tile coordinate set
        Method Return: boolean
    */
    coversNaturally(tileX, tileY){
        return Chunk.tileToChunkCoordinate(tileX) === this.chunkX && Chunk.tileToChunkCoordinate(tileY) === this.chunkY;
    }

    /*
        Method Name: outsideTileRegion
        Method Parameters: 
            leftTileX:
                The left tile in a region
            rightTileX:
                The right tile in a region
            bottomTileY:
                The bottom tile in a region
            topTileY:
                The top tile in a region
        Method Description: Checks if the chunk is outside a region
        Method Return: boolean
    */
    outsideTileRegion(leftTileX, rightTileX, bottomTileY, topTileY){
        if (this.chunkX < Chunk.tileToChunkCoordinate(leftTileX)){ return true; }
        if (this.chunkX > Chunk.tileToChunkCoordinate(rightTileX)){ return true; }
        if (this.chunkY < Chunk.tileToChunkCoordinate(bottomTileY)){ return true; }
        if (this.chunkY > Chunk.tileToChunkCoordinate(topTileY)){ return true; }
        return false;
    }

    /*
        Method Name: placeVisualTile
        Method Parameters: 
            material:
                A material JSON
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Places a visual tile
        Method Return: void
    */
    placeVisualTile(material, tileX, tileY){
        let tile = this.getVisualTileCoveringLocation(tileX, tileY);
        // If tile doesn't exist, add it
        if (!tile){
            tile = new VisualTile(this.scene, this, material, tileX, tileY);
            this.visualTiles.set(tileX, tileY, tile);
        }
        // If same tile do nothing
        else if (tile.getMaterialName() === material["name"]){
            return;
        }
        // Else if the tile exists but has a different material then change
        else if (tile.getTileX() === tileX && tile.getTileY() === tileY && tile.getMaterialName() != material["name"]){
            tile.changeMaterial(material);
        }else{
            tile.delete();
            tile = new VisualTile(this.scene, this, material, tileX, tileY);
            this.visualTiles.set(tileX, tileY, tile);
        }
        this.recalculateBoundaries();
    }

    /*
        Method Name: placePhysicalTile
        Method Parameters: 
            material:
                A material JSON
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Places a physical tile
        Method Return: void
    */
    placePhysicalTile(material, tileX, tileY){
        let tile = this.getPhysicalTileCoveringLocation(tileX, tileY);
        // If tile doesn't exist, add it
        if (!tile){
            tile = new PhysicalTile(this.scene, this, material, tileX, tileY);
            this.physicalTiles.set(tileX, tileY, tile);
        }
        // Else if the tile exists but has a different material then change
        else if (tile.getTileX() === tileX && tile.getTileY() === tileY && tile.getMaterialName() != material["name"]){
            tile.changeMaterial(material);
        }else{
            tile.delete();
            tile = new PhysicalTile(this.scene, this, material, tileX, tileY);
            this.physicalTiles.set(tileX, tileY, tile);
        }
    }

    /*
        Method Name: deleteVisualTile
        Method Parameters: 
            tile:
                A visual tile being deleted
        Method Description: Deletes a visual tile
        Method Return: void
    */
    deleteVisualTile(tile){
        let tX = tile.getTileX();
        let tY = tile.getTileY();
        // Find and delete the specified tile
        this.visualTiles.set(tX, tY, null);
        this.recalculateBoundaries();
    }

    /*
        Method Name: deletePhysicalTile
        Method Parameters: 
            tile:
                A physical tile being deleted
        Method Description: Deletes a physical tile
        Method Return: void
    */
    deletePhysicalTile(tile){
        let tX = tile.getTileX();
        let tY = tile.getTileY();
        // Find and delete the specified tile
        this.physicalTiles.set(tX, tY, null);
    }

    /*
        Method Name: deletePhysicalTileAt
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Deletes a physical tile at a given location
        Method Return: void
    */
    deletePhysicalTileAt(tileX, tileY){
        this.physicalTiles.set(tileX, tileY, null);
    }

    /*
        Method Name: deleteVisualTileAt
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Deletes a visual tile at a given location
        Method Return: void
    */
    deleteVisualTileAt(tileX, tileY){
        this.visualTiles.set(tileX, tileY, null);
        this.recalculateBoundaries();
    }

    /*
        Method Name: tileToChunkCoordinate
        Method Parameters: 
            tileCoordinate:
                A tile coordinate x or y
        Method Description: Converts a tile coordinate to a chunk coordinate
        Method Return: int
    */
    static tileToChunkCoordinate(tileCoordinate){
        return Math.floor(tileCoordinate / WTL_GAME_DATA["general"]["chunk_size"]);
    }

    /*
        Method Name: getRightTileXOfChunk
        Method Parameters: 
            chunkX:
                Chunk x coordinate
        Method Description: Gets the right tile x covered by a chunk (naturally)
        Method Return: int
    */
    static getRightTileXOfChunk(chunkX){
        return ((chunkX+1) * WTL_GAME_DATA["general"]["chunk_size"] - 1);
    }

    /*
        Method Name: getLeftTileXOfChunk
        Method Parameters: 
            chunkX:
                Chunk x coordinate
        Method Description: Gets the left tile x covered by a chunk
        Method Return: int
    */
    static getLeftTileXOfChunk(chunkX){
        return chunkX * WTL_GAME_DATA["general"]["chunk_size"];
    }

    /*
        Method Name: getTopTileYOfChunk
        Method Parameters: 
            chunkY:
                Chunk y coordinate
        Method Description: Gets the top tile y covered by a chunk
        Method Return: int
    */
    static getTopTileYOfChunk(chunkY){
        return ((chunkY+1) * WTL_GAME_DATA["general"]["chunk_size"] - 1);
    }

    /*
        Method Name: getBottomTileYOfChunk
        Method Parameters: 
            chunkY:
                Chunk y coordinate
        Method Description: Gets the bottom tile y covered by a chunk (naturally)
        Method Return: int
    */
    static getBottomTileYOfChunk(chunkY){
        return chunkY * WTL_GAME_DATA["general"]["chunk_size"];
    }
}

/*
    Class Name: SceneActivePhysicalTileIterator
    Class Description: An iterator for active scene tiles
*/
class SceneActivePhysicalTileIterator {
    /*
        Method Name: constructor
        Method Parameters: 
            scene:
                A scene
        Method Description: constructor
        Method Return: constructor
    */
    constructor(scene){
        this.scene = scene;
    }

    /*
        Method Name: iterator
        Method Parameters: None
        Method Description: Iterates through non-null physical tiles
        Method Return: yields [physicalTile, tileX, tileY]
    */
    *[Symbol.iterator](){
        let chunks = this.scene.getChunks();
        for (let [chunk, chunkX, chunkY] of chunks){
            if (chunk === null){ continue; }
            for (let [physicalTile, tileX, tileY] of chunk.getPhysicalTiles()){
                if (physicalTile === null){ continue; }
                yield [physicalTile, tileX, tileY];
            }
        }
    }
}