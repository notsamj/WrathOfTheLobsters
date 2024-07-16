class SkirmishCharacter extends Character {
    constructor(gamemode, model, rank, team){
        super(gamemode, model);
        this.makingMove = false;
        this.moveDone = false;
        this.team = team;
        this.tileXOnTurnStart = null;
        this.tileYOnTurnStart = null;
        this.characterClass = rank;
        this.walkingBar = new ProgressBar(RETRO_GAME_DATA["skirmish"]["distance_per_turn"][this.characterClass]);
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
        if (!this.isMakingAMove()){
            return;
        }
        super.updateMovement();
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

    getTeam(){
        return this.team;
    }

    isOnSameTeam(otherCharacter){
        return this.getTeam() == otherCharacter.getTeam();
    }

    isVisibleTo(observer){
        return observer.isOnSameTeam(this) || this.gamemode.visibleToTeam(observer.getTeam(), this.getTeam(), this.getID());
    }

    isVisibleToSuper(observer){
        return super.isVisibleTo(observer);
    }
    
    isMakingAMove(){
        return this.makingMove;
    }

    indicateTurn(){
        this.makingMove = true;
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
        if (!this.isMakingAMove()){ return; }
        this.inventory.tick();
        this.resetDecisions();
        this.makeMovementDecisions();
        this.inventory.makeDecisionsForSelectedItem();
    }

    makeMovementDecisions(){}
}