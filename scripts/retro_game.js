// Global constants
const IMAGES = {};
const FRAME_COUNTER = new FrameRateCounter(RETRO_GAME_DATA["general"]["frame_rate"]);
const MY_HUD = new HUD();
const TICK_SCHEDULER = new TickScheduler(Math.floor(1000/RETRO_GAME_DATA["general"]["tick_rate"]));
const GAMEMODE_MANAGER = new GamemodeManager();
const USER_INPUT_MANAGER = new UserInputManager();
const MENU_MANAGER = new MenuManager();
const SOUND_MANAGER = new SoundManager();

const ZOOM_MONITOR = {"button": null, "start_time_ms": null};

// Global Variables
var mouseX = 0;
var mouseY = 0;
var programOver = false;

// Functions
async function setup() {
    await loadToImages("page_background");
    await loadToImages("crosshair");
    // TODO: Better way of doing this?
    await CharacterAnimationManager.loadAllImages("british_pvt_g");
    await CharacterAnimationManager.loadAllImages("usa_pvt");
    await Musket.loadAllImages("brown_bess");
    await Sword.loadAllImages("clever");
    await Sword.loadAllImages("cavalry_sword");
    await Pistol.loadAllImages("flintlock");

    // Make sure all physical tiles are loaded
    for (let tileDetails of RETRO_GAME_DATA["physical_tiles"]){
        await ensureImageIsLoadedFromDetails(tileDetails);
    }

    RETRO_GAME_DATA["general"]["ms_between_ticks"] = Math.floor(1000 / RETRO_GAME_DATA["general"]["tick_rate"]); // Expected to be an integer so floor isn't really necessary
    
    window.onmousemove = (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }

    // Game Maker
    USER_INPUT_MANAGER.register("left_click", "mousedown", (event) => { return event.which==1; });
    USER_INPUT_MANAGER.register("left_click", "mouseup", (event) => { return event.which==1; }, false);

    // Game
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

    USER_INPUT_MANAGER.register("middle_click", "mousedown", (event) => { return event.which==2; });
    USER_INPUT_MANAGER.register("middle_click", "mouseup", (event) => { return event.which==2; }, false);

    USER_INPUT_MANAGER.register("left_click_ticked", "click", (event) => { return event.which==1; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("h_ticked", "keydown", (event) => { return event.keyCode==72; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("p_ticked", "keydown", (event) => { return event.keyCode==80; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("1/8zoomhold", "keydown", (event) => { return event.keyCode == 101; }, true);
    USER_INPUT_MANAGER.register("1/8zoomhold", "keyup", (event) => { return event.keyCode == 101; }, false);

    USER_INPUT_MANAGER.register("1/4zoomhold", "keydown", (event) => { return event.keyCode == 100; }, true);
    USER_INPUT_MANAGER.register("1/4zoomhold", "keyup", (event) => { return event.keyCode == 100; }, false);

    USER_INPUT_MANAGER.register("1/2zoomhold", "keydown", (event) => { return event.keyCode == 99; }, true);;
    USER_INPUT_MANAGER.register("1/2zoomhold", "keyup", (event) => { return event.keyCode == 99; }, false);

    USER_INPUT_MANAGER.register("1zoomhold", "keydown", (event) => { return event.keyCode == 98; }, true);
    USER_INPUT_MANAGER.register("1zoomhold", "keyup", (event) => { return event.keyCode == 98; }, false);

    USER_INPUT_MANAGER.register("2zoomhold", "keydown", (event) => { return event.keyCode == 97; }, true);
    USER_INPUT_MANAGER.register("2zoomhold", "keyup", (event) => { return event.keyCode == 97; }, false);

    USER_INPUT_MANAGER.register("1_ticked", "keydown", (event) => { return event.keyCode==49; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("2_ticked", "keydown", (event) => { return event.keyCode==50; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("3_ticked", "keydown", (event) => { return event.keyCode==51; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("4_ticked", "keydown", (event) => { return event.keyCode==52; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("5_ticked", "keydown", (event) => { return event.keyCode==53; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("6_ticked", "keydown", (event) => { return event.keyCode==54; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("7_ticked", "keydown", (event) => { return event.keyCode==55; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("8_ticked", "keydown", (event) => { return event.keyCode==56; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("9_ticked", "keydown", (event) => { return event.keyCode==57; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("0_ticked", "keydown", (event) => { return event.keyCode==48; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("b_ticked", "keydown", (event) => { return event.keyCode==66; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("r_ticked", "keydown", (event) => { return event.keyCode==82; }, true, {"ticked": true, "ticked_activation": false});

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

/*
    Method Name: setGameZoom
    Method Parameters: None
    Method Description: Changes the game zoom
    Method Return: void
*/
function setGameZoom(){
    let buttonCount = 0;
    let eighth = USER_INPUT_MANAGER.isActivated("1/8zoomhold");
    let quarter = USER_INPUT_MANAGER.isActivated("1/4zoomhold");
    let half = USER_INPUT_MANAGER.isActivated("1/2zoomhold");
    let whole = USER_INPUT_MANAGER.isActivated("1zoomhold");
    let two = USER_INPUT_MANAGER.isActivated("2zoomhold");
    buttonCount += eighth ? 1 : 0;
    buttonCount += quarter ? 1 : 0;
    buttonCount += half ? 1 : 0;
    buttonCount += whole ? 1 : 0;
    buttonCount += two ? 1 : 0;
    // Anything other than 1 is treated the same
    if (buttonCount != 1){
        // Ignore if button is null
        if (ZOOM_MONITOR["button"] == null){ return; }
        let timePassed = Date.now() - ZOOM_MONITOR["start_time_ms"];
        // If the button was pressed for a short amount of time then switch gamezoom to recorded
        if (timePassed < RETRO_GAME_DATA["controls"]["approximate_zoom_peek_time_ms"]){
            RETRO_GAME_DATA["settings"]["game_zoom"] = gameZoom;
        }else{ // If not taking the button then reset zoom
            gameZoom = RETRO_GAME_DATA["settings"]["game_zoom"];
        }
        // Reset zoom monitor
        ZOOM_MONITOR["button"] = null;
    }else{ // 1 button pressed
        let pressedButton;
        // Determine which button
        if (eighth){
            pressedButton = 1/8;
        }else if (quarter){
            pressedButton = 1/4;
        }else if (half){
            pressedButton = 1/2;
        }else if (whole){
            pressedButton = 1;
        }else{ // two
            pressedButton = 2;
        }
        // If changed which 1 button is pressed
        if (ZOOM_MONITOR["button"] != pressedButton){
            ZOOM_MONITOR["button"] = pressedButton;
            ZOOM_MONITOR["start_time_ms"] = Date.now();
            gameZoom = pressedButton;
        }
    }
}

function drawCrosshair(){
    let x = window.mouseX;
    let y = window.mouseY;
    let crosshairImage = IMAGES["crosshair"];
    let crosshairWidth = crosshairImage.width;
    let crosshairHeight = crosshairImage.height;
    let displayX = x - crosshairWidth/2;
    let displayY = y - crosshairHeight/2;
    drawingContext.drawImage(crosshairImage, displayX, displayY); 
}

function draw() {
    // Temporary white background
    noStrokeRectangle(Colour.fromCode("#ffffff"), 0, 0, getScreenWidth(), getScreenHeight());
    GAMEMODE_MANAGER.display();
    MENU_MANAGER.display();
}

function stop(){
    programOver = true;
}

async function tick(){
    if (programOver){ return; }
    if (TICK_SCHEDULER.getTickLock().notReady()){ 
        requestAnimationFrame(tick);
        return; 
    }

    let expectedTicks = TICK_SCHEDULER.getExpectedNumberOfTicksPassed();
    
    // If ready for a tick then execute
    if (TICK_SCHEDULER.getNumTicks() < expectedTicks && !TICK_SCHEDULER.isPaused()){
        TICK_SCHEDULER.getTickLock().lock()

        // Tick the game mode
        await GAMEMODE_MANAGER.tick();
        
        // Tick the USER_INPUT_MANAGER
        USER_INPUT_MANAGER.tick();

        // Count the tick
        TICK_SCHEDULER.countTick();
        TICK_SCHEDULER.getTickLock().unlock();
    }

     // Once within main tick lock, set zoom
    setGameZoom();

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
    GAMEMODE_MANAGER.setActiveGamemode(new GameMaker())
}

class RetroGame extends Gamemode {
    constructor(){
        super();
        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    async startUp(){
        await this.scene.loadTilesFromJSON(LEVEL_DATA["default.json"]);
        let samuel = new HumanCharacter(this, "british_pvt_g");
        samuel.setID("samuel");
        samuel.getInventory().add(new HumanMusket("brown_bess", {
            "player": samuel
        }));
        samuel.getInventory().add(new HumanSword("clever", {
            "player": samuel
        }));
        samuel.getInventory().add(new HumanSword("cavalry_sword", {
            "player": samuel
        }));
        samuel.getInventory().add(new HumanPistol("flintlock", {
            "player": samuel
        }));
        this.scene.addEntity(samuel);
        this.scene.setFocusedEntity(samuel);


        let enemy = new Character(this, "british_pvt_g");
        enemy.setID("npc1");
        this.scene.addEntity(enemy);
        enemy.tileX = 4;
        enemy.tileY = -4;
        /*enemy.getInventory().add(new Musket("brown_bess", {
            "player": enemy
        }));*/

        let enemy2 = new Character(this, "usa_pvt");
        enemy2.setID("npc2");
        this.scene.addEntity(enemy2);
        enemy2.tileX = 6;
        enemy2.tileY = -9;
        
        let enemy3 = new Character(this, "usa_pvt");
        enemy3.setID("npc3");
        this.scene.addEntity(enemy3);
        enemy3.tileX = -8;
        enemy3.tileY = -9;

        // Test

        this.startUpLock.unlock();

    }

    display(){
        if (this.startUpLock.isLocked()){ return; }
        this.scene.display();
    }

    tick(){
        if (this.startUpLock.isLocked()){ return; }
        this.scene.tick();
    }
}