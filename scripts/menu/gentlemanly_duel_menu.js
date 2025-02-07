class GentlemanlyDuelMenu extends Menu {
    constructor(){
        super("gentlemanly_duel_menu");
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

        this.p1GunSkillText = undefined;
        this.p2GunSkillText = undefined;

        this.p1GunSkillSlider = undefined;
        this.p2GunSkillSlider = undefined;

        this.gunSkillDisplayMultiplier = 100;

        this.p1GunSkill = undefined;
        this.p2GunSkill = undefined;

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

        this.maxDigits = WTL_GAME_DATA["menu"]["menus"]["gentlemanly_duel_menu"]["max_digits"];
        this.currentSeedString = undefined;
        this.resetSavedInfo();
    }

    startGame(){
        let gentlemanlyDuelMenu =  WTL_GAME_DATA["menu"]["menus"]["gentlemanly_duel_menu"];
        let gameDetails = copyObject(WTL_GAME_DATA["default_settings"]["gentlemanly_duel"]);

        // p1
        gameDetails["participants"][0]["human"] = this.switchToBotButton.isEnabled();
        gameDetails["participants"][0]["model"] = gentlemanlyDuelMenu["character_image"]["selection_corresponding_models"][this.p1CharacterImage.getImageIndex()];
        gameDetails["participants"][0]["bot_extra_details"]["reaction_time_ms"] = this.p1ReactionTime;
        gameDetails["participants"][0]["extra_details"]["sway_compensation_ability"] = this.p1GunSkill / this.gunSkillDisplayMultiplier;

        // p2
        gameDetails["participants"][1]["human"] = false; // p2 is always a bot
        gameDetails["participants"][1]["model"] = gentlemanlyDuelMenu["character_image"]["selection_corresponding_models"][this.p2CharacterImage.getImageIndex()];
        gameDetails["participants"][1]["bot_extra_details"]["reaction_time_ms"] = this.p2ReactionTime;
        gameDetails["participants"][1]["extra_details"]["sway_compensation_ability"] = this.p2GunSkill / this.gunSkillDisplayMultiplier;

        // Set the seed
        gameDetails["seed"] = parseInt(this.getCurrentSeedString());

        GAMEMODE_MANAGER.setActiveGamemode(new GentlemanlyDuel(gameDetails));
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

    getP1GunSkill(){
        return this.p1GunSkill;
    }

    getP2GunSkill(){
        return this.p2GunSkill;
    }

    setP1GunSkill(newGunSkill){
        this.p1GunSkill = newGunSkill;
    }
    
    setP2GunSkill(newGunSkill){
        this.p2GunSkill = newGunSkill;
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

    getCurrentSeedText(){
        return "Seed: " + this.getCurrentSeedString();
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

    clearSeedGenerator(){
        this.updateCurrentSeedString('0');
    }

    random(){
        this.updateCurrentSeedString(randomNumberInclusive(0, Math.floor(Math.pow(10, this.maxDigits))-1).toString());
    }

    setup(){
        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = WTL_GAME_DATA["menu"]["menus"]["gentlemanly_duel_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            MENU_MANAGER.switchTo("main_menu");
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
        let toggleHumanBotFunction = (gentlemanlyDuelMenu) => {
            return gentlemanlyDuelMenu.toggleP1IsBot();
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
        this.p1ReactionTime = reactionTimeOptions[reactionTimeSliderSettings["p1_default_reaction_time_index"]];
        this.p2ReactionTime = reactionTimeOptions[reactionTimeSliderSettings["p2_default_reaction_time_index"]];

        // P1 Reaction Time Slider
        let p1ReactionTimeGetter = () => { return this.getP1ReactionTime(); }
        let p1ReactionTimeSetter = (newReactionTimeMS) => { this.setP1ReactionTime(newReactionTimeMS); }
        this.p1ReactionTimeSlider = new SelectionSlider(p1StartX, reactionTimeYFunction, reactionTimeSliderSettings["slider_width"], reactionTimeSliderYSliderHeight, reactionTimeSliderYTextHeight, p1ReactionTimeGetter, p1ReactionTimeSetter, reactionTimeOptions, reactionTimeSliderSettings["background_colour_code"], reactionTimeSliderSettings["slider_colour_code"], reactionTimeSliderSettings["text_colour_code"]);
        this.p1ReactionTimeSlider.fullDisable();
        this.components.push(this.p1ReactionTimeSlider);

        // Gun skill text
        let gunSkillTextSettings = menuData["gun_skill_text"];
        let gunSkillTextHeight = gunSkillTextSettings["height"];
        let gunSkillTextYOffset = gunSkillTextSettings["y_offset"];
        let p1GunSkillTextYFunction = (innerHeight) => { return reactionTimeYFunction(innerHeight) - reactionTimeSliderYSize - gunSkillTextYOffset; }
        this.p1GunSkillText = new TextComponent(gunSkillTextSettings["text"], gunSkillTextSettings["text_colour_code"], p1StartX, p1GunSkillTextYFunction, gunSkillTextSettings["width"], gunSkillTextHeight);
        this.components.push(this.p1GunSkillText);

        // Gun skill slider
        let gunSkillSliderSettings = menuData["gun_skill_slider"];
        let gunSkillSliderYOffset = gunSkillSliderSettings["y_offset"];
        let gunSkillSliderYTextHeight = gunSkillSliderSettings["text_height"];
        let gunSkillSliderYSliderHeight = gunSkillSliderSettings["slider_height"];
        let gunSkillSliderYSize = gunSkillSliderYTextHeight + gunSkillSliderYSliderHeight;
        let gunSkillYFunction = (innerHeight) => { return p1GunSkillTextYFunction(innerHeight) - gunSkillTextHeight - gunSkillSliderYOffset; }
        let gunSkillOptions = gunSkillSliderSettings["gun_skill_options"];
        this.p1GunSkill = gunSkillOptions[gunSkillSliderSettings["p1_default_gun_skill_index"]];
        this.p2GunSkill = gunSkillOptions[gunSkillSliderSettings["p2_default_gun_skill_index"]];

        // P1 Gun skill Slider
        let p1GunSkillGetter = () => { return this.getP1GunSkill(); }
        let p1GunSkillSetter = (newGunSkill) => { this.setP1GunSkill(newGunSkill); }
        this.p1GunSkillSlider = new SelectionSlider(p1StartX, gunSkillYFunction, gunSkillSliderSettings["slider_width"], gunSkillSliderYSliderHeight, gunSkillSliderYTextHeight, p1GunSkillGetter, p1GunSkillSetter, gunSkillOptions, gunSkillSliderSettings["background_colour_code"], gunSkillSliderSettings["slider_colour_code"], gunSkillSliderSettings["text_colour_code"]);
        this.components.push(this.p1GunSkillSlider);

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

        // P2 Reaction Time Slider
        let p2ReactionTimeGetter = () => { return this.getP2ReactionTime(); }
        let p2ReactionTimeSetter = (newReactionTimeMS) => { this.setP2ReactionTime(newReactionTimeMS); }
        this.p2ReactionTimeSlider = new SelectionSlider(p2StartX, reactionTimeYFunction, reactionTimeSliderSettings["slider_width"], reactionTimeSliderYSliderHeight, reactionTimeSliderYTextHeight, p2ReactionTimeGetter, p2ReactionTimeSetter, reactionTimeOptions, reactionTimeSliderSettings["background_colour_code"], reactionTimeSliderSettings["slider_colour_code"], reactionTimeSliderSettings["text_colour_code"]);
        this.components.push(this.p2ReactionTimeSlider);

        // Gun skill text
        let p2GunSkillTextYFunction = (innerHeight) => { return reactionTimeYFunction(innerHeight) - reactionTimeSliderYSize - gunSkillTextYOffset; }
        this.p2GunSkillText = new TextComponent(gunSkillTextSettings["text"], gunSkillTextSettings["text_colour_code"], p2StartX, p2GunSkillTextYFunction, gunSkillTextSettings["width"], gunSkillTextHeight);
        this.components.push(this.p2GunSkillText);

        // P2 Gun skill Slider
        let p2GunSkillGetter = () => { return this.getP2GunSkill(); }
        let p2GunSkillSetter = (newGunSkill) => { this.setP2GunSkill(newGunSkill); }
        this.p2GunSkillSlider = new SelectionSlider(p2StartX, gunSkillYFunction, gunSkillSliderSettings["slider_width"], gunSkillSliderYSliderHeight, gunSkillSliderYTextHeight, p2GunSkillGetter, p2GunSkillSetter, gunSkillOptions, gunSkillSliderSettings["background_colour_code"], gunSkillSliderSettings["slider_colour_code"], gunSkillSliderSettings["text_colour_code"]);
        this.components.push(this.p2GunSkillSlider);

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

        // Set the curretNumberString to a random number
        this.random();

        // Start game button
        let startGameButtonY = menuData["start_game_button"]["height"];
        this.components.push(new RectangleButton(menuData["start_game_button"]["text"], menuData["start_game_button"]["colour_code"], menuData["start_game_button"]["text_colour_code"], p1StartX, startGameButtonY, (p2StartX - p1StartX) * 2, menuData["start_game_button"]["height"], (menuInstance) => {
            this.startGame();
        }));
    }
}

MENU_MANAGER.registerMenu(new GentlemanlyDuelMenu());