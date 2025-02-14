/*
    Class Name: BasicFadingEffect
    Class Description: A simple facing effect abstract class
*/
class BasicFadingEffect {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
    }

    /*
        Method Name: getYCategory
        Method Parameters: None
        Method Description: abstract
        Method Return: error
        Method Note: "ground", "air", ...?
    */
    getYCategory(){ throw new Error("Expect this to be overridden."); }

    /*
        Method Name: display
        Method Parameters: 
            scene:
                The relevant scene
            lX:
                The x coordinate on the left of the screen
            rX:
                The x coordinate on the right of the screen
            bY:
                The y coordinate at the bottom of the screen
            tY:
                The y coordinate at the top of the screen
        Method Description: abstract
        Method Return: error
    */
    display(scene, lX, rX, bY, tY){
        throw new Error("Expect this to be overridden.");
    }

    /*
        Method Name: touchesRegion
        Method Parameters: 
            lX:
                The x coordinate on the left of the region
            rX:
                The x coordinate on the right of the region
            bY:
                The y coordinate at the bottom of the region
            tY:
                The y coordinate at the top of the region
        Method Description: abstract
        Method Return: error
    */
    touchesRegion(lX, rX, bY, tY){
        throw new Error("Expect this to be overridden.");
    }

    /*
        Method Name: isExpired
        Method Parameters: None
        Method Description: abstract
        Method Return: error
    */
    isExpired(){
        throw new Error("Expect this to be overridden.");
    }
}