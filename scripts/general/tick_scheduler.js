// TODO: Comment this class
class TickScheduler {
    constructor(tickGapMS, startTime=Date.now()){
        this.startTime = startTime;
        this.tickGapMS = tickGapMS;
        this.tickLock = new Lock();
        this.numTicks = 0;
        this.paused = false;
        this.pauseStartTime = null;
        this.timeDebt = 0;
        this.latestTimeDebt = 0;
        this.lastTickTime = Date.now();
    }

    getLatestTimeDebt(){
        return this.latestTimeDebt;
    }

    pause(){
        this.paused = true;
        this.pauseStartTime = Date.now();
    }

    unpause(){
        this.paused = false;
        this.addTimeDebt(Date.now() - this.pauseStartTime);
    }

    addTimeDebt(ms){
        this.latestTimeDebt = ms;
        this.timeDebt += ms;
    }

    isPaused(){
        return this.paused;
    }

    getTickLock(){
        return this.tickLock;
    }

    setStartTime(time=Date.now()){
        this.startTime = time;
    }

    getExpectedNumberOfTicksPassedFloat(time=Date.now()){
        return (time - (this.startTime + this.timeDebt)) / this.tickGapMS;
    }

    getExpectedNumberOfTicksPassed(time=Date.now()){
        return Math.floor(this.getExpectedNumberOfTicksPassedFloat(time));
    }

    getNumTicks(){
        return this.numTicks;
    }

    countTick(){
        this.numTicks++;
        this.lastTickTime = Date.now();
    }

    getLastTickTime(){
        return this.lastTickTime;
    }
}