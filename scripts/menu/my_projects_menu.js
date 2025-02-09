class MyProjectsMenu extends Menu {
    constructor(){
        super("my_projects_menu");
        this.leftArrow = undefined;
        this.rightArrow = undefined;
        this.numberOfSlidesText = undefined;
        this.projectImage = undefined;

        this.imageNames = undefined;
        this.currentImageIndex = 0;
    }

    tick(){
        if (GENERAL_USER_INPUT_MANAGER.isActivated("left_arrow_ticked")){
            this.slide(-1);
        }else if (GENERAL_USER_INPUT_MANAGER.isActivated("right_arrow_ticked")){
            this.slide(1);
        }
        super.tick();
    }

    updateImage(){
        this.projectImage.setImage(IMAGES[this.imageNames[this.currentImageIndex]]);
    }

    setup(){
        // Background
        this.components.push(new LoadingScreenComponent(false));

        let menuData = WTL_GAME_DATA["menu"]["menus"]["my_projects_menu"];

        // Get data
        this.imageNames = menuData["project_image"]["images"];
        this.currentImageIndex = 0;

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonYOffset = menuDataBackButton["y_offset"];
        let backButtonY = (innerHeight) => { return innerHeight-backButtonYOffset; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        let backButtonX = menuDataBackButton["x"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], backButtonX, backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            MENU_MANAGER.switchTo("main_menu");
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

        // Project image
        let menuDataProjectImage = menuData["project_image"];
        let minProjectImageXSize = menuDataProjectImage["min_x_size"];
        let minProjectImageYSize = menuDataProjectImage["min_y_size"];
        let projectImageXFunction = (screenWidth, projectImageXSize) => {
            if (screenWidth < projectImageXSize){
                return 0;
            }
            return Math.floor((screenWidth - projectImageXSize)/2);
        }
        let projectImageYFunction = (screenHeight, projectImageYSize) => {
            if (screenHeight < projectImageYSize){
                return 0;
            }
            return screenHeight - Math.floor((screenHeight - projectImageYSize)/2)
        }

        let projectImageXSizeFunction = (screenWidth) => {
            let calculatedXSize = screenWidth - arrowButtonXSize * 2 - arrowXOffset * 2;
            return Math.max(minProjectImageXSize, calculatedXSize);
        }

        let projectImageYSizeFunction = (screenHeight) => {
            let calculatedYSize = screenHeight - backButtonYSize - backButtonYOffset - arrowYOffset - arrowButtonYSize;
            return Math.max(minProjectImageYSize, calculatedYSize);
        }


        this.projectImage = new StaticImage(IMAGES[menuDataProjectImage["images"][0]], projectImageXFunction, projectImageYFunction, projectImageXSizeFunction, projectImageYSizeFunction);
        this.components.push(this.projectImage);

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

        this.checkDisableArrowButtons();
        this.updateNOSText();
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
        let enabledColourCode = WTL_GAME_DATA["menu"]["menus"]["my_projects_menu"]["arrow_buttons"]["colour_code"];
        let disabledColourCode = WTL_GAME_DATA["menu"]["menus"]["my_projects_menu"]["arrow_buttons"]["disabled_colour_code"];
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
MENU_MANAGER.registerMenu(new MyProjectsMenu());