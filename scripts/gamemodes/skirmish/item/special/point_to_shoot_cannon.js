class PointToShootCannon extends Item {
    constructor(details){
        super();
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.crosshairCenterX = 0;
        this.crosshairCenterY = 0;
        this.unlocksAtTurnNumber = this.getGamemode().getTurnCounter() + RETRO_GAME_DATA["cannon"]["turn_cooldown"] * 2;
    }

    resetDecisions(){
        this.player.amendDecisions({
            "crosshair_center_x": null,
            "crosshair_center_y": null,
            "new_crosshair_center": false,
            "trying_to_shoot": false
        });
    }

    makeDecisions(){
        this.player.makeCannonPointerDecisions();
    }

    getGamemode(){
        return this.player.getGamemode();
    }

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

    shootCannon(){
        let scene = this.player.getScene();

        let aimToHitX = this.crosshairCenterX;
        let aimToHitY = this.crosshairCenterY;
        let playerSpawn = this.player.getGamemode().getSpawnObjectByName(this.player.getTeamName());
        
        let cannonOriginTileX = playerSpawn["x"];
        let cannonOriginTileY = playerSpawn["y"];
        let cannonOriginX = scene.getXOfTile(cannonOriginTileX);
        let cannonOriginY = scene.getYOfTile(cannonOriginTileY);

        let distanceToHitLocation = calculateEuclideanDistance(aimToHitX, aimToHitY, cannonOriginX, cannonOriginY);
        let distanceOffInTiles = distanceToHitLocation/RETRO_GAME_DATA["general"]["tile_size"];
        let distanceOffHitLocationInTiles = Math.pow(distanceOffInTiles, RETRO_GAME_DATA["cannon"]["error_f"]) / RETRO_GAME_DATA["cannon"]["error_g"];
        let distanceOffHitLocation = distanceOffHitLocationInTiles * RETRO_GAME_DATA["general"]["tile_size"];

        let angleFromHitLocationRAD = toFixedRadians(randomNumberInclusive(0, 360));
        let offsetObj = angleAndHypotenuseToXAndYSides(angleFromHitLocationRAD, randomNumberInclusive(0, distanceOffHitLocation));

        let hitX = aimToHitX + offsetObj["x"];
        let hitY = aimToHitY + offsetObj["y"];

        // Spawn smoke
        let cannonSmoke = CannonSmoke.create(hitX, hitY);
        scene.addExpiringVisual(cannonSmoke);

        // Determine area of effect
        let tileDamageRadius = RETRO_GAME_DATA["cannon"]["aoe_tile_radius"];
        let damageRadius = tileDamageRadius * RETRO_GAME_DATA["general"]["tile_size"];
        let leftTileAffected = RetroGameScene.getTileXAt(hitX - damageRadius);
        let rightTileAffected = RetroGameScene.getTileXAt(hitX + damageRadius);
        let bottomTileAffected = RetroGameScene.getTileYAt(hitY - damageRadius);
        let topTileAffected = RetroGameScene.getTileYAt(hitY + damageRadius);

        // Set up cannon damage
        let humanMultiplier = RETRO_GAME_DATA["cannon"]["human_damage_multiplier"];
        let rockMultiplier = RETRO_GAME_DATA["cannon"]["rock_damage_multiplier"];
        let calculateCannonDamage = (distanceInTiles, multiplier) => {
            return multiplier * 1 / (Math.pow(distanceInTiles+1, RETRO_GAME_DATA["cannon"]["damage_f"] * RETRO_GAME_DATA["cannon"]["damage_g"] * distanceInTiles));
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
                    let distanceFromHitLocationInTiles = distanceFromHitLocation/RETRO_GAME_DATA["general"]["tile_size"];
                    rockHitbox.damage(calculateCannonDamage(distanceFromHitLocationInTiles, rockMultiplier));
                    //console.log("Damaging rock", tileX, tileY, calculateCannonDamage(distanceFromHitLocationInTiles, rockMultiplier));
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
            let distanceFromHitLocationInTiles = distanceFromHitLocation/RETRO_GAME_DATA["general"]["tile_size"];
            troop.damage(calculateCannonDamage(distanceFromHitLocationInTiles, humanMultiplier));
        }

        // Lock for a number of turns
        this.unlocksAtTurnNumber = this.getGamemode().getTurnCounter() + RETRO_GAME_DATA["cannon"]["turn_cooldown"] * 2;
    }

    select(){}
    deselect(){}

    getScene(){
        return this.player.getScene();
    }

    getDisplayedCooldown(){
        return Math.ceil((this.unlocksAtTurnNumber - this.getGamemode().getTurnCounter())/2);
    }

    displayItemSlot(providedX, providedY){
        let image = IMAGES["point_to_shoot_cannon"];
        let displayScale = RETRO_GAME_DATA["inventory"]["slot_size"] / image.width;
        let scaleX = providedX + image.width / 2 * displayScale;
        let scaleY = providedY + image.height / 2 * displayScale;

        translate(scaleX, scaleY);

        scale(displayScale, displayScale);

        drawingContext.drawImage(image, 0 - image.width / 2, 0 - image.height / 2);

        // Display turn cooldown if applicable
        if (this.isOnCooldown()){
            let turns = this.getDisplayedCooldown();
            makeText(turns.toString(), 0, -1 * RETRO_GAME_DATA["inventory"]["slot_size"]/4, RETRO_GAME_DATA["inventory"]["slot_size"], RETRO_GAME_DATA["inventory"]["slot_size"], Colour.fromCode(RETRO_GAME_DATA["cannon"]["cooldown_colour"]), RETRO_GAME_DATA["cannon"]["cooldown_text_size"], "center", "center");
        }

        scale(1 / displayScale, 1 / displayScale);

        translate(-1 * scaleX, -1 * scaleY);
    }

    tick(){
    }

    isOnCooldown(){
        return this.unlocksAtTurnNumber > this.getGamemode().getTurnCounter();
    }

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