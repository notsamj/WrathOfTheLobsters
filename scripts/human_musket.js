class HumanMusket extends Musket {
    constructor(model, details){
        super(model, details);
    }

    tick(){
        this.tryingToAim = USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = USER_INPUT_MANAGER.isActivated("left_click");
        if (this.isAiming() && tryingToShoot && this.isReloaded()){
            //this.reloaded = false;
            this.shoot();
        }
    }
}