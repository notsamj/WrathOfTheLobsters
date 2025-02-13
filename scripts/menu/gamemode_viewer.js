/*
    Class Name: GamemodeViewer
    Description: A menu for viewing the various gamemodes available
*/
class GamemodeViewer extends Menu {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("gamemode_viewer_menu");
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu
        Method Return: void
    */
    setup(){
        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = WTL_GAME_DATA["menu"]["menus"]["gamemode_viewer_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            MENU_MANAGER.switchTo("main_menu");
        }));

        // Add the scrollable display
        this.components.push(new ScrollableDisplay(menuData["scrollable_display"], menuData["gamemodes"]));

    }
}

MENU_MANAGER.registerMenu(new GamemodeViewer());