// Global constants
const IMAGES = {};
const FRAME_COUNTER = new FrameRateCounter(WTL_GAME_DATA["general"]["frame_rate"]);
const MY_HUD = new HUD();
const TICK_SCHEDULER = new TickScheduler(Math.floor(1000/WTL_GAME_DATA["general"]["tick_rate"]));
const GAMEMODE_MANAGER = new GamemodeManager();
const USER_INPUT_MANAGER = new UserInputManager();
const SOUND_MANAGER = new SoundManager();
const GENERAL_DEBUGGER = new GeneralDebugger();
const LOADING_SCREEN = new LoadingScreen();
const LOCAL_EVENT_HANDLER = new NSEventHandler();

const ZOOM_MONITOR = {"button": null, "start_time_ms": null};

// Global Variables
var mouseX = 0;
var mouseY = 0;
var programOver = false;
var ramshackleDebugToolValue = false;
var setupOngoing = false;

// Functions
function rDebug(){
    ramshackleDebugToolValue = true;
}

function stopRDebugging(){
    ramshackleDebugToolValue = false;
}

function isRDebugging(){
    return ramshackleDebugToolValue;
}

async function setup() {
    setupOngoing = true;
    try {
        for (let imageName of WTL_GAME_DATA["basic_images"]){
            await loadToImages(imageName);
        }
        await CharacterAnimationManager.loadAllImages();
        await Musket.loadAllImages();
        await Sword.loadAllImages();
        await Pistol.loadAllImages();
        await TurnBasedSkirmish.loadImages();
    }catch(error){
        console.error("Failed to load images:", error);
    }

    // Make sure all physical tiles are loaded
    for (let tileDetails of WTL_GAME_DATA["physical_tiles"]){
        await ensureImageIsLoadedFromDetails(tileDetails);
    }

    WTL_GAME_DATA["general"]["ms_between_ticks"] = Math.floor(1000 / WTL_GAME_DATA["general"]["tick_rate"]); // Expected to be an integer so floor isn't really necessary
    
    window.onmousemove = (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }

    // Game Maker
    USER_INPUT_MANAGER.register("option_slider_grab", "mousedown", (event) => { return true; });
    USER_INPUT_MANAGER.register("option_slider_grab", "mouseup", (event) => { return true; }, false);

    USER_INPUT_MANAGER.register("scroll_bar_grab", "mousedown", (event) => { return true; });
    USER_INPUT_MANAGER.register("scroll_bar_grab", "mouseup", (event) => { return true; }, false);
    
    USER_INPUT_MANAGER.register("left_click", "mousedown", (event) => { return event.which===1; });
    USER_INPUT_MANAGER.register("left_click", "mouseup", (event) => { return event.which===1; }, false);

    // Game
    USER_INPUT_MANAGER.register("move_up", "keydown", (event) => { return event.keyCode===87; });
    USER_INPUT_MANAGER.register("move_up", "keyup", (event) => { return event.keyCode===87; }, false);

    USER_INPUT_MANAGER.register("move_down", "keydown", (event) => { return event.keyCode===83; });
    USER_INPUT_MANAGER.register("move_down", "keyup", (event) => { return event.keyCode===83; }, false);

    USER_INPUT_MANAGER.register("move_left", "keydown", (event) => { return event.keyCode===65; });
    USER_INPUT_MANAGER.register("move_left", "keyup", (event) => { return event.keyCode===65; }, false);

    USER_INPUT_MANAGER.register("move_right", "keydown", (event) => { return event.keyCode===68; });
    USER_INPUT_MANAGER.register("move_right", "keyup", (event) => { return event.keyCode===68; }, false);

    USER_INPUT_MANAGER.register("sprint", "keydown", (event) => { return event.keyCode===16; });
    USER_INPUT_MANAGER.register("sprint", "keyup", (event) => { return event.keyCode===16; }, false);

    USER_INPUT_MANAGER.register("right_click", "mousedown", (event) => { return event.which===3; });
    USER_INPUT_MANAGER.register("right_click", "mouseup", (event) => { return event.which===3; }, false);

    USER_INPUT_MANAGER.register("middle_click", "mousedown", (event) => { return event.which===2; });
    USER_INPUT_MANAGER.register("middle_click", "mouseup", (event) => { return event.which===2; }, false);

    USER_INPUT_MANAGER.register("left_click_ticked", "click", (event) => { return event.which===1; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("h_ticked", "keydown", (event) => { return event.keyCode===72; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("p_ticked", "keydown", (event) => { return event.keyCode===80; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("1/8zoomhold", "keydown", (event) => { return event.keyCode === 101; }, true);
    USER_INPUT_MANAGER.register("1/8zoomhold", "keyup", (event) => { return event.keyCode === 101; }, false);

    USER_INPUT_MANAGER.register("1/4zoomhold", "keydown", (event) => { return event.keyCode === 100; }, true);
    USER_INPUT_MANAGER.register("1/4zoomhold", "keyup", (event) => { return event.keyCode === 100; }, false);

    USER_INPUT_MANAGER.register("1/2zoomhold", "keydown", (event) => { return event.keyCode === 99; }, true);;
    USER_INPUT_MANAGER.register("1/2zoomhold", "keyup", (event) => { return event.keyCode === 99; }, false);

    USER_INPUT_MANAGER.register("1zoomhold", "keydown", (event) => { return event.keyCode === 98; }, true);
    USER_INPUT_MANAGER.register("1zoomhold", "keyup", (event) => { return event.keyCode === 98; }, false);

    USER_INPUT_MANAGER.register("2zoomhold", "keydown", (event) => { return event.keyCode === 97; }, true);
    USER_INPUT_MANAGER.register("2zoomhold", "keyup", (event) => { return event.keyCode === 97; }, false);

    USER_INPUT_MANAGER.register("1_ticked", "keydown", (event) => { return event.keyCode===49; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("2_ticked", "keydown", (event) => { return event.keyCode===50; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("3_ticked", "keydown", (event) => { return event.keyCode===51; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("4_ticked", "keydown", (event) => { return event.keyCode===52; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("5_ticked", "keydown", (event) => { return event.keyCode===53; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("6_ticked", "keydown", (event) => { return event.keyCode===54; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("7_ticked", "keydown", (event) => { return event.keyCode===55; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("8_ticked", "keydown", (event) => { return event.keyCode===56; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("9_ticked", "keydown", (event) => { return event.keyCode===57; }, true, {"ticked": true, "ticked_activation": false});
    USER_INPUT_MANAGER.register("0_ticked", "keydown", (event) => { return event.keyCode===48; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("b_ticked", "keydown", (event) => { return event.keyCode===66; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("r_ticked", "keydown", (event) => { return event.keyCode===82; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("ticked_toggle_camera", "keydown", (event) => { return event.keyCode===67; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("kill_feed_up", "keydown", (event) => { return event.keyCode===33; });
    USER_INPUT_MANAGER.register("kill_feed_up", "keyup", (event) => { return event.which===33; }, false);
    USER_INPUT_MANAGER.register("kill_feed_down", "keydown", (event) => { return event.keyCode===34; });
    USER_INPUT_MANAGER.register("kill_feed_down", "keyup", (event) => { return event.which===34; }, false);

    USER_INPUT_MANAGER.register("m_ticked", "keydown", (event) => { return event.keyCode===77; }, true, {"ticked": true, "ticked_activation": false});

    USER_INPUT_MANAGER.register("u_ticked", "keydown", (event) => { return event.keyCode===85; }, true, {"ticked": true, "ticked_activation": false});

    // Disable context menu
    document.getElementById("main_area").addEventListener("contextmenu", (event) => {event.preventDefault()});

    window.onblur = () => {
        if (!TICK_SCHEDULER.isPaused()){
            TICK_SCHEDULER.pause();
        }
    }

    window.onfocus = () => {
        if (TICK_SCHEDULER.isPaused() && !(MENU_MANAGER.getActiveMenu() === MENU_MANAGER.getMenuByName("pause_menu"))){
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
    
    setupOngoing = false;
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
        if (timePassed < WTL_GAME_DATA["controls"]["approximate_zoom_peek_time_ms"]){
            WTL_GAME_DATA["settings"]["game_zoom"] = gameZoom;
        }else{ // If not taking the button then reset zoom
            gameZoom = WTL_GAME_DATA["settings"]["game_zoom"];
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

function drawCustomCrosshair(crosshairImage, customX=null, customY=null){
    let x = window.mouseX;
    let y = window.mouseY;
    let crosshairWidth = crosshairImage.width;
    let crosshairHeight = crosshairImage.height;
    let displayX = x - crosshairWidth/2;
    let displayY = y - crosshairHeight/2;
    if (customX != null){
        displayX = customX;
    }
    if (customY != null){
        displayY = customY;
    }
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
    let tickDifference = expectedTicks - TICK_SCHEDULER.getNumTicks()

    // If ready for a tick then execute
    if (tickDifference > 0 && !TICK_SCHEDULER.isPaused()){
        // Destroy extra ticks
        if (tickDifference > 1){
            let ticksToDestroy = tickDifference - 1;
            TICK_SCHEDULER.addTimeDebt(calculateMSBetweenTicks() * ticksToDestroy);
        }

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
    //GAMEMODE_MANAGER.setActiveGamemode(new WTLGame());
    let gameDetails = WTL_GAME_DATA["test_settings"]["duel"];
    GAMEMODE_MANAGER.setActiveGamemode(new Duel(gameDetails));
}

function startGameMaker(){
    GAMEMODE_MANAGER.setActiveGamemode(new GameMaker());
}

class WTLGame extends Gamemode {
    constructor(){
        super();

        let scene = this.getScene();
        this.eventHandler.addHandler("gun_shot", (eventObj) => {
            scene.addExpiringVisual(SmokeCloud.create(eventObj["x"], eventObj["y"]));
            SOUND_MANAGER.play("gunshot", eventObj["x"], eventObj["y"]);
        });

        this.eventHandler.addHandler("kill", (killObject) => {
            scene.addExpiringVisual(BloodPool.create(scene.getCenterXOfTile(killObject["tile_x"]), scene.getCenterYOfTile(killObject["tile_y"])));
        });
        
        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    getEnemyVisibilityDistance(){
        return Number.MAX_SAFE_INTEGER;
    }

    async startUp(){
        await this.scene.loadTilesFromJSON(LEVEL_DATA["default.json"]);
        let samuel = new HumanCharacter(this, "usa_officer");
        samuel.setID("samuel");
        samuel.getInventory().add(new Musket("brown_bess", {
            "player": samuel
        }));
        samuel.getInventory().add(new Sword("cleaver", {
            "player": samuel
        }));
        samuel.getInventory().add(new Sword("cavalry_sword", {
            "player": samuel
        }));
        samuel.getInventory().add(new Pistol("flintlock", {
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