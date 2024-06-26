class HumanSword extends Sword {
    constructor(model, details){
        super(model, details);
    }

    tick(){
        super.tick();

        let tryingToSwing = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        if (tryingToSwing && !this.isSwinging()){
            this.startSwing();
        }
    }
}