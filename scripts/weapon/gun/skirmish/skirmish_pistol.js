class SkirmishPistol extends Pistol {
    constructor(model, details){
        super(model, details);
    }
    
    shoot(){
        super.shoot();
        this.reloaded = true;
        this.player.indicateMoveDone();
    }
    // FAKE-INTERFACE: SkirmishGun
    isAiming(){
        return super.isAiming() && this.player.isMakingAMove();
    }
}