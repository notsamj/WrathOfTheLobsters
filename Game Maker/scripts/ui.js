const LOAD_TILES_LOCK = new Lock();
var tilePosition = 0;
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
    document.getElementById("load_materials_button").onclick = (event) => { loadTileFromServer(prompt("Please enter the material name:", "default.json")); };

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
    loadTileFromServer("default.json");
});

async function loadTileFromServer(fileName){
    let response = await SERVER_CONNECTION.sendMail({"action": "load", "file_name": "material/" + fileName}, "load_material");
    if (response == null){
        alert("Timeout.");
        return;
    }else if (!response["success"]){
        alert(response["reason"]);
        return;
    }
    loadTiles(JSON.parse(response["data"])["materials"]);
}

function deleteTileMenu(){
    let menuDiv = document.getElementById("tile_selection_area");
    menuDiv.innerHTML = "";
}

function howManyTilesFit(){
    return Math.floor(getScreenWidth() / PROGRAM_SETTINGS["general"]["tile_size"]) * 2;
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
    imageTile.setAttribute("width", PROGRAM_SETTINGS["general"]["tile_size"]);
    imageTile.setAttribute("height", PROGRAM_SETTINGS["general"]["tile_size"]);
    imageTile.onclick = () => {
        TILE_PLACER.setMaterial(tileDetails);
    }
    return imageTile;
}

async function loadTiles(tiles){
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