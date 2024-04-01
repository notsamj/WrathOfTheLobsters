/*
    Class Name: HUD
    Description: A heads up display
*/
class HUD {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.hudElements = [];
    }

    /*
        Method Name: updateElement
        Method Parameters:
            name:
                The name of the element
            value:
                The value of the element
        Method Description: Updates an element of the HUD (creates if doesn't exist)
        Method Return: void
    */
    updateElement(name, value){
        let foundElement = null;
        for (let element of this.hudElements){
            if (name == element.getName()){
                foundElement = element;
                break;
            }
        }
        // If element doesn't exist, create it
        if (foundElement == null){
            foundElement = new HUDElement(name, value);
            this.hudElements.push(foundElement);
        }else{
            foundElement.update(value);
        }

    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the HUD
        Method Return: void
    */
    display(){
        let sizeOfText = RETRO_GAME_SETTINGS["hud"]["text_size"];
        textSize(sizeOfText);
        textAlign(LEFT, TOP);
        let i = 1;
        for (let element of this.hudElements){
            if (!element.isReadyToDisplay()){
                continue;
            }
            element.display(10, i * sizeOfText);
            i++;
        }
    }

    // TODO: Comments
    clearAll(){
        for (let element of this.hudElements){
            element.clear();
        }
    }
}

/*
    Class Name: HUDElement
    Description: A indicator to be displayed in the HUD
*/
class HUDElement {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(name, value){
        this.name = name;
        this.readyToDisplay = true;
        this.value = null;
        this.extraTimeLock = new CooldownLock(1000); // TODO: Test if this works so no flashing
    }

    /*
        Method Name: update
        Method Parameters:
            value:
                The new value for the element
        Method Description: Updates the value of an element. Allows it to be displayed on next display.
        Method Return: void
    */
    update(value){
        this.value = value;
        this.readyToDisplay = true;
    }

    /*
        Method Name: getValue
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getValue(){
        return this.value;
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
        Method Name: display
        Method Parameters:
            x:
                x coordinate to display at
            y:
                y coordinate to display at
        Method Description: Displays the hud element
        Method Return: void
    */
    display(x, y){
        stroke(1);
        fill(RETRO_GAME_SETTINGS["hud"]["key_colour"]);
        let key = this.name + ": ";
        text(key, x, y);
        let xOffset = textWidth(key);
        fill(RETRO_GAME_SETTINGS["hud"]["value_colour"]);
        text(`${this.value}`, x + xOffset, y);
        this.readyToDisplay = false;
        this.extraTimeLock.lock();
    }

    /*
        Method Name: isReadyToDisplay
        Method Parameters: None
        Method Description: Determines if the element should be displayed. Either it has been updated OR the extra time lock hasn't run out
        Method Return: boolean, true -> ready to display, false -> not ready to display
    */
    isReadyToDisplay(){
        return this.readyToDisplay || this.extraTimeLock.notReady();
    }

    // TODO: Comments
    clear(){
        this.extraTimeLock.unlock();
    }
}