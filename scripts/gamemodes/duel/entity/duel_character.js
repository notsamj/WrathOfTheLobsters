class DuelCharacter extends Character {
    constructor(gamemode, model){
        super(gamemode, model);
    }

    actOnDecisions(){
        // Can't act after the game ends
        if (this.gamemode.isOver()){ return; }
        super.actOnDecisions();
    }
}