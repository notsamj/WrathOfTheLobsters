/*
    Class Name: RandomEventManager
    Class Description: A tool for managing random events/decisions
*/
class RandomEventManager {
    /*
        Method Name: constructor
        Method Parameters: 
            seededRandomGenerator:
                A seeded random generator
        Method Description: constructor
        Method Return: constructor
    */
    constructor(seededRandomGenerator){
        this.seededRandomGenerator = seededRandomGenerator;
        this.events = [];
    }

    /*
        Method Name: setRandom
        Method Parameters: 
            seededRandomGenerator:
                A seeded random generator instance
        Method Description: Setter
        Method Return: void
    */
    setRandom(seededRandomGenerator){
        this.seededRandomGenerator = seededRandomGenerator;
    }

    /*
        Method Name: getRandom
        Method Parameters: None
        Method Description: Getter
        Method Return: SeededRandomGenerator
    */
    getRandom(){
        return this.seededRandomGenerator;
    }

    /*
        Method Name: getResultExpectedMS
        Method Parameters: 
            ms:
                The number of miliseconds after which the event is expected to occur
        Method Description: Generates a random number based on the number of ticks after which the event is expected to occur
        Method Return: boolean
    */
    getResultExpectedMS(ms){
        // Find how many ticks this amount of miliseconds translates to
        let expectedTicks = Math.ceil(ms / calculateMSBetweenTicks());
        return this.getRandom().getFloatInRange(0, 1) < 1 / expectedTicks;
    }

    /*
        Method Name: getResultIndependent
        Method Parameters: 
            probabilityOfEvent:
                p value [0,1]
            numberOfTrials:
                The number of trials
        Method Description: Generates a boolean randomly based on a p value and expected number of trials. So the chance it will occur on a given trial.
        Method Return: boolean
    */
    getResultIndependent(probabilityOfEvent, numberOfTrials){
        let probabilityOfOccurance = 1 - Math.pow(1 - probabilityOfEvent, 1 / numberOfTrials);
        let randomResult = this.getRandom().getFloatInRange(0, 1);
        return randomResult < probabilityOfOccurance;
    }

    /*
        Method Name: getResult
        Method Parameters: 
            eventName:
                Event identifier string
            tick:
                The current tick
        Method Description: Gets a random result for an event. Will always return true if tick limit is reached
        Method Return: boolean
    */
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

    /*
        Method Name: getEvent
        Method Parameters: 
            eventName:
                An event identifier string
        Method Description: Finds an event
        Method Return: JSON or null
    */
    getEvent(eventName){
        for (let event of this.events){
            if (event["name"] === eventName){
                return event;
            }
        }
        return null;
    }

    /*
        Method Name: hasEvent
        Method Parameters: 
            eventName:
                An event identifier string
        Method Description: Checks if an event exists
        Method Return: boolean
    */
    hasEvent(eventName){
        return this.getEvent(eventName) != null;
    }

    /*
        Method Name: registerEvent
        Method Parameters: 
            eventName:
                An event identifier string
            probability:
                The p value for the event
            numTrials:
                The number of trials
            limit:
                The limit of trials until returning true is guaranteed
            tickGap=1:
                The tick gap expected between trials
        Method Description: Registers an event
        Method Return: void
    */
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