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
        super();
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

        // Retro Game
        let gameBottonY = (innerHeight) => { return innerHeight - gapSize; };
        this.components.push(new RectangleButton("Retro Game", "#3bc44b", "#e6f5f4", buttonX, gameBottonY, buttonSizeX, buttonSizeY, (menuInstance) => {
            startGame();
            MENU_MANAGER.switchTo("game");
        }));

        // Game Maker
        let gameMakerButtonY = (innerHeight) => { return gameBottonY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Game Maker", "#3bc44b", "#e6f5f4", buttonX, gameMakerButtonY, buttonSizeX, buttonSizeY, (menuInstance) => {
            startGameMaker();
            MENU_MANAGER.switchTo("game_maker");
        }));

        // Sound
        let soundButtonY = (innerHeight) => { return gameMakerButtonY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Sound", "#3bc44b", "#e6f5f4", buttonX, soundButtonY, buttonSizeX, buttonSizeY, async (menuInstance) => {
            MENU_MANAGER.switchTo("sound");
        }));

        // Extra Settings
        let extraSettingsY = (innerHeight) => { return soundButtonY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Settings", "#3bc44b", "#e6f5f4", buttonX, extraSettingsY, buttonSizeX, buttonSizeY, async (menuInstance) => {
            MENU_MANAGER.switchTo("extraSettings");
        }));

        // Information
        let infoY = 250;
        let infoXSize = (RETRO_GAME_DATA["general"]["expected_canvas_width"] - buttonSizeX)/2;
        let infoYSize = 200;
        this.components.push(new TextComponent("Made by notsamj.", "#000000", 0, infoY, infoXSize, infoYSize));
    }

}