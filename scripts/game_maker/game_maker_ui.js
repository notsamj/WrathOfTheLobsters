class GameMakerUI extends Menu {
    constructor(){
        super();
        this.imageSelector = null; // Placeholder
        this.visualImages = [];
        this.physicalImages = [];
        this.game = undefined; // Declare
    }

    setup(){
        this.loadPhysicalImages();
        this.setupTopBar();
        this.setupBottomBar();
    }

    informSwitchedTo(){
        this.game = new GameMaker(this);
        GAMEMODE_MANAGER.setActiveGamemode(this.game);
    }

    blocksWindowLocation(windowX, windowY){
        if (!this.game.isDisplayingHUD()){ return false; }
        return windowY <= WTL_GAME_DATA["ui"]["game_maker"]["top_bar_height"] || windowY >= getScreenHeight() - WTL_GAME_DATA["ui"]["game_maker"]["bottom_bar_height"];
    }

    loadPhysicalImages(){
        let tiles = WTL_GAME_DATA["physical_tiles"];
        let selectableImages = [];
        for (let tileDetails of tiles){
            // Check if image already exists
            if (!objectHasKey(IMAGES, tileDetails["name"])){
                let image = document.createElement("img");
                image.src = tileDetails["file_link"];
                IMAGES[tileDetails["name"]] = image;
            }
            selectableImages.push(new SelectableImage(tileDetails, (tileDetails) => { GAMEMODE_MANAGER.getActiveGamemode().getTilePlacer().setPhysicalMaterial(tileDetails); }));
        }
        this.physicalImages = selectableImages;
    }

    setVisualImages(visualImages){
        this.visualImages = visualImages;
        // Make sure to update if not showing physical layer atm
        if (!GAMEMODE_MANAGER.getActiveGamemode().isDisplayingPhysicalLayer()){
            this.imageSelector.setImages(this.visualImages);
        }
    }

    // Note: This function exists because the ui is persistent wheras GameMaker instances get delete and remade. Each time one is remade it triggers this reset function
    reset(){
        this.connectionButton.setNotConnected();
        this.imageSelector.clear();
    }

    isConnected(){
        return this.connectionButton.isConnected();
    }

    notConnected(){
        return this.connectButton.notConnected();
    }

    getConnectionButton(){
        return this.connectionButton;
    }

    setupTopBar(){
        let topBarHeight = 100;
        this.topBar = new ComponentGroup();
        
        let purpleColour = Colour.fromCode(WTL_GAME_DATA["ui"]["game_maker"]["purple_code"]);

        // Add Background of Top Bar
        this.topBar.addComponent(new SimpleComponent(() => {
            noStrokeRectangle(purpleColour, 0, 0, getScreenWidth(), topBarHeight);
        }));

        // Back Button
        let backButtonWidth = 100;
        this.topBar.addComponent(new RectangleButton("Main Menu", purpleColour.toCode(), "#ffffff", (innerWidth) => { return innerWidth - backButtonWidth; }, (innerHeight) => { return innerHeight }, backButtonWidth, topBarHeight, (menuInstance) => {
            MENU_MANAGER.switchTo("main");
            GAMEMODE_MANAGER.getActiveGamemode().end();
            GAMEMODE_MANAGER.deleteActiveGamemode();
        }));

        // Connect buotton
        let connectionButtonSize = 100;
        this.connectionButton = new ConnectButton("#ffffff", 0, (innerHeight) => { return innerHeight; }, connectionButtonSize, connectionButtonSize);
        this.topBar.addComponent(this.connectionButton);

        // Load Materials Button
        let loadButtonWidth = 100;
        this.topBar.addComponent(new RectangleButton("Load Materials", purpleColour.toCode(), "#ffffff", (innerWidth) => { return connectionButtonSize; }, (innerHeight) => { return innerHeight }, loadButtonWidth, topBarHeight, async (menuInstance) => {
            if (menuInstance.getConnectionButton().notConnected()){ return; }
            await GAMEMODE_MANAGER.getActiveGamemode().loadMaterials(prompt("Please enter the material file name to load:", "default.json"));
        }));

        // Load Level Button
        this.topBar.addComponent(new RectangleButton("Load Level", purpleColour.toCode(), "#ffffff", (innerWidth) => { return connectionButtonSize + loadButtonWidth; }, (innerHeight) => { return innerHeight }, loadButtonWidth, topBarHeight, (menuInstance) => {
            if (menuInstance.getConnectionButton().notConnected()){ return; }
            GAMEMODE_MANAGER.getActiveGamemode().loadLevel(prompt("Please enter the level name to save:", "default.json"));
        }));

        // Load Level Button
        this.topBar.addComponent(new RectangleButton("Save Level", purpleColour.toCode(), "#ffffff", (innerWidth) => { return connectionButtonSize + loadButtonWidth * 2; }, (innerHeight) => { return innerHeight }, loadButtonWidth, topBarHeight, (menuInstance) => {
            if (menuInstance.getConnectionButton().notConnected()){ return; }
            GAMEMODE_MANAGER.getActiveGamemode().saveLevel(prompt("Please enter the level name to save:", "default.json"));
        }));
    }

    setupBottomBar(){
        let bottomBarHeight = 100;
        this.bottomBar = new ComponentGroup();

        let purpleColour = Colour.fromCode(WTL_GAME_DATA["ui"]["game_maker"]["purple_code"]);

        // Add Background of Back Bar
        this.bottomBar.addComponent(new SimpleComponent(() => {
            noStrokeRectangle(purpleColour, 0, getScreenHeight() - bottomBarHeight, getScreenWidth(), bottomBarHeight);
        }));

        // Toggle Visual and Visual Button
        let toggleButtonWidth = 100;
        this.toggleButton = new RectangleButton("Visual", purpleColour.toCode(), "#ffffff", (innerWidth) => { return innerWidth - toggleButtonWidth; }, (innerHeight) => { return bottomBarHeight }, toggleButtonWidth, bottomBarHeight, (menuInstance) => {
            menuInstance.toggleVisualPhysical();
        });
        this.bottomBar.addComponent(this.toggleButton);

        // Image Selector
        let imageWidth = WTL_GAME_DATA["ui"]["game_maker"]["image_width"];
        let imageHeight = WTL_GAME_DATA["ui"]["game_maker"]["image_height"];
        this.imageSelector = new ImageSelector((innerWidth) => { return 0; }, (innerHeight) => { return bottomBarHeight; }, (innerWidth) => { return innerWidth - toggleButtonWidth }, imageWidth, imageHeight);
        this.bottomBar.addComponent(this.imageSelector);
    }

    toggleVisualPhysical(){
        let currentlyVisual = this.toggleButton.getText() == "Visual";
        let gameMaker = GAMEMODE_MANAGER.getActiveGamemode();
        gameMaker.setDisplayPhysicalLayer(currentlyVisual);
        this.toggleButton.setText(currentlyVisual ? "Physical" : "Visual");
        this.imageSelector.setImages(currentlyVisual ? this.physicalImages : this.visualImages);
        if (currentlyVisual){
            gameMaker.getTilePlacer().usePhysicalLayer();
        }else{
            gameMaker.getTilePlacer().useVisualLayer();
        }
    }

    display(){
        if (!this.game.isDisplayingHUD()){
            return;
        }
        this.topBar.display();
        this.bottomBar.display();
    }

    /*
        Method Name: click
        Method Parameters:
        x:
            The x location of the click
        y:
            The y location of the click

        Method Description: Determine if any component was clicked (from most recently added to least)
        Method Return: void
    */
    click(x, y){
        if (!this.game.isDisplayingHUD()){ return; }
        let components = this.getAllComponents();
        for (let i = components.length - 1; i >= 0; i--){
            let component = components[i];
            if (component.covers(x, y) && !component.isDisabled()){
                component.clicked(this, x, y);
                break;
            }
        }
    }

    covers(x, y){
        // Note: y is using game coordinate system (bottom of screen is 0)
        let components = this.getAllComponents();
        for (let i = components.length - 1; i >= 0; i--){
            let component = components[i];
            if (component.covers(x, y)){
                return true;
            }
        }
        return false;
    }

    getAllComponents(){
        let components = [];
        components = appendLists(components, this.topBar.getComponents());
        components = appendLists(components, this.bottomBar.getComponents());
        return components;
    }

    getImageSelector(){
        return this.imageSelector;
    }

}

