/*
    Class Name: Component
    Description: An abstract class of a component of a visual interface
*/
class Component {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.enabled = true;
        this.displayEnabled = true;
    }

    /*
        Method Name: enable
        Method Parameters: None
        Method Description: Enables the component
        Method Return: void
    */
    enable(){
        this.enabled = true;
    }

    /*
        Method Name: disable
        Method Parameters: None
        Method Description: Disables the component
        Method Return: void
    */
    disable(){
        this.enabled = false;
    }

    /*
        Method Name: isDisabled
        Method Parameters: None
        Method Description: Reports whether the component is disabled
        Method Return: Boolean
    */
    isDisabled(){
        return !this.enabled;
    }

    /*
        Method Name: isEnabled
        Method Parameters: None
        Method Description: Reports whether the component is enabled
        Method Return: Boolean
    */
    isEnabled(){
        return this.enabled;
    }

    /*
        Method Name: isDisplayEnabled
        Method Parameters: None
        Method Description: Reports whether the component has its display enabled
        Method Return: Boolean
    */
    isDisplayEnabled(){
        return this.displayEnabled;
    }

    /*
        Method Name: enableDisplay
        Method Parameters: None
        Method Description: Enables the display of the component
        Method Return: void
    */
    enableDisplay(){
        this.displayEnabled = true;
    }

    /*
        Method Name: disableDisplay
        Method Parameters: None
        Method Description: Disables the display of the component
        Method Return: void
    */
    disableDisplay(){
        this.displayEnabled = false;
    }

    /*
        Method Name: fullDisable
        Method Parameters: None
        Method Description: Disables the component, including display
        Method Return: void
    */
    fullDisable(){
        this.disableDisplay();
        this.disable();
    }

    /*
        Method Name: fullEnable
        Method Parameters: None
        Method Description: Enables the component, including display
        Method Return: void
    */
    fullEnable(){
        this.enableDisplay();
        this.enable();
    }


    // Either meant to be blank or meant to be overridden
    covers(){}
    clicked(){}

    // Abstract Method
    display(){}
}

// TODO: Comments
class ComponentGroup extends Component {
    constructor(){
        super();
        this.components = [];
    }

    addComponent(component){
        this.components.push(component);
    }

    display(){
        for (let component of this.components){
            component.display();
        }
    }

    getComponents(){
        return this.components;
    }

    covers(x, y){
        console.log("Check y", y, "myY", this.getY())
        return x >= this.getX() && x <= this.getX() + this.getWidth() && y <= this.getY() && y >= this.getY() - RETRO_GAME_DATA["ui"]["game_maker"]["bottom_bar_height"];
    }

    /*
        Method Name: clicked
        Method Parameters:
            instance:
                The menu responsible for the click
            TODO
        Method Description: Handles what occurs when clicked on
        Method Return: void
    */
    clicked(instance, x=undefined, y=undefined){
        for (let component of this.components){
            if (component.covers(x,y)){
                component.clicked(x,y);
                return;
            }
        }
    }

    covers(x, y){
        console.log("Checkckckckc")
        for (let component of this.components){
            if (component.covers(x,y)){
                return true;
            }
        }
        return false;
    }
}