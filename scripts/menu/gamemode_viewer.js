class GamemodeViewer extends Menu {

    constructor(){
        super();
    }

    setup(){
        let sectionYSize = 50;

        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = WTL_GAME_DATA["menu"]["menus"]["gamemode_viewer"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = 200;
        let backButtonYSize = 76;
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            instance.goToMainMenu();
        }));

        // Add the scrollable display
        this.components.push(new ScrollableDisplay(menuData["scrollable_display"], menuData["gamemodes"]));

    }

    goToMainMenu(){
        MENU_MANAGER.switchTo("main");
    }
}

MENU_MANAGER.registerMenu("gamemode_viewer", new GamemodeViewer());