class ImageSelector extends Component {
    constructor(x, y, width, imageWidth, imageHeight){
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.images = [];
        this.startingIndex = 0;
    }

    clear(){
        this.setImages([]);
    }

    getX(){
        return this.x(getScreenWidth());
    }

    getY(){
        return this.y(getScreenHeight());
    }

    getWidth(){
        return this.width(getScreenWidth());
    }

    setImages(images){
        this.images = images;
        this.startingIndex = 0;
    }

    display(){
        let scrollButtonWidth = WTL_GAME_DATA["ui"]["game_maker"]["scroll_button_width"];

        let x = this.getX();
        let y = this.getY();
        let height = WTL_GAME_DATA["ui"]["game_maker"]["bottom_bar_height"];
        let width = this.getWidth();

        // If too little width because screen is small then don't display
        let minWidth = scrollButtonWidth * 2 + this.imageWidth;
        if (width < minWidth){
            return;
        }

        // Left Scroll Button    
        Menu.makeRectangleWithText("<", WTL_GAME_DATA["ui"]["game_maker"]["purple_code"], "#ffffff", x, y, scrollButtonWidth, height);

        // Images
        let imageRegionSize = width - 2 * scrollButtonWidth;
        let usedWidth = 0;

        let currentImageIndex = this.startingIndex;
        let displayedImages = 0;

        // Display Images
        while (usedWidth + this.imageWidth < imageRegionSize && displayedImages < this.images.length){
            let image = IMAGES[this.images[currentImageIndex].getName()];
            let imageWidth = image.width;
            let imageHeight = image.height;
            let translateX = x + scrollButtonWidth + usedWidth + this.imageWidth/2;
            let translateY = getScreenHeight() - y + this.imageHeight/2;
            
            // Translate
            translate(translateX, translateY);

            // Scale
            scale(this.imageWidth / imageWidth, this.imageHeight / imageHeight);

            // Display image
            displayImage(image, 0 - imageWidth/2, 0 - imageHeight/2);

            // Undo Scale
            scale(imageWidth / this.imageWidth, imageHeight / this.imageHeight);

            // Undo translate
            translate(-1 * translateX, -1 * translateY);

            // Next image
            currentImageIndex = (currentImageIndex + 1) % this.images.length;
            usedWidth += this.imageWidth;
            displayedImages++;
        }
        //console.log("Displaying right button @", x + scrollButtonWidth + usedWidth)
        // Right Scroll Button
        Menu.makeRectangleWithText(">", WTL_GAME_DATA["ui"]["game_maker"]["purple_code"], "#ffffff", x + scrollButtonWidth + usedWidth, y, scrollButtonWidth, height);
    }

