class SkirmishCharacter extends Character {
    constructor(gamemode, model, team){
        super(gamemode, model);
        this.makingMove = false;
        this.moveDone = false;
        this.team = team;
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
        this.moveDone = false;
    }

    isMoveDone(){
        return this.moveDone;
    }
}