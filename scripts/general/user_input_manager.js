/*
    Class Name: UserInputManager
    Description: A class for managing the user's inputs.
*/
class UserInputManager {
     /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.handlerNodes = [];
        this.specialNodes = [];
    }

    /*
        Method Name: register
        Method Parameters:
            alias:
                The name of the listener
            eventName:
                The name of the event to await
            checker:
                The function that checks if the event meets requirements
            onOff:
                Whether or not the event activates or deactivates the node
            extraInfo:
                Extra information for setting up the noode
        Method Description: Sets up a listener for an event and potentially creates a node
        Method Return: void
    */
    register(alias, eventName, checker, onOff=true, extraInfo=null){
        let newNode = this.getOrCreate(alias);
        this.handlerNodes.push(newNode);
        document.addEventListener(eventName, (event) => {
            if (checker(event)){
                newNode.setActivated(onOff);
            }
        });
        newNode.setExtraInfo(extraInfo);
    }

    /*
        Method Name: has
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Determines if a listener exists with a given name
        Method Return: boolean, true -> exists, false -> does not exist
    */
    has(alias){
        return this.getMaybeNull(alias) != null;
    }

    /*
        Method Name: get
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Finds a listener if it exists, otherwise, creates it. Returns it.
        Method Return: UserInputNode
    */
    get(alias){
        let result = this.getMaybeNull(alias);
        if (result != null){
            return result;
        }
        throw new Error("Listener node not found.");

        /*// Else doesn't exist -> create it
        let newNode = new UserInputNode(alias);
        this.handlerNodes.push(newNode);
        return newNode; */
    }

    getOrCreate(alias){
        let result = this.getMaybeNull(alias);
        if (result != null){
            return result;
        }

        // Else doesn't exist -> create it
        let newNode = new UserInputNode(alias);
        this.handlerNodes.push(newNode);
        return newNode;
    }

    getMaybeNull(alias){
        // Check if we have this node
        for (let handlerNode of this.handlerNodes){
            if (handlerNode.getAlias() === alias){
                return handlerNode;
            }
        }

        for (let specialNode of this.specialNodes){
            if (specialNode.getAlias() === alias){
                return specialNode;
            }
        }
        return null;
    }
    
    /*
        Method Name: isActivated
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Determines if a listener node has been activated by an event
        Method Return: boolean, true -> activated, false -> not activated
    */
    isActivated(alias){
        return this.has(alias) ? this.get(alias).isActivated() : false;
    }

    /*
        Method Name: notActivated
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Determines if a listener node has not been activated by an event
        Method Return: boolean, true -> not activated, false -> activated
    */
    notActivated(alias){
        return !this.isActivated(alias);
    }

    // TODO: Comments
    tick(){
        for (let handlerNode of this.handlerNodes){
            if (handlerNode.isTicked()){
                handlerNode.tick();
            }
        }
        for (let specialNode of this.specialNodes){
            specialNode.tick();
        }
    }

    registerSpecialType(specialNode){
        this.specialNodes.push(specialNode);
    }
}

/*
    Class Name: UserInputManager
    Description: A class for managing the user's inputs.
*/
class UserInputNode {
    /*
        Method Name: constructor
        Method Parameters:
            alias:
                Alias/name of the node
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(alias){
        this.alias = alias;
        this.activated = false;
        this.ticked = false;
    }

    /*
        Method Name: getAlias
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getAlias(){
        return this.alias;
    }

    /*
        Method Name: setActivated
        Method Parameters:
            onOff:
                Whether to activate or deactivate the node
        Method Description: Getter
        Method Return: void
    */
    setActivated(onOff){
        this.activated = onOff;
    }

    /*
        Method Name: isActivated
        Method Parameters: None
        Method Description: Getter
        Method Return: boolean, true -> activated, false -> not activated
    */
    isActivated(){
        return this.activated;
    }

    // TODO: Comments for these 3
    setExtraInfo(extraInfo){
        if (extraInfo === null){ return; }
        this.extraInfo = extraInfo;
        this.ticked = extraInfo["ticked"];
    }

    isTicked(){
        return this.ticked;
    }

    tick(){
        this.activated = this.extraInfo["ticked_activation"];
    }
}

class SpecialNode {
    constructor(alias){
        this.alias = alias;
    }

    getAlias(){
        return this.alias;
    }

    tick(){ throw new Error("Please implement this method."); }
}

class TickedValueNode extends SpecialNode {
    constructor(alias, eventName, valueExtractorFunction, defaultValue){
        super(alias);
        this.defaultValue = defaultValue;
        this.value = this.defaultValue;
        this.valueExtractorFunction = valueExtractorFunction;
        document.addEventListener(eventName, (event) => {
            this.updateValue(event);
        });
    }

    getValue(){
        return this.value;
    }

    updateValue(event){
        this.value = this.valueExtractorFunction(event);
    }

    tick(){
        this.value = this.defaultValue;
    }
}