class SkirmishBot extends SkirmishCharacter {
    constructor(gamemode, model, rankName, team){
        super(gamemode, model, rankName, team);
    }

    indicateTurn(){
        super.indicateTurn();
        this.generatePlan();
    }

    makeDecisions(){
        // TODO: Check plan
    }

    exploreAvailableTiles(){
        let tiles = [];
        let startTileX = this.tileX;
        let startTileY = this.tileY;

        let addAdjacentTilesAsUnchecked = (tileX, tileY, pathToTile, startToEnd) => {
            tryToAddTile(tileX+1, tileY, pathToTile, startToEnd);
            tryToAddTile(tileX-1, tileY, pathToTile, startToEnd);
            tryToAddTile(tileX, tileY+1, pathToTile, startToEnd);
            tryToAddTile(tileX, tileY-1, pathToTile, startToEnd);
        }

        let getTileIndex = (tileX, tileY) => {
            for (let i = 0; i < tiles.length; i++){
                if (tiles[i]["tile_x"] == tileX && tiles[i]["tile_y"] == tileY){
                    return i;
                }
            }
            return -1;
        }

        let tileAlreadyChecked = (tileX, tileY, startToEnd) => {
            let tileIndex = getTileIndex(tileX, tileY);
            if (tileIndex == -1){ return false; }
            return tiles[tileIndex]["checked"][startToEnd.toString()];
        }

        let tileCanBeWalkedOn = (tileX, tileY) => {
            return !this.getScene().tileAtLocationHasAttribute(tileX, tileY, "no_walk");
        }

        let tileTooFar = (tileX, tileY) => {
            return euclidianDistance(startTileX, startTileY, tileX, tileY) > this.walkingBar.getMaxValue();
        }

        let tryToAddTile = (tileX, tileY, pathToTile, startToEnd=true) => {
            if (!tileCanBeWalkedOn(tileX, tileY)){ return; }
            if (tileAlreadyChecked(tileX, tileY, startToEnd)){ return; }
            if (tileTooFar(tileX, tileY)){ return; }
            let tileIndex = getTileIndex(tileX, tileY);
            let newPath;
            if (startToEnd){
                newPath = appendLists(pathToTile, [{"tile_x": tileX, "tile_y": tileY}]);
            }else{
                newPath = appendLists([{"tile_x": tileX, "tile_y": tileY}], pathToTile);
            }
            // If the tile has not been found then add
            if (tileIndex == -1){
                tiles.push({
                    "tile_x": tileX,
                    "tile_y": tileY,
                    "checked": {
                        "true": false,
                        "false": false
                    },
                    "path_direction": startToEnd,
                    "shortest_path": newPath
                });
            }else{
                let tileObj = tiles[tileIndex];
                if (tileObj["path_direction"] != startToEnd){
                    tileObj["checked"][startToEnd.toString()] = true;
                    let forwardPath;
                    let backwardPath;
                    // If function called on a forward path
                    if (startToEnd){
                        forwardPath = copyArray(newPath);
                        backwardPath = copyArray(tileObj["shortest_path"]);
                    }else{
                        forwardPath = copyArray(tileObj["shortest_path"]);
                        backwardPath = copyArray(newPath);
                    }

                    // Shift the first element out from backward path to avoid having the same tile twice
                    backwardPath.shift();

                    let combinedPath = appendLists(forwardPath, backwardPath);
                    let bestPath = getBestPath();
                    let newLength = combinedPath.length;
                    if (bestPath == null || bestPath.length > newLength){
                        // Set start tile path
                        startTile["path_direction"] = false; 
                        startTile["shortest_path"] = combinedPath;
                        // Set end tile path
                        endTile["path_direction"] = true; 
                        endTile["shortest_path"] = combinedPath;
                    }
                }
                // see if the path is worth replacing
                if (tileObj["shortest_path"].length > newPath.length){
                    tileObj["shortest_path"] = newPath;
                    tileObj["path_direction"] = startToEnd;
                }
            }
        }

        let hasUncheckedTiles = () => {
            for (let tile of tiles){
                // if tile hasn't been checked in its current direction
                if (!tile["checked"][tile["path_direction"].toString()]){
                    return true;
                }
            }
            return false;
        }

        let pickTile = () => {
            let chosenTile = null;
            for (let tile of tiles){
                if (!tile["checked"][tile["path_direction"].toString()]){
                    chosenTile = tile;
                    break;
                }
            }
            return chosenTile;
        }

        // Add first tile
        tryToAddTile(startTileX, startTileY, []);
        let startTile = tiles[0];
        while (hasUncheckedTiles()){
            let currentTile = pickTile();
            currentTile["checked"][currentTile["path_direction"].toString()] = true;
            addAdjacentTilesAsUnchecked(currentTile["tile_x"], currentTile["tile_y"], currentTile["shortest_path"], currentTile["path_direction"]);
        }
        return tiles;
    }

