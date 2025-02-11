/*  
    Class Name: SkirmishHuman
    Class Description: A human-controlled character taking part in a skirmish
*/
class SkirmishHuman extends SkirmishCharacter {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                The Skirmish gamemode.
            model:
                The character's model. String
            rankName:
                The name of the character's rank. String.
            team:
                The name of the team the character is on. String
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, model, rank, team){
        super(gamemode, model, rank, team);
        this.usingTeamCamera = false;
        this.toggleModeLock = new Lock();
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Make decisions
        Method Return: void
    */
    makeDecisions(){
        this.resetDecisions();
        if (this.isMakingAMove() && !this.hasCommitedToAction()){ 
            this.makeMovementDecisions();
            this.inventory.makeDecisions();
            if (this.inventory.hasSelectedItem()){
                this.inventory.getSelectedItem().makeDecisions();
            }
        }else{
            this.checkForOfficerCommand();
        }
    }

    /*
        Method Name: makeShootPointerDecisions
        Method Parameters: None
        Method Description: Check if the player would like to do something with the shoot pointer
        Method Return: void
    */
    makeShootPointerDecisions(){
        // Reset
        this.amendDecisions({
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "trying_to_shoot": false,
            "new_crosshair_center": false
        });
        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        this.amendDecisions({
            "crosshair_center_x": engineX,
            "crosshair_center_y": engineY,
            "trying_to_shoot": GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "new_crosshair_center": true
        });
    }

    /*
        Method Name: makeCannonPointerDecisions
        Method Parameters: None
        Method Description: Check if the user wishes to use their cannon pointer
        Method Return: void
    */
    makeCannonPointerDecisions(){
        // Reset
        this.amendDecisions({
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "trying_to_shoot": false,
            "new_crosshair_center": false
        });
        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        this.amendDecisions({
            "crosshair_center_x": engineX,
            "crosshair_center_y": engineY,
            "trying_to_shoot": GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "new_crosshair_center": true
        });
    }

    /*
        Method Name: makeInventoryDecisions
        Method Parameters: None
        Method Description: Makes decisions relating to the inventory
        Method Return: void
    */
    makeInventoryDecisions(){
        // Reset
        this.amendDecisions({
            "select_slot": this.inventory.getSelectedSlot(),
        });
        let newSlot = this.selectedSlot;
        if (GAME_USER_INPUT_MANAGER.isActivated("1_ticked")){
            newSlot = 0;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("2_ticked")){
            newSlot = 1;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("3_ticked")){
            newSlot = 2;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("4_ticked")){
            newSlot = 3;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("5_ticked")){
            newSlot = 4;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("6_ticked")){
            newSlot = 5;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("7_ticked")){
            newSlot = 6;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("8_ticked")){
            newSlot = 7;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("9_ticked")){
            newSlot = 8;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("0_ticked")){
            newSlot = 9;
        }
        if (newSlot == this.selectedSlot){ return; }
        this.amendDecisions({
            "select_slot": newSlot
        });
    }

    /*
        Method Name: makeSwordDecisions
        Method Parameters: None
        Method Description: Makes decisions for the sword
        Method Return: void
    */
    makeSwordDecisions(){
        let tryingToSwing = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
        });
    }

    /*
        Method Name: isHuman
        Method Parameters: None
        Method Description: Checks if human
        Method Return: boolean
    */
    isHuman(){return true;}

    /*
        Method Name: makePistolDecisions
        Method Parameters: None
        Method Description: Makes decisions on shooting the pistol
        Method Return: void
    */
    makePistolDecisions(){
        let tryingToAim = GAME_USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let tryingToReload = GAME_USER_INPUT_MANAGER.isActivated("r_ticked");
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    /*
        Method Name: makeMusketDecisions
        Method Parameters: None
        Method Description: Makes decisions about using the musket
        Method Return: void
    */
    makeMusketDecisions(){
        let tryingToAim = GAME_USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let togglingBayonetEquip = GAME_USER_INPUT_MANAGER.isActivated("b_ticked");
        let tryingToReload = GAME_USER_INPUT_MANAGER.isActivated("r_ticked");
        let tryingToStab = GAME_USER_INPUT_MANAGER.isActivated("middle_click");
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "toggling_bayonet_equip": togglingBayonetEquip,
            "trying_to_reload": tryingToReload,
            "trying_to_stab": tryingToStab,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    /*
        Method Name: makeMovePointerDecisions
        Method Parameters: None
        Method Description: Makes decisions for moving troops around
        Method Return: void
    */
    makeMovePointerDecisions(){
        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        let newPlacerTileX = WTLGameScene.getTileXAt(engineX);
        let newPlacerTileY = WTLGameScene.getTileYAt(engineY);
        let tryingToToggleMode = GAME_USER_INPUT_MANAGER.isActivated("m_ticked");
        let toggleMode = tryingToToggleMode && this.toggleModeLock.isUnlocked();
        if (!tryingToToggleMode){
            this.toggleModeLock.unlock();
        }
        if (toggleMode){
            this.toggleModeLock.lock();
        }
        this.amendDecisions({
            "move_tile_x": newPlacerTileX,
            "move_tile_y": newPlacerTileY,
            "trying_to_move_troops": GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "toggle_mode": toggleMode,
            "new_move_tile": true
        });
    }

    /*
        Method Name: getGunHoldingAngleRAD
        Method Parameters: None
        Method Description: Determing the angle of shooting
        Method Return: float [0,2*PI)
    */
    getGunHoldingAngleRAD(){
        return getAngleFromMouseToScreenCenter(this.getScene());
    }

    /*
        Method Name: indicateMoveDone
        Method Parameters: None
        Method Description: Indicates that the move is done
        Method Return: void
    */
    indicateMoveDone(){
        super.indicateMoveDone();
        this.usingTeamCamera = false;
    }

    /*
        Method Name: isUsingTeamCamera
        Method Parameters: None
        Method Description: Check if the character is operating the team camera
        Method Return: boolean
    */
    isUsingTeamCamera(){
        return this.usingTeamCamera;
    }

    /*
        Method Name: getTeamCamera
        Method Parameters: None
        Method Description: Gets the team camera
        Method Return: SkirmishCamera
    */
    getTeamCamera(){
        return this.gamemode.getTeamCamera(this.getTeamName());
    }

    /*
        Method Name: getInterpolatedX
        Method Parameters: None
        Method Description: Determines the current x for display
        Method Return: float
    */
    getInterpolatedX(){
        if (this.isUsingTeamCamera()){
            return this.getTeamCamera().getInterpolatedX();
        }
        return super.getInterpolatedX();
    }
    
    /*
        Method Name: getInterpolatedY
        Method Parameters: None
        Method Description: Determines the current y for display
        Method Return: float
    */
    getInterpolatedY(){
        if (this.isUsingTeamCamera()){
            return this.getTeamCamera().getInterpolatedY();
        }
        return super.getInterpolatedY();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Performes processes during a tick
        Method Return: void
    */
    tick(){
        this.checkSwitchToTeamCamera();
        if (this.isUsingTeamCamera()){
            this.getTeamCamera().tick();
        }else{
            super.tick();
        }
    }

    /*
        Method Name: checkSwitchToTeamCamera
        Method Parameters: None
        Method Description: Check if the user is trying to switch to the team camera
        Method Return: void
    */
    checkSwitchToTeamCamera(){
        if (!this.isMakingAMove()){ return; }
        if (GAME_USER_INPUT_MANAGER.isActivated("ticked_toggle_camera") && !this.isMoving() && !this.hasCommitedToAction()){
            if (this.usingTeamCamera){
                this.usingTeamCamera = false;
            }else{
                let teamCamera = this.getTeamCamera();
                teamCamera.setPosition(this.getInterpolatedX(), this.getInterpolatedY());
                this.usingTeamCamera = true;
            }
        }
    }

    /*
        Method Name: makeMovementDecisions
        Method Parameters: None
        Method Description: Makes decisions for moving
        Method Return: void
    */
    makeMovementDecisions(){
        if (this.hasCommitedToAction()){ return; }
        this.decisions["up"] = GAME_USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = GAME_USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = GAME_USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = GAME_USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = GAME_USER_INPUT_MANAGER.isActivated("sprint");
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
        Method Description: Displays the character
        Method Return: void
    */
    display(lX, rX, bY, tY){
        if (this.isUsingTeamCamera()){ return; }
        super.display(lX, rX, bY, tY);
    }
}