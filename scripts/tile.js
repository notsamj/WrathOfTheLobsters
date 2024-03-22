class Tile extends VisualItem {
    constructor(scene, chunk, material, tileX, tileY){
        super(scene, IMAGES[material["name"]].width, IMAGES[material["name"]].height);
        this.chunk = chunk;
        this.material = material;
        this.tileX = tileX;
        this.tileY = tileY;
    }

    getX(){
        return this.tileX * PROGRAM_SETTINGS["general"]["tile_size"];
    }

    getY(){
        return this.tileY * PROGRAM_SETTINGS["general"]["tile_size"];
    }

    getTileX(){
        return this.tileX;
    }

    getTileY(){
        return this.tileY;
    }

    getLeftX(){
        return this.tileX;
    }

    getRightX(){
        return this.tileX + (this.width / PROGRAM_SETTINGS["general"]["tile_size"] - 1);
    }

    getTopY(){
        return this.tileY;
    }

    getBottomY(){
        return this.tileY - (this.height / PROGRAM_SETTINGS["general"]["tile_size"] - 1);
    }

    getImage(){
        return IMAGES[this.material["name"]];
    }

    changeMaterial(material){
        this.material = material;
        this.width = IMAGES[material["name"]].width;
        this.height = IMAGES[material["name"]].height;
    }

    getMaterial(){
        return this.material;
    }

    getMaterialName(){
        return this.getMaterial()["name"];
    }

    display(lX, rX, bY, tY){
        // Note: Since we are just flooring x anyway to display use a floor of lX
        lX = Math.floor(lX);
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let x = SCENE.getDisplayXFromTileX(lX, this.tileX);
        let y = SCENE.getDisplayYFromTileY(bY, this.tileY);
        let floorX = Math.floor(x);
        let floorX1 = Math.floor(SCENE.getDisplayXFromTileX(lX, this.tileX+1));
        if (floorX1 - floorX != 64){
            console.log(x, lX, floorX, floorX1);
        }
        drawingContext.drawImage(this.getImage(), Math.floor(x), Math.floor(y));
    }

    covers(tileX, tileY){
        return this.getLeftX() <= tileX && this.getRightX() >= tileX && this.getBottomY() <= tileY && this.getTopY() >= tileY;
    }

    touchesRegion(lX, rX, bY, tY){
        let lTileX = RetroGameScene.getTileXAt(lX);
        let rTileX = RetroGameScene.getTileXAt(rX);
        if (this.getRightX() < lTileX || this.getLeftX() > rTileX){ return false; }
        let bTileY = RetroGameScene.getTileYAt(bY);
        let tTileY = RetroGameScene.getTileYAt(tY);
        if (this.getTopY() < bTileY || this.getBottomY() > tTileY){ return false; }
        return true;
    }

    deleteIfNotNatural(tileX, tileY){
        // If this tile's top left isn't in the same chunk at the given tile location then delete this tile
        if (Chunk.tileToChunkCoordinate(tileX) != Chunk.tileToChunkCoordinate(this.tileX) || Chunk.tileToChunkCoordinate(tileY) != Chunk.tileToChunkCoordinate(this.tileY)){
            this.delete();
        }
    }

    delete(){
        this.chunk.delete(this);
    }
}