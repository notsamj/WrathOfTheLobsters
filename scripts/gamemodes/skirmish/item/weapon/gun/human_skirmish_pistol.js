class HumanSkirmishPistol extends SkirmishPistol {
    constructor(model, details){
        super(model, details);
    }

    makeDecisions(){
        let tryingToAim = USER_INPUT_MANAGER.isActivated("right_click") && this.player.isMakingAMove();
        let tryingToShoot = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let tryingToReload = USER_INPUT_MANAGER.isActivated("r_ticked");
        this.decisions = {
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": this.determineNewAngleRAD()
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
}