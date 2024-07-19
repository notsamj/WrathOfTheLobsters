class SkirmishMusket extends Musket {
    constructor(model, details){
        super(model, details);
    }

    isAiming(){
        return this.isAiming() && !this.player.hasCommitedToAction();
    }

    shoot(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        this.player.commitToAction();
        super.shoot();
        this.reloaded = true;
        this.player.indicateMoveDone();
    }

    unequipBayonet(){
        // Note: Disabled because atm there is no reason to unequip bayonet
        /*
        super.unequipBayonet();
        this.player.indicateMoveDone();
        */
    }

    equipBayonet(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        this.player.commitToAction();
        super.equipBayonet();
        this.player.indicateMoveDone();
    }

    finishStab(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        this.player.commitToAction();
        super.finishStab();
        this.player.indicateMoveDone();
    }
}