class HealthBar {

    constructor(maxHealth=1, recoveryTimeMS=1000, regenerationEnabled=false){
        this.maxHealth = maxHealth;
        this.regenerationEnabled = regenerationEnabled;
        this.maxRecoveryDelayTicks = Math.ceil(WTL_GAME_DATA["health_bar"]["recovery_delay_ms"] / calculateMSBetweenTicks());
        this.recoveryDelayTicks = 0;
        this.recoveryTimeMS = recoveryTimeMS;
        this.health = this.maxHealth;
        this.emergencyRecovery = false;
        this.activelyDraining = false;
    }

    setHealth(newHealth){
        this.health = newHealth;
    }

    isHealthRecoveryEnabled(){
        return this.regenerationEnabled;
    }

    isFull(){
        return this.health === this.maxHealth;
    }

    getHealth(){
        return this.health;
    }

    getHealthProportion(){
        return Math.max(0, this.health) / this.maxHealth;
    }

    isOutOfHealth(){
        return !this.hasHealth();
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
        this.health = this.maxHealth;
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
        if (this.health === this.maxHealth){ return; }

        // Recovery stamina if not actively draining
        if (!this.isActivelyDraining() && this.isHealthRecoveryEnabled()){
            this.health = Math.min(this.maxHealth, this.health + this.maxHealth * WTL_GAME_DATA["general"]["ms_between_ticks"] / this.recoveryTimeMS);
            // Determine whether to cancel prehibatory recovery
            if (this.isExperiencingEmergencyRecovery() && this.health / this.maxHealth > WTL_GAME_DATA["health_bar"]["threshold_3"]){
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
        Method Name: getInterpolatedHealth
        Method Parameters:
            timePassedMS:
                The milliseconds since the last tick
        Method Description: Determines the stamina of the create at a given time after the last tick
        Method Return: Float
    */
    getInterpolatedHealth(timePassedMS){
        // Don't interpolated if still on recovery delay
        if (this.recoveryDelayTicks > 0 || !this.isHealthRecoveryEnabled()){ return this.health; }
        return Math.max(0, Math.min(this.maxHealth, this.health + this.maxHealth * timePassedMS / this.recoveryTimeMS));
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
        Method Name: useHealth
        Method Parameters:
            amount:
                Amount of stamina to use
        Method Description: Reduces stamina by an amount
        Method Return: void
        Note: Assumes hasHealth has been checked
    */
    useHealth(amount){
        this.activelyDraining = true;
        this.health = this.health-amount;
        // If stamina has reached 0 then start emergency recovery
        if (this.health <= 0){
            this.emergencyRecovery = true;
            this.recoveryDelayTicks = this.maxRecoveryDelayTicks;
        }
    }

    /*
        Method Name: hasHealth
        Method Parameters: None
        Method Description: Checks if the creatue has stamina to use
        Method Return: Boolean
    */
    hasHealth(){
        return !this.isExperiencingEmergencyRecovery();
    }

    /*
        Method Name: display
        Method Parameters:
            timePassed:
                The time in milliseconds since the last tick
        Method Description: Displays the stamina bar on the screen
        Method Return: void
    */
    display(timePassed=WTL_GAME_DATA["general"]["ms_between_ticks"]){
        let displayHealth = this.getInterpolatedHealth(timePassed);
        // No need to display if at full stamina
        if (displayHealth === this.maxHealth){
            return;
        }

        let healthBarWidth = WTL_GAME_DATA["health_bar"]["width"];
        let healthBarHeight = WTL_GAME_DATA["health_bar"]["height"];
        let healthBarColourCode;
        let interpolatedHealthPercentage = displayHealth/this.maxHealth;
        let realHealthPercentage = Math.max(0, this.health)/this.maxHealth;

        // Determine bar colour
        // Note: The code after the && checks if the cooling will be over next tick
        if (this.isExperiencingEmergencyRecovery()){
            healthBarColourCode = WTL_GAME_DATA["health_bar"]["cooling_colour"];
        }else if (realHealthPercentage < WTL_GAME_DATA["health_bar"]["threshold_3"]){
            healthBarColourCode = WTL_GAME_DATA["health_bar"]["threshold_3_colour"];
        }else if (realHealthPercentage < WTL_GAME_DATA["health_bar"]["threshold_2"]){
            healthBarColourCode = WTL_GAME_DATA["health_bar"]["threshold_2_colour"];
        }else{
            healthBarColourCode = WTL_GAME_DATA["health_bar"]["threshold_1_colour"];
        }

        // Change from code to colour object
        let healthBarColour = Colour.fromCode(healthBarColourCode);

        let screenHeight = getScreenHeight();

        // Find x offset to center
        let xOffset = 0;
        let screenWidth = getScreenWidth();

        // If there is more than enough space to display the whole thing then get an x offset
        if (healthBarWidth < screenWidth){
            xOffset = Math.floor((screenWidth - healthBarWidth) / 2);
        }

        let yOffset = WTL_GAME_DATA["inventory"]["hotbar_y_offset_from_bottom"] + WTL_GAME_DATA["inventory"]["slot_size"] + healthBarHeight;
        let displayY = getScreenHeight() - yOffset;

        let displayWidth = Math.ceil(healthBarWidth * interpolatedHealthPercentage);
        // Display Health
        noStrokeRectangle(healthBarColour, xOffset, displayY, displayWidth, healthBarHeight);
    }
}