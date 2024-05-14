class GameMakerUI extends Menu {
    constructor(){
        super();
        this.setupTopBar();

    }

    setupTopBar(){
        let topBarHeight = 100;
        this.topBar = new ComponentGroup();
        
        let purpleColour = Colour.fromCode("#c532e3");

        // Add Background Top Bar Indicator
        this.topBar.addComponent(new SimpleComponent(() => {
            noStrokeRectangle(purpleColour, 0, 0, getScreenWidth(), 100);
        }));

        // Back Button
        let backButtonWidth = 100;
        this.topBar.addComponent(new RectangleButton("Main Menu", purpleColour.toCode(), "#ffffff", (innerWidth) => { return innerWidth - backButtonWidth; }, (innerHeight) => { return innerHeight }, backButtonWidth, topBarHeight, (menuInstance) => {
            MENU_MANAGER.switchTo("main");
            GAMEMODE_MANAGER.getActiveGamemode().end();
            GAMEMODE_MANAGER.deleteActiveGamemode();
        }));
    }

    display(){
        this.topBar.display();
    }

    /*
        Method Name: click
        Method Parameters:
        x:
            The x location of the click
        y:
            The y location of the click

        Method Description: Determine if any component was clicked (from most recently added to least)
        Method Return: void
    */
    click(x, y){
        let components = this.getAllComponents();
        for (let i = components.length - 1; i >= 0; i--){
            let component = components[i];
            if (component.covers(x, y) && !component.isDisabled()){
                component.clicked(this);
                break;
            }
        }
    }

    getAllComponents(){
        let components = [];
        components = appendLists(components, this.topBar.getComponents());
        return components;
    }

}