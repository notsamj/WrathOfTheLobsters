class SkirmishHuman extends SkirmishCharacter {
    constructor(gamemode, model, rank, team){
        super(gamemode, model, rank, team);
        this.inventory = new HumanInventory(); // FAKE-INTERFACE HumanPlayer
    }


    makeMovementDecisions(){
        this.decisions["up"] = USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = USER_INPUT_MANAGER.isActivated("sprint");
    }
}