// Global constants
const IMAGES = {};
const SCENE = new RetroGameScene();
const FRAME_COUNTER = new FrameRateCounter(RETRO_GAME_DATA["general"]["frame_rate"]);
const MY_HUD = new HUD();
const TICK_SCHEDULER = new TickScheduler(Math.floor(1000/RETRO_GAME_DATA["general"]["tick_rate"]));
const USER_INPUT_MANAGER = new UserInputManager();

// Global Variables
var mouseX = 0;
var mouseY = 0;

// Functions
async function setup() {
    await loadToImages("page_background");
    await loadToImages("crosshair");
    // TODO: Better way of doing this?
    await CharacterAnimationManager.loadAllImages("british_pvt_g");
    await CharacterAnimationManager.loadAllImages("usa_pvt");
    await Musket.loadAllImages("brown_bess");

    RETRO_GAME_DATA["general"]["ms_between_ticks"] = Math.floor(1000 / RETRO_GAME_DATA["general"]["tick_rate"]); // Expected to be an integer so floor isn't really necessary
    
    window.onmousemove = (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }

    let samuel = new HumanCharacter("british_pvt_g");
    samuel.getInventory().add(new HumanMusket("brown_bess", {
        "player": samuel
    }));
    SCENE.addEntity(samuel);
    SCENE.setFocusedEntity(samuel);


    let enemy = new Character("british_pvt_g");
    //SCENE.addEntity(enemy);
    enemy.tileX = 5;
    enemy.tileY = 4;
    enemy.getInventory().add(new Musket("brown_bess", {
        "player": enemy
    }));

    let enemy2 = new Character("usa_pvt");
    //SCENE.addEntity(enemy2);
    enemy2.tileX = 4;
    enemy2.tileY = 3;


    USER_INPUT_MANAGER.register("move_up", "keydown", (event) => { return event.keyCode==87; });
    USER_INPUT_MANAGER.register("move_up", "keyup", (event) => { return event.keyCode==87; }, false);

    USER_INPUT_MANAGER.register("move_down", "keydown", (event) => { return event.keyCode==83; });
    USER_INPUT_MANAGER.register("move_down", "keyup", (event) => { return event.keyCode==83; }, false);

    USER_INPUT_MANAGER.register("move_left", "keydown", (event) => { return event.keyCode==65; });
    USER_INPUT_MANAGER.register("move_left", "keyup", (event) => { return event.keyCode==65; }, false);

    USER_INPUT_MANAGER.register("move_right", "keydown", (event) => { return event.keyCode==68; });
    USER_INPUT_MANAGER.register("move_right", "keyup", (event) => { return event.keyCode==68; }, false);

    USER_INPUT_MANAGER.register("sprint", "keydown", (event) => { return event.keyCode==16; });
    USER_INPUT_MANAGER.register("sprint", "keyup", (event) => { return event.keyCode==16; }, false);

    USER_INPUT_MANAGER.register("right_click", "mousedown", (event) => { return event.which==3; });
    USER_INPUT_MANAGER.register("right_click", "mouseup", (event) => { return event.which==3; }, false);

    USER_INPUT_MANAGER.register("left_click", "click", (event) => { return event.which==1; }, true, {"ticked": true, "ticked_activation": false});

    // Disable context menu
    document.getElementById("main_area").addEventListener("contextmenu", (event) => {event.preventDefault()});

    window.onblur = () => {
        if (!TICK_SCHEDULER.isPaused()){
            TICK_SCHEDULER.pause();
        }
    }

    window.onfocus = () => {
        if (TICK_SCHEDULER.isPaused()){
            TICK_SCHEDULER.unpause();
        }
    }

    SCENE.loadTilesFromJSON(LEVEL_DATA["default.json"]);

    // Create Canvas
    let canvasDOM = document.getElementById("canvas");
    canvasDOM.width = getScreenWidth();
    canvasDOM.height = getScreenHeight();
    // Set global variable drawingContext
    drawingContext = canvasDOM.getContext("2d");

    TICK_SCHEDULER.setStartTime(Date.now());
    requestAnimationFrame(tick);
}

function drawCrosshair(){
    let x = window.mouseX;
    let y = SCENE.changeFromScreenY(window.mouseY);
    let crosshairImage = IMAGES["crosshair"];
    let crosshairWidth = crosshairImage.width;
    let crosshairHeight = crosshairImage.height;
    let displayX = SCENE.getDisplayX(x, crosshairWidth, 0);
    let displayY = SCENE.getDisplayY(y, crosshairHeight, 0);
    drawingContext.drawImage(crosshairImage, displayX, displayY); 
}

function draw() {
    SCENE.display();
    let fps = FRAME_COUNTER.getFPS();
    MY_HUD.updateElement("fps", fps);
    MY_HUD.display();
}

async function tick(){
    if (TICK_SCHEDULER.getTickLock().notReady() || TICK_SCHEDULER.isPaused()){ 
        requestAnimationFrame(tick);
        return; 
    }

    let expectedTicks = TICK_SCHEDULER.getExpectedNumberOfTicksPassed();
    //console.log(expectedTicks)
    
    // If ready for a tick then execute
    if (TICK_SCHEDULER.getNumTicks() < expectedTicks){
        TICK_SCHEDULER.getTickLock().lock()

        // Tick the scene
        await SCENE.tick();
        
        // Tick the USER_INPUT_MANAGER
        USER_INPUT_MANAGER.tick();

        // Count the tick
        TICK_SCHEDULER.countTick();
        TICK_SCHEDULER.getTickLock().unlock();
    }

    // Draw a frame
    if (FRAME_COUNTER.ready()){
        FRAME_COUNTER.countFrame();
        let canvas = document.getElementById("canvas");
        // Update Canvas size if applicable
        if (getScreenWidth() != canvas.width || getScreenHeight() != canvas.height){
            canvas.width = getScreenWidth();
            canvas.height = getScreenHeight();
        }
        draw();
    }
    requestAnimationFrame(tick);
}

function getCanvasWidth(){
    return getScreenWidth();
}

function getCanvasHeight(){
    return getScreenHeight();
}

// Start Up
window.addEventListener("load", () => {
    setup();
});