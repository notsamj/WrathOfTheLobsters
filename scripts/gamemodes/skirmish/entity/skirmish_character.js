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
        if (!this.isMakingAMove()){ return; }
        this.inventory.tick();
        this.makeMovementDecisions();
        this.inventory.makeDecisionsForSelectedItem();
    }

    makeMovementDecisions(){}

    isSelected(){
        return this.gamemode.isTroopSelected(this);
    }

    display(lX, rX, bY, tY){
        if (this.isDead()){ return; }
        super.display(lX, rX, bY, tY);

        if (this.isSelected()){
            let leftX = this.getInterpolatedTickX();
            let topY = this.getInterpolatedTickY();
            let displayX = this.getScene().getDisplayXOfPoint(leftX, lX);
            let displayY = this.getScene().getDisplayYOfPoint(topY, bY);
            let myWidth = this.getWidth();
            let myHeight = this.getHeight();
            let selectionColour = Colour.fromCode(RETRO_GAME_DATA["skirmish"]["selection_colour"]);
            let selectionBorderWidth = RETRO_GAME_DATA["skirmish"]["selection_border_width"];
            selectionColour.setAlpha(0.75);
            
            // Top
            noStrokeRectangle(selectionColour, displayX, displayY, myWidth, selectionBorderWidth);
            // Bottom
            noStrokeRectangle(selectionColour, displayX, displayY+myHeight-selectionBorderWidth, myWidth, selectionBorderWidth);
            // Left
            noStrokeRectangle(selectionColour, displayX, displayY, selectionBorderWidth, myHeight);
            // Right
            noStrokeRectangle(selectionColour, displayX+myWidth-selectionBorderWidth, displayY, selectionBorderWidth, myHeight);
        }
    }
}