    generatePlan(){
        let possibleEndTiles = this.exploreAvailableTiles();

        // Stores all plans for ranking and selection
        let collectivePlans = [];

        // Find tiles where you can go to shoot an enemy
        let shootOneTiles = this.determineRoughShootOneTiles(possibleEndTiles);

        // Find tiles where you can go to stab an enemy
        // Note: This is a subset of the shootOneTiles unless you had some massive gun, for now assuming d<=1 for stabbing
        let stabOneTiles = this.determineRoughStabbingTiles(shootOneTiles);

        // Find tiles closer to enemy (from start position) where you can't be immediately shot/stabbed 
        let closerTiles = this.determineCloserTiles(possibleEndTiles, shootOneTiles);

        // Find tiles where you can hide in a single-bush
        let singleBushTiles = this.determineSingleBushTiles(possibleEndTiles);

        // Find tiles where you can hide in a multi-bush
        let multiBushTiles = this.determineMultiBushTiles(possibleEndTiles);


        // Officer
        if (this.rankName === "officer"){
            // If cannon is ready
            if (this.cannonIsOnCooldown()){
                // Determine rock spots

                // Determine troop damage spots
            }

            // Determine how many troops you can shoot
            // TODO: Reduce shoot damage, maybe 75%?
            /* So what you do is find out for each troop you have selected, what angle range (Relative to your crosshair) can they shoot a troop
               Then you find overlaps between them and determine what angle you pointing at gives you how many enemies killed/wounded
            */

            // Determine moving your selected troops to a given location
            // Value moving closer to enemy you can make it more advanced in the future just do this for now
        }


        // TODO: Use a weighting fuction to adjust probabily of each choice of move
        /* So basically if it was basic then
           let array=[5,1,1,1];
           You would have a 5/8 chance of getting array[0] with normal weighting
           but you can instead make it so in something like this case you would have a 7.434234/8 chance
           of getting array[0] because of a particular weighting function
        */
        let bestPlan = null;
        this.plan = bestPlan;
    }

    determineCloserTiles(possibleEndTiles, shootOneTiles){
        let closerTiles = [];
        // Note: Weed out bushes
        let gamemode = this.getGamemode();
        let enemies = gamemode.getLivingTeamRosterFromName(gamemode.getOtherTeam(this.getTeamName()));
        let shortestDistanceToEnemyAtStart = Number.MAX_SAFE_INTEGER;

        // Find the shortest distancer to enemy at the start of the turn
        for (let enemy of enemies){
            shortestDistanceToEnemy = Math.min(enemy.distance(this), shortestDistanceToEnemy);
        }

        let isUnsafeTile = (tileX, tileY) => {
            for (let tile of shootOneTiles){
                if (tile["tile_x"] === tileX && tile["tile_y"] === tileY){
                    return true;
                }
            }
            return false;
        }

        let scene = this.getGamemode().getScene();
        // Check tiles
        for (let tile of possibleEndTiles){
            // Ignore unsafe tiles
            if (isUnsafeTile(tile["tile_x"], tile["tile_y"])){ continue; }
            let x = scene.getXOfTile(tile["tile_x"]);
            let y = scene.getYOfTile(tile["tile_y"]);
            let totalDistance = 0;
            let shortestDistance = Number.MAX_SAFE_INTEGER;
            // Find the distances to enemies
            for (let enemy of enemies){
                let distance = euclidianDistance(x, y, enemy.getInterpolatedTickX(), enemy.getInterpolatedTickY());
                totalDistance += distance;
                shortestDistance = Math.min(distance, shortestDistance);
            }
            // Ignore tiles with a further shortest distance than the starting one
            if (shortestDistance >= shortestDistanceToEnemyAtStart){
                continue;
            }
            tile["shortest_distance"] = shortestDistance;
            tile["total_distance"] = totalDistance;
            closerTiles.push(tile);
        }
        return closerTiles;
    }

