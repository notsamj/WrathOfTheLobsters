class Inventory {
    constructor(){
        this.hotbar = new NotSamArrayList(null, 10);
        this.hotbar.fillWithPlaceholder(null);
        this.selectedSlot = 0;
    }

    hasFreeSlots(){
        return this.hotbar.has(null);
    }

    add(item){
        this.hotbar.put(this.hotbar.search(null), item);
    }

    display(){

    }

    getItemAtSelectedSlot(){
        return this.hotbar.get(this.selectedSlot);
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
}