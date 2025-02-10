/*
    Class Name: EventTracker
    Class Description: Tracks events for debugger
*/
class EventTracker {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        this.runData = [];
    }

    /*
        Method Name: newRun
        Method Parameters: None
        Method Description: Starts a new run of event tracking
        Method Return: void
    */
    newRun(){
        this.runData.push([]);
    }

    /*
        Method Name: addData
        Method Parameters: 
            dataPoint:
                A new data point for the run
        Method Description: Adds a new data point to the current run. Compares it with the previous run.
        Method Return: Boolean, true -> matches the corresponding data point from the previous run, false -> does not match
    */
    addData(dataPoint){
        if (this.runData.length === 0){
            throw new Error("Please start a new run!");
        }
        // Turn JSON data points to string
        if (isJSON(dataPoint)){
            dataPoint = JSON.stringify(dataPoint);
        }
        this.runData[this.runData.length-1].push(dataPoint);
        let newLength = this.runData[this.runData.length-1].length;

        if (this.runData.length > 1){
            let lastRun = this.runData[this.runData.length-2];
            if (lastRun.length < newLength){
                return false;
            }
            return lastRun[newLength-1] === dataPoint;
        }

        return true;
    }
}

const MY_EVENT_TRACKER = new EventTracker();