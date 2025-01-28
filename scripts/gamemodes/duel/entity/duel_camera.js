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
        this.followedEntity = null;
        this.scrollLock = new Lock();
        this.snapLock = new Lock();
    }

    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    setTilePosition(tileX, tileY){
        this.x = this.gamemode.getScene().getCenterXOfTile(tileX);
        this.y = this.gamemode.getScene().getCenterYOfTile(tileY);
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
        let upKey = USER_INPUT_MANAGER.isActivated("move_up");
        let downKey = USER_INPUT_MANAGER.isActivated("move_down");
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

    getFreeCamX(){
        return this.x + this.xVelocity * (FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    getFreeCamY(){
        return this.y + this.yVelocity * (FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime()) / 1000;
    }

    getInterpolatedCenterX(){
        if (this.isFollowingAnEntity()){
            return this.getFollowedEntity().getInterpolatedCenterX();
        }else{
            return this.getFreeCamX();
        }
    }

    getInterpolatedCenterY(){
        if (this.isFollowingAnEntity()){
            return this.getFollowedEntity().getInterpolatedCenterY();
        }else{
            return this.getFreeCamY();
        }
    }

    checkSnap(){
        let wantsToSnap = USER_INPUT_MANAGER.isActivated("f_ticked");
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

    checkScrollTroops(){
        let wantsToScrollLeft = USER_INPUT_MANAGER.isActivated("left_arrow");
        let wantsToScrollRight = USER_INPUT_MANAGER.isActivated("right_arrow");

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

    isFollowingAnEntity(){
        return this.getFollowedEntity() != null;
    }

    getFollowedEntity(){
        return this.followedEntity;
    }

    stopFollowing(){
        this.x = this.followedEntity.getInterpolatedCenterX();
        this.y = this.followedEntity.getInterpolatedCenterY();
        this.followedEntity = null;
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
        this.checkSnap();
        this.checkScrollTroops();
    }

    display(){
        if (this.isFollowingAnEntity()){
            this.followedEntity.displayWhenFocused();
        }
    }
}