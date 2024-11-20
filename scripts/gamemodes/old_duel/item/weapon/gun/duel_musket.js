class SkirmishMusket extends Musket {
    constructor(model, details){
        super(model, details);
    }

    isAiming(){
        let superTryingToAim = super.isAiming();
        let tryingToAimDuringTurn = superTryingToAim && !this.player.hasCommitedToAction();
        if (this.player.isMakingAMove()){
            return tryingToAimDuringTurn;
        }else{ // Else if not making a move, then if super thinks its aiming, then must be by officer command
            return superTryingToAim;
        }
    }

    shoot(){
        // Two choices

        // Choice 1 making a move
        if (this.player.isMakingAMove()){
            if (this.player.hasCommitedToAction()){
                return;
            }
            this.player.commitToAction();
            super.shoot();
            this.reloaded = true;
            this.player.indicateMoveDone();
        }
        // Choice 2 ordered by officer
        else{
            super.shoot();
            this.reloaded = true;
        }
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