class DuelBot extends DuelCharacter {
    constructor(gamemode, model){
        super(gamemode, model);
    }
    
    isHuman(){ return false; }
}