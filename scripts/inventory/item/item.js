class Item {
    select(){}
    deselect(){}
    displayItemSlot(providedX, providedY){}
    display(lX, bY){}
    makeDecisions(){}
    actionOnDecisions(){}
    getDecisions(){ return null; }
    getDecision(decisionName){
        return this.player.getDecision(decisionName);
    }
    getGamemode(){
        return this.player.getGamemode();
    }
    breakAction(){}
}