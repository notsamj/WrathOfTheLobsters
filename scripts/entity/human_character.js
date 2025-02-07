class HumanCharacter extends Character {
    constructor(gamemode, model){
        super(gamemode, model);
    }

    isHuman(){return true;}

    makeDecisions(){
        this.resetDecisions();
        this.makeMovementDecisions();
        this.inventory.makeDecisions();
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }
    }

    makeMovementDecisions(){
        this.decisions["up"] = GAME_USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = GAME_USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = GAME_USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = GAME_USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = GAME_USER_INPUT_MANAGER.isActivated("sprint");
    }

    makeInventoryDecisions(){
        // Reset
        this.amendDecisions({
            "select_slot": this.inventory.getSelectedSlot(),
        });
        let newSlot = this.selectedSlot;
        if (GAME_USER_INPUT_MANAGER.isActivated("1_ticked")){
            newSlot = 0;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("2_ticked")){
            newSlot = 1;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("3_ticked")){
            newSlot = 2;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("4_ticked")){
            newSlot = 3;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("5_ticked")){
            newSlot = 4;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("6_ticked")){
            newSlot = 5;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("7_ticked")){
            newSlot = 6;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("8_ticked")){
            newSlot = 7;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("9_ticked")){
            newSlot = 8;
        }else if (GAME_USER_INPUT_MANAGER.isActivated("0_ticked")){
            newSlot = 9;
        }
        if (newSlot == this.selectedSlot){ return; }
        this.amendDecisions({
            "select_slot": newSlot
        });
    }

    makeSwordDecisions(){
        let tryingToSwing = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let tryingToBlock = GAME_USER_INPUT_MANAGER.isActivated("right_click");
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
            "trying_to_block": tryingToBlock
        });
    }

    isHuman(){return true;}

    makePistolDecisions(){
        let tryingToAim = GAME_USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let tryingToReload = GAME_USER_INPUT_MANAGER.isActivated("r_ticked");
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    makeMusketDecisions(){
        let tryingToAim = GAME_USER_INPUT_MANAGER.isActivated("right_click");
        let tryingToShoot = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let togglingBayonetEquip = GAME_USER_INPUT_MANAGER.isActivated("b_ticked");
        let tryingToReload = GAME_USER_INPUT_MANAGER.isActivated("r_ticked");
        let tryingToStab = GAME_USER_INPUT_MANAGER.isActivated("middle_click");
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "toggling_bayonet_equip": togglingBayonetEquip,
            "trying_to_reload": tryingToReload,
            "trying_to_stab": tryingToStab,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    getGunHoldingAngleRAD(){
        return getAngleFromMouseToScreenCenter(this.getScene());
    }
}