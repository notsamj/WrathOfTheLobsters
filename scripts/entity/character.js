/*  
    Class Name: Character
    Class Description: A human entity in the game
    Notes:
        Assuming player does not move > 1 tile / tick
*/
class Character extends Entity {
    /*
        Method Name: constructor
        Method Parameters: 
            gamemode:
                Associate gamemode instance
            model:
                Model of the human character
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gamemode, model){
        super(gamemode);
        this.healthBar = new HealthBar();
        this.model = model;
        this.animationManager = new CharacterAnimationManager();
        this.stunLock = new TickLock(Math.ceil(WTL_GAME_DATA["human"]["max_stun_time_ms"]/calculateMSBetweenTicks()));
        this.staminaBar = new StaminaBar(WTL_GAME_DATA["human"]["stamina"]["max_stamina"], WTL_GAME_DATA["human"]["stamina"]["stamina_recovery_time_ms"]);
        this.tileX = 0;
        this.tileY = 0;
        this.lookingDetails = {
            "direction": null,
            "look_lock": new TickLock(Math.ceil(WTL_GAME_DATA["human"]["look_time_ms"]/calculateMSBetweenTicks()))
        }
        this.movementDetails = null;
        this.inventory = new Inventory(this);
        this.decisions = {
            "up": false,
            "down": false,
            "left": false,
            "right": false,
            "sprint": false,
            "breaking_stride": false
        }
    }

    /*
        Method Name: handleUnpause
        Method Parameters: None
        Method Description: Makes adjustments when the game is unpaused
        Method Return: void
    */
    handleUnpause(){
        if (this.movementDetails != null){
            this.movementDetails["last_frame_time"] += GAME_TICK_SCHEDULER.getLatestTimeDebt();
        }
    }

    /*
        Method Name: getRandom
        Method Parameters: None
        Method Description: Gets the SeededRandom instance from the gamemode
        Method Return: SeededRandomizer
    */
    getRandom(){
        return this.gamemode.getRandom();
    }

    /*
        Method Name: setHealth
        Method Parameters: 
            newHealth:
                The new amount of health
        Method Description: Sets the new amount of character health in the health bar
        Method Return: void
    */
    setHealth(newHealth){
        this.healthBar.setHealth(newHealth);
    }

    /*
        Method Name: resetMovement
        Method Parameters: None
        Method Description: Stops the character from moving
        Method Return: void
    */
    resetMovement(){
        this.movementDetails = null;
    }

    // Abstract -> Expected to be implemented by subclasses otherwise blank
    drawGunCrosshair(){}

