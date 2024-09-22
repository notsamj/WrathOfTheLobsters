class WhiteFlag extends Sword {
    constructor(details){
        super("white_flag", details);
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