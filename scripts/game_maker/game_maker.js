class GameMaker extends Gamemode {
    constructor(){
        super();
        this.loadedMaterialTiles = [];
        this.serverConnection = new ServerConnection();
        this.tilePlacer = new TilePlacer(this.getScene());
        this.ui = MENU_MANAGER.getMenuByName("game_maker");
    }

    display(){
        this.getScene().display();
    }
    
    tick(){
        this.getScene().tick();
    }

    async loadTilesFromServer(fileName){
        let response = await this.serverConnection.sendMail({"action": "load", "file_name": "material/" + fileName}, "load_material");
        if (response == null){
            alert("Timeout while loading materials from server.");
            return;
        }else if (!response["success"]){
            alert(response["reason"]);
            return;
        }
        let tiles = JSON.parse(response["data"])["materials"];
        loadTilesToBottomMenu(tiles);
        // Update global variable
        this.loadedMaterialTiles = tiles;
    }
}