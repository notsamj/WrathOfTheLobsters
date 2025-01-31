class Tile extends VisualItem {
    constructor(scene, chunk, material, tileX, tileY){
        super(scene, IMAGES[material["name"]].width, IMAGES[material["name"]].height);
        this.scene = scene;
        this.chunk = chunk;
        this.material = material;
        this.tileX = tileX;
        this.tileY = tileY;
    }

    getX(){
        return this.tileX * WTL_GAME_DATA["general"]["tile_size"];
    }

    getY(){
        return this.tileY * WTL_GAME_DATA["general"]["tile_size"];
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
        return this.tileX + (this.width / WTL_GAME_DATA["general"]["tile_size"] - 1);
    }

    getTopY(){
        return this.tileY;
    }

    getBottomY(){
        return this.tileY - (this.height / WTL_GAME_DATA["general"]["tile_size"] - 1);
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
        //console.log("Displaying2", this)
        // Note: Since we are just flooring x anyway to display use a floor of lX
        lX = Math.floor(lX);
        bY = Math.floor(bY); // This works too?
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let x = this.scene.getDisplayXFromTileX(lX, this.tileX);
        let y = this.scene.getDisplayYFromTileY(bY, this.tileY);
        let floorX = Math.floor(x);
        let floorY = Math.floor(y);
        //console.log("Displaying @", x, y, this.getImage())
        translate(floorX, floorY);
        // Game zoom
        scale(gameZoom, gameZoom);
        drawingContext.drawImage(this.getImage(), 0, 0);
        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);
        translate(-1 * floorX, -1 * floorY);
    }

    covers(tileX, tileY){
        return this.getLeftX() <= tileX && this.getRightX() >= tileX && this.getBottomY() <= tileY && this.getTopY() >= tileY;
    }

    touchesRegion(lX, rX, bY, tY){
        let lTileX = WTLGameScene.getTileXAt(lX);
        let rTileX = WTLGameScene.getTileXAt(rX);
        if (this.getRightX() < lTileX || this.getLeftX() > rTileX){ return false; }
        let bTileY = WTLGameScene.getTileYAt(bY);
        let tTileY = WTLGameScene.getTileYAt(tY);
        if (this.getTopY() < bTileY || this.getBottomY() > tTileY){ return false; }
        return true;
    }

    deleteIfNotNatural(tileX, tileY){
        // If this tile's top left isn't in the same chunk at the given tile location then delete this tile
        if (Chunk.tileToChunkCoordinate(tileX) != Chunk.tileToChunkCoordinate(this.tileX) || Chunk.tileToChunkCoordinate(tileY) != Chunk.tileToChunkCoordinate(this.tileY)){
            this.delete();
        }
    }

    // Abstract delete
}

class VisualTile extends Tile {
    delete(){
        this.chunk.deleteVisualTile(this);
    }

    getTileWidth(){
        return Math.ceil(this.width / WTL_GAME_DATA["general"]["tile_size"]);
    }

    getTileHeight(){
        return Math.ceil(this.height / WTL_GAME_DATA["general"]["tile_size"]);
    }
}

class PhysicalTile extends Tile {
    delete(){
        this.chunk.deletePhysicalTile(this);
    }

    hasAttribute(attribute){
        for (let physicalTile of WTL_GAME_DATA["physical_tiles"]){
            if (physicalTile["name"] === this.getMaterialName()){
                for (let foundAttribute of physicalTile["attributes"]){
                    if (foundAttribute === attribute){
                        return true;
                    }
                }
                return false;
            }
        }
        return false;
    }
}