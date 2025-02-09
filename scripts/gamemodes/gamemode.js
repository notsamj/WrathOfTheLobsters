// If using NodeJS -> Load some required classes
if (typeof window === "undefined"){
}
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

    getName(){throw new Error("Expect this to be implemented.")}

    handleUnpause(){}

    getCurrentTick(){
        return GAME_TICK_SCHEDULER.getNumTicks();
    }

    getEventHandler(){
        return this.eventHandler;
    }

    getScene(){
        return this.scene;
    }
    
    // Abstract
    tick(){}
    // Sort of like a destructor
    end(){}
    isDisplayingPhysicalLayer(){}
}
// If using NodeJS then export the class
if (typeof window === "undefined"){
    module.exports = Gamemode;
}