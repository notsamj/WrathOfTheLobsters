class HelpMenu extends Menu {
    constructor(){
        super("help_menu");
        this.origin = undefined; // Note: expect overwritten before used
        this.setup();
    }

    setOrigin(originMenu){
        this.origin = originMenu;
    }

    informSwitchedTo(){
        // TODO
    }

    returnToOrigin(){
        MENU_MANAGER.switchToMenu(this.origin);
    }

    setup(){
        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = WTL_GAME_DATA["menu"]["menus"]["help_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            this.returnToOrigin();
        }));
    }
}