class HelpMenu extends Menu {
    constructor(){
        super("help_menu");
        this.origin = undefined; // Note: expect overwritten before used
        this.leftArrow = undefined;
        this.rightArrow = undefined;
        this.numberOfSlidesText = undefined;
        this.helpImage = undefined;

        this.imageNames = undefined;
        this.currentImageIndex = 0;
        this.setup();
    }

    setOrigin(originMenu){
        this.origin = originMenu;
    }

    informSwitchedTo(){
        let helpMenuName;
        if (this.origin != null){
            helpMenuName = this.origin.getName();
        }else{
            helpMenuName = GAMEMODE_MANAGER.getActiveGameName();
        }
        if (helpMenuName === null){
            helpMenuName = "default";
        }
        this.setUpHelpMenu(helpMenuName);
    }

    setUpHelpMenu(helpMenuName){
        let availableMenuJSON = WTL_GAME_DATA["menu"]["menus"]["help_menu"]["help_image"]["images"];
        // If there is no help then go to default
        if (!objectHasKey(availableMenuJSON, helpMenuName)){
            helpMenuName = "default";
        }
        this.imageNames = availableMenuJSON[helpMenuName];
        if (this.imageNames === undefined){
            debugger;
        }
        this.currentImageIndex = 0;
        this.checkDisableArrowButtons();
        this.updateNOSText();
        this.updateImage();
    }

    updateImage(){
        this.helpImage.setImage(IMAGES[this.imageNames[this.currentImageIndex]]);
    }

    returnToOrigin(){
        MENU_MANAGER.switchToMenu(this.origin);
    }

    setup(){
        // Background
        this.components.push(new LoadingScreenComponent(false));

        let menuData = WTL_GAME_DATA["menu"]["menus"]["help_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonYOffset = menuDataBackButton["y_offset"];
        let backButtonY = (innerHeight) => { return innerHeight-backButtonYOffset; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        let backButtonX = menuDataBackButton["x"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], backButtonX, backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            this.returnToOrigin();
        }));

        let menuDataArrowButtons = menuData["arrow_buttons"];
        let arrowXOffset = menuDataArrowButtons["x_offset"];
        let arrowYOffset = menuDataArrowButtons["y_offset"];
        let arrowButtonXSize = menuDataArrowButtons["x_size"];
        let arrowButtonYSize = menuDataArrowButtons["y_size"];
        let leftArrowXFunction = (screenWidth) => {
            return Math.min(arrowXOffset, screenWidth);
        }
        let arrowYFunction = (screenHeight) => {
            return Math.min(screenHeight - arrowButtonYSize, arrowYOffset + arrowButtonYSize);
        }
        let rightArrowXFunction = (screenWidth) => {
            return Math.max(0, screenWidth - arrowXOffset - arrowButtonXSize);
        }

        // Left arrow
        this.leftArrow = new RectangleButton("<-", menuDataArrowButtons["colour_code"], menuDataArrowButtons["text_colour_code"], leftArrowXFunction, arrowYFunction, arrowButtonXSize, arrowButtonYSize, (instance) => {
            this.slide(-1);
        })
        this.components.push(this.leftArrow);

        // Right arrow
        this.rightArrow = new RectangleButton("->", menuDataArrowButtons["colour_code"], menuDataArrowButtons["text_colour_code"], rightArrowXFunction, arrowYFunction, arrowButtonXSize, arrowButtonYSize, (instance) => {
            this.slide(1);
        })
        this.components.push(this.rightArrow);

        // Help image
        let menuDataHelpImage = menuData["help_image"];
        let minHelpImageXSize = menuDataHelpImage["min_x_size"];
        let minHelpImageYSize = menuDataHelpImage["min_y_size"];
        let helpImageXFunction = (screenWidth, helpImageXSize) => {
            if (screenWidth < helpImageXSize){
                return 0;
            }
            return Math.floor((screenWidth - helpImageXSize)/2);
        }
        let helpImageYFunction = (screenHeight, helpImageYSize) => {
            if (screenHeight < helpImageYSize){
                return 0;
            }
            return screenHeight - Math.floor((screenHeight - helpImageYSize)/2)
        }

        let helpImageXSizeFunction = (screenWidth) => {
            let calculatedXSize = screenWidth - arrowButtonXSize * 2 - arrowXOffset * 2;
            return Math.max(minHelpImageXSize, calculatedXSize);
        }

        let helpImageYSizeFunction = (screenHeight) => {
            let calculatedYSize = screenHeight - backButtonYSize - backButtonYOffset - arrowYOffset - arrowButtonYSize;
            return Math.max(minHelpImageYSize, calculatedYSize);
        }

        this.helpImage = new StaticImage(null, helpImageXFunction, helpImageYFunction, helpImageXSizeFunction, helpImageYSizeFunction);
        this.components.push(this.helpImage);

        // Text about number of images
        let numberOfSlidesData = menuData["slide_info_text"];
        let nOSXSize = numberOfSlidesData["x_size"];
        let nOSYSize = numberOfSlidesData["y_size"];
        let nOSYOffset = numberOfSlidesData["y_offset"];

        let nOSXFunction = (screenWidth) => {
            return Math.max(0, screenWidth - arrowXOffset - arrowButtonXSize);
        }

        let nOSYFunction = (screenHeight) => {
            return Math.min(screenHeight - nOSYSize, nOSYOffset + arrowYOffset + nOSYSize + arrowButtonYSize);
        }

        this.numberOfSlidesText = new TextComponent("1/1", numberOfSlidesData["text_colour_code"], nOSXFunction, nOSYFunction, nOSXSize, nOSYSize);
        this.components.push(this.numberOfSlidesText);

        this.setUpHelpMenu("default");
    }

    tick(){
        if (GENERAL_USER_INPUT_MANAGER.isActivated("left_arrow_ticked")){
            this.slide(-1);
        }else if (GENERAL_USER_INPUT_MANAGER.isActivated("right_arrow_ticked")){
            this.slide(1);
        }
        super.tick();
    }

    slide(direction){
        let newIndex = this.currentImageIndex + direction;
        // Ignore invalid indices (shouldn't happen anyway)
        if (newIndex < 0 || newIndex > this.imageNames.length - 1){
            return;
        }
        this.currentImageIndex = newIndex;
        this.checkDisableArrowButtons();
        this.updateNOSText();
        this.updateImage();
    }

    updateNOSText(){
        this.numberOfSlidesText.setText((this.currentImageIndex + 1).toString() + "/" + this.imageNames.length);
    }

    checkDisableArrowButtons(){
        let enabledColourCode = WTL_GAME_DATA["menu"]["menus"]["help_menu"]["arrow_buttons"]["colour_code"];
        let disabledColourCode = WTL_GAME_DATA["menu"]["menus"]["help_menu"]["arrow_buttons"]["disabled_colour_code"];
        // Left arrow
        if (this.currentImageIndex === 0 && this.leftArrow.isEnabled()){
            this.leftArrow.disable();
            this.leftArrow.setColourCode(disabledColourCode);
        }else if (this.currentImageIndex != 0 && this.leftArrow.isDisabled()){
            this.leftArrow.enable();
            this.leftArrow.setColourCode(enabledColourCode);
        }

        // Right arrow
        if (this.currentImageIndex === this.imageNames.length - 1 && this.rightArrow.isEnabled()){
            this.rightArrow.disable();
            this.rightArrow.setColourCode(disabledColourCode);
        }else if (this.currentImageIndex != this.imageNames.length - 1 && this.rightArrow.isDisabled()){
            this.rightArrow.enable();
            this.rightArrow.setColourCode(enabledColourCode);
        }
    }
}