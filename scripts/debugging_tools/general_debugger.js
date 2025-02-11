/*
    Class Name: GeneralDebugger
    Class Description: A debugging tool
*/
class GeneralDebugger {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        this.switches = [];
        this.values = [];
    }


    /*
        Method Name: getOrCreateSwitch
        Method Parameters: 
            switchName:
                The name of the switch
        Method Description: Retrieves or creates and returns a switch
        Method Return: GeneralDebuggerSwitch
    */
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

    /*
        Method Name: getOrCreateValueJSON
        Method Parameters: 
            jsonValueName:
                The name of the json object
        Method Description: Retrieves or creates and returns a json object
        Method Return: JSON Object
    */
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

    /*
        Method Name: getOrCreateValue
        Method Parameters: 
            jsonValueName:
                The name of the json object
        Method Description: Gets the value from a json stored in a list
        Method Return: Variable
    */
    getOrCreateValue(jsonValueName){
        let valueObj = this.getOrCreateValueJSON(jsonValueName);
        return valueObj["value"];
    }

    /*
        Method Name: setValue
        Method Parameters: 
            jsonValueName:
                The name of the json object
            value:
                The value stored in a json object
        Method Description: Sets a value in a json object
        Method Return: void
    */
    setValue(jsonValueName, value){
        let valueObj = this.getOrCreateValueJSON(jsonValueName);
        valueObj["value"] = value;
    }

    /*
        Method Name: hasValue
        Method Parameters: 
            jsonValueName:
                The name of the json object to look for
        Method Description: Checks if a value exsts
        Method Return: Boolean, true -> has, false -> does not have
    */
    hasValue(jsonValueName){
        for (let valueObj of this.values){
            if (valueObj["name"] === jsonValueName){
                return true;
            }
        }
        return false;
    }
}

/*
    Class Name: GeneralDebuggerSwitch
    Class Description: A boolean switch
*/
class GeneralDebuggerSwitch {
    /*
        Method Name: constructor
        Method Parameters: 
            name:
                The name of the switch
        Method Description: constructor
        Method Return: constructor
    */
    constructor(name){
        this.name = name;
        this.enabled = false;
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getName(){
        return this.name;
    }

    /*
        Method Name: enable
        Method Parameters: None
        Method Description: Enables the switch
        Method Return: void
    */
    enable(){
        this.enabled = true;
    }

    /*
        Method Name: disable
        Method Parameters: None
        Method Description: Disables the switch
        Method Return: void
    */
    disable(){
        this.enabled = false;
    }

    /*
        Method Name: check
        Method Parameters: None
        Method Description: Checks if the switch is enabled
        Method Return: Boolean, true -> enabled, false -> not enabled
    */
    check(){
        return this.enabled;
    }
}