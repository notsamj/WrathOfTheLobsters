class BotInventory extends Inventory {
    makeDecisions(){
        this.resetDecisions();
        let newSlot = this.player.getDecision("select_slot");
        if (newSlot == this.selectedSlot){ return; }
        this.decisions["select_slot"] = newSlot;
    }
}