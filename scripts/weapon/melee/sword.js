class Sword extends Item {
    constructor(model, details){
        super(details);
        this.model = model;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        
        this.swinging = false;
        this.swingLock = new TickLock(RETRO_GAME_DATA["sword_data"][this.model]["swing_time_ms"] / RETRO_GAME_DATA["general"]["ms_between_ticks"]);
        this.swingFacing = null;
    }

    startSwing(){
        this.swinging = true;
        this.swingFacing = this.player.getFacingDirection();
        this.swingLock.resetAndLock();
    }

    finishSwing(){
        this.swinging = false;
        // Calculate what it hit
        let swingRange = RETRO_GAME_DATA["sword_data"]["arm_length"] + RETRO_GAME_DATA["sword_data"][this.model]["blade_length"];
        let swingHitbox = new CircleHitbox(swingRange);
        let hitCenterX = this.player.getInterpolatedTickX() + RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model]["swinging"][this.player.getFacingDirection()]["x_offset"];
        let hitCenterY = this.player.getInterpolatedTickY() - RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model]["swinging"][this.player.getFacingDirection()]["y_offset"];
        swingHitbox.update(hitCenterX, hitCenterY);

        let swingAngle;
        let playerDirection = this.player.getFacingDirection();
        if (playerDirection == "front"){
            swingAngle = toFixedRadians(270);
        }else if (playerDirection == "left"){
            swingAngle = toFixedRadians(180);
        }else if (playerDirection == "right"){
            swingAngle = toFixedRadians(0);
        }else if (playerDirection == "back"){
            swingAngle = toFixedRadians(90);
        }
        let rangeRAD = toFixedRadians(RETRO_GAME_DATA["sword_data"][this.getModel()]["swing_angle_range_deg"]);
        let startAngle = rotateCCWRAD(swingAngle, rangeRAD/2);
        let endAngle = rotateCWRAD(swingAngle, rangeRAD/2);
        //console.log(hitCenterX, hitCenterY, this.player.getInterpolatedTickX(), this.player.getInterpolatedTickY())
        let characters = this.getScene().getEntities();
        let hitCharacter = null;
        for (let [character, charID] of characters){
            if (character.getID() == this.player.getID() || character.isDead()){ continue; }
            let characterHitbox = character.getUpdatedHitbox();

            // If no collision ignore
            if (!characterHitbox.collidesWith(swingHitbox)){
                continue;
            }

            // So we know they collide so find out if applicable

            // if center within character square
            if (hitCenterX >= characterHitbox.getLeftX() && hitCenterX <= characterHitbox.getRightX() && hitCenterY >= characterHitbox.getBottomY() && hitCenterY <= characterHitbox.getTopY()){
                hitCharacter = character;
                break;
            }

            // if center within character square x but not y
            if (hitCenterX >= characterHitbox.getLeftX() && hitCenterX <= characterHitbox.getRightX()){
                let yOffsetTop = characterHitbox.getTopY() - hitCenterY;
                let yOffsetBottom = characterHitbox.getBottomY() - hitCenterY;

                if (yOffsetTop > 0 == Math.sin(swingAngle) > 0 && Math.abs(yOffsetTop) < swingRange){
                    hitCharacter = character;
                    break;
                }else if (yOffsetBottom > 0 == Math.sin(swingAngle) > 0 && Math.abs(yOffsetBottom) < swingRange){
                    hitCharacter = character;
                    break;
                }
            }

            // if center within character square y but not x
            if (hitCenterY >= characterHitbox.getBottomY() && hitCenterY <= characterHitbox.getTopY()){
                let xOffsetLeft = characterHitbox.getLeftX() - hitCenterX;
                let xOffsetRight = characterHitbox.getRightX() - hitCenterX;

                if (xOffsetLeft > 0 == Math.cos(swingAngle) > 0 && Math.abs(xOffsetLeft) < swingRange){
                    hitCharacter = character;
                    break;
                }else if (xOffsetRight > 0 == Math.cos(swingAngle) > 0 && Math.abs(xOffsetRight) < swingRange){
                    hitCharacter = character;
                    break;
                }
            }

            // Check each corner and center

            // Center
            let characterHitboxCenterX = characterHitbox.getCenterX();
            let characterHitboxCenterY = characterHitbox.getCenterY();
            let distanceToCenter = Math.sqrt(Math.pow(characterHitboxCenterX-hitCenterX, 2) + Math.pow(characterHitboxCenterY-hitCenterY, 2));
            let centerAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxCenterX-hitCenterX, characterHitboxCenterY-hitCenterY), startAngle, endAngle);
            if (distanceToCenter <= swingRange && centerAngleWithin){
                hitCharacter = character;
                break;
            }


            // Bottom Left
            let characterHitboxLeftX = characterHitbox.getLeftX();
            let characterHitboxBottomY = characterHitbox.getBottomY();
            let distanceToBottomLeft = Math.sqrt(Math.pow(characterHitboxLeftX-hitCenterX, 2) + Math.pow(characterHitboxBottomY-hitCenterY, 2));
            let bottomLeftAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxLeftX-hitCenterX, characterHitboxBottomY-hitCenterY), startAngle, endAngle);
            if (distanceToBottomLeft <= swingRange && bottomLeftAngleWithin){
                hitCharacter = character;
                break;
            }

            // Bottom Right
            let characterHitboxRightX = characterHitbox.getRightX();
            let distanceToBottomRight = Math.sqrt(Math.pow(characterHitboxRightX-hitCenterX, 2) + Math.pow(characterHitboxBottomY-hitCenterY, 2));
            let bottomRightAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxRightX-hitCenterX, characterHitboxBottomY-hitCenterY), startAngle, endAngle);
            if (distanceToBottomRight <= swingRange && bottomRightAngleWithin){
                hitCharacter = character;
                break;
            }

            // Top Left
            let characterHitboxTopY = characterHitbox.getTopY();
            let distanceToTopLeft = Math.sqrt(Math.pow(characterHitboxLeftX-hitCenterX, 2) + Math.pow(characterHitboxTopY-hitCenterY, 2));
            let topLeftAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxLeftX-hitCenterX, characterHitboxTopY-hitCenterY), startAngle, endAngle);
            if (distanceToTopLeft <= swingRange && topLeftAngleWithin){
                hitCharacter = character;
                break;
            }

            // Top Right
            let distanceToTopRight = Math.sqrt(Math.pow(characterHitboxRightX-hitCenterX, 2) + Math.pow(characterHitboxTopY-hitCenterY, 2));
            let topRightAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxRightX-hitCenterX, characterHitboxTopY-hitCenterY), startAngle, endAngle);
            if (distanceToTopRight <= swingRange && topRightAngleWithin){
                hitCharacter = character;
                break;
            }

            // Check edges of swing range
            let hitStartX = Math.cos(startAngle) * swingRange + hitCenterX;
            let hitStartY = Math.sin(startAngle) * swingRange + hitCenterY;
            if (hitStartX >= characterHitbox.getLeftX() && hitStartX <= characterHitbox.getRightX() && hitStartY >= characterHitbox.getBottomY() && hitStartY <= characterHitbox.getTopY()){
                hitCharacter = character;
                break;
            }

            let hitEndX = Math.cos(endAngle) * swingRange + hitCenterX;
            let hitEndY = Math.sin(endAngle) * swingRange + hitCenterY;
            if (hitEndX >= characterHitbox.getLeftX() && hitEndX <= characterHitbox.getRightX() && hitEndY >= characterHitbox.getBottomY() && hitEndY <= characterHitbox.getTopY()){
                hitCharacter = character;
                break;
            }

            // Check center of swing range
            let hitMiddleX = Math.cos(swingAngle) * swingRange + hitCenterX;
            let hitMiddleY = Math.sin(swingAngle) * swingRange + hitCenterY;
            if (hitMiddleX >= characterHitbox.getLeftX() && hitMiddleX <= characterHitbox.getRightX() && hitMiddleY >= characterHitbox.getBottomY() && hitMiddleY <= characterHitbox.getTopY()){
                hitCharacter = character;
                break;
            }
        }
        console.log(hitCharacter)
        if (hitCharacter == null){ return; }
        // Else hit a character
        hitCharacter.damage(RETRO_GAME_DATA["sword_data"][this.model]["swing_damage"]);
    }

    isSwinging(){
        return this.swinging;
    }

    cancelSwing(){
        this.swinging = false;
    }

    select(){}
    deselect(){
        if (this.isSwinging()){
            this.cancelSwing();
        }
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES[this.model];
        let displayScale = RETRO_GAME_DATA["inventory"]["slot_size"] / image.width;
        let scaleX = providedX + image.width / 2 * displayScale;
        let scaleY = providedY + image.height / 2 * displayScale;

        translate(scaleX, scaleY);

        scale(displayScale, displayScale);

        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);

        scale(1 / displayScale, 1 / displayScale);

        translate(-1 * scaleX, -1 * scaleY);
    }

    getModel(){
        return this.model;
    }

    getWidth(){
        return RETRO_GAME_DATA["sword_data"][this.model]["image_width"] * RETRO_GAME_DATA["sword_data"][this.model]["image_scale"];
    }

    getHeight(){
        return RETRO_GAME_DATA["sword_data"][this.model]["image_height"] * RETRO_GAME_DATA["sword_data"][this.model]["image_scale"];
    }

    getScene(){
        return this.player.getScene();
    }

    tick(){
        if (this.isSwinging()){
            // Note: Moving doesn't stop
            if (this.player.getFacingDirection() != this.swingFacing){
                this.cancelSwing();
            }else{
                this.swingLock.tick();
                if (this.swingLock.isUnlocked()){
                    this.finishSwing();   
                }
            }
        }
    }

    getBladeLength(){
        return RETRO_GAME_DATA["sword_data"][this.getModel()]["blade_length"];
    }

    display(lX, bY){
        let x = this.getImageX(lX); // player top left + offsetX
        let y = this.getImageY(bY); // player top left + offsetY
        let playerDirection = this.player.getFacingDirection();

        let image = IMAGES[this.model];
        let displayRotateAngleRAD;
        let atTheReady = RETRO_GAME_DATA["model_positions"]["at_the_ready_rotation"];
        let flipDirection = 1;

        // Based on player action
        if (this.isSwinging()){ // Swinging
            let rangeRAD = toFixedRadians(RETRO_GAME_DATA["sword_data"][this.getModel()]["swing_angle_range_deg"]);
            let positionalAngleRAD;
            if (playerDirection == "front"){
                displayRotateAngleRAD = toFixedRadians(270);
                positionalAngleRAD = toFixedRadians(270);
            }else if (playerDirection == "left"){
                displayRotateAngleRAD = toFixedRadians(180);
                positionalAngleRAD = toFixedRadians(180);
            }else if (playerDirection == "right"){
                displayRotateAngleRAD = toFixedRadians(0);
                positionalAngleRAD = toFixedRadians(0);
            }else if (playerDirection == "back"){
                displayRotateAngleRAD = toFixedRadians(90);
                positionalAngleRAD = toFixedRadians(90);
            }

            let startAngle = rotateCCWRAD(positionalAngleRAD, rangeRAD/2);

            let timePassedTick = (this.swingLock.getCooldown() - this.swingLock.getTicksLeft()) * RETRO_GAME_DATA["general"]["ms_between_ticks"];
            let timePassedNonTick = FRAME_COUNTER.getLastFrameTime() - TICK_SCHEDULER.getLastTickTime();
            let totalTimePassedMS = timePassedTick + timePassedNonTick;
            let proportion = totalTimePassedMS / RETRO_GAME_DATA["sword_data"][this.model]["swing_time_ms"];
            proportion = Math.min(1, Math.max(0, proportion));
            let hypotenuse = RETRO_GAME_DATA["sword_data"]["arm_length"] + RETRO_GAME_DATA["sword_data"][this.model]["image_width"] * RETRO_GAME_DATA["sword_data"][this.model]["image_scale"] / 2 - RETRO_GAME_DATA["sword_data"][this.model]["blade_length"];
            let currentSwingAngle = rotateCWRAD(startAngle, rangeRAD * proportion);

            let displayRotationAngleRange = toFixedRadians(RETRO_GAME_DATA["sword_data"][this.getModel()]["sword_rotation_deg"]);
            let displayRotationStartAngle = rotateCCWRAD(displayRotateAngleRAD, displayRotationAngleRange/2);
            displayRotateAngleRAD = rotateCWRAD(displayRotationStartAngle, displayRotationAngleRange*proportion);

            let swingXDisplacement = Math.cos(currentSwingAngle) * hypotenuse;
            let swingYDisplacement = Math.sin(currentSwingAngle) * hypotenuse;

            x += swingXDisplacement*gameZoom;
            y -= swingYDisplacement*gameZoom; // Not using game coordinates, using display
        }else{ // Normal
            if (playerDirection == "front" || playerDirection == "right"){
                displayRotateAngleRAD = toRadians(atTheReady);
            }else if (playerDirection == "back" || playerDirection == "left"){
                flipDirection = -1;
                displayRotateAngleRAD = toRadians(-1 * atTheReady);
            }
        }
        let imageScale = RETRO_GAME_DATA["sword_data"][this.model]["image_scale"];
        let effectiveScale = gameZoom * imageScale;
        let flipped = flipDirection < 0;
        let realImageWidth = RETRO_GAME_DATA["sword_data"][this.model]["image_width"];
        let realImageHeight = RETRO_GAME_DATA["sword_data"][this.model]["image_height"];
        // So right now x,y is the position of the character's hand

        let handleOffsetX = Math.cos(displayRotateAngleRAD) * (RETRO_GAME_DATA["sword_data"][this.model]["handle_offset_x"] * (flipped ? -1 : 1)) - Math.sin(displayRotateAngleRAD) * RETRO_GAME_DATA["sword_data"][this.model]["handle_offset_y"];
        let handleOffsetY = Math.sin(displayRotateAngleRAD) * (RETRO_GAME_DATA["sword_data"][this.model]["handle_offset_x"] * (flipped ? -1 : 1)) + Math.cos(displayRotateAngleRAD) * RETRO_GAME_DATA["sword_data"][this.model]["handle_offset_y"];
        
        let rotateX = x - handleOffsetX * effectiveScale;
        let rotateY = y + handleOffsetY * effectiveScale;

        // Display Sword
        translate(rotateX, rotateY);
        rotate(-1 * displayRotateAngleRAD);
        scale(flipDirection, 1);

        // Game zoom
        scale(effectiveScale, effectiveScale);

        // Display
        drawingContext.drawImage(image, 0 - realImageWidth / 2, 0 - realImageHeight / 2);

        // Game zoom
        scale(1 / effectiveScale, 1 / effectiveScale);

        scale(flipDirection, 1);
        rotate(displayRotateAngleRAD);
        translate(-1 * rotateX, -1 * rotateY);
    }

    getImageX(lX){
        let x = this.player.getDisplayX(lX);
        return x + RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model][this.isSwinging() ? "swinging" : "not_swinging"][this.player.getFacingDirection()]["x_offset"] * gameZoom - this.player.getWidth()/2 * gameZoom;
    }

    getImageY(bY){
        let y = this.player.getDisplayY(bY);
        return y + RETRO_GAME_DATA["model_positions"][this.player.getModel()][this.model][this.isSwinging() ? "swinging" : "not_swinging"][this.player.getFacingDirection()]["y_offset"] * gameZoom - this.player.getHeight()/2 * gameZoom;
    }

    static async loadAllImages(model){
        // Do not load if already exists
        if (objectHasKey(IMAGES, model)){ return; }
        await loadToImages(model, model + "/");
    }
}