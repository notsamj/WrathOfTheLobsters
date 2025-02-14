/*
    Class Name: TilePlacer
    Class Description: A tool for placing tiles
*/
class TilePlacer extends Entity {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Gamemode associated with the tile placer
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode){
        super(gamemode);
        this.readyToPlaceLock = new Lock();
        this.readyToPlaceLock.unlock();
        this.tileX = 0;
        this.tileY = 0;
        this.placerTileX = 0;
        this.placerTileY = 0;
        this.moveUDCD = new CooldownLock(100);
        this.moveLRCD = new CooldownLock(100);
        this.currentVisualMaterial = null;
        this.currentPhysicalMaterial = null;
        this.isUsingPhysicalLayer = false;
        this.gamemode.getScene().setFocusedEntity(this);
    }

    /*
        Method Name: setVisualMaterial
        Method Parameters: 
            visualMaterial:
                A JSON object with information about a visual material
        Method Description: Sets the visual material
        Method Return: void
    */
    setVisualMaterial(visualMaterial){
        this.readyToPlaceLock.unlock();
        this.currentVisualMaterial = visualMaterial;
    }

    /*
        Method Name: setPhysicalMaterial
        Method Parameters: 
            physicalMaterial:
                A JSON object with information about a physical material
        Method Description: Sets the physical material
        Method Return: void
    */
    setPhysicalMaterial(physicalMaterial){
        this.readyToPlaceLock.unlock();
        this.currentPhysicalMaterial = physicalMaterial;
    }

    /*
        Method Name: hasVisualMaterial
        Method Parameters: None
        Method Description: Checks if the tile placer has a set visual material
        Method Return: boolean
    */
    hasVisualMaterial(){
        return this.currentVisualMaterial != null;
    }

    /*
        Method Name: hasPhysicalMaterial
        Method Parameters: None
        Method Description: Checks if the tile placer has a set physical material
        Method Return: boolean
    */
    hasPhysicalMaterial(){
        return this.currentPhysicalMaterial != null;
    }

    /*
        Method Name: getInterpolatedCenterX
        Method Parameters: None
        Method Description: Gets the x location of the tile placer for display purposes
        Method Return: float
    */
    getInterpolatedCenterX(){
        return this.getX();
    }

    /*
        Method Name: getInterpolatedCenterY
        Method Parameters: None
        Method Description: Gets the y location of the tile placer for display purposes
        Method Return: float
    */
    getInterpolatedCenterY(){
        return this.getY();
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Gets the x location of the tile placer 
        Method Return: float
    */
    getX(){
        return this.tileX * WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Gets the y location of the tile placer 
        Method Return: float
    */
    getY(){
        return this.tileY * WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x coordinate of the left of the screen
            rX:
                The x coordinate of the right of the screen
            bY:
                The y coordinate of the bottom of the screen
            tY:
                The y coordinate of the top of the screen
        Method Description: Display ui and tile placer
        Method Return: void
    */
    display(lX, rX, bY, tY){
        let x = this.getScene().getDisplayXFromTileX(lX, this.placerTileX);
        let y = this.getScene().getDisplayYFromTileY(bY, this.placerTileY);
        //MY_HUD.updateElement("Tile Display X", x);
        //MY_HUD.updateElement("Tile Display Y", y);
        MY_HUD.updateElement("Center Tile X", this.tileX);
        MY_HUD.updateElement("Center Tile Y", this.tileY);
        MY_HUD.updateElement("Placer Tile X", this.placerTileX);
        MY_HUD.updateElement("Placer Tile Y", this.placerTileY);
        MY_HUD.updateElement("Placer x", this.placerX);
        MY_HUD.updateElement("Placer y", this.placerY);
        noStrokeRectangle(new Colour(252, 240, 63, 20), x, y, WTL_GAME_DATA["general"]["tile_size"] * gameZoom, WTL_GAME_DATA["general"]["tile_size"] * gameZoom);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Performs actions during tick
        Method Return: void
    */
    tick(){
        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        if (this.gamemode.getUI().blocksWindowLocation(gMouseX, gMouseY)){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        let newPlacerTileX = WTLGameScene.getTileXAt(engineX);
        let newPlacerTileY = WTLGameScene.getTileYAt(engineY);
        // If the new placer tile has moved
        if (this.placerTileX != newPlacerTileX || this.placerTileY != newPlacerTileY){
            this.readyToPlaceLock.unlock();
        }
        this.placerX = engineX;
        this.placerY = engineY;
        this.placerTileX = newPlacerTileX;
        this.placerTileY = newPlacerTileY;
        this.checkMove();
        this.checkPlace();
        this.checkDelete();
    }

    /*
        Method Name: checkMove
        Method Parameters: None
        Method Description: Checks if the user wishes to move the tile placer
        Method Return: void
    */
    checkMove(){
        let moveUp = GAME_USER_INPUT_MANAGER.isActivated("move_up");
        let moveDown = GAME_USER_INPUT_MANAGER.isActivated("move_down");
        if (moveUp && this.moveUDCD.isReady()){
            this.tileY += 1;
            this.moveUDCD.lock();
            this.readyToPlaceLock.unlock();
        }else if (moveDown && this.moveUDCD.isReady()){
            this.tileY -= 1;
            this.moveUDCD.lock();
            this.readyToPlaceLock.unlock();
        }
        let moveLeft = GAME_USER_INPUT_MANAGER.isActivated("move_left");
        let moveRight = GAME_USER_INPUT_MANAGER.isActivated("move_right");
        if (moveLeft && this.moveLRCD.isReady()){
            this.tileX -= 1;
            this.moveLRCD.lock();
            this.readyToPlaceLock.unlock();
        }else if (moveRight && this.moveLRCD.isReady()){
            this.tileX += 1;
            this.moveLRCD.lock();
            this.readyToPlaceLock.unlock();
        }
    }

    /*
        Method Name: checkPlace
        Method Parameters: None
        Method Description: Checks if the user wishes to place a tile
        Method Return: void
    */
    checkPlace(){
        if ((this.usingVisualLayer() && !this.hasVisualMaterial()) || (this.usingPhysicalLayer() && !this.hasPhysicalMaterial())){ return; }
        let tryingToPlace = GAME_USER_INPUT_MANAGER.isActivated("left_click") && GAME_USER_INPUT_MANAGER.notActivated("right_click");
        if (!tryingToPlace){
            this.readyToPlaceLock.unlock();
            return; 
        }else if (this.readyToPlaceLock.isLocked()){
            return;
        }
        this.readyToPlaceLock.lock();
        if (this.usingPhysicalLayer()){
            this.getScene().placePhysicalTile(this.currentPhysicalMaterial, this.placerTileX, this.placerTileY);
        }else{
            this.getScene().placeVisualTile(this.currentVisualMaterial, this.placerTileX, this.placerTileY);
        }
    }

    /*
        Method Name: checkDelete
        Method Parameters: None
        Method Description: Checks if the user wishes to delete a tile
        Method Return: void
    */
    checkDelete(){
        let tryingToDelete = GAME_USER_INPUT_MANAGER.isActivated("right_click") && GAME_USER_INPUT_MANAGER.notActivated("left_click");
        if (!tryingToDelete){
            this.readyToPlaceLock.unlock();
            return; 
        }else if (this.readyToPlaceLock.isLocked()){
            return;
        }
        this.readyToPlaceLock.lock();
        if (this.usingPhysicalLayer()){
            this.getScene().deletePhysicalTile(this.placerTileX, this.placerTileY);
        }else{
            if (this.getScene().hasVisualTileCoveringLocation(this.placerTileX, this.placerTileY)){
                this.getScene().getVisualTileCoveringLocation(this.placerTileX, this.placerTileY).delete();
            }else{
                // temp
                //rDebug();
                //this.getScene().getVisualTileCoveringLocation(this.placerTileX, this.placerTileY)
            }
        }
    }

    /*
        Method Name: usingVisualLayer
        Method Parameters: None
        Method Description: Checks if the visual layer is being used
        Method Return: boolean
    */
    usingVisualLayer(){
        return !this.isUsingPhysicalLayer;
    }

    /*
        Method Name: usingPhysicalLayer
        Method Parameters: None
        Method Description: Checks if the physical layer is being used
        Method Return: boolean
    */
    usingPhysicalLayer(){
        return this.isUsingPhysicalLayer;
    }

    /*
        Method Name: usePhysicalLayer
        Method Parameters: None
        Method Description: Switches to using the physical layer
        Method Return: boolean
    */
    usePhysicalLayer(){
        this.isUsingPhysicalLayer = true;
    }

    /*
        Method Name: useVisualLayer
        Method Parameters: None
        Method Description: Switches to using the visual layer
        Method Return: boolean
    */
    useVisualLayer(){
        this.isUsingPhysicalLayer = false;
    }

}