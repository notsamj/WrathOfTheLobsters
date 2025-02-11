/*  
    Class Name: SkirmishPistol
    Class Description: A pistol used in a skirmish
*/
class SkirmishPistol extends Pistol {
    /*
        Method Name: constructor
        Method Parameters: 
            model:
                pistol model
            details:
                Extra pistol details JSON
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
        return super.isAiming() && !this.player.hasCommitedToAction();
    }

    /*
        Method Name: shoot
        Method Parameters: None
        Method Description: Shoots
        Method Return: void
    */
    shoot(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        this.player.commitToAction();
        super.shoot();
        this.reloaded = true;
        this.player.indicateMoveDone();
    }
}