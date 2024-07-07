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
        this.scene = new RetroGameScene();
        this.eventHandler = new NSEventHandler();
    }

    getEventHandler(){
        return this.eventHandler;
    }

    getScene(){
        return this.scene;
    }
    
    // Abstract
    tick(){}
    end(){}
    isDisplayingPhysicalLayer(){}
}
// If using NodeJS then export the class
if (typeof window === "undefined"){
    module.exports = Gamemode;
}