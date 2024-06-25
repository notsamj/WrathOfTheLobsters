class Musket {
    constructor(model, details){
        this.model = model;
        this.tryingToAim = false;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.loaded = true;
        this.bayonetOn = false;
        
        this.reloading = false;
        this.reloadLock = new TickLock(RETRO_GAME_DATA["gun_data"][this.model]["reload_time_ms"] / RETRO_GAME_DATA["general"]["ms_between_ticks"]);
        
        this.stabbing = false;
        this.stabLock = new TickLock(RETRO_GAME_DATA["gun_data"][this.model]["stab_time_ms"] / RETRO_GAME_DATA["general"]["ms_between_ticks"]);
        this.stabAngle = null; // value doesn't matter
        this.stabFacing = null;
    }

    startStab(){
        this.stabbing = true;
        this.stabAngle = this.getAngleRAD();
        this.stabFacing = this.player.getFacingDirection();
        this.stabLock.resetAndLock();
    }

    finishStab(){
        this.stabbing = false;
        // Calculate what it hit
        let myID = this.player.getID();
        let collision = this.getScene().findInstantCollisionForProjectile(this.getEndOfGunX(), this.getEndOfGunY(), this.stabAngle, RETRO_GAME_DATA["gun_data"][this.model]["stab_range"], (enemy) => { return enemy.getID() == myID; });
        // If it hits an entity
        if (collision["collision_type"] == "entity"){
            collision["entity"].getStabbed(this.getModel());
        }
        // If it hits a physical tile or nothing then create bullet collision particle
        else if (collision["collision_type"] == null || collision["collision_type"] == "physical_tile"){
            // If the shot didn't hit anything alive then show particles when it hit
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }
    }

    reload(){
        this.reloading = true;
        this.reloadLock.resetAndLock();
    }

    isReloading(){
        return this.reloading;
    }

    isStabbing(){
        return this.stabbing;
    }

    cancelStab(){
        this.stabbing = false;
    }

    cancelReload(){
        this.reloading = false;
    }

    select(){}
    deselect(){
        if (this.isReloading()){
            this.cancelReload();
        }else if (this.isStabbing()){
            this.cancelStab();
        }
    }

    equipBayonet(){
        this.bayonetOn = true;
    }

    unequipBayonet(){
        this.bayonetOn = false;
    }

    hasBayonetEquipped(){
        return this.bayonetOn;
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
        let displayScale = RETRO_GAME_DATA["inventory"]["slot_size"] / image.width;
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
            let timePassedTick = (this.reloadLock.getCooldown() - this.reloadLock.getTicksLeft()) * RETRO_GAME_DATA["general"]["ms_between_ticks"];
            let timePassedNonTick = FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime();
            let totalTimePassedMS = timePassedTick + timePassedNonTick;
            let proportion = totalTimePassedMS / RETRO_GAME_DATA["gun_data"][this.model]["reload_time_ms"];
            proportion = Math.min(1, Math.max(0, proportion));
            let height = Math.round(RETRO_GAME_DATA["inventory"]["slot_size"] * proportion);
            let colour = Colour.fromCode(RETRO_GAME_DATA["inventory"]["hotbar_selected_item_outline_colour"]);
            colour.setAlpha(0.5);
            let slotSize = RETRO_GAME_DATA["inventory"]["slot_size"];
            let y = providedY + slotSize - height;
            noStrokeRectangle(colour, providedX, y, slotSize, height);
        }
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

    tick(){
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
        }else if (this.isStabbing()){
            if (this.player.isMoving() || this.player.getFacingDirection() != this.stabFacing){
                this.cancelStab();
            }else{
                this.stabLock.tick();
                if (this.stabLock.isUnlocked()){
                    this.finishStab();   
                }
            }
        }
    }

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
        // If it hits an entity
        if (collision["collision_type"] == "entity"){
            collision["entity"].getShot(this.getModel());
        }
        // If it hits a physical tile or nothing then create bullet collision particle
        else if (collision["collision_type"] == null || collision["collision_type"] == "physical_tile"){
            // If the shot didn't hit anything alive then show particles when it hit
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }
        this.loaded = false;
    }

    isLoaded(){
        return this.loaded;
    }

    isAiming(){
        return this.tryingToAim && this.directionToAimIsOk() && !this.player.isMoving() && !this.isReloading() && !this.isStabbing();
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
        let playerDirection = this.player.getFacingDirection();
        let isAiming = this.isAiming();

        let image = null;
        let displayRotateAngleRAD;
        let playerAimingAngleRAD = this.getAngleRAD();
        let playerAimingAngleDEG = toFixedDegrees(playerAimingAngleRAD);
        let atTheReady = RETRO_GAME_DATA["model_positions"]["at_the_ready_rotation"];

        // Based on player action
        if (isAiming){
            if (playerDirection == "front"){
                image = playerAimingAngleDEG > 270 ? IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")] : IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = playerAimingAngleRAD + (playerAimingAngleDEG > 270 ? 0 : Math.PI);
            }else if (playerDirection == "left"){
                image = IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = playerAimingAngleRAD + Math.PI;
            }else if (playerDirection == "right"){
                image = IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = playerAimingAngleRAD;
            }else if (playerDirection == "back"){
                image = playerAimingAngleDEG < 90 ? IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")] : IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = playerAimingAngleRAD + (playerAimingAngleDEG < 90 ? 0 : Math.PI);
            }
        }else if (this.isStabbing()){ // Stabbing
            let stabAngleDEG = toDegrees(this.stabAngle);

            if (playerDirection == "front"){
                image = stabAngleDEG > 270 ? IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")] : IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = this.stabAngle + (stabAngleDEG > 270 ? 0 : Math.PI);
            }else if (playerDirection == "left"){
                image = IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = this.stabAngle + Math.PI;
            }else if (playerDirection == "right"){
                image = IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = this.stabAngle;
            }else if (playerDirection == "back"){
                image = stabAngleDEG < 90 ? IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")] : IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                displayRotateAngleRAD = this.stabAngle + (stabAngleDEG < 90 ? 0 : Math.PI);
            }

            let timePassedTick = (this.stabLock.getCooldown() - this.stabLock.getTicksLeft()) * RETRO_GAME_DATA["general"]["ms_between_ticks"];
            let timePassedNonTick = FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime();
            let totalTimePassedMS = timePassedTick + timePassedNonTick;
            let proportion = totalTimePassedMS / RETRO_GAME_DATA["gun_data"][this.model]["stab_time_ms"];
            proportion = Math.min(1, Math.max(0, proportion));
            let hypotenuse = RETRO_GAME_DATA["gun_data"][this.model]["stab_range"] * proportion;
            let stabXDisplacement = Math.cos(this.stabAngle) * hypotenuse;
            let stabYDisplacement = Math.sin(this.stabAngle) * hypotenuse;

            x += stabXDisplacement;
            y -= stabYDisplacement; // Not using game coordinates, using display
        }else{ // Normal
            if (playerDirection == "front" || playerDirection == "right"){
                image = IMAGES[this.model + "_right" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                if (this.isReloading()){
                    displayRotateAngleRAD = toFixedRadians(90);
                }else{
                    displayRotateAngleRAD = toRadians(atTheReady);
                }
            }else if (playerDirection == "back" || playerDirection == "left"){
                image = IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                if (this.isReloading()){
                    displayRotateAngleRAD = toFixedRadians(-90);
                }else{
                    displayRotateAngleRAD = toRadians(-1 * atTheReady);
                }
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
        if (objectHasKey(IMAGES, model + "_left")){ return; }
        await loadToImages(model + "_left", model + "/");
        await loadToImages(model + "_left" + "_bayonet", model + "/");
        await loadToImages(model + "_right", model + "/");
        await loadToImages(model + "_right" + "_bayonet", model + "/");
    }
}