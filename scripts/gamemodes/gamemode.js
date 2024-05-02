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
    }

    getScene(){
        return this.scene;
    }

    unpause(){
        // TODO
    }
    
    // Abstract
    tick(){}
}
// If using NodeJS then export the class
if (typeof window === "undefined"){
    module.exports = Gamemode;
}