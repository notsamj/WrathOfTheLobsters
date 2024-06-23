class SkirmishCharacter extends Character {
    constructor(gamemode, model, team){
        super(gamemode, model);
        this.makingMove = false;
        this.moveDone = false;
        this.team = team;
    }

    tick(){
        this.lookingDetails["look_lock"].tick();
        this.inventory.tickSelectedItem();

        if (!this.isMakingAMove()){ return; }
        this.makeDecisions();
        this.actOnDecisions();
    }

    getTeam(){
        return this.team;
    }

    isOnSameTeam(otherCharacter){
        return this.getTeam() == otherCharacter.getTeam();
    }

    isVisibleTo(observer){
        return observer.isOnSameTeam(this) || this.gamemode.visibleToTeam(observer.getTeam(), this.getTeam(), this.getID());
    }

    isVisibleToSuper(observer){
        return super.isVisibleTo(observer);
    }
    
    isMakingAMove(){
        return this.makingMove;
    }

    indicateTurn(){
        this.makingMove = true;
    }

    isMoveDone(){
        return this.moveDone;
    }

    indicateHasShot(){
        this.moveDone = true;
        this.makingMove = false;
    }

    acceptMoveDone(){
        this.moveDone = false;
    }

    makeDecisions(){
        this.resetDecisions();
        this.makeMovementDecisions();
    }

    makeMovementDecisions(){
        this.decisions["up"] = USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = USER_INPUT_MANAGER.isActivated("sprint");
    }
}