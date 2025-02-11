/*  
    Class Name: WhiteFlag
    Class Description: A white flag to signal a passed turn
*/
class WhiteFlag extends Sword {
    /*
        Method Name: constructor
        Method Parameters: 
            details:
                JSON object with information
        Method Description: constructor
        Method Return: constructor
    */
    constructor(details){
        super("white_flag", details);
    }

    /*
        Method Name: finishSwing
        Method Parameters: None
        Method Description: Finishes the swing
        Method Return: void
    */
    finishSwing(){
        this.player.commitToAction();
        super.finishSwing();
        this.player.indicateMoveDone();
    }
}