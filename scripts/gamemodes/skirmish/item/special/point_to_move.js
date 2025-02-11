/*  
    Class Name: PointToMove
    Class Description: A took for indicating a place for troops to move
*/
class PointToMove extends Item {
    /*
        Method Name: constructor
        Method Parameters: 
            details:
                JSON object with information
        Method Description: constructor
        Method Return: constructor
    */
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

    /*
        Method Name: updateCrosshairColour
        Method Parameters: None
        Method Description: Updates the rosshair color
        Method Return: void
    */
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

    /*
        Method Name: getCrosshairColour
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getCrosshairColour(){
        return this.crosshairColour;
    }

    /*
        Method Name: toggleMode
        Method Parameters: None
        Method Description: Toggles the point to move mode
        Method Return: void
    */
    toggleMode(){
        if (this.getMode() === "move_all"){
            this.mode = "move_individual";
            this.selectedTroopIndex = 0;
        }else{
            this.mode = "move_all";
        }
    }

    /*
        Method Name: getMode
        Method Parameters: None
        Method Description: Gets the point to move mode
        Method Return: String
    */
    getMode(){
        return this.mode;
    }

    /*
        Method Name: resetDecisions
        Method Parameters: None
        Method Description: Resets the decisions
        Method Return: void
    */
    resetDecisions(){
        this.player.amendDecisions({
            "move_tile_x": null,
            "move_tile_y": null,
            "trying_to_move_troops": false,
            "new_move_tile": false,
            "toggle_mode": false
        });
    }

    /*
        Method Name: isMovingTroops
        Method Parameters: None
        Method Description: TODO
        Method Return: TODO
    */
    isMovingTroops(){
        return this.troopMovementInProgress;
    }

    /*
        Method Name: checkIfMovementFinished
        Method Parameters: None
        Method Description: Checks if the movement is finished
        Method Return: void
    */
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

    /*
        Method Name: getCommandForTroop
        Method Parameters: 
            troop:
                A character
        Method Description: Checks if there is a command available for a troop
        Method Return: void
    */
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
        // Don't let troop keep moving if the troop has moved far enough
        if (distanceFromStart > troop.getWalkingBar().getMaxValue()){
            return null;
        }
        return route.getDecisionAt(troop.getTileX(), troop.getTileY());
    }

    /*
        Method Name: generateTroopMovementDetails
        Method Parameters: None
        Method Description: Comes up with routes for troops
        Method Return: void
    */
    generateTroopMovementDetails(){
        for (let troop of this.selectedTroops){
            // Note: Don't cap the length because we want it to move as if it was on the unlimited route and just go as far as it can
            this.troopMovementDetails[troop.getID()] = troop.generateShortestRouteToPoint(this.moveTileX, this.moveTileY);
        }
    }

    /*
        Method Name: generateIndividualTroopMovementDetails
        Method Parameters: None
        Method Description: Comes up with a route for an individual
        Method Return: void
    */
    generateIndividualTroopMovementDetails(){
        let troopToBeMoved = this.selectedTroops[this.selectedTroopIndex];
        // Note: Don't cap the length because we want it to move as if it was on the unlimited route and just go as far as it can
        this.troopMovementDetails[troopToBeMoved.getID()] = troopToBeMoved.generateShortestRouteToPoint(this.moveTileX, this.moveTileY);
        // Go to the next one (if its the last then it will end here)
        this.selectedTroopIndex++;
    }

    /*
        Method Name: getSelectedTroops
        Method Parameters: None
        Method Description: Gets the selected troops
        Method Return: List of SkirmishCharacter
    */
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

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Acts on decisions
        Method Return: void
    */
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

    /*
        Method Name: getScene
        Method Parameters: None
        Method Description: Gets the player's scene
        Method Return: void
    */
    getScene(){
        return this.player.getScene();
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Indicates that the player should make move pointer decisions
        Method Return: void
    */
    makeDecisions(){
        this.player.makeMovePointerDecisions();
    }

    /*
        Method Name: select
        Method Parameters: None
        Method Description: Selects the item
        Method Return: void
    */
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

    /*
        Method Name: resetSelectedTroopsForCurrentPosition
        Method Parameters: None
        Method Description: Resets the selected troops
        Method Return: void
    */
    resetSelectedTroopsForCurrentPosition(){
        this.selectedTroops = this.generateSelectedTroops();
        this.selectedTroopIndex = 0;
    }

    /*
        Method Name: getGamemode
        Method Parameters: None
        Method Description: Gets the player's gamemode
        Method Return: Skirmish instance
    */
    getGamemode(){
        return this.player.getGamemode();
    }

    /*
        Method Name: generateSelectedTroops
        Method Parameters: None
        Method Description: Generates the selected troops list
        Method Return: List of SKirmishCharacter
    */
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

    /*
        Method Name: deselect
        Method Parameters: None
        Method Description: Handles deselection
        Method Return: void
    */
    deselect(){
        MY_HUD.clearElement("Item Mode");
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

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick processes
        Method Return: void
    */
    tick(){
        // Moved this.checkIfMovementFinished();
        MY_HUD.updateElement("Item Mode", this.getMode());
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x coordinate of the left side of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: TODO
        Method Return: TODO
    */
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