/*  
    Class Name: PointToMove
    Class Description: A took for indicating a place for troops to move
*/
class PointToShoot extends Item {
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
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.crosshairCenterX = 0;
        this.crosshairCenterY = 0;

        this.selectionLastUpdatedTurn = -1;
        this.selectionMadeAtX = 0;
        this.selectionMadeAtY = 0;
        this.selectedTroops = [];
        this.waitingToShoot = [];
        this.gunShotEventHandlerID = null;

        this.beingUsedForAction = false;
    }

    /*
        Method Name: isBeingUsedForAction
        Method Parameters: None
        Method Description: Checks if this is being using for an action
        Method Return: boolean
    */
    isBeingUsedForAction(){
        return this.beingUsedForAction;
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
        let gunSelected = false;
        // If they don't have their gun selected
        if (!(selectedItem instanceof Gun)){
            let items = troopInventory.getItems();
            // Find gun and select it
            for (let i = 0; i < items.length; i++){
                let item = items[i];
                if (item instanceof Gun){
                    command["select_slot"] = i;
                    break;
                }
            }
        }else{
            gunSelected = true;
        }

        // If not ready to start aiming then return current command
        if (!gunSelected){
            return command;
        }
        
        let gun = selectedItem;
        // Force reload the gun
        if (!gun.isLoaded()){
            gun.forceReload();
        }

        // Make troop start aiming in correct direction
        command["aiming_angle_rad"] = angleToCrosshairRAD;
        command["trying_to_aim"] = true;
        command["trying_to_shoot"] = this.isBeingUsedForAction() && getIndexOfElementInArray(this.waitingToShoot, troop.getID()) != -1;
        return command;
    }

    /*
        Method Name: resetSelectedTroopsForCurrentPosition
        Method Parameters: None
        Method Description: Resets the selected troops
        Method Return: void
    */
    resetSelectedTroopsForCurrentPosition(){
        this.selectedTroops = this.generateSelectedTroops();
    }

    /*
        Method Name: getSelectedTroops
        Method Parameters: None
        Method Description: Gets the selected troops
        Method Return: List of SkirmishCharacter
    */
    getSelectedTroops(){
        return this.selectedTroops;
    }

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Acts on decisions
        Method Return: void
    */
    actOnDecisions(){
        // Tick 2 after trying to shot
        if (this.player.hasCommitedToAction() && this.isBeingUsedForAction() && this.allHaveShot()){
            console.log("All have shot");
            this.beingUsedForAction = false;
            // remove handler
            this.player.getGamemode().getEventHandler().removeHandler("gun_shot", this.gunShotEventHandlerID);
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
                this.waitingToShoot = this.generateWaitingToShootList();
                // Create handler for gun shot
                this.gunShotEventHandlerID = this.player.getGamemode().getEventHandler().addHandler("gun_shot", (gunShotEventObj) => {
                    this.removeFromShootList(gunShotEventObj["shooter_id"]);
                });
            }
        }
    }

    /*
        Method Name: generateWaitingToShootList
        Method Parameters: None
        Method Description: Generates a list of troops waiting to shoot
        Method Return: List opf SkirmishCharacter
    */
    generateWaitingToShootList(){
        let waitingToShootList = [];
        for (let troop of this.selectedTroops){
            waitingToShootList.push(troop.getID());
        }
        return waitingToShootList;
    }

    /*
        Method Name: removeFromShootList
        Method Parameters: 
            troopID:
                ID of a troop
        Method Description: Removes a troop from the shoot list
        Method Return: void
    */
    removeFromShootList(troopID){
        let listIndex = -1;
        for (let i = 0; i < this.waitingToShoot.length; i++){
            if (this.waitingToShoot[i] === troopID){
                listIndex = i;
                break;
            }
        }
        if (listIndex === -1){
            throw new Error("Unexpected troop id: " + troopID);
        }
        // Swap with 0 and remove first element
        this.waitingToShoot[listIndex] = this.waitingToShoot[0];
        this.waitingToShoot.shift();
    }

    /*
        Method Name: allHaveShot
        Method Parameters: None
        Method Description: Checks if all the troops on the shoot list shot
        Method Return: boolean
    */
    allHaveShot(){
        return this.waitingToShoot.length === 0;
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
        Method Name: getScene
        Method Parameters: None
        Method Description: Gets the player's scene
        Method Return: void
    */
    getScene(){
        return this.player.getScene();
    }

    /*
        Method Name: resetDecisions
        Method Parameters: None
        Method Description: Resets the decisions
        Method Return: void
    */
    resetDecisions(){
        this.player.amendDecisions({
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "new_crosshair_center": false,
            "trying_to_shoot": false
        });
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Indicates that the player should make move pointer decisions
        Method Return: void
    */
    makeDecisions(){
        this.player.makeShootPointerDecisions();
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
        Method Name: select
        Method Parameters: None
        Method Description: Handles item selection logic
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
        this.selectedTroops = this.generateSelectedTroops();
    }

    /*
        Method Name: deselect
        Method Parameters: None
        Method Description: Dud
        Method Return: void
    */
    deselect(){
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
        let image = IMAGES["point_to_shoot"];
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
        Method Description: Dud
        Method Return: void
    */
    tick(){
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x coordinate of the left side of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Displays the crosshair
        Method Return: void
    */
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