    // TODO: Click mechanism

    /*
        Method Name: covers
        Method Parameters:
            x:
                Screen coordinate x
            y:
                Screen coordinate y
        Method Description: Determines whether the rectangle covers a point on the screen
        Method Return: boolean, true -> covers, false -> does not cover
    */
    covers(x, y){
        return x >= this.getX() && x <= this.getX() + this.getWidth() && y <= this.getY() && y >= this.getY() - WTL_GAME_DATA["ui"]["game_maker"]["bottom_bar_height"];
    }

    /*
        Method Name: clicked
        Method Parameters:
            instance:
                The menu responsible for the click
            TODO
        Method Description: Handles what occurs when clicked on
        Method Return: void
    */
    clicked(instance, x, y){
        if (this.isDisabled() || !this.isDisplayEnabled()){ return; }
        if (this.images.length == 0){ return; }

        // Note: Assuming x >= this.getX() and x < this.getX() + this.getWidth()
        // Note: Assuming y >= this.getY() && y <= this.getY() + height
        let height = WTL_GAME_DATA["ui"]["game_maker"]["bottom_bar_height"];
        let width = this.getWidth();
        let scrollButtonWidth = WTL_GAME_DATA["ui"]["game_maker"]["scroll_button_width"];
        let imageRegionSize = width - 2 * scrollButtonWidth;
        let xOffset = x - this.getX();
        // Check left button
        if (xOffset < scrollButtonWidth){
            this.startingIndex = this.startingIndex > 0 ? this.startingIndex - 1 : this.images.length - 1;
            return;
        }
        // Check right button (in case of max size)
        else if (xOffset > scrollButtonWidth + imageRegionSize){
            this.startingIndex = this.startingIndex < this.images.length - 1 ? this.startingIndex + 1 : 0;
            return;
        }

        // Now we know xOffset >= scrollButtonWidth
        let imageIndex = Math.floor((xOffset - scrollButtonWidth) / this.imageWidth);

        // If image index >= this.image.length then it must be the right button
        if (imageIndex >= this.images.length){
            this.startingIndex = this.startingIndex < this.images.length - 1 ? this.startingIndex + 1 : 0;
            return;
        }
        // Adjust based on the offset
        imageIndex = (imageIndex + this.startingIndex) % this.images.length; 
        this.images[imageIndex].select();
    }
}

class ConnectButton extends RectangleButton {
    constructor(textColour, x, y, width, height){
        super("connect", WTL_GAME_DATA["ui"]["game_maker"]["red_code"], textColour, x, y, width, height, () => {});
        this.connectLock = new Lock();
        this.connected = false;
    }

    /*
        Method Name: clicked
        Method Parameters:
            instance:
                The menu responsible for the click
        Method Description: Handles what occurs when clicked on
        Method Return: void
    */
    async clicked(instance){
        if (this.isDisabled() || !this.isDisplayEnabled()){ return; }

        // If the button thinks its connected there is no reason to reestablish. It's possible that the button will show green (connected) but won't but, but this will be rectified by the heartbeat function in the GameMaker class
        if (this.isConnected()){ return; }
        
        // This is locked for a limited time after the user clicks it. So this check is for the user clicking the button multiple times in a short period
        if (this.connectLock.isLocked()){ return; }

        // Connect lock is unlocked
        this.connectLock.lock();
        this.setUpdating();

        // We know that if this is clicked then active gamemode MUST be game maker

        // Ask gamemode manager for the active gamemode, get the server connection from it then ask it to establish a connection
        let serverConnection = GAMEMODE_MANAGER.getActiveGamemode().getServerConnection();
        
        // Change connected indicator
        let connectedNow = await serverConnection.setupConnection();

        // Updated appearance
        if (connectedNow){
            this.setConnected();
        }else{
            this.setNotConnected();
        }
        // Unlock for another try
        this.connectLock.unlock();
    }

    isConnected(){
        return this.connected;
    }

    notConnected(){
        return !this.isConnected();
    }

    setConnected(){
        this.colourCode = WTL_GAME_DATA["ui"]["game_maker"]["green_code"];
        this.textStr = "Connected";
        this.connected = true;
    }

    setNotConnected(){
        this.colourCode = WTL_GAME_DATA["ui"]["game_maker"]["red_code"];
        this.textStr = "Disconnected";
        this.connected = false;
    }

    setUpdating(){
        this.colourCode = WTL_GAME_DATA["ui"]["game_maker"]["yellow_code"];
        this.textStr = "Connecting...";
        this.connected = false;
    }
}

class SelectableImage {
    constructor(imageDetails, callWhenSelected){
        this.name = imageDetails["name"];
        this.details = imageDetails;
        this.callWhenSelected = callWhenSelected;
    }

    select(){
        this.callWhenSelected(this.details);
    }

    getName(){
        return this.name;
    }
}

MENU_MANAGER.registerMenu("game_maker", new GameMakerUI());