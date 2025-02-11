/*
    Class Name: SkirmishCamera
    Description: A subclass of Entity that acts as a camera, able to fly around.
*/
class SkirmishCharacter extends Character {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                The Skirmish gamemode.
            model:
                The character's model. String
            rankName:
                The name of the character's rank. String.
            team:
                The name of the team the character is on. String
        Method Description: TODO
        Method Return: TODO
    */
    constructor(gamemode, model, rankName, team){
        super(gamemode, model);
        this.makingMove = false;
        this.moveDone = false;
        this.commitedToAction = false;
        this.teamName = team;
        this.tileXOnTurnStart = null;
        this.tileYOnTurnStart = null;
        this.rankName = rankName;
        this.walkingBar = new ProgressBar(WTL_GAME_DATA["skirmish"]["distance_per_turn"][this.rankName]);
        this.visualEnvironmentHealthBar = new VisualEnvironmentHealthBar(this.healthBar.getHealth());
    }

    /*
        Method Name: getShot
        Method Parameters: 
            model:
                The model of the shooter. String.
            killerID:
                The id of the possible killer
        Method Description: Handles a character getting shot
        Method Return: void
    */
    getShot(model, killerID){
        let damage = WTL_GAME_DATA["skirmish"]["shot_damage"];
        // If the attacker is friendly then limit damage to avoid death of officer (This is to prevent dying while ordering shooting)
        if (teamNameIsEqual(getTeamNameFromClass(model), this.getTeamName()) && this.getRankName() === "officer" && this.isMakingAMove()){
            damage = Math.min(damage, Math.max(this.getHealth() - 0.01, 0));
        }
        this.damage(damage);
        // Assumes not dead prior to damage
        if (this.isDead()){
            this.gamemode.getEventHandler().emit({
                "victim_class": this.getModel(),
                "killer_class": model,
                "killer_id": killerID,
                "tile_x": this.getTileX(),
                "tile_y": this.getTileY(),
                "center_x": this.getInterpolatedTickCenterX(),
                "center_y": this.getInterpolatedTickCenterY(),
                "name": "kill"
            });
        }
    }

    /*
        Method Name: setHealth
        Method Parameters: 
            value:
                New health value
        Method Description: Sets the health to a new value
        Method Return: void
    */
    setHealth(value){
        super.setHealth(value);
        this.visualEnvironmentHealthBar.setValue(value);
    }

    /*
        Method Name: getWalkingBar
        Method Parameters: None
        Method Description: Getter
        Method Return: ProgressBar
    */
    getWalkingBar(){
        return this.walkingBar;
    }

    /*
        Method Name: getRankName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getRankName(){
        return this.rankName;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles processes that take place during a tick
        Method Return: void
    */
    tick(){
        if (this.isDead()){ return; }
        this.lookingDetails["look_lock"].tick();
        this.inventory.tickSelectedItem();

        this.makeDecisions();
        this.actOnDecisions();
    }

    /*
        Method Name: displayWhenFocused
        Method Parameters: None
        Method Description: Display certain things that are only displayed when focused
        Method Return: void
    */
    displayWhenFocused(){
        super.displayWhenFocused();
        this.displayWalkingBar();
    }

    /*
        Method Name: displayWalkingBar
        Method Parameters: None
        Method Description: Display the walking bar
        Method Return: void
    */
    displayWalkingBar(){
        return this.walkingBar.display();
    }

