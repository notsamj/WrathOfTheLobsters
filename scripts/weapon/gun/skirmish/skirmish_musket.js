class SkirmishMusket extends Musket {
    constructor(model, details){
        super(model, details);
    }

    shoot(){
        super.shoot();
        this.reloaded = true;
        this.player.indicateMoveDone();
    }

    unequipBayonet(){
        super.unequipBayonet();
        this.player.indicateMoveDone();
    }

    equipBayonet(){
        super.equipBayonet();
        this.player.indicateMoveDone();
    }

    finishStab(){
        super.finishStab();
        this.player.indicateMoveDone();
    }
}