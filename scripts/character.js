/*
    Notes:
        Assuming player does not move > 1 tile / tick
*/
class Character extends Entity {
    constructor(model){
        super();
        this.model = model;
        this.animationManager = new CharacterAnimationManager();
        this.tileX = 0;
        this.tileY = 0;
        this.lookingDetails = {
            "direction": null,
            "look_lock": new TickLock(3)
        }
        this.movementDetails = null;
        this.inventory = new Inventory();
    }

    getInventory(){
        return this.inventory;
    }

    getFacingDirection(){
        return this.animationManager.getDirection();
    }

    getModel(){
        return this.model;
    }

    getInterpolatedCenterX(){
        return this.getInterpolatedX() + this.getImage().width / 2;
    }

    getInterpolatedCenterY(){
        return this.getInterpolatedY() - this.getImage().height / 2;
    }

    tick(){
        this.lookingDetails["look_lock"].tick();
        this.inventory.tickSelectedItem();

        this.makeDecisions();
        this.actOnDecisions();
    }

    makeDecisions(){
        this.updateMovement();
    }

    // TODO
    actOnDecisions(){
        
    }

    getImage(){
        return IMAGES[this.model + this.animationManager.getCurrentImageSuffix(this.getXVelocity(), this.getYVelocity())];
    }

    isMoving(){
        return this.movementDetails != null;
    }

    getTileX(){
        return this.tileX;
    }

    getTileY(){
        return this.tileY;
    }

    getInterpolatedX(){
        let xOfTile = SCENE.getXOfTile(this.tileX);
        // If not moving (or moving u/d) then x is just tile x
        if (!this.isMoving() || this.movementDetails["direction"] == "up" || this.movementDetails["direction"] == "down"){
            return xOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "left" ? -1 : 1;
        let x = SCENE.getXOfTile(this.movementDetails["last_location_x"]);
        return x + this.movementDetails["speed"] * dir * (FRAME_COUNTER.getLastFrameTime() - this.movementDetails["last_frame_time"]) / 1000;
    }

    getDisplayX(lX){
        return this.getInterpolatedX() - lX;
    }

    getInterpolatedY(){
        let yOfTile = SCENE.getYOfTile(this.tileY);
        // If not moving (or moving l/r) then y is just tile y
        if (!this.isMoving() || this.movementDetails["direction"] == "left" || this.movementDetails["direction"] == "right"){
            return yOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "down" ? -1 : 1;
        let y = SCENE.getYOfTile(this.movementDetails["last_location_y"]);
        return y + this.movementDetails["speed"] * dir * (FRAME_COUNTER.getLastFrameTime() - this.movementDetails["last_frame_time"]) / 1000;
    }

    getDisplayY(bY){
        return SCENE.changeToScreenY(this.getInterpolatedY() - bY);
    }

    betweenTiles(){
        if (!this.isMoving()){
            return false;
        }
        //console.log("ab", Math.ceil(this.movementDetails["reached_destination_tick"]), TICK_SCHEDULER.getNumTicks())
        return Math.ceil(this.movementDetails["reached_destination_tick"]) != TICK_SCHEDULER.getNumTicks();
    }

    // Abstract
    updateMovement(){}

    getXVelocity(){
        if (!this.isMoving()){ return 0; }
        if (this.movementDetails["direction"] == "up" || this.movementDetails["direction"] == "down"){ return 0; }
        return this.movementDetails["speed"] * (this.movementDetails["direction"] == "left" ? -1 : 1);
    }

    getYVelocity(){
        if (!this.isMoving()){ return 0; }
        if (this.movementDetails["direction"] == "left" || this.movementDetails["direction"] == "right"){ return 0; }
        return this.movementDetails["speed"] * (this.movementDetails["direction"] == "down" ? -1 : 1);
    }

    display(lX, rX, bY, tY){
        let x = this.getDisplayX(lX);
        let y = this.getDisplayY(bY);
        if (!pointInRectangle(x, y, 0, getScreenWidth(), 0, getScreenHeight())){ return; }
        if (this.animationManager.getDirection() == "back"){
            this.inventory.displaySelectedItem(lX, bY);
        }
        drawingContext.drawImage(this.getImage(), x, y);
        if (this.animationManager.getDirection() != "back"){
            this.inventory.displaySelectedItem(lX, bY);
        }
        this.inventory.display();
    }
}