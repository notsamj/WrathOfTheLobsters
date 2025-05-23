/*  
    Class Name: PointToMove
    Class Description: A took for indicating a place for troops to move
*/
class PointToShootCannon extends Item {
    /*
        Method Name: constructor
        Method Parameters: 
            details:
                JSON object with information
        Method Description: constructor
        Method Return: constructor
    */
    constructor(details){
        super();
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.crosshairCenterX = 0;
        this.crosshairCenterY = 0;
        this.unlocksAtTurnNumber = this.getGamemode().getTurnCounter() + WTL_GAME_DATA["cannon"]["turn_cooldown"] * 2;
    }

    /*
        Method Name: resetDecisions
        Method Parameters: None
        Method Description: Resets the decisions
        Method Return: void
    */
    resetDecisions(){
        this.player.amendDecisions({
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "new_crosshair_center": false,
            "trying_to_shoot": false
        });
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Indicates that the player should make move cannon pointer decisions
        Method Return: void
    */
    makeDecisions(){
        this.player.makeCannonPointerDecisions();
    }

    /*
        Method Name: getGamemode
        Method Parameters: None
        Method Description: Gets the player's gamemode
        Method Return: Skirmish instance
    */
    getGamemode(){
        return this.player.getGamemode();
    }

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Acts on decisions
        Method Return: void
    */
    actOnDecisions(){
        if (this.getDecision("new_crosshair_center")){
            this.crosshairCenterX = this.getDecision("crosshair_center_x");
            this.crosshairCenterY = this.getDecision("crosshair_center_y");
        }
        if (this.getDecision("trying_to_shoot") && this.player.isMakingAMove() && !this.player.hasCommitedToAction() && !this.isOnCooldown()){
            this.player.commitToAction();
            this.shootCannon();
            this.player.indicateMoveDone();
        }
    }

    /*
        Method Name: shootCannon
        Method Parameters: None
        Method Description: Shoots the cannon
        Method Return: void
    */
    shootCannon(){
        let scene = this.player.getScene();

        let aimToHitX = this.crosshairCenterX;
        let aimToHitY = this.crosshairCenterY;
        let playerSpawn = this.player.getGamemode().getSpawnObjectByName(this.player.getTeamName());
        
        let cannonOriginTileX = playerSpawn["x"];
        let cannonOriginTileY = playerSpawn["y"];
        let cannonOriginX = scene.getCenterXOfTile(cannonOriginTileX);
        let cannonOriginY = scene.getCenterYOfTile(cannonOriginTileY);

        let distanceToHitLocation = calculateEuclideanDistance(aimToHitX, aimToHitY, cannonOriginX, cannonOriginY);
        let distanceOffInTiles = distanceToHitLocation/WTL_GAME_DATA["general"]["tile_size"];
        let distanceOffHitLocationInTiles = Math.pow(distanceOffInTiles, WTL_GAME_DATA["cannon"]["error_f"]) / WTL_GAME_DATA["cannon"]["error_g"];
        let distanceOffHitLocation = distanceOffHitLocationInTiles * WTL_GAME_DATA["general"]["tile_size"];

        let angleFromHitLocationRAD = toFixedRadians(randomNumberInclusive(0, 360));
        let offsetObj = angleAndHypotenuseToXAndYSides(angleFromHitLocationRAD, randomNumberInclusive(0, distanceOffHitLocation));

        let hitX = aimToHitX + offsetObj["x"];
        let hitY = aimToHitY + offsetObj["y"];

        // Spawn smoke
        let cannonSmoke = CannonSmoke.create(hitX, hitY);
        scene.addExpiringVisual(cannonSmoke);

        // Determine area of effect
        let tileDamageRadius = WTL_GAME_DATA["cannon"]["aoe_tile_radius"];
        let damageRadius = tileDamageRadius * WTL_GAME_DATA["general"]["tile_size"];
        let leftTileAffected = WTLGameScene.getTileXAt(hitX - damageRadius);
        let rightTileAffected = WTLGameScene.getTileXAt(hitX + damageRadius);
        let bottomTileAffected = WTLGameScene.getTileYAt(hitY - damageRadius);
        let topTileAffected = WTLGameScene.getTileYAt(hitY + damageRadius);

        // Set up cannon damage
        let humanMultiplier = WTL_GAME_DATA["cannon"]["human_damage_multiplier"];
        let rockMultiplier = WTL_GAME_DATA["cannon"]["rock_damage_multiplier"];
        let calculateCannonDamage = (distanceInTiles, multiplier) => {
            return multiplier * 1 / (Math.pow(distanceInTiles+1, WTL_GAME_DATA["cannon"]["damage_f"] * WTL_GAME_DATA["cannon"]["damage_g"] * distanceInTiles));
        }

        // Hurt rocks
        let searchAliveRockHitboxes = (tileX, tileY) => {
            let result = null;
            for (let rockHitbox of this.player.getGamemode().getRockHitboxes()){
                if (rockHitbox.isAlive() && rockHitbox.getTileX() == tileX && rockHitbox.getTileY() == tileY){
                    return rockHitbox;
                }
            }
            return result;
        }
        // Search for all the rocks
        for (let tileX = leftTileAffected; tileX <= rightTileAffected; tileX++){
            for (let tileY = bottomTileAffected; tileY <= topTileAffected; tileY++){
                let rockHitbox = searchAliveRockHitboxes(tileX, tileY);
                let hasRockHitbox = rockHitbox != null;
                if (hasRockHitbox){
                    let rockHitboxCenterX = scene.getCenterXOfTile(tileX);
                    let rockHitboxCenterY = scene.getCenterYOfTile(tileY);
                    let distanceFromHitLocation = calculateEuclideanDistance(hitX, hitY, rockHitboxCenterX, rockHitboxCenterY);
                    let distanceFromHitLocationInTiles = distanceFromHitLocation/WTL_GAME_DATA["general"]["tile_size"];
                    rockHitbox.damage(calculateCannonDamage(distanceFromHitLocationInTiles, rockMultiplier));
                    // If the rock is dead -> Destroy it
                    if (rockHitbox.isDead()){
                        // Destroy the tile
                        scene.deletePhysicalTile(tileX, tileY);
                        scene.placeVisualTile({"name":"grass","file_link":"images/grass.png"}, tileX, tileY);
                    }
                }
            }
        }

        // Hurt soldiers
        for (let troop of this.player.getGamemode().getAllTroops()){
            let troopX = troop.getInterpolatedTickCenterX();
            let troopY = troop.getInterpolatedTickCenterY();
            let distanceFromHitLocation = calculateEuclideanDistance(hitX, hitY, troopX, troopY);
            if (distanceFromHitLocation > damageRadius){
                continue;
            }
            let distanceFromHitLocationInTiles = distanceFromHitLocation/WTL_GAME_DATA["general"]["tile_size"];
            troop.damage(calculateCannonDamage(distanceFromHitLocationInTiles, humanMultiplier));
        }

        // Lock for a number of turns
        this.unlocksAtTurnNumber = this.getGamemode().getTurnCounter() + WTL_GAME_DATA["cannon"]["turn_cooldown"] * 2;
    }

    /*
        Method Name: select
        Method Parameters: None
        Method Description: dud
        Method Return: void
    */
    select(){}
    /*
        Method Name: deselect
        Method Parameters: None
        Method Description: dud
        Method Return: void
    */
    deselect(){}

    /*
        Method Name: getScene
        Method Parameters: None
        Method Description: Gets the player's scene
        Method Return: WTLGameScene
    */
    getScene(){
        return this.player.getScene();
    }

    /*
        Method Name: getDisplayedCooldown
        Method Parameters: None
        Method Description: Gets the cooldown to display
        Method Return: int
    */
    getDisplayedCooldown(){
        return Math.ceil((this.unlocksAtTurnNumber - this.getGamemode().getTurnCounter())/2);
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
        let image = IMAGES["point_to_shoot_cannon"];
        let displayScale = WTL_GAME_DATA["inventory"]["slot_size"] / image.width;
        let scaleX = providedX + image.width / 2 * displayScale;
        let scaleY = providedY + image.height / 2 * displayScale;

        translate(scaleX, scaleY);

        scale(displayScale, displayScale);

        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);

        // Display turn cooldown if applicable
        if (this.isOnCooldown()){
            let turns = this.getDisplayedCooldown();
            makeText(turns.toString(), 0, -1 * WTL_GAME_DATA["inventory"]["slot_size"]/4, WTL_GAME_DATA["inventory"]["slot_size"], WTL_GAME_DATA["inventory"]["slot_size"], Colour.fromCode(WTL_GAME_DATA["cannon"]["cooldown_colour"]), WTL_GAME_DATA["cannon"]["cooldown_text_size"], "center", "alphabetic");
        }

        scale(1 / displayScale, 1 / displayScale);

        translate(-1 * scaleX, -1 * scaleY);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick processes
        Method Return: void
    */
    tick(){
    }

    /*
        Method Name: isOnCooldown
        Method Parameters: None
        Method Description: Checks if on cooldown
        Method Return: boolean
    */
    isOnCooldown(){
        return this.unlocksAtTurnNumber > this.getGamemode().getTurnCounter();
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x coordinate of the left side of the screen
            bY:
                The y coordinate of the bottom of the screen
        Method Description: Displays the crosshair
        Method Return: void
    */
    display(lX, bY){
        if (!this.player.isMakingAMove()){ return; }
        let x = this.getScene().getDisplayXOfPoint(this.crosshairCenterX, lX);
        let y = this.getScene().getDisplayYOfPoint(this.crosshairCenterY, bY);
        let crosshairImage = IMAGES["point_to_shoot_cannon_crosshair"];
        let crosshairWidth = crosshairImage.width;
        let crosshairHeight = crosshairImage.height;
        translate(x, y);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(crosshairImage, -1 * crosshairWidth / 2, -1 * crosshairHeight / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * x, -1 * y);
    }
}