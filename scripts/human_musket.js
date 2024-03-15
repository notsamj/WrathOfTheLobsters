class HumanMusket extends Musket {
    constructor(model, details){
        super(model, details);
    }

    tick(){
        this.tryingToAim = USER_INPUT_MANAGER.isActivated("right_click");
        if (this.isAiming()){
            // TODO
        }
    }
}