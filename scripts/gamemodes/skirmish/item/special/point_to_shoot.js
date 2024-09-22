class PointToShoot extends Item {
    constructor(details){
        super();
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.crosshairCenterX = 0;
        this.crosshairCenterY = 0;

        this.selectionLastUpdatedTurn = -1;
        this.selectionMadeAtX = 0;
        this.selectionMadeAtY = 0;
        this.selectedTroops = [];

        this.beingUsedForAction = false;
    }

    isBeingUsedForAction(){
        return this.beingUsedForAction;
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
        if (angleBetweenCCWRAD(angleToCrosshairRAD, toRadians(315), toRadians(45))){
            directionToFace = "right";
        }
        // If up
        else if (angleBetweenCCWRAD(angleToCrosshairRAD, toRadians(45), toRadians(135))){
            directionToFace = "up";
        }
        // If to the left
        else if (angleBetweenCCWRAD(angleToCrosshairRAD, toRadians(135), toRadians(180))){
            directionToFace = "left";
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
        if (!(selectedItem instanceof Gun)){
            let items = troopInventory.getItems();
            // Find gun and select it
            for (let i = 0; i < items.length; i++){
                let item = items[i];
                if (item instanceof Gun){
                    command["select_slot"] = i;
                    break;
                }else{
                    //console.log(item, "not gun")
                }
            }
        }
       // console.log(command["select_slot"])
       // debugger;

        // If not ready to start aiming then return current command
        if (!facingCorrectDirection){
            return command;
        }
        
        // Make troop start aiming in correct direction
        command["aiming_angle_rad"] = angleToCrosshairRAD;
        command["trying_to_aim"] = true;
        command["trying_to_shoot"] = this.isBeingUsedForAction();
        return command;
    }

    getSelectedTroops(){
        return this.selectedTroops;
    }

    actOnDecisions(){
        // Tick 2 after trying to shot
        if (this.player.hasCommitedToAction() && this.isBeingUsedForAction()){
            this.beingUsedForAction = false;
            this.player.indicateMoveDone();
        }
        if (this.getDecision("new_crosshair_center")){
            this.crosshairCenterX = this.getDecision("crosshair_center_x");
            this.crosshairCenterY = this.getDecision("crosshair_center_y");
        }

        // If trying to shoot, all troops (that have made preparations and are thus able) will shoot then the turn will end
        if (this.getDecision("trying_to_shoot") && this.player.isMakingAMove()){
            // This will take 2 ticks, 1 to make the decision, second to wait for it to execute
            // Tick 1
            if (!this.player.hasCommitedToAction()){
                this.player.commitToAction();
                this.beingUsedForAction = true;
            }
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
        this.player.amendDecisions({
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "new_crosshair_center": false,
            "trying_to_shoot": false
        });
    }

    makeDecisions(){
        this.player.makeShootPointerDecisions();
    }

    getGamemode(){
        return this.player.getGamemode();
    }

    select(){
        let newTurn = this.player.getGamemode().getTurnCounter();
        let playerStandingX = this.player.getTileX();
        let playerStandingY = this.player.getTileY();
        // Don't update selected trops UNLESS new turn OR player has moved
        if (newTurn == this.selectionLastUpdatedTurn && this.selectionMadeAtX == playerStandingX && this.selectionMadeAtY == playerStandingY){
            return;
        }
        this.selectionLastUpdatedTurn = newTurn;
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
        if (!this.player.isMakingAMove()){ return; }
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