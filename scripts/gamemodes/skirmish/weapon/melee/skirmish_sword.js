class SkirmishSword extends Sword {
    constructor(model, details){
        super(model, details);
    }

    finishSwing(){
        super.finishSwing();
        this.player.indicateMoveDone();
    }
}