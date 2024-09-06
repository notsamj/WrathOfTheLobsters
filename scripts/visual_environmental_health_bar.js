class VisualEnvironmentHealthBar {
    constructor(maxValue){
        this.maxValue = maxValue;
        this.value = maxValue;
    }

    getThreshold(){
        let proportion = this.value/this.maxValue;
        if (proportion > RETRO_GAME_DATA["health_bar"]["threshold_4"]){
            return "threshold_4";
        }else if (proportion > RETRO_GAME_DATA["health_bar"]["threshold_3"]){
            return "threshold_3";
        }else if (proportion > RETRO_GAME_DATA["health_bar"]["threshold_2"]){
            return "threshold_2";
        }else{
            return "threshold_1";
        }
    }

    setValue(newValue){
        newValue = Math.max(Math.min(newValue, 1), 0);
        this.value = newValue;
    }

    getValue(){
        return this.value;
    }

    getMaxValue(){
        return this.maxValue;
    }

    display(displayLeftX, displayTopY){
        if (this.getValue() == this.getMaxValue()){ return; }
        let barWidth = RETRO_GAME_DATA["health_bar"]["width"];
        displayLeftX = displayLeftX + (64 - barWidth) / 2;
        let barHeight = RETRO_GAME_DATA["health_bar"]["height"];
        let barBorderColour = RETRO_GAME_DATA["health_bar"]["border_colour"];
        let borderThickness = RETRO_GAME_DATA["health_bar"]["border_thickness"];
        let barColour;
        let progressProportion = this.value/this.maxValue;
        let threshold = this.getThreshold();

        // Determine bar colour
        if (threshold == "threshold_4"){
            barColour = RETRO_GAME_DATA["health_bar"]["threshold_4_colour"];
        }else if (threshold == "threshold_3"){
            barColour = RETRO_GAME_DATA["health_bar"]["threshold_3_colour"];
        }else if (threshold == "threshold_2"){
            barColour = RETRO_GAME_DATA["health_bar"]["threshold_2_colour"];
        }else{
            barColour = RETRO_GAME_DATA["health_bar"]["threshold_1_colour"];
        }

        // Change from code to colour object
        barColour = Colour.fromCode(barColour);

        let bottomY = displayTopY + borderThickness * 2 + barHeight;

        // Display borders
        let borderColour = Colour.fromCode(RETRO_GAME_DATA["health_bar"]["border_colour"]);

        // Top Border
        noStrokeRectangle(borderColour, displayLeftX, bottomY - 1 - barHeight - borderThickness * 2 + 1, barWidth + 2 * borderThickness, borderThickness);
        // Bottom Border
        noStrokeRectangle(borderColour, displayLeftX, bottomY - 1 - borderThickness + 1, barWidth + 2 * borderThickness, borderThickness);
        // Left Border
        noStrokeRectangle(borderColour, displayLeftX, bottomY - 1 - barHeight - borderThickness * 2 + 1, borderThickness, barHeight + 2 * borderThickness);
        // Right Border
        noStrokeRectangle(borderColour, displayLeftX + barWidth + 2 * borderThickness - 1, bottomY - 1 - barHeight - borderThickness * 2 + 1, borderThickness, barHeight + 2 * borderThickness);
        
        // Display Health
        noStrokeRectangle(barColour, displayLeftX + borderThickness, bottomY - barHeight - borderThickness, barWidth*progressProportion, barHeight);
    }
}