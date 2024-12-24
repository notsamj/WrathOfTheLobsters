/*
    Class Name: MenuManager
    Description: A helper class for menus
*/
class MenuManager {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
    }

    getActiveMenu(){
        return this.activeMenu;
    }

    setup(){
        this.mainMenu = new MainMenu();
        this.soundMenu = new SoundMenu();
        this.pauseMenu = new PauseMenu();
        this.extraSettingsMenu = new ExtraSettingsMenu();
        this.gameMakerMenu = new GameMakerUI();
        this.activeMenu = this.mainMenu;
        this.temporaryMessages = new NotSamLinkedList();
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Determine the width of the screen
        Method Return: void
    */
    getWidth(){
        return getScreenWidth();
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Determine the height of the screen
        Method Return: void
    */
    getHeight(){
        return getScreenHeight();
    }

    /*
        Method Name: hasActiveMenu
        Method Parameters: None
        Method Description: Determine if there is an active menu displayed
        Method Return: Boolean
    */
    hasActiveMenu(){
        return this.activeMenu != null;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Display the active menu on the screen and temporary messages
        Method Return: void
    */
    display(){
        if (!this.hasActiveMenu()){ return; }

        // Dispaly the menu
        this.activeMenu.display();

        // Display all temporary messages
        for (let [temporaryMessage, messageIndex] of this.temporaryMessages){
            temporaryMessage.display();
        }

        this.temporaryMessages.deleteWithCondition((temporaryMessage) => { return temporaryMessage.isExpired(); });
    }

    /*
        Method Name: click
        Method Parameters: 
            screenX:
                x location (in screen coordinates) of a click
            screenY:
                y location (in screen coordinates) of a click
        Method Description: Handles the event of a user click
        Method Return: void
    */
    click(screenX, screenY){
        if (!this.hasActiveMenu()){ return; }
        this.activeMenu.click(screenX, this.changeFromScreenY(screenY));
    }

    /*
        Method Name: changeFromScreenY
        Method Parameters: 
            y:
                y coordinate in screen coordinate system
        Method Description: Converts a screen y to a game y
        Method Return: int
    */
    changeFromScreenY(y){
        return this.getHeight() - y;
    }

    /*
        Method Name: changeToScreenY
        Method Parameters: 
            y:
                y coordinate in game coordinate system
        Method Description: Converts a game y to a screen y
        Method Return: int
    */
    changeToScreenY(y){ return this.changeFromScreenY(y); }

    /*
        Method Name: setupClickListener
        Method Parameters: None
        Method Description: Sets up listeners for clicks and escape
        Method Return: void
    */
    static setupClickListener(){
        document.getElementById("canvas").addEventListener("click", (event) => {
            MENU_MANAGER.click(event.clientX, event.clientY);
        });
        document.onkeydown = (event) => {
            if (event.key === "Escape"){
                MENU_MANAGER.escapeKey();
            }
        };
    }

    /*
        Method Name: lostFocus
        Method Parameters: None
        Method Description: Called when focus is lost and launches the pause menu
        Method Return: void
    */
    lostFocus(){
        if (!this.hasActiveMenu()){
            this.switchTo("pauseMenu");
        }
    }

    /*
        Method Name: escapeKey
        Method Parameters: None
        Method Description: Called when escape key is pressed and launches the pause menu (or gets away from it)
        Method Return: void
    */
    escapeKey(){
        if (this.activeMenu == this.pauseMenu){
            this.switchTo("game");
        }else if (!this.hasActiveMenu()){
            this.switchTo("pauseMenu");
        }
    }

    /*
        Method Name: switchTo
        Method Parameters: 
            newMenu:
                String, name of new menu
        Method Description: Switches to desired menu
        Method Return: void
    */
    switchTo(newMenu){
        let enableCursor = true;
        if (newMenu == "main"){
            this.activeMenu = this.mainMenu;
        }else if (newMenu == "pauseMenu"){
            if (!TICK_SCHEDULER.isPaused()){
                TICK_SCHEDULER.pause();
            }
            this.activeMenu = this.pauseMenu;
        }else if (newMenu == "game"){
            if (TICK_SCHEDULER.isPaused()){
                TICK_SCHEDULER.unpause();
            }
            enableCursor = false;
            this.activeMenu = null;
        }else if (newMenu == "game_maker"){
            this.activeMenu = this.gameMakerMenu;
        }else if (newMenu == "sound"){
            this.activeMenu = this.soundMenu;
        }else if (newMenu == "extraSettings"){
            this.activeMenu = this.extraSettingsMenu;
        }else{
            enableCursor = false;
            this.activeMenu = null;
        }
        document.getElementById("canvas").style.cursor = (enableCursor ? "" : "none");
    }

    /*
        Method Name: getMenuByName
        Method Parameters: 
            menuName:
                String, name of menu
        Method Description: Gets a menu instance by its name
        Method Return: Menu
    */
    getMenuByName(menuName){
        if (menuName == "main"){
            return this.mainMenu;
        }else if (menuName == "dogfight"){
            return this.dogfightMenu;
        }else if (menuName == "pauseMenu"){
            return this.pauseMenu;
        }else if (menuName == "multiplayer"){
            return this.multiplayerMenu;
        }else if (menuName == "sound"){
            return this.soundMenu;
        }else if (menuName == "campaign"){
            return this.campaignMenu;
        }else if (menuName == "missionStart"){
            return this.missionStartMenu;
        }else if (menuName == "extraSettings"){
            return this.extraSettingsMenu;
        }else if (menuName == "participant"){
            return this.participantMenu;
        }else if (menuName == "host"){
            return this.hostMenu;
        }else if (menuName == "game_maker"){
            return this.gameMakerMenu;
        }
        // Else
        return null;
    }

    /*
        Method Name: addTemporaryMessage
        Method Parameters:
            message:
                A message to show on the screen
            colour:
                Colour of the temporary message
            timeMS:
                The time that the message appears on screen
        Method Description: Adds a temporary message onto the screen
        Method Return: void
    */
    addTemporaryMessage(message, colour, timeMS=Infinity){
        this.temporaryMessages.add(new TemporaryMessage(message, colour, timeMS));
    }
}

/*
    Class Name: TemporaryMessage
    Description: A temporary message that pops up on the screen
*/
class TemporaryMessage {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(message, colour, timeMS){
        this.message = message;
        this.colour = colour;
        this.expiryLock = new CooldownLock(timeMS);
        this.expiryLock.lock();
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the message on the screen
        Method Return: void
    */
    display(){
        Menu.makeText(this.message, this.colour, 0, getScreenHeight(), getScreenWidth(), getScreenHeight(), "center", "middle");
    }

    /*
        Method Name: isExpired
        Method Parameters: None
        Method Description: Checks if the message is expired
        Method Return: Boolean
    */
    isExpired(){
        return this.expiryLock.isReady();
    }
}