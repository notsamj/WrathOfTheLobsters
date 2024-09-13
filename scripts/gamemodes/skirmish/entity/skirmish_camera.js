/*
    Class Name: SkirmishCamera
    Description: A subclass of Entity that acts as a camera, able to fly around.
*/
class SkirmishCamera extends Entity {
    constructor(gamemode, x=0, y=0){
        super(game);
        this.x = x;
        this.y = y;
        this.leftRightLock = new TickLock(250 / calculateMSBetweenTicks());
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.xLock = new TickLock(0);
        this.yLock = new TickLock(0);
    }

    /*
        Method Name: checkMoveX
        Method Parameters: None
        Method Description: Checks if the user wants to move the camera left or right
        Method Return: void
    */
    checkMoveX(){
        let leftKey = USER_INPUT_MANAGER.isActivated("move_left");
        let rightKey = USER_INPUT_MANAGER.isActivated("move_right");
        let numKeysDown = 0;
        numKeysDown += leftKey ? 1 : 0;
        numKeysDown += rightKey ? 1 : 0;
        if (numKeysDown == 0 || numKeysDown == 2){
            this.xVelocity = 0;
            return;
        }else if (!this.xLock.isReady()){ return; }
        this.xLock.lock();

        // Else 1 key down and ready to move
        this.xVelocity = RETRO_GAME_DATA["skirmish_camera"]["move_speed"] * getScreenWidth() / RETRO_GAME_DATA["general"]["expected_canvas_width"] / gameZoom;
        this.xVelocity *= leftKey ? -1 : 1;
    }

    /*
        Method Name: checkMoveY
        Method Parameters: None
        Method Description: Checks if the user wants to move the camera up or down
        Method Return: void
    */
    checkMoveY(){
        let upKey = USER_INPUT_MANAGER.isActivated("move_up");
        let downKey = USER_INPUT_MANAGER.isActivated("move_down");
        let numKeysDown = 0;
        numKeysDown += upKey ? 1 : 0;
        numKeysDown += downKey ? 1 : 0;
        if (numKeysDown == 0 || numKeysDown == 2){
            this.yVelocity = 0;
            return;
        }else if (!this.yLock.isReady()){ return; }
        this.yLock.lock();

        // Else 1 key down and ready to move
        this.yVelocity = RETRO_GAME_DATA["skirmish_camera"]["move_speed"] * getScreenHeight() / RETRO_GAME_DATA["general"]["expected_canvas_height"] / gameZoom;
        this.yVelocity *= downKey ? -1 : 1; 
    }

    getInterpolatedX(){
        return this.interpolatedX;
    }

    getInterpolatedY(){
        return this.interpolatedY;
    }


    calculateInterpolatedCoordinates(currentTime){
        // TODO: Clean this up
        let currentFrameIndex = FRAME_COUNTER.getFrameIndex();
        if (GAMEMODE_MANAGER.getActiveGamemode().isPaused() || !GAMEMODE_MANAGER.getActiveGamemode().isRunning() || this.isDead() || this.lastInterpolatedFrame == currentFrameIndex){
            return;
        }
        if (this.isFollowing()){
            let newPositionValues = this.followingEntity.calculateInterpolatedCoordinates(currentTime);
            this.interpolatedX = this.followingEntity.getInterpolatedX();
            this.interpolatedY = this.followingEntity.getInterpolatedY();
        }else{
            this.interpolatedX = this.x + this.xVelocity * (currentTime - GAMEMODE_MANAGER.getActiveGamemode().getLastTickTime()) / 1000;
            this.interpolatedY = this.y + this.yVelocity * (currentTime - GAMEMODE_MANAGER.getActiveGamemode().getLastTickTime()) / 1000;
        }
        this.lastInterpolatedFrame = currentFrameIndex;
    }

    tick(){
        // Update tick locks
        this.xLock.tick();
        this.yLock.tick();
        this.leftRightLock.tick();
        this.x += this.xVelocity / RETRO_GAME_DATA["general"]["tick_rate"];
        this.y += this.yVelocity / RETRO_GAME_DATA["general"]["tick_rate"];
        this.checkMoveX();
        this.checkMoveY();
    }
}