/*  
    Class Name: DuelHuman
    Class Description: A human-controlled character taking part in a duel
*/
class DuelHuman extends DuelCharacter {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Duel instance
            model:
                The character model
            extraDetails:
                Extra information about the character (JSON)
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, model, extraDetails){
        super(gamemode, model, extraDetails);
    }

    /*
        Method Name: drawGunCrosshair
        Method Parameters: 
            gun:
                A gun instance
            lX:
                The x coordinate of the left side of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Draws the crosshair on the screen
        Method Return: void
    */
    drawGunCrosshair(gun, lX, bY){
        let mouseX = gMouseX;
        let mouseY = gMouseY;

        let canvasX = gMouseX;
        let canvasY = this.getScene().changeFromScreenY(gMouseY);

        // Don't display if invalid value
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }

        let engineX = canvasX / gameZoom + lX;
        let engineY = canvasY / gameZoom + bY;

        let humanCenterX = this.getInterpolatedTickCenterX();
        let humanCenterY = this.getInterpolatedTickCenterY();

        let distance = Math.sqrt(Math.pow(engineX - humanCenterX, 2) + Math.pow(engineY - humanCenterY, 2));
        let swayedAngleRAD = gun.getSwayedAngleRAD();

        let crosshairCenterX = Math.cos(swayedAngleRAD) * distance + humanCenterX;
        let crosshairCenterY = Math.sin(swayedAngleRAD) * distance + humanCenterY;

        let x = this.getScene().getDisplayXOfPoint(crosshairCenterX, lX);
        let y = this.getScene().getDisplayYOfPoint(crosshairCenterY, bY);
        let crosshairImage = IMAGES["crosshair"];
        let crosshairWidth = crosshairImage.width;
        let crosshairHeight = crosshairImage.height;
        translate(x, y);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(crosshairImage, -1 * crosshairWidth / 2, -1 * crosshairHeight / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * x, -1 * y);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Runs processes during a tick
        Method Return: void
    */
    tick(){
        super.tick();
        MY_HUD.updateElement("tile_x", this.getTileX());
        MY_HUD.updateElement("tile_y", this.getTileY());
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Makes decisions
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
        Method Name: makeInventoryDecisions
        Method Parameters: None
        Method Description: Make decisions for the inventory
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
        if (newSlot === this.selectedSlot){ return; }
        this.amendDecisions({
            "select_slot": newSlot
        });
    }

    /*
        Method Name: makeSwordDecisions
        Method Parameters: None
        Method Description: Makes decisions for the sword
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
        Method Name: isHuman
        Method Parameters: None
        Method Description: Checks if the character is a human
        Method Return: boolean
    */
    isHuman(){return true;}

    /*
        Method Name: makePistolDecisions
        Method Parameters: None
        Method Description: Checks if the human user wishes to shoot/aim/reload their pistol
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
        Method Description: Checks if the human user wishes to shoot/aim/reload/stab their musket
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
        Method Description: Gets the angle to the human user's crosshair
        Method Return: float [0,2*MathPI)
    */
    getGunHoldingAngleRAD(){
        return getAngleFromMouseToScreenCenter(this.getScene());
    }

    /*
        Method Name: makeMovementDecisions
        Method Parameters: None
        Method Description: Makes movement decisions based on human user actions
        Method Return: void
    */
    makeMovementDecisions(){
        this.decisions["up"] = GAME_USER_INPUT_MANAGER.isActivated("move_up");
        this.decisions["down"] = GAME_USER_INPUT_MANAGER.isActivated("move_down");
        this.decisions["left"] = GAME_USER_INPUT_MANAGER.isActivated("move_left");
        this.decisions["right"] = GAME_USER_INPUT_MANAGER.isActivated("move_right");
        this.decisions["sprint"] = GAME_USER_INPUT_MANAGER.isActivated("sprint");
    }
}