    determineSingleBushTiles(possibleEndTiles){
        let closerTiles = [];
        // Note: Weed out multi-bushes
        return closerTiles;
    }

    determineMultiBushTiles(possibleEndTiles){
        let closerTiles = [];
        // Note: Weed out single-bushes
        return closerTiles;
    }

    determineRoughShootOneTiles(tileSelection){
        let roughShootOneTiles = [];
        let scene = this.getGamemode().getScene();
        let angleIntervalDEG = 5;
        let gun = this.getGun();
        let range = gun.getBulletRange();
        let myID = this.getID();
        // Look at each tile you can stand on to shoot
        for (let tile of tileSelection){
            let playerLeftX = scene.getXOfTile(tile["tile_x"]);
            let playerTopY = scene.getYOfTile(tile["tile_y"]);
            let x;
            let y;
            // Loop through given angles
            for (let angleDEG = 0; angleDEG < 360; angleDEG += angleIntervalDEG){
                let playerAimingAngleRAD = toFixedRadians(angleDEG);
                let directionToFace;
                // If to the right
                if (angleBetweenCCWRAD(playerAimingAngleRAD, toRadians(315), toRadians(45))){
                    directionToFace = "right";
                }
                // If up
                else if (angleBetweenCCWRAD(playerAimingAngleRAD, toRadians(45), toRadians(135))){
                    directionToFace = "up";
                }
                // If to the left
                else if (angleBetweenCCWRAD(playerAimingAngleRAD, toRadians(135), toRadians(180))){
                    directionToFace = "left";
                }
                // Else it must be down
                else{
                    directionToFace = "down";
                }
                // Determine REAL position of gun end at different angles
                let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, directionToFace, playerAimingAngleRAD);
                x = pos["x"];
                y = pos["y"];
                let collision = scene.findInstantCollisionForProjectile(x, y, range, (enemy) => { return enemy.getID() == myID; });
                // If it can shoot an enemy from this tile at this angle then add it
                if (collision["collision_type"] === "entity"){
                    if (!collision["entity"].isOnSameTeam(this)){
                        tile["angle_rad"] = playerAimingAngleRAD;
                        tile["direction_to_face"] = directionToFace;
                        tile["distance_to_enemy"] = collision["entity"].distance(this);
                        roughShootOneTiles.push(tile);
                        break; // Skip to next tile
                    }
                }
            }
        }
        return roughShootOneTiles;
    }

    determineRoughStabbingTiles(tilesYouCanShootFrom){
        let stabbingTiles = [];
        for (let tile of tilesYouCanShootFrom){
            if (tile["distance_to_enemy"] < this.getMeleeWeapon().getSwingRange()){
                stabbingTiles.push(tile);
            }
        }
        return stabbingTiles;
    }

    getGun(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            if (item instanceof Gun){
                return item;
            }
        }
        return null;
    }

    getMeleeWeapon(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            if (item instanceof Sword){
                return item;
            }
        }
        return null;
    }

    cannonIsOnCooldown(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            if (item instanceof PointToShootCannon){
                return item.isOnCooldown();
            }
        }
        return null;
    }


}