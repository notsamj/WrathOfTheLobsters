class Musket extends Gun {
    constructor(model, details){
        super(model, details);
        this.bayonetOn = false;
        
        this.stabbing = false;
        this.stabLock = new TickLock(WTL_GAME_DATA["gun_data"][this.model]["stab_time_ms"] / WTL_GAME_DATA["general"]["ms_between_ticks"]);
        this.stabAngle = null; // value doesn't matter
        this.stabFacing = null;
    }

    resetDecisions(){
        this.player.amendDecisions({
            "trying_to_aim": false,
            "trying_to_shoot": false,
            "trying_to_reload": false,
            "toggling_bayonet_equip": false,
            "trying_to_stab": false,
            "aiming_angle_rad": null
        });
    }

    makeDecisions(){
        this.player.makeMusketDecisions();
    }

    actOnDecisions(){
        let tryingToShoot = this.getDecision("trying_to_shoot");
        if (this.isAiming() && tryingToShoot && this.isLoaded() && !this.isStabbing() && !this.player.isMoving()){
            this.shoot();
        }

        let togglingBayonetEquip = this.getDecision("toggling_bayonet_equip");
        if (!this.isAiming() && togglingBayonetEquip && !this.player.isMoving() && !this.isStabbing()){
            if (this.hasBayonetEquipped()){
                this.unequipBayonet();
            }else{
                this.equipBayonet();
            }
        }

        let tryingToReload = this.getDecision("trying_to_reload");
        if (tryingToReload && !this.isLoaded() && !this.player.isMoving() && !this.isStabbing() && !this.isReloading()){
            this.reload();
        }

        let tryingToStab = this.getDecision("trying_to_stab");
        if (this.isAiming() && tryingToStab && !this.isReloading() && this.hasBayonetEquipped() && !this.isStabbing() && this.getPlayer().getStaminaBar().hasStamina()){
            this.startStab();
        }
    }

    startStab(){
        this.stabbing = true;
        this.stabAngle = this.getDecidedAngleRAD();
        this.stabFacing = this.player.getFacingDirection();
        this.stabLock.resetAndLock();
        this.getPlayer().getStaminaBar().useStamina(WTL_GAME_DATA["gun_data"][this.getModel()]["stamina_usage_for_stab"]);
    }

    finishStab(){
        this.stabbing = false;
        // Calculate what it hit
        let myID = this.player.getID();
        let collision = this.getScene().findInstantCollisionForProjectile(this.getEndOfGunX(), this.getEndOfGunY(), this.stabAngle, WTL_GAME_DATA["gun_data"][this.model]["stab_range"], (enemy) => { return enemy.getID() === myID; });
        // If it hits an entity
        if (collision["collision_type"] === "entity"){
            collision["entity"].getStabbed(this);
            collision["entity"].stun(Math.ceil(WTL_GAME_DATA["gun_data"][this.getModel()]["stab_stun_time_ms"] / WTL_GAME_DATA["general"]["ms_between_ticks"]));
            // Play sound
            this.getGamemode().getEventHandler().emit({
                "name": "stab",
                "associated_sound_name": "slashing",
                "x": collision["x"],
                "y": collision["y"]
            });
        }
        // If it hits a physical tile or nothing then create bullet collision particle
        else if (collision["collision_type"] === null || collision["collision_type"] === "physical_tile"){
            // If the shot didn't hit anything alive then show particles when it hit
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }
    }

    getStabAngle(){
        return this.stabAngle;
    }

    isStabbing(){
        return this.stabbing;
    }

    cancelStab(){
        this.stabbing = false;
    }

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
            let timePassedNonTick = FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime();
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

    getWidth(){
        return WTL_GAME_DATA["general"]["tile_size"];
    }

    getHeight(){
        return WTL_GAME_DATA["general"]["tile_size"];
    }

    isAiming(){
        return this.getDecision("trying_to_aim") && this.directionToAimIsOk() && !this.isReloading() && !this.isStabbing();
    }

    tick(){
        super.tick();
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
            if (this.player.getFacingDirection() != this.stabFacing){
                this.cancelStab();
            }else{
                this.stabLock.tick();
                if (this.stabLock.isUnlocked()){
                    this.finishStab();   
                }
            }
        }
    }

    getSimulatedGunEndPosition(playerLeftX, playerTopY, playerDirection, playerAimingAngleRAD){
        let result = {};
        // Get tile x of player (player not moving)
        let x = playerLeftX;
         // From top left to center of the player model
        x += WTL_GAME_DATA["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        x += WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model]["aiming"][playerDirection]["x_offset"];

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

        let endOfBarrelXOffset = WTL_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["x_offset"];
        let endOfBarrelYOffset = WTL_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["y_offset"];
        result["x"] = Math.cos(playerAimingAngleRAD) * endOfBarrelXOffset - Math.sin(playerAimingAngleRAD) * endOfBarrelYOffset + x;

        // Get tile y of player (player not moving)
        let y = playerTopY;
        // From top left to center of the player model
        y -= WTL_GAME_DATA["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        y += WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model]["aiming"][playerDirection]["y_offset"] * -1

        // This should be the center of the musket image?
        result["y"] = Math.sin(playerAimingAngleRAD) * endOfBarrelXOffset + Math.cos(playerAimingAngleRAD) * endOfBarrelYOffset + y;
        return result;
    }

    getEndOfGunX(){
        // Get tile x of player (player not moving)
        let x = this.getScene().getXOfTile(this.player.getTileX());
         // From top left to center of the player model
        x += WTL_GAME_DATA["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        x += WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model]["aiming"][this.player.getFacingDirection()]["x_offset"];

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

        let endOfBarrelXOffset = WTL_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["x_offset"];
        let endOfBarrelYOffset = WTL_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["y_offset"];
        return Math.cos(playerAimingAngleRAD) * endOfBarrelXOffset - Math.sin(playerAimingAngleRAD) * endOfBarrelYOffset + x;

    }

    getEndOfGunY(){
        // Get tile y of player (player not moving)
        let y = this.getScene().getYOfTile(this.player.getTileY());
        // From top left to center of the player model
        y -= WTL_GAME_DATA["general"]["tile_size"] / 2;
        // Add gun y offset, y is now center of the gun
        y += WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model]["aiming"][this.player.getFacingDirection()]["y_offset"] * -1
        
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

        // This should be the center of the musket image?
        let endOfBarrelXOffset = WTL_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["x_offset"];
        let endOfBarrelYOffset = WTL_GAME_DATA["gun_data"][this.model]["display"][gunDirection]["y_offset"];
        return Math.sin(playerAimingAngleRAD) * endOfBarrelXOffset + Math.cos(playerAimingAngleRAD) * endOfBarrelYOffset + y;
    }

    display(lX, bY){
        let x = this.getImageX(lX);
        let y = this.getImageY(bY);
        let playerDirection = this.player.getFacingDirection();
        let isAiming = this.isAiming();

        let image = null;
        let displayRotateAngleRAD;
        let playerAimingAngleRAD = this.getSwayedAngleRAD();
        let playerAimingAngleDEG = toFixedDegrees(playerAimingAngleRAD);
        let readyRotationDEG = WTL_GAME_DATA["model_positions"]["holding_rotation"];

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

            let timePassedTick = (this.stabLock.getCooldown() - this.stabLock.getTicksLeft()) * WTL_GAME_DATA["general"]["ms_between_ticks"];
            let timePassedNonTick = FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime();
            let totalTimePassedMS = timePassedTick + timePassedNonTick;
            let proportion = totalTimePassedMS / WTL_GAME_DATA["gun_data"][this.model]["stab_time_ms"];
            proportion = Math.min(1, Math.max(0, proportion));
            let hypotenuse = WTL_GAME_DATA["gun_data"][this.model]["stab_range"] * proportion;
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
                    displayRotateAngleRAD = toRadians(readyRotationDEG);
                }
            }else if (playerDirection == "back" || playerDirection == "left"){
                image = IMAGES[this.model + "_left" + (this.hasBayonetEquipped() ? "_bayonet" : "")];
                if (this.isReloading()){
                    displayRotateAngleRAD = toFixedRadians(-90);
                }else{
                    displayRotateAngleRAD = toRadians(-1 * readyRotationDEG);
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
        if (isAiming && this.player.isHuman()){
            this.drawCrosshair(lX, bY);
        }
    }

    getImageX(lX){
        let x = this.player.getDisplayX(lX);
        return x + WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][this.isAiming() ? "aiming" : "not_aiming"][this.player.getFacingDirection()]["x_offset"] * gameZoom - this.player.getWidth()/2 * gameZoom;
    }

    getImageY(bY){
        let y = this.player.getDisplayY(bY);
        return y + WTL_GAME_DATA["model_positions"][this.player.getModelCategory()][this.model][this.isAiming() ? "aiming" : "not_aiming"][this.player.getFacingDirection()]["y_offset"] * gameZoom - this.player.getHeight()/2 * gameZoom;
    }

    static async loadAllImagesOfModel(model){
        // Do not load if already exists
        if (objectHasKey(IMAGES, model + "_left")){ return; }
        let folderURL = "item/weapon/gun/musket/";
        if (objectHasKey(WTL_GAME_DATA["gun_data"][model], "alternate_url")){
            folderURL = WTL_GAME_DATA["gun_data"][model]["alternate_url"];
        }
        folderURL += model + "/";
        await loadToImages(model + "_left", folderURL);
        await loadToImages(model + "_left" + "_bayonet", folderURL);
        await loadToImages(model + "_right", folderURL);
        await loadToImages(model + "_right" + "_bayonet", folderURL);
    }

    static async loadAllImages(){
        for (let gunModel of Object.keys(WTL_GAME_DATA["gun_data"])){
            if (WTL_GAME_DATA["gun_data"][gunModel]["type"] != "musket"){ continue; }
            await Musket.loadAllImagesOfModel(gunModel);
        }
    }
}