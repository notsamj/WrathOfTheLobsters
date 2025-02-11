/*  
    Class Name: SkirmishSword
    Class Description: A sword using in the skirmish
*/
class SkirmishSword extends Sword {
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
        Method Name: startSwing
        Method Parameters: None
        Method Description: Starts a sword swing
        Method Return: void
    */
    startSwing(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        super.startSwing();
    }

    /*
        Method Name: finishSwing
        Method Parameters: None
        Method Description: Finishes as word swing
        Method Return: void
    */
    finishSwing(){
        // Note: No need for hasCommitedToAction check because startSwing checks it and finishSwing would not be reached if user had commited to another action
        this.player.commitToAction();
        super.finishSwing();
        this.player.indicateMoveDone();
    }

    /*
        Method Name: getSwingDamage
        Method Parameters: None
        Method Description: Gets the swing damage
        Method Return: void
    */
    getSwingDamage(){
        return WTL_GAME_DATA["skirmish"]["stab_damage"];
    }
}