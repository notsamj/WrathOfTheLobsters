/*
    Class Name: RockHitbox
    Class Description: The hitbox of a rock
*/
class RockHitbox {
    /*
        Method Name: constructor
        Method Parameters: 
            tileX:
                tile x location
            tileY:
                tile y location
        Method Description: constructor
        Method Return: constructor
    */
    constructor(tileX, tileY){
        this.tileX = tileX;
        this.tileY = tileY;
        this.healthBar = new VisualEnvironmentHealthBar(1);
    }

    /*
        Method Name: isAlive
        Method Parameters: None
        Method Description: Checks if alive
        Method Return: boolean
    */
    isAlive(){
        return !this.isDead();
    }

    /*
        Method Name: isDead
        Method Parameters: None
        Method Description: Checks if dead
        Method Return: boolean
    */
    isDead(){
        return this.healthBar.getValue() <= 0;
    }

    /*
        Method Name: getHealth
        Method Parameters: None
        Method Description: Gets the health
        Method Return: float
    */
    getHealth(){
        return this.healthBar.getValue();
    }

    /*
        Method Name: setHealth
        Method Parameters: 
            value:
                New health value
        Method Description: Sets the health
        Method Return: void
    */
    setHealth(value){
        this.healthBar.setValue(value);
    }

    /*
        Method Name: damage
        Method Parameters: 
            value:
                Damage value
        Method Description: Reduces the health
        Method Return: void
    */
    damage(value){
        this.setHealth(this.healthBar.getValue() - value);
    }

    /*
        Method Name: getTileX
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getTileX(){
        return this.tileX;
    }

    /*
        Method Name: getTileY
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getTileY(){
        return this.tileY;
    }

    /*
        Method Name: display
        Method Parameters: 
            leftX:
                X at left of the screen
            topY:
                Y at top of the screen
        Method Description: Displays the rock hitbox
        Method Return: void
    */
    display(leftX, topY){
        if (this.isDead()){ return; }
        this.healthBar.display(leftX + WTL_GAME_DATA["general"]["tile_size"]/2, topY + WTL_GAME_DATA["general"]["tile_size"]/2);
    }
}