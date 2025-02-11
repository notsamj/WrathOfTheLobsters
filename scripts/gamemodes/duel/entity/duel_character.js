/*  
    Class Name: DuelCharacter
    Class Description: A character taking 
*/
class DuelCharacter extends Character {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                The duel instance
            model:
                The character model (String)
            extraDetails:
                Extra details about the character (JSON)
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, model, extraDetails){
        super(gamemode, model);
        this.invincible = extraDetails["invincible"];
        this.swayCompensationAbility = extraDetails["sway_compensation_ability"];
    }

    /*
        Method Name: damage
        Method Parameters: 
            amount:
                Amount of damage for character to sustain
        Method Description: Takes damage
        Method Return: void
    */
    damage(amount){
        if (!this.invincible){
            super.damage(amount);
        }
    }

    /*
        Method Name: getSwayCompensationAbility
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getSwayCompensationAbility(){
        return this.swayCompensationAbility;
    }

    /*
        Method Name: getShot
        Method Parameters: 
            model:
                The character model
            killerID:
                The ID of the shooter (would-be killer)
        Method Description: Handles the character being shot
        Method Return: void
    */
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

    /*
        Method Name: getStabbed
        Method Parameters: 
            stabItem:
                A musket
        Method Description: Handles getting stabbed by a musket
        Method Return: void
    */
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

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Acts on decisions
        Method Return: void
    */
    actOnDecisions(){
        // Can't act after the game ends
        if (this.gamemode.isOver()){ return; }
        super.actOnDecisions();
    }
}