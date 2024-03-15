class RetroGameScene {
    constructor(){
        this.objects = [];
        this.entities = new NotSamLinkedList();
        this.focusedEntity = null;
        this.chunks = new NotSamLinkedList();
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

        // Load tiles
        for (let tile of tileJSON["tiles"]){
            let material = null;
            // Note: Assuming material exists
            for (let materialObject of tileJSON["materials"]){
                if (materialObject["name"] == tile["material"]){
                    material = materialObject;
                    break;
                }
            }
            this.placeMaterial(material, tile["tile_x"], tile["tile_y"]);
        }
    }

    toTileJSON(){
        let tileJSON = {};
        tileJSON["materials"] = [];
        tileJSON["tiles"] = [];
        for (let [chunk, cI] of this.chunks){
            for (let [tile, tI] of chunk.getTiles()){
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
                tileJSON["tiles"].push(individualTileJSON);
            }
        }
        console.log("TileJSON", tileJSON)
        return tileJSON;
    }

    getMaterialImage(materialName){
        return IMAGES[materialName];
    }

    getMaterialXTileSize(materialName){
        return this.getMaterialImage(materialName).width / PROGRAM_SETTINGS["general"]["tile_size"];
    }

    getMaterialYTileSize(materialName){
        return this.getMaterialImage(materialName).height / PROGRAM_SETTINGS["general"]["tile_size"];
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
        // Tick the entities
        for (let [entity, itemIndex] of this.entities){
            entity.tick(timeMS);
        }
    }

    placeMaterial(material, tileX, tileY){
        // Delete all other tiles that are covered by region
        let materialXTileSize = this.getMaterialXTileSize(material["name"]);
        let materialYTileSize = this.getMaterialYTileSize(material["name"]);
        for (let dTileX = tileX; dTileX < tileX + materialXTileSize; dTileX++){
            for (let dTileY = tileY; dTileY > tileY - materialYTileSize; dTileY--){
                this.deleteMaterial(dTileX, dTileY);
            }
        }

        // Place tile
        let chunk = this.getCreateChunkAtLocation(tileX, tileY);
        chunk.placeMaterial(material, tileX, tileY);
    }

    deleteMaterial(tileX, tileY){
        if (this.hasTileOnLocation(tileX, tileY)){
            this.getTileAtLocation(tileX, tileY).delete();
        }
    }

    hasTileOnLocation(tileX, tileY){
        return this.getTileAtLocation(tileX, tileY) != null;
    }

    getCreateChunkAtLocation(tileX, tileY){
        let existingChunk = this.getChunkAtLocation(tileX, tileY);
        // Create if not existing
        if (existingChunk == null){
            existingChunk = new Chunk(Chunk.tileToChunkCoordinate(tileX), Chunk.tileToChunkCoordinate(tileY));
            this.chunks.push(existingChunk);
        }
        return existingChunk;
    }

    getChunkAtLocation(tileX, tileY){
        for (let [chunk, chunkIndex] of this.chunks){
            if (chunk.coversNaturally(tileX, tileY)){
                return chunk;
            }
        }
        return null;
    }

    getTileAtLocation(tileX, tileY){
        for (let [chunk, chunkIndex] of this.chunks){
            if (chunk.covers(tileX, tileY)){
                return chunk.getTileAtLocation(tileX, tileY);
            }
        }
        return null;
    }

    hasChunkAtLocation(tileX, tileY){
        return this.getChunkAtLocation(tileX, tileY) != null;
    }

    static getTileXAt(x){
        return Math.floor(x / PROGRAM_SETTINGS["general"]["tile_size"]);
    }

    static getTileYAt(y){
        return Math.floor(y / PROGRAM_SETTINGS["general"]["tile_size"]);
    }

    getDisplayXFromTileX(lX, tileX){
        return tileX * PROGRAM_SETTINGS["general"]["tile_size"] - lX;
    }

    getXOfTile(tileX){
        return tileX * PROGRAM_SETTINGS["general"]["tile_size"];
    }

    getDisplayYFromTileY(bY, tileY){
        return this.changeToScreenY((tileY+1) * PROGRAM_SETTINGS["general"]["tile_size"] - bY);
    }

    getYOfTile(tileY){
        return (tileY+1) * PROGRAM_SETTINGS["general"]["tile_size"];
    }

    getDisplayX(centerX, width, lX){
        // Change coordinate system
        let displayX = this.changeToScreenX(centerX);

        // Find relative to bottom left corner
        displayX = displayX - lX;

        // Find top left corner
        displayX = displayX - width / 2;

        // Round down to nearest pixel
        displayX = Math.floor(displayX);
        return displayX;
    }

    getDisplayY(centerY, height, bY){
        // Change coordinate system
        let displayY = this.changeToScreenY(centerY);

        // Find relative to bottom left corner
        displayY = displayY + bY;

        // Find top left corner
        displayY = displayY - height / 2;

        // Round down to nearest pixel
        displayY = Math.floor(displayY);
        return displayY;
    }

    getLX(){
        let lX = 0;
        if (!this.hasEntityFocused()){
            lX = -1 * this.getWidth() / 2;
        }else{
            lX = this.getFocusedEntity().getInterpolatedCenterX() - (this.getWidth()) / 2;
        }
        return lX;
    }

    getBY(){
        let bY = 0;
        if (!this.hasEntityFocused()){
            bY = -1 * this.getWidth() / 2;
        }else{
            bY = this.getFocusedEntity().getInterpolatedCenterY() - (this.getHeight()) / 2;
        }
        return bY;
    }

    display(){
        let lX = this.getLX(); // Bottom left x
        let bY = this.getBY(); // Bottom left y

        let rX = lX + this.getWidth();
        let tY = bY + this.getHeight();

        // Display Page Background
        this.displayPageBackground();

        // Display Tiles
        for (let [chunk, cI] of this.chunks){
            chunk.display(lX, rX, bY, tY);
        }

        // Display Entities
        for (let [entity, eI] of this.entities){
            if (this.hasEntityFocused() && entity.getID() == this.focusedEntity.getID()){ continue; }
            entity.display(lX, rX, bY, tY);
        }

        // Display focused entity
        if (this.hasEntityFocused()){
            this.getFocusedEntity().display(lX, rX, bY, tY);
        }
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

    getDisplayX(centerX, width, lX){
        // Change coordinate system
        let displayX = this.changeToScreenX(centerX);

        // Find relative to bottom left corner
        displayX = displayX - lX;

        // Find top left corner
        displayX = displayX - width / 2;

        // Round to nearest pixel
        displayX = Math.round(displayX);
        return displayX;
    }

    getDisplayY(centerY, height, bY){
        // Change coordinate system
        let displayY = this.changeToScreenY(centerY);

        // Find relative to bottom left corner
        displayY = displayY + bY;

        // Find top left corner
        displayY = displayY - height / 2;

        // Round to nearest pixel
        displayY = Math.round(displayY);
        return displayY;
    }

    addEntity(entity){
        entity.setID(this.entities.getLength());
        this.entities.push(entity);
    }

    displayPageBackground(){
        drawingContext.drawImage(IMAGES["page_background"], 0, 0); // TODO: This should be variable in the future
    }
}

class Chunk {
    constructor(chunkX, chunkY){
        this.chunkX = chunkX;
        this.chunkY = chunkY;
        this.tiles = new NotSamLinkedList();
    }

    getTiles(){
        return this.tiles;
    }

    hasTile(tileX, tileY){
        return this.getTile(tileX, tileY) != null;
    }

    getTile(tileX, tileY){
        for (let [tile, tileI] of this.tiles){
            if (tile.getTileX() == tileX && tile.getTileY() == tileY){
                return tile;
            }
        }
        return null;
    }

    getTileCovering(tileX, tileY){
        for (let [tile, tileI] of this.tiles){
            if (tile.covers(tileX, tileY)){
                return tile;
            }
        }
        return null;
    }

    display(lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        // Display all tiles
        for (let [tile, tileI] of this.tiles){
            tile.display(lX, rX, bY, tY);
        }
    }

    touchesRegion(lX, rX, bY, tY){
        let lChunkX = Chunk.tileToChunkCoordinate(RetroGameScene.getTileXAt(lX));
        let rChunkX = Chunk.tileToChunkCoordinate(RetroGameScene.getTileXAt(rX));
        if (this.chunkX < lChunkX || this.chunkX > rChunkX){ return false; }
        let bChunkY = Chunk.tileToChunkCoordinate(RetroGameScene.getTileYAt(bY));
        let tChunkY = Chunk.tileToChunkCoordinate(RetroGameScene.getTileYAt(tY));
        if (this.chunkY < bChunkY || this.chunkY > tChunkY){ return false; }
        return true;
    }

    getLeftX(){
        let leftX = this.chunkX * PROGRAM_SETTINGS["general"]["chunk_size"];
        return leftX;
    }

    getRightX(){
        let rightX = (this.chunkX + 1) * PROGRAM_SETTINGS["general"]["chunk_size"] - 1;
        for (let [tile, tI] of this.tiles){
            let tileRightX = tile.getRightX();
            if (tileRightX > rightX){
                rightX = tileRightX;
            }
        }
        return rightX;
    }

    getTopY(){
        let topY = (this.chunkY + 1) * PROGRAM_SETTINGS["general"]["chunk_size"] - 1;
        return topY;
    }

    getBottomY(){
        let bottomY = this.chunkY * PROGRAM_SETTINGS["general"]["chunk_size"];
        for (let [tile, tI] of this.tiles){
            let tileBottomY = tile.getLeftX();
            if (tileBottomY < bottomY){
                bottomY = tileBottomY;
            }
        }
        return bottomY;
    }

    covers(tileX, tileY){
        let chunkLeftX = this.getLeftX();
        let chunkRightX = this.getRightX();
        let chunkTopY = this.getTopY();
        let chunkBottomY = this.getBottomY();
        return tileX >= chunkLeftX && tileX <= chunkRightX && tileY >= chunkBottomY && tileY <= chunkTopY;
    }

    coversNaturally(tileX, tileY){
        return Chunk.tileToChunkCoordinate(tileX) == this.chunkX && Chunk.tileToChunkCoordinate(tileY) == this.chunkY;
    }

    placeMaterial(material, tileX, tileY){
        let tile = this.getTileCovering(tileX, tileY);
        // If tile doesn't exist, add it
        if (!tile){
            tile = new Tile(SCENE, this, material, tileX, tileY);
            this.tiles.push(tile);
        }
        // Else if the tile exists but has a different material then change
        else if (tile.getTileX() == tileX && tile.getTileY() == tileY && tile.getMaterialName() != material["name"]){
            tile.changeMaterial(material);
        }else{
            tile.delete();
            tile = new Tile(SCENE, this, material, tileX, tileY);
            this.tiles.push(tile);
        }
    }

    getTileAtLocation(tileX, tileY){
        for (let [tile, tileI] of this.tiles){
            if (tile.covers(tileX, tileY)){
                return tile;
            }
        }
        return null;
    }

    delete(tile){
        let tX = tile.getTileX();
        let tY = tile.getTileY();
        // Find and delete the specified tile
        this.tiles.deleteWithCondition((tileToDelete) => {
            return tileToDelete.getTileX() == tX && tileToDelete.getTileY() == tY;
        });
    }

    hasNativeTiles(){
        return this.tiles.isEmpty();
    }

    static tileToChunkCoordinate(coordinate){
        return Math.floor(coordinate / PROGRAM_SETTINGS["general"]["chunk_size"]);
    }
}

async function loadLocalImage(url){
    let newImage = null;
    let wait = new Promise(function(resolve, reject){
        newImage = new Image();
        newImage.onload = function(){
            resolve();
        }
        newImage.onerror = function(){
            reject();
        }
        newImage.src = url;
    });
    await wait;
    return newImage;
}

async function loadToImages(imageName, folderPrefix="", type=".png"){
    IMAGES[imageName] = await loadLocalImage("images/" + folderPrefix + imageName + type);
}