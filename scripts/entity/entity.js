/*  
    Class Name: Entity
    Class Description: Am entity in the game
*/
class Entity extends VisualItem {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                A gamemode containing the entity
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, width=WTL_GAME_DATA["general"]["tile_size"], height=WTL_GAME_DATA["general"]["tile_size"]){
        super(width, height);
        this.gamemode = gamemode;
        this.id = null;
        this.dead = false;
    }

    /*
        Method Name: setDead
        Method Parameters: 
            value:
                A boolean value for the death state
        Method Description: Setter
        Method Return: Setter
    */
    setDead(value){
        this.dead = value;
    }

    /*
        Method Name: setAlive
        Method Parameters: 
            value:
                A boolean value for the alive state
        Method Description: Setter
        Method Return: Setter
    */
    setAlive(value){
        this.setDead(!value);
    }

    /*
        Method Name: couldSeeEntityIfOnTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if the character could see an entity on a given tile
        Method Return: Boolean, yes -> could see, false -> no could not see
    */
    couldSeeEntityIfOnTile(){ throw new Error("Expect this to be overridden."); }

    /*
        Method Name: isHuman
        Method Parameters: None
        Method Description: Checks if the entity is a controlled by a human
        Method Return: Boolean, true -> is human, false -> is not human
    */
    isHuman(){
        return false; // default
    }

    
    /*
        Method Name: is
        Method Parameters: 
            otherEntity:
                Another enttiy
        Method Description: Checks if this entity is another entity
        Method Return: Boolean, true -> is, false -> is not
    */
    is(otherEntity){
        return this.getID() === otherEntity.getID();
    }

    /*
        Method Name: die
        Method Parameters: None
        Method Description: Kills an entity
        Method Return: void
    */
    die(){
        this.dead = true;
    }

    /*
        Method Name: isAlive
        Method Parameters: None
        Method Description: Checks if an entity is alive
        Method Return: Boolean
    */
    isAlive(){
        return !this.isDead();
    }

    /*
        Method Name: isDead
        Method Parameters: None
        Method Description: Checks if an entity is dead
        Method Return: Boolean
    */
    isDead(){
        return this.dead;
    }

    /*
        Method Name: getScene
        Method Parameters: None
        Method Description: Gets the scene from the gamemode
        Method Return: WTLGameScene
    */
    getScene(){
        return this.gamemode.getScene();
    }

    /*
        Method Name: setID
        Method Parameters: 
            id:
                A new id
        Method Description: Setter
        Method Return: Setter
    */
    setID(id){
        this.id = id; 
    }

    /*
        Method Name: getID
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getID(){
        return this.id;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Placeholder dud for actions to take during a tick
        Method Return: void
    */
    tick(){}

    /*
        Method Name: hasVisionRestrictions
        Method Parameters: None
        Method Description: Checks if an entity has vision restrictions
        Method Return: Boolean
    */
    hasVisionRestrictions(){
        return false;
    }

    /*
        Method Name: displayWhenFocused
        Method Parameters: None
        Method Description: Placeholder dud
        Method Return: void
    */
    displayWhenFocused(){}

    /*
        Method Name: getGamemode
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getGamemode(){
        return this.gamemode;
    }
}