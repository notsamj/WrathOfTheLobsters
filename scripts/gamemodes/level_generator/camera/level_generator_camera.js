/*  
    Class Name: LevelGeneratorCamera
    Class Description: A camera to be operated when using the level generator gamemode
*/
class LevelGeneratorCamera extends Entity {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                A levelgenerator instance
            x:
                Starting x   
            y:
                Starting y
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, x=0, y=0){
        super(gamemode);
        this.x = x;
        this.y = y;
        this.leftRightLock = new TickLock(250 / calculateMSBetweenTicks());
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.xLock = new TickLock(0);
        this.yLock = new TickLock(0);
        this.cursorTileX = undefined;
        this.cursorTileY = undefined;
        this.id = "camera";
    }

    /*
        Method Name: setPosition
        Method Parameters: 
            x:
                x coordinate
            y:
                y coordinate
        Method Description: Changes the position of the camera
        Method Return: void
    */
    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    /*
        Method Name: checkMoveX
        Method Parameters: None
        Method Description: Checks if the user wants to move the camera left or right
        Method Return: void
    */
    checkMoveX(){
        let leftKey = GAME_USER_INPUT_MANAGER.isActivated("move_left");
        let rightKey = GAME_USER_INPUT_MANAGER.isActivated("move_right");
        let numKeysDown = 0;
        numKeysDown += leftKey ? 1 : 0;
        numKeysDown += rightKey ? 1 : 0;
        if (numKeysDown == 0 || numKeysDown == 2){
            this.xVelocity = 0;
            return;
        }else if (!this.xLock.isReady()){ return; }
        this.xLock.lock();

        // Else 1 key down and ready to move
        this.xVelocity = WTL_GAME_DATA["level_generator"]["camera"]["move_speed"] * getScreenWidth() / WTL_GAME_DATA["general"]["expected_canvas_width"] / gameZoom;
        this.xVelocity *= leftKey ? -1 : 1;
    }

    /*
        Method Name: checkMoveY
        Method Parameters: None
        Method Description: Checks if the user wants to move the camera up or down
        Method Return: void
    */
    checkMoveY(){
        let upKey = GAME_USER_INPUT_MANAGER.isActivated("move_up");
        let downKey = GAME_USER_INPUT_MANAGER.isActivated("move_down");
        let numKeysDown = 0;
        numKeysDown += upKey ? 1 : 0;
        numKeysDown += downKey ? 1 : 0;
        if (numKeysDown == 0 || numKeysDown == 2){
            this.yVelocity = 0;
            return;
        }else if (!this.yLock.isReady()){ return; }
        this.yLock.lock();

        // Else 1 key down and ready to move
        this.yVelocity = WTL_GAME_DATA["level_generator"]["camera"]["move_speed"] * getScreenHeight() / WTL_GAME_DATA["general"]["expected_canvas_height"] / gameZoom;
        this.yVelocity *= downKey ? -1 : 1; 
    }

    /*
        Method Name: getInterpolatedX
        Method Parameters: None
        Method Description: Gets the current x of the camera for display purposes
        Method Return: float
    */
    getInterpolatedX(){
        return this.x + this.xVelocity * (FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    /*
        Method Name: getInterpolatedY
        Method Parameters: None
        Method Description: Gets the current y of the camera for display purposes
        Method Return: float
    */
    getInterpolatedY(){
        return this.y + this.yVelocity * (FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    /*
        Method Name: getInterpolatedCenterX
        Method Parameters: None
        Method Description: Gets the current x of the camera for display purposes
        Method Return: float
    */
    getInterpolatedCenterX(){
        return this.getInterpolatedX();
    }

    /*
        Method Name: getInterpolatedCenterY
        Method Parameters: None
        Method Description: Gets the current y of the camera for display purposes
        Method Return: float
    */
    getInterpolatedCenterY(){
        return this.getInterpolatedY();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Runs processes during a tick
        Method Return: void
    */
    tick(){
        // Update tick locks
        this.xLock.tick();
        this.yLock.tick();
        this.leftRightLock.tick();
        this.x += this.xVelocity / WTL_GAME_DATA["general"]["tick_rate"];
        this.y += this.yVelocity / WTL_GAME_DATA["general"]["tick_rate"];
        this.checkMoveX();
        this.checkMoveY();
        this.updateCursorInfo();
    }

    /*
        Method Name: updateCursorInfo
        Method Parameters: None
        Method Description: Updates information about the cursor position
        Method Return: void
    */
    updateCursorInfo(){
        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        this.cursorTileX = WTLGameScene.getTileXAt(engineX);
        this.cursorTileY = WTLGameScene.getTileYAt(engineY);
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the focused entity or hud info
        Method Return: void
    */
    display(){
        MY_HUD.updateElement("Cursor Tile X", this.cursorTileX);
        MY_HUD.updateElement("Cursor Tile Y", this.cursorTileY);
    }
}