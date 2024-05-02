// Global constants
const IMAGES = {};
const this.getScene() = new RetroGameScene();
const FRAME_COUNTER = new FrameRateCounter(GAME_MAKER_SETTINGS["general"]["frame_rate"]);
const TICK_SCHEDULER = new TickScheduler(1000/GAME_MAKER_SETTINGS["general"]["tick_rate"]);
const USER_INPUT_MANAGER = new UserInputManager();
const MY_HUD = new HUD();
const TILE_PLACER = new TilePlacer(this.getScene());
const MAIL_SERVICE = new MailService();
const SERVER_CONNECTION = new ServerConnection();

// Global variables
var loadedMaterialTiles = [];

// Functions
async function setup() {
    await loadToImages("page_background");

    // Setup user input handling
    USER_INPUT_MANAGER.register("click", "mousedown", (event) => { return event.which==1; });
    USER_INPUT_MANAGER.register("click", "mouseup", (event) => { return event.which==1; }, false);
    USER_INPUT_MANAGER.register("right_click", "mousedown", (event) => { return event.which==3; });
    USER_INPUT_MANAGER.register("right_click", "mouseup", (event) => { return event.which==3; }, false);

    this.getScene().addEntity(TILE_PLACER);
    this.getScene().setFocusedEntity(TILE_PLACER);

    // Create Canvas
    let canvas = createCanvas(getCanvasWidth(), getCanvasHeight());
    window.onresize = function(event) {
        resizeCanvas(getCanvasWidth(), getCanvasHeight());
    };

    // Disable context menu
    document.getElementById("main_area").addEventListener("contextmenu", (event) => {event.preventDefault()});

    TICK_SCHEDULER.setStartTime(Date.now());
    requestAnimationFrame(tick);
}

function getCanvasWidth(){
    return getScreenWidth() - 2 * GAME_MAKER_SETTINGS["ui"]["side_area_widths"];
}

function getCanvasHeight(){
    return getScreenHeight() - 2 * GAME_MAKER_SETTINGS["ui"]["side_area_heights"];
}

function draw() {
    clear();
    this.getScene().display();
    let fps = FRAME_COUNTER.getFPS();
    MY_HUD.updateElement("fps", fps);
    MY_HUD.display();
}

async function tick(){
    if (TICK_SCHEDULER.getTickLock().notReady()){ 
        requestAnimationFrame(tick);
        return; 
    }

    let expectedTicks = TICK_SCHEDULER.getExpectedNumberOfTicksPassed();
    
    // If not ready for a tick then return
    if (TICK_SCHEDULER.getNumTicks() >= expectedTicks){
        requestAnimationFrame(tick);
        return;
    }

    TICK_SCHEDULER.getTickLock().lock()

    // Tick the scene
    await this.getScene().tick();

    // Count the tick
    TICK_SCHEDULER.countTick();

    // Draw a frame
    if (FRAME_COUNTER.ready()){
        FRAME_COUNTER.countFrame();
        draw();
    }
    TICK_SCHEDULER.getTickLock().unlock();
    requestAnimationFrame(tick);
}

async function loadTilesFromServer(fileName){
    let response = await SERVER_CONNECTION.sendMail({"action": "load", "file_name": "material/" + fileName}, "load_material");
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
    loadedMaterialTiles = tiles;
}

