/*
    Class Name: ExtraSettingsMenu
    Description: A subclass of Menu specific to setting up certain settings
*/
class ExtraSettingsMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        super("extra_settings_menu");
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu interface
        Method Return: void
    */
    setup(){
        let sectionYSize = 50;
        // Background
        this.components.push(new LoadingScreenComponent());

        // Back Button
        let backButtonX = () => { return 50; }
        let backButtonY = (innerHeight) => { return innerHeight-27; }
        let backButtonXSize = 200;
        let backButtonYSize = 76;
        this.components.push(new RectangleButton("Settings Menu", "#3bc44b", "#e6f5f4", backButtonX, backButtonY, backButtonXSize, backButtonYSize, (menuInstance) => {
            MENU_MANAGER.switchTo("settings_menu");
        }));

        // Interface for changing settings
        let i = 0;
        for (let setting of WTL_GAME_DATA["extra_settings"]){
            this.createSetting(setting, i++);
        }
    }

    /*
        Method Name: createSetting
        Method Parameters:
            setting:
                Setting object
            offSetIndex:
                The index of the setting used to offset its y position
        Method Description: Creates a setting in the menu
        Method Return: void
    */
    createSetting(setting, offSetIndex){
        let settingName = setting["name"];
        let settingType = setting["type"];
        let sectionYSize = 100;
        let settingModifierButtonSize = 50;
        let sectionYStart = sectionYSize * offSetIndex;

        let settingLabelXSize = 300;
        let settingLabelX = 600;
        let settingLabelYSize = 100;
        let settingLabelY = (innerHeight) => { return innerHeight - 27 - sectionYStart - settingModifierButtonSize/2; }

        let settingModifierButtonX = settingLabelX + settingLabelXSize;
        let settingModifierButtonY = (innerHeight) => { return innerHeight - 27 - sectionYStart; }

        // Components
        this.components.push(new TextComponent(settingName, "#108700", settingLabelX, settingLabelY, settingLabelXSize, settingLabelYSize, "center", "middle"));

        if (settingType == "on_off"){
            this.createOnOffButton(setting, settingModifierButtonX, settingModifierButtonY, settingModifierButtonSize);
        }else if (settingType == "quantity_slider"){
            this.createQuantitySlider(setting, settingModifierButtonX, settingModifierButtonY, settingModifierButtonSize);
        }else if (settingType == "selection_slider"){
            this.createSelectionSlider(setting, settingModifierButtonX, settingModifierButtonY, settingModifierButtonSize);
        }
    }

    /*
        Method Name: createOnOffButton
        Method Parameters:
            setting:
                A JSON object with information about a setting
            settingModifierButtonX:
                The x coordinate of the setting modifier button
            settingModifierButtonY:
                The y coordinate of the setting modifier button
            settingModifierButtonSize:
                The size of the setting modifier button
        Method Description: Creates an On/Off button
        Method Return: void
    */
    createOnOffButton(setting, settingModifierButtonX, settingModifierButtonY, settingModifierButtonSize){
        let settingName = setting["name"];
        let settingPath = setting["path"];
        let onOffButtonComponentIndex = this.components.length; // Note: Assumes index never changes
        let storedValue = getLocalStorage(settingName, null);
        if (storedValue != null){
            modifyDataJSONValue(settingPath, storedValue === "true");
        }
        let startingValue = accessDataJSONValue(settingPath) ? "On" : "Off";
        this.components.push(new RectangleButton(startingValue, "#3bc44b", "#e6f5f4", settingModifierButtonX, settingModifierButtonY, settingModifierButtonSize, settingModifierButtonSize, (menuInstance) => {
            let onOrOff = accessDataJSONValue(settingPath);
            onOrOff = !onOrOff; // Flip it
            LOCAL_EVENT_HANDLER.emit({"name": settingName, "new_value": onOrOff});
            modifyDataJSONValue(settingPath, onOrOff)
            setLocalStorage(settingName, onOrOff.toString());
            menuInstance.components[onOffButtonComponentIndex].setText(onOrOff ? "On" : "Off");
        }));
    }

    /*
        Method Name: createQuantitySlider
        Method Parameters:
            setting:
                A JSON object with information about a setting
            settingModifierButtonX:
                The x coordinate of the setting modifier button
            settingModifierButtonY:
                The y coordinate of the setting modifier button
            settingModifierButtonSize:
                The size of the setting modifier button
        Method Description: Creates a quantity slider user interface component
        Method Return: void
    */
    createQuantitySlider(setting, settingModifierButtonX, settingModifierButtonY, settingModifierButtonSize){
        let settingName = setting["name"];
        let settingPath = setting["path"];
        let storedValue = getLocalStorage(settingName, null);
        if (storedValue != null){
            storedValue = setting["uses_float"] ? parseFloat(storedValue) : parseInt(storedValue);
            modifyDataJSONValue(settingPath, storedValue);
        }
        let getValueFunction = () => {
            return accessDataJSONValue(settingPath);
        }

        let setValueFunction = (newValue) => {
            LOCAL_EVENT_HANDLER.emit({"name": settingName, "new_value": newValue});
            modifyDataJSONValue(settingPath, newValue);
            setLocalStorage(settingName, newValue);
        }
        let quantitySlider = new QuantitySlider(settingModifierButtonX, settingModifierButtonY, WTL_GAME_DATA["menu"]["option_slider"]["x_size"], settingModifierButtonSize/2, settingModifierButtonSize/2, getValueFunction, setValueFunction, setting["min_value"], setting["max_value"], setting["uses_float"], undefined, "#108700");
        this.components.push(quantitySlider);
    }

    /*
        Method Name: createSelectionSlider
        Method Parameters:
            setting:
                A JSON object with information about a setting
            settingModifierButtonX:
                The x coordinate of the setting modifier button
            settingModifierButtonY:
                The y coordinate of the setting modifier button
            settingModifierButtonSize:
                The size of the setting modifier button
        Method Description: Creates a selection slider user interface component
        Method Return: void
    */
    createSelectionSlider(setting, settingModifierButtonX, settingModifierButtonY, settingModifierButtonSize){
        let settingName = setting["name"];
        let settingPath = setting["path"];
        let storedValue = getLocalStorage(settingName, null);
        if (storedValue != null){
            // Note: For now assuming float because I'm just using this for zoom (float)
            storedValue = parseFloat(storedValue);
            modifyDataJSONValue(settingPath, storedValue);
        }
        let getValueFunction = () => {
            return accessDataJSONValue(settingPath);
        }

        let setValueFunction = (newValue) => {
            LOCAL_EVENT_HANDLER.emit({"name": settingName, "new_value": newValue});
            modifyDataJSONValue(settingPath, newValue);
            setLocalStorage(settingName, newValue);
        }
        let selectionSlider = new SelectionSlider(settingModifierButtonX, settingModifierButtonY, WTL_GAME_DATA["menu"]["option_slider"]["x_size"], settingModifierButtonSize, getValueFunction, setValueFunction, setting["options"], undefined, "#108700");
        this.components.push(selectionSlider);
    }
}
MENU_MANAGER.registerMenu(new ExtraSettingsMenu());