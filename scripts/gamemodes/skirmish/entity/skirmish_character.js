class SkirmishCharacter extends Character {
    constructor(gamemode, model, rankName, team){
        super(gamemode, model);
        this.makingMove = false;
        this.moveDone = false;
        this.commitedToAction = false;
        this.teamName = team;
        this.tileXOnTurnStart = null;
        this.tileYOnTurnStart = null;
        this.rankName = rankName;
        this.walkingBar = new ProgressBar(RETRO_GAME_DATA["skirmish"]["distance_per_turn"][this.rankName]);
    }

    getWalkingBar(){
        return this.walkingBar;
    }

    getRankName(){
        return this.rankName;
    }

    tick(){
        this.lookingDetails["look_lock"].tick();
        this.inventory.tickSelectedItem();

        this.makeDecisions();
        this.actOnDecisions();
    }

    displayWhenFocused(){
        super.displayWhenFocused();
        this.displayWalkingBar();
    }

    displayWalkingBar(){
        return this.walkingBar.display();
    }

    updateMovement(){
        super.updateMovement();
        if (!this.isMakingAMove()){
            return;
        }
        let distanceToNewTile = Math.sqrt(Math.pow(this.tileX - this.tileXOnTurnStart, 2) + Math.pow(this.tileY - this.tileYOnTurnStart, 2));
        let maxDistance = this.walkingBar.getMaxValue();
        // If the new tile is too far away, for them back
        if (distanceToNewTile > maxDistance){
            this.tileX = this.movementDetails["last_stood_tile_x"];
            this.tileY = this.movementDetails["last_stood_tile_y"];
            this.movementDetails = null;
        }
        this.walkingBar.setValue(Math.sqrt(Math.pow(this.tileX - this.tileXOnTurnStart, 2) + Math.pow(this.tileY - this.tileYOnTurnStart, 2)));
    }

    getTeamName(){
        return this.teamName;
    }

    isOnSameTeam(otherCharacter){
        return this.getTeamName() == otherCharacter.getTeamName();
    }

    isVisibleTo(observer){
        return observer.isOnSameTeam(this) || this.gamemode.visibleToTeam(observer.getTeamName(), this.getTeamName(), this.getID());
    }

    isVisibleToSuper(observer){
        return super.isVisibleTo(observer);
    }
    
    isMakingAMove(){
        return this.makingMove;
    }

    hasCommitedToAction(){
        return this.commitedToAction;
    }

    commitToAction(){
        this.commitedToAction = true;
    }

    indicateTurn(){
        this.makingMove = true;
        this.commitedToAction = false;
        this.tileXOnTurnStart = this.tileX;
        this.tileYOnTurnStart = this.tileY;

        // Reload all guns
        for (let item of this.inventory.getItems()){
            if (item instanceof Gun){
                let gun = item;
                gun.forceReload();
            }
        }
    }

    isMoveDone(){
        return this.moveDone;
    }

    indicateMoveDone(){
        this.moveDone = true;
        this.makingMove = false;
    }

    acceptMoveDone(){
        this.moveDone = false;
    }

    makeDecisions(){
        this.resetDecisions();
        if (this.isMakingAMove()){ 
            this.inventory.tick();
            this.makeMovementDecisions();
            this.inventory.makeDecisionsForSelectedItem();
        }
        this.checkForOfficerCommand();
    }

    checkForOfficerCommand(){
        if (!this.isSelected()){
            return;
        }
        // Only have commands if selected
        let officerCommand = this.gamemode.getOfficerCommand(this);
        
        // if no command then return
        if (officerCommand == null){ return; }

        // Execute officer command
        for (let decisionType of Object.keys(officerCommand)){
            this.decisions[decisionType] = officerCommand[decisionType];
        }
    }

    makeMovementDecisions(){}

    isSelected(){
        return this.gamemode.isTroopSelected(this);
    }

    display(lX, rX, bY, tY){
        if (this.isDead()){ return; }
        super.display(lX, rX, bY, tY);

        if (this.isSelected()){
            //let leftX = this.getInterpolatedTickX();
            //let topY = this.getInterpolatedTickY();
            //let displayX = this.getScene().getDisplayXOfPoint(leftX, lX);
            //let displayY = this.getScene().getDisplayYOfPoint(topY, bY);
            let myWidth = this.getWidth();
            let myHeight = this.getHeight();
            let displayX = this.getDisplayX(lX) - myWidth/2;
            let displayY = this.getDisplayY(bY) - myHeight/2;
            let onScreen = pointInRectangle(displayX, displayY, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(displayX+this.getWidth(), displayY, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(displayX+this.getWidth(), displayY+this.getHeight(), 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(displayX, displayY+this.getHeight(), 0, getScreenWidth(), 0, getScreenHeight());
            if (!onScreen){ return; }
            let selectionColour = Colour.fromCode(RETRO_GAME_DATA["skirmish"]["selection_colour"]);
            let selectionBorderWidth = RETRO_GAME_DATA["skirmish"]["selection_border_width"];
            selectionColour.setAlpha(0.75);
            
            translate(displayX, displayY);
            scale(gameZoom, gameZoom);
            // Top
            noStrokeRectangle(selectionColour, 0, 0, myWidth, selectionBorderWidth);
            // Bottom
            noStrokeRectangle(selectionColour, 0, 0+myHeight-selectionBorderWidth, myWidth, selectionBorderWidth);
            // Left
            noStrokeRectangle(selectionColour, 0, 0, selectionBorderWidth, myHeight);
            // Right
            noStrokeRectangle(selectionColour, 0+myWidth-selectionBorderWidth, 0, selectionBorderWidth, myHeight);

            scale(1 / gameZoom, 1 / gameZoom);
            translate(-1 * displayX, -1 * displayY);
        }
    }
}