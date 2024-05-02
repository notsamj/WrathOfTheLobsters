/*
    Class Name: SelectionSlider
    Description: A type of option slider. A sliding bar for picking an option for an array.
*/
class SelectionSlider extends OptionSlider {
    /*
        Method Name: constructor
        Method Parameters:
            x:
                x location of the quantity slider
            y:
                y location of the quantity slider
            width:
                Width of the quantity slider
            height:
                Height of the quantity slider
            getValueFunction:
                Function to call to get the value
            setValueFunction:
                Function to call to set the value
            values:
                A list of possible values for the selection slider
            backgroundBarColour:
                Colour of the bar background (code)
            sliderColour:
                Colour of the slider (code)
            textColour:
                Colour of the text (code)
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(x, y, width, height, getValueFunction, setValueFunction, options, backgroundBarColour="#000000", sliderColour="#ffffff", textColour="#000000"){
        super(x, y, width, height, getValueFunction, setValueFunction, backgroundBarColour, sliderColour, textColour);
        this.options = options;
        this.updateSliderX();
    }

    /*
        Method Name: updateSliderX
        Method Parameters: None
        Method Description: Updates the x positition of the slider
        Method Return: void
    */
    updateSliderX(){
        let currentValue = this.accessValue();
        let currentIndex = getIndexOfElementInList(this.options, currentValue);
        let currentPercentage = (currentIndex) / (this.options.length-1); // Assuming not zero
        let pxToMove = this.width - this.sliderWidth;
        this.sliderX = this.getX() + Math.round(currentPercentage * pxToMove);
    }

    /*
        Method Name: moveToX
        Method Parameters:
            mouseX:
                Current mosue x position
        Method Description: Move the slider to match the user input
        Method Return: void
    */
    moveToX(mouseX){
        // Update the slider position
        let sliderOffset = mouseX - this.getX() - this.sliderWidth/2;
        // Either set value to extremes or in between
        let calculatedIndex = Math.max(0, Math.min(this.options.length-1, Math.floor(sliderOffset / (this.width - this.sliderWidth) * this.options.length)));
        let newValue = this.options[calculatedIndex];
        this.modifyValue(newValue);
        this.updateSliderX();
    }
}