/*
    Class Name: Item
    Class Description: An item
*/
class Item {
    /*
        Method Name: select
        Method Parameters: None
        Method Description: default handler for item selection
        Method Return: void
    */
    select(){}
    /*
        Method Name: deselect
        Method Parameters: None
        Method Description: default handler for item deselection
        Method Return: void
    */
    deselect(){}
    /*
        Method Name: displayItemSlot
        Method Parameters: 
            providedX:
                The x location to display at
            providedY:
                The y location to display at
        Method Description: default handler for item display in item slot
        Method Return: void
    */
    displayItemSlot(providedX, providedY){}
    /*
        Method Name: display
        Method Parameters: 
            lX:
                The left x of the screen
            bY:
                The bottom y of the screen
        Method Description: default handler for item display
        Method Return: void
    */
    display(lX, bY){}
    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: default handler for item decision making
        Method Return: void
    */
    makeDecisions(){}
    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: default handler for item decision acting
        Method Return: void
    */
    actOnDecisions(){}
    /*
        Method Name: getDecisions
        Method Parameters: None
        Method Description: Default method for getting item decisions
        Method Return: JSON
    */
    getDecisions(){ return {}; }
    /*
        Method Name: getDecision
        Method Parameters: 
            decisionName:
                The name of the decision (string)
        Method Description: Asks the player for a decision
        Method Return: Varaible
    */
    getDecision(decisionName){
        return this.player.getDecision(decisionName);
    }
    /*
        Method Name: getGamemode
        Method Parameters: None
        Method Description: Gets the gamemode from the player
        Method Return: void
    */
    getGamemode(){
        return this.player.getGamemode();
    }
    /*
        Method Name: breakAction
        Method Parameters: None
        Method Description: Default method for breaking the current action
        Method Return: void
    */
    breakAction(){}
    /*
        Method Name: displayUIAssociated
        Method Parameters: None
        Method Description: Default method for displaying item associated ui
        Method Return: void
    */
    displayUIAssociated(){}
    /*
        Method Name: reset
        Method Parameters: None
        Method Description: abstract method for resetting an item
        Method Return: error
    */
    reset(){ throw new Error("Expect this to be overwritten.")}
}