    /*
        Method Name: stun
        Method Parameters: 
            ticks:
                The number of ticks to stun the character for
        Method Description: Stuns the character
        Method Return: void
    */
    stun(ticks){
        this.stunLock.addTime(ticks);

        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().breakAction();
        }
    }

    /*
        Method Name: getStaminaBar
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getStaminaBar(){
        return this.staminaBar;
    }

    /*
        Method Name: resetDecisions
        Method Parameters: None
        Method Description: Resets the character's decisions
        Method Return: void
    */
    resetDecisions(){
        this.amendDecisions({
            "up": false,
            "down": false,
            "left": false,
            "right": false,
            "sprint": false,
            "breaking_stride": false
        });
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().resetDecisions();
        }
    }

    /*
        Method Name: amendDecisions
        Method Parameters: 
            decisionObject:
                A JSON object with decisions
        Method Description: Modifies the character's decisions based on the received JSON
        Method Return: void
    */
    amendDecisions(decisionObject){
        for (let key of Object.keys(decisionObject)){
            this.decisions[key] = decisionObject[key];
        }
    }

    /*
        Method Name: getDecision
        Method Parameters: 
            decisionName:
                The name of the decision to look for
        Method Description: Returns the value associated with a decision
        Method Return: Variable
    */
    getDecision(decisionName){
        return this.decisions[decisionName];
    }


    /*
        Method Name: distance
        Method Parameters: 
            otherCharacter:
                Another character
        Method Description: Calcualtes the distance to another character
        Method Return: float
    */
    distance(otherCharacter){
        return calculateEuclideanDistance(this.getInterpolatedTickCenterX(), this.getInterpolatedTickCenterY(), otherCharacter.getInterpolatedTickCenterX(), otherCharacter.getInterpolatedTickCenterY());
    }

    /*
        Method Name: distanceToTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Calculates the distance between the character and a tile
        Method Return: float
    */
    distanceToTile(tileX, tileY){
        return calculateEuclideanDistance(this.getInterpolatedTickCenterX(), this.getInterpolatedTickCenterY(), this.getScene().getCenterXOfTile(tileX), this.getScene().getCenterYOfTile(tileY));
    }

    /*
        Method Name: generateShortestRouteToPoint
        Method Parameters: 
            endTileX:
                A tile x coordinate
            endTileY:
                A tile y coordinate
            routeLengthLimit:
                The number of tiles length that the route is limited to
        Method Description: Generates the shortests possible route from the character to a point
        Method Return: Route or null
    */
    generateShortestRouteToPoint(endTileX, endTileY, routeLengthLimit=Number.MAX_SAFE_INTEGER){
        return this.generateShortestRouteFromPointToPoint(this.getTileX(), this.getTileY(), endTileX, endTileY, routeLengthLimit);
    }

    /*
        Method Name: canWalkOnTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if a given tile location is walkable
        Method Return: Boolean, true -> yes it is walkable, false -> no it's not walkable
    */
    canWalkOnTile(tileX, tileY){
        return !this.getScene().tileAtLocationHasAttribute(tileX, tileY, "no_walk");
    }

    /*
        Method Name: exploreAvailableTiles
        Method Parameters: 
            maxRouteLength:
                The number of tiles length that a route is limited to when exploring tiles
            startTileX:
                A tile x coordinate
            startTileY:
                A tile y coordinate
        Method Description: Generates a list of tiles that can be reached within a given distance
        Method Return: List of JSON objects with tile information
    */
    exploreAvailableTiles(maxRouteLength, startTileX, startTileY){
        if (maxRouteLength === undefined){
            throw new Error("Please supply a valid max route length.");
        }

        if (startTileX === undefined){
            debugger;
            throw new Error("Please supply a start tile x.");
        }

        if (startTileY === undefined){
            throw new Error("Please supply a start tile y.");
        }

        let knownTiles = new NotSamXYSortedArrayList();
        let edgeTiles = new NotSamLinkedList();
            
        // Init
        edgeTiles.push({"tile_x": startTileX, "tile_y": startTileY});
        knownTiles.set(startTileX, startTileY, {"tile_x": startTileX, "tile_y": startTileY, "shortest_path": [{"tile_x": startTileX, "tile_y": startTileY}]});

        let selectTile = () => {
            let chosenIndex = null;
            let bestPathLength = null;

            // Find the tile with the lowest path length
            for (let i = 0; i < edgeTiles.getLength(); i++){
                let edgeTile = edgeTiles.get(i);
                let edgeTileX = edgeTile["tile_x"];
                let edgeTileY = edgeTile["tile_y"];
                let pathLength = knownTiles.get(edgeTileX, edgeTileY)["shortest_path"].length - 1;
                if (bestPathLength === null || pathLength < bestPathLength){
                    bestPathLength = pathLength;
                    chosenIndex = i;
                }
            }
            return edgeTiles.pop(chosenIndex);
        }

        let exploreTiles = (bestTile) => {
            let bestTileX = bestTile["tile_x"];
            let bestTileY = bestTile["tile_y"];
            let bestTilePath = knownTiles.get(bestTileX, bestTileY)["shortest_path"];
            let bestTilePathLength = bestTilePath.length - 1;
            // If we can't add any tiles without exceeding the best path length then don't continue
            if (bestTilePathLength === maxRouteLength){
                return;
            }

            let adjacentTiles = [[bestTileX+1,bestTileY], [bestTileX-1, bestTileY], [bestTileX, bestTileY+1], [bestTileX, bestTileY-1]];

            for (let adjacentTile of adjacentTiles){
                let adjacentTileX = adjacentTile[0];
                let adjacentTileY = adjacentTile[1];
                // Check if walkable
                if (this.getScene().tileAtLocationHasAttribute(adjacentTileX, adjacentTileY, "no_walk")){
                    continue;
                }
                // If it is known then ignore
                if (knownTiles.has(adjacentTileX, adjacentTileY)){
                    continue;
                }

                // Add to known tiles
                knownTiles.set(adjacentTileX, adjacentTileY, {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "shortest_path": appendLists(bestTilePath, [{"tile_x": adjacentTileX, "tile_y": adjacentTileY}])});

                // Add to edge tiles
                edgeTiles.push({"tile_x": adjacentTileX, "tile_y": adjacentTileY});
            }
        }

        // Keep looping while edge tiles exist
        while (edgeTiles.getLength() > 0){
            let currentTile = selectTile();
            exploreTiles(currentTile);
        }
        return knownTiles.toList();
    }

    /*
        Method Name: generateShortestRouteFromPointToPoint
        Method Parameters: 
            startTileX:
                A tile x coordinate
            startTileY:
                A tile y coordinate
            endTileX:
                A tile x coordinate
            endTileY:
                A tile y coordinate
            routeLengthLimit:
                The number of tiles length that a route is limited to
        Method Description: Creates the shortest possible route from one point to another
        Method Return: Route or null
    */
    generateShortestRouteFromPointToPoint(startTileX, startTileY, endTileX, endTileY, routeLengthLimit=Number.MAX_SAFE_INTEGER){
        if (startTileX === endTileX && startTileY === endTileY){ return Route.fromPath([{"tile_x": startTileX, "tile_y": startTileY}]); }
        if (!this.canWalkOnTile(startTileX, startTileY)){ throw new Error("Invalid start tile."); }
        if (!this.canWalkOnTile(endTileX, endTileY)){ throw new Error("Invalid end tile."); }

        let knownPathsFromStart = new NotSamXYSortedArrayList();
        let knownPathsFromEnd = new NotSamXYSortedArrayList();

        let edgeTilesFromStart = new NotSamLinkedList([{"tile_x": startTileX, "tile_y": startTileY, "from_start": true}]);
        let edgeTilesFromEnd = new NotSamLinkedList([{"tile_x": endTileX, "tile_y": endTileY, "from_start": false}]);

        knownPathsFromStart.set(startTileX, startTileY, {"path_length": 0, "previous_tile_x": null, "previous_tile_y": null});
        knownPathsFromEnd.set(endTileX, endTileY, {"path_length": 0, "previous_tile_x": null, "previous_tile_y": null});

        let selectBestPath = (bestPossibleLengthSoFar) => {
            /*
                Strategy:
                    Find path with attribute closest to the start name it eStart
                    Then find path from start closest to eStart and name it eStart
                    If calculateManhattanDistance(eStart, start) <= calculateManhattanDistance(eStart, end)
                        return eStart
                    else:
                        return eEnd
            */
            let eStart = null;
            let eEnd = null;
            let bestM = null;
            let bestMinTraversal = null;
            let eStartIndex = null;
            let eEndIndex = null;

            let foundBestPossibleDistance = false;

            // Find the two tiles that could connect and form the shortest possible path
            for (let i = edgeTilesFromEnd.getLength() - 1; i >= 0; i--){
                let edgeTileFromEnd = edgeTilesFromEnd.get(i);
                let edgeTileFromEndTileX = edgeTileFromEnd["tile_x"];
                let edgeTileFromEndTileY = edgeTileFromEnd["tile_y"];
                let edgeTileFromEndLength = knownPathsFromEnd.get(edgeTileFromEndTileX, edgeTileFromEndTileY)["path_length"];
                for (let j = edgeTilesFromStart.getLength() - 1; j >= 0; j--){
                    let edgeTileFromStart = edgeTilesFromStart.get(j);
                    let edgeTileFromStartTileX = edgeTileFromStart["tile_x"];
                    let edgeTileFromStartTileY = edgeTileFromStart["tile_y"];
                    let edgeTileFromStartLength = knownPathsFromStart.get(edgeTileFromStartTileX, edgeTileFromStartTileY)["path_length"];
                    let minTraversal = calculateManhattanDistance(edgeTileFromStartTileX, edgeTileFromStartTileY, edgeTileFromEndTileX, edgeTileFromEndTileY);
                    let startToEndDistance = edgeTileFromStartLength + edgeTileFromEndLength + minTraversal + 1; // the +1 is because both path lengths do not include the start tile and the end tile should be included in the total length
                    if (bestM === null || startToEndDistance < bestM){
                        eStart = edgeTileFromStart;
                        eEnd = edgeTileFromEnd;
                        bestM = startToEndDistance;
                        bestMinTraversal = minTraversal;
                        eEndIndex = i;
                        eStartIndex = j;
                    }

                    // If this is the best possible length then no need to search further
                    foundBestPossibleDistance = bestPossibleLengthSoFar != null && startToEndDistance === bestPossibleLengthSoFar;
                    if (foundBestPossibleDistance){
                        break;
                    }
                }
                // If this is the best possible length then no need to search further
                if (foundBestPossibleDistance){
                    break;
                }
            }

            let bestEdgeTile;
            let connectedTile;
            // If distance from start of path to current point is lower on the path from the "startTile" then select it
            if (calculateManhattanDistance(eStart["tile_x"], eStart["tile_y"], startTileX, startTileY) <= calculateManhattanDistance(eEnd["tile_x"], eEnd["tile_y"], endTileX, endTileY)){
                bestEdgeTile = eStart;
                connectedTile = eEnd;
                edgeTilesFromStart.pop(eStartIndex);
            }else{
                bestEdgeTile = eEnd;
                connectedTile = eStart;
                edgeTilesFromEnd.pop(eEndIndex);
            }

            let bestPathData = {"edge_tile": bestEdgeTile, "best_m": bestM, "best_min_traversal": bestMinTraversal, "has_complete_path": false, "connected_path": null};
            let completePath = bestMinTraversal === 1; 
            if (completePath){
                bestPathData["has_complete_path"] = true;
                bestPathData["connected_tile"] = connectedTile;
            }
            return bestPathData;
        }

        let updateKnownPathIfBetter = (knownPathsList, previousTileX, previousTileY, newPathLength, potentialPreviousTileX, potentialPreviousTileY) => {
            let previousTileInfo = knownPathsList.get(previousTileX, previousTileY);
            let exists = previousTileInfo != null;
            // If this doesn't exist then do nothing and return false
            if (!exists){
                return false;
            }

            let oldPathLength = previousTileInfo["path_length"];
            // If old path length was longer then replace it
            if (oldPathLength > newPathLength){
                // Update path length
                previousTileInfo["path_length"] = newPathLength;
                previousTileInfo["previous_tile_x"] = potentialPreviousTileX;
                previousTileInfo["previous_tile_y"] = potentialPreviousTileY;

                // Alert all paths that may be based on this one
                let adjacentTiles = [[previousTileX+1,previousTileY], [previousTileX-1, previousTileY], [previousTileX, previousTileY+1], [previousTileX, previousTileY-1]];
                for (let adjacentTile of adjacentTiles){
                    let adjacentTileX = adjacentTile[0];
                    let adjacentTileY = adjacentTile[1];
                    updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength + 1, previousTileX, previousTileY);
                }
            }
            return true;
        }

        let exploreTiles = (bestEdgeTile) => {
            let bETileX = bestEdgeTile["tile_x"];
            let bETileY = bestEdgeTile["tile_y"];
            let adjacentTiles = [[bETileX+1,bETileY], [bETileX-1, bETileY], [bETileX, bETileY+1], [bETileX, bETileY-1]];
            for (let adjacentTile of adjacentTiles){
                let adjacentTileX = adjacentTile[0];
                let adjacentTileY = adjacentTile[1];
                // Check if walkable
                if (!this.canWalkOnTile(adjacentTileX, adjacentTileY, "no_walk")){ continue; }

                // It's valid

                let knownPathsList;
                let activePathsList;
                let tileInfo;

                // Determine which is applicable
                if (bestEdgeTile["from_start"]){
                    knownPathsList = knownPathsFromStart;
                    activePathsList = edgeTilesFromStart;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": true};
                }else{
                    knownPathsList = knownPathsFromEnd;
                    activePathsList = edgeTilesFromEnd;
                    tileInfo = {"tile_x": adjacentTileX, "tile_y": adjacentTileY, "from_start": false};
                }

                let newPathLength = knownPathsList.get(bETileX, bETileY)["path_length"] + 1;
                // This is known then update
                let known = updateKnownPathIfBetter(knownPathsList, adjacentTileX, adjacentTileY, newPathLength, bETileX, bETileY);
                // If it wasn't known then add
                if (!known){
                    // Add it to known paths
                    knownPathsList.set(adjacentTileX, adjacentTileY, {"path_length": newPathLength, "previous_tile_x": bETileX, "previous_tile_y": bETileY});
                    // Add to active path list
                    activePathsList.push(tileInfo);
                }
            }
        }

        // takes two touching tiles and creates a path
        let createPath = (touchingTile1, touchingTile2) => {
            let tileFromStart = touchingTile1["from_start"] ? touchingTile1 : touchingTile2;
            let tileFromEnd = touchingTile1["from_start"] ? touchingTile2 : touchingTile1;

            let startPath = [];
            let endPath = [];
            

            // Add tile to front of the list
            startPath.unshift({"tile_x": tileFromStart["tile_x"], "tile_y": tileFromStart["tile_y"]})

            // Add tiles from start forwards
            let previousData = knownPathsFromStart.get(tileFromStart["tile_x"], tileFromStart["tile_y"]);

            let previousTileX = previousData["previous_tile_x"];
            let previousTileY = previousData["previous_tile_y"];

            let hasPreviousTile = (previousTileX != null && previousTileY != null);
            while (hasPreviousTile){
                // Add tile to front of the list
                startPath.unshift({"tile_x": previousTileX, "tile_y": previousTileY});

                // Go to next
                previousData = knownPathsFromStart.get(previousTileX, previousTileY);
                if (previousData === null){
                    debugger;
                }
                previousTileX = previousData["previous_tile_x"];
                previousTileY = previousData["previous_tile_y"];

                hasPreviousTile = (previousTileX != null && previousTileY != null);
            }

            // Add tile to back of the list
            endPath.unshift({"tile_x": tileFromEnd["tile_x"], "tile_y": tileFromEnd["tile_y"]})

            // Add tiles from start forwards
            previousData = knownPathsFromEnd.get(tileFromEnd["tile_x"], tileFromEnd["tile_y"]);
            previousTileX = previousData["previous_tile_x"];
            previousTileY = previousData["previous_tile_y"];

            hasPreviousTile = (previousTileX != null && previousTileY != null);
            while (hasPreviousTile){
                // Add tile to back of the list
                endPath.push({"tile_x": previousTileX, "tile_y": previousTileY});

                // Go to next
                previousData = knownPathsFromEnd.get(previousTileX, previousTileY);
                if (previousData === null){
                    debugger;
                }
                previousTileX = previousData["previous_tile_x"];
                previousTileY = previousData["previous_tile_y"];

                hasPreviousTile = (previousTileX != null && previousTileY != null);
            }
            return Route.fromPath(appendLists(startPath, endPath)); 
        }

        let bestPossibleRouteLength = calculateManhattanDistance(startTileX, startTileY, endTileX, endTileY);
        let bestFoundPathLengthSoFar = null;

        // While it is possible to create a path from
        while (bestPossibleRouteLength < routeLengthLimit){
            // If I can find no path from start then stop
            if (edgeTilesFromStart.getLength() === 0){
                break;
            }
            // If I can find no path from end then stop
            if (edgeTilesFromEnd.getLength() === 0){
                break;
            }

            let bestPathData = selectBestPath(bestPossibleRouteLength);

            // Update best m
            bestPossibleRouteLength = bestPathData["best_m"];

            // If the two paths met then distance is found. Note: With current design, the first full path is always the best possible path
            if (bestPathData["has_complete_path"]){
                return createPath(bestPathData["edge_tile"], bestPathData["connected_tile"]);
            }

            let bestEdgeTile = bestPathData["edge_tile"];

            // Explore
            exploreTiles(bestEdgeTile);
        }

        // None found
        return null;
    }

    /*
        Method Name: getSelectedItem
        Method Parameters: None
        Method Description: Gets the selected item from the inventory
        Method Return: Item or null
    */
    getSelectedItem(){
        return this.inventory.getSelectedItem();
    }

    /*
        Method Name: getUpdatedHitbox
        Method Parameters: None
        Method Description: Creates a hitbox for the character
        Method Return: RectangleHitbox
    */
    getUpdatedHitbox(){
        return new RectangleHitbox(this.getWidth(), this.getHeight(), this.getInterpolatedTickX(), this.getInterpolatedTickY());
    }

    /*
        Method Name: damage
        Method Parameters: 
            amount:
                Amount of damage to deal
        Method Description: Damages the character
        Method Return: void
    */
    damage(amount){
        if (amount < 0){ throw new Error("Invalid damage amount: " + amount.toString()); }
        if (amount === 0){ return; }
        this.healthBar.useHealth(amount);
        this.gamemode.getEventHandler().emit({
            "center_x": this.getInterpolatedTickCenterX(),
            "center_y": this.getInterpolatedTickCenterY(),
            "name": "injury"
        });
        if (this.getHealth() <= 0){
            this.die();
        }
    }

    /*
        Method Name: getHealth
        Method Parameters: None
        Method Description: Gets the health from the health bar
        Method Return: float
    */
    getHealth(){
        return this.healthBar.getHealth();
    }

    /*
        Method Name: getStabbed
        Method Parameters: 
            stabItem:
                The item using in the stabbing
        Method Description: Administers damage from a stab attack
        Method Return: void
    */
    getStabbed(stabItem){
        this.damage(0.75);
    }

    /*
        Method Name: updateMovement
        Method Parameters: None
        Method Description: Updates the position of a character
        Method Return: void
    */
    updateMovement(){
        // Nothing to do if between tiles
        if (this.isBetweenTiles()){ return; }
        let wantsToMoveUp = this.decisions["up"];
        let wantsToMoveDown = this.decisions["down"];
        let wantsToMoveLeft = this.decisions["left"];
        let wantsToMoveRight = this.decisions["right"];
        let wantsToSprint = this.decisions["sprint"];
        let movementKeysPressed = 0;
        movementKeysPressed += wantsToMoveUp ? 1 : 0;
        movementKeysPressed += wantsToMoveDown ? 1 : 0;
        movementKeysPressed += wantsToMoveLeft ? 1 : 0;
        movementKeysPressed += wantsToMoveRight ? 1 : 0;

        let numTicks = this.getCurrentTick();
        let allowedToMove = this.stunLock.isUnlocked();

        // If not sending proper movement input or not allowed to move then stop
        if (movementKeysPressed != 1 || !allowedToMove){
            if (this.isMoving()){
                this.movementDetails = null;
            }
            return; 
        }
        // 1 Movement key is being pressed
        let direction;
        let newTileX = this.tileX;
        let newTileY = this.tileY;

        

        if (wantsToMoveDown){
            direction = "down";
            newTileY -= 1;
        }else if (wantsToMoveLeft){
            direction = "left";
            newTileX -= 1;
        }else if (wantsToMoveRight){
            direction = "right";
            newTileX += 1;
        }else{
            direction = "up";
            newTileY += 1;
        }


        // Turn in direction if not moving
        if (!this.isMoving()){
            if (getMovementDirectionOf(this.animationManager.getVisualDirection()) != direction){
                this.animationManager.setVisualDirectionFromMovementDirection(direction);
                this.lookingDetails["direction"] = direction;
                this.lookingDetails["look_lock"].lock();
                return;
            }else if (this.lookingDetails["look_lock"].notReady()){
                return;
            }
        }

        // If breaking stride then don't move
        if (this.isMoving() && this.decisions["breaking_stride"]){
            this.movementDetails = null;
            return;
        }

        // Check if the tile is walkable before moving
        if (this.getScene().tileAtLocationHasAttribute(newTileX, newTileY, "no_walk")){
            if (this.isMoving()){
                this.movementDetails = null;
            }
            return; 
        }

        if (isRDebugging()){
            debugger;
        }

        let desiredMoveSpeed = WTL_GAME_DATA["general"]["walk_speed"];

        // Determine if the character is going to sprint
        let goingToSprint = wantsToSprint && this.getStaminaBar().hasStamina();
        // If sprinting use stamina
        if (goingToSprint){
            this.getStaminaBar().useStamina(WTL_GAME_DATA["human"]["stamina"]["sprinting_stamina_per_tile"]);
        }

        desiredMoveSpeed *= (goingToSprint ? WTL_GAME_DATA["general"]["sprint_multiplier"] : 1);
        let tickProgressFromPrevious = 0;
        // If say at tileX 1.5 and moving right then keep that 0.5 as progress for the next move
        let lastLocationX = this.tileX;
        let lastLocationY = this.tileY;
        // Handle tick progress from previous
        if (this.isMoving() && direction === this.movementDetails["direction"]){
            tickProgressFromPrevious = Math.ceil(this.movementDetails["reached_destination_tick"]) - this.movementDetails["reached_destination_tick"];
            if (tickProgressFromPrevious > 1){
                debugger
            }
            let distanceProgressFromPrevious = tickProgressFromPrevious * this.movementDetails["speed"] / 1000 * WTL_GAME_DATA["general"]["ms_between_ticks"];
            if (direction === "down"){
                lastLocationY -= distanceProgressFromPrevious / WTL_GAME_DATA["general"]["tile_size"];
            }else if (direction === "left"){
                lastLocationX -= distanceProgressFromPrevious / WTL_GAME_DATA["general"]["tile_size"];
            }else if (direction === "right"){
                lastLocationX += distanceProgressFromPrevious / WTL_GAME_DATA["general"]["tile_size"];
            }else{ // Up
                lastLocationY += distanceProgressFromPrevious / WTL_GAME_DATA["general"]["tile_size"];
            }
        }

        this.movementDetails = {
            "direction": direction,
            "sprinting": goingToSprint,
            "speed": desiredMoveSpeed,
            "last_frame_time": FRAME_COUNTER.getLastFrameTime(),
            "last_tick_number": GAME_TICK_SCHEDULER.getNumTicks(),
            "last_stood_tile_x": this.tileX,
            "last_stood_tile_y": this.tileY,
            "last_location_x": lastLocationX,
            "last_location_y": lastLocationY,
            "last_location_tick": numTicks,
            "reached_destination_tick": floatBandaid(numTicks + (WTL_GAME_DATA["general"]["tile_size"] * 1000) / (desiredMoveSpeed * WTL_GAME_DATA["general"]["ms_between_ticks"]) - tickProgressFromPrevious, 8)
        }
        this.tileX = newTileX;
        this.tileY = newTileY;
    }

    /*
        Method Name: setTileX
        Method Parameters: 
            tileX:
                A tile x coordinate
        Method Description: Setter
        Method Return: Setter
    */
    setTileX(tileX){
        this.tileX = tileX;
    }

    /*
        Method Name: setTileY
        Method Parameters: 
            tileY:
                A tile y coordinate
        Method Description: Setter
        Method Return: Setter
    */
    setTileY(tileY){
        this.tileY = tileY;
    }

    /*
        Method Name: hasVisionRestrictions
        Method Parameters: None
        Method Description: Checks if the character has any vision restrictions. 
        Method Return: Boolean, true -> yes it has vision restrictions, false -> no vision restrictions
    */
    hasVisionRestrictions(){
        return true;
    }

    /*
        Method Name: isVisibleTo
        Method Parameters: 
            observer:
                An observer
        Method Description: Checks if the character is visible to the observer
        Method Return: Boolean, true -> yes visible, false -> not visible
    */
    isVisibleTo(observer){
        return observer.canSee(this);
    }

    /*
        Method Name: setFacingUDLRDirection
        Method Parameters: 
            direction:
                A direction in ["left", "right", "up", "down"]
        Method Description: Changes the facing direction of the character
        Method Return: void
    */
    setFacingUDLRDirection(direction){
        this.animationManager.setVisualDirectionFromMovementDirection(direction);
    }

    /*
        Method Name: canSee
        Method Parameters: 
            entity:
                Another entity
        Method Description: Checks if the character can see another entity
        Method Return: Boolean, true -> can see, false -> cannot see
    */
    canSee(entity){
        let seeOnCurrentTile = this.couldSeeEntityIfOnTile(entity.getTileX(), entity.getTileY());
        // If I can see the enemy on their current tile then yes I can see them
        if (seeOnCurrentTile){ return true; }

        // Beyond this point character only
        if (!(entity instanceof Character)){
            throw new Error("Unhandled entity type.");
        }
        let char = entity;

        // If I can't see them on their current tile and they are not moving then I can't see them
        if (!char.isMoving()){ return false; }

        // Entity can't be seen on their current tile BUT they are moving

        // Determine their previous tile
        let charDirection = char.getFacingUDLRDirection();
        let previousTileX = char.getTileX();
        let previousTileY = char.getTileY();
        if (charDirection === "up"){
            previousTileY -= 1;
        }else if (charDirection === "down"){
            previousTileY += 1;
        }else if (charDirection === "left"){
            previousTileX += 1;
        }else if (charDirection === "right"){
            previousTileX -= 1;
        }

        // If we can see their previous tile, we can see them
        return this.couldSeeEntityIfOnTile(previousTileX, previousTileY);
    }

    /*
        Method Name: couldSeeEntityIfOnTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if the character could see an entity on a given tile
        Method Return: Boolean, yes -> could see, false -> no could not see
    */
    couldSeeEntityIfOnTile(tileX, tileY){
        return this.couldISeeEntityAtTileFromTile(this.getTileX(), this.getTileY(), tileX, tileY);
    }

    /*
        Method Name: couldISeeEntityAtTileFromTile
        Method Parameters: 
            mySupposedTileX:
                A tile x coordinate
            mySupposedTileY:
                A tile y coordinate
            otherTileX:
                A tile x coordinate
            otherTileY:
                A tile y coordinate
        Method Description: Checks if the character could see an entity on a given tile when standing on another given tile
        Method Return: Boolean, yes -> could see, false -> no could not see
    */
    couldISeeEntityAtTileFromTile(mySupposedTileX, mySupposedTileY, otherTileX, otherTileY){
        // If the observer (this) does not have vision restrictions
        if (!this.hasVisionRestrictions()){
            return true;
        }

        let tileInSingleCover = (tileX, tileY) => {
            return this.getScene().tileAtLocationHasAttribute(tileX, tileY, "single_cover");
        }

        let tileInMultiCover = (tileX, tileY) => {
            return this.getScene().tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
        }

        let distance = Math.sqrt(Math.pow(mySupposedTileX - otherTileX, 2) + Math.pow(mySupposedTileY - otherTileY, 2));
        if (distance > this.gamemode.getEnemyVisibilityDistance()){ return false; }
        // If in single cover that you can't be seen
        if (tileInSingleCover(otherTileX, otherTileY)){
            return distance <= 1;
        }
        // If not in single cover and not in multi cover then you are visible
        if (!tileInMultiCover(otherTileX, otherTileY)){
            return true;
        }

        // If cover is not in multiple cover and you are then it cannot see you 
        if (!tileInMultiCover(mySupposedTileX, mySupposedTileY)){
            return distance <= 1;
        }

        // So now we know observer is in multicover
        return distance <= 1 || this.getScene().tilesInSameMultiCover(otherTileX, otherTileY, mySupposedTileX, mySupposedTileY);   
    }

    /*
        Method Name: isInSingleCover
        Method Parameters: None
        Method Description: Checks if the character is in single cover
        Method Return: Boolean, true -> yes in single cover, false -> not in single cover
    */
    isInSingleCover(){
        if (!this.isMoving()){
            return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "single_cover");
        }
        return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "single_cover") && this.getScene().tileAtLocationHasAttribute(this.movementDetails["last_location_x"], this.movementDetails["last_location_y"], "single_cover");
    }

    /*
        Method Name: isInMultipleCover
        Method Parameters: None
        Method Description: Checks if the character is in multi cover
        Method Return: Boolean, true -> yes in single cover, false -> not in single cover
    */
    isInMultipleCover(){
        if (!this.isMoving()){
            return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "multi_cover");
        }
        return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "multi_cover") && this.getScene().tileAtLocationHasAttribute(this.movementDetails["last_location_x"], this.movementDetails["last_location_y"], "multi_cover");
    }

    /*
        Method Name: getShot
        Method Parameters: 
            model:
                Model of shooter
            shooterID:
                Id of shooter
        Method Description: handles being shot by another character
        Method Return: void
    */
    getShot(model, shooterID){
        this.damage(1);
        // Assumes not dead prior to damage
        if (this.isDead()){
            this.gamemode.getEventHandler().emit({
                "victim_class": this.getModel(),
                "killer_class": model,
                "killer_id": shooterID,
                "tile_x": this.getTileX(),
                "tile_y": this.getTileY(),
                "center_x": this.getInterpolatedTickCenterX(),
                "center_y": this.getInterpolatedTickCenterY(),
                "name": "kill"
            });
        }
    }


    /*
        Method Name: getHalfWidth
        Method Parameters: None
        Method Description: Calculates the distance from the center of the character to its side (left/right)
        Method Return: float
        Note: From center to side
    */
    getHalfWidth(){
        return (this.getWidth() - 1)/2;
    }

    // Note: From center to side
    /*
        Method Name: getHalfHeight
        Method Parameters: None
        Method Description: Calculates the distance from the center of the character to its side (up/down)
        Method Return: float
        Note: From center to side
    */
    getHalfHeight(){
        return (this.getHeight() - 1)/2;
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Gets the width of the character
        Method Return: float/int
    */
    getWidth(){
        return WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Gets the height of the character
        Method Return: float/int
    */
    getHeight(){
        return WTL_GAME_DATA["general"]["tile_size"];
    }

    /*
        Method Name: getInventory
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getInventory(){
        return this.inventory;
    }

    /*
        Method Name: getFacingDirection
        Method Parameters: None
        Method Description: Gets the visual/facing direction of the chracter
        Method Return: String in ["front", "back", "left", "right"]
    */
    getFacingDirection(){
        return this.animationManager.getVisualDirection();
    }

    /*
        Method Name: getFacingUDLRDirection
        Method Parameters: None
        Method Description: Gets the visual/facing direction of the chracter
        Method Return: String in ["up", "down", "left", "right"]
    */
    getFacingUDLRDirection(){
        return getMovementDirectionOf(this.getFacingDirection());
    }

    /*
        Method Name: getModel
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getModel(){
        return this.model;
    }

    /*
        Method Name: getModelCategory
        Method Parameters: None
        Method Description: Gets the model category of the character
        Method Return: String
    */
    getModelCategory(){
        return WTL_GAME_DATA["model_to_model_category"][this.getModel()];
    }

    /*
        Method Name: getInterpolatedCenterX
        Method Parameters: None
        Method Description: Gets the center x of the character for display
        Method Return: float
    */
    getInterpolatedCenterX(){
        return this.getInterpolatedX() + (this.getImage().width - 1) / 2;
    }

    /*
        Method Name: getInterpolatedCenterY
        Method Parameters: None
        Method Description: Gets the center y of the character for display
        Method Return: float
    */
    getInterpolatedCenterY(){
        return this.getInterpolatedY() - (this.getImage().height - 1) / 2;
    }

    /*
        Method Name: getInterpolatedTickCenterX
        Method Parameters: None
        Method Description: Gets the center x of the character
        Method Return: float
    */
    getInterpolatedTickCenterX(){
        return this.getInterpolatedTickX() + (this.getImage().width - 1) / 2;
    }

    /*
        Method Name: getInterpolatedTickCenterY
        Method Parameters: None
        Method Description: Gets the center y of the character
        Method Return: float
    */
    getInterpolatedTickCenterY(){
        return this.getInterpolatedTickY() - (this.getImage().height - 1) / 2;
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Gets the center x of the character
        Method Return: float
    */
    getX(){
        return this.getInterpolatedCenterX();
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Gets the center y of the character
        Method Return: float
    */
    getY(){
        return this.getInterpolatedCenterY();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Acts during a tick
        Method Return: void
    */
    tick(){
        if (this.isDead()){ return; }
        this.lookingDetails["look_lock"].tick();
        this.staminaBar.tick();
        this.stunLock.tick();
        this.inventory.tick();
        this.inventory.tickSelectedItem();

        this.makeDecisions();
        this.actOnDecisions();
    }

    // Abstract
    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: TODO
        Method Return: TODO
    */
    makeDecisions(){}

    /*
        Method Name: makeDecisionsForSelectedItem
        Method Parameters: None
        Method Description: Makes decisions for the held/selected item
        Method Return: void
    */
    makeDecisionsForSelectedItem(){
        let selectedItem = this.getInventory().getSelectedItem();
        if (selectedItem != null){
            selectedItem.makeDecisions();
        }
    }

    /*
        Method Name: actOnDecisions
        Method Parameters: None
        Method Description: Takes actions based on decisions
        Method Return: void
    */
    actOnDecisions(){
        this.updateMovement();
        if (this.stunLock.isLocked()){ return; }
        this.inventory.actOnDecisions();
        this.inventory.actOnDecisionsForSelectedItem();
    }

    /*
        Method Name: displayWhenFocused
        Method Parameters: None
        Method Description: Displays special things when focused by the scene
        Method Return: void
    */
    displayWhenFocused(){
        if (this.isDead()){ return; }
        this.inventory.display();
        this.staminaBar.display();
        this.healthBar.display();
    }

    /*
        Method Name: getImage
        Method Parameters: None
        Method Description: Gets the image of the character
        Method Return: Image
    */
    getImage(){
        return IMAGES[this.model + this.animationManager.getCurrentImageSuffix(this.getXVelocity(), this.getYVelocity())];
    }

    /*
        Method Name: isMoving
        Method Parameters: None
        Method Description: Checks if moving
        Method Return: true -> moving, false -> not moving
    */
    isMoving(){
        return this.movementDetails != null && this.isAlive();
    }

    /*
        Method Name: isSprinting
        Method Parameters: None
        Method Description: Checks if sprining
        Method Return: true -> sprinting, false -> not sprinting
    */
    isSprinting(){
        return this.movementDetails != null && this.movementDetails["sprinting"];
    }

    /*
        Method Name: getTileX
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getTileX(){
        return this.tileX;
    }

    /*
        Method Name: getTileY
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getTileY(){
        return this.tileY;
    }

    /*
        Method Name: getInterpolatedTickX
        Method Parameters: None
        Method Description: Gets the x location of the top left pixel of the character
        Method Return: float
    */
    getInterpolatedTickX(){
        let xOfTile = this.gamemode.getScene().getXOfTile(this.tileX);
        // If not moving (or moving u/d) then x is just tile x
        if (!this.isMoving() || this.movementDetails["direction"] === "up" || this.movementDetails["direction"] === "down"){
            return xOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "left" ? -1 : 1;
        let x = this.gamemode.getScene().getXOfTile(this.movementDetails["last_location_x"]);
        return x + this.movementDetails["speed"] * dir * (this.getCurrentTick() - this.movementDetails["last_tick_number"]) * WTL_GAME_DATA["general"]["ms_between_ticks"] / 1000;
    }

    /*
        Method Name: getInterpolatedX
        Method Parameters: None
        Method Description: Gets the x location of the top left pixel of the character. In between ticks.
        Method Return: float
    */
    getInterpolatedX(){
        if (GAME_TICK_SCHEDULER.isPaused()){
            return this.getInterpolatedTickX();
        }
        let xOfTile = this.gamemode.getScene().getXOfTile(this.tileX);
        // If not moving (or moving u/d) then x is just tile x
        if (!this.isMoving() || this.movementDetails["direction"] === "up" || this.movementDetails["direction"] === "down"){
            return xOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "left" ? -1 : 1;
        let x = this.gamemode.getScene().getXOfTile(this.movementDetails["last_location_x"]);
        return x + this.movementDetails["speed"] * dir * (FRAME_COUNTER.getLastFrameTime() - this.movementDetails["last_frame_time"]) / 1000;
    }

    /*
        Method Name: getDisplayX
        Method Parameters: 
            lX:
                The x of the left side of the screen
        Method Description: Comes up with a x position for the character center in relation to the position of the scene's focus
        Method Return: float
    */
    getDisplayX(lX){
        return (this.getInterpolatedCenterX() - lX) * gameZoom;
    }

    /*
        Method Name: getInterpolatedY
        Method Parameters: None
        Method Description: Gets the y location of the top left pixel of the character. In between ticks.
        Method Return: float
    */
    getInterpolatedY(){
        if (GAME_TICK_SCHEDULER.isPaused()){
            return this.getInterpolatedTickY();
        }
        let yOfTile = this.gamemode.getScene().getYOfTile(this.tileY);
        // If not moving (or moving l/r) then y is just tile y
        if (!this.isMoving() || this.movementDetails["direction"] === "left" || this.movementDetails["direction"] === "right"){
            return yOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] === "down" ? -1 : 1;
        let y = this.gamemode.getScene().getYOfTile(this.movementDetails["last_location_y"]);
        return y + this.movementDetails["speed"] * dir * (FRAME_COUNTER.getLastFrameTime() - this.movementDetails["last_frame_time"]) / 1000;
    }

    /*
        Method Name: getInterpolatedTickY
        Method Parameters: None
        Method Description: Gets the y location of the top left pixel of the character
        Method Return: float
    */
    getInterpolatedTickY(){
        let yOfTile = this.gamemode.getScene().getYOfTile(this.tileY);
        // If not moving (or moving l/r) then y is just tile y
        if (!this.isMoving() || this.movementDetails["direction"] == "left" || this.movementDetails["direction"] == "right"){
            return yOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "down" ? -1 : 1;
        let y = this.gamemode.getScene().getYOfTile(this.movementDetails["last_location_y"]);
        return y + this.movementDetails["speed"] * dir * (this.getCurrentTick() - this.movementDetails["last_tick_number"]) * WTL_GAME_DATA["general"]["ms_between_ticks"] / 1000;
    }

    /*
        Method Name: getDisplayY
        Method Parameters: 
            bY:
                The y of the bottom of the screen
        Method Description: Comes up with a x position for the character center in relation to the position of the scene's focus
        Method Return: float
    */
    getDisplayY(bY){
        return this.gamemode.getScene().changeToScreenY((this.getInterpolatedCenterY() - bY) * gameZoom);
    }

    /*
        Method Name: getCurrentTick
        Method Parameters: None
        Method Description: Gets the current tick
        Method Return: integer
    */
    getCurrentTick(){
        return this.gamemode.getCurrentTick();
    }

    /*
        Method Name: isBetweenTiles
        Method Parameters: None
        Method Description: Checks if the character is between tiles
        Method Return: Boolean, true -> between tiles, false -> not between tiles
    */
    isBetweenTiles(){
        if (!this.isMoving()){
            return false;
        }
        return Math.ceil(this.movementDetails["reached_destination_tick"]) != this.getCurrentTick();
    }

    /*
        Method Name: getXVelocity
        Method Parameters: None
        Method Description: Gets the character x velocity
        Method Return: float
    */
    getXVelocity(){
        if (!this.isMoving()){ return 0; }
        if (this.movementDetails["direction"] === "up" || this.movementDetails["direction"] === "down"){ return 0; }
        return this.movementDetails["speed"] * (this.movementDetails["direction"] === "left" ? -1 : 1);
    }

    /*
        Method Name: getYVelocity
        Method Parameters: None
        Method Description: Gets the character y velocity
        Method Return: float
    */
    getYVelocity(){
        if (!this.isMoving()){ return 0; }
        if (this.movementDetails["direction"] === "left" || this.movementDetails["direction"] === "right"){ return 0; }
        return this.movementDetails["speed"] * (this.movementDetails["direction"] === "down" ? -1 : 1);
    }

    /*
        Method Name: display
        Method Parameters: 
            lX:
                The x of the left of the screen
            rX:
                The x of the right of the screen
            bY:
                The y of the bottom of the screen
            tY:
                The y of the top of the screen
        Method Description: Displays the character
        Method Return: void
    */
    display(lX, rX, bY, tY){
        if (this.isDead()){ return; }
        let x = this.getDisplayX(lX); // center of character
        let y = this.getDisplayY(bY); // center of character
        let onScreen = pointInRectangle(x, y, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(x-this.getWidth()/2, y-this.getHeight()/2, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(x+this.getWidth()/2, y-this.getHeight()/2, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(x-this.getWidth()/2, y+this.getHeight()/2, 0, getScreenWidth(), 0, getScreenHeight()) || pointInRectangle(x+this.getWidth()/2, y+this.getHeight()/2, 0, getScreenWidth(), 0, getScreenHeight());
        if (!onScreen){ return; }
        if (this.animationManager.getVisualDirection() === "back" || this.animationManager.getVisualDirection() === "left"){
            this.inventory.displaySelectedItem(lX, bY);
        }
        
        translate(x, y);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(this.getImage(), -1 * this.getWidth() / 2, -1 * this.getHeight() / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * x, -1 * y);

        if (!(this.animationManager.getVisualDirection() === "back" || this.animationManager.getVisualDirection() === "left")){
            this.inventory.displaySelectedItem(lX, bY);
        }
    }
}