class SkirmishPistol extends Pistol {
    constructor(model, details){
        super(model, details);
    }
    
    isAiming(){
        return this.isAiming() && !this.player.hasCommitedToAction();
    }

    shoot(){
        if (this.player.hasCommitedToAction()){
            return;
        }
        this.player.commitToAction();
        super.shoot();
        this.reloaded = true;
        this.player.indicateMoveDone();
    }
}