class HumanMusket extends Musket {
    constructor(model, details){
        super(model, details);
    }

    makeDecisions(){
        let tryingToAim = USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let togglingBayonetEquip = USER_INPUT_MANAGER.isActivated("b_ticked");
        let tryingToReload = USER_INPUT_MANAGER.isActivated("r_ticked");
        let tryingToStab = USER_INPUT_MANAGER.isActivated("middle_click");
        this.decisions = {
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "toggling_bayonet_equip": togglingBayonetEquip,
            "trying_to_reload": tryingToReload,
            "trying_to_stab": tryingToStab
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