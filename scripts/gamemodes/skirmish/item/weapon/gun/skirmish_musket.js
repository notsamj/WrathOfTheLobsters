/*  
    Class Name: SkirmishMusket
    Class Description: A musket used in a skirmish
*/
class SkirmishMusket extends Musket {
    /*
        Method Name: constructor
        Method Parameters: 
            model:
                Musket model
            details:
                Extra musket details JSON
        Method Description: constructor
        Method Return: constructor
    */
    constructor(model, details){
        super(model, details);
    }

    /*
        Method Name: isAiming
        Method Parameters: None
        Method Description: Checks if aiming
        Method Return: boolean
    */
    isAiming(){
        let superTryingToAim = super.isAiming();
        let tryingToAimDuringTurn = superTryingToAim && !this.player.hasCommitedToAction();
        if (this.player.isMakingAMove()){
            return tryingToAimDuringTurn;
        }else{ // Else if not making a move, then if super thinks its aiming, then must be by officer command
            return superTryingToAim;
        }
    }

    /*
        Method Name: shoot
        Method Parameters: None
        Method Description: Shoots
        Method Return: void
    */
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

    /*
        Method Name: unequipBayonet
        Method Parameters: None
        Method Description: Unequips the bayonet
        Method Return: void
    */
    unequipBayonet(){
        // Note: Disabled because atm there is no reason to unequip bayonet
        /*
        super.unequipBayonet();
        this.player.indicateMoveDone();
        */
    }

    /*
        Method Name: equipBayonet
        Method Parameters: None
        Method Description: equips the bayonet
        Method Return: void
    */
    equipBayonet(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        this.player.commitToAction();
        super.equipBayonet();
        this.player.indicateMoveDone();
    }

    /*
        Method Name: finishStab
        Method Parameters: None
        Method Description: finishes a stab
        Method Return: void
    */
    finishStab(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        this.player.commitToAction();
        super.finishStab();
        this.player.indicateMoveDone();
    }
}