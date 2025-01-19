class SkirmishSword extends Sword {
    constructor(model, details){
        super(model, details);
    }

    startSwing(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        super.startSwing();
    }

    finishSwing(){
        // Note: No need for hasCommitedToAction check because startSwing checks it and finishSwing would not be reached if user had commited to another action
        this.player.commitToAction();
        super.finishSwing();
        this.player.indicateMoveDone();
    }

    getSwingDamage(){
        return WTL_GAME_DATA["skirmish"]["stab_damage"];
    }
}