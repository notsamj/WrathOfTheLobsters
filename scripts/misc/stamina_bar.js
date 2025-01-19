/*
    Class Name: StaminaBar
    Description: Manages the stamina of a creature and whether or not it can perform physical actions
*/
class StaminaBar {
    /*
        Method Name: constructor
        Method Parameters:
            maxStamina:
                The amount of stamina the create possesses
            recoveryTimeMS:
                The time it takes the create to fully replenish its stamina
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(maxStamina, recoveryTimeMS){
        this.maxStamina = maxStamina;
        this.maxRecoveryDelayTicks = Math.ceil(WTL_GAME_DATA["stamina_bar"]["recovery_delay_ms"] / calculateMSBetweenTicks());
        this.recoveryDelayTicks = 0;
        this.recoveryTimeMS = recoveryTimeMS;
        this.stamina = this.maxStamina;
        this.emergencyRecovery = false;
        this.activelyDraining = false;
    }

    isFull(){
        return this.stamina === this.maxStamina;
    }

    getStamina(){
        return this.stamina;
    }

    getStaminaProportion(){
        return Math.max(0, this.stamina) / this.maxStamina;
    }

    isOutOfStamina(){
        return !this.hasStamina();
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the stamina bar
        Method Return: void
    */
    reset(){
        this.activelyDraining = false;
        this.emergencyRecovery = false;
        this.stamina = this.maxStamina;
        this.recoveryDelayTicks = 0;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles the recovery that takes place
        Method Return: void
    */
    tick(){
        // If on recovery delay
        if (this.recoveryDelayTicks > 0){
            this.recoveryDelayTicks--;
            return;
        }
        // Nothing to do if already at maximum stamina
        if (this.stamina === this.maxStamina){ return; }

        // Recovery stamina if not actively draining
        if (!this.isActivelyDraining()){
            this.stamina = Math.min(this.maxStamina, this.stamina + this.maxStamina * WTL_GAME_DATA["general"]["ms_between_ticks"] / this.recoveryTimeMS);
            // Determine whether to cancel prehibatory recovery
            if (this.isExperiencingEmergencyRecovery() && this.stamina / this.maxStamina > WTL_GAME_DATA["stamina_bar"]["threshold_3"]){
                this.emergencyRecovery = false;
            }
        }
        // If a tick goes by with no active stamina drain then be ready to recovery
        this.activelyDraining = false;
    }

    /*
        Method Name: isActivelyDraining
        Method Parameters: None
        Method Description: Checks if the turret is actively shooting
        Method Return: Boolean
    */
    isActivelyDraining(){
        return this.activelyDraining;
    }

    /*
        Method Name: getInterpolatedStamina
        Method Parameters:
            timePassedMS:
                The milliseconds since the last tick
        Method Description: Determines the stamina of the create at a given time after the last tick
        Method Return: Float
    */
    getInterpolatedStamina(timePassedMS){
        // Don't interpolated if still on recovery delay
        if (this.recoveryDelayTicks > 0){ return this.stamina; }
        return Math.max(0, Math.min(this.maxStamina, this.stamina + this.maxStamina * timePassedMS / this.recoveryTimeMS));
    }

    /*
        Method Name: isExperiencingEmergencyRecovery
        Method Parameters: None
        Method Description: Checks if the stamina bar is performing emergency recovery
        Method Return: Boolean
    */
    isExperiencingEmergencyRecovery(){
        return this.emergencyRecovery;
    }

    /*
        Method Name: useStamina
        Method Parameters:
            amount:
                Amount of stamina to use
        Method Description: Reduces stamina by an amount
        Method Return: void
        Note: Assumes hasStamina has been checked
    */
    useStamina(amount){
        this.activelyDraining = true;
        this.stamina = this.stamina-amount;
        // If stamina has reached 0 then start emergency recovery
        if (this.stamina <= 0){
            this.emergencyRecovery = true;
            this.recoveryDelayTicks = this.maxRecoveryDelayTicks;
        }
    }

    /*
        Method Name: hasStamina
        Method Parameters: None
        Method Description: Checks if the creatue has stamina to use
        Method Return: Boolean
    */
    hasStamina(){
        return !this.isExperiencingEmergencyRecovery();
    }

    /*
        Method Name: display
        Method Parameters:
            timePassed:
                The time in milliseconds since the last tick
            offset:
                The offset of the stamina indicator on the screen 0 -> first indicator to display, 1 -> indicator displayed above zero, etc...
        Method Description: Displays the stamina bar on the screen
        Method Return: void
    */
    display(timePassed=WTL_GAME_DATA["general"]["ms_between_ticks"], offset=0){
        let shareBorderOffset = offset > 0 ? 1 : 0; 
        let displayStamina = this.getInterpolatedStamina(timePassed);
        // No need to display if at full stamina
        if (displayStamina === this.maxStamina){
            return;
        }

        let staminaBarWidth = WTL_GAME_DATA["stamina_bar"]["width"];
        let staminaBarHeight = WTL_GAME_DATA["stamina_bar"]["height"];
        let staminaBarBorderColour = WTL_GAME_DATA["stamina_bar"]["border_colour"];
        let staminaBarBorderThickness = WTL_GAME_DATA["stamina_bar"]["border_thickness"];
        let staminaBarColourCode;
        let interpolatedStaminaPercentage = displayStamina/this.maxStamina;
        let realStaminaPercentage = Math.max(0, this.stamina)/this.maxStamina;

        // Determine bar colour
        // Note: The code after the && checks if the cooling will be over next tick
        if (this.isExperiencingEmergencyRecovery()){
            staminaBarColourCode = WTL_GAME_DATA["stamina_bar"]["cooling_colour"];
        }else if (realStaminaPercentage < WTL_GAME_DATA["stamina_bar"]["threshold_3"]){
            staminaBarColourCode = WTL_GAME_DATA["stamina_bar"]["threshold_3_colour"];
        }else if (realStaminaPercentage < WTL_GAME_DATA["stamina_bar"]["threshold_2"]){
            staminaBarColourCode = WTL_GAME_DATA["stamina_bar"]["threshold_2_colour"];
        }else{
            staminaBarColourCode = WTL_GAME_DATA["stamina_bar"]["threshold_1_colour"];
        }

        // Change from code to colour object
        let staminaBarColour = Colour.fromCode(staminaBarColourCode);

        let screenHeight = getScreenHeight();

        // Display borders
        let borderColour = Colour.fromCode(WTL_GAME_DATA["stamina_bar"]["border_colour"]);
        // Top Border
        noStrokeRectangle(borderColour, 0, screenHeight - 1 - staminaBarHeight - staminaBarBorderThickness * 2 + 1 - (staminaBarHeight+staminaBarBorderThickness*2-1) * offset, staminaBarWidth + 2 * staminaBarBorderThickness, staminaBarBorderThickness);
        // Bottom Border
        noStrokeRectangle(borderColour, 0, screenHeight - 1 - staminaBarBorderThickness + 1 - (staminaBarHeight+staminaBarBorderThickness*2-1) * offset, staminaBarWidth + 2 * staminaBarBorderThickness, staminaBarBorderThickness);
        // Left Border
        noStrokeRectangle(borderColour, 0, screenHeight - 1 - staminaBarHeight - staminaBarBorderThickness * 2 + 1 - (staminaBarHeight+staminaBarBorderThickness*2-1) * offset, staminaBarBorderThickness, staminaBarHeight + 2 * staminaBarBorderThickness);
        // Right Border
        noStrokeRectangle(borderColour, staminaBarWidth + 2 * staminaBarBorderThickness - 1, screenHeight - 1 - staminaBarHeight - staminaBarBorderThickness * 2 + 1- (staminaBarHeight+staminaBarBorderThickness*2-1) * offset, staminaBarBorderThickness, staminaBarHeight + 2 * staminaBarBorderThickness);
        
        // Display Heat
        noStrokeRectangle(staminaBarColour, staminaBarBorderThickness, screenHeight - staminaBarHeight - staminaBarBorderThickness - (staminaBarHeight+staminaBarBorderThickness*2-1) * offset, staminaBarWidth*interpolatedStaminaPercentage, staminaBarHeight);
    }
}
// If using NodeJS then export
if (typeof window === "undefined"){
    module.exports = StaminaBar;
}