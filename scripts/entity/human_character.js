/*  
    Class Name: HumanCharacter
    Class Description: A human character (and controlled by a human) in the game
*/
class HumanCharacter extends Character {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                The associated gamemode instance
            model:
                String, model of character
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, model){
        super(gamemode, model);
    }

    /*
        Method Name: isHuman
        Method Parameters: None
        Method Description: Checks if the character is a human
        Method Return: Boolean
    */
    isHuman(){return true;}

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Instructs character to make decisions
        Method Return: void
    */
    makeDecisions(){
        this.resetDecisions();
        this.makeMovementDecisions();
        this.inventory.makeDecisions();
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }
    }

    /*
        Method Name: makeMovementDecisions
        Method Parameters: None
        Method Description: Checks for human input to make movement decisions
        Method Return: void
    */
    makeMovementDecisions(){
        this.decisions["up"] = GAME_USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = GAME_USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = GAME_USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = GAME_USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = GAME_USER_INPUT_MANAGER.isActivated("sprint");
    }

    /*
        Method Name: makeInventoryDecisions
        Method Parameters: None
        Method Description: Checks for human input to make inventory decisions
        Method Return: void
    */
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

    /*
        Method Name: makeSwordDecisions
        Method Parameters: None
        Method Description: Checks to see if the user wishes to swing/block
        Method Return: void
    */
    makeSwordDecisions(){
        let tryingToSwing = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked");
        let tryingToBlock = GAME_USER_INPUT_MANAGER.isActivated("right_click");
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
            "trying_to_block": tryingToBlock
        });
    }

    /*
        Method Name: makePistolDecisions
        Method Parameters: None
        Method Description: Checks to see if the user wishes to aim/shoot/reload
        Method Return: void
    */
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

    /*
        Method Name: makeMusketDecisions
        Method Parameters: None
        Method Description: Checks to see if the user wishes to make decisions for their held musket
        Method Return: void
    */
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

    /*
        Method Name: getGunHoldingAngleRAD
        Method Parameters: None
        Method Description: Determines where the user is point at with their crosshair
        Method Return: float in [0,2*PI)
    */
    getGunHoldingAngleRAD(){
        return getAngleFromMouseToScreenCenter(this.getScene());
    }
}