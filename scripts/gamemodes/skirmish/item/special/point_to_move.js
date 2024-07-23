class PointToMove extends Item {
    constructor(details){
        super(details);
        this.player = objectHasKey(details, "player") ? details["player"] : null;

        this.resetDecisions();
    }

    actOnDecisions(){
    }

    resetDecisions(){
        this.decisions = {
        }
    }

    select(){}
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
    }
}