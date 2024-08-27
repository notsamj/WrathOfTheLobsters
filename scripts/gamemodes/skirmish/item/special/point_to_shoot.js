class PointToShoot extends Item {
    constructor(details){
        super(details);
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.crosshairCenterX = 0;
        this.crosshairCenterY = 0;

        this.selectionlastUpdatedTurn = -1;
        this.selectionMadeAtX = 0;
        this.selectionMadeAtY = 0;
        this.selectedTroops = [];
        
        this.resetDecisions();
    }
    getCommandForTroop(troop){
        // Note: We know this troop is selected because it would otherwise not be asking for a command
        let command = {};

        // Make sure troop is facing the proper direction
        let troopCenterX = troop.getInterpolatedTickCenterX();
        let troopCenterY = troop.getInterpolatedTickCenterY();
        let angleToCrosshairRAD = displacementToRadians(this.crosshairCenterX - troopCenterX, this.crosshairCenterY - troopCenterY);
        let directionToFace;
        // If to the right
        if (angleBetweenCCWRAD(toRadians(315), toRadians(45))){
            directionToFace = "right";
        }
        // If up
        else if (angleBetweenCCWRAD(toRadians(45), toRadians(135))){
            directionToFace = "up";
        }
        // If to the left
        else if (angleBetweenCCWRAD(toRadians(135), toRadians(180))){
            directionToFace = "right";
        }
        // Else it must be down
        else{
            directionToFace = "down";
        }

        let currentFacingDirection = troop.getFacingUDLRDirection();
        let facingCorrectDirection = currentFacingDirection == directionToFace;
        
        // If troop is facing the wrong direction, make it face face the correct direction
        if (!facingCorrectDirection){
            command[directionToFace] = true;
        }

        // Make troop equip gun
        let troopInventory = troop.getInventory();
        let selectedItem = troopInventory.getSelectedItem();
        // If they don't have their gun selected
        if (!selectedItem instanceof Gun){
            let items = troopInventory.getItems();
            // Find gun and select it
            for (let i = 0; i < items.length; i++){
                if (item instanceof Gun){
                    troopInventory.setSelectedSlot(i);
                    break;
                }
            }
        }

        // If not ready to start aiming then return current command
        if (!facingCorrectDirection){
            return command;
        }

        // Now we know they are holding a gun
        let gun = troopInventory.getSelectedItem();
        
        // Make troop start aiming in correct direction
        
        // TODO: If troop is aiming at the correct place and officer wants to shoot, tell the troop to shoot
        return command;
    }

    getSelectedTroops(){
        return this.selectedTroops;
    }

    actOnDecisions(){
        if (this.decisions["new_crosshair_center"]){
            this.crosshairCenterX = this.decisions["crosshair_center_x"];
            this.crosshairCenterY = this.decisions["crosshair_center_y"];
        }
        if (this.decisions["trying_to_shoot"]){
            // TODO
        }
    }

    generateSelectedTroops(){
        let allTroopsOnMyTeam = this.getGamemode().getLivingTeamRosterFromName(this.player.getTeamName());
        let myPlayerTileX = this.player.getTileX();
        let myPlayerTileY = this.player.getTileY();
        let selectedTroops = [];
        for (let otherTroop of allTroopsOnMyTeam){
            // Ignore me
            if (otherTroop.is(this.player)){ continue; }

            let otherTroopTileX = otherTroop.getTileX();
            let otherTroopTileY = otherTroop.getTileY();
            let distance = Math.sqrt(Math.pow(myPlayerTileX - otherTroopTileX, 2) + Math.pow(myPlayerTileY - otherTroopTileY, 2));
            if (distance < RETRO_GAME_DATA["skirmish"]["troop_selection_distance"]){
                selectedTroops.push(otherTroop);
            }
        }
        return selectedTroops;
    }

    getScene(){
        return this.player.getScene();
    }

    resetDecisions(){
        this.decisions = {
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "new_crosshair_center": false,
            "trying_to_shoot": false
        }
    }

    makeDecisions(){
        this.resetDecisions();
        let canvasX = mouseX;
        let canvasY = this.getScene().changeFromScreenY(mouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        this.decisions = {
            "crosshair_center_x": engineX,
            "crosshair_center_y": engineY,
            "trying_to_shoot": USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "new_crosshair_center": true
        }
    }

    getGamemode(){
        return this.player.getGamemode();
    }

    select(){
        let newTurn = this.player.getGamemode().getTurnCounter();
        let playerStandingX = this.player.getTileX();
        let playerStandingY = this.player.getTileY();
        // Don't update selected trops UNLESS new turn OR player has moved
        if (newTurn == this.selectionlastUpdatedTurn && this.selectionMadeAtX == playerStandingX && this.selectionMadeAtY == playerStandingY){
            return;
        }
        this.selectionlastUpdatedTurn = newTurn;
        this.moveTileX = playerStandingX; // Placeholder
        this.moveTileY = playerStandingY; // Placeholder
        this.selectionMadeAtX = playerStandingX;
        this.selectionMadeAtY = playerStandingY;
        this.selectedTroops = this.generateSelectedTroops();
    }

    deselect(){
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES["point_to_shoot"];
        let displayScale = RETRO_GAME_DATA["inventory"]["slot_size"] / image.width;
        let scaleX = providedX + image.width / 2 * displayScale;
        let scaleY = providedY + image.height / 2 * displayScale;

        translate(scaleX, scaleY);

        scale(displayScale, displayScale);

        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);

        scale(1 / displayScale, 1 / displayScale);

        translate(-1 * scaleX, -1 * scaleY);
    }

    tick(){
    }

    display(lX, bY){
        let x = this.getScene().getDisplayXOfPoint(this.crosshairCenterX, lX);
        let y = this.getScene().getDisplayYOfPoint(this.crosshairCenterY, bY);
        let crosshairImage = IMAGES["point_to_shoot_crosshair"];
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
}