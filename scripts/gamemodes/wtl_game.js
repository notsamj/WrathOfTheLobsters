// Global constants
const IMAGES = {};
const FRAME_COUNTER = new FrameRateCounter(WTL_GAME_DATA["general"]["frame_rate"]);
const MY_HUD = new HUD();
const GAME_TICK_SCHEDULER = new TickScheduler(Math.floor(1000/WTL_GAME_DATA["general"]["tick_rate"]));
const GAMEMODE_MANAGER = new GamemodeManager();
const GENERAL_USER_INPUT_MANAGER = new UserInputManager();
const GAME_USER_INPUT_MANAGER = new UserInputManager();
const SOUND_MANAGER = new SoundManager();
const GENERAL_DEBUGGER = new GeneralDebugger();
const LOADING_SCREEN = new LoadingScreen();
const LOCAL_EVENT_HANDLER = new NSEventHandler();

const ZOOM_MONITOR = {"button": null, "start_time_ms": null};

// Global Variables
var gMouseX = 0;
var gMouseY = 0;
var gLastClickedMouseX = 0;
var gLastClickedMouseY = 0;
var programOver = false;
var ramshackleDebugToolValue = false;
var setupOngoing = false;

// Key codes
const KEY_CODE_A = 65;
const KEY_CODE_B = 66;
const KEY_CODE_C = 67;
const KEY_CODE_D = 68;
const KEY_CODE_F = 70;
const KEY_CODE_G = 71;
const KEY_CODE_H = 72;
const KEY_CODE_M = 77;
const KEY_CODE_P = 80;
const KEY_CODE_R = 82;
const KEY_CODE_S = 83;
const KEY_CODE_U = 85;
const KEY_CODE_W = 87;
const KEY_CODE_NUMPAD_1 = 97;
const KEY_CODE_NUMPAD_2 = 98;
const KEY_CODE_NUMPAD_3 = 99;
const KEY_CODE_NUMPAD_4 = 100;
const KEY_CODE_NUMPAD_5 = 101;
const KEY_CODE_1 = 49;
const KEY_CODE_2 = 50;
const KEY_CODE_3 = 51;
const KEY_CODE_4 = 52;
const KEY_CODE_5 = 53;
const KEY_CODE_6 = 54;
const KEY_CODE_7 = 55;
const KEY_CODE_8 = 56;
const KEY_CODE_9 = 57;
const KEY_CODE_0 = 48;
const KEY_CODE_PGUP = 33;
const KEY_CODE_PGDOWN = 34;
const KEY_CODE_SHIFT = 16;
const KEY_CODE_LARROW = 37;
const KEY_CODE_RARROW = 39;
const KEY_CODE_ESCAPE = 27;
const KEY_CODE_LEFT_CLICK = 1;
const KEY_CODE_MIDDLE_CLICK = 2;
const KEY_CODE_RIGHT_CLICK = 3;

// Functions
/*
    Function Name: rDebug
    Function Parameters: None
    Function Description: Starts the 'r' (ramshackle) debugger
    Function Return: void
*/
function rDebug(){
    ramshackleDebugToolValue = true;
}

/*
    Function Name: stopRDebugging
    Function Parameters: None
    Function Description: Stops the 'r' (ramshackle) debugger
    Function Return: void
*/
function stopRDebugging(){
    ramshackleDebugToolValue = false;
}

/*
    Function Name: isRDebugging
    Function Parameters: None
    Function Description: Checks if the 'r' (ramshackle) debugger is active
    Function Return: boolean
*/
function isRDebugging(){
    return ramshackleDebugToolValue;
}

/*
    Function Name: loadHelpImages
    Function Parameters: None
    Function Description: Loads help images
    Function Return: Promise (implicit)
*/
async function loadHelpImages(){
    let imageJSON = WTL_GAME_DATA["menu"]["menus"]["help_menu"]["help_image"]["images"];
    let folderURL = "help/";
    for (let helpScreenName of Object.keys(imageJSON)){
        for (let imageName of imageJSON[helpScreenName]){
            // Do not load if already exists
            if (objectHasKey(IMAGES, imageName)){ continue; }
            await loadToImages(imageName, folderURL + helpScreenName + "/");
        }
    }
}

