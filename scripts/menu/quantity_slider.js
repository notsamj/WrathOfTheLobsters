/*
    Class Name: QuantitySlider
    Description: A type of option slider. A sliding bar for setting a integer or float value in a range.
*/
class QuantitySlider extends OptionSlider {
    constructor(x, y, width, height, textHeight, getValueFunction, setValueFunction, minValue, maxValue, usingFloat=false, backgroundBarColour="#000000", sliderColour="#ffffff", textColour="#000000"){
        super(x, y, width, height, textHeight, getValueFunction, setValueFunction, backgroundBarColour, sliderColour, textColour);
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.usingFloat = usingFloat;
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
        let currentPercentage = (currentValue - this.minValue) / (this.maxValue - this.minValue);
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
        let calculatedValue = sliderOffset / (this.width - this.sliderWidth) * (this.maxValue - this.minValue) + this.minValue;
        if (!this.usingFloat){
            calculatedValue = Math.floor(calculatedValue);
        }
        let newValue = Math.min(Math.max(calculatedValue, this.minValue), this.maxValue);
        this.modifyValue(newValue);
        this.updateSliderX();
    }
}