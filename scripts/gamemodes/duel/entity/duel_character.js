class DuelCharacter extends Character {
    constructor(gamemode, model){
        super(gamemode, model);
    }

    getShot(model, killerID){
        let damage = RETRO_GAME_DATA["duel"]["shot_damage"];
        this.damage(damage);
        // Assumes not dead prior to damage
        if (this.isDead()){
            this.gamemode.getEventHandler().emit({
                "victim_class": this.getModel(),
                "killer_class": model,
                "killer_id": killerID,
                "tile_x": this.getTileX(),
                "tile_y": this.getTileY(),
                "name": "kill"
            });
        }
    }

    actOnDecisions(){
        // Can't act after the game ends
        if (this.gamemode.isOver()){ return; }
        super.actOnDecisions();
    }
}