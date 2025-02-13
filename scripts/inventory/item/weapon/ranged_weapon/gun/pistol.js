/*
    Class Name: Pistol
    Class Description: A pistol
*/
class Pistol extends Gun {
    /*
        Method Name: constructor
        Method Parameters: 
            model:
                Model of the pistol (string)
            details:
                JSON details with extra information
        Method Description: constructor
        Method Return: constructor
    */
    constructor(model, details){
        super(model, details);
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Tells player to make pistol decisions
        Method Return: void
    */
    makeDecisions(){
        this.player.makePistolDecisions();
    }

    /*
        Method Name: getSimulatedGunEndPosition
        Method Parameters: 
            playerLeftX:
                left x of a player
            playerTopY:
                top y of a player
            playerDirection:
                facing direction of a player (visual)
            playerAimingAngleRAD:
                Aiming direction of a player (radians) (float)
        Method Description: Comes up with a simulated gun end position if given parameters
        Method Return: JSON
    */
    getSimulatedGunEndPosition(playerLeftX, playerTopY, playerDirection, playerAimingAngleRAD){
        let result = {};
        let gunDirection;
        // Determine if using the right gun image or left gun image
        if (playerDirection == "front"){
            gunDirection = playerAimingAngleRAD > toRadians(270) ? "right" : "left";
        }else if (playerDirection == "left"){
            gunDirection = "left";
        }else if (playerDirection == "right"){
            gunDirection = "right";
        }else if (playerDirection == "back"){
            gunDirection = playerAimingAngleRAD < toRadians(90) ? "right" : "left";
        }

        // Change angle if left gun image
        if (gunDirection == "left"){
            playerAimingAngleRAD -= Math.PI;
        }
        let flipped = gunDirection == "left";
        let xOfHand = playerLeftX + WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][playerDirection]["x_offset"];
        let imageScale = WTL_GAME_DATA["gun_data"][this.model]["image_scale"];
        let xOffsetFromHandToCenter = -1 * WTL_GAME_DATA["gun_data"][this.model]["handle_offset_x"];
        let yOffsetFromHandToCenter = WTL_GAME_DATA["gun_data"][this.model]["handle_offset_y"];
        
        let xOfHandToCenterX = Math.cos(playerAimingAngleRAD) * (xOffsetFromHandToCenter * (flipped ? -1 : 1)) + Math.sin(playerAimingAngleRAD) * yOffsetFromHandToCenter;
        let x = xOfHand + xOfHandToCenterX * imageScale;
        let endOfBarrelXOffset = WTL_GAME_DATA["gun_data"][this.model]["end_of_barrel_offset"]["x_offset"] * imageScale;
        let endOfBarrelYOffset = WTL_GAME_DATA["gun_data"][this.model]["end_of_barrel_offset"]["y_offset"] * imageScale;
        result["x"] = Math.cos(playerAimingAngleRAD) * (endOfBarrelXOffset * (flipped ? -1 : 1)) - Math.sin(playerAimingAngleRAD) * endOfBarrelYOffset + x;

        let yOfHand = playerTopY - WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][playerDirection]["y_offset"];
        let yOfHandToCenterY = Math.sin(playerAimingAngleRAD) * (xOffsetFromHandToCenter * (flipped ? -1 : 1)) + Math.cos(playerAimingAngleRAD) * -1 * yOffsetFromHandToCenter;
        let y = yOfHand + yOfHandToCenterY * imageScale;
        result["y"] = Math.sin(playerAimingAngleRAD) * (endOfBarrelXOffset * (flipped ? -1 : 1)) + Math.cos(playerAimingAngleRAD) * endOfBarrelYOffset + y;
        return result;
    }

    /*
        Method Name: resetDecisions
        Method Parameters: None
        Method Description: Resets pistol decisions
        Method Return: void
    */
    resetDecisions(){
        this.player.amendDecisions({
            "trying_to_aim": false,
            "trying_to_shoot": false,
            "trying_to_reload": false,
            "aiming_angle_rad": null,
            "cancel_reload": false
        });
    }

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Takes actions based on decisions
        Method Return: void
    */
    actOnDecisions(){
        let tryingToShoot = this.getDecision("trying_to_shoot");
        if (this.isAiming() && tryingToShoot && this.isLoaded()){
            this.shoot();
        }

        let tryingToReload = this.getDecision("trying_to_reload");
        if (tryingToReload && !this.isLoaded() && !this.player.isMoving() && !this.isReloading()){
            this.reload();
        }else if (this.isReloading() && this.getDecision("cancel_reload")){
            this.cancelReload();
        }
    }

    /*
        Method Name: deselect
        Method Parameters: None
        Method Description: Handles actions on weapon deselect
        Method Return: void
    */
    deselect(){
        if (this.isReloading()){
            this.cancelReload();
        }
    }

    /*
        Method Name: displayItemSlot
        Method Parameters: 
            providedX:
                The x of the item slot
            providedY:
                The y of the item slot
        Method Description: Displays in the hotbar
        Method Return: void
    */
    displayItemSlot(providedX, providedY){
        let image = IMAGES[this.model];
        let displayScale = WTL_GAME_DATA["inventory"]["slot_size"] / image.width;
        let scaleX = providedX + image.width / 2 * displayScale;
        let scaleY = providedY + image.height / 2 * displayScale;

        translate(scaleX, scaleY);

        if (!this.isLoaded()){
            rotate(toRadians(-90));
        }

        scale(displayScale, displayScale);

        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);

        scale(1 / displayScale, 1 / displayScale);

        if (!this.isLoaded()){
            rotate(toFixedRadians(90));
        }

        translate(-1 * scaleX, -1 * scaleY);

        if (this.isReloading()){
            let timePassedTick = (this.reloadLock.getCooldown() - this.reloadLock.getTicksLeft()) * WTL_GAME_DATA["general"]["ms_between_ticks"];
            let timePassedNonTick = FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime();
            let totalTimePassedMS = timePassedTick + timePassedNonTick;
            let proportion = totalTimePassedMS / WTL_GAME_DATA["gun_data"][this.model]["reload_time_ms"];
            proportion = Math.min(1, Math.max(0, proportion));
            let height = Math.round(WTL_GAME_DATA["inventory"]["slot_size"] * proportion);
            let colour = Colour.fromCode(WTL_GAME_DATA["inventory"]["hotbar_selected_item_outline_colour"]);
            colour.setAlpha(0.5);
            let slotSize = WTL_GAME_DATA["inventory"]["slot_size"];
            let y = providedY + slotSize - height;
            noStrokeRectangle(colour, providedX, y, slotSize, height);
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick processes
        Method Return: void
    */
    tick(){
        super.tick();
        // Removed 2025-01-10 this.resetDecisions();
        if (this.isReloading()){
            if (this.player.isMoving()){
                this.cancelReload();
            }else{
                this.reloadLock.tick();
                if (this.reloadLock.isUnlocked()){
                    this.reloading = false;
                    this.loaded = true;
                }
            }
        }
    }

    /*
        Method Name: getEndOfGunX
        Method Parameters: None
        Method Description: Determine the x location of the gun's end
        Method Return: float
    */
    getEndOfGunX(){
        let playerDirection = this.player.getFacingDirection();
        let playerAimingAngleRAD = this.getSwayedAngleRAD();
        let gunDirection;

        // Determine if using the right gun image or left gun image
        if (playerDirection == "front"){
            gunDirection = playerAimingAngleRAD > toRadians(270) ? "right" : "left";
        }else if (playerDirection == "left"){
            gunDirection = "left";
        }else if (playerDirection == "right"){
            gunDirection = "right";
        }else if (playerDirection == "back"){
            gunDirection = playerAimingAngleRAD < toRadians(90) ? "right" : "left";
        }

        // Change angle if left gun image
        if (gunDirection == "left"){
            playerAimingAngleRAD -= Math.PI;
        }
        let flipped = gunDirection == "left";
        let xOfHand = this.player.getInterpolatedTickX() + WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][this.player.getFacingDirection()]["x_offset"];
        let imageScale = WTL_GAME_DATA["gun_data"][this.model]["image_scale"];
        let xOffsetFromHandToCenter = -1 * WTL_GAME_DATA["gun_data"][this.model]["handle_offset_x"];
        let yOffsetFromHandToCenter = WTL_GAME_DATA["gun_data"][this.model]["handle_offset_y"];
        let xOfHandToCenterX = Math.cos(playerAimingAngleRAD) * (xOffsetFromHandToCenter * (flipped ? -1 : 1)) + Math.sin(playerAimingAngleRAD) * yOffsetFromHandToCenter;
        let x = xOfHand + xOfHandToCenterX * imageScale;
        let endOfBarrelXOffset = WTL_GAME_DATA["gun_data"][this.model]["end_of_barrel_offset"]["x_offset"] * imageScale;
        let endOfBarrelYOffset = WTL_GAME_DATA["gun_data"][this.model]["end_of_barrel_offset"]["y_offset"] * imageScale;
        return Math.cos(playerAimingAngleRAD) * (endOfBarrelXOffset * (flipped ? -1 : 1)) - Math.sin(playerAimingAngleRAD) * endOfBarrelYOffset + x;

    }

    /*
        Method Name: getEndOfGunY
        Method Parameters: None
        Method Description: Determine the y location of the gun's end
        Method Return: float
    */
    getEndOfGunY(){
        let playerDirection = this.player.getFacingDirection();
        let playerAimingAngleRAD = this.getSwayedAngleRAD();
        let gunDirection;

        // Determine if using the right gun image or left gun image
        if (playerDirection == "front"){
            gunDirection = playerAimingAngleRAD > toRadians(270) ? "right" : "left";
        }else if (playerDirection == "left"){
            gunDirection = "left";
        }else if (playerDirection == "right"){
            gunDirection = "right";
        }else if (playerDirection == "back"){
            gunDirection = playerAimingAngleRAD < toRadians(90) ? "right" : "left";
        }

        // Change angle if left gun image
        if (gunDirection == "left"){
            playerAimingAngleRAD -= Math.PI;
        }

        let flipped = gunDirection == "left";
        let yOfHand = this.player.getInterpolatedTickY() - WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][this.player.getFacingDirection()]["y_offset"];
        let imageScale = WTL_GAME_DATA["gun_data"][this.model]["image_scale"];
        let xOffsetFromHandToCenter = -1 * WTL_GAME_DATA["gun_data"][this.model]["handle_offset_x"];
        let yOffsetFromHandToCenter = -1 * WTL_GAME_DATA["gun_data"][this.model]["handle_offset_y"];
        let yOfHandToCenterY = Math.sin(playerAimingAngleRAD) * (xOffsetFromHandToCenter * (flipped ? -1 : 1)) + Math.cos(playerAimingAngleRAD) * yOffsetFromHandToCenter;
        let y = yOfHand + yOfHandToCenterY * imageScale;
        let endOfBarrelXOffset = WTL_GAME_DATA["gun_data"][this.model]["end_of_barrel_offset"]["x_offset"] * imageScale;
        let endOfBarrelYOffset = WTL_GAME_DATA["gun_data"][this.model]["end_of_barrel_offset"]["y_offset"] * imageScale;
        return Math.sin(playerAimingAngleRAD) * (endOfBarrelXOffset * (flipped ? -1 : 1)) + Math.cos(playerAimingAngleRAD) * endOfBarrelYOffset + y;
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x coordinate of the left side of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Displays the gun
        Method Return: void
    */
    display(lX, bY){
        let x = this.getImageX(lX);
        let y = this.getImageY(bY);
        let playerDirection = this.player.getFacingDirection();
        let isAiming = this.isAiming();

        let image = IMAGES[this.model];
        let displayRotateAngleRAD;
        let playerAimingAngleRAD = this.getSwayedAngleRAD();
        let playerAimingAngleDEG = toFixedDegrees(playerAimingAngleRAD);
        let readyRotationDEG = WTL_GAME_DATA["model_positions"]["holding_rotation"];
        let flipDirection = 1;

        // Based on player action
        if (isAiming){
            if (playerDirection == "front"){
                flipDirection = (playerAimingAngleDEG > 270) ? 1 : -1;
                displayRotateAngleRAD = fixRadians(playerAimingAngleRAD + ((flipDirection > 0) ? 0 : Math.PI));
            }else if (playerDirection == "left"){
                flipDirection = -1;
                displayRotateAngleRAD = playerAimingAngleRAD + Math.PI;
            }else if (playerDirection == "right"){
                displayRotateAngleRAD = playerAimingAngleRAD;
            }else if (playerDirection == "back"){
                flipDirection = (playerAimingAngleDEG < 90) ? 1 : -1;
                displayRotateAngleRAD = fixRadians(playerAimingAngleRAD + ((flipDirection > 0) ? 0 : Math.PI));
            }
        }else{ // Normal
            if (playerDirection == "front" || playerDirection == "right"){
                if (this.isReloading()){
                    displayRotateAngleRAD = toFixedRadians(90);
                }else{
                    displayRotateAngleRAD = toRadians(readyRotationDEG);
                }
            }else if (playerDirection == "back" || playerDirection == "left"){
                flipDirection = -1;
                if (this.isReloading()){
                    displayRotateAngleRAD = toFixedRadians(-90);
                }else{
                    displayRotateAngleRAD = toRadians(-1 * readyRotationDEG);
                }
            }
        }

        let imageScale = WTL_GAME_DATA["gun_data"][this.model]["image_scale"];
        let effectiveScale = gameZoom * imageScale;
        let flipped = flipDirection < 0;
        let realImageWidth = WTL_GAME_DATA["gun_data"][this.model]["image_width"];
        let realImageHeight = WTL_GAME_DATA["gun_data"][this.model]["image_height"];

        let handleOffsetX = Math.cos(displayRotateAngleRAD) * (WTL_GAME_DATA["gun_data"][this.model]["handle_offset_x"] * (flipped ? -1 : 1)) - Math.sin(displayRotateAngleRAD) * WTL_GAME_DATA["gun_data"][this.model]["handle_offset_y"];
        let handleOffsetY = Math.sin(displayRotateAngleRAD) * (WTL_GAME_DATA["gun_data"][this.model]["handle_offset_x"] * (flipped ? -1 : 1)) + Math.cos(displayRotateAngleRAD) * WTL_GAME_DATA["gun_data"][this.model]["handle_offset_y"];

        let rotateX = x - handleOffsetX * effectiveScale;
        let rotateY = y + handleOffsetY * effectiveScale;

        // Display Pistol
        translate(rotateX, rotateY);
        rotate(-1 * displayRotateAngleRAD);

        scale(flipDirection, 1);
        
        // Game zoom
        scale(effectiveScale, effectiveScale);

        // Display
        drawingContext.drawImage(image, 0 - realImageWidth / 2, 0 - realImageHeight / 2);

        // Game zoom
        scale(1 / effectiveScale, 1 / effectiveScale);
        scale(flipDirection, 1);

        rotate(displayRotateAngleRAD);
        translate(-1 * rotateX, -1 * rotateY);
    }

    /*
        Method Name: getImageX
        Method Parameters: 
            lX:
                The x coordinate of the left side of the screen
        Method Description: Determines the x position of the gun image when displaying
        Method Return: number
    */
    getImageX(lX){
        let x = this.player.getDisplayX(lX);
        return x + WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][this.player.getFacingDirection()]["x_offset"] * gameZoom - this.player.getWidth()/2 * gameZoom;
    }

    /*
        Method Name: getImageY
        Method Parameters: 
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Determines the y position of the gun image when displaying
        Method Return: number
    */
    getImageY(bY){
        let y = this.player.getDisplayY(bY);
        return y + WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][this.player.getFacingDirection()]["y_offset"] * gameZoom - this.player.getHeight()/2 * gameZoom;
    }

    /*
        Method Name: loadAllImagesOfModel
        Method Parameters: 
            model:
                A gun model (string)
        Method Description: Loads all pictures of a gun model
        Method Return: Promise (implicit)
    */
    static async loadAllImagesOfModel(model){
        // Do not load if already exists
        if (objectHasKey(IMAGES, model)){ return; }
        let folderURL = "item/weapon/gun/pistol/";
        if (objectHasKey(WTL_GAME_DATA["gun_data"][model], "alternate_url")){
            folderURL = WTL_GAME_DATA["gun_data"][model]["alternate_url"];
        }
        folderURL += model + "/";
        await loadToImages(model, folderURL);
    }

    /*
        Method Name: loadAllImages
        Method Parameters: None
        Method Description: Loads all images of a pistol
        Method Return: Promise (implicit)
    */
    static async loadAllImages(){
        for (let gunModel of Object.keys(WTL_GAME_DATA["gun_data"])){
            if (WTL_GAME_DATA["gun_data"][gunModel]["type"] != "pistol"){ continue; }
            await Pistol.loadAllImagesOfModel(gunModel);
        }
    }
}