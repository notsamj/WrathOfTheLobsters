/*
    Class Name: AsyncProcessingRegulator
    Class Description: Regulates processing by time for async functions
*/
class AsyncProcessingRegulator {
    /*
        Method Name: constructor
        Method Parameters: 
            workMSUntilBreak:
                The number of miliseconds to work before taking a break
            recoveryTimeMS=100:
                The number of miliseconds to take a break before resumption
        Method Description: constructor
        Method Return: constructor
    */
    constructor(workMSUntilBreak=50, recoveryTimeMS=100){
        this.endWorkTime = Date.now() + workMSUntilBreak;
        this.recoveryTimeMS = recoveryTimeMS;
        this.expectedInaccuracy = 15; // This is the timeout value typically expected in browser JavaScript (ms)
        this.workMSUntilBreak = workMSUntilBreak;
        this.onTimeout = false;
    }

    /*
        Method Name: isOnTimeout
        Method Parameters: None
        Method Description: Checks if the timeout is active
        Method Return: boolean
    */
    isOnTimeout(){
        return this.onTimeout;
    }

    /*
        Method Name: getEndWorkTime
        Method Parameters: None
        Method Description: Gets the time at which work wil lresume
        Method Return: int
    */
    getEndWorkTime(){
        return this.endWorkTime;
    }

    /*
        Method Name: attemptToWait
        Method Parameters: None
        Method Description: Attempts to wait if a break is needed
        Method Return: Promise (implicit)
    */
    async attemptToWait(){
        if (this.isOnTimeout()){
            throw new Error("Unexpected wait call while on timeout.");
        }
        // If we have time then don't wait
        if (Date.now() < this.getEndWorkTime()){
            return;
        }

        // We have to wait
        this.onTimeout = true;

        // After waiting set new end time
        let endBreakTime = Date.now() + this.recoveryTimeMS;

        // Wait until your recovery time is up
        while (Date.now() < endBreakTime){
            // Quick sleep then check again
            await sleep(this.expectedInaccuracy);
        }

        // Set next break end time
        this.endWorkTime = Date.now() + this.workMSUntilBreak;

        // End wait
        this.onTimeout = false;
    }
}