    /*
        Method Name: updateMovement
        Method Parameters: None
        Method Description: Updates the character position
        Method Return: void
    */
    updateMovement(){
        let tileXBefore = this.tileX;
        let tileYBefore = this.tileY;
        super.updateMovement();
        if (!this.isMakingAMove()){
            return;
        }
        let tileChanged = this.tileX != tileXBefore || this.tileY != tileYBefore;
        if (!tileChanged){ return; }
        // We have a tile change
        let distanceToNewTile = Math.sqrt(Math.pow(this.tileX - this.tileXOnTurnStart, 2) + Math.pow(this.tileY - this.tileYOnTurnStart, 2));
        let maxDistance = this.walkingBar.getMaxValue();
        // If the new tile is too far away, for them back
        if (distanceToNewTile > maxDistance){
            this.tileX = this.movementDetails["last_stood_tile_x"];
            this.tileY = this.movementDetails["last_stood_tile_y"];
            this.movementDetails = null;
        }
        // The move goes through -> emit tile change event
        else{
            this.gamemode.getEventHandler().emit({
                "name": "change_tile",
                "team": this.getTeamName(),
                "troop_id": this.getID(),
                "new_tile_x": this.tileX,
                "new_tile_y": this.tileY,
                "health": this.getHealth()
            });
        }
        this.walkingBar.setValue(Math.sqrt(Math.pow(this.tileX - this.tileXOnTurnStart, 2) + Math.pow(this.tileY - this.tileYOnTurnStart, 2)));
    }

    /*
        Method Name: getTeamName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getTeamName(){
        return this.teamName;
    }

    /*
        Method Name: isOnSameTeam
        Method Parameters: 
            otherCharacter:
                Another participant
        Method Description: Checks if this character is on the same team as another one
        Method Return: boolean
    */
    isOnSameTeam(otherCharacter){
        return this.getTeamName() === otherCharacter.getTeamName();
    }

    /*
        Method Name: isVisibleTo
        Method Parameters: 
            observer:
                An observing entity
        Method Description: Checks if this character is visible to an observer
        Method Return: boolean
    */
    isVisibleTo(observer){
        return observer.isOnSameTeam(this) || this.gamemode.isVisibleToTeam(observer.getTeamName(), this.getTeamName(), this.getID());
    }

    /*
        Method Name: isVisibleToSuper
        Method Parameters: 
            observer:
                An observing entity
        Method Description: Shortcut to super isVisibleTo method
        Method Return: boolean
    */
    isVisibleToSuper(observer){
        return super.isVisibleTo(observer);
    }
    
    /*
        Method Name: isMakingAMove
        Method Parameters: None
        Method Description: Checks if the character is making a move
        Method Return: boolean
    */
    isMakingAMove(){
        return this.makingMove;
    }

    /*
        Method Name: hasCommitedToAction
        Method Parameters: None
        Method Description: Checks if the character has committed to an action
        Method Return: boolean
    */
    hasCommitedToAction(){
        return this.commitedToAction;
    }

    /*
        Method Name: commitToAction
        Method Parameters: None
        Method Description: Commits to an action
        Method Return: void
    */
    commitToAction(){
        this.commitedToAction = true;
    }

    /*
        Method Name: indicateTurn
        Method Parameters: None
        Method Description: Indicates to the character that its turn has started
        Method Return: void
    */
    indicateTurn(){
        this.makingMove = true;
        this.commitedToAction = false;
        this.tileXOnTurnStart = this.tileX;
        this.tileYOnTurnStart = this.tileY;
        this.walkingBar.setValue(0);
        this.forceReloadAllGuns();
        // Reset selected troops if selected tool is a move troops or order shoot
        let selectedItem = this.inventory.getSelectedItem();
        // If selected item is one of these then reset the selected troops
        if (selectedItem != null && (selectedItem instanceof PointToMove || selectedItem instanceof PointToShoot)){
            selectedItem.resetSelectedTroopsForCurrentPosition();
        }
    }

    /*
        Method Name: forceReloadAllGuns
        Method Parameters: None
        Method Description: Reloads all guns
        Method Return: void
    */
    forceReloadAllGuns(){
        // Reload all guns
        for (let item of this.inventory.getItems()){
            if (item instanceof Gun){
                let gun = item;
                gun.forceReload();
            }
        }
    }

    /*
        Method Name: isMoveDone
        Method Parameters: None
        Method Description: Checks if the move is done
        Method Return: boolean
    */
    isMoveDone(){
        return this.moveDone;
    }

