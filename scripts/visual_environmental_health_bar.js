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
        let barHeight = RETRO_GAME_DATA["health_bar"]["height"];
        let barBorderColour = RETRO_GAME_DATA["health_bar"]["border_colour"];
        let borderThickness = RETRO_GAME_DATA["health_bar"]["border_thickness"];
        let barColour;
        let progressProportion = this.value/this.maxValue;
        let threshold = this.getThreshold();
        // Now that the threshold has been determined, inverse the "progress" for the actual health
        progressProportion = 1 - progressProportion;
        let centerXOffset = (64 - barWidth) / 2 - 32;
        let centerYOffset = -32;
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

        let bottomY = displayTopY;
        centerYOffset += borderThickness * 2 + barHeight;

        // Display borders
        let borderColour = Colour.fromCode(RETRO_GAME_DATA["health_bar"]["border_colour"]);

        translate(displayLeftX, bottomY);
        scale(gameZoom, gameZoom);

        // Top Border
        noStrokeRectangle(borderColour, centerXOffset, centerYOffset - 1 - barHeight - borderThickness * 2 + 1, barWidth + 2 * borderThickness, borderThickness);
        // Bottom Border
        noStrokeRectangle(borderColour, centerXOffset, centerYOffset - 1 - borderThickness + 1, barWidth + 2 * borderThickness, borderThickness);
        // Left Border
        noStrokeRectangle(borderColour, centerXOffset, centerYOffset - 1 - barHeight - borderThickness * 2 + 1, borderThickness, barHeight + 2 * borderThickness);
        // Right Border
        noStrokeRectangle(borderColour, centerXOffset + barWidth + 2 * borderThickness - 1, centerYOffset - 1 - barHeight - borderThickness * 2 + 1, borderThickness, barHeight + 2 * borderThickness);
        
        // Display Health
        noStrokeRectangle(barColour, centerXOffset + borderThickness, centerYOffset - barHeight - borderThickness, barWidth*progressProportion, barHeight);
        scale(1/gameZoom, 1/gameZoom);
        translate(-1*displayLeftX, -1*bottomY);
    }
}