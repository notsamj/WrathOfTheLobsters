// Global constants
const IMAGES = {};
const FRAME_COUNTER = new FrameRateCounter(RETRO_GAME_DATA["general"]["frame_rate"]);
const MY_HUD = new HUD();
const TICK_SCHEDULER = new TickScheduler(Math.floor(1000/RETRO_GAME_DATA["general"]["tick_rate"]));
const GAMEMODE_MANAGER = new GamemodeManager();
const USER_INPUT_MANAGER = new UserInputManager();
const MENU_MANAGER = new MenuManager();
const SOUND_MANAGER = new SoundManager();

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

    // Create Canvas
    let canvasDOM = document.getElementById("canvas");
    canvasDOM.width = getScreenWidth();
    canvasDOM.height = getScreenHeight();

    // Set global variable drawingContext
    drawingContext = canvasDOM.getContext("2d");

    TICK_SCHEDULER.setStartTime(Date.now());

    MENU_MANAGER.setup();
    MenuManager.setupClickListener();
    
    requestAnimationFrame(tick);
}

function drawCrosshair(){
    let x = window.mouseX;
    let y = this.getScene().changeFromScreenY(window.mouseY);
    let crosshairImage = IMAGES["crosshair"];
    let crosshairWidth = crosshairImage.width;
    let crosshairHeight = crosshairImage.height;
    let displayX = this.getScene().getDisplayX(x, crosshairWidth, 0);
    let displayY = this.getScene().getDisplayY(y, crosshairHeight, 0);
    drawingContext.drawImage(crosshairImage, displayX, displayY); 
}

function draw() {
    // Temporary white background
    noStrokeRectangle(Colour.fromCode("#ffffff"), 0, 0, getScreenWidth(), getScreenHeight());
    GAMEMODE_MANAGER.display();
    MENU_MANAGER.display();
}

async function tick(){
    if (TICK_SCHEDULER.getTickLock().notReady() || TICK_SCHEDULER.isPaused()){ 
        requestAnimationFrame(tick);
        return; 
    }

    let expectedTicks = TICK_SCHEDULER.getExpectedNumberOfTicksPassed();
    
    // If ready for a tick then execute
    if (TICK_SCHEDULER.getNumTicks() < expectedTicks){
        TICK_SCHEDULER.getTickLock().lock()

        // Tick the game mode
        await GAMEMODE_MANAGER.tick();
        
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

function startGame(){
    GAMEMODE_MANAGER.setActiveGamemode(new RetroGame())
}

function startGameMaker(){

}

class RetroGame extends Gamemode {
    constructor(){
        super();
        this.scene.loadTilesFromJSON(LEVEL_DATA["default.json"]);

        let samuel = new HumanCharacter(this, "british_pvt_g");
        samuel.getInventory().add(new HumanMusket("brown_bess", {
            "player": samuel
        }));
        this.scene.addEntity(samuel);
        this.scene.setFocusedEntity(samuel);


        let enemy = new Character("british_pvt_g");
        //this.scene.addEntity(enemy);
        enemy.tileX = 5;
        enemy.tileY = 4;
        enemy.getInventory().add(new Musket("brown_bess", {
            "player": enemy
        }));

        let enemy2 = new Character(this, "usa_pvt");
        //this.scene.addEntity(enemy2);
        enemy2.tileX = 4;
        enemy2.tileY = 3;
    }

    display(){
        this.scene.display();
    }
}