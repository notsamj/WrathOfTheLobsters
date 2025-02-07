class EventTracker {
    constructor(){
        this.runData = [];
    }

    newRun(){
        this.runData.push([]);
    }

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