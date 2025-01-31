class LevelGeneratorMenu extends Menu {
    constructor(game=null){
        super();
        // Declare
        this.buttonFor0 = undefined;
        this.buttonFor1 = undefined;
        this.buttonFor2 = undefined;
        this.buttonFor3 = undefined;
        this.buttonFor4 = undefined;
        this.buttonFor5 = undefined;
        this.buttonFor6 = undefined;
        this.buttonFor7 = undefined;
        this.buttonFor8 = undefined;
        this.buttonFor9 = undefined;
        
        this.submitButton = undefined;
        this.clearButton = undefined;
        this.randomButton = undefined;

        this.currentSeedLabel = undefined;

        this.currentPresetLabel = undefined;
        this.leftPresetButton = undefined;
        this.rightPresetButton = undefined;

        this.maxDigits = WTL_GAME_DATA["menu"]["menus"]["level_generator_menu"]["max_digits"];
        this.currentSeedString = undefined;
        this.currentPresetIndex = 0;
        this.presets = WTL_GAME_DATA["level_generator"]["presets"];
        this.ingame = game != null;
        this.game = game;
        if (this.presets.length === 0){
            throw new Error("Cannot run level generator with no presets");
        }
        if (this.ingame){
            // If ingame then setup immediately
            this.setup();
        }
    }

    getPresetName(){
        return this.getPresetData()["name"];
    }

    getPresetData(){
        return this.presets[this.currentPresetIndex];
    }

    getPresetText(){
        return "Preset: " + this.getPresetName();
    }

    getCurrentSeedText(){
        return "Seed: " + this.getCurrentSeedString();
    }

    shiftPreset(direction){
        // Update preset index
        if (direction >= 0){
            this.currentPresetIndex = (this.currentPresetIndex + direction) % this.presets.length;
        }else{
            this.currentPresetIndex = this.currentPresetIndex + direction;
            if (this.currentPresetIndex < 0){
                this.currentPresetIndex = this.presets.length - 1;
            }
        }
        
        // Update the text on the label
        this.currentPresetLabel.setText(this.getPresetText());
    }

    updateCurrentSeedString(newStr){
        this.currentSeedString = newStr;
        this.currentSeedLabel.setText(this.getCurrentSeedText());
    }

    getCurrentSeedString(){
        return this.currentSeedString;
    }

    addNumber(newNumberString){
        // If they try to add to a full seed then just reset
        if (this.currentSeedString.length >= this.maxDigits){
            this.currentSeedString = this.currentSeedString.substring(1, this.maxDigits);
        }

        if (this.currentSeedString === '0'){
            this.updateCurrentSeedString(newNumberString);
        }else{
            this.updateCurrentSeedString(this.currentSeedString + newNumberString);
        }
    }

    clear(){
        this.updateCurrentSeedString('0');
    }

    submit(){
        if (!this.ingame){
            GAMEMODE_MANAGER.setActiveGamemode(new LevelGenerator(this.getPresetData(), parseInt(this.getCurrentSeedString())));
            MENU_MANAGER.switchTo("game");
        }else{
            this.game.loadPreset(this.getPresetName(), parseInt(this.getCurrentSeedString()));
        }
    }

    random(){
        this.updateCurrentSeedString(randomNumberInclusive(0, Math.floor(Math.pow(10, this.maxDigits))-1).toString());
    }

    setup(){
        // Background
        if (!this.ingame){
            this.components.push(new LoadingScreenComponent());
        }

        let menuData = WTL_GAME_DATA["menu"]["menus"]["level_generator_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            MENU_MANAGER.switchTo("main");
        }));

        // Number pad area
        let numberButtonSize = menuData["number_button_size"];
        let numberPadAreaSize = numberButtonSize * 4;

        let xOfButton7 = (innerWidth) => { return Math.floor((innerWidth - numberPadAreaSize) / 2); } 
        let xOfButton8 = (innerWidth) => { return Math.floor((innerWidth - numberPadAreaSize) / 2) + (numberButtonSize + 1); }
        let xOfButton9 = (innerWidth) => { return Math.floor((innerWidth - numberPadAreaSize) / 2) + (numberButtonSize + 1) * 2; }
        let xOfButton4 = xOfButton7;
        let xOfButton5 = xOfButton8;
        let xOfButton6 = xOfButton9;
        let xOfButton1 = xOfButton7;
        let xOfButton2 = xOfButton8;
        let xOfButton3 = xOfButton9;
        let xOfButton0 = xOfButton7;
        let xOfClearButton = xOfButton9;
        let xOfSubmitButton = (innerWidth) => { return Math.floor((innerWidth - numberPadAreaSize) / 2) + (numberButtonSize + 1) * 3; }
        let xOfRandomButton = (innerWidth) => { return Math.floor((innerWidth - numberPadAreaSize) / 2) + (numberButtonSize + 1) * 3; }

        let yOfButton7 = (innerHeight) => { return innerHeight - Math.floor((innerHeight - numberPadAreaSize) / 2); }
        let yOfButton8 = yOfButton7;
        let yOfButton9 = yOfButton7;
        let yOfButton4 = (innerHeight) => { return innerHeight - Math.floor((innerHeight - numberPadAreaSize) / 2) - (numberButtonSize + 1); }
        let yOfButton5 = yOfButton4;
        let yOfButton6 = yOfButton4;
        let yOfButton1 = (innerHeight) => { return innerHeight - Math.floor((innerHeight - numberPadAreaSize) / 2) - (numberButtonSize + 1) * 2; }
        let yOfButton2 = yOfButton1;
        let yOfButton3 = yOfButton1;
        let yOfButton0 = (innerHeight) => { return innerHeight - Math.floor((innerHeight - numberPadAreaSize) / 2) - (numberButtonSize + 1) * 3; }

        let yOfClearButton = yOfButton0;
        let yOfSubmitButton = yOfButton1;
        let yOfRandomButton = yOfButton7;

        let xSizeOf0Button = numberButtonSize * 2 + 1;

        let ySizeOfSubmitButton = numberButtonSize * 2 + 1;
        let ySizeOfRandomButton = ySizeOfSubmitButton;

        let buttonColourCode = menuData["number_button_colour_code"];
        let buttonTextColourCode = menuData["number_button_text_colour_code"];


        // Numpad
        this.components.push(new RectangleButton('7', buttonColourCode, buttonTextColourCode, xOfButton7, yOfButton7, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('7');
        }));

        this.components.push(new RectangleButton('8', buttonColourCode, buttonTextColourCode, xOfButton8, yOfButton8, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('8');
        }));

        this.components.push(new RectangleButton('9', buttonColourCode, buttonTextColourCode, xOfButton9, yOfButton9, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('9');
        }));

        this.components.push(new RectangleButton("RANDOM", buttonColourCode, buttonTextColourCode, xOfRandomButton, yOfRandomButton, numberButtonSize, ySizeOfRandomButton, (menuInstance) => {
            this.random();
        }));

        this.components.push(new RectangleButton('4', buttonColourCode, buttonTextColourCode, xOfButton4, yOfButton4, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('4');
        }));

        this.components.push(new RectangleButton('5', buttonColourCode, buttonTextColourCode, xOfButton5, yOfButton5, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('5');
        }));

        this.components.push(new RectangleButton('6', buttonColourCode, buttonTextColourCode, xOfButton6, yOfButton6, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('6');
        }));

        this.components.push(new RectangleButton('1', buttonColourCode, buttonTextColourCode, xOfButton1, yOfButton1, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('1');
        }));

        this.components.push(new RectangleButton('2', buttonColourCode, buttonTextColourCode, xOfButton2, yOfButton2, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('2');
        }));

        this.components.push(new RectangleButton('3', buttonColourCode, buttonTextColourCode, xOfButton3, yOfButton3, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.addNumber('3');
        }));

        this.components.push(new RectangleButton("SUBMIT", buttonColourCode, buttonTextColourCode, xOfSubmitButton, yOfSubmitButton, numberButtonSize, ySizeOfSubmitButton, (menuInstance) => {
            this.submit();
        }));

        this.components.push(new RectangleButton('0', buttonColourCode, buttonTextColourCode, xOfButton0, yOfButton0, xSizeOf0Button, numberButtonSize, (menuInstance) => {
            this.addNumber('0');
        }));

        this.components.push(new RectangleButton("CLEAR", buttonColourCode, buttonTextColourCode, xOfClearButton, yOfClearButton, numberButtonSize, numberButtonSize, (menuInstance) => {
            this.clear();
        }));

        let currentSeedLabelX = (innerWidth) => { return Math.floor((innerWidth - numberPadAreaSize) / 2) + (numberButtonSize + 1) * 2; };
        let currentSeedLabelY = (innerHeight) => { return Math.floor(innerHeight - (innerHeight - numberPadAreaSize) / 2 - (numberButtonSize + 1) * 4.5); }
        let currentSeedXSize = numberButtonSize + (numberButtonSize + 1) * 3;
        let currentSeedYSize = numberButtonSize;
        
        let generalTextColourCode = buttonTextColourCode;

        // Current seed
        this.currentSeedLabel = new TextComponent(this.getCurrentSeedText(), generalTextColourCode, currentSeedLabelX, currentSeedLabelY, currentSeedXSize, currentSeedYSize, "center", "center");
        this.components.push(this.currentSeedLabel);

        // Preset stuff
        let currentPresetLabelX = currentSeedLabelX;
        let currentPresetLabelY = (innerHeight) => { return innerHeight - Math.floor((innerHeight - numberPadAreaSize) / 2) + numberButtonSize/2; }
        let currentPresetXSize = numberButtonSize + (numberButtonSize + 1);
        let currentPresetYSize = numberButtonSize;
        
        // Current preset label
        this.currentPresetLabel = new TextComponent(this.getPresetText(), generalTextColourCode, currentPresetLabelX, currentPresetLabelY, currentPresetXSize, currentPresetYSize, "center", "center");
        this.components.push(this.currentPresetLabel);

        // Left and right preset buttons
        let leftPresetButtonX = xOfButton0;
        let rightPresetButtonX = xOfRandomButton;
        let lrPresetButtonY = (innerHeight) => { return innerHeight - Math.floor((innerHeight - numberPadAreaSize) / 2) + numberButtonSize + 1; };
        let lrPresetButtonSize = numberButtonSize;
        this.leftPresetButton = new RectangleButton('<', buttonColourCode, generalTextColourCode, leftPresetButtonX, lrPresetButtonY, lrPresetButtonSize, lrPresetButtonSize, (menuInstance) => {
            this.shiftPreset(-1);
        });
        this.components.push(this.leftPresetButton);
        this.rightPresetButton = new RectangleButton('>', buttonColourCode, generalTextColourCode, rightPresetButtonX, lrPresetButtonY, lrPresetButtonSize, lrPresetButtonSize, (menuInstance) => {
            this.shiftPreset(1);
        });
        this.components.push(this.rightPresetButton);

        // Set the curretNumberString to a random number
        this.random();
    }
}

MENU_MANAGER.registerMenu("level_generator_menu", new LevelGeneratorMenu());