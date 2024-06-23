class Musket {
    constructor(model, details){
        this.model = model;
        this.tryingToAim = false;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.reloaded = true;
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES[this.model + "_right_64"];
        let displayScale = RETRO_GAME_DATA["inventory"]["slot_size"] / image.width;
        let scaleX = providedX + image.width / 2 * displayScale;
        let scaleY = providedY + image.height / 2 * displayScale;

        translate(scaleX, scaleY);

        scale(displayScale, displayScale);

        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);

        scale(1 / displayScale, 1 / displayScale);

        translate(-1 * scaleX, -1 * scaleY);

        // TODO: Different when reloading?
    }

    getModel(){
        return this.model;
    }

    getWidth(){
        return RETRO_GAME_DATA["general"]["tile_size"];
    }

    getHeight(){
        return RETRO_GAME_DATA["general"]["tile_size"];
    }

    getScene(){
        return this.player.getScene();
    }

    // Abstract
    tick(){}

    getEndOfGunX(){
        // Get tile x of player (player not moving)
        let x = this.getScene().getXOfTile(this.player.getTileX());
         // From top left to center of the player model
        x += RETRO_GAME_DATA["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        x += RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model]["aiming"][this.player.getFacingDirection()]["x_offset"];

        let playerDirection = this.player.getFacingDirection();
        let playerAimingAngleRAD = this.getAngleRAD();
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

        let endOfBarrelXOffset = RETRO_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["x_offset"];
        let endOfBarrelYOffset = RETRO_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["y_offset"];
        return Math.cos(playerAimingAngleRAD) * endOfBarrelXOffset - Math.sin(playerAimingAngleRAD) * endOfBarrelYOffset + x;

    }

    getEndOfGunY(){
        // Get tile y of player (player not moving)
        let y = this.getScene().getYOfTile(this.player.getTileY());
        // From top left to center of the player model
        y -= RETRO_GAME_DATA["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        y += RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model]["aiming"][this.player.getFacingDirection()]["y_offset"] * -1
        
        let playerDirection = this.player.getFacingDirection();
        let playerAimingAngleRAD = this.getAngleRAD();
        let playerAimingAngleDEG = toFixedDegrees(playerAimingAngleRAD);
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

        // This should be the center of the musket image?
        let endOfBarrelXOffset = RETRO_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["x_offset"];
        let endOfBarrelYOffset = RETRO_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["y_offset"];
        return Math.sin(playerAimingAngleRAD) * endOfBarrelXOffset + Math.cos(playerAimingAngleRAD) * endOfBarrelYOffset + y;
    }

    getBulletRange(){
        return RETRO_GAME_DATA["gun_data"][this.getModel()]["range"];
    }

    shoot(){
        // Add smoke where gun is shot
        this.getScene().addExpiringVisual(SmokeCloud.create(this.getEndOfGunX(), this.getEndOfGunY()));
        // Try to kill whenever is there
        let angleRAD = this.getAngleRAD();
        let range = this.getBulletRange();
        let myID = this.player.getID();
        let collision = this.getScene().findInstantCollisionForProjectile(this.getEndOfGunX(), this.getEndOfGunY(), angleRAD, range, (enemy) => { return enemy.getID() == myID; });
        //console.log(collision)
        // If it hits an entity
        if (collision["collision_type"] == "entity"){
            collision["entity"].getShot(this.getModel());
        }
        // If it hits a physical tile or nothing then create bullet collision particle
        else if (collision["collision_type"] == null || collision["collision_type"] == "physical_tile"){
            // If the shot didn't hit anything alive then show particles when it hit
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }

    }

    isReloaded(){
        return this.reloaded;
    }

    isAiming(){
        return this.tryingToAim && this.directionToAimIsOk() && !this.player.isMoving();
    }

    directionToAimIsOk(){
        let angleTryingToAimAtDEG = toFixedDegrees(this.getAngleRAD());
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
        let atTheReady = RETRO_GAME_DATA["model_positions"]["at_the_ready_rotation"];
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

        let rotateX = x + image.width / 2 * gameZoom;
        let rotateY = y + image.height / 2 * gameZoom;

        // Display Musket
        translate(rotateX, rotateY);
        rotate(-1 * displayRotateAngleRAD);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        rotate(displayRotateAngleRAD);
        translate(-1 * rotateX, -1 * rotateY);

        // Display Crosshair if aiming
        if (isAiming){
            drawCrosshair();
        }
    }

    getImageX(lX){
        let x = this.player.getDisplayX(lX);
        return x + RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model][this.isAiming() ? "aiming" : "not_aiming"][this.player.getFacingDirection()]["x_offset"] * gameZoom - this.player.getWidth()/2 * gameZoom;
    }

    getImageY(bY){
        let y = this.player.getDisplayY(bY);
        return y + RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model][this.isAiming() ? "aiming" : "not_aiming"][this.player.getFacingDirection()]["y_offset"] * gameZoom - this.player.getHeight()/2 * gameZoom;
    }

    static async loadAllImages(model){
        // Do not load if already exists
        if (objectHasKey(IMAGES, model + "_left_64")){ return; }
        await loadToImages(model + "_left" + "_64", model + "/");
        await loadToImages(model + "_right" + "_64", model + "/");
    }
}