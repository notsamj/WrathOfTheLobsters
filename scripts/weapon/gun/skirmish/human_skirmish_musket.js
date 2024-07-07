class HumanSkirmishMusket extends SkirmishMusket {
    constructor(model, details){
        super(model, details);
    }

    tick(){
        if (!this.player.isMakingAMove()){
            if (this.tryingToAim){
                this.tryingToAim = false;
            }
            return;
        }
        this.tryingToAim = USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        if (this.isAiming() && tryingToShoot && this.isLoaded()){
            this.shoot();
        }
    }

    getAngleRAD(){
        let x = mouseX;
        let y = this.getScene().changeFromScreenY(mouseY);
        let xOffset = x - getScreenWidth() / 2;
        let yOffset = y - getScreenHeight() / 2;
        if (xOffset == 0){
            if (yOffset > 0){
                return Math.PI/2;
            }else if (yOffset < 0){
                return Math.PI*3/2;
            }else{
                return 0;
            }
        }
        let angleRAD = Math.atan(yOffset/xOffset);
        if (xOffset < 0){
            angleRAD -= Math.PI;
        }
        return fixRadians(angleRAD);
    }

    shoot(){
        super.shoot();
        this.player.indicateHasShot();
    }
}