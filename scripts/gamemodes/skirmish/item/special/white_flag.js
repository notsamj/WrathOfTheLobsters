class WhiteFlag extends Sword {
    constructor(model, details){
        super(model, details);
    }

    startSwing(){
        super.startSwing();
    }

    finishSwing(){
        this.player.commitToAction();
        super.finishSwing();
        this.player.indicateMoveDone();
    }
}