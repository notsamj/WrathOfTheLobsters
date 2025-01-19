/*
    Class Name: ProgressBar
    Description: 
*/
class ProgressBar {
    /*
        Method Name: constructor
        Method Parameters: TODO
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(maxValue){
        this.maxValue = maxValue;
        this.value = 0;
    }

    /*
        Method Name: getThreshold
        Method Parameters: None
        Method Description: Determines which threshold is met by the current heat
        Method Return: String
    */
    getThreshold(){
        let proportion = this.value/this.maxValue;
        if (proportion > WTL_GAME_DATA["progress_bar"]["threshold_4"]){
            return "threshold_4";
        }else if (proportion > WTL_GAME_DATA["progress_bar"]["threshold_3"]){
            return "threshold_3";
        }else if (proportion > WTL_GAME_DATA["progress_bar"]["threshold_2"]){
            return "threshold_2";
        }else{
            return "threshold_1";
        }
    }

    /*
        Method Name: 
        Method Parameters: None
        Method Description: 
        Method Return: void
    */
    setValue(newValue){
        this.value = newValue;
    }

    getValue(){
        return this.value;
    }

    getMaxValue(){
        return this.maxValue;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the progress bar on the screen
        Method Return: void
    */
    display(){
        let barWidth = WTL_GAME_DATA["progress_bar"]["width"];
        let barHeight = WTL_GAME_DATA["progress_bar"]["height"];
        let barBorderColour = WTL_GAME_DATA["progress_bar"]["border_colour"];
        let borderThickness = WTL_GAME_DATA["progress_bar"]["border_thickness"];
        let barColour;
        let progressProportion = this.value/this.maxValue;
        let threshold = this.getThreshold();

        // Determine bar colour
        if (threshold == "threshold_4"){
            barColour = WTL_GAME_DATA["progress_bar"]["threshold_4_colour"];
        }else if (threshold == "threshold_3"){
            barColour = WTL_GAME_DATA["progress_bar"]["threshold_3_colour"];
        }else if (threshold == "threshold_2"){
            barColour = WTL_GAME_DATA["progress_bar"]["threshold_2_colour"];
        }else{
            barColour = WTL_GAME_DATA["progress_bar"]["threshold_1_colour"];
        }

        // Change from code to colour object
        barColour = Colour.fromCode(barColour);

        let screenHeight = getScreenHeight();

        // Display borders
        let borderColour = Colour.fromCode(WTL_GAME_DATA["progress_bar"]["border_colour"]);
        // Top Border
        noStrokeRectangle(borderColour, 0, screenHeight - 1 - barHeight - borderThickness * 2 + 1, barWidth + 2 * borderThickness, borderThickness);
        // Bottom Border
        noStrokeRectangle(borderColour, 0, screenHeight - 1 - borderThickness + 1, barWidth + 2 * borderThickness, borderThickness);
        // Left Border
        noStrokeRectangle(borderColour, 0, screenHeight - 1 - barHeight - borderThickness * 2 + 1, borderThickness, barHeight + 2 * borderThickness);
        // Right Border
        noStrokeRectangle(borderColour, barWidth + 2 * borderThickness - 1, screenHeight - 1 - barHeight - borderThickness * 2 + 1, borderThickness, barHeight + 2 * borderThickness);
        
        // Display Heat
        noStrokeRectangle(barColour, borderThickness, screenHeight - barHeight - borderThickness, barWidth*progressProportion, barHeight);
    }
}