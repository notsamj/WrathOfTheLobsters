class GeneralDebugger {
    constructor(){
        this.switches = [];
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