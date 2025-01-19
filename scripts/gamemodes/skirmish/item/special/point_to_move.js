class PointToMove extends Item {
    constructor(details){
        super();
        // Note: if player is null an error will occur I know I'm not handling this perfectly
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.moveTileX = this.player.getTileX();
    	this.moveTileY = this.player.getTileY();

        this.selectionLastUpdatedTurn = -1;
        this.selectionMadeAtX = 0;
        this.selectionMadeAtY = 0;
        this.selectedTroops = [];

        this.troopMovementDetails = {};
        this.troopMovementInProgress = false;
        this.crosshairColour = "green";
        this.mode = "move_all";
        // move_individal mode has a selected troop index
        this.selectedTroopIndex = -1;
    }

    updateCrosshairColour(){
        // If no selected troops its always red
        if (this.selectedTroops.length === 0){
            this.crosshairColour = "red";
            return;
        }
        let prop;

        if (this.getMode() === "move_all"){
            let count = 0;
            for (let troop of this.selectedTroops){
                let routeToPoint = troop.generateShortestRouteToPoint(this.moveTileX, this.moveTileY, troop.getWalkingBar().getMaxValue());
                if (routeToPoint === null || routeToPoint.isEmpty()){ continue; }
                let lastTile = routeToPoint.getLastTile();
                // If troop can reach this tile x
                if (lastTile["tile_x"] === this.moveTileX && lastTile["tile_y"] === this.moveTileY){
                    count++;
                }
            }
            prop = count / this.selectedTroops.length;
        }else{
            // Invidiaul selected
            let troop = this.selectedTroops[this.selectedTroopIndex];
            let routeToPoint = troop.generateShortestRouteToPoint(this.moveTileX, this.moveTileY, troop.getWalkingBar().getMaxValue());
            if (routeToPoint === null || routeToPoint.isEmpty()){
                prop = 0;
            }else{
                let lastTile = routeToPoint.getLastTile();
                // If troop can reach this tile x
                if (lastTile["tile_x"] === this.moveTileX && lastTile["tile_y"] === this.moveTileY){
                    prop = 1;
                }else{
                    prop = 0;
                }
            }
        }
        if (prop === 0){
            this.crosshairColour = "red";
        }else if (prop < 1){
            this.crosshairColour = "orange";
        }else{
            this.crosshairColour = "green";
        }
    }

    getCrosshairColour(){
        return this.crosshairColour;
    }

    toggleMode(){
        if (this.getMode() === "move_all"){
            this.mode = "move_individual";
            this.selectedTroopIndex = 0;
        }else{
            this.mode = "move_all";
        }
    }

    getMode(){
        return this.mode;
    }

    resetDecisions(){
        this.player.amendDecisions({
            "move_tile_x": null,
            "move_tile_y": null,
            "trying_to_move_troops": false,
            "new_move_tile": false,
            "toggle_mode": false
        });
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
        if (!this.troopMovementInProgress){ return; }
        if (!objectHasKey(this.troopMovementDetails, troop.getID())){
            return null;
        }
        let route = this.troopMovementDetails[troop.getID()];
        // If no route, there is no command
        if (route === null || route.isEmpty()){
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
        let startOfRouteX = startTile["tile_x"];
        let startOfRouteY = startTile["tile_y"];
        //debugger;
        let distanceFromStart = Math.sqrt(Math.pow(troopXAfter - startOfRouteX, 2) + Math.pow(troopYAfter - startOfRouteY, 2));
        //console.log(distanceFromStart, troop.getWalkingBar().getMaxValue())
        // Don't let troop keep moving if the troop has moved far enough
        if (distanceFromStart > troop.getWalkingBar().getMaxValue()){
            return null;
        }
        return route.getDecisionAt(troop.getTileX(), troop.getTileY());
    }

    generateTroopMovementDetails(){
        for (let troop of this.selectedTroops){
            // Note: Don't cap the length because we want it to move as if it was on the unlimited route and just go as far as it can
            this.troopMovementDetails[troop.getID()] = troop.generateShortestRouteToPoint(this.moveTileX, this.moveTileY);
        }
    }

    generateIndividualTroopMovementDetails(){
        let troopToBeMoved = this.selectedTroops[this.selectedTroopIndex];
        // Note: Don't cap the length because we want it to move as if it was on the unlimited route and just go as far as it can
        this.troopMovementDetails[troopToBeMoved.getID()] = troopToBeMoved.generateShortestRouteToPoint(this.moveTileX, this.moveTileY);
        // Go to the next one (if its the last then it will end here)
        this.selectedTroopIndex++;
    }

    getSelectedTroops(){
        if (this.getMode() === "move_all"){
            return this.selectedTroops;
        }else{
            // If none then don't try to access it
            if (this.selectedTroops.length === 0){
                return this.selectedTroops;
            }
            // Else if we have run out of troops to individually order then all are selected again
            else if (this.selectedTroopIndex >= this.selectedTroops.length){
                return this.selectedTroops;
            }
            return [this.selectedTroops[this.selectedTroopIndex]];
        }
    }

    actOnDecisions(){
    	if (this.getDecision("toggle_mode")){
            this.toggleMode();
        }
        if (this.getDecision("new_move_tile") && !this.player.hasCommitedToAction()){
        	this.moveTileX = this.getDecision("move_tile_x");
        	this.moveTileY = this.getDecision("move_tile_y");
            this.updateCrosshairColour();
    	}
    	if (this.getDecision("trying_to_move_troops") && !this.player.hasCommitedToAction() && this.selectedTroops.length > 0){
            let canWalkOnTile = !this.getScene().tileAtLocationHasAttribute(this.moveTileX, this.moveTileY, "no_walk");
            if (canWalkOnTile){
                let tryingToCompleteMove = false;
                if (this.getMode() === "move_all"){
                    tryingToCompleteMove = true;
                    this.generateTroopMovementDetails();
                }else{
                    this.generateIndividualTroopMovementDetails();
                    if (this.selectedTroopIndex === this.selectedTroops.length){
                        tryingToCompleteMove = true;
                    }
                }

                if (tryingToCompleteMove){
                    this.player.commitToAction();
                    this.troopMovementInProgress = true;
                }
            }
    	}
        this.checkIfMovementFinished();
    }

    getScene(){
    	return this.player.getScene();
    }

    makeDecisions(){
        this.player.makeMovePointerDecisions();
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
        this.resetSelectedTroopsForCurrentPosition();
    }

    resetSelectedTroopsForCurrentPosition(){
        this.selectedTroops = this.generateSelectedTroops();
        this.selectedTroopIndex = 0;
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
            if (distance < WTL_GAME_DATA["skirmish"]["troop_selection_distance"]){
                selectedTroops.push(otherTroop);
            }
        }
        return selectedTroops;
    }

    deselect(){
        MY_HUD.clearElement("Item Mode");
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES["point_to_move"];
        let displayScale = WTL_GAME_DATA["inventory"]["slot_size"] / image.width;
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
        MY_HUD.updateElement("Item Mode", this.getMode());
    }

    display(lX, bY){
        if (!this.player.isMakingAMove()){ return; }
        
    	let x = this.getScene().getDisplayXFromTileX(lX, this.moveTileX);
        let y = this.getScene().getDisplayYFromTileY(bY, this.moveTileY);
        let crosshairImage = IMAGES["point_to_move_crosshair_" + this.getCrosshairColour()];
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