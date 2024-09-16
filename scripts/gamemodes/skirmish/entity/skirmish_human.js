class SkirmishHuman extends SkirmishCharacter {
    constructor(gamemode, model, rank, team){
        super(gamemode, model, rank, team);
        this.inventory = new HumanInventory(); // FAKE-INTERFACE HumanPlayer
        this.usingTeamCamera = false;
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