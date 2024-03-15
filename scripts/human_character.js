class HumanCharacter extends Character {
    constructor(model){
        super(model);
        this.lookingDetails = {
            "direction": null,
            "look_lock": new TickLock(3)
        }
    }

    updateMovement(){
        // Nothing to do if between tiles
        if (this.betweenTiles()){ return; }

        let wantsToMoveUp = USER_INPUT_MANAGER.isActivated("move_up");
        let wantsToMoveDown = USER_INPUT_MANAGER.isActivated("move_down");
        let wantsToMoveLeft = USER_INPUT_MANAGER.isActivated("move_left");
        let wantsToMoveRight = USER_INPUT_MANAGER.isActivated("move_right");
        let wantsToSprint = USER_INPUT_MANAGER.isActivated("sprint");
        let movementKeysPressed = 0;
        movementKeysPressed += wantsToMoveUp ? 1 : 0;
        movementKeysPressed += wantsToMoveDown ? 1 : 0;
        movementKeysPressed += wantsToMoveLeft ? 1 : 0;
        movementKeysPressed += wantsToMoveRight ? 1 : 0;

        let numTicks = TICK_SCHEDULER.getNumTicks();
        if (movementKeysPressed != 1){
            if (this.isMoving()){
                this.movementDetails = null;
            }
            return; 
        }
        // 1 Movement key is being pressed
        let direction;
        let newTileX = this.tileX;
        let newTileY = this.tileY;
        if (wantsToMoveDown){
            direction = "down";
            newTileY -= 1;
        }else if (wantsToMoveLeft){
            direction = "left";
            newTileX -= 1;
        }else if (wantsToMoveRight){
            direction = "right";
            newTileX += 1;
        }else{
            direction = "up";
            newTileY += 1;
        }
        // Turn in direction if not moving
        if (!this.isMoving()){
            if (this.animationManager.getAlternativeDirection() != direction){
                this.animationManager.setDirectionFromAlternate(direction);
                this.lookingDetails["direction"] = direction;
                this.lookingDetails["look_lock"].lock();
                return;
            }else if (this.lookingDetails["look_lock"].notReady()){
                return;
            }
        }
        console.log("Moving again", this.tileX, this.lastX/64)
        // TODO: Check if there is a tile that I'm walking to
        let desiredMoveSpeed = PROGRAM_SETTINGS["general"]["walk_speed"];
        desiredMoveSpeed *= (wantsToSprint ? PROGRAM_SETTINGS["general"]["sprint_multiplier"] : 1);
        let tickProgressFromPrevious = 0;
        // If say at tileX 1.5 and moving right then keep that 0.5 as progress for the next move
        if (this.isMoving() && direction == this.movementDetails["direction"]){
            tickProgressFromPrevious = Math.ceil(this.movementDetails["reached_destination_tick"]) - this.movementDetails["reached_destination_tick"];
        }
        let distanceProgressFromPrevious = tickProgressFromPrevious * []
        this.movementDetails = {
            "direction": direction,
            "speed": desiredMoveSpeed,
            "last_frame_time": FRAME_COUNTER.getLastFrameTime(),
            "last_location_x": this.tileX,
            "last_location_y": this.tileY,
            "last_location_tick": numTicks,
            "reached_destination_tick": numTicks + PROGRAM_SETTINGS["general"]["tile_size"] / desiredMoveSpeed * 1000 / PROGRAM_SETTINGS["general"]["ms_between_ticks"] - tickProgressFromPrevious
        }
        this.tileX = newTileX;
        this.tileY = newTileY;
        
    }
}