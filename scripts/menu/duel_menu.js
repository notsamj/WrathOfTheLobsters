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
        this.resetSavedInfo();
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
    }
}

MENU_MANAGER.registerMenu("duel_menu", new DuelMenu());