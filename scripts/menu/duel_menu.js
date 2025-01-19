class DuelMenu extends Menu {
    constructor(){
        super();
    }

    setup(){
        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = WTL_GAME_DATA["menu"]["menus"]["duel_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            MENU_MANAGER.switchTo("main");
        }));

        let sectionHeadYFunction = (innerHeight) => { return innerHeight; }
        let sectionHeadYSize = menuData["section_head"]["y_size"];
        let characterImageYOffset = menuData["character_image"]["y_offset"];
        let characterImageYFunction = (innerHeight) => { return sectionHeadYFunction(innerHeight) - sectionHeadYSize - characterImageYOffset; }

        // Player 1
        let p1StartX = menuData["p1_start_x"];

        // Head text
        this.components.push(new TextComponent(menuData["section_head"]["p1_name"], menuData["section_head"]["text_colour_code"], menuData["p1_start_x"], sectionHeadYFunction, menuData["section_head"]["x_size"], sectionHeadYSize))
        
        // Character image
        this.p1CharacterImage = new RotatingStaticImage("british_officer_64", p1StartX, characterImageYFunction, menuData["character_image"]["selection"], menuData["character_image"]["width"], menuData["character_image"]["height"]);
        this.components.push(this.p1CharacterImage);
    }
}

MENU_MANAGER.registerMenu("duel_menu", new DuelMenu());