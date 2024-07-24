class Inventory {
    constructor(){
        this.hotbar = new NotSamArrayList(null, RETRO_GAME_DATA["inventory"]["hotbar_size"]);
        this.hotbar.fillWithPlaceholder(null);
        this.selectedSlot = 0;
    }

    getItems(){
        let itemList = [];
        for (let [item, itemIndex] of this.hotbar){
            itemList.push(item);
        }
        return itemList;
    }

    tick(){
        this.checkChangeSelectedSlot();
    }

    // Abstract
    checkChangeSelectedSlot(){ }

    hasFreeSlots(){
        return this.hotbar.has(null);
    }

    add(item){
        this.hotbar.put(this.hotbar.search(null), item);
    }

    display(){
        let hotbarOutlineColour = Colour.fromCode(RETRO_GAME_DATA["inventory"]["harbar_outline_colour"]);

        let hotbarSize = RETRO_GAME_DATA["inventory"]["hotbar_size"];
        let slotSize = RETRO_GAME_DATA["inventory"]["slot_size"];
        let width = slotSize * hotbarSize + 1 + hotbarSize;

        // Find x offset to center
        let xOffset = 0;
        let screenWidth = getScreenWidth();

        // If there is more than enough space to display the whole thing then get an x offset
        if (width < screenWidth){
            xOffset = Math.floor((screenWidth - width) / 2);
        }

        let yOffset = RETRO_GAME_DATA["inventory"]["hotbar_y_offset_from_bottom"];
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
        let textColour = Colour.fromCode(RETRO_GAME_DATA["inventory"]["hotbar_selected_item_outline_colour"]);

        // Display item icons
        let displayNumber = 1;
        let textSize = RETRO_GAME_DATA["inventory"]["text_size"];
        for (let i = 0; i < hotbarSize; i++){
            let itemXOffset = xOffset + 1 + i * (slotSize + 1);
            let item = this.hotbar.get(i);
            if (item != null){
                item.displayItemSlot(itemXOffset, displayY+1);
            }
            makeText(displayNumber.toString(), itemXOffset, displayY+1, textSize, textSize, textColour, textSize, "left", "top")
            displayNumber = (displayNumber+ 1) % 10;
        }

        // If has selected item then display indicator
        let selectedSlotOutlineColour = Colour.fromCode(RETRO_GAME_DATA["inventory"]["hotbar_selected_item_outline_colour"]);
        let selectedSlotLeftBorderX = xOffset + this.selectedSlot * (slotSize + 1);
        let selectedSlotRightBorderX = xOffset + (this.selectedSlot+1) * (slotSize + 1);

        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotLeftBorderX, displayY, slotSize+2, 1);
        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotLeftBorderX, displayY, 1, slotSize+2);
        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotLeftBorderX, displayY+slotSize+1, slotSize+2, 1);
        noStrokeRectangle(selectedSlotOutlineColour, selectedSlotRightBorderX, displayY, 1, slotSize+2);
    }

    getItemAtSelectedSlot(){
        return this.hotbar.get(this.selectedSlot);
    }

    getSelectedItem(){
        return this.getItemAtSelectedSlot();
    }

    hasSelectedItem(){
        return this.getItemAtSelectedSlot() != null;
    }

    displaySelectedItem(lX, bY){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().display(lX, bY);
    }

    tickSelectedItem(){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().tick();
    }

    makeDecisionsForSelectedItem(){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().makeDecisions();
    }

    actOnDecisionsForSelectedItem(){
        if (!this.hasSelectedItem()){ return; }
        this.getItemAtSelectedSlot().actOnDecisions();
    }
}
/*
    Item required methods:
        - select
        - deselect
*/