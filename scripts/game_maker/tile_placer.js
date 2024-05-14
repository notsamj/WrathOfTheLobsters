class TilePlacer extends Entity {
    constructor(){
        super();
        this.readyToPlaceLock = new Lock();
        this.readyToPlaceLock.unlock();
        this.tileX = 0;
        this.tileY = 0;
        this.placerTileX = 0;
        this.placerTileY = 0;
        this.moveUDCD = new CooldownLock(100);
        this.moveLRCD = new CooldownLock(100);
        this.currentMaterial = null;
    }

    setMaterial(material){
        this.readyToPlaceLock.unlock();
        this.currentMaterial = material;
    }

    hasMaterial(){
        return this.currentMaterial != null;
    }

    getInterpolatedCenterX(){
        return this.getX();
    }

    getInterpolatedCenterY(){
        return this.getY();
    }

    getX(){
        return this.tileX * RETRO_GAME_DATA["general"]["tile_size"];
    }

    getY(){
        return this.tileY * RETRO_GAME_DATA["general"]["tile_size"];
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
        noStrokeRectangle(new Colour(252, 240, 63, 20), x, y, RETRO_GAME_DATA["general"]["tile_size"]);
    }

    tick(){
        let canvasX = window.mouseX;
        let canvasY = this.getScene().changeFromScreenY(window.mouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX + this.getScene().getLX();
        let engineY = canvasY + this.getScene().getBY();
        let newPlacerTileX = RetroGameScene.getTileXAt(engineX);
        let newPlacerTileY = RetroGameScene.getTileYAt(engineY);
        // If the new placer tile has moved
        if (this.placerTileX != newPlacerTileX || this.placerTileY != newPlacerTileY){
            this.readyToPlaceLock.unlock();
        }
        this.placerTileX = newPlacerTileX;
        this.placerTileY = newPlacerTileY;
        this.checkMove();
        this.checkPlace();
        this.checkDelete();
    }

    checkMove(){
        let moveUp = keyIsDown(87);
        let moveDown = keyIsDown(83);
        if (moveUp && this.moveUDCD.isReady()){
            this.tileY += 1;
            this.moveUDCD.lock();
            this.readyToPlaceLock.unlock();
        }else if (moveDown && this.moveUDCD.isReady()){
            this.tileY -= 1;
            this.moveUDCD.lock();
            this.readyToPlaceLock.unlock();
        }
        let moveLeft = keyIsDown(65);
        let moveRight = keyIsDown(68);
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

    checkPlace(){
        if (!this.hasMaterial()){ return; }
        let tryingToPlace = USER_INPUT_MANAGER.isActivated("click") && USER_INPUT_MANAGER.notActivated("right_click");
        if (!tryingToPlace){
            this.readyToPlaceLock.unlock();
            return; 
        }else if (this.readyToPlaceLock.isLocked()){
            return;
        }
        this.readyToPlaceLock.lock();
        this.getScene().placeMaterial(this.currentMaterial, this.placerTileX, this.placerTileY);
    }

    checkDelete(){
        let tryingToDelete = USER_INPUT_MANAGER.isActivated("right_click") && USER_INPUT_MANAGER.notActivated("click");
        if (!tryingToDelete){
            this.readyToPlaceLock.unlock();
            return; 
        }else if (this.readyToPlaceLock.isLocked()){
            return;
        }
        this.readyToPlaceLock.lock();
        this.getScene().deleteMaterial(this.placerTileX, this.placerTileY);
    }

}