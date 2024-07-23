class PointToMove extends Item {
    constructor(details){
        super(details);
        // Note: if player is null an error will occur I know I'm not handling this perfectly
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.moveTileX = this.player.getTileX();
    	this.moveTileY = this.player.getTileY();

        this.resetDecisions();
    }

    actOnDecisions(){
    	if (this.decisions["new_move_tile"]){
        	this.moveTileX = this.decisions["move_tile_x"];
        	this.moveTileY = this.decisions["move_tile_y"];
    	}
    	if (this.decisions["trying_to_move_troops"]){
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
    	this.moveTileX = this.player.getTileX();
    	this.moveTileY = this.player.getTileY();
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