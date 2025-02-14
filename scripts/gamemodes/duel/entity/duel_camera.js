/*  
    Class Name: DuelCamera
    Class Description: A camera to be operated when spectating a bot duel
*/
class DuelCamera extends Entity {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Duel instance
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
        this.id = "camera";
        this.followedEntity = null;
        this.scrollLock = new Lock();
        this.snapLock = new Lock();
        this.cursorTileX = undefined;
        this.cursorTileY = undefined;
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
        Method Name: setTilePosition
        Method Parameters: 
            tileX:
                Tile x to focus on
            tileY:
                Tile y to focus on
        Method Description: Sets the position to a center on a tile
        Method Return: void
    */
    setTilePosition(tileX, tileY){
        this.x = this.gamemode.getScene().getCenterXOfTile(tileX);
        this.y = this.gamemode.getScene().getCenterYOfTile(tileY);
    }

    /*
        Method Name: hasVisionRestrictions
        Method Parameters: None
        Method Description: Checks if the camera has vision restrictions
        Method Return: boolean
    */
    hasVisionRestrictions(){
        return false;
    }

    /*
        Method Name: couldSeeEntityIfOnTile
        Method Parameters: None
        Method Description: Checks if the camera could see an entity on a given tile
        Method Return: boolean
    */
    couldSeeEntityIfOnTile(){ return true; }

    /*
        Method Name: canSee
        Method Parameters: None
        Method Description: Check if the camera could see an entity
        Method Return: boolean
    */
    canSee(){ return true; }

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
        if (numKeysDown == 0 || numKeysDown == 2 || this.isFollowingAnEntity()){
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
        let upKey = GAME_USER_INPUT_MANAGER.isActivated("move_up");
        let downKey = GAME_USER_INPUT_MANAGER.isActivated("move_down");
        let numKeysDown = 0;
        numKeysDown += upKey ? 1 : 0;
        numKeysDown += downKey ? 1 : 0;
        if (numKeysDown == 0 || numKeysDown == 2 || this.isFollowingAnEntity()){
            this.yVelocity = 0;
            return;
        }else if (!this.yLock.isReady()){ return; }
        this.yLock.lock();

        // Else 1 key down and ready to move
        this.yVelocity = WTL_GAME_DATA["duel"]["camera"]["move_speed"] * getScreenHeight() / WTL_GAME_DATA["general"]["expected_canvas_height"] / gameZoom;
        this.yVelocity *= downKey ? -1 : 1; 
    }

