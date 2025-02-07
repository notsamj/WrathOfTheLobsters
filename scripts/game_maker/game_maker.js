class GameMaker extends Gamemode {
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

    getUI(){
        return this.ui;
    }

    isDisplayingHUD(){
        return this.displayingHUD;
    }

    setDisplayingHUD(value){
        this.displayingHUD = value;
    }

    setDisplayPhysicalLayer(value){
        this.scene.setDisplayPhysicalLayer(value);
    }

    isDisplayingPhysicalLayer(){
        return this.scene.isDisplayingPhysicalLayer();
    }

    async loadLevel(levelFileName){
        let response = await this.serverConnection.sendMail({"action": "load", "file_name": "level/" + levelFileName}, "load");
        if (response == null){
            alert("Timeout.");
            return;
        }else if (!response["success"]){
            alert(response["reason"]);
            return;
        }
        this.scene.loadTilesFromString(response["data"]);
    }

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

    getTilePlacer(){
        return this.tilePlacer;
    }

    getServerConnection(){
        return this.serverConnection;
    }

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

    end(){
        this.serverConnection.close();
        clearInterval(this.heartBeatInterval);
    }

    display(){
        this.getScene().display();
    }
    
    tick(){
        if (GAME_USER_INPUT_MANAGER.isActivated("g_ticked")){
           this.setDisplayingHUD(!this.isDisplayingHUD());
        }
        this.getScene().tick();
    }
}