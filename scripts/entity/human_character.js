class HumanCharacter extends Character {
    constructor(gamemode, model){
        super(gamemode, model);
        this.inventory = new HumanInventory();
    }

    makeDecisions(){
        this.resetDecisions();
        this.makeMovementDecisions();
        this.inventory.makeDecisionsForSelectedItem();
    }

    makeMovementDecisions(){
        this.decisions["up"] = USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = USER_INPUT_MANAGER.isActivated("sprint");
    }
}