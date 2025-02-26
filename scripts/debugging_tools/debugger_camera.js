/*
    Class Name: DebuggerCamera
    Class Description: A camera used in debugging
*/
class DebuggerCamera extends Entity {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Related gamemode
            x:
                x position of the camera
            y:
                y position of the camera
        Method Description: Constructor
        Method Return: None
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

        // Current debugging stuff
        this.debugDot1 = new DebuggingDot("#000000", 0, 0, 5);
        this.debugDot2 = new DebuggingDot("#000000", 0, 0, 5);
        this.debugChar = new Character(this.gamemode, "british_officer");
        this.getScene().addEntity(this.debugChar);
    }

    /*
        Method Name: canSee
        Method Parameters: None
        Method Description: Checks if the camera can see a given entity
        Method Return: Boolean, true -> can see the entity, false -> cannot see
    */
    canSee(entity){ return true; }

    /*
        Method Name: setPosition
        Method Parameters: 
            x:
                New x location for the camera
            y:
                New y location for the camera
        Method Description: Sets the new position of the camera
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
        Method Description: Calculates the x value for display
        Method Return: float
    */
    getInterpolatedX(){
        return this.x + this.xVelocity * (FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    /*
        Method Name: getInterpolatedY
        Method Parameters: None
        Method Description: Calculates the y value for display
        Method Return: float
    */
    getInterpolatedY(){
        return this.y + this.yVelocity * (FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    /*
        Method Name: getInterpolatedCenterX
        Method Parameters: None
        Method Description: Calculates the center x value for display
        Method Return: float
    */
    getInterpolatedCenterX(){
        return this.getInterpolatedX();
    }

    /*
        Method Name: getInterpolatedCenterY
        Method Parameters: None
        Method Description: Calculates the center y value for display
        Method Return: float
    */
    getInterpolatedCenterY(){
        return this.getInterpolatedY();
    }

    /*
        Method Name: updateDebuggingActions
        Method Parameters: None
        Method Description: Checks for user input and acts
        Method Return: void
    */
    updateDebuggingActions(){
        let leftClick = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let rightClick = GAME_USER_INPUT_MANAGER.isActivated("right_click_ticked");
        let middleClick = GAME_USER_INPUT_MANAGER.isActivated("middle_click_ticked");

        // If neither clicked then do nothing
        if (!(leftClick || rightClick || middleClick)){
            return;
        }

        if (leftClick){
            this.debugDot1.setX(this.cursorEngineX);
            this.debugDot1.setY(this.cursorEngineY);
        }

        if (rightClick){
            this.debugDot2.setX(this.cursorEngineX);
            this.debugDot2.setY(this.cursorEngineY);
        }

        if (middleClick){
            this.debugChar.setTileX(this.cursorTileX);
            this.debugChar.setTileY(this.cursorTileY);
        }

        let x1 = this.debugDot1.getX();
        let y1 = this.debugDot1.getY();

        let x2 = this.debugDot2.getX();
        let y2 = this.debugDot2.getY();

        let scene = this.getScene();
        let distance = calculateEuclideanDistance(x1, y1, x2, y2);
        let angle = displacementToRadians(x2-x1, y2-y1);
        
        if (isRDebugging()){
            debugger;
        }
        let collisionResult = scene.findInstantCollisionForProjectile(x1, y1, angle, distance);
        if (collisionResult["collision_type"] === "entity"){
            // red
            this.debugDot2.setColourCode("#ff000");
        }else if (collisionResult["collision_type"] === "physical_tile"){
            // blue
            this.debugDot2.setColourCode("#0000ff");
        }else{
            // green
            this.debugDot2.setColourCode("#00ff00");
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Permforms actions for a tick
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
        this.updateDebuggingActions();
    }

    /*
        Method Name: updateCursorInfo
        Method Parameters: None
        Method Description: Calculates and sets a new cursor position
        Method Return: void
    */
    updateCursorInfo(){
        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        this.cursorEngineX = engineX;
        this.cursorEngineY = engineY;
        this.cursorTileX = WTLGameScene.getTileXAt(engineX);
        this.cursorTileY = WTLGameScene.getTileYAt(engineY);
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x value of the left of the screen
            rX:
                The x value of the right of the screen
            bY:
                The y value of the bottom of the screen
            tY:
                The y value of the top of the screen
        Method Description: Displays the dots
        Method Return: void
    */
    display(lX, rX, bY, tY){
        MY_HUD.updateElement("Cursor Tile X", this.cursorTileX);
        MY_HUD.updateElement("Cursor Tile Y", this.cursorTileY);
        this.debugDot1.display(this.getScene(), lX, rX, bY, tY);
        this.debugDot2.display(this.getScene(), lX, rX, bY, tY);
    }
}