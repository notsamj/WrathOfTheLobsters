class RandomEventManager {
    constructor(seededRandomGenerator){
        this.seededRandomGenerator = seededRandomGenerator;
        this.events = [];
    }

    setRandom(seededRandomGenerator){
        this.seededRandomGenerator = seededRandomGenerator;
    }

    getRandom(){
        return this.seededRandomGenerator;
    }

    getResultExpectedMS(ms){
        // Find how many ticks this amount of miliseconds translates to
        let expectedTicks = Math.ceil(ms / calculateMSBetweenTicks());
        return this.getRandom().getFloatInRange(0, 1) < 1 / expectedTicks;
    }

    getResultIndependent(probabilityOfEvent, numberOfTrials){
        let probabilityOfOccurance = 1 - Math.pow(1 - probabilityOfEvent, 1 / numberOfTrials);
        let randomResult = this.getRandom().getFloatInRange(0, 1);
        return randomResult < probabilityOfOccurance;
    }

    getResult(eventName, tick=null){
        // If event not found
        if (!this.hasEvent(eventName)){
            throw new Error("Event \"" + eventName + "\" not found.");
        }

        let eventObj = this.getEvent(eventName);
        let tickIsNull = tick === null;
        let hasLimit = eventObj["limit"] !== null;

        // If there is a limit but the provided tick is null
        if (tickIsNull && hasLimit){
            throw new Error("Tick not provided.");
        }
        // Else if there is a tick but no limit
        else if (!tickIsNull && !hasLimit){
            throw new Error("Tick provided but unexpected.");
        }

        // If this event has no limit
        if (!hasLimit){
            return this.getResultIndependent(eventObj["probability"], eventObj["number_of_trials"]);
        }

        // Else there is a limit
        let currentTick = tick;

        // Determine whether to cancel a streak
        if (currentTick - eventObj["last_tick"] > eventObj["tick_gap"]){
            eventObj["streak"] = 0;
        }

        // Update last tick
        eventObj["last_tick"] = currentTick;

        // Add to current streak
        eventObj["streak"] += 1;

        let streak = eventObj["streak"];
        // If streak is at limit, set streak to 0 and return true
        if (streak === eventObj["limit"]){
            eventObj["streak"] = 0;
            return true;
        }

        // Else less than limit do an independent check

        return this.getResultIndependent(eventObj["probability"], eventObj["number_of_trials"]);
    }

    getEvent(eventName){
        for (let event of this.events){
            if (event["name"] === eventName){
                return event;
            }
        }
        return null;
    }

    hasEvent(eventName){
        return this.getEvent(eventName) != null;
    }

    registerEvent(eventName, probability, numTrials, limit=null, tickGap=1){
        // Check for event already existing
        if (this.hasEvent(eventName)){
            throw new Error("Event \"" + eventName + "\" already exists.");
        }

        // Event does not exist
        this.events.push({
            "name": eventName,
            "probability": probability,
            "number_of_trials": numTrials,
            "limit": limit,
            "tick_gap": tickGap,
            "last_tick": -1,
            "streak": 0
        });
    }
}