class TilePlacer extends Entity {
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

    setVisualMaterial(visualMaterial){
        this.readyToPlaceLock.unlock();
        this.currentVisualMaterial = visualMaterial;
    }

    setPhysicalMaterial(physicalMaterial){
        this.readyToPlaceLock.unlock();
        this.currentPhysicalMaterial = physicalMaterial;
    }

    hasVisualMaterial(){
        return this.currentVisualMaterial != null;
    }

    hasPhysicalMaterial(){
        return this.currentPhysicalMaterial != null;
    }

    getInterpolatedCenterX(){
        return this.getX();
    }

    getInterpolatedCenterY(){
        return this.getY();
    }

    getX(){
        return this.tileX * WTL_GAME_DATA["general"]["tile_size"];
    }

    getY(){
        return this.tileY * WTL_GAME_DATA["general"]["tile_size"];
    }

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
        noStrokeRectangle(new Colour(252, 240, 63, 20), x, y, WTL_GAME_DATA["general"]["tile_size"], WTL_GAME_DATA["general"]["tile_size"]);
    }

    tick(){
        let canvasX = window.mouseX;
        let canvasY = this.getScene().changeFromScreenY(window.mouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX + this.getScene().getLX();
        let engineY = canvasY + this.getScene().getBY();
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

    checkMove(){
        let moveUp = USER_INPUT_MANAGER.isActivated("move_up");
        let moveDown = USER_INPUT_MANAGER.isActivated("move_down");
        if (moveUp && this.moveUDCD.isReady()){
            this.tileY += 1;
            this.moveUDCD.lock();
            this.readyToPlaceLock.unlock();
        }else if (moveDown && this.moveUDCD.isReady()){
            this.tileY -= 1;
            this.moveUDCD.lock();
            this.readyToPlaceLock.unlock();
        }
        let moveLeft = USER_INPUT_MANAGER.isActivated("move_left");
        let moveRight = USER_INPUT_MANAGER.isActivated("move_right");
        if (moveLeft && this.moveLRCD.isReady()){
            this.tileX -= 1;
            this.moveLRCD.lock();
            this.readyToPlaceLock.unlock();
        }else if (moveRight && this.moveLRCD.isReady()){
            this.tileX += 1;
            this.moveLRCD.lock();
            this.readyToPlaceLock.unlock();
        }
        //console.log(this.tileX, this.tileY)
    }

    checkPlace(){
        if ((this.usingVisualLayer() && !this.hasVisualMaterial()) || (this.usingPhysicalLayer() && !this.hasPhysicalMaterial()) || this.gamemode.getUI().blocksWindowLocation(mouseX, mouseY)){ return; }
        let tryingToPlace = USER_INPUT_MANAGER.isActivated("left_click") && USER_INPUT_MANAGER.notActivated("right_click");
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

    checkDelete(){
        let tryingToDelete = USER_INPUT_MANAGER.isActivated("right_click") && USER_INPUT_MANAGER.notActivated("left_click");
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
            this.getScene().deleteVisualTile(this.placerTileX, this.placerTileY);
        }
    }

    usingVisualLayer(){
        return !this.isUsingPhysicalLayer;
    }

    usingPhysicalLayer(){
        return this.isUsingPhysicalLayer;
    }

    usePhysicalLayer(){
        this.isUsingPhysicalLayer = true;
    }

    useVisualLayer(){
        this.isUsingPhysicalLayer = false;
    }

}