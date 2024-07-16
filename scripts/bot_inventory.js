class BotInventory extends Inventory {
    checkChangeSelectedSlot(){
        let newSlot = this.selectedSlot;

        // TODO

        if (newSlot == this.selectedSlot){
            return;
        }

        if (this.hasSelectedItem()){
            this.getItemAtSelectedSlot().deselect();
        }
        this.selectedSlot = newSlot;
        if (this.hasSelectedItem()){
            this.getItemAtSelectedSlot().select();
        }
    }
}