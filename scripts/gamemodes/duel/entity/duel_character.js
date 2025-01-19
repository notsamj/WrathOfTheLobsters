class DuelCharacter extends Character {
    constructor(gamemode, model, extraDetails){
        super(gamemode, model);
        this.invincible = extraDetails["invincible"];
        this.swayCompensationAbility = extraDetails["sway_compensation_ability"];
    }

    damage(amount){
        if (!this.invincible){
            super.damage(amount);
        }
    }

    getSwayCompensationAbility(){
        return this.swayCompensationAbility;
    }

    getShot(model, killerID){
        let damage = WTL_GAME_DATA["duel"]["shot_damage"];
        this.damage(damage);
        // Assumes not dead prior to damage
        if (this.isDead()){
            this.gamemode.getEventHandler().emit({
                "victim_class": this.getModel(),
                "killer_class": model,
                "killer_id": killerID,
                "tile_x": this.getTileX(),
                "tile_y": this.getTileY(),
                "center_x": this.getInterpolatedTickCenterX(),
                "center_y": this.getInterpolatedTickCenterY(),
                "name": "kill"
            });
        }
    }

    getStabbed(stabItem){
        // Only accept muskets
        if (!(stabItem instanceof Musket)){
            throw new Error("Unknown stab item: " + stabItem.toString());
        }
        let damage = WTL_GAME_DATA["duel"]["musket_stab_damage"];
        this.damage(damage);
        // Assumes not dead prior to damage
        if (this.isDead()){
            this.gamemode.getEventHandler().emit({
                "victim_class": this.getModel(),
                "killer_class": stabItem.getPlayer().getModel(),
                "killer_id": stabItem.getPlayer().getID(),
                "tile_x": this.getTileX(),
                "tile_y": this.getTileY(),
                "center_x": this.getInterpolatedTickCenterX(),
                "center_y": this.getInterpolatedTickCenterY(),
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