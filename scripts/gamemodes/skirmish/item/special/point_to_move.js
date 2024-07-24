class PointToMove extends Item {
    constructor(details){
        super(details);
        // Note: if player is null an error will occur I know I'm not handling this perfectly
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.moveTileX = this.player.getTileX();
    	this.moveTileY = this.player.getTileY();

        this.selectionlastUpdatedTurn = -1;
        this.selectedTroops = [];

        this.resetDecisions();
    }

    getSelectedTroops(){
        return this.selectedTroops;
    }

    actOnDecisions(){
    	if (this.decisions["new_move_tile"]){
        	this.moveTileX = this.decisions["move_tile_x"];
        	this.moveTileY = this.decisions["move_tile_y"];
    	}
    	if (this.decisions["trying_to_move_troops"] && !this.player.hasCommitedToAction() && this.selectedTroops.length > 0){
            this.player.commitToAction();
            // TODO
    	}
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
        let engineX = canvasX + this.getScene().getLX();
        let engineY = canvasY + this.getScene().getBY();
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
        if (newTurn == this.selectionlastUpdatedTurn){
            return;
        }
        this.selectionlastUpdatedTurn = newTurn;
    	this.moveTileX = this.player.getTileX();
    	this.moveTileY = this.player.getTileY();
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
    }

    display(lX, bY){
    	let x = this.getScene().getDisplayXFromTileX(lX, this.moveTileX);
        let y = this.getScene().getDisplayYFromTileY(bY, this.moveTileY);
        drawingContext.drawImage(IMAGES["point_to_move_crosshair"], x, y);
    }
}