/*
    Class Name: Gamemode
    Description: Abstract class for a game mode
*/
class Gamemode {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */    
    constructor(){
        this.scene = new WTLGameScene();
        this.eventHandler = new NSEventHandler();
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getName(){throw new Error("Expect this to be implemented.")}

    /*
        Method Name: handleUnpause
        Method Parameters: None
        Method Description: May or may not be implemeneted. Handles actions on unpause
        Method Return: void
    */
    handleUnpause(){}

    /*
        Method Name: getCurrentTick
        Method Parameters: None
        Method Description: Gets the current tick
        Method Return: int [0,inf)
    */
    getCurrentTick(){
        return GAME_TICK_SCHEDULER.getNumTicks();
    }

    /*
        Method Name: getEventHandler
        Method Parameters: None
        Method Description: Getter
        Method Return: NSEventHandler
    */
    getEventHandler(){
        return this.eventHandler;
    }

    /*
        Method Name: getScene
        Method Parameters: None
        Method Description: Getter
        Method Return: WTLGameScene
    */
    getScene(){
        return this.scene;
    }
    
    // Abstract
    /*
        Method Name: tick
        Method Parameters: None
        Method Description: dud. Actions during a tick
        Method Return: void
    */
    tick(){throw new Error("Expect to be implemented")}
    // Sort of like a destructor
    /*
        Method Name: end
        Method Parameters: None
        Method Description: Handles actions on end. Optional.
        Method Return: void
    */
    end(){}
    /*
        Method Name: isDisplayingPhysicalLayer
        Method Parameters: None
        Method Description: Checks if the physical layer is being displayed
        Method Return: boolean
    */
    isDisplayingPhysicalLayer(){}
}
// If using NodeJS then export the class
if (typeof window === "undefined"){
    module.exports = Gamemode;
}