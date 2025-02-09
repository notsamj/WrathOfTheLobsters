class ScrollableDisplay extends Component {
    constructor(scrollableDisplayJSON, itemsList){
        super();
        this.scrollBar = undefined; // Declare
        this.entryXOffset = undefined; // Declare
        this.entryXSize = undefined; // Declare
        this.entryYSize = undefined; // Declare
        this.entryYOffset = undefined; // Declare
        this.displayItems = undefined; // Declare
        this.setup(scrollableDisplayJSON, itemsList);
    }

    tick(){
        this.scrollBar.tick();
    }

    getEntryYSize(){
        return this.entryYSize;
    }

    covers(x, y){
        return x >= this.entryXOffset && x <= getScreenWidth() - this.entryXOffset && y >= this.entryYOffset && y <= getScreenHeight() - this.entryYOffset;
    }

    clicked(menuInstance, x, yFromBottom){
        let yFromTop = MENU_MANAGER.changeToScreenY(yFromBottom);
        // Handle the entry y offset
        yFromTop -= this.entryYOffset;

        let itemIndicesOnScreen = this.scrollBar.getVisibleEntriesIndicesRange();
        let foundIndex = null;
        let startI = itemIndicesOnScreen["start_index"];
        let yOffsetOfStartI = this.scrollBar.getYOffsetOf(startI) + this.entryYOffset;
        let endI = itemIndicesOnScreen["end_index"];


        let expectedI = Math.floor((yFromTop - yOffsetOfStartI) / this.entryYSize) + startI;
        // Ignore if out of range
        if (expectedI > endI || expectedI < startI){ return; }
        let yOffsetOfExpectedI = (expectedI - startI) * this.entryYSize + yOffsetOfStartI;
        
        // If not clicking inside button then ignore
        if (!(x >= this.entryXOffset && x < this.entryXOffset + this.goToMenuButtonXSize && yFromTop >= yOffsetOfExpectedI && yFromTop < yOffsetOfExpectedI + this.goToMenuButtonYSize)){
            return;
        }
        // Click in button -> go to menu
        MENU_MANAGER.switchTo(this.displayItems.get(expectedI)["menu_name"]);
    }

    setup(scrollableDisplayJSON, itemsList){
        let entryXSize = scrollableDisplayJSON["entry"]["x_size"];
        this.entryXSize = entryXSize;
        let entryXOffset = scrollableDisplayJSON["entry"]["x_offset"];
        this.entryXOffset = entryXOffset;
        let entryYSize = scrollableDisplayJSON["entry"]["y_size"];
        this.entryYSize = entryYSize;
        let entryYOffset = scrollableDisplayJSON["entry"]["y_offset"];
        this.entryYOffset = entryYOffset;

        this.displayNameXSize = scrollableDisplayJSON["entry"]["display_name_x_size"];
        this.displayNameYSize = scrollableDisplayJSON["entry"]["display_name_y_size"];
        this.displayNameTextColour = Colour.fromCode(scrollableDisplayJSON["entry"]["display_name_text_colour_code"]);
        this.goToMenuButtonText = scrollableDisplayJSON["entry"]["go_to_menu_button_text"];
        this.goToMenuButtonXSize = scrollableDisplayJSON["entry"]["go_to_menu_button_x_size"];
        this.goToMenuButtonYSize = scrollableDisplayJSON["entry"]["go_to_menu_button_y_size"];
        this.goToMenuButtonBackgroundColour = Colour.fromCode(scrollableDisplayJSON["entry"]["go_to_menu_button_background_colour_code"]);
        this.goToMenuButtonTextColour = Colour.fromCode(scrollableDisplayJSON["entry"]["go_to_menu_button_text_colour_code"]);

        // Scroll bar
        let scrollbarData = scrollableDisplayJSON["scroll_bar"];
        let scrollBarXOffset = scrollbarData["x_offset"];
        let scrollBarYOffset = scrollbarData["y_offset"];
        let scrollBarXFunction = (screenWidth) => { return screenWidth - scrollBarXOffset; }
        let scrollBarYFunction = (screenHeight) => { return scrollBarYOffset; }
        let scrollBarMaxHeightFunction = (screenHeight) => { return screenHeight - 2 * scrollBarYOffset; }
        let entryYSpaceFunction = (screenHeight) => { return screenHeight - entryYOffset * 2; }
        this.scrollBar = new ScrollBar(scrollBarXFunction, scrollBarYFunction, scrollbarData["width"], scrollbarData["min_height"], scrollbarData["slider_height"], scrollBarMaxHeightFunction, entryYSize, entryYSpaceFunction, scrollbarData["background_colour_code"], scrollbarData["slider_colour_code"]);
    
        // Setup display items
        this.displayItems = new NotSamArrayList(itemsList);
        this.scrollBar.increaseNumEntries(this.displayItems.getLength());
    }

    display(){
        this.displayEntries();
        this.scrollBar.display();
    }

    displayEntries(){
        let itemIndicesToDisplay = this.scrollBar.getVisibleEntriesIndicesRange();
        let startI = itemIndicesToDisplay["start_index"];
        let yOffsetOfStartI = this.scrollBar.getYOffsetOf(startI) + this.entryYOffset;
        let yOffset = yOffsetOfStartI;
        let endI = itemIndicesToDisplay["end_index"];

        // Display entries
        for (let i = startI; i <= endI; i++){
            // Add background
            //noStrokeRectangle(colour, this.entryXOffset, yOffset, this.entryXSize, this.entryYSize);
            
            // Add name text
            Menu.makeText(this.displayItems.get(i)["display_name"], this.displayNameTextColour, this.entryXOffset, MENU_MANAGER.changeToScreenY(yOffset), this.displayNameXSize, this.displayNameYSize);

            // Add go to menu button
            Menu.makeRectangleWithText(this.goToMenuButtonText, this.goToMenuButtonBackgroundColour.toCode(), this.goToMenuButtonTextColour.toCode(), this.entryXOffset, MENU_MANAGER.changeToScreenY(yOffset + this.displayNameYSize), this.goToMenuButtonXSize, this.goToMenuButtonYSize);

            // Increment yOffset
            yOffset += this.entryYSize;
        }
    }
}