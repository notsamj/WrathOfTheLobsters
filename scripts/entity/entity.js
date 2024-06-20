class Entity extends VisualItem {
    constructor(gamemode, width=RETRO_GAME_DATA["general"]["tile_size"], height=RETRO_GAME_DATA["general"]["tile_size"]){
        super(width, height);
        this.gamemode = gamemode;
        this.id = null;
        this.dead = false;
    }

    die(){
        this.dead = true;
    }

    isAlive(){
        return !this.dead;
    }

    isDead(){
        return this.dead;
    }

    getScene(){
        return this.gamemode.getScene();
    }

    setID(id){
        this.id = id; 
    }

    getID(){
        return this.id;
    }

    tick(){}

    hasVisionRestrictions(){
        return false;
    }
}