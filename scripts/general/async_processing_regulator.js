class AsyncProcessingRegulator {
    constructor(workMSUntilBreak=50, recoveryTimeMS=100){
        this.endWorkTime = Date.now() + workMSUntilBreak;
        this.recoveryTimeMS = recoveryTimeMS;
        this.expectedInaccuracy = 15; // This is the timeout value typically expected in browser JavaScript (ms)
        this.workMSUntilBreak = workMSUntilBreak;
        this.onTimeout = false;
    }

    isOnTimeout(){
        return this.onTimeout;
    }

    getEndWorkTime(){
        return this.endWorkTime;
    }

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