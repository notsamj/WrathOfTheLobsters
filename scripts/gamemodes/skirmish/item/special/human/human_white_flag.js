class HumanWhiteFlag extends WhiteFlag {
    constructor(details){
        super("white_flag", details);
    }

    makeDecisions(){
        let tryingToSwing = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        this.decisions = {
            "trying_to_swing_sword": tryingToSwing
        }
    }
}