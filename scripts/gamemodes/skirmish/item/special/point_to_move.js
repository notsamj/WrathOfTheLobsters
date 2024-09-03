class PointToMove extends Item {
    constructor(details){
        super(details);
        // Note: if player is null an error will occur I know I'm not handling this perfectly
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.moveTileX = this.player.getTileX();
    	this.moveTileY = this.player.getTileY();

        this.selectionlastUpdatedTurn = -1;
        this.selectionMadeAtX = 0;
        this.selectionMadeAtY = 0;
        this.selectedTroops = [];

        this.troopMovementDetails = {};
        this.troopMovementInProgress = false;

        this.resetDecisions();
    }

    isMovingTroops(){
        return this.troopMovementInProgress;
    }

    checkIfMovementFinished(){
        if (!this.isMovingTroops()){ return; }
        for (let troop of this.selectedTroops){
            let commandForTroop = this.getCommandForTroop(troop);
            // If troop is moving or has a valid command to move
            if (troop.isMoving() || (commandForTroop != null && getNumKeys(commandForTroop) > 0)){
                return;
            }
        }
        //return;
        // Troop movement is over
        this.troopMovementInProgress = false;
        this.troopMovementDetails = {};
        this.player.indicateMoveDone();
    }

    getCommandForTroop(troop){
        if (!objectHasKey(this.troopMovementDetails, troop.getID())){
            return null;
        }
        let route = this.troopMovementDetails[troop.getID()];
        // If no route, there is no command
        if (route == null){
            return null;
        }
        let troopX = troop.getTileX();
        let troopY = troop.getTileY();
        let decision = route.getDecisionAt(troopX, troopY);
        let troopXAfter = troopX;
        let troopYAfter = troopY;

        // determine after position
        if (objectHasKey(decision, "up")){
            troopYAfter += 1;
        }else if (objectHasKey(decision, "down")){
            troopYAfter -= 1;
        }else if (objectHasKey(decision, "left")){
            troopXAfter -= 1;
        }else if (objectHasKey(decision, "right")){
            troopXAfter += 1;
        }
        let startTile = route.getStartTile();
        let startOfRouteX = startTile["x_tile"];
        let startOfRouteY = startTile["y_tile"];
        let distanceFromStart = Math.sqrt(Math.pow(troopXAfter - startOfRouteX, 2) + Math.pow(troopYAfter - startOfRouteY, 2));
        // Don't let troop keep moving if the troop has moved far enough
        if (distanceFromStart > troop.getWalkingBar().getMaxValue()){
            return null;
        }
        return route.getDecisionAt(troop.getTileX(), troop.getTileY());
    }

    generateTroopMovementDetails(){
        for (let troop of this.selectedTroops){
            this.troopMovementDetails[troop.getID()] = troop.generateShortestRouteToPoint(this.moveTileX, this.moveTileY);
        }
    }

    getSelectedTroops(){
        return this.selectedTroops;
    }

    actOnDecisions(){
    	if (this.decisions["new_move_tile"] && !this.player.hasCommitedToAction()){
        	this.moveTileX = this.decisions["move_tile_x"];
        	this.moveTileY = this.decisions["move_tile_y"];
    	}
    	if (this.decisions["trying_to_move_troops"] && !this.player.hasCommitedToAction() && this.selectedTroops.length > 0){
            let canWalkOnTile = !this.getScene().tileAtLocationHasAttribute(this.moveTileX, this.moveTileY, "no_walk");
            if (canWalkOnTile){
                this.player.commitToAction();
                this.troopMovementInProgress = true;
                this.generateTroopMovementDetails();
            }
    	}
        this.checkIfMovementFinished();
    }

    resetDecisions(){
        this.decisions = {
        	"move_tile_x": null,
        	"move_tile_y": null,
        	"new_move_tile": false,
        	"trying_to_move_troops": false
        }
    }

    getScene(){
    	return this.player.getScene();
    }

    makeDecisions(){
    	this.resetDecisions();
    	let canvasX = mouseX;
        let canvasY = this.getScene().changeFromScreenY(mouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX / gameZoom + this.getScene().getLX();
        let engineY = canvasY / gameZoom + this.getScene().getBY();
        let newPlacerTileX = RetroGameScene.getTileXAt(engineX);
        let newPlacerTileY = RetroGameScene.getTileYAt(engineY);
        this.decisions = {
        	"move_tile_x": newPlacerTileX,
        	"move_tile_y": newPlacerTileY,
        	"trying_to_move_troops": USER_INPUT_MANAGER.isActivated("left_click_ticked"),
        	"new_move_tile": true
        }
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

    getGamemode(){
        return this.player.getGamemode();
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

    deselect(){
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES["point_to_move"];
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
        // Moved this.checkIfMovementFinished();
    }

    display(lX, bY){
        if (!this.player.isMakingAMove()){ return; }
        
    	let x = this.getScene().getDisplayXFromTileX(lX, this.moveTileX);
        let y = this.getScene().getDisplayYFromTileY(bY, this.moveTileY);
        let crosshairImage = IMAGES["point_to_move_crosshair"];
        let crosshairWidth = crosshairImage.width;
        let crosshairHeight = crosshairImage.height;
        translate(x, y);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(crosshairImage, 0, 0);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * x, -1 * y);
    }
}