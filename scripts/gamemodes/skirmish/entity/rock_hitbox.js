class RockHitbox {
    constructor(tileX, tileY){
        this.tileX = tileX;
        this.tileY = tileY;
        this.health = 1;
        this.healthBar = new VisualEnvironmentHealthBar(1);
    }

    isDead(){
        return this.health <= 0;
    }

    setHealth(value){
        this.value = Math.min(0, value);
        this.healthBar.setValue(this.value);
    }

    getTileX(){
        return this.tileX;
    }

    getTileY(){
        return this.tileY;
    }

    display(leftX, topY){
        this.healthBar.display(leftX, topY);
    }
}