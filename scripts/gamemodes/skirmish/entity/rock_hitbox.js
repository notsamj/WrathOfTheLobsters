class RockHitbox {
    constructor(tileX, tileY){
        this.tileX = tileX;
        this.tileY = tileY;
        this.healthBar = new VisualEnvironmentHealthBar(1);
    }

    isAlive(){
        return !this.isDead();
    }

    isDead(){
        return this.healthBar.getValue() <= 0;
    }

    getHealth(){
        return this.healthBar.getValue();
    }

    setHealth(value){
        this.healthBar.setValue(value);
    }

    damage(value){
        this.setHealth(this.healthBar.getValue() - value);
    }

    getTileX(){
        return this.tileX;
    }

    getTileY(){
        return this.tileY;
    }

    display(leftX, topY){
        if (this.isDead()){ return; }
        this.healthBar.display(leftX + RETRO_GAME_DATA["general"]["tile_size"]/2, topY + RETRO_GAME_DATA["general"]["tile_size"]/2);
    }
}