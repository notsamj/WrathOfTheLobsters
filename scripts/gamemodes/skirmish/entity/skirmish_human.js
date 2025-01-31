class SkirmishHuman extends SkirmishCharacter {
    constructor(gamemode, model, rank, team){
        super(gamemode, model, rank, team);
        this.usingTeamCamera = false;
        this.toggleModeLock = new Lock();
    }

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
            "trying_to_shoot": USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "new_crosshair_center": true
        });
    }

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
            "trying_to_shoot": USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "new_crosshair_center": true
        });
    }

    makeInventoryDecisions(){
        // Reset
        this.amendDecisions({
            "select_slot": this.inventory.getSelectedSlot(),
        });
        let newSlot = this.selectedSlot;
        if (USER_INPUT_MANAGER.isActivated("1_ticked")){
            newSlot = 0;
        }else if (USER_INPUT_MANAGER.isActivated("2_ticked")){
            newSlot = 1;
        }else if (USER_INPUT_MANAGER.isActivated("3_ticked")){
            newSlot = 2;
        }else if (USER_INPUT_MANAGER.isActivated("4_ticked")){
            newSlot = 3;
        }else if (USER_INPUT_MANAGER.isActivated("5_ticked")){
            newSlot = 4;
        }else if (USER_INPUT_MANAGER.isActivated("6_ticked")){
            newSlot = 5;
        }else if (USER_INPUT_MANAGER.isActivated("7_ticked")){
            newSlot = 6;
        }else if (USER_INPUT_MANAGER.isActivated("8_ticked")){
            newSlot = 7;
        }else if (USER_INPUT_MANAGER.isActivated("9_ticked")){
            newSlot = 8;
        }else if (USER_INPUT_MANAGER.isActivated("0_ticked")){
            newSlot = 9;
        }
        if (newSlot == this.selectedSlot){ return; }
        this.amendDecisions({
            "select_slot": newSlot
        });
    }

    makeSwordDecisions(){
        let tryingToSwing = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
        });
    }

    isHuman(){return true;}

    makePistolDecisions(){
        let tryingToAim = USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let tryingToReload = USER_INPUT_MANAGER.isActivated("r_ticked");
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    makeMusketDecisions(){
        let tryingToAim = USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let togglingBayonetEquip = USER_INPUT_MANAGER.isActivated("b_ticked");
        let tryingToReload = USER_INPUT_MANAGER.isActivated("r_ticked");
        let tryingToStab = USER_INPUT_MANAGER.isActivated("middle_click");
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "toggling_bayonet_equip": togglingBayonetEquip,
            "trying_to_reload": tryingToReload,
            "trying_to_stab": tryingToStab,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    makeMovePointerDecisions(){
        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        let newPlacerTileX = WTLGameScene.getTileXAt(engineX);
        let newPlacerTileY = WTLGameScene.getTileYAt(engineY);
        let tryingToToggleMode = USER_INPUT_MANAGER.isActivated("m_ticked");
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
            "trying_to_move_troops": USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "toggle_mode": toggleMode,
            "new_move_tile": true
        });
    }

    getGunHoldingAngleRAD(){
        return getAngleFromMouseToScreenCenter(this.getScene());
    }

    indicateMoveDone(){
        super.indicateMoveDone();
        this.usingTeamCamera = false;
    }

    isUsingTeamCamera(){
        return this.usingTeamCamera;
    }

    getTeamCamera(){
        return this.gamemode.getTeamCamera(this.getTeamName());
    }

    getInterpolatedX(){
        if (this.isUsingTeamCamera()){
            return this.getTeamCamera().getInterpolatedX();
        }
        return super.getInterpolatedX();
    }
    
    getInterpolatedY(){
        if (this.isUsingTeamCamera()){
            return this.getTeamCamera().getInterpolatedY();
        }
        return super.getInterpolatedY();
    }

    tick(){
        this.checkSwitchToTeamCamera();
        if (this.isUsingTeamCamera()){
            this.getTeamCamera().tick();
        }else{
            super.tick();
        }
    }

    checkSwitchToTeamCamera(){
        if (!this.isMakingAMove()){ return; }
        if (USER_INPUT_MANAGER.isActivated("ticked_toggle_camera") && !this.isMoving() && !this.hasCommitedToAction()){
            if (this.usingTeamCamera){
                this.usingTeamCamera = false;
            }else{
                let teamCamera = this.getTeamCamera();
                teamCamera.setPosition(this.getInterpolatedX(), this.getInterpolatedY());
                this.usingTeamCamera = true;
            }
        }
    }

    makeMovementDecisions(){
        if (this.hasCommitedToAction()){ return; }
        this.decisions["up"] = USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = USER_INPUT_MANAGER.isActivated("sprint");
    }

    display(lX, rX, bY, tY){
        if (this.isUsingTeamCamera()){ return; }
        super.display(lX, rX, bY, tY);
    }
}