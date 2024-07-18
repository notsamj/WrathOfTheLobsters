class HumanSword extends Sword {
    constructor(model, details){
        super(model, details);
    }

    makeDecisions(){
        let tryingToSwing = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        this.decisions = {
            "trying_to_swing_sword": tryingToSwing
        }
    }
}