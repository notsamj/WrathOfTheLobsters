/*
    Class Name: Musket
    Class Description: A musket
*/

class Sword extends MeleeWeapon {
    /*
        Method Name: constructor
        Method Parameters: 
            model:
                Model of the sword (string)
            details:
                JSON details with extra information
        Method Description: constructor
        Method Return: constructor
    */
    constructor(model, details){
        super();
        this.model = model;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        
        this.swinging = false;
        this.swingStartTick = null;
        this.swingLock = new TickLock(this.getSwingTimeMS() / calculateMSBetweenTicks());
        this.swingFacing = null;
        this.swingCooldownLock = new TickLock(this.getSwingCooldownMS() / calculateMSBetweenTicks());

        this.blocking = false;
        this.blockStartTick = null;
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the sword (usually) on equip
        Method Return: void
    */
    reset(){
        this.swinging = false;
        this.swingStartTick = null;
        this.swingLock.restoreDefault();
        this.swingFacing = null;
        this.swingCooldownLock.restoreDefault();

        this.blocking = false;
        this.blockStartTick = null;
    }

    /*
        Method Name: getSwingCooldownMS
        Method Parameters: None
        Method Description: Fetches the cooldown for this sword model
        Method Return: int
    */
    getSwingCooldownMS(){
        return WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["swing_cooldown_ms"];
    }

    /*
        Method Name: getSwingTimeMS
        Method Parameters: None
        Method Description: Fetches the cooldown for this sword model
        Method Return: int
    */
    getSwingTimeMS(){
        return WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["swing_time_ms"];
    }

    /*
        Method Name: startBlocking
        Method Parameters: None
        Method Description: Starts blocking with the sword
        Method Return: void
    */
    startBlocking(){
        this.blocking = true;
        this.blockStartTick = this.getPlayer().getGamemode().getCurrentTick();
    }

    /*
        Method Name: getSwingStartTick
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getSwingStartTick(){
        return this.swingStartTick;
    }

    /*
        Method Name: getBlockStartTick
        Method Parameters: Getter
        Method Description: Getter
        Method Return: int
    */
    getBlockStartTick(){
        return this.blockStartTick;
    }

    /*
        Method Name: getPlayer
        Method Parameters: None
        Method Description: Getter
        Method Return: Character
    */
    getPlayer(){
        return this.player;
    }

    /*
        Method Name: resetDecisions
        Method Parameters: None
        Method Description: Resets the sword decisions
        Method Return: void
    */
    resetDecisions(){
        this.getPlayer().amendDecisions({
            "trying_to_swing_sword": false
        });
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Tells player to make sword decisions
        Method Return: void
    */
    makeDecisions(){
        this.getPlayer().makeSwordDecisions();
    }

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Takes actions based on decisions
        Method Return: void
    */
    actOnDecisions(){
        let tryingToSwing = this.getDecision("trying_to_swing_sword");
        if (tryingToSwing && !this.isSwinging() && !this.isBlocking() && this.getPlayer().getStaminaBar().hasStamina() && this.swingCooldownLock.isReady()){
            this.startSwing();
        }
        let tryingToBlock = this.getDecision("trying_to_block");
        if (tryingToBlock && !tryingToSwing && !this.isSwinging() && !this.isBlocking() && this.getPlayer().getStaminaBar().hasStamina()){
            this.startBlocking();
        }

        if (!tryingToBlock && this.isBlocking()){
            this.stopBlocking();
        }
    }

    /*
        Method Name: startSwing
        Method Parameters: None
        Method Description: Starts a sword swing
        Method Return: void
    */
    startSwing(){
        this.getPlayer().getStaminaBar().useStamina(WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["stamina_usage_for_swing"]);
        this.swinging = true;
        this.swingCooldownLock.lock();
        this.swingStartTick = this.getPlayer().getGamemode().getCurrentTick();
        this.swingFacing = this.getPlayer().getFacingDirection();
        this.swingLock.resetAndLock();
    }

    /*
        Method Name: getSwingRange
        Method Parameters: None
        Method Description: Gets the sword swing range
        Method Return: number
    */
    getSwingRange(){
        return WTL_GAME_DATA["sword_data"]["arm_length"] + WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["blade_length"];
    }

    /*
        Method Name: getSwingCenterX
        Method Parameters:
            playerLeftX:
                The left x of the player
            facingDirection:
                The facing direction of the player (visual)
        Method Description: Gets the center x of the sword swing
        Method Return: float
    */
    getSwingCenterX(playerLeftX=this.getPlayer().getInterpolatedTickX(), facingDirection=this.getPlayer().getFacingDirection()){
        return playerLeftX + WTL_GAME_DATA["model_positions"][this.getPlayer().getModelCategory()][this.getModel()]["swinging"][facingDirection]["x_offset"];
    }

    /*
        Method Name: getSwingCenterY
        Method Parameters:
            playerTopY:
                The top y of the player
            facingDirection:
                The facing direction of the player (visual)
        Method Description: Gets the center y of the sword swing
        Method Return: float
    */
    getSwingCenterY(playerTopY=this.getPlayer().getInterpolatedTickY(), facingDirection=this.getPlayer().getFacingDirection()){
        return playerTopY - WTL_GAME_DATA["model_positions"][this.getPlayer().getModelCategory()][this.getModel()]["swinging"][facingDirection]["y_offset"];
    }

    /*
        Method Name: swordCanHitCharacter
        Method Parameters: 
            characterHitbox:
                A hitbox of a character (Hitbox)
            swingHitbox:
                A hitbox of the swing (Hitbox)
            hitCenterX:
                The center x of the swing hitbox (number)
            hitCenterY:
                The center y of the swing hitbox (number)
            swingAngle:
                The angle of swing (radian)
            swingRange:
                The range of the swing (number)
            startAngle:
                The starting angle of the swing (radian)
            endAngle:
                The ending angle of the swing (radian)
        Method Description: Checks if the sword can hit a character given the parameters
        Method Return: boolean
    */
    static swordCanHitCharacter(characterHitbox, swingHitbox, hitCenterX, hitCenterY, swingAngle, swingRange, startAngle, endAngle){
        // If no collision ignore
        if (!characterHitbox.collidesWith(swingHitbox)){
            return false;
        }

        // So we know they collide so find out if applicable

        // if center within character square
        if (hitCenterX >= characterHitbox.getLeftX() && hitCenterX <= characterHitbox.getRightX() && hitCenterY >= characterHitbox.getBottomY() && hitCenterY <= characterHitbox.getTopY()){
            return true;
        }

        // if center within character square x but not y
        if (hitCenterX >= characterHitbox.getLeftX() && hitCenterX <= characterHitbox.getRightX()){
            let yOffsetTop = characterHitbox.getTopY() - hitCenterY;
            let yOffsetBottom = characterHitbox.getBottomY() - hitCenterY;

            if (yOffsetTop > 0 == Math.sin(swingAngle) > 0 && Math.abs(yOffsetTop) < swingRange){
                return true;
            }else if (yOffsetBottom > 0 == Math.sin(swingAngle) > 0 && Math.abs(yOffsetBottom) < swingRange){
                return true;
            }
        }

        // if center within character square y but not x
        if (hitCenterY >= characterHitbox.getBottomY() && hitCenterY <= characterHitbox.getTopY()){
            let xOffsetLeft = characterHitbox.getLeftX() - hitCenterX;
            let xOffsetRight = characterHitbox.getRightX() - hitCenterX;

            if (xOffsetLeft > 0 == Math.cos(swingAngle) > 0 && Math.abs(xOffsetLeft) < swingRange){
                return true;
            }else if (xOffsetRight > 0 == Math.cos(swingAngle) > 0 && Math.abs(xOffsetRight) < swingRange){
                return true;
            }
        }

        // Check each corner and center

        // Center
        let characterHitboxCenterX = characterHitbox.getCenterX();
        let characterHitboxCenterY = characterHitbox.getCenterY();
        let distanceToCenter = Math.sqrt(Math.pow(characterHitboxCenterX-hitCenterX, 2) + Math.pow(characterHitboxCenterY-hitCenterY, 2));
        let centerAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxCenterX-hitCenterX, characterHitboxCenterY-hitCenterY), startAngle, endAngle);
        if (distanceToCenter <= swingRange && centerAngleWithin){
            return true;
        }


        // Bottom Left
        let characterHitboxLeftX = characterHitbox.getLeftX();
        let characterHitboxBottomY = characterHitbox.getBottomY();
        let distanceToBottomLeft = Math.sqrt(Math.pow(characterHitboxLeftX-hitCenterX, 2) + Math.pow(characterHitboxBottomY-hitCenterY, 2));
        let bottomLeftAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxLeftX-hitCenterX, characterHitboxBottomY-hitCenterY), startAngle, endAngle);
        if (distanceToBottomLeft <= swingRange && bottomLeftAngleWithin){
            return true;
        }

        // Bottom Right
        let characterHitboxRightX = characterHitbox.getRightX();
        let distanceToBottomRight = Math.sqrt(Math.pow(characterHitboxRightX-hitCenterX, 2) + Math.pow(characterHitboxBottomY-hitCenterY, 2));
        let bottomRightAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxRightX-hitCenterX, characterHitboxBottomY-hitCenterY), startAngle, endAngle);
        if (distanceToBottomRight <= swingRange && bottomRightAngleWithin){
            return true;
        }

        // Top Left
        let characterHitboxTopY = characterHitbox.getTopY();
        let distanceToTopLeft = Math.sqrt(Math.pow(characterHitboxLeftX-hitCenterX, 2) + Math.pow(characterHitboxTopY-hitCenterY, 2));
        let topLeftAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxLeftX-hitCenterX, characterHitboxTopY-hitCenterY), startAngle, endAngle);
        if (distanceToTopLeft <= swingRange && topLeftAngleWithin){
            return true;
        }

        // Top Right
        let distanceToTopRight = Math.sqrt(Math.pow(characterHitboxRightX-hitCenterX, 2) + Math.pow(characterHitboxTopY-hitCenterY, 2));
        let topRightAngleWithin = angleBetweenCWRAD(displacementToRadians(characterHitboxRightX-hitCenterX, characterHitboxTopY-hitCenterY), startAngle, endAngle);
        if (distanceToTopRight <= swingRange && topRightAngleWithin){
            return true;
        }

        // Check edges of swing range
        let hitStartX = Math.cos(startAngle) * swingRange + hitCenterX;
        let hitStartY = Math.sin(startAngle) * swingRange + hitCenterY;
        if (hitStartX >= characterHitbox.getLeftX() && hitStartX <= characterHitbox.getRightX() && hitStartY >= characterHitbox.getBottomY() && hitStartY <= characterHitbox.getTopY()){
            return true;
        }

        let hitEndX = Math.cos(endAngle) * swingRange + hitCenterX;
        let hitEndY = Math.sin(endAngle) * swingRange + hitCenterY;
        if (hitEndX >= characterHitbox.getLeftX() && hitEndX <= characterHitbox.getRightX() && hitEndY >= characterHitbox.getBottomY() && hitEndY <= characterHitbox.getTopY()){
            return true;
        }

        // Check center of swing range
        let hitMiddleX = Math.cos(swingAngle) * swingRange + hitCenterX;
        let hitMiddleY = Math.sin(swingAngle) * swingRange + hitCenterY;
        if (hitMiddleX >= characterHitbox.getLeftX() && hitMiddleX <= characterHitbox.getRightX() && hitMiddleY >= characterHitbox.getBottomY() && hitMiddleY <= characterHitbox.getTopY()){
            return true;
        }

        // Otherwise no
        return false;
    }

    /*
        Method Name: getSwingAngle
        Method Parameters: 
            characterFacingDirection:
                The facing direction of a character (visual) (string)
        Method Description: Gets the swing angle
        Method Return: float (radians)
    */
    static getSwingAngle(characterFacingDirection){
        if (characterFacingDirection == "front"){
            return toFixedRadians(270);
        }else if (characterFacingDirection == "left"){
            return toFixedRadians(180);
        }else if (characterFacingDirection == "right"){
            return toFixedRadians(0);
        }else if (characterFacingDirection == "back"){
            return toFixedRadians(90);
        }
        throw new Error("Invalid character facing direction: " + characterFacingDirection);
    }

    /*
        Method Name: facingTheRightDirectionToBlock
        Method Parameters: 
            victimMovementDirection:
                The movement direction of the sword victim (string)
            attackerToDefenderDisplacementX:
                The displcement from attacker to victim (x)
            attackerToDefenderDisplacementY:
                The displcement from attacker to victim (y)
        Method Description: Checks if the victim is facing the correct direction in order to block a sword swing
        Method Return: boolean
    */
    static facingTheRightDirectionToBlock(victimMovementDirection, attackerToDefenderDisplacementX, attackerToDefenderDisplacementY){
        // attackerToDefenderDisplacementX: > 0 attacker is to the right < 0 attacker is to the left
        // attackerToDefenderDisplacementY: > 0 attacker is above < 0 attacker is below

        // Attacker is above and defender is facing up then they can block
        if (victimMovementDirection === "up" && attackerToDefenderDisplacementY > 0){
            return true;
        }
        // Attacker is below and defender is facing down then they can block
        else if (victimMovementDirection === "down" && attackerToDefenderDisplacementY < 0){
            return true;
        }
        // Attacker is to the right and defender is facing right then they can block
        else if (victimMovementDirection === "right" && attackerToDefenderDisplacementX > 0){
            return true;
        }
        // Attacker is to the left and defender is facing left then they can block
        else if (victimMovementDirection === "left" && attackerToDefenderDisplacementX < 0){
            return true;
        }
        // If they are in the asme position then direction doesn't matter
        else if (attackerToDefenderDisplacementX === 0 && attackerToDefenderDisplacementY === 0){
            return true;
        }
        // Otherwise not facing the right direction
        return false;
    }

    /*
        Method Name: getSwingAngleRangeRAD
        Method Parameters: None
        Method Description: Generates the angle range for a swing
        Method Return: float (radians)
    */
    getSwingAngleRangeRAD(){
        return toFixedRadians(WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["swing_angle_range_deg"]);
    }

    /*
        Method Name: finishSwing
        Method Parameters:
            exclusionFunction:
                A function that takes a character as parameter and returns true -> is exempted from being hit, false -> can be hit
        Method Description: Hits nearby player with sword if one is present
        Method Return: void
    */
    finishSwing(exclusionFunction=(character)=>{ return false; }){
        this.swinging = false;

        // Calculate what it hit
        let swingRange = this.getSwingRange();
        let swingHitbox = new CircleHitbox(swingRange);
        let hitCenterX = this.getSwingCenterX();
        let hitCenterY = this.getSwingCenterY();
        swingHitbox.update(hitCenterX, hitCenterY);

        let playerDirection = this.getPlayer().getFacingDirection();
        let swingAngle = Sword.getSwingAngle(playerDirection);
        let rangeRAD = this.getSwingAngleRangeRAD();
        let startAngle = rotateCCWRAD(swingAngle, rangeRAD/2);
        let endAngle = rotateCWRAD(swingAngle, rangeRAD/2);
        let characters = this.getScene().getEntities();
        let hitCharacter = null;
        for (let [character, charID] of characters){
            if (character.getID() === this.getPlayer().getID() || character.isDead() || exclusionFunction(character)){ continue; }
            let characterHitbox = character.getUpdatedHitbox();

            // If the sword can hit then you have found the character
            if (Sword.swordCanHitCharacter(characterHitbox, swingHitbox, hitCenterX, hitCenterY, swingAngle, swingRange, startAngle, endAngle)){
                hitCharacter = character;
                break;
            }
        }
        if (hitCharacter === null){ return; }

        // Idea: Make sure it doesn't in the case where ATTACKER was on the same tile as DEFENDER but moves off as swinging 

        // Else hit a character
        let damageToDeal = this.getSwingDamage();
        let victimStunTicks = 0;
        let staminaToDrain = 0; // Zero if not blocking, otherwise another number
        let soundToPlay = "slashing";

        // Check for blocking
        let hitCharacterHeldWeapon = hitCharacter.getSelectedItem();
        let victimHoldingASword = hitCharacterHeldWeapon instanceof Sword;

        let blocking = false;
        let isDeflected = false;
        let stunsAttacker = false;

        let myCharacterCenterX = this.getPlayer().getInterpolatedTickCenterX();
        let myCharacterCenterY = this.getPlayer().getInterpolatedTickCenterY();

        if (victimHoldingASword){
            // If blocking properly 

            // Check if direction is right
            let ableToBlock = Sword.facingTheRightDirectionToBlock(getMovementDirectionOf(hitCharacter.getFacingDirection()), myCharacterCenterX - hitCharacter.getInterpolatedTickCenterX(), myCharacterCenterY - hitCharacter.getInterpolatedTickCenterY());
            // Check if its blocking
            blocking = ableToBlock && hitCharacterHeldWeapon.isBlocking();
            if (blocking){
                // Compare the blades
                let attackerLength = this.getBladeLength();
                let defenderLength = hitCharacterHeldWeapon.getBladeLength();
                let defenderBladeIsAContender = defenderLength >= attackerLength;

                // Check when block started
                let blockStartTick = hitCharacterHeldWeapon.getBlockStartTick();

                // Check when swing start
                let swingStartTick = this.getSwingStartTick();
                let swingTotalLengthInTicks = Math.ceil(this.getSwingTimeMS() / calculateMSBetweenTicks());
                let blockStartTickGenerous = blockStartTick + 1; // Give them an extra tick to start block for the proportion reason
                // Note: May be > 1?
                let swingProportionCompletedWhenBlockStarted = (blockStartTick + 1 - swingStartTick) / swingTotalLengthInTicks;

                isDeflected = swingProportionCompletedWhenBlockStarted >= WTL_GAME_DATA["sword_data"]["blocking"]["deflect_proportion"];
                stunsAttacker = swingProportionCompletedWhenBlockStarted >= WTL_GAME_DATA["sword_data"]["blocking"]["stun_deflect_proportion"];
                // Stun also requires a contender blade
                stunsAttacker = stunsAttacker && defenderBladeIsAContender;

                // If the block started as a reaction and the blade contends in length
                if (isDeflected && defenderBladeIsAContender){
                    damageToDeal *= WTL_GAME_DATA["sword_data"]["blocking"]["deflect_damage"]; // Blocks all damage
                    staminaToDrain = WTL_GAME_DATA["sword_data"]["blocking"]["deflect_contender_stamina_drain"];
                    soundToPlay = "longer_deflect";
                }
                // If the block started as a reaction but the defending blade is shorter
                else if (isDeflected){
                    damageToDeal *= WTL_GAME_DATA["sword_data"]["blocking"]["deflect_damage"]; // Blocks all damage
                    staminaToDrain = WTL_GAME_DATA["sword_data"]["blocking"]["deflect_shorter_stamina_drain"];
                    soundToPlay = "shorter_deflect";
                }
                // If the block started prior to the swing and the blade contends in length
                else if (defenderBladeIsAContender){
                    damageToDeal *= WTL_GAME_DATA["sword_data"]["blocking"]["block_damage"];
                    staminaToDrain = WTL_GAME_DATA["sword_data"]["blocking"]["block_contender_stamina_drain"];
                    soundToPlay = "longer_block";
                }
                // If the block started prior to the swing and the defending blade is shorter
                else{
                    damageToDeal *= WTL_GAME_DATA["sword_data"]["blocking"]["block_damage"];
                    staminaToDrain = WTL_GAME_DATA["sword_data"]["blocking"]["block_shorter_stamina_drain"];
                    soundToPlay = "shorter_block";
                }
            }
            // No block
            else{
                victimStunTicks = Math.ceil(WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["stun_time_ms"] / calculateMSBetweenTicks());
            }
        }

        // Apply damage and stamina drain to victim
        hitCharacter.damage(damageToDeal);
        hitCharacter.stun(victimStunTicks);
        hitCharacter.getStaminaBar().useStamina(staminaToDrain);

        // Do stun if applicable
        if (stunsAttacker){
            this.player.stun(Math.ceil(WTL_GAME_DATA["sword_data"]["blocking"]["stun_time_ms"] / WTL_GAME_DATA["general"]["ms_between_ticks"]));
        }

        // If the hit character still is alive and has stamina remove the block if it runs out now
        if (hitCharacter.isAlive() && victimHoldingASword && hitCharacterHeldWeapon.isBlocking() && hitCharacter.getStaminaBar().isOutOfStamina()){
            hitCharacterHeldWeapon.stopBlocking();
        }

        // Play sound associated with sword swing
        this.getGamemode().getEventHandler().emit({
            "name": "sword_swing",
            "associated_sound_name": soundToPlay,
            "x": hitCenterX,
            "y": hitCenterY
        });

        // Do visual effects
        if (stunsAttacker){
            this.getGamemode().getEventHandler().emit({
                "name": "sword_sparks",
                "spark_type": "stun_deflect",
                "x": hitCenterX,
                "y": hitCenterY
            });
        }else if (isDeflected){
            this.getGamemode().getEventHandler().emit({
                "name": "sword_sparks",
                "spark_type": "deflect",
                "x": hitCenterX,
                "y": hitCenterY
            });
        }else if (blocking){
            this.getGamemode().getEventHandler().emit({
                "name": "sword_sparks",
                "spark_type": "block",
                "x": hitCenterX,
                "y": hitCenterY
            });
        }

        // If the hit character died as a result of the hit
        if (hitCharacter.isDead()){
            // Assumes not dead prior to damage
            this.getGamemode().getEventHandler().emit({
                "victim_class": hitCharacter.getModel(),
                "killer_class": this.getPlayer().getModel(),
                "killer_id": this.getPlayer().getID(),
                "tile_x": hitCharacter.getTileX(),
                "tile_y": hitCharacter.getTileY(),
                "name": "kill"
            });
        }
    }

    /*
        Method Name: getSwingDamage
        Method Parameters: None
        Method Description: Gets the sword swing damage
        Method Return: number
    */
    getSwingDamage(){
        return WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["swing_damage"];
    }

    /*
        Method Name: isSwinging
        Method Parameters: None
        Method Description: Checks if the sword is swinging
        Method Return: boolean
    */
    isSwinging(){
        return this.swinging;
    }

    /*
        Method Name: cancelSwing
        Method Parameters: None
        Method Description: Cancels the current swing
        Method Return: void
    */
    cancelSwing(){
        this.swinging = false;
    }

    /*
        Method Name: breakAction
        Method Parameters: None
        Method Description: Breaks the current action
        Method Return: void
    */
    breakAction(){
        this.cancelSwing();
    }

    /*
        Method Name: select
        Method Parameters: None
        Method Description: handles action on item select
        Method Return: void
    */
    select(){}
    /*
        Method Name: deselect
        Method Parameters: None
        Method Description: handles action on item deselect
        Method Return: void
    */
    deselect(){
        this.breakAction();
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
        let image = IMAGES[this.getModel()];
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
        Method Name: getModel
        Method Parameters: None
        Method Description: Gets the sword model
        Method Return: string
    */
    getModel(){
        return this.model;
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Gets the sword width
        Method Return: number
    */
    getWidth(){
        return WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_width"] * WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_scale"];
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Gets the sword height
        Method Return: number
    */
    getHeight(){
        return WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_height"] * WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_scale"];
    }

    /*
        Method Name: getScene
        Method Parameters: None
        Method Description: Gets the player's scene
        Method Return: WTLGameScene
    */
    getScene(){
        return this.getPlayer().getScene();
    }

    /*
        Method Name: getSwingFacingDirection
        Method Parameters: None
        Method Description: Gets the facing direction of the swing
        Method Return: visual direction (string)
    */
    getSwingFacingDirection(){
        return this.swingFacing;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick processes
        Method Return: void
    */
    tick(){
        // Check swing/block
        if (this.isSwinging()){
            // Note: Moving doesn't stop
            if (!areDirectionsEqual(this.getPlayer().getFacingDirection(), this.getSwingFacingDirection())){
                this.cancelSwing();
            }else{
                this.swingLock.tick();
                if (this.swingLock.isUnlocked()){
                    this.finishSwing();   
                }
            }
        }else if (this.isBlocking()){
            if (this.getPlayer().getStaminaBar().isOutOfStamina()){
                this.stopBlocking();
            }
        }

        // Make sure swing cooldown is going down when not swinging
        if (!this.isSwinging()){
            this.swingCooldownLock.tick();
        }
    }

    /*
        Method Name: stopBlocking
        Method Parameters: None
        Method Description: Stops blocking
        Method Return: void
    */
    stopBlocking(){
        this.blocking = false;
    }

    /*
        Method Name: isBlocking
        Method Parameters: None
        Method Description: Checks if blocking
        Method Return: boolean
    */
    isBlocking(){
        return this.blocking;
    }

    /*
        Method Name: getBladeLength
        Method Parameters: None
        Method Description: Gets the blade length
        Method Return: number
    */
    getBladeLength(){
        return WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["blade_length"];
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x coordinate of the left side of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Displays the sword
        Method Return: void
    */
    display(lX, bY){
        let x = this.getImageX(lX); // player top left + offsetX
        let y = this.getImageY(bY); // player top left + offsetY
        let playerDirection = this.getPlayer().getFacingDirection();

        let image = IMAGES[this.getModel()];
        let displayRotateAngleRAD;
        let blockingAngle = WTL_GAME_DATA["model_positions"]["blocking_rotation"];
        let readyRotationDEG = WTL_GAME_DATA["model_positions"]["holding_rotation_sword"];
        let flipDirection = 1;

        // Based on player action
        if (this.isSwinging()){ // Swinging
            let rangeRAD = toFixedRadians(WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["swing_angle_range_deg"]);
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

            let timePassedTick = (this.swingLock.getCooldown() - this.swingLock.getTicksLeft()) * WTL_GAME_DATA["general"]["ms_between_ticks"];
            let timePassedNonTick = FRAME_COUNTER.getLastFrameTime() - GAME_TICK_SCHEDULER.getLastTickTime();
            let totalTimePassedMS = timePassedTick + timePassedNonTick;
            let proportion = totalTimePassedMS / this.getSwingTimeMS();
            proportion = Math.min(1, Math.max(0, proportion));
            let hypotenuse = WTL_GAME_DATA["sword_data"]["arm_length"] + WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_width"] * WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_scale"] / 2 - WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["blade_length"];
            let currentSwingAngle = rotateCWRAD(startAngle, rangeRAD * proportion);

            let displayRotationAngleRange = toFixedRadians(WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["sword_rotation_deg"]);
            let displayRotationStartAngle = rotateCCWRAD(displayRotateAngleRAD, displayRotationAngleRange/2);
            displayRotateAngleRAD = rotateCWRAD(displayRotationStartAngle, displayRotationAngleRange*proportion);

            let swingXDisplacement = Math.cos(currentSwingAngle) * hypotenuse;
            let swingYDisplacement = Math.sin(currentSwingAngle) * hypotenuse;

            x += swingXDisplacement*gameZoom;
            y -= swingYDisplacement*gameZoom; // Not using game coordinates, using display
        }
        // Else if blocking
        else if (this.isBlocking()){
            if (playerDirection === "front" || playerDirection === "right"){
                displayRotateAngleRAD = toRadians(blockingAngle);
            }else if (playerDirection === "back" || playerDirection === "left"){
                flipDirection = -1;
                displayRotateAngleRAD = toRadians(-1 * blockingAngle);
            }
        }
        // Normal sword display
        else{
            if (playerDirection === "front" || playerDirection === "right"){
                displayRotateAngleRAD = toRadians(readyRotationDEG);
            }else if (playerDirection === "back" || playerDirection === "left"){
                flipDirection = -1;
                displayRotateAngleRAD = toRadians(-1 * readyRotationDEG);
            }
        }
        let imageScale = WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_scale"];
        let effectiveScale = gameZoom * imageScale;
        let flipped = flipDirection < 0;
        let realImageWidth = WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_width"];
        let realImageHeight = WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["image_height"];
        // So right now x,y is the position of the character's hand

        let handleOffsetX = Math.cos(displayRotateAngleRAD) * (WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["handle_offset_x"] * (flipped ? -1 : 1)) - Math.sin(displayRotateAngleRAD) * WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["handle_offset_y"];
        let handleOffsetY = Math.sin(displayRotateAngleRAD) * (WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["handle_offset_x"] * (flipped ? -1 : 1)) + Math.cos(displayRotateAngleRAD) * WTL_GAME_DATA["sword_data"]["swords"][this.getModel()]["handle_offset_y"];
        
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

    /*
        Method Name: getImageX
        Method Parameters: 
            lX:
                The x coordinate of the left side of the screen
        Method Description: Determines the x position of the gun image when displaying
        Method Return: number
    */
    getImageX(lX){
        let x = this.getPlayer().getDisplayX(lX);
        return x + WTL_GAME_DATA["model_positions"][this.getPlayer().getModelCategory()][this.getModel()][this.isSwinging() ? "swinging" : "not_swinging"][this.getPlayer().getFacingDirection()]["x_offset"] * gameZoom - this.getPlayer().getWidth()/2 * gameZoom;
    }

    /*
        Method Name: getImageY
        Method Parameters: 
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Determines the y position of the gun image when displaying
        Method Return: number
    */
    getImageY(bY){
        let y = this.getPlayer().getDisplayY(bY);
        return y + WTL_GAME_DATA["model_positions"][this.getPlayer().getModelCategory()][this.getModel()][this.isSwinging() ? "swinging" : "not_swinging"][this.getPlayer().getFacingDirection()]["y_offset"] * gameZoom - this.getPlayer().getHeight()/2 * gameZoom;
    }


    /*
        Method Name: loadAllImagesOfModel
        Method Parameters: 
            model:
                A gun model (string)
        Method Description: Loads all pictures of a sword model
        Method Return: Promise (implicit)
    */
    static async loadAllImagesOfModel(model){
        // Do not load if already exists
        if (objectHasKey(IMAGES, model)){ return; }
        if (!objectHasKey(WTL_GAME_DATA["sword_data"]["swords"][model], "alternate_url")){
            await loadToImages(model, "item/weapon/sword/" + model + "/");
        }else{
            await loadToImages(model, WTL_GAME_DATA["sword_data"]["swords"][model]["alternate_url"] + model + "/");
        }
    }

    /*
        Method Name: loadAllImages
        Method Parameters: None
        Method Description: Loads all images of a sword
        Method Return: Promise (implicit)
    */
    static async loadAllImages(){
        for (let swordModel of Object.keys(WTL_GAME_DATA["sword_data"]["swords"])){
            await Sword.loadAllImagesOfModel(swordModel);
        }
    }
}