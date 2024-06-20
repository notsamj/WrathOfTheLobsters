/*
    Class Name: InfiniteLoopFinder
    Description: A class used to identifer loops that are running for too long
    Note: I don't think debugger exists in NodeJS so just gives a print and a console error. Should be fine
*/
class InfiniteLoopFinder {
    /*
        Method Name: constructor
        Method Parameters:
            infiniteAmount:
                The amount of looping required to launch the debugger 
            name:
                Name of this instance
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(infiniteAmount, name){
        this.infiniteAmount = infiniteAmount;
        this.name = name;
        this.loopCounter = 0;
    }

    /*
        Method Name: count
        Method Parameters: None
        Method Description: Determine if there has been too much iteration and if so then launch debugger
        Method Return: void
    */
    count(){
        if (this.loopCounter++ > this.infiniteAmount){
            console.log("Suspected infinite loop @ " + this.name);
            debugger;
        }
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Reset the counter
        Method Return: void
    */
    reset(){
        this.loopCounter = 0;
    }
}

// If using NodeJS then export this class
if (typeof window === "undefined"){
    module.exports = InfiniteLoopFinder;
}