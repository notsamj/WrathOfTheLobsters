class BotPerception {
    constructor(player, reactionTimeTicks){
        this.player = player;
        this.reactionTimeTicks = reactionTimeTicks;
        
        this.data = {};
    }

    getReactionTimeTicks(){
        return this.reactionTimeTicks;
    }

    inputData(dataKey, dataValue, tick){
        // Make a place for the data if no place yet exists
        if (!objectHasKey(this.data, dataKey)){
            this.data[dataKey] = [];
        }

        let dataList = this.data[dataKey];
        let newDataObject = {"value": dataValue, "tick": tick};

        // Replace old data if it exists
        let oldestDataIndex;
        let oldestDataTick = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < dataList.length; i++){
            let listObj = dataList[i];
            let oldTick = listObj["tick"];
            // If this tick is the oldest found so far
            if (oldestDataTick > oldTick){
                oldestDataTick = oldTick;
                oldestDataIndex = i;
            }
        }

        // If the oldest found tick is old enough to be useless (because there is more recent data older or as old as the reaction time)
        let newerDataExists = dataList.length > 1;
        if (oldestDataTick < dataValue - this.getReactionTimeTicks() && newerDataExists){
            dataList[oldestDataIndex] = newDataObject;
        }
        // Otherwise we can't get rid of any old data so append
        else{
            dataList.push(newDataObject);
        }
    }

    hasDataToReactTo(dataKey, tick){
        return this.getDataToReactTo(dataKey, tick) != null;
    }

    getDataToReactTo(dataKey, tick){
        // Shouldn't be requesting data that hasn't been added yet
        if (!objectHasKey(this.data, dataKey)){
            throw new Error("Requesting data that has not been received");
        }
        let bestTick = tick - this.getReactionTimeTicks();

        let dataList = this.data[dataKey];
        let newestAcceptableDataTick = -1;
        let newestAcceptableDataIndex;

        // Search the data
        for (let i = 0; i < dataList.length; i++){
            let listObj = dataList[i];
            let oldTick = listObj["tick"];
            if (oldTick === bestTick){
                return listObj["value"];
            }
            // If the tick is the newest so far (and acceptable)
            else if (oldTick > newestAcceptableDataTick && oldTick < bestTick){
                newestAcceptableDataTick = oldTick;
                newestAcceptableDataIndex = i;
            }
        }

        // If nothing found, return null
        if (newestAcceptableDataIndex === -1){
            return null;
        }

        // Return the best value
        return dataList[newestAcceptableDataIndex]["value"];
    }
}