/*
    Function Name: loadProjectImages
    Function Parameters: None
    Function Description: Loads project images
    Function Return: Promise (implicit)
*/
async function loadProjectImages(){
    let images = WTL_GAME_DATA["menu"]["menus"]["my_projects_menu"]["project_image"]["images"];
    let folderURL = "my_projects/";
    for (let imageName of images){
        // Do not load if already exists
        if (objectHasKey(IMAGES, imageName)){ continue; }
        await loadToImages(imageName, folderURL);
    }
    
}

/*
    Function Name: setup
    Function Parameters: None
    Function Description: Sets up the game
    Function Return: Promise (implicit)
*/
async function setup() {
    setupOngoing = true;

    WTL_GAME_DATA["general"]["ms_between_ticks"] = Math.floor(1000 / WTL_GAME_DATA["general"]["tick_rate"]); // Expected to be an integer so floor isn't really necessary
    
    window.onmousemove = (event) => {
        gMouseX = event.clientX;
        gMouseY = event.clientY;
    }

    document.onclick = (event) => {
        gLastClickedMouseX = event.clientX;
        gLastClickedMouseY = event.clientY;
    }

    window.onerror = (event) => {
        programOver = true;
    };

    // Game Maker

    GAME_USER_INPUT_MANAGER.register("left_click", "mousedown", (event) => { return event.which===KEY_CODE_LEFT_CLICK; });
    GAME_USER_INPUT_MANAGER.register("left_click", "mouseup", (event) => { return event.which===KEY_CODE_LEFT_CLICK; }, false);

    // Game
    GAME_USER_INPUT_MANAGER.register("move_up", "keydown", (event) => { return event.keyCode===KEY_CODE_W; });
    GAME_USER_INPUT_MANAGER.register("move_up", "keyup", (event) => { return event.keyCode===KEY_CODE_W; }, false);

    GAME_USER_INPUT_MANAGER.register("move_down", "keydown", (event) => { return event.keyCode===KEY_CODE_S; });
    GAME_USER_INPUT_MANAGER.register("move_down", "keyup", (event) => { return event.keyCode===KEY_CODE_S; }, false);

    GAME_USER_INPUT_MANAGER.register("move_left", "keydown", (event) => { return event.keyCode===KEY_CODE_A; });
    GAME_USER_INPUT_MANAGER.register("move_left", "keyup", (event) => { return event.keyCode===KEY_CODE_A; }, false);

    GAME_USER_INPUT_MANAGER.register("move_right", "keydown", (event) => { return event.keyCode===KEY_CODE_D; });
    GAME_USER_INPUT_MANAGER.register("move_right", "keyup", (event) => { return event.keyCode===KEY_CODE_D; }, false);

    GAME_USER_INPUT_MANAGER.register("sprint", "keydown", (event) => { return event.keyCode===KEY_CODE_SHIFT; });
    GAME_USER_INPUT_MANAGER.register("sprint", "keyup", (event) => { return event.keyCode===KEY_CODE_SHIFT; }, false);

    GAME_USER_INPUT_MANAGER.register("right_click", "mousedown", (event) => { return event.which===KEY_CODE_RIGHT_CLICK; });
    GAME_USER_INPUT_MANAGER.register("right_click", "mouseup", (event) => { return event.which===KEY_CODE_RIGHT_CLICK; }, false);

    GAME_USER_INPUT_MANAGER.register("middle_click", "mousedown", (event) => { return event.which===KEY_CODE_MIDDLE_CLICK; });
    GAME_USER_INPUT_MANAGER.register("middle_click", "mouseup", (event) => { return event.which===KEY_CODE_MIDDLE_CLICK; }, false);

    GAME_USER_INPUT_MANAGER.register("left_click_ticked", "click", (event) => { return event.which===KEY_CODE_LEFT_CLICK; }, true, {"ticked": true, "ticked_activation": false});
   
    GAME_USER_INPUT_MANAGER.register("right_click_ticked", "mousedown", (event) => { return event.which===KEY_CODE_RIGHT_CLICK; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("middle_click_ticked", "mousedown", (event) => { return event.which===KEY_CODE_MIDDLE_CLICK; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("g_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_G; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("p_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_P; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("f_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_F; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("left_arrow", "keydown", (event) => { return event.keyCode===KEY_CODE_LARROW; });
    GAME_USER_INPUT_MANAGER.register("left_arrow", "keyup", (event) => { return event.keyCode===KEY_CODE_LARROW; }, false);

    GAME_USER_INPUT_MANAGER.register("right_arrow", "keydown", (event) => { return event.keyCode===KEY_CODE_RARROW; });
    GAME_USER_INPUT_MANAGER.register("right_arrow", "keyup", (event) => { return event.keyCode===KEY_CODE_RARROW; }, false);

    GAME_USER_INPUT_MANAGER.register("1/8zoomhold", "keydown", (event) => { return event.keyCode === KEY_CODE_NUMPAD_5; }, true);
    GAME_USER_INPUT_MANAGER.register("1/8zoomhold", "keyup", (event) => { return event.keyCode === KEY_CODE_NUMPAD_5; }, false);

    GAME_USER_INPUT_MANAGER.register("1/4zoomhold", "keydown", (event) => { return event.keyCode === KEY_CODE_NUMPAD_4; }, true);
    GAME_USER_INPUT_MANAGER.register("1/4zoomhold", "keyup", (event) => { return event.keyCode === KEY_CODE_NUMPAD_4; }, false);

    GAME_USER_INPUT_MANAGER.register("1/2zoomhold", "keydown", (event) => { return event.keyCode === KEY_CODE_NUMPAD_3; }, true);;
    GAME_USER_INPUT_MANAGER.register("1/2zoomhold", "keyup", (event) => { return event.keyCode === KEY_CODE_NUMPAD_3; }, false);

    GAME_USER_INPUT_MANAGER.register("1zoomhold", "keydown", (event) => { return event.keyCode === KEY_CODE_NUMPAD_2; }, true);
    GAME_USER_INPUT_MANAGER.register("1zoomhold", "keyup", (event) => { return event.keyCode === KEY_CODE_NUMPAD_2; }, false);

    GAME_USER_INPUT_MANAGER.register("2zoomhold", "keydown", (event) => { return event.keyCode === KEY_CODE_NUMPAD_1; }, true);
    GAME_USER_INPUT_MANAGER.register("2zoomhold", "keyup", (event) => { return event.keyCode === KEY_CODE_NUMPAD_1; }, false);

    GAME_USER_INPUT_MANAGER.register("1_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_1; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("2_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_2; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("3_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_3; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("4_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_4; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("5_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_5; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("6_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_6; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("7_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_7; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("8_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_8; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("9_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_9; }, true, {"ticked": true, "ticked_activation": false});
    GAME_USER_INPUT_MANAGER.register("0_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_0; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("b_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_B; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("r_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_R; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("ticked_toggle_camera", "keydown", (event) => { return event.keyCode===KEY_CODE_C; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("kill_feed_up", "keydown", (event) => { return event.keyCode===KEY_CODE_PGUP; });
    GAME_USER_INPUT_MANAGER.register("kill_feed_up", "keyup", (event) => { return event.which===KEY_CODE_PGUP; }, false);
    GAME_USER_INPUT_MANAGER.register("kill_feed_down", "keydown", (event) => { return event.keyCode===KEY_CODE_PGDOWN; });
    GAME_USER_INPUT_MANAGER.register("kill_feed_down", "keyup", (event) => { return event.which===KEY_CODE_PGDOWN; }, false);

    GAME_USER_INPUT_MANAGER.register("m_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_M; }, true, {"ticked": true, "ticked_activation": false});

    GAME_USER_INPUT_MANAGER.register("u_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_U; }, true, {"ticked": true, "ticked_activation": false});

    // menu
    GENERAL_USER_INPUT_MANAGER.registerSpecialType(new TickedValueNode("scroll_in_dir", "wheel", (event) => { return event.deltaY; }, 0));
    GENERAL_USER_INPUT_MANAGER.register("h_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_H; }, true, {"ticked": true, "ticked_activation": false});
    
    GENERAL_USER_INPUT_MANAGER.register("escape_ticked", "keydown", (event) => { return event.keyCode===KEY_CODE_ESCAPE; }, true, {"ticked": true, "ticked_activation": false});
    
    GENERAL_USER_INPUT_MANAGER.register("left_click_ticked", "click", (event) => { return event.which===KEY_CODE_LEFT_CLICK; }, true, {"ticked": true, "ticked_activation": false});

    GENERAL_USER_INPUT_MANAGER.register("left_arrow_ticked", "keydown", (event) => { return event.which===KEY_CODE_LARROW; }, true, {"ticked": true, "ticked_activation": false});
    GENERAL_USER_INPUT_MANAGER.register("right_arrow_ticked", "keydown", (event) => { return event.which===KEY_CODE_RARROW; }, true, {"ticked": true, "ticked_activation": false});
    
    GENERAL_USER_INPUT_MANAGER.register("option_slider_grab", "mousedown", (event) => { return true; });
    GENERAL_USER_INPUT_MANAGER.register("option_slider_grab", "mouseup", (event) => { return true; }, false);

    GENERAL_USER_INPUT_MANAGER.register("scroll_bar_grab", "mousedown", (event) => { return true; });
    GENERAL_USER_INPUT_MANAGER.register("scroll_bar_grab", "mouseup", (event) => { return true; }, false);


    // Disable context menu
    document.getElementById("main_area").addEventListener("contextmenu", (event) => {event.preventDefault()});

    window.onblur = () => {
        if (!GAME_TICK_SCHEDULER.isPaused()){
            GAME_TICK_SCHEDULER.pause();
        }
    }

    window.onfocus = () => {
        if (GAME_TICK_SCHEDULER.isPaused() && !(MENU_MANAGER.getActiveMenu() === MENU_MANAGER.getMenuByName("pause_menu"))){
            GAME_TICK_SCHEDULER.unpause();
            GAMEMODE_MANAGER.handleUnpause();
        }
    }

    // Create Canvas
    let canvasDOM = document.getElementById("canvas");
    canvasDOM.width = getScreenWidth();
    canvasDOM.height = getScreenHeight();

    // Set global variable drawingContext
    drawingContext = canvasDOM.getContext("2d");

    GAME_TICK_SCHEDULER.setStartTime(Date.now());

    // Start loading screen
    requestAnimationFrame(tick);

    // Load images
    
    try {
        for (let imageName of WTL_GAME_DATA["basic_images"]){
            await loadToImages(imageName);
        }
        await CharacterAnimationManager.loadAllImages();
        await Musket.loadAllImages();
        await Sword.loadAllImages();
        await Pistol.loadAllImages();
        await TurnBasedSkirmish.loadImages();
        await loadHelpImages();
        await loadProjectImages();

        // Make sure all physical tiles are loaded
        for (let tileDetails of WTL_GAME_DATA["physical_tiles"]){
            await ensureImageIsLoadedFromDetails(tileDetails);
        }
    }catch(error){
        console.error("Failed to load images:", error);
    }

    // Setup menus
    MENU_MANAGER.setup();

    setupOngoing = false;
}

/*
    Method Name: setGameZoom
    Method Parameters: None
    Method Description: Changes the game zoom
    Method Return: void
*/
function setGameZoom(){
    let buttonCount = 0;
    let eighth = GAME_USER_INPUT_MANAGER.isActivated("1/8zoomhold");
    let quarter = GAME_USER_INPUT_MANAGER.isActivated("1/4zoomhold");
    let half = GAME_USER_INPUT_MANAGER.isActivated("1/2zoomhold");
    let whole = GAME_USER_INPUT_MANAGER.isActivated("1zoomhold");
    let two = GAME_USER_INPUT_MANAGER.isActivated("2zoomhold");
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
            WTL_GAME_DATA["general"]["game_zoom"] = gameZoom;
        }else{ // If not taking the button then reset zoom
            gameZoom = WTL_GAME_DATA["general"]["game_zoom"];
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

/*
    Function Name: drawCustomCrosshair
    Function Parameters: 
        crosshairImage:
            Image to display
        customX:
            Specified x for display
        customY=null:
            Specified y for display
    Function Description: Displays a custom crosshair
    Function Return: void
*/
function drawCustomCrosshair(crosshairImage, customX=null, customY=null){
    let x = gMouseX;
    let y = gMouseY;
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

/*
    Function Name: draw
    Function Parameters: None
    Function Description: Draws things on the canvas
    Function Return: void
*/
function draw() {
    // Temporary white background
    noStrokeRectangle(Colour.fromCode("#ffffff"), 0, 0, getScreenWidth(), getScreenHeight());
    GAMEMODE_MANAGER.display();
    MENU_MANAGER.display();
}

/*
    Function Name: stop
    Function Parameters: None
    Function Description: Stops ticks
    Function Return: void
*/
function stop(){
    programOver = true;
}

/*
    Function Name: tick
    Function Parameters: None
    Function Description: Runs a tick
    Function Return: Promise (implicit)
*/
function displayLoading(){
    LOADING_SCREEN.display(true);
    let sW = getScreenWidth();
    let sH = getScreenHeight();
    let cX = Math.ceil(sW/2);
    let cY = Math.ceil(sH/2);
    Menu.makeText("Loading...", "#000000", cX, cY, sW, sH, "center", "middle");
}

/*
    Function Name: tick
    Function Parameters: None
    Function Description: Runs a tick
    Function Return: Promise (implicit)
*/
async function tick(){
    // Display loading screen
    if (setupOngoing){
        displayLoading();
        // Don't speed it up too much
        await sleep(WTL_GAME_DATA["general"]["ms_between_ticks"]);
        requestAnimationFrame(tick);
        return;
    }
    if (programOver){ return; }
    if (GAME_TICK_SCHEDULER.getTickLock().notReady()){ 
        requestAnimationFrame(tick);
        return; 
    }

    // Tick the menu manager
    MENU_MANAGER.tick();

    // Tick the GENERAL_USER_INPUT_MANAGER
    GENERAL_USER_INPUT_MANAGER.tick();

    let expectedTicks = GAME_TICK_SCHEDULER.getExpectedNumberOfTicksPassed();
    let tickDifference = expectedTicks - GAME_TICK_SCHEDULER.getNumTicks()

    // If ready for a tick then execute
    if (tickDifference > 0 && !GAME_TICK_SCHEDULER.isPaused()){
        // Destroy extra ticks
        if (tickDifference > 1){
            let ticksToDestroy = tickDifference - 1;
            GAME_TICK_SCHEDULER.addTimeDebt(calculateMSBetweenTicks() * ticksToDestroy);
        }

        GAME_TICK_SCHEDULER.getTickLock().lock()

        // Tick the game mode
        await GAMEMODE_MANAGER.tick();

        // Tick the GAME_USER_INPUT_MANAGER
        GAME_USER_INPUT_MANAGER.tick();

        // Count the tick
        GAME_TICK_SCHEDULER.countTick();
        GAME_TICK_SCHEDULER.getTickLock().unlock();
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

/*
    Function Name: getCanvasWidth
    Function Parameters: None
    Function Description: Gets the canvas width
    Function Return: int
*/
function getCanvasWidth(){
    return getScreenWidth();
}

/*
    Function Name: getCanvasHeight
    Function Parameters: None
    Function Description: Gets the canvas height
    Function Return: int
*/
function getCanvasHeight(){
    return getScreenHeight();
}

// Start Up
window.addEventListener("load", () => {
    setup();
    requestAnimationFrame(tick);
});

/*
    Function Name: startGame
    Function Parameters: None
    Function Description: Starts a game (for testing)
    Function Return: void
*/
function startGame(){
    //GAMEMODE_MANAGER.setActiveGamemode(new WTLGame());
    let gameDetails = WTL_GAME_DATA["test_settings"]["duel"];
    GAMEMODE_MANAGER.setActiveGamemode(new Duel(gameDetails));
}

/*
    Function Name: startGameMaker
    Function Parameters: None
    Function Description: Starts the gamemaker
    Function Return: void
*/
function startGameMaker(){
    GAMEMODE_MANAGER.setActiveGamemode(new GameMaker());
}

/*
    Class Name: WTLGame
    Description: Basic gamemode for testing
*/
class WTLGame extends Gamemode {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
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

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Gets the name
        Method Return: String
    */
    getName(){ return "wtl_game"; }

    /*
        Method Name: getEnemyVisibilityDistance
        Method Parameters: None
        Method Description: Gets the enemy visibility distance
        Method Return: int
    */
    getEnemyVisibilityDistance(){
        return Number.MAX_SAFE_INTEGER;
    }

    /*
        Method Name: startUp
        Method Parameters: None
        Method Description: Starts up the game
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the game
        Method Return: void
    */
    display(){
        if (this.startUpLock.isLocked()){ return; }
        this.scene.display();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks the game
        Method Return: void
    */
    tick(){
        if (this.startUpLock.isLocked()){ return; }
        this.scene.tick();
    }
}