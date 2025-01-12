class GeneralDebugger {
    constructor(){
        this.switches = [];
        this.values = [];
    }


    getOrCreateSwitch(switchName){
        for (let debuggerSwitch of this.switches){
            if (debuggerSwitch.getName() === switchName){
                return debuggerSwitch;
            }
        }
        let newSwitch = new GeneralDebuggerSwitch(switchName);
        this.switches.push(newSwitch);
        return newSwitch;
    }

    getOrCreateValueJSON(jsonValueName){
        for (let valueObj of this.values){
            if (valueObj["name"] === jsonValueName){
                return valueObj;
            }
        }
        let newValue = { "name": jsonValueName };
        newValue["value"] = undefined;
        this.values.push(newValue);
        return newValue;
    }

    getOrCreateValue(jsonValueName){
        let valueObj = this.getOrCreateValueJSON(jsonValueName);
        return valueObj["value"];
    }

    setValue(jsonValueName, value){
        let valueObj = this.getOrCreateValueJSON(jsonValueName);
        valueObj["value"] = value;
    }

    hasValue(jsonValueName){
        for (let valueObj of this.values){
            if (valueObj["name"] === jsonValueName){
                return true;
            }
        }
        return false;
    }
}

class GeneralDebuggerSwitch {
    constructor(name){
        this.name = name;
        this.enabled = false;
    }

    getName(){
        return this.name;
    }

    enable(){
        this.enabled = true;
    }

    disable(){
        this.enabled = false;
    }

    check(){
        return this.enabled;
    }
}