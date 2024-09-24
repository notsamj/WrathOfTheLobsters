class SkirmishBot extends SkirmishCharacter {
    constructor(gamemode, model, rankName, team, sharedBrain){
        super(gamemode, model, rankName, team);
        this.sharedBrain = sharedBrain;
    }

    getRandom(){
        return this.getGamemode().getRandom();
    }

    indicateTurn(){
        super.indicateTurn();
        this.generatePlan();
    }

    makeDecisions(){
        this.resetDecisions();
        if (this.isMakingAMove() && !this.hasCommitedToAction()){ 
            this.plan.execute(this.decisions);
        }else{
            this.checkForOfficerCommand();
        }
    }

    exploreAvailableTiles(range=this.walkingBar.getMaxValue()){
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

        let tileTooFar = (pathToTileLength) => {
            return pathToTileLength + 1 > range;
        }

        let tryToAddTile = (tileX, tileY, pathToTile, startToEnd=true) => {
            if (!tileCanBeWalkedOn(tileX, tileY)){ return; }
            if (tileAlreadyChecked(tileX, tileY, startToEnd)){ return; }
            if (tileTooFar(pathToTile.length)){ return; }
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
        let shootStabCalculationResults = this.determineRoughShootAndStabTiles(possibleEndTiles);
        let shootOneTiles = shootStabCalculationResults["rough_shoot_tiles"];

        // Find tiles where you can go to stab an enemy
        // Note: This is a subset of the shootOneTiles unless you had some massive gun, for now assuming d<=1 for stabbing
        let stabOneTiles = shootStabCalculationResults["rough_stab_tiles"];

        // Find tiles closer to enemy (from start position) where you can't be immediately shot/stabbed 
        let closerTiles = this.determineCloserTiles(possibleEndTiles, shootOneTiles);

        // Find tiles where you can hide in a single-bush
        let singleBushTiles = this.determineSingleBushTiles(possibleEndTiles);

        // Find tiles where you can hide in a multi-bush
        let multiBushTiles = this.determineMultiBushTiles(possibleEndTiles);


        // Officer
        if (this.rankName === "officer"){
            let squaresAroundEnemies = this.getSquaresAroundEnemies();
            let selectedTroops = this.generateSelectedTroops();
            // If cannon is ready
            if (!this.cannonIsOnCooldown()){
                // Determine targets to destroy rocks
                let rockTargets = this.determineRockTargets();

                // Determine troop damage spots
                let troopDamageTargets = this.determineTroopCannonDamageSpots(squaresAroundEnemies);

                // Add cannon rock tiles to collectiveplans
                for (let rockTarget of rockTargets){
                    rockTarget["type"] = "cannon_rock";
                    // In this case, rock tiles have values in [-180,180]
                    rockTarget["value"] = (rockTarget["score"] + 180) / (180*2) * RETRO_GAME_DATA["bot"]["weights"]["cannon_rock"];
                    //console.log(rockTarget["value"])
                    collectivePlans.push(rockTarget);
                }

                // Add cannon troop tiles to collectiveplans
                for (let troopDamageTarget of troopDamageTargets){
                    troopDamageTarget["type"] = "cannon_troops";
                    // In this case, rock tiles have values in (-4,4)
                    troopDamageTarget["value"] = (troopDamageTarget["score"] + 4) / (4*2) * RETRO_GAME_DATA["bot"]["weights"]["cannon_troops"];
                    //console.log(troopDamageTarget["value"])
                    collectivePlans.push(troopDamageTarget);
                }
            }

            // Determine how many troops you can shoot
            /* 
                Maybe a different plan?
                So what you do is find out for each troop you have selected, what angle range (Relative to your crosshair) can they shoot a troop
               Then you find overlaps between them and determine what angle you pointing at gives you how many enemies killed/wounded
            
                Another plan

                Create a list of the 9 tiles (no duplicates) around each enemy
                Try pointing crosshair at the center of each of the 9 tiles,
                Calculate expected value on each and find the best
            */
            let orderShootTargets = this.determineOrderShootPossibilities(squaresAroundEnemies, selectedTroops);

            // Determine moving your selected troops to a given location
            // Value moving closer to enemy you can make it more advanced in the future just do this for now
            let orderTroopWalkToLocationTiles = this.determineCloserTiles(this.exploreAvailableTiles(RETRO_GAME_DATA["skirmish"]["distance_per_turn"]), shootOneTiles);
        
            // Add orderShootTargets tiles to collectiveplans
            for (let orderShootTarget of orderShootTargets){
                orderShootTarget["type"] = "order_shoot";
                // In this case, rock tiles have values in (-4,4)
                orderShootTarget["value"] = (orderShootTarget["value"] + 4) / (4*2) * RETRO_GAME_DATA["bot"]["weights"]["order_shoot"];
                //console.log(orderShootTarget["value"])
                collectivePlans.push(orderShootTarget);
            }

            // Add orderTroopWalkToLocationTiles to collectiveplans
            for (let orderTroopWalkToLocationTile of orderTroopWalkToLocationTiles){
                orderTroopWalkToLocationTile["type"] = "order_move";
                // In this case, there is an existing value. It is already between [0,1] so multiply by weight
                orderTroopWalkToLocationTile["value"] = orderTroopWalkToLocationTile["score"] * RETRO_GAME_DATA["bot"]["weights"]["order_move"];
                //console.log(orderTroopWalkToLocationTile["value"], RETRO_GAME_DATA["bot"]["weights"]["order_move"], orderTroopWalkToLocationTile["score"])
                collectivePlans.push(orderTroopWalkToLocationTile);
            }
        }

        // Add shoot tiles to collectiveplans
        for (let shootOneTile of shootOneTiles){
            shootOneTile["type"] = "shoot";
            // In this case, there is no existing value so directly assign the weight
            shootOneTile["value"] = RETRO_GAME_DATA["bot"]["weights"]["shoot"];
            //console.log(shootOneTile["value"])
            collectivePlans.push(shootOneTile);
        }

        // Add stab tiles to collectiveplans
        for (let stabOneTile of stabOneTiles){
            stabOneTile["type"] = "stab";
            // In this case, there is no existing value so directly assign the weight
            stabOneTile["value"] = RETRO_GAME_DATA["bot"]["weights"]["stab"];
            //console.log(stabOneTile["value"])
            collectivePlans.push(stabOneTile);
        }

        // Add closer tiles to collectiveplans
        for (let closerTile of closerTiles){
            closerTile["type"] = "move_closer";
            // In this case, there is an existing value. It is already between [0,1] so multiply by weight
            closerTile["value"] = closerTile["score"] * RETRO_GAME_DATA["bot"]["weights"]["move_closer"];
            //console.log(closerTile["value"])
            collectivePlans.push(closerTile);
        }

        // Add singleBushTiles to collectiveplans
        for (let singleBushTile of singleBushTiles){
            singleBushTile["type"] = "single_bush";
            // In this case, there is no existing value so directly assign the weight
            singleBushTile["value"] = RETRO_GAME_DATA["bot"]["weights"]["single_bush"];
            //console.log(singleBushTile["value"])
            collectivePlans.push(singleBushTile);
        }

        // Add multiBushTiles to collectiveplans
        for (let multiBushTile of multiBushTiles){
            multiBushTile["type"] = "multi_bush";
            // In this case, there is no existing value so directly assign the weight
            multiBushTile["value"] = RETRO_GAME_DATA["bot"]["weights"]["multi_bush"];
            //console.log(multiBushTile["value"])
            collectivePlans.push(multiBushTile);
        }

        // Sort collective plans
        collectivePlans.sort((element1, element2) => {
            if (element1["value"] < element2["value"]){
                return 1;
            }else if (element2["value"] < element1["value"]){
                return -1;
            }else{
                return 0;
            }
        });


        /* So basically if it was basic then
           let array=[5,1,1,1];
           You would have a 5/8 chance of getting array[0] with normal weighting
           but you can instead make it so in something like this case you would have a 7.434234/8 chance
           of getting array[0] because of a particular weighting function
        */
        let totalValue = 0;
        for (let plan of collectivePlans){
            totalValue += plan["value"];
        }
        let xStart = RETRO_GAME_DATA["bot"]["plan_choosing_x_start"];
        let xEnd = RETRO_GAME_DATA["bot"]["plan_choosing_x_end"];
        let f = RETRO_GAME_DATA["bot"]["plan_choosing_f"];
        let func = (x) => { return 1/Math.pow(x,f); }
        let endY = func(xEnd);
        let startY = func(xStart);
        let n = collectivePlans.length;
        let random = this.getRandom();
        let pickedX = random.getRandomFloat() * (xEnd - xStart) + xStart;
        let valueAtPickedX = func(pickedX);
        let progressionInY = (startY - valueAtPickedX) / (startY - endY);
        let chosenIndex = Math.floor(n - progressionInY * n);

        let bestPlan = collectivePlans[chosenIndex];

        let selectBestPlanOfTypeForDebugging = (replacementTypes) => {
            for (let replacementType of replacementTypes){
                let best = null;
                for (let i = 0; i < collectivePlans.length; i++){
                    if (collectivePlans[i]["type"] === replacementType){
                        let isBetter = best === null || collectivePlans[i]["value"] > best["value"];
                        if (isBetter){
                            best = collectivePlans[i];
                        }
                    }
                }
                if (best != null){
                    return best;
                }
            }
            return null;
        }
        let replacementTypes = [];
        let replacementPlan = selectBestPlanOfTypeForDebugging(replacementTypes);
        if (replacementPlan != null){
            bestPlan = replacementPlan;
        }
        //console.log(this.getID(), " has a plan!")
        //console.log(bestPlan)
        this.plan = new BotPlan(this, bestPlan);
    }

    determineOrderShootPossibilities(squaresAroundEnemies, selectedTroops){
        let shootPossibilities = [];
        let scene = this.getScene();
        // Loop through all the squares around enemies
        for (let tile of squaresAroundEnemies){
            let tileCenterX = scene.getCenterXOfTile(tile["tile_x"]);
            let tileCenterY = scene.getCenterYOfTile(tile["tile_x"]);
            let enemyKills = 0;
            let enemyExtraDamage = 0;
            
            let friendlyKills = 0;
            let friendlyExtraDamage = 0;

            // Check what each of your troops would hit
            for (let selectedTroop of selectedTroops){
                let playerLeftX = scene.getXOfTile(selectedTroop.getTileX());
                let playerTopY = scene.getYOfTile(selectedTroop.getTileY());
                let angleToTileCenter = displacementToRadians(selectedTroop.getInterpolatedTickCenterX(), selectedTroop.getInterpolatedTickY(), tileCenterX, tileCenterY);
                let directionToFace = angleToBestFaceDirection(angleToTileCenter);
                let gun = selectedTroop.getGun();
                let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, directionToFace, angleToTileCenter);
                let x = pos["x"];
                let y = pos["y"];
                let range = gun.getBulletRange();
                let myID = selectedTroop.getID();
                // Check shoot directory at enemy
                let collision = scene.findInstantCollisionForProjectile(x, y, angleToTileCenter, range, (enemy) => { return enemy.getID() == myID; });
                if (collision["collision_type"] === "entity"){
                    let troop = collision["entity"];
                    let isFriendly = troop.isOnSameTeam(selectedTroop);
                    tile["angle_rad"] = angleToTileCenter;
                    tile["direction_to_face"] = getAlternativeDirectionFormatOf(directionToFace);
                    let damage = RETRO_GAME_DATA["skirmish"]["shot_damage"];
                    if (isFriendly){
                        if (damage > troop.getHealth()){
                            friendlyKills++;
                        }else{
                            friendlyExtraDamage += damage;
                        }
                    }else{
                        if (damage > troop.getHealth()){
                            enemyKills++;
                        }else{
                            enemyExtraDamage += damage;
                        }
                    }
                }
            }

            // Calculate score
            /*
                Notes on score calculation:
                We know enemyKills is between 0 and num enemies
                We know enemyExtraDamage is between 0 and num enemies
                We know friendlyKills is between 0 and num friendlies
                We know friendlyExtraDamage is between 0 and num friendlies
            */
            let enemies = this.getEnemies();
            let friends = this.getFriends();
            let killScore = enemyKills / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyKills / friends.length;
            let damageScore = enemyExtraDamage / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyExtraDamage / friends.length;
            let score = killScore * RETRO_GAME_DATA["bot"]["kill_to_damage_importance_ratio"] + damageScore;
            // Score will be in range (-4, 4)
            // Skip if <= 0 
            if (score <= 0){ continue; }
            shootPossibilities.push({"x": tileCenterX, "y": tileCenterY, "score": score})
        }
        return shootPossibilities;
    }

    determineTroopCannonDamageSpots(squaresAroundEnemies){
        let cannonTargets = [];
        let scene = this.getScene();
        let enemies = this.getEnemies();
        let friends = this.getFriends();

        let humanMultiplier = RETRO_GAME_DATA["cannon"]["human_damage_multiplier"];
        let calculateCannonDamage = (distanceInTiles, multiplier) => {
            return multiplier * 1 / (Math.pow(distanceInTiles+1, RETRO_GAME_DATA["cannon"]["damage_f"] * RETRO_GAME_DATA["cannon"]["damage_g"] * distanceInTiles));
        }
        let tileDamageRadius = RETRO_GAME_DATA["cannon"]["aoe_tile_radius"];
        let damageRadius = tileDamageRadius * RETRO_GAME_DATA["general"]["tile_size"];

        // Loop around each tile around enemies and see how much damage you'd get for a cannon shot there
        for (let tile of squaresAroundEnemies){
            let tileCenterX = scene.getCenterXOfTile(tile["tile_x"]);
            let tileCenterY = scene.getCenterYOfTile(tile["tile_y"]);
            let enemyKills = 0;
            let enemyExtraDamage = 0;
            
            let friendlyKills = 0;
            let friendlyExtraDamage = 0;

            // Calculate enemy damage
            for (let enemy of enemies){
                let enemyX = enemy.getInterpolatedTickCenterX();
                let enemyY = enemy.getInterpolatedTickCenterY();
                let distanceFromHitLocation = calculateEuclideanDistance(tileCenterX, tileCenterY, enemyX, enemyY);
                if (distanceFromHitLocation > damageRadius){
                    continue;
                }
                let distanceFromHitLocationInTiles = distanceFromHitLocation/RETRO_GAME_DATA["general"]["tile_size"];
                let damage = calculateCannonDamage(distanceFromHitLocationInTiles, humanMultiplier);
                if (damage > enemy.getHealth()){
                    enemyKills++;
                }else{
                    enemyExtraDamage += damage;
                }
            }

            // Calculate friendly damage
            for (let friendly of friends){
                let friendlyX = friendly.getInterpolatedTickCenterX();
                let friendlyY = friendly.getInterpolatedTickCenterY();
                let distanceFromHitLocation = calculateEuclideanDistance(tileCenterX, tileCenterY, friendlyX, friendlyY);
                if (distanceFromHitLocation > damageRadius){
                    continue;
                }
                let distanceFromHitLocationInTiles = distanceFromHitLocation/RETRO_GAME_DATA["general"]["tile_size"];
                let damage = calculateCannonDamage(distanceFromHitLocationInTiles, humanMultiplier);
                if (damage > friendly.getHealth()){
                    friendlyKills++;
                }else{
                    friendlyExtraDamage += damage;
                }
            }

            // Calculate score
            /*
                Notes on score calculation:
                We know enemyKills is between 0 and num enemies
                We know enemyExtraDamage is between 0 and num enemies
                We know friendlyKills is between 0 and num friendlies
                We know friendlyExtraDamage is between 0 and num friendlies
            */
            let killScore = enemyKills / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyKills / friends.length;
            let damageScore = enemyExtraDamage / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyExtraDamage / friends.length;
            let score = killScore * RETRO_GAME_DATA["bot"]["kill_to_damage_importance_ratio"] + damageScore;
            // Score will be in range (-4, 4)
            // Skip if <= 0 
            if (score <= 0){ continue; }
            cannonTargets.push({"cannon_center_x": tileCenterX, "cannon_center_y": tileCenterY, "score": score})
        }
        return cannonTargets;
    }

    getSquaresAroundEnemies(){
        let squaresAroundEnemies = [];
        let enemies = this.getEnemies();

        let tryToAddSquare = (tileX, tileY) => {
            // See if present, return if it is 
            for (let square of squaresAroundEnemies){
                if (square["tile_x"] == tileX && square["tile_y"] == tileY){
                    return;
                }
            }

            // So its not present
            squaresAroundEnemies.push({"tile_x": tileX, "tile_y": tileY});
        }
        let addSquaresAroundSpot = (tileX, tileY) => {
            // Top left
            tryToAddSquare(tileX-1, tileY+1);
            // Top
            tryToAddSquare(tileX, tileY+1);
            // Top right
            tryToAddSquare(tileX+1, tileY+1);
            // Left
            tryToAddSquare(tileX-1, tileY);
            // Center
            tryToAddSquare(tileX, tileY);
            // Right
            tryToAddSquare(tileX+1, tileY);
            // Bottom left
            tryToAddSquare(tileX-1, tileY-1);
            // Bottom
            tryToAddSquare(tileX, tileY-1);
            // Bottom right
            tryToAddSquare(tileX+1, tileY-1);
        }
        // Add squares around each enemy
        for (let enemy of enemies){
            addSquaresAroundSpot(enemy.getTileX(), enemy.getTileY());
        }
        return squaresAroundEnemies;
    }

    determineRockTargets(){
        // Determine rock spots
        let rockTargets = [];
        let friends = this.getFriends();
        let enemies = this.getEnemies();
        let rockHitboxes = this.gamemode.getRockHitboxes();
        let scene = this.getScene();

        // Using formula 1/(x^f)
        let hitBoxValueByHealth = (hitboxHealth) => {
            return Math.min(1/(Math.pow(hitboxHealth, RETRO_GAME_DATA["bot"]["rock_health_f_value"])), RETRO_GAME_DATA["bot"]["max_rock_value"]);
        }

        // Loop through each living rock hitbox locations
        for (let rockHitbox of rockHitboxes){
            if (rockHitbox.isDead()){ continue; }
            // Calculate the rock density of the location
            let tileX = rockHitbox.getTileX();
            let tileY = rockHitbox.getTileY();
            let healthScore = 0;
            let enemyScore = 0;
            let friendlyScore = 0;

            // Check all rock hitboxes to calculate the score for this location
            for (let rockHitboxForCalculation of rockHitboxes){
                // Weigh by making more low health rocks worth more
                healthScore += hitBoxValueByHealth(rockHitboxForCalculation.getHealth());
            }
            // Weigh by enemy distance to rock (use cannon aoe as distance)
            for (let enemy of enemies){
                let distanceToEnemyInTile = calculateEuclideanDistance(enemy.getTileX(), enemy.getTileY(), tileX, tileY);
                if (distanceToEnemyInTile > RETRO_GAME_DATA["cannon"]["aoe_tile_radius"]){
                    continue;
                }
                enemyScore += 1; 
            }

            // Weigh by friendly distance to rock (use cannon aoe as distance)
            for (let friend of friends){
                let distanceToEnemyInTile = calculateEuclideanDistance(friend.getTileX(), friend.getTileY(), tileX, tileY);
                if (distanceToEnemyInTile > RETRO_GAME_DATA["cannon"]["aoe_tile_radius"]){
                    continue;
                }
                friendlyScore += 1; 
            }
            /*
                Notes on score calculation:
                We know health score is between 1 and 180 (20 * 9)
                We know enemy score is between 0 and num enemies
                We know friendly score is between 0 and num friendlies
            */
            let score = healthScore * (enemyScore / enemies.length - RETRO_GAME_DATA["bot"]["friend_enemy_cannon_ratio"] * friendlyScore / friends.length);
            // Score will be in [-180,180]
            // Skip if <= 0 
            if (score <= 0){ continue; }
            let cannonCenterX = scene.getCenterXOfTile(tileX);
            let cannonCenterY = scene.getCenterYOfTile(tileY);
            rockTargets.push({"cannon_center_x": cannonCenterX, "cannon_center_y": cannonCenterY, "score": score})
        }
        return rockTargets;
    }

    getEnemies(){
        return this.getGamemode().getLivingTeamRosterFromName(this.getGamemode().getOtherTeam(this.getTeamName()));
    }

    getFriends(){
        return this.getGamemode().getLivingTeamRosterFromName(this.getTeamName());
    }

    determineCloserTiles(possibleEndTiles, shootOneTiles){
        let closerTiles = [];
        // Note: Weed out bushes
        let enemies = this.getEnemies();
        let shortestDistanceToEnemyAtStart = Number.MAX_SAFE_INTEGER;

        // Find the shortest distancer to enemy at the start of the turn
        for (let enemy of enemies){
            shortestDistanceToEnemyAtStart = Math.min(enemy.distance(this), shortestDistanceToEnemyAtStart);
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
        let lowestShortestDistance = Number.MAX_SAFE_INTEGER;
        let lowestTotalDistance = Number.MAX_SAFE_INTEGER;
        for (let tile of possibleEndTiles){
            // Ignore unsafe tiles
            if (isUnsafeTile(tile["tile_x"], tile["tile_y"])){ continue; }
            let x = scene.getXOfTile(tile["tile_x"]);
            let y = scene.getYOfTile(tile["tile_y"]);
            let totalDistance = 0;
            let shortestDistance = Number.MAX_SAFE_INTEGER;
            // Find the distances to enemies
            for (let enemy of enemies){
                let distance = calculateEuclideanDistance(x, y, enemy.getInterpolatedTickX(), enemy.getInterpolatedTickY());
                totalDistance += distance;
                shortestDistance = Math.min(distance, shortestDistance);
            }
            // Ignore tiles with a further shortest distance than the starting one
            if (shortestDistance >= shortestDistanceToEnemyAtStart){
                continue;
            }
            tile["shortest_distance"] = shortestDistance;
            tile["total_distance"] = totalDistance;
            lowestShortestDistance = Math.min(shortestDistance, lowestShortestDistance);
            lowestTotalDistance = Math.min(shortestDistance, lowestTotalDistance);
            closerTiles.push(tile);
        }

        // Value the tiles with a score of [0,1]
        for (let tile of closerTiles){
            if (lowestShortestDistance === 0){
                tile["score"] = 0.5;
            }else{
                tile["score"] = 0.5 * lowestShortestDistance / tile["shortest_distance"];
            }
            if (lowestTotalDistance === 0){
                tile["score"] += 0.5;
            }else{
                tile["score"] += 0.5 * lowestTotalDistance / tile["total_distance"];
            }
        }

        return closerTiles;
    }

    determineSingleBushTiles(possibleEndTiles){
        let singleBushTiles = [];
        // Note: Weed out multi-bushes
        let scene = this.getGamemode().getScene();
        for (let possibleEndTile of possibleEndTiles){
            if (!scene.hasPhysicalTileAtLocation(possibleEndTile["tile_x"], possibleEndTile["tile_y"])){ continue; }
            let physicalTile = scene.getPhysicalTileAtLocation(possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
            if (physicalTile.hasAttribute("single_cover")){
                singleBushTiles.push(possibleEndTile);
            }
        }
        return singleBushTiles;
    }

    determineMultiBushTiles(possibleEndTiles){
        let multiBushTiles = [];
        // Note: Weed out single-bushes
        let scene = this.getGamemode().getScene();
        for (let possibleEndTile of possibleEndTiles){
            if (!scene.hasPhysicalTileAtLocation(possibleEndTile["tile_x"], possibleEndTile["tile_y"])){ continue; }
            let physicalTile = scene.getPhysicalTileAtLocation(possibleEndTile["tile_x"], possibleEndTile["tile_y"]);
            if (physicalTile.hasAttribute("multi_cover")){
                multiBushTiles.push(possibleEndTile);
            }
        }
        return multiBushTiles;
    }

    determineRoughShootAndStabTiles(tileSelection){
        let roughShootTiles = [];
        let roughStabTiles = [];
        let scene = this.getGamemode().getScene();
        let angleIntervalDEG = 5;
        let gun = this.getGun();
        let range = gun.getBulletRange();
        let myID = this.getID();
        let enemies = this.getEnemies();
        // Look at each tile you can stand on to shoot
        for (let tile of tileSelection){
            let playerLeftX = scene.getXOfTile(tile["tile_x"]);
            let playerTopY = scene.getYOfTile(tile["tile_y"]);
            // Loop through enemies
            for (let enemy of enemies){
                let distanceToEnemy = this.distance(enemy);
                let directionToFace;
                let angleToEnemy = 0;

                let yDiff = enemy.getInterpolatedTickCenterY() - this.getInterpolatedTickCenterY();
                if (yDiff != 0){
                    angleToEnemy = displacementToRadians(enemy.getInterpolatedTickCenterX() - this.getInterpolatedTickCenterX(), yDiff);
                }
                if (tile["distance_to_enemy"] < this.getMeleeWeapon().getSwingRange()){
                    tile["direction_to_face"] = getAlternativeDirectionFormatOf(angleToBestFaceDirection(angleToEnemy));
                    roughStabTiles.push(tile);
                    // Ignore possibility of shooting
                    if (distanceToEnemy < RETRO_GAME_DATA["general"]["tile_size"]){
                        continue;
                    }
                }
                let offsetAmount = RETRO_GAME_DATA["general"]["tile_size"]/4;
                let offsetAngleAtRange = Math.atan(offsetAmount/distanceToEnemy);

                let anglesToShootAt = [angleToEnemy, rotateCWRAD(angleToEnemy, offsetAngleAtRange), rotateCCWRAD(angleToEnemy, offsetAngleAtRange)];
                for (let angleToShootAt of anglesToShootAt){
                    directionToFace = angleToBestFaceDirection(angleToShootAt);
                    let pos = gun.getSimulatedGunEndPosition(playerLeftX, playerTopY, directionToFace, angleToShootAt);
                    let x = pos["x"];
                    let y = pos["y"];
                    // Check shoot directory at enemy
                    let collision = scene.findInstantCollisionForProjectile(x, y, angleToShootAt, range, (enemy) => { return enemy.getID() == myID; });
                    if (collision["collision_type"] === "entity"){
                        if (!collision["entity"].isOnSameTeam(this)){
                            // TODO: Check if it would kill
                            tile["angle_rad"] = angleToShootAt;
                            tile["direction_to_face"] = getAlternativeDirectionFormatOf(directionToFace);
                            tile["distance_to_enemy"] = collision["entity"].distance(this);
                            roughShootTiles.push(tile);
                        }
                    }
                }
            }
        }
        return {"rough_shoot_tiles": roughShootTiles, "rough_stab_tiles": roughStabTiles};
    }

    getGun(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            let item = items[i];
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
            let item = items[i];
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
            let item = items[i];
            if (item instanceof PointToShootCannon){
                return item.isOnCooldown();
            }
        }
        return null;
    }

    getWhiteFlag(){
        let inventory = this.getInventory();
        let items = inventory.getItems();
        // Find gun and select it
        for (let i = 0; i < items.length; i++){
            let item = items[i];
            if (item instanceof WhiteFlag){
                return item;
            }
        }
        return null;
    }

    // TODO: Move this to character.js or something this is defined in at least 2 other classes
    generateSelectedTroops(){
        let allTroopsOnMyTeam = this.getGamemode().getLivingTeamRosterFromName(this.getTeamName());
        let myPlayerTileX = this.getTileX();
        let myPlayerTileY = this.getTileY();
        let selectedTroops = [];
        for (let otherTroop of allTroopsOnMyTeam){
            // Ignore me
            if (otherTroop.is(this)){ continue; }

            let otherTroopTileX = otherTroop.getTileX();
            let otherTroopTileY = otherTroop.getTileY();
            let distance = Math.sqrt(Math.pow(myPlayerTileX - otherTroopTileX, 2) + Math.pow(myPlayerTileY - otherTroopTileY, 2));
            if (distance < RETRO_GAME_DATA["skirmish"]["troop_selection_distance"]){
                selectedTroops.push(otherTroop);
            }
        }
        return selectedTroops;
    }
}