    /*
        Method Name: indicateMoveDone
        Method Parameters: None
        Method Description: Indicates to the character that its move is done
        Method Return: void
    */
    indicateMoveDone(){
        this.moveDone = true;
        this.makingMove = false;
    }

    /*
        Method Name: acceptMoveDone
        Method Parameters: None
        Method Description: Accepts that the move is done
        Method Return: void
    */
    acceptMoveDone(){
        this.moveDone = false;
    }

    /*
        Method Name: checkForOfficerCommand
        Method Parameters: None
        Method Description: Checks for a command from an officer
        Method Return: void
    */
    checkForOfficerCommand(){
        if (!this.isSelected()){
            return;
        }
        // Only have commands if selected
        let officerCommand = this.gamemode.getOfficerCommand(this);
        
        // if no command then return
        if (officerCommand == null){ return; }

        // Execute officer command
        let inventory = this.getInventory();
        let selectedItem = null;
        let hasSelectedItem = inventory.hasSelectedItem();
        if (hasSelectedItem){
            selectedItem = inventory.getSelectedItem();
        }
        this.amendDecisions(officerCommand);
    }

    /*
        Method Name: makeMovementDecisions
        Method Parameters: None
        Method Description: Dud
        Method Return: void
    */
    makeMovementDecisions(){}

    /*
        Method Name: isSelected
        Method Parameters: None
        Method Description: Checks if this character is selected
        Method Return: boolean
    */
    isSelected(){
        return this.gamemode.isTroopSelected(this);
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x value of the left of the screen
            rX:
                The x value of the right of the screen
            bY:
                The y value of the bottom of the screen
            tY:
                The y value of the top of the screen
        Method Description: Displays the character
        Method Return: void
    */
    display(lX, rX, bY, tY){
        if (this.isDead()){ return; }
        super.display(lX, rX, bY, tY);

        let displayX = this.getDisplayX(lX);
        let displayY = this.getDisplayY(bY);

        // Display selection indicator
        if (this.isSelected()){
            //let leftX = this.getInterpolatedTickX();
            //let topY = this.getInterpolatedTickY();
            //let displayX = this.getScene().getDisplayXOfPoint(leftX, lX);
            //let displayY = this.getScene().getDisplayYOfPoint(topY, bY);
            let myWidth = this.getWidth();
            let myHeight = this.getHeight();
            let onScreen = pointInRectangle(displayX, displayY, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(displayX+this.getWidth(), displayY, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(displayX+this.getWidth(), displayY+this.getHeight(), 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(displayX, displayY+this.getHeight(), 0, getScreenWidth(), 0, getScreenHeight());
            if (!onScreen){ return; }
            let selectionColour = Colour.fromCode(WTL_GAME_DATA["skirmish"]["selection_colour"]);
            let selectionBorderWidth = WTL_GAME_DATA["skirmish"]["selection_border_width"];
            selectionColour.setAlpha(0.75);
            
            translate(displayX, displayY);
            scale(gameZoom, gameZoom);
            let xOffset = -1 * this.getWidth() / 2;
            let yOffset = -1 * this.getHeight() / 2;
            // Top
            noStrokeRectangle(selectionColour, xOffset, yOffset, myWidth, selectionBorderWidth);
            // Bottom
            noStrokeRectangle(selectionColour, xOffset, yOffset+myHeight-selectionBorderWidth, myWidth, selectionBorderWidth);
            // Left
            noStrokeRectangle(selectionColour, xOffset, yOffset, selectionBorderWidth, myHeight);
            // Right
            noStrokeRectangle(selectionColour, xOffset+myWidth-selectionBorderWidth, yOffset, selectionBorderWidth, myHeight);


            scale(1 / gameZoom, 1 / gameZoom);
            translate(-1 * displayX, -1 * displayY);
        }

        // Display health
        this.visualEnvironmentHealthBar.display(displayX, displayY);
    }
}