    /*
        Method Name: getFreeCamX
        Method Parameters: None
        Method Description: Gets the current x of the camera for display purposes (in free-cam mode)
        Method Return: float
    */
    getFreeCamX(){
        return this.x + this.xVelocity * (FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    /*
        Method Name: getFreeCamY
        Method Parameters: None
        Method Description: Gets the current y of the camera for display purposes (in free-cam mode)
        Method Return: float
    */
    getFreeCamY(){
        return this.y + this.yVelocity * (FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    /*
        Method Name: getInterpolatedCenterX
        Method Parameters: None
        Method Description: Gets the current x of the camera for display purposes
        Method Return: float
    */
    getInterpolatedCenterX(){
        if (this.isFollowingAnEntity()){
            return this.getFollowedEntity().getInterpolatedCenterX();
        }else{
            return this.getFreeCamX();
        }
    }

    /*
        Method Name: getInterpolatedCenterY
        Method Parameters: None
        Method Description: Gets the current y of the camera for display purposes
        Method Return: float
    */
    getInterpolatedCenterY(){
        if (this.isFollowingAnEntity()){
            return this.getFollowedEntity().getInterpolatedCenterY();
        }else{
            return this.getFreeCamY();
        }
    }

    /*
        Method Name: checkSnap
        Method Parameters: None
        Method Description: Checks if the user is trying to snap the camera
        Method Return: void
    */
    checkSnap(){
        let wantsToSnap = GAME_USER_INPUT_MANAGER.isActivated("f_ticked");
        if (wantsToSnap && this.snapLock.isUnlocked()){
            this.snapLock.lock();
            if (this.isFollowingAnEntity()){
                this.stopFollowing();
            }else{
                this.snapToClosestEntity();
            }
        }
        this.snapLock.unlockIfLocked();
    }

    /*
        Method Name: snapToClosestEntity
        Method Parameters: None
        Method Description: Snaps the camera to the closest entity
        Method Return: void
    */
    snapToClosestEntity(){
        let participants = this.gamemode.getParticipants();

        if (participants.length === 0){
            throw new Error("No participants supplied");
        }

        let bestP;
        let bestD = undefined;

        let myX = this.getFreeCamX();
        let myY = this.getFreeCamY();

        for (let participant of participants){
            let distanceToParticipant = calculateEuclideanDistance(myX, myY, participant.getInterpolatedCenterX(), participant.getInterpolatedCenterY());
            if (bestD === undefined || distanceToParticipant < bestD){
                bestD = distanceToParticipant;
                bestP = participant;
            }
        }

        this.followedEntity = bestP;
    }

    /*
        Method Name: scrollTroops
        Method Parameters: 
            direction:
                Direction to scroll
        Method Description: Scrolls through troops
        Method Return: void
    */
    scrollTroops(direction){
        let participants = this.gamemode.getParticipants();

        if (participants.length === 0){
            throw new Error("No participants supplied.");
        }
        // Don't scroll if there is only 1 participant
        else if (participants.length === 1){
            return;
        }

        if (!this.isFollowingAnEntity()){
            throw new Error("Trying to scroll but not following.");
        }

        let currentParticipantID = this.getFollowedEntity().getID();
        let currentParticipantIndex = -1;

        // Find current participant index
        for (let i = 0; i < participants.length; i++){
            let participant = participants[i];
            
            if (participant.getID() === currentParticipantID){
                currentParticipantIndex = i;
                break;
            }
        }

        if (currentParticipantIndex === -1){
            throw new Error("Current participant not found.");
        }

        // Get index of next one in direction

        let nextIndex = currentParticipantIndex + direction;

        if (nextIndex >= participants.length){
            nextIndex = 0;
        }else if (nextIndex < 0){
            nextIndex = participants.length - 1;
        }

        // Change to new entity
        this.followedEntity = participants[nextIndex];
    }

    /*
        Method Name: checkScrollTroops
        Method Parameters: None
        Method Description: Checks if the user is trying to scroll troops
        Method Return: void
    */
    checkScrollTroops(){
        let wantsToScrollLeft = GAME_USER_INPUT_MANAGER.isActivated("left_arrow");
        let wantsToScrollRight = GAME_USER_INPUT_MANAGER.isActivated("right_arrow");

        if (this.scrollLock.isLocked()){
            this.scrollLock.unlock();
            return;
        }
        this.scrollLock.lock();

        if (wantsToScrollLeft && this.isFollowingAnEntity()){
            this.scrollTroops(-1);
        }else if(wantsToScrollRight && this.isFollowingAnEntity()){
            this.scrollTroops(1);
        }
    }

    /*
        Method Name: isFollowingAnEntity
        Method Parameters: None
        Method Description: Checks if the camera is currently following an entity
        Method Return: boolean
    */
    isFollowingAnEntity(){
        return this.getFollowedEntity() != null;
    }

    /*
        Method Name: getFollowedEntity
        Method Parameters: None
        Method Description: Getter
        Method Return: Entity
    */
    getFollowedEntity(){
        return this.followedEntity;
    }

    /*
        Method Name: stopFollowing
        Method Parameters: None
        Method Description: Stops following the current entity
        Method Return: void
    */
    stopFollowing(){
        this.x = this.followedEntity.getInterpolatedCenterX();
        this.y = this.followedEntity.getInterpolatedCenterY();
        this.followedEntity = null;
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
        this.checkSnap();
        this.checkScrollTroops();
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
        if (this.isFollowingAnEntity()){
            this.followedEntity.displayWhenFocused();
        }else{
            MY_HUD.updateElement("Cursor Tile X", this.cursorTileX);
            MY_HUD.updateElement("Cursor Tile Y", this.cursorTileY);
        }
    }
}