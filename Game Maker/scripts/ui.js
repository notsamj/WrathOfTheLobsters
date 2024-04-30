// Global Constants

// Used to prevent loading tiles again before finishing
const LOAD_TILES_LOCK = new Lock();
// Used to make accessing bottom menu states easier
const BOTTOM_MENU_STATES = GAME_MAKER_SETTINGS["bottom_menu_states"]; 

// Global Variables

// Used to determine the position in the current list of tiles so that they can be scrolled
var tilePosition = 0;
// Used to keep track of whether the 
var bottomMenuState = GAME_MAKER_SETTINGS["bottom_menu_states"]["normal_materials"];
// On Start Up
document.addEventListener("DOMContentLoaded", (event) => {
    // Load tiles from json
    document.getElementById("load_level_button").onclick = async (event) => {
        let response = await SERVER_CONNECTION.sendMail({"action": "load", "file_name": "level/" + prompt("Please enter the level name:", "default.json")}, "load");
        if (response == null){
            alert("Timeout.");
            return;
        }else if (!response["success"]){
            alert(response["reason"]);
            return;
        }
        SCENE.loadTilesFromString(response["data"]);
    };

    // Load Materials from json
    document.getElementById("load_materials_button").onclick = (event) => { loadTilesFromServer(prompt("Please enter the material name:", "default.json")); };

    // Switch to between materials and special tiles
    document.getElementById("switch_material_type_button").onclick = (event) => { switchToSpecialMaterials(); }

    // Save tiles to json
    document.getElementById("save_button").onclick = async (event) => {
        let response = await SERVER_CONNECTION.sendMail({"action": "save", "data": SCENE.toTileJSON(), "file_name": "level/" + prompt("Please enter name of the level to save:", "default.json")}, "save");
        if (response == null){
            alert("Timeout.");
            return;
        }else if (!response["success"]){
            alert(response["reason"]);
            return;
        }
        alert("Saved!");
    };
    loadTilesFromServer("default.json");
});

function switchToSpecialMaterials(){
    let currentState = bottomMenuState;
    if (currentState == BOTTOM_MENU_STATES["normal_materials"]){
        loadSpecialTilesToBottomMenu();
    }else if (loadedMaterialTiles.length > 0){
        loadTilesToBottomMenu(loadedMaterialTiles);
    }
}


function deleteTileMenu(){
    let menuDiv = document.getElementById("tile_selection_area");
    menuDiv.innerHTML = "";
}

function howManyTilesFit(){
    return Math.floor(getScreenWidth() / RETRO_GAME_DATA["general"]["tile_size"]) * 2;
}

function createTile(tileDetails){
    // Check if image already exists
    if (!objectHasKey(IMAGES, tileDetails["name"])){
        let image = document.createElement("img");
        image.src = tileDetails["file_link"];
        IMAGES[tileDetails["name"]] = image;
    }
    let imageTile = document.createElement("img");
    imageTile.src = tileDetails["file_link"];
    imageTile.setAttribute("width", RETRO_GAME_DATA["general"]["tile_size"]);
    imageTile.setAttribute("height", RETRO_GAME_DATA["general"]["tile_size"]);
    imageTile.onclick = () => {
        TILE_PLACER.setMaterial(tileDetails);
    }
    return imageTile;
}

function createSpecialTile(){
    
}

async function loadTilesToBottomMenu(tiles){
    if (LOAD_TILES_LOCK.isLocked()){ return; }
    LOAD_TILES_LOCK.lock();
    let numTilesToShow = howManyTilesFit();
    deleteTileMenu();
    let menuDiv = document.getElementById("tile_selection_area");
    if (tilePosition == tiles.length){
        tilePosition = 0;
    }
    let startI = tilePosition;
    let i = startI;
    while (i < tiles.length && i < startI + numTilesToShow){
        menuDiv.appendChild(createTile(tiles[i]));
        i++;
        tilePosition++;
    }
    LOAD_TILES_LOCK.unlock();
}

function loadSpecialTilesToBottomMenu(){
    deleteTileMenu();
    // TODO
}