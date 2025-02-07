/*
    Class Name: OptionSlider
    Description: An abstract type of component. A sliding bar for choosing between options for a value.
*/
class OptionSlider extends Component {
    constructor(x, y, width, height, textHeight, getValueFunction, setValueFunction, backgroundBarColourCode="#000000", sliderColourCode="#ffffff", textColourCode="#000000"){
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.textHeight = textHeight;
        this.sliderWidth = WTL_GAME_DATA["menu"]["option_slider"]["slider_width_px"];
        this.getValueFunction = getValueFunction;
        this.setValueFunction = setValueFunction;
        this.sliding = false;
        this.backgroundBarColour = Colour.fromCode(backgroundBarColourCode);
        this.sliderColour = Colour.fromCode(sliderColourCode);
        this.textColourCode = textColourCode;
    }

    // Abstract
    updateSliderX(){}
    moveToX(mouseX){}

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Determines the x value of this component. Depends on whether it is set as a function of the screen dimensions or static.
        Method Return: int
    */
    getX(){
        if (typeof this.x === "function"){
            return this.x(getScreenWidth());
        }else{
            return this.x;
        }
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Determines the y value of this component. Depends on whether it is set as a function of the screen dimensions or static.
        Method Return: int
    */
    getY(){
        if (typeof this.y === "function"){
            return this.y(getScreenHeight());
        }else{
            return this.y;
        }
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the quantity slider
        Method Return: void
    */
    display(){
        // Update position and such things
        this.tick();
        
        // Background Rectangle
        let screenYForRects = MENU_MANAGER.changeToScreenY(this.getY() - this.textHeight);
        noStrokeRectangle(this.backgroundBarColour, this.getX(), screenYForRects, this.width, this.height);
    
        // Slider
        noStrokeRectangle(this.sliderColour, this.sliderX, screenYForRects, this.sliderWidth, this.height);

        // Text
        let value = this.accessValue();
        let valueString = this.accessValue().toString();
        // Float
        if (Math.floor(value) != value){
            valueString = value.toFixed(2);
        }
        Menu.makeText(valueString, this.textColourCode, this.getX(), this.getY(), this.width, this.textHeight);
    }

    /*
        Method Name: isSliding
        Method Parameters: None
        Method Description: Checks if the slider is currently sliding
        Method Return: Boolean
    */
    isSliding(){
        return this.sliding;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Checks if the slider should move
        Method Return: void
    */
    tick(){
        let hasMouseOnY = this.coveredByY(MENU_MANAGER.changeFromScreenY(gMouseY));
        let hasMouseOn = this.covers(gMouseX, MENU_MANAGER.changeFromScreenY(gMouseY));
        let activated = GENERAL_USER_INPUT_MANAGER.isActivated("option_slider_grab");

        // If currently sliding and either the user is not clicking OR mouse if off it in y axis
        if (this.isSliding() && (!activated || !hasMouseOnY)){
            this.sliding = false;
            return;
        }
        // If not currently sliding and clicking and the mouse is fully on the bar
        else if (!this.isSliding() && activated && hasMouseOn){
            this.sliding = true;
        }
        
        // If not sliding at this point don't change anything
        if (!this.isSliding()){ return; }

        // Sliding
        this.moveToX(gMouseX);
    }

    /*
        Method Name: accessValue
        Method Parameters: None
        Method Description: Access the value of the slider
        Method Return: Number
    */
    accessValue(){
        return this.getValueFunction();
    }

    /*
        Method Name: modifyValue
        Method Parameters:
            newValue:
                A new value after being modified by a slider
        Method Description: Modifies the value associated with the slider
        Method Return: 
    */
    modifyValue(newValue){
        this.setValueFunction(newValue);
    }

    /*
        Method Name: covers
        Method Parameters:
            x:
                An x coordinate
            y:
                A y coordinate
        Method Description: Checks if a given point is covered by the slider
        Method Return: Boolean
    */
    covers(x, y){
        return this.coveredByX(x) && this.coveredByY(y);
    }

    /*
        Method Name: coveredByY
        Method Parameters:
            y:
                A y coordinate
        Method Description: Checks if a given point is covered by the slider's y position
        Method Return: Boolean
    */
    coveredByY(y){
        return y <= this.getY() - this.textHeight && y >= this.getY() - this.textHeight - this.height;
    }

    /*
        Method Name: coveredByX
        Method Parameters:
            x:
                An x coordinate
        Method Description: Checks if a given point is covered by the slider's x position
        Method Return: Boolean
    */
    coveredByX(x){
        return x >= this.getX() && x <= this.getX() + this.width;
    }
}