/*
    Class Name: MainMenu
    Description: The main menu inferface
*/
class MainMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        super("main_menu");
        this.setup();
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Setup components in the menu
        Method Return: void
    */
    setup(){
        let buttonSizeX = 800;
        let buttonSizeY = 120;
        let gapSize = 40;
        let buttonX = (innerWidth) => { return (innerWidth - buttonSizeX)/2; }

        // Background
        this.components.push(new LoadingScreenComponent());

        // Logo
        let logoSizeX = 512;
        let logoSizeY = 512;
        let logoX = (innerWidth) => { return 0; }
        let logoY = (innerHeight) => { return innerHeight; }
        this.components.push(new StaticImage(IMAGES["logo"], logoX, logoY, logoSizeX, logoSizeY));

        // Retro Game
        let gameBottonY = (innerHeight) => { return innerHeight - gapSize; };
        let featuredGamemodeJSON = WTL_GAME_DATA["menu"]["menus"]["main_menu"]["featured_gamemode"];
        this.components.push(new RectangleButton(featuredGamemodeJSON["display_name"], "#3bc44b", "#e6f5f4", buttonX, gameBottonY, buttonSizeX, buttonSizeY, (menuInstance) => {
            MENU_MANAGER.switchTo(featuredGamemodeJSON["menu_name"]);
        }));

        // Gamemode viewer
        let gamemodeViewerBottomY = (innerHeight) => { return gameBottonY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Gamemode Viewer", "#3bc44b", "#e6f5f4", buttonX, gamemodeViewerBottomY, buttonSizeX, buttonSizeY, (menuInstance) => {
            MENU_MANAGER.switchTo("gamemode_viewer_menu");
            //GAMEMODE_MANAGER.setActiveGamemode(new TurnBasedSkirmish(WTL_GAME_DATA["test_settings"]["turn_based_skirmish"]["british_are_human"], WTL_GAME_DATA["test_settings"]["turn_based_skirmish"]["americans_are_human"]))
            //MENU_MANAGER.switchTo("game");
        }));

        // Other Projects
        let otherProjectsY = (innerHeight) => { return gamemodeViewerBottomY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("My Projects", "#3bc44b", "#e6f5f4", buttonX, otherProjectsY, buttonSizeX, buttonSizeY, async (menuInstance) => {
            MENU_MANAGER.switchTo("my_projects_menu");
        }));

        // Settings
        let settingsY = (innerHeight) => { return otherProjectsY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Settings", "#3bc44b", "#e6f5f4", buttonX, settingsY, buttonSizeX, buttonSizeY, async (menuInstance) => {
            MENU_MANAGER.switchTo("settings_menu");
        }));

        // Information
        let infoY = 250;
        let infoXSize = (WTL_GAME_DATA["general"]["expected_canvas_width"] - buttonSizeX)/2;
        let infoYSize = 200;
        this.components.push(new TextComponent("Made by notsamj.\nPress 'H' at any time for help!", "#000000", 0, infoY, infoXSize, infoYSize));
    }
}