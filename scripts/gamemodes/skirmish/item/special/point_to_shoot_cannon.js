class PointToShootCannon extends Item {
    constructor(details){
        super(details);
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.crosshairCenterX = 0;
        this.crosshairCenterY = 0;
        this.resetDecisions();
    }

    actOnDecisions(){
        if (this.decisions["new_crosshair_center"]){
            this.crosshairCenterX = this.decisions["crosshair_center_x"];
            this.crosshairCenterY = this.decisions["crosshair_center_y"];
        }
        if (this.decisions["trying_to_shoot"]){
            // TODO
        }
    }

    makeDecisions(){
        this.resetDecisions();
        let canvasX = mouseX;
        let canvasY = this.getScene().changeFromScreenY(mouseY);
        if (canvasX < 0 || canvasX >= this.getScene().getWidth() || canvasY < 0 || canvasY >= this.getScene().getHeight()){ return; }
        let engineX = canvasX + this.getScene().getLX();
        let engineY = canvasY + this.getScene().getBY();
        this.decisions = {
            "crosshair_center_x": engineX,
            "crosshair_center_y": engineY,
            "trying_to_shoot": USER_INPUT_MANAGER.isActivated("left_click_ticked"),
            "new_crosshair_center": true
        }
    }

    resetDecisions(){
        this.decisions = {
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "new_crosshair_center": false,
            "trying_to_shoot": false
        }
    }

    select(){}
    deselect(){
    }

    getScene(){
        return this.player.getScene();
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES["point_to_shoot_cannon"];
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
        let x = this.getScene().getDisplayXOfPoint(this.crosshairCenterX, lX);
        let y = this.getScene().getDisplayYOfPoint(this.crosshairCenterY, bY);
        console.log(x, y, lX, bY, this.crosshairCenterX, this.crosshairCenterY)
        let image = IMAGES["point_to_shoot_cannon_crosshair"];
        drawingContext.drawImage(image, x - image.width/2, y - image.height/2);
    }
}