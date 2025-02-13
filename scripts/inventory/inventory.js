/*
    Class Name: Inventory
    Class Description: The inventory of a player
*/
class Inventory {
    /*
        Method Name: constructor
        Method Parameters: 
            player:
                The associated player
        Method Description: constructor
        Method Return: constructor
    */
    constructor(player){
        this.player = player;
        this.hotbar = new NotSamArrayList(null, WTL_GAME_DATA["inventory"]["hotbar_size"]);
        this.hotbar.fillWithPlaceholder(null);
        this.selectedSlot = 0;
    }

    /*
        Method Name: resetSelection
        Method Parameters: None
        Method Description: Resets the selected slot
        Method Return: void
    */
    resetSelection(){
        this.selectedSlot = 0;
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Tells player to make inventory decisions
        Method Return: void
    */
    makeDecisions(){
        this.player.makeInventoryDecisions();
    }

    /*
        Method Name: getSelectedSlot
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getSelectedSlot(){
        return this.selectedSlot;
    }

    /*
        Method Name: getDecision
        Method Parameters: 
            decisionName:
                The name of a decision
        Method Description: Asks the player to get a decision value
        Method Return: Variable
    */
    getDecision(decisionName){
        return this.player.getDecision(decisionName);
    }

    /*
        Method Name: getItems
        Method Parameters: None
        Method Description: Gets all items
        Method Return: List of Item/null
    */
    getItems(){
        let itemList = [];
        for (let [item, itemIndex] of this.hotbar){
            itemList.push(item);
        }
        return itemList;
    }

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Acts on decisions made
        Method Return: void
    */
    actOnDecisions(){
        let newSlot = this.getDecision("select_slot");
        if (newSlot === -1 || newSlot === null || newSlot === undefined || newSlot === this.selectedSlot){ return; }

        if (this.hasSelectedItem()){
            this.getItemAtSelectedSlot().deselect();
        }
        this.selectedSlot = newSlot;
        if (this.hasSelectedItem()){
            this.getItemAtSelectedSlot().select();
        }
    }

    /*
        Method Name: hasFreeSlots
        Method Parameters: None
        Method Description: Check if there are free slots
        Method Return: boolean
    */
    hasFreeSlots(){
        return this.hotbar.has(null);
    }

    /*
        Method Name: add
        Method Parameters: 
            item:
                An item
        Method Description: Adds an item to the hotbar
        Method Return: void
    */
    add(item){
        this.hotbar.put(this.hotbar.search(null), item);
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the inventory bar and all items
        Method Return: void
    */
    display(){
        let hotbarOutlineColour = Colour.fromCode(WTL_GAME_DATA["inventory"]["harbar_outline_colour"]);

        let hotbarSize = WTL_GAME_DATA["inventory"]["hotbar_size"];
        let slotSize = WTL_GAME_DATA["inventory"]["slot_size"];
        let width = slotSize * hotbarSize + 1 + hotbarSize;

        // Find x offset to center
        let xOffset = 0;
        let screenWidth = getScreenWidth();

        // If there is more than enough space to display the whole thing then get an x offset
        if (width < screenWidth){
            xOffset = Math.floor((screenWidth - width) / 2);
        }

        let yOffset = WTL_GAME_DATA["inventory"]["hotbar_y_offset_from_bottom"];
        let displayY = getScreenHeight() - slotSize - yOffset;

        // Display top bar of outline
        noStrokeRectangle(hotbarOutlineColour, xOffset, displayY, width, 1);

        // Display bottom bar of outline
        noStrokeRectangle(hotbarOutlineColour, xOffset, displayY + slotSize + 1, width, 1);
    
        // Display dividing bars
        for (let x = xOffset; x < xOffset + width; x += (slotSize + 1)){
            noStrokeRectangle(hotbarOutlineColour, x, displayY + 1, 1, slotSize);
        }

        // Display text numbers
        let textColour = Colour.fromCode(WTL_GAME_DATA["inventory"]["hotbar_selected_item_outline_colour"]);

        // Display item icons
        let displayNumber = 1;
        let textSize = WTL_GAME_DATA["inventory"]["text_size"];
        for (let i = 0; i < hotbarSize; i++){
            let itemXOffset = xOffset + 1 + i * (slotSize + 1);
            let item = this.hotbar.get(i);
            if (item != null){
                item.displayItemSlot(itemXOffset, displayY+1);
            }
            makeText(displayNumber.toString(), itemXOffset, displayY+1, textSize, textSize, textColour, textSize, "left", "top")
            displayNumber = (displayNumber+ 1) % 10;
        }

        // Display UI associated things (i.e. crosshair)
        this.displayUIAssociated();

        // If has selected item then display indicator
        let selectedSlotOutlineColour = Colour.fromCode(WTL_GAME_DATA["inventory"]["hotbar_selected_item_outline_colour"]);
        let selectedSlotLeftBorderX = xOffset + this.selectedSlot * (slotSize + 1);
        let selectedSlotRightBorderX = xOffset + (this.selectedSlot+1) * (slotSize + 1);

        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotLeftBorderX, displayY, slotSize+2, 1);
        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotLeftBorderX, displayY, 1, slotSize+2);
        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotLeftBorderX, displayY+slotSize+1, slotSize+2, 1);
        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotRightBorderX, displayY, 1, slotSize+2);
    }

    /*
        Method Name: displayUIAssociated
        Method Parameters: None
        Method Description: Displays ui associated with selected item
        Method Return: void
    */
    displayUIAssociated(){
        if (this.hasSelectedItem()){
            this.getSelectedItem().displayUIAssociated();
        }
    }

    /*
        Method Name: getItemAtSelectedSlot
        Method Parameters: None
        Method Description: Gets the selected item
        Method Return: Item/null
    */
    getItemAtSelectedSlot(){
        return this.hotbar.get(this.selectedSlot);
    }

    /*
        Method Name: getSelectedItem
        Method Parameters: None
        Method Description: Gets the selected item
        Method Return: Item/null
    */
    getSelectedItem(){
        return this.getItemAtSelectedSlot();
    }

    /*
        Method Name: hasSelectedItem
        Method Parameters: None
        Method Description: Checks if there is a selected item
        Method Return: boolean
    */
    hasSelectedItem(){
        return this.getItemAtSelectedSlot() != null;
    }

    /*
        Method Name: displaySelectedItem
        Method Parameters: 
            lX:
                The x of the left of the screen
            bY:
                The y of the bottom of the screen
        Method Description: Displays the selected item
        Method Return: void
    */
    displaySelectedItem(lX, bY){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().display(lX, bY);
    }

    /*
        Method Name: tickSelectedItem
        Method Parameters: None
        Method Description: Ticks the selected item
        Method Return: void
    */
    tickSelectedItem(){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().tick();
    }

    /*
        Method Name: makeDecisionsForSelectedItem
        Method Parameters: None
        Method Description: Tells the selected item to make decisions
        Method Return: void
    */
    makeDecisionsForSelectedItem(){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().makeDecisions();
    }

    /*
        Method Name: actOnDecisionsForSelectedItem
        Method Parameters: None
        Method Description: Tells the selected item to act on decisions
        Method Return: void
    */
    actOnDecisionsForSelectedItem(){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().actOnDecisions();
    }

    /*
        Method Name: setSelectedSlot
        Method Parameters: 
            newSlotIndex:
                An int index
        Method Description: Setter
        Method Return: void
    */
    setSelectedSlot(newSlotIndex){
        this.selectedSlot = newSlotIndex;
    }

    /*
        Method Name: getNumberOfContents
        Method Parameters: None
        Method Description: Calculates the number of items (not null)
        Method Return: int
    */
    getNumberOfContents(){
        let count = 0;
        for (let [item, itemIndex] of this.hotbar){
            if (item != null){
                count++;
            }
        }
        return count;
    }
}