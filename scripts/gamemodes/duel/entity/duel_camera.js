class DuelCamera extends Entity {
    constructor(gamemode, x=0, y=0){
        super(gamemode);
        this.x = x;
        this.y = y;
        this.leftRightLock = new TickLock(250 / calculateMSBetweenTicks());
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.xLock = new TickLock(0);
        this.yLock = new TickLock(0);
        this.id = "camera";
    }

    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    setTilePosition(tileX, tileY){
        this.x = this.gamemode.getScene().getCenterXOfTile(tileX);
        this.y = this.gamemode.getScene().getCenterYOfTile(tileY);
    }

    focusOn(character){
        // TODO
    }

    hasVisionRestrictions(){
        return false;
    }

    couldSeeEntityIfOnTile(){ return true; }
    canSee(){ return true; }

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
        this.xVelocity = WTL_GAME_DATA["duel"]["camera"]["move_speed"] * getScreenWidth() / WTL_GAME_DATA["general"]["expected_canvas_width"] / gameZoom;
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
        this.yVelocity = WTL_GAME_DATA["duel"]["camera"]["move_speed"] * getScreenHeight() / WTL_GAME_DATA["general"]["expected_canvas_height"] / gameZoom;
        this.yVelocity *= downKey ? -1 : 1; 
    }

    getInterpolatedX(){
        return this.x + this.xVelocity * (FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    getInterpolatedY(){
        return this.y + this.yVelocity * (FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    getInterpolatedCenterX(){
        return this.getInterpolatedX();
    }

    getInterpolatedCenterY(){
        return this.getInterpolatedY();
    }

    tick(){
        // Update tick locks
        this.xLock.tick();
        this.yLock.tick();
        this.leftRightLock.tick();
        this.x += this.xVelocity / WTL_GAME_DATA["general"]["tick_rate"];
        this.y += this.yVelocity / WTL_GAME_DATA["general"]["tick_rate"];
        this.checkMoveX();
        this.checkMoveY();
        // TODO: Add something to snap on to nearest troop
        // TODO: Add something to scroll the troops
    }

    display(){}
}