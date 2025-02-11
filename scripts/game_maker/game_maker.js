/*  
    Class Name: GameMaker
    Class Description: A gamemode for making levels
*/
class GameMaker extends Gamemode {
    /*
        Method Name: constructor
        Method Parameters: 
            menu:
                Menu associated with gamemaker
        Method Description: constructor
        Method Return: constructor
    */
    constructor(menu){
        super();
        this.ui = menu;
        this.ui.reset();
        this.serverConnection = new ServerConnection();
        this.tilePlacer = new TilePlacer(this);
        this.scene.addEntity(this.tilePlacer);

        this.heartBeatLock = new Lock();
        this.heartBeatInterval = setInterval(() => {
            this.checkHeartBeat();
        }, 500);
        this.displayingHUD = true;

    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Gets the name of the gamemode
        Method Return: String
    */
    getName(){ return "game_maker"; }

    /*
        Method Name: getUI
        Method Parameters: None
        Method Description: Getter
        Method Return: GameMakerUI
    */
    getUI(){
        return this.ui;
    }

    /*
        Method Name: isDisplayingHUD
        Method Parameters: None
        Method Description: Checks if displaying hud
        Method Return: Boolean
    */
    isDisplayingHUD(){
        return this.displayingHUD;
    }

    /*
        Method Name: setDisplayingHUD
        Method Parameters: 
            value:
                Boolean value
        Method Description: Setter
        Method Return: void
    */
    setDisplayingHUD(value){
        this.displayingHUD = value;
    }

    /*
        Method Name: setDisplayPhysicalLayer
        Method Parameters: 
            value:
                Boolean value
        Method Description: Setter
        Method Return: void
    */
    setDisplayPhysicalLayer(value){
        this.scene.setDisplayPhysicalLayer(value);
    }

    /*
        Method Name: isDisplayingPhysicalLayer
        Method Parameters: None
        Method Description: Checks if the physical layer is being displayed
        Method Return: Boolean
    */
    isDisplayingPhysicalLayer(){
        return this.scene.isDisplayingPhysicalLayer();
    }

    /*
        Method Name: loadLevel
        Method Parameters: 
            levelFileName:
                The level file name
        Method Description: Communicates with the server to try and load a level
        Method Return: void
    */
    async loadLevel(levelFileName){
        let response = await this.serverConnection.sendMail({"action": "load", "file_name": "level/" + levelFileName}, "load");
        if (response === null){
            alert("Timeout.");
            return;
        }else if (!response["success"]){
            alert(response["reason"]);
            return;
        }
        this.scene.loadTilesFromString(response["data"]);
    }

    /*
        Method Name: saveLevel
        Method Parameters: 
            levelFileName:
                The name of the level file to save
        Method Description: Communicates with the server to save a level
        Method Return: void
    */
    async saveLevel(levelFileName){
        let response = await this.serverConnection.sendMail({"action": "save", "data": this.scene.toTileJSON(), "file_name": "level/" + levelFileName}, "save");
        if (response == null){
            alert("Timeout.");
            return;
        }else if (!response["success"]){
            alert(response["reason"]);
            return;
        }
        alert("Saved!");
    }

    /*
        Method Name: loadMaterials
        Method Parameters: 
            materialFileName:
                The name of the materials file to load
        Method Description: Communicates with the server and loads a materials file
        Method Return: void
    */
    async loadMaterials(materialFileName){
        let response = await this.serverConnection.sendMail({"action": "load", "file_name": "material/" + materialFileName}, "load_material");
        if (response == null){
            alert("Timeout while loading materials from server.");
            return;
        }else if (!response["success"]){
            alert(response["reason"]);
            return;
        }
        let tiles = JSON.parse(response["data"])["materials"];
        let selectableImages = [];
        for (let tileDetails of tiles){
            // Check if image already exists
            if (!objectHasKey(IMAGES, tileDetails["name"])){
                let image = document.createElement("img");
                image.src = tileDetails["file_link"];
                IMAGES[tileDetails["name"]] = image;
            }
            selectableImages.push(new SelectableImage(tileDetails, (tileDetails) => { this.tilePlacer.setVisualMaterial(tileDetails); }));
        }
        this.ui.setVisualImages(selectableImages);
    }

    /*
        Method Name: getTilePlacer
        Method Parameters: None
        Method Description: Getter
        Method Return: TilePlacer
    */
    getTilePlacer(){
        return this.tilePlacer;
    }

    /*
        Method Name: getServerConnection
        Method Parameters: None
        Method Description: Getter
        Method Return: ServerConnection
    */
    getServerConnection(){
        return this.serverConnection;
    }

    /*
        Method Name: checkHeartBeat
        Method Parameters: None
        Method Description: Checks if the connection to the server is still active
        Method Return: void
    */
    async checkHeartBeat(){
        if (this.heartBeatLock.isLocked()){ return; }
        let connectionButton = this.ui.getConnectionButton();

        // Don't check connection if the user thinks they aren't connected. Allow the user to manually click the button when they wish
        if (!connectionButton.isConnected()){ return; }
        
        this.heartBeatLock.lock();
        let activeConnection = await this.serverConnection.testConnection();
        this.heartBeatLock.unlock();

        // Heart beat is only to automatically test what the user thinks is an active connection. If its active there's nothing to do
        if (activeConnection){ return; }

        connectionButton.setNotConnected();
    }

    /*
        Method Name: end
        Method Parameters: None
        Method Description: Closes the server connection
        Method Return: void
    */
    end(){
        this.serverConnection.close();
        clearInterval(this.heartBeatInterval);
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays game maker things
        Method Return: void
    */
    display(){
        this.getScene().display();
    }
    
    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks the scene and checks for user actions
        Method Return: void
    */
    tick(){
        if (GAME_USER_INPUT_MANAGER.isActivated("g_ticked")){
           this.setDisplayingHUD(!this.isDisplayingHUD());
        }
        this.getScene().tick();
    }
}