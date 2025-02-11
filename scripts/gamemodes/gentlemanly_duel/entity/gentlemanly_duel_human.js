/*  
    Class Name: GentlemanlyDuelHuman
    Class Description: A human-controlled character taking part in a gentlemanly duel
*/
class GentlemanlyDuelHuman extends GentlemanlyDuelCharacter {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Gentlemanly duel instance
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
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Makes decisions
        Method Return: void
    */
    makeDecisions(){
        this.resetDecisions();
        //this.inventory.makeDecisions();
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }
        this.updateFromCommands();
    }

    /*
        Method Name: isHuman
        Method Parameters: None
        Method Description: Checks if the character is a human
        Method Return: boolean
    */
    isHuman(){return true;}

    /*
        Method Name: updateFromCommands
        Method Parameters: None
        Method Description: Makes decisions from game commands
        Method Return: void
    */
    updateFromCommands(){
        let command = this.gamemode.getCommandFromGame(this.getID());
        this.amendDecisions(command);
    }

    /*
        Method Name: makePistolDecisions
        Method Parameters: None
        Method Description: Checks if the human user wishes to shoot/aim/reload their pistol
        Method Return: void
    */
    makePistolDecisions(){
        let canShoot = this.gamemode.canShoot(this.getID());
        let tryingToAim = GAME_USER_INPUT_MANAGER.isActivated("right_click") && canShoot;
        let tryingToShoot = GAME_USER_INPUT_MANAGER.isActivated("left_click_ticked") && canShoot; // Adding it doubly just because
        let tryingToReload = GAME_USER_INPUT_MANAGER.isActivated("r_ticked");
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    /*
        Method Name: getGunHoldingAngleRAD
        Method Parameters: None
        Method Description: TODO
        Method Return: TODO
    */
    getGunHoldingAngleRAD(){
        return getAngleFromMouseToScreenCenter(this.getScene());
    }
}