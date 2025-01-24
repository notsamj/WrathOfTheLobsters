class DuelMenu extends Menu {
    constructor(){
        super();
        // Declare
        this.p1CharacterImage = undefined;
        this.switchToHumanButton = undefined;
        this.switchToBotButton = undefined;
        this.p1ReactionTimeText = undefined;
        this.p2ReactionTimeText = undefined;
        this.p1ReactionTimeSlider = undefined;
        this.p2ReactionTimeSlider = undefined;
        this.p1ReactionTime = undefined;
        this.p2ReactionTime = undefined;

        this.p1KnifeImage = undefined;
        this.p1KnifeBlockImage = undefined;

        this.p1SwordImage = undefined;
        this.p1SwordBlockImage = undefined;

        this.p1MusketImage = undefined;
        this.p1MusketBlockImage = undefined;

        this.p1PistolImage = undefined;
        this.p1PistolBlockImage = undefined;

        this.p2KnifeImage = undefined;
        this.p2KnifeBlockImage = undefined;

        this.p2SwordImage = undefined;
        this.p2SwordBlockImage = undefined;

        this.p2MusketImage = undefined;
        this.p2MusketBlockImage = undefined;

        this.p2PistolImage = undefined;
        this.p2PistolBlockImage = undefined;

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
        
        this.clearButton = undefined;
        this.randomButton = undefined;

        this.currentSeedLabel = undefined;

        this.currentPresetLabel = undefined;
        this.leftPresetButton = undefined;
        this.rightPresetButton = undefined;

        this.maxDigits = WTL_GAME_DATA["menu"]["menus"]["duel_menu"]["max_digits"];
        this.currentSeedString = undefined;
        this.currentPresetIndex = 0;
        this.presets = WTL_GAME_DATA["level_generator"]["presets"];
        if (this.presets.length === 0){
            throw new Error("Cannot run level generator with no presets");
        }
        this.resetSavedInfo();
    }

    startGame(){
        let duelMenu =  WTL_GAME_DATA["menu"]["menus"]["duel_menu"];
        let gameDetails = copyObject(WTL_GAME_DATA["default_settings"]["duel"]);

        // p1
        gameDetails["participants"][0]["human"] = this.switchToBotButton.isEnabled();
        gameDetails["participants"][0]["model"] = duelMenu["character_image"]["selection_corresponding_models"][this.p1CharacterImage.getImageIndex()];
        gameDetails["participants"][0]["bot_extra_details"]["reaction_time_ms"] = this.p1ReactionTimeSlider.accessValue();

        if (!this.p1KnifeBlockImage.isDisplayEnabled()){
            gameDetails["participants"][0]["swords"].push(duelMenu["weapon_data"]["knife_model"]);
        }

        if (!this.p1SwordBlockImage.isDisplayEnabled()){
            gameDetails["participants"][0]["swords"].push(duelMenu["weapon_data"]["sword_model"]);
        }

        if (!this.p1MusketBlockImage.isDisplayEnabled()){
            gameDetails["participants"][0]["muskets"].push(duelMenu["weapon_data"]["musket_model"]);
        }

        if (!this.p1PistolBlockImage.isDisplayEnabled()){
            gameDetails["participants"][0]["pistols"].push(duelMenu["weapon_data"]["pistol_model"]);
        }

        // p2
        gameDetails["participants"][1]["human"] = false; // p2 is always a bot
        gameDetails["participants"][1]["model"] = duelMenu["character_image"]["selection_corresponding_models"][this.p2CharacterImage.getImageIndex()];
        gameDetails["participants"][1]["bot_extra_details"]["reaction_time_ms"] = this.p2ReactionTimeSlider.accessValue();

        if (!this.p2KnifeBlockImage.isDisplayEnabled()){
            gameDetails["participants"][1]["swords"].push(duelMenu["weapon_data"]["knife_model"]);
        }

        if (!this.p2SwordBlockImage.isDisplayEnabled()){
            gameDetails["participants"][1]["swords"].push(duelMenu["weapon_data"]["sword_model"]);
        }

        if (!this.p2MusketBlockImage.isDisplayEnabled()){
            gameDetails["participants"][1]["muskets"].push(duelMenu["weapon_data"]["musket_model"]);
        }

        if (!this.p2PistolBlockImage.isDisplayEnabled()){
            gameDetails["participants"][1]["pistols"].push(duelMenu["weapon_data"]["pistol_model"]);
        }

        // Set the seed
        gameDetails["seed"] = parseInt(this.getCurrentSeedString());

        // Set the preset data
        gameDetails["preset_data"] = this.getPresetData();

        GAMEMODE_MANAGER.setActiveGamemode(new Duel(gameDetails));
        MENU_MANAGER.switchTo("game");
    }

    getP1ReactionTime(){
        return this.p1ReactionTime;
    }

    getP2ReactionTime(){
        return this.p2ReactionTime;
    }

    setP1ReactionTime(newReactionTimeMS){
        this.p1ReactionTime = newReactionTimeMS;
    }
    
    setP2ReactionTime(newReactionTimeMS){
        this.p2ReactionTime = newReactionTimeMS;
    }

    resetSavedInfo(){
        this.p1IsBot = false;
    }

    toggleP1IsBot(){
        this.p1IsBot = !this.p1IsBot;
        let switchedToBot = this.p1IsBot;

        if (switchedToBot){
            this.switchToBotButton.fullDisable();
            this.switchToHumanButton.fullEnable();

            this.p1ReactionTimeText.fullEnable();
            this.p1ReactionTimeSlider.fullEnable();
        }else{
            this.switchToBotButton.fullEnable();
            this.switchToHumanButton.fullDisable();

            this.p1ReactionTimeText.fullDisable();
            this.p1ReactionTimeSlider.fullDisable();
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
        if (this.currentSeedString.length >= this.maxDigits){
            return;
        }else if (this.currentSeedString === '0'){
            this.updateCurrentSeedString(newNumberString);
        }else{
            this.updateCurrentSeedString(this.currentSeedString + newNumberString);
        }
    }

    clearSeedGenerator(){
        this.updateCurrentSeedString('0');
    }

    random(){
        this.updateCurrentSeedString(randomNumberInclusive(0, Math.floor(Math.pow(10, this.maxDigits))-1).toString());
    }

    setup(){
        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = WTL_GAME_DATA["menu"]["menus"]["duel_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            MENU_MANAGER.switchTo("main");
        }));

        let sectionHeadYFunction = (innerHeight) => { return innerHeight; }
        let sectionHeadYSize = menuData["section_head"]["y_size"];
        let characterImageYOffset = menuData["character_image"]["y_offset"];
        let characterImageYFunction = (innerHeight) => { return sectionHeadYFunction(innerHeight) - sectionHeadYSize - characterImageYOffset; }

        // Player 1
        let p1StartX = menuData["p1_start_x"];

        // Head text
        this.components.push(new TextComponent(menuData["section_head"]["p1_name"], menuData["section_head"]["text_colour_code"], p1StartX, sectionHeadYFunction, menuData["section_head"]["x_size"], sectionHeadYSize))
        
        // Character image
        let characterImageHeight = menuData["character_image"]["height"];
        this.p1CharacterImage = new RotatingStaticImage("british_officer_64", p1StartX, characterImageYFunction, menuData["character_image"]["selection"], menuData["character_image"]["width"], characterImageHeight);
        this.components.push(this.p1CharacterImage);
    
        // Toggle buttons
        let toggleButtonData = menuData["toggle_bot_button"];
        let toggleButtonYOffset = toggleButtonData["y_offset"];
        let toggleButtonYSize = toggleButtonData["y_size"];
        let toggleButtonYFunction = (innerHeight) => { return characterImageYFunction(innerHeight) - characterImageHeight - toggleButtonYOffset; }
        let toggleHumanBotFunction = (duelMenu) => {
            return duelMenu.toggleP1IsBot();
        }

        // Switch to human button
        this.switchToHumanButton = new RectangleButton(toggleButtonData["bot_text"], toggleButtonData["bot_colour_code"], toggleButtonData["text_colour_code"], p1StartX, toggleButtonYFunction, toggleButtonData["x_size"], toggleButtonYSize, toggleHumanBotFunction);
        this.components.push(this.switchToHumanButton);
        // Disable by default
        this.switchToHumanButton.fullDisable();

        // Switch to bot button
        this.switchToBotButton = new RectangleButton(toggleButtonData["human_text"], toggleButtonData["human_colour_code"], toggleButtonData["text_colour_code"], p1StartX, toggleButtonYFunction, toggleButtonData["x_size"], toggleButtonYSize, toggleHumanBotFunction);
        this.components.push(this.switchToBotButton);

        // Reaction time text
        let reactionTimeTextSettings = menuData["reaction_time_text"];
        let reactionTimeTextHeight = reactionTimeTextSettings["height"];
        let reactionTimeTextYOffset = reactionTimeTextSettings["y_offset"];
        let reactionTimeTextYFunction = (innerHeight) => { return toggleButtonYFunction(innerHeight) - toggleButtonYSize - reactionTimeTextYOffset; }
        this.p1ReactionTimeText = new TextComponent(reactionTimeTextSettings["text"], reactionTimeTextSettings["text_colour_code"], p1StartX, reactionTimeTextYFunction, reactionTimeTextSettings["width"], reactionTimeTextHeight);
        this.p1ReactionTimeText.fullDisable();
        this.components.push(this.p1ReactionTimeText);

        // Reaction time ms slider
        let reactionTimeSliderSettings = menuData["reaction_time_slider"];
        let reactionTimeSliderYOffset = reactionTimeSliderSettings["y_offset"];
        let reactionTimeSliderYTextHeight = reactionTimeSliderSettings["text_height"];
        let reactionTimeSliderYSliderHeight = reactionTimeSliderSettings["slider_height"];
        let reactionTimeSliderYSize = reactionTimeSliderYTextHeight + reactionTimeSliderYSliderHeight;
        let reactionTimeOptions = reactionTimeSliderSettings["reaction_time_options"];
        let reactionTimeYFunction = (innerHeight) => { return reactionTimeTextYFunction(innerHeight) - reactionTimeTextHeight - reactionTimeSliderYOffset; }
        this.p1ReactionTime = reactionTimeOptions[0];
        this.p2ReactionTime = reactionTimeOptions[0];

        // P1 Slider
        let p1ReactionTimeGetter = () => { return this.getP1ReactionTime(); }
        let p1ReactionTimeSetter = (newReactionTimeMS) => { this.setP1ReactionTime(newReactionTimeMS); }
        this.p1ReactionTimeSlider = new SelectionSlider(p1StartX, reactionTimeYFunction, reactionTimeSliderSettings["slider_width"], reactionTimeSliderYSliderHeight, reactionTimeSliderYTextHeight, p1ReactionTimeGetter, p1ReactionTimeSetter, reactionTimeOptions, reactionTimeSliderSettings["background_colour_code"], reactionTimeSliderSettings["slider_colour_code"], reactionTimeSliderSettings["text_colour_code"]);
        this.p1ReactionTimeSlider.fullDisable();
        this.components.push(this.p1ReactionTimeSlider);

        // P1 Weapons
        let weaponSettings = menuData["weapon_data"];
        let weaponMaxWidth = weaponSettings["width"];
        let weaponMaxHeight = weaponSettings["height"];
        let weaponYOffset = weaponSettings["y_offset"];

        let swordImageYFunction = (innerHeight) => { return reactionTimeYFunction(innerHeight) - reactionTimeSliderYSize - weaponYOffset; }
        this.p1SwordImage = new StaticImage(IMAGES[weaponSettings["sword_image_name"]], p1StartX, swordImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p1SwordImage);
        this.p1SwordBlockImage = new StaticImage(IMAGES["crossed_out"], p1StartX, swordImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p1SwordBlockImage.disableDisplay();
        this.components.push(this.p1SwordBlockImage);
        this.p1SwordBlockImage.setOnClick(() => {
            if (this.p1SwordBlockImage.isDisplayEnabled()){
                this.p1SwordBlockImage.disableDisplay();
            }else{
                this.p1SwordBlockImage.enableDisplay();
            }
        });

        let knifeImageYFunction = (innerHeight) => { return swordImageYFunction(innerHeight) - weaponMaxHeight - weaponYOffset; }
        this.p1KnifeImage = new StaticImage(IMAGES[weaponSettings["knife_image_name"]], p1StartX, knifeImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p1KnifeImage);
        this.p1KnifeBlockImage = new StaticImage(IMAGES["crossed_out"], p1StartX, knifeImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p1KnifeBlockImage.disableDisplay();
        this.components.push(this.p1KnifeBlockImage);
        this.p1KnifeBlockImage.setOnClick(() => {
            if (this.p1KnifeBlockImage.isDisplayEnabled()){
                this.p1KnifeBlockImage.disableDisplay();
            }else{
                this.p1KnifeBlockImage.enableDisplay();
            }
        });
        
        let pistolImageYFunction = (innerHeight) => { return knifeImageYFunction(innerHeight) - weaponMaxHeight - weaponYOffset; }
        this.p1PistolImage = new StaticImage(IMAGES[weaponSettings["pistol_image_name"]], p1StartX, pistolImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p1PistolImage);
        this.p1PistolBlockImage = new StaticImage(IMAGES["crossed_out"], p1StartX, pistolImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p1PistolBlockImage.disableDisplay();
        this.components.push(this.p1PistolBlockImage);
        this.p1PistolBlockImage.setOnClick(() => {
            if (this.p1PistolBlockImage.isDisplayEnabled()){
                this.p1PistolBlockImage.disableDisplay();
            }else{
                this.p1PistolBlockImage.enableDisplay();
            }
        });
        
        let musketImageYFunction = (innerHeight) => { return pistolImageYFunction(innerHeight) - weaponMaxHeight - weaponYOffset; }
        this.p1MusketImage = new StaticImage(IMAGES[weaponSettings["musket_image_name"]], p1StartX, musketImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p1MusketImage);
        this.p1MusketBlockImage = new StaticImage(IMAGES["crossed_out"], p1StartX, musketImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p1MusketBlockImage.disableDisplay();
        this.components.push(this.p1MusketBlockImage);
        this.p1MusketBlockImage.setOnClick(() => {
            if (this.p1MusketBlockImage.isDisplayEnabled()){
                this.p1MusketBlockImage.disableDisplay();
            }else{
                this.p1MusketBlockImage.enableDisplay();
            }
        });

        // Player 2
        let p2StartX = menuData["p2_start_x"];

        // Head text
        this.components.push(new TextComponent(menuData["section_head"]["p2_name"], menuData["section_head"]["text_colour_code"], p2StartX, sectionHeadYFunction, menuData["section_head"]["x_size"], sectionHeadYSize))
        
        // Character image
        this.p2CharacterImage = new RotatingStaticImage("usa_officer_64", p2StartX, characterImageYFunction, menuData["character_image"]["selection"], menuData["character_image"]["width"], characterImageHeight);
        this.components.push(this.p2CharacterImage);

        // Bot text
        let botText = new TextComponent(toggleButtonData["bot_text"], toggleButtonData["bot_colour_code"], p2StartX, toggleButtonYFunction, toggleButtonData["x_size"], toggleButtonYSize);
        this.components.push(botText);

        // Reaction time text
        this.p2ReactionTimeText = new TextComponent(reactionTimeTextSettings["text"], reactionTimeTextSettings["text_colour_code"], p2StartX, reactionTimeTextYFunction, reactionTimeTextSettings["width"], reactionTimeTextHeight);
        this.components.push(this.p2ReactionTimeText);

        // Reaction time ms slider

        // P2 Slider
        let p2ReactionTimeGetter = () => { return this.getP2ReactionTime(); }
        let p2ReactionTimeSetter = (newReactionTimeMS) => { this.setP2ReactionTime(newReactionTimeMS); }
        this.p2ReactionTimeSlider = new SelectionSlider(p2StartX, reactionTimeYFunction, reactionTimeSliderSettings["slider_width"], reactionTimeSliderYSliderHeight, reactionTimeSliderYTextHeight, p2ReactionTimeGetter, p2ReactionTimeSetter, reactionTimeOptions, reactionTimeSliderSettings["background_colour_code"], reactionTimeSliderSettings["slider_colour_code"], reactionTimeSliderSettings["text_colour_code"]);
        this.components.push(this.p2ReactionTimeSlider);

        // P2 Weapons

        this.p2SwordImage = new StaticImage(IMAGES[weaponSettings["sword_image_name"]], p2StartX, swordImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p2SwordImage);
        this.p2SwordBlockImage = new StaticImage(IMAGES["crossed_out"], p2StartX, swordImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p2SwordBlockImage.disableDisplay();
        this.components.push(this.p2SwordBlockImage);
        this.p2SwordBlockImage.setOnClick(() => {
            if (this.p2SwordBlockImage.isDisplayEnabled()){
                this.p2SwordBlockImage.disableDisplay();
            }else{
                this.p2SwordBlockImage.enableDisplay();
            }
        });

        this.p2KnifeImage = new StaticImage(IMAGES[weaponSettings["knife_image_name"]], p2StartX, knifeImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p2KnifeImage);
        this.p2KnifeBlockImage = new StaticImage(IMAGES["crossed_out"], p2StartX, knifeImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p2KnifeBlockImage.disableDisplay();
        this.components.push(this.p2KnifeBlockImage);
        this.p2KnifeBlockImage.setOnClick(() => {
            if (this.p2KnifeBlockImage.isDisplayEnabled()){
                this.p2KnifeBlockImage.disableDisplay();
            }else{
                this.p2KnifeBlockImage.enableDisplay();
            }
        });
        
        this.p2PistolImage = new StaticImage(IMAGES[weaponSettings["pistol_image_name"]], p2StartX, pistolImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p2PistolImage);
        this.p2PistolBlockImage = new StaticImage(IMAGES["crossed_out"], p2StartX, pistolImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p2PistolBlockImage.disableDisplay();
        this.components.push(this.p2PistolBlockImage);
        this.p2PistolBlockImage.setOnClick(() => {
            if (this.p2PistolBlockImage.isDisplayEnabled()){
                this.p2PistolBlockImage.disableDisplay();
            }else{
                this.p2PistolBlockImage.enableDisplay();
            }
        });
        
        this.p2MusketImage = new StaticImage(IMAGES[weaponSettings["musket_image_name"]], p2StartX, musketImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.components.push(this.p2MusketImage);
        this.p2MusketBlockImage = new StaticImage(IMAGES["crossed_out"], p2StartX, musketImageYFunction, weaponMaxWidth, weaponMaxHeight);
        this.p2MusketBlockImage.disableDisplay();
        this.components.push(this.p2MusketBlockImage);
        this.p2MusketBlockImage.setOnClick(() => {
            if (this.p2MusketBlockImage.isDisplayEnabled()){
                this.p2MusketBlockImage.disableDisplay();
            }else{
                this.p2MusketBlockImage.enableDisplay();
            }
        });

        // Level generator stuff
        let levelGeneratorStartX = menuData["level_generator_start_x"];

        // Number pad area
        let numberButtonSize = menuData["number_button_size"];
        let numberPadAreaSize = numberButtonSize * 4;

        let xOfButton7 = levelGeneratorStartX
        let xOfButton8 = levelGeneratorStartX + (numberButtonSize + 1);
        let xOfButton9 = levelGeneratorStartX + (numberButtonSize + 1) * 2;
        let xOfButton4 = xOfButton7;
        let xOfButton5 = xOfButton8;
        let xOfButton6 = xOfButton9;
        let xOfButton1 = xOfButton7;
        let xOfButton2 = xOfButton8;
        let xOfButton3 = xOfButton9;
        let xOfButton0 = xOfButton7;
        let xOfClearButton = xOfButton9;
        let xOfRandomButton = levelGeneratorStartX + (numberButtonSize + 1) * 3;

        let xSizeOfClearButton = 2 * numberButtonSize + 1;

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
        let yOfRandomButton = yOfButton7;

        let xSizeOf0Button = numberButtonSize * 2 + 1;

        let ySizeOfRandomButton = numberButtonSize + 2 * (numberButtonSize + 1);

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

        this.components.push(new RectangleButton('0', buttonColourCode, buttonTextColourCode, xOfButton0, yOfButton0, xSizeOf0Button, numberButtonSize, (menuInstance) => {
            this.addNumber('0');
        }));

        this.components.push(new RectangleButton("CLEAR", buttonColourCode, buttonTextColourCode, xOfClearButton, yOfClearButton, xSizeOfClearButton, numberButtonSize, (menuInstance) => {
            this.clearSeedGenerator();
        }));

        let currentSeedLabelX = levelGeneratorStartX + (numberButtonSize + 1) * 2;
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

        // Start game button
        let startGameButtonYFunction = (innerHeight) => { return musketImageYFunction(innerHeight) - weaponMaxHeight - weaponYOffset; }
        this.components.push(new RectangleButton(menuData["start_game_button"]["text"], menuData["start_game_button"]["colour_code"], menuData["start_game_button"]["text_colour_code"], p1StartX, startGameButtonYFunction, (p2StartX - p1StartX), menuData["start_game_button"]["height"], (menuInstance) => {
            this.startGame();
        }));
    }
}

MENU_MANAGER.registerMenu("duel_menu", new DuelMenu());