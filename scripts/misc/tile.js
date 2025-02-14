/*
    Class Name: Tile
    Class Description: A tile in the world
*/
class Tile extends VisualItem {
    /*
        Method Name: constructor
        Method Parameters: 
            scene:
                The related scene
            chunk:
                The containing chunk
            material:
                The material of the tile (JSON object)
            tileX:
                The tile x location (int)
            tileY:
                The tile y location (int)
        Method Description: constructor
        Method Return: constructor
    */
    constructor(scene, chunk, material, tileX, tileY){
        super(IMAGES[material["name"]].width, IMAGES[material["name"]].height);
        this.scene = scene;
        this.chunk = chunk;
        this.material = material;
        this.tileX = tileX;
        this.tileY = tileY;
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Calculates the x location of the tile
        Method Return: int
    */
    getX(){
        return this.tileX * WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Calculates the y location of the tile
        Method Return: int
    */
    getY(){
        return this.tileY * WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getTileX
        Method Parameters: None
        Method Description: Gets the tile x location of the tile
        Method Return: int
    */
    getTileX(){
        return this.tileX;
    }

    /*
        Method Name: getTileY
        Method Parameters: None
        Method Description: Gets the tile y location of the tile
        Method Return: TODO
    */
    getTileY(){
        return this.tileY;
    }

    /*
        Method Name: getLeftX
        Method Parameters: None
        Method Description: Gets the left tile x location of the tile
        Method Return: int
    */
    getLeftX(){
        return this.tileX;
    }

    /*
        Method Name: getRightX
        Method Parameters: None
        Method Description: Gets the right tile x location of the tile (if its bigger than 1 standard tile size)
        Method Return: int
    */
    getRightX(){
        return this.tileX + (this.width / WTL_GAME_DATA["general"]["tile_size"] - 1);
    }

    /*
        Method Name: getTopY
        Method Parameters: None
        Method Description: Gets the top tile y location of the tile
        Method Return: int
    */
    getTopY(){
        return this.tileY;
    }

    /*
        Method Name: getBottomY
        Method Parameters: None
        Method Description: Gets the bottom tile y location of the tile (if its bigger than 1 standard tile size)
        Method Return: int
    */
    getBottomY(){
        return this.tileY - (this.height / WTL_GAME_DATA["general"]["tile_size"] - 1);
    }

    /*
        Method Name: getImage
        Method Parameters: None
        Method Description: Gets the tile image
        Method Return: Image
    */
    getImage(){
        return IMAGES[this.material["name"]];
    }

    /*
        Method Name: changeMaterial
        Method Parameters: 
            material:
                Material name string
        Method Description: Changes the material
        Method Return: void
    */
    changeMaterial(material){
        this.material = material;
        this.width = IMAGES[material["name"]].width;
        this.height = IMAGES[material["name"]].height;
    }

    /*
        Method Name: getMaterial
        Method Parameters: None
        Method Description: Getter
        Method Return: JSON
    */
    getMaterial(){
        return this.material;
    }

    /*
        Method Name: getMaterialName
        Method Parameters: None
        Method Description: Gets the material name
        Method Return: string
    */
    getMaterialName(){
        return this.getMaterial()["name"];
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x of the left of the screen
            rX:
                The x of the right of the screen
            bY:
                The y of the bottom of the screen
            tY:
                The y of the top of the screen
        Method Description: Displays the tile on the screen
        Method Return: void
    */
    display(lX, rX, bY, tY){
        // Note: Since we are just flooring x anyway to display use a floor of lX
        lX = Math.floor(lX);
        bY = Math.floor(bY); // This works too?
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let x = this.scene.getDisplayXFromTileX(lX, this.tileX);
        let y = this.scene.getDisplayYFromTileY(bY, this.tileY);
        let floorX = Math.floor(x);
        let floorY = Math.floor(y);
        translate(floorX, floorY);
        // Game zoom
        scale(gameZoom, gameZoom);
        drawingContext.drawImage(this.getImage(), 0, 0);
        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);
        translate(-1 * floorX, -1 * floorY);
    }

    /*
        Method Name: covers
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if the tile covers a given coordinate set
        Method Return: boolean
    */
    covers(tileX, tileY){
        return this.getLeftX() <= tileX && this.getRightX() >= tileX && this.getBottomY() <= tileY && this.getTopY() >= tileY;
    }

    /*
        Method Name: touchesRegion
        Method Parameters: 
            lX:
                The x of the left of the region
            rX:
                The x of the right of the region
            bY:
                The y of the bottom of the region
            tY:
                The y of the top of the region
        Method Description: Checks if the tile touches a region
        Method Return: boolean
    */
    touchesRegion(lX, rX, bY, tY){
        let lTileX = WTLGameScene.getTileXAt(lX);
        let rTileX = WTLGameScene.getTileXAt(rX);
        if (this.getRightX() < lTileX || this.getLeftX() > rTileX){ return false; }
        let bTileY = WTLGameScene.getTileYAt(bY);
        let tTileY = WTLGameScene.getTileYAt(tY);
        if (this.getTopY() < bTileY || this.getBottomY() > tTileY){ return false; }
        return true;
    }

    /*
        Method Name: deleteIfNotNatural
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Deletes this tile if it is not in the same chunk as the specified coordinate set
        Method Return: void
    */
    deleteIfNotNatural(tileX, tileY){
        // If this tile's top left isn't in the same chunk at the given tile location then delete this tile
        if (Chunk.tileToChunkCoordinate(tileX) != Chunk.tileToChunkCoordinate(this.tileX) || Chunk.tileToChunkCoordinate(tileY) != Chunk.tileToChunkCoordinate(this.tileY)){
            this.delete();
        }
    }

    /*
        Method Name: delete
        Method Parameters: None
        Method Description: abstract
        Method Return: void
    */
    delete(){ throw new Error("Expected to be implemented");}
}

/*
    Class Name: VisualTile
    Class Description: A visual tile in the world
*/
class VisualTile extends Tile {
    /*
        Method Name: delete
        Method Parameters: None
        Method Description: Deletes this tile
        Method Return: void
    */
    delete(){
        this.chunk.deleteVisualTile(this);
    }

    /*
        Method Name: getTileWidth
        Method Parameters: None
        Method Description: Gets the tile width
        Method Return: int
    */
    getTileWidth(){
        return Math.ceil(this.width / WTL_GAME_DATA["general"]["tile_size"]);
    }

    /*
        Method Name: getTileHeight
        Method Parameters: None
        Method Description: Gets the tile height
        Method Return: int
    */
    getTileHeight(){
        return Math.ceil(this.height / WTL_GAME_DATA["general"]["tile_size"]);
    }
}

/*
    Class Name: PhysicalTile
    Class Description: A physical tile in the world
*/
class PhysicalTile extends Tile {
    /*
        Method Name: delete
        Method Parameters: None
        Method Description: Deletes this tile
        Method Return: void
    */
    delete(){
        this.chunk.deletePhysicalTile(this);
    }

    /*
        Method Name: hasAttribute
        Method Parameters: 
            attribute:
                An attribute (string)
        Method Description: Checks if the physical tile has an attribute
        Method Return: boolean
    */
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