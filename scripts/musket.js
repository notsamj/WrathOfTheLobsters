class Musket {
    constructor(model, details){
        this.model = model;
        this.tryingToAim = false;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.reloaded = true;
    }

    getWidth(){
        return PROGRAM_SETTINGS["general"]["tile_size"];
    }

    getHeight(){
        return PROGRAM_SETTINGS["general"]["tile_size"];
    }

    // Abstract
    tick(){}

    getEndOfGunX(){
        let debug = {};
        // Get tile x of player (player not moving)
        let x = SCENE.getXOfTile(this.player.getTileX());
         // From top left to center of the player model
        x += PROGRAM_SETTINGS["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        x += PROGRAM_SETTINGS["model_positions"][this.player.getModel()][this.model]["aiming"][this.player.getFacingDirection()]["x_offset"];

        let playerDirection = this.player.getFacingDirection();
        let playerAimingAngleRAD = this.getAngleRAD();
        let playerAimingAngleDEG = toFixedDegrees(playerAimingAngleRAD);
        let gunDirection;

        // Determine if using the right gun image or left gun image
        if (playerDirection == "front"){
            gunDirection = playerAimingAngleDEG > 270 ? "right" : "left";
        }else if (playerDirection == "left"){
            gunDirection = "left";
        }else if (playerDirection == "right"){
            gunDirection = "right";
        }else if (playerDirection == "back"){
            gunDirection = playerAimingAngleDEG < 90 ? "right" : "left";
        }

        // Change angle if left gun image
        if (gunDirection == "left"){
            playerAimingAngleRAD -= Math.PI;
        }

        let endOfBarrelXOffset = PROGRAM_SETTINGS["gun_data"][this.model]["display"][gunDirection]["x_offset"];
        let endOfBarrelYOffset = PROGRAM_SETTINGS["gun_data"][this.model]["display"][gunDirection]["y_offset"];
        return Math.cos(playerAimingAngleRAD) * endOfBarrelXOffset - Math.sin(playerAimingAngleRAD) * endOfBarrelYOffset + x;

    }

    getEndOfGunY(){
        let debug = {};
        // Get tile y of player (player not moving)
        let y = SCENE.getYOfTile(this.player.getTileY());
        // From top left to center of the player model
        y -= PROGRAM_SETTINGS["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        y += PROGRAM_SETTINGS["model_positions"][this.player.getModel()][this.model]["aiming"][this.player.getFacingDirection()]["y_offset"] * -1
        
        let playerDirection = this.player.getFacingDirection();
        let playerAimingAngleRAD = this.getAngleRAD();
        let playerAimingAngleDEG = toFixedDegrees(playerAimingAngleRAD);
        let gunDirection;

        // Determine if using the right gun image or left gun image
        if (playerDirection == "front"){
            gunDirection = playerAimingAngleDEG > 270 ? "right" : "left";
        }else if (playerDirection == "left"){
            gunDirection = "left";
        }else if (playerDirection == "right"){
            gunDirection = "right";
        }else if (playerDirection == "back"){
            gunDirection = playerAimingAngleDEG < 90 ? "right" : "left";
        }

        // Change angle if left gun image
        if (gunDirection == "left"){
            playerAimingAngleRAD -= Math.PI;
        }

        // This should be the center of the musket image?
        let endOfBarrelXOffset = PROGRAM_SETTINGS["gun_data"][this.model]["display"][gunDirection]["x_offset"];
        let endOfBarrelYOffset = PROGRAM_SETTINGS["gun_data"][this.model]["display"][gunDirection]["y_offset"];
        return Math.sin(playerAimingAngleRAD) * endOfBarrelXOffset + Math.cos(playerAimingAngleRAD) * endOfBarrelYOffset + y;
    }

    shoot(){
        // Add smoke where gun is shot
        SCENE.addExpiringVisual(SmokeCloud.create(this.getEndOfGunX(), this.getEndOfGunY()));
    }

    isReloaded(){
        return this.reloaded;
    }

    isAiming(){
        return this.tryingToAim && this.directionToAimIsOk() && !this.player.isMoving();
    }

    directionToAimIsOk(){
        let angleTryingToAimAtDEG = this.getAngleDEG();
        let playerDirection = this.player.getFacingDirection();
        if (playerDirection == "front"){
            return angleTryingToAimAtDEG > 180 && angleTryingToAimAtDEG <= 359;
        }else if (playerDirection == "left"){
            return angleTryingToAimAtDEG > 90 && angleTryingToAimAtDEG < 270;
        }else if (playerDirection == "right"){
            return (angleTryingToAimAtDEG > 270 && angleTryingToAimAtDEG < 360) || (angleTryingToAimAtDEG >= 0 && angleTryingToAimAtDEG < 90);
        }else if (playerDirection == "back"){
            return angleTryingToAimAtDEG > 0 && angleTryingToAimAtDEG < 180;
        }
        throw new Error(`Invalid player direction: ${playerDirection}`);
    }

    getAngleDEG(){
        return toFixedDegrees(this.getAngleRAD());
    }

    getAngleRAD(){
        let x = window.mouseX;
        let y = SCENE.changeFromScreenY(window.mouseY);
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
        return angleRAD;
    }

    display(lX, bY){
        let x = this.getImageX(lX);
        let y = this.getImageY(bY);
        //console.log(x - 32, "displaygunmiddlex")
        let playerDirection = this.player.getFacingDirection();
        let isAiming = this.isAiming();

        let image = null;
        let displayRotateAngleRAD;
        let playerAimingAngleRAD = this.getAngleRAD();
        let playerAimingAngleDEG = toFixedDegrees(playerAimingAngleRAD);
        let atTheReady = PROGRAM_SETTINGS["model_positions"]["at_the_ready_rotation"];
        if (isAiming){
            if (playerDirection == "front"){
                image = playerAimingAngleDEG > 270 ? IMAGES[this.model + "_right_64"] : IMAGES[this.model + "_left_64"];
                displayRotateAngleRAD = playerAimingAngleRAD + (playerAimingAngleDEG > 270 ? 0 : Math.PI);
            }else if (playerDirection == "left"){
                image = IMAGES[this.model + "_left_64"];
                displayRotateAngleRAD = playerAimingAngleRAD + Math.PI;
            }else if (playerDirection == "right"){
                image = IMAGES[this.model + "_right_64"];
                displayRotateAngleRAD = playerAimingAngleRAD;
            }else if (playerDirection == "back"){
                image = playerAimingAngleDEG < 90 ? IMAGES[this.model + "_right_64"] : IMAGES[this.model + "_left_64"];
                displayRotateAngleRAD = playerAimingAngleRAD + (playerAimingAngleDEG < 90 ? 0 : Math.PI);
            }
        }else{
            if (playerDirection == "front" || playerDirection == "right"){
                image = IMAGES[this.model + "_right_64"];
                displayRotateAngleRAD = toRadians(atTheReady);
            }else if (playerDirection == "back" || playerDirection == "left"){
                image = IMAGES[this.model + "_left_64"];
                displayRotateAngleRAD = toRadians(-1 * atTheReady);
            }
        }

        let rotateX = x + image.width / 2;
        let rotateY = y + image.height / 2;

        // Display Musket
        translate(rotateX, rotateY);
        rotate(-1 * displayRotateAngleRAD);
        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);
        rotate(displayRotateAngleRAD);
        translate(-1 * rotateX, -1 * rotateY);

        // Display Crosshair if aiming
        if (isAiming){
            drawCrosshair();
        }
    }

    getImageX(lX){
        let x = this.player.getDisplayX(lX);
        return x + PROGRAM_SETTINGS["model_positions"][this.player.getModel()][this.model][this.isAiming() ? "aiming" : "not_aiming"][this.player.getFacingDirection()]["x_offset"];
    }

    getImageY(bY){
        let y = this.player.getDisplayY(bY);
        return y + PROGRAM_SETTINGS["model_positions"][this.player.getModel()][this.model][this.isAiming() ? "aiming" : "not_aiming"][this.player.getFacingDirection()]["y_offset"];
    }

    static async loadAllImages(model){
        // Do not load if already exists
        if (objectHasKey(IMAGES, model + "_left_64")){ return; }
        await loadToImages(model + "_left" + "_64", model + "/");
        await loadToImages(model + "_right" + "_64", model + "/");
    }
}