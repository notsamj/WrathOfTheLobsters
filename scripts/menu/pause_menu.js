/*
    Class Name: PauseMenu
    Description: A subclass of Menu that provides the options to resume or go to main menu.
*/
class PauseMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        super();
        this.setup();
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu interface
        Method Return: void
    */
    setup(){
        let buttonSizeX = 800;
        let buttonSizeY = 120;
        let buttonX = (innerWidth) => {return (innerWidth - buttonSizeX)/2; }

        // Resume
        let resumeButtonY = (innerWidth) => {return 800; };
        this.components.push(new RectangleButton("Resume game", "#3bc44b", "#e6f5f4", buttonX, resumeButtonY, buttonSizeX, buttonSizeY, (instance) => {
            MENU_MANAGER.switchTo("game");
        }));

        // Main Menu
        let mainMenuButtonY = (innerWidth) => {return 600; };
        this.components.push(new RectangleButton("Return to main menu", "#3bc44b", "#e6f5f4", buttonX, mainMenuButtonY, buttonSizeX, buttonSizeY, (instance) => {
            instance.goToMainMenu();
            GAMEMODE_MANAGER.getActiveGamemode().end();
            GAMEMODE_MANAGER.deleteActiveGamemode();
        }));
    }

    /*
        Method Name: goToMainMenu
        Method Parameters: None
        Method Description: Switches from this menu to the main menu
        Method Return: void
    */
    goToMainMenu(){
        MENU_MANAGER.switchTo("main");
    }
}