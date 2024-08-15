/*
    Notes:
        Assuming player does not move > 1 tile / tick
*/
class Character extends Entity {
    constructor(gamemode, model){
        super(gamemode);
        this.health = 1;
        this.model = model;
        this.animationManager = new CharacterAnimationManager();
        this.tileX = 0;
        this.tileY = 0;
        this.lookingDetails = {
            "direction": null,
            "look_lock": new TickLock(3)
        }
        this.movementDetails = null;
        this.inventory = new Inventory();
        this.decisions = {
            "up": false,
            "down": false,
            "left": false,
            "right": false,
            "sprint": false
        }
    }

    generateShortestRouteToPoint(endTileX, endTileY){
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

        let tryToAddTile = (tileX, tileY, pathToTile, startToEnd=true) => {
            if (!tileCanBeWalkedOn(tileX, tileY)){ return; }
            if (tileAlreadyChecked(tileX, tileY, startToEnd)){ return; }
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
                    console.log("merging", bestPath, newLength, combinedPath)
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

        let hasFoundTheBestPossiblePath = () => {
            /*
                Note: This will return true when:
                    An optimal path is found
                    OR
                    A path has found that has a length where all paths with optimal distance to end are <= that path's length (so like say 15 but then theres a tile that is 13 to reach but optimally 3 away from the end it can AT BEST be 16 if followed)
            */
            let optimalPathLength = Math.abs(endTileX - startTileX) + Math.abs(endTileY - startTileY) + 1; // + 1 because say start 00 end 01 it would be 2 length not 1 but abs(dx) + abs(dy) = 1
            let bestFoundPathLength = Number.MAX_SAFE_INTEGER;
            let bestPossibleUndiscoveredPathLength = Number.MAX_SAFE_INTEGER;

            let pathOfStartTile = startTile["shortest_path"];
            let pathOfEndTile = endTile["shortest_path"];
            
            let lastTileOnStartPath = pathOfStartTile[pathOfStartTile.length-1];
            let startTileHasCompletedPath = lastTileOnStartPath["tile_x"] == endTile["tile_x"] && lastTileOnStartPath["tile_y"] == endTile["tile_y"];
            
            let firstTileOnEndPath = pathOfEndTile[0];
            let endTileHasCompletedPath = firstTileOnEndPath["tile_x"] == startTile["tile_x"] && firstTileOnEndPath["tile_y"] == startTile["tile_y"];

            // Check for known paths
            if (startTileHasCompletedPath){
                bestFoundPathLength = pathOfStartTile.length;
            }
            if (endTileHasCompletedPath){
                bestFoundPathLength = Math.min(bestFoundPathLength, pathOfEndTile.length);
            }

            // Check for undiscovered potential paths
            for (let tile of tiles){
                let effectiveEndX = endTileX;
                let effectiveEndY = endTileY;
                if (!tile["path_direction"]){
                    effectiveEndX = startTileX;
                    effectiveEndY = startTileY;
                }
                // If found the a path
                let tileDistanceToEnd = Math.abs(effectiveEndX - tile["tile_x"]) + Math.abs(effectiveEndY - tile["tile_y"]);
                // If this tile hasn't been explored from this direction, check the best possible path length that could result from this path
                if (!tile["checked"][tile["path_direction"].toString()]){
                    let bestPossibleUndiscoveredPathLengthFromThisTile = tile["shortest_path"].length + tileDistanceToEnd;
                    // Update record, if better
                    bestPossibleUndiscoveredPathLength = Math.min(bestPossibleUndiscoveredPathLengthFromThisTile, bestPossibleUndiscoveredPathLength);
                }
            }

            // If the best possible undiscovered path *would be* worse or the same as the best found one then return that the best one has been found
            return bestPossibleUndiscoveredPathLength >= bestFoundPathLength;
        }

        let pickBestTile = () => {
            // TODO: Use a heuristic to find the tile that is both the shortest and the closest to the end
            let chosenTile = null;
            for (let tile of tiles){
                if (!tile["checked"][tile["path_direction"].toString()]){
                    chosenTile = tile;
                    break;
                }
            }
            return chosenTile;
        }

        let getBestPath = () => {
            let pathOfStartTile = startTile["shortest_path"];
            let pathOfEndTile = endTile["shortest_path"];
            
            let lastTileOnStartPath = pathOfStartTile[pathOfStartTile.length-1];
            let startTileHasCompletedPath = lastTileOnStartPath["tile_x"] == endTile["tile_x"] && lastTileOnStartPath["tile_y"] == endTile["tile_y"];
            
            let firstTileOnEndPath = pathOfEndTile[0];
            let endTileHasCompletedPath = firstTileOnEndPath["tile_x"] == startTile["tile_x"] && firstTileOnEndPath["tile_y"] == startTile["tile_y"];

            // If both have full paths
            if (startTileHasCompletedPath && endTileHasCompletedPath){
                if (pathOfStartTile.length < pathOfEndTile.length){
                    return pathOfStartTile;
                }else{
                    return pathOfEndTile;
                }
            }
            // If only start tile has a full path
            else if (startTileHasCompletedPath){
                return pathOfStartTile;
            }
            // Else only end tile has a full path
            else if (endTileHasCompletedPath){
                return pathOfEndTile;
            }
            // Else neither have completed return null
            else{
                return null;
            } 
        }

        let hasPathsInBothDirections = () => {
            // TODO: If one direction has zero active paths then its stuck and the answer will never be found!
            // Check if it has paths forward
            let pathsForward = false;
            let pathsBackwards = false;
            for (let tile of tiles){
                if (tile["path_direction"] && !tile["checked"]["true"]){
                    pathsForward = true;
                }else if (!tile["path_direction"] && !tile["checked"]["false"]){
                    pathsBackwards = true;
                }
                if (pathsForward && pathsBackwards){
                    return true;
                }
            }
            return false;
        }

        let hasFoundAPath = () => {
            let pathOfStartTile = startTile["shortest_path"];
            let pathOfEndTile = endTile["shortest_path"];
            
            let lastTileOnStartPath = pathOfStartTile[pathOfStartTile.length-1];
            let startTileHasCompletedPath = lastTileOnStartPath["tile_x"] === endTile["tile_x"] && lastTileOnStartPath["tile_y"] ===endTile["tile_y"];
            if (startTileHasCompletedPath){ return true;}

            let firstTileOnEndPath = pathOfEndTile[0];
            let endTileHasCompletedPath = firstTileOnEndPath["tile_x"] === startTile["tile_x"] && firstTileOnEndPath["tile_y"] === startTile["tile_y"];
            if (endTileHasCompletedPath){ return true;}
            return false;
        }

        // Add first tile
        tryToAddTile(startTileX, startTileY, []);
        tryToAddTile(endTileX, endTileY, [], false);
        let startTile = tiles[0];
        let endTile = tiles[1];
        while (hasUncheckedTiles() && !hasFoundTheBestPossiblePath() && hasPathsInBothDirections()){
            let currentTile = pickBestTile();
            currentTile["checked"][currentTile["path_direction"].toString()] = true;
            addAdjacentTilesAsUnchecked(currentTile["tile_x"], currentTile["tile_y"], currentTile["shortest_path"], currentTile["path_direction"]);
        }

        if (hasFoundAPath()){
            return Route.fromPath(getBestPath());
        }else{
            return null;
        }
    }

    getSelectedItem(){
        return this.inventory.getSelectedItem();
    }

    is(otherEntity){
        return this.getID() == otherEntity.getID();
    }

    getUpdatedHitbox(){
        return new RectangleHitbox(this.getWidth(), this.getHeight(), this.getInterpolatedTickCenterX(), this.getInterpolatedTickCenterY());
    }

    damage(amount){
        this.health -= amount;
        if (this.health <= 0){
            this.die();
        }
    }

    getStabbed(model){
        this.damage(0.75);
    }

    resetDecisions(){
        this.decisions["up"] = false;
        this.decisions["down"] = false;
        this.decisions["left"] = false;
        this.decisions["right"] = false;
        this.decisions["sprint"] = false;
    }

    updateMovement(){
        // Nothing to do if between tiles
        if (this.betweenTiles()){ return; }
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

        let numTicks = TICK_SCHEDULER.getNumTicks();
        if (movementKeysPressed != 1){
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
            if (this.animationManager.getAlternativeDirection() != direction){
                this.animationManager.setDirectionFromAlternate(direction);
                this.lookingDetails["direction"] = direction;
                this.lookingDetails["look_lock"].lock();
                return;
            }else if (this.lookingDetails["look_lock"].notReady()){
                return;
            }
        }

        // Check if the tile is walkable before moving
        if (this.getScene().tileAtLocationHasAttribute(newTileX, newTileY, "no_walk")){
            if (this.isMoving()){
                this.movementDetails = null;
            }
            return; 
        }

        // TODO: Check if there is a tile that I'm walking to
        let desiredMoveSpeed = RETRO_GAME_DATA["general"]["walk_speed"];
        desiredMoveSpeed *= (wantsToSprint ? RETRO_GAME_DATA["general"]["sprint_multiplier"] : 1);
        let tickProgressFromPrevious = 0;
        // If say at tileX 1.5 and moving right then keep that 0.5 as progress for the next move
        let lastLocationX = this.tileX;
        let lastLocationY = this.tileY;
        // Handle tick progress from previous
        if (this.isMoving() && direction == this.movementDetails["direction"]){
            tickProgressFromPrevious = Math.ceil(this.movementDetails["reached_destination_tick"]) - this.movementDetails["reached_destination_tick"];
            let distanceProgressFromPrevious = tickProgressFromPrevious * this.movementDetails["speed"] / 1000 * RETRO_GAME_DATA["general"]["ms_between_ticks"];
            if (direction == "down"){
                lastLocationY -= distanceProgressFromPrevious / RETRO_GAME_DATA["general"]["tile_size"];
            }else if (direction == "left"){
                lastLocationX -= distanceProgressFromPrevious / RETRO_GAME_DATA["general"]["tile_size"];
            }else if (direction == "right"){
                lastLocationX += distanceProgressFromPrevious / RETRO_GAME_DATA["general"]["tile_size"];
            }else{ // Up
                lastLocationY += distanceProgressFromPrevious / RETRO_GAME_DATA["general"]["tile_size"];
            }
        }
        this.movementDetails = {
            "direction": direction,
            "speed": desiredMoveSpeed,
            "last_frame_time": FRAME_COUNTER.getLastFrameTime(),
            "last_tick_number": TICK_SCHEDULER.getNumTicks(),
            "last_stood_tile_x": this.tileX,
            "last_stood_tile_y": this.tileY,
            "last_location_x": lastLocationX,
            "last_location_y": lastLocationY,
            "last_location_tick": numTicks,
            "reached_destination_tick": numTicks + RETRO_GAME_DATA["general"]["tile_size"] / desiredMoveSpeed * 1000 / RETRO_GAME_DATA["general"]["ms_between_ticks"] - tickProgressFromPrevious
        }
        this.tileX = newTileX;
        this.tileY = newTileY;
    }

    setTileX(tileX){
        this.tileX = tileX;
    }

    setTileY(tileY){
        this.tileY = tileY;
    }

    hasVisionRestrictions(){
        return true;
    }

    isVisibleTo(observer){
        // If the observer has vision restrictions
        if (!observer.hasVisionRestrictions()){
            return true;
        }
        let distance = Math.sqrt(Math.pow(observer.getTileX() - this.getTileX(), 2) + Math.pow(observer.getTileY() - this.getTileY(), 2));
        if (distance > RETRO_GAME_DATA["general"]["entity_render_distance"]){ return false; }
        // If in single cover that you can't be seen
        if (this.isInSingleCover()){
            return distance <= 1;
        }
        // If not in single cover and not in multi cover then you are visible
        if (!this.isInMultipleCover()){
            return true;
        }

        // If cover is not in multiple cover and you are then it cannot see you 
        if (!observer.isInMultipleCover()){
            return distance <= 1;
        }

        // So now we know observer is in multicover
        return distance <= 1 || this.getScene().isInSameMultiCover(this, observer); 
    }

    isInSingleCover(){
        if (!this.isMoving()){
            return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "single_cover");
        }
        return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "single_cover") && this.getScene().tileAtLocationHasAttribute(this.movementDetails["last_location_x"], this.movementDetails["last_location_y"], "single_cover");
    }

    isInMultipleCover(){
        if (!this.isMoving()){
            return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "multi_cover");
        }
        return this.getScene().tileAtLocationHasAttribute(this.tileX, this.tileY, "multi_cover") && this.getScene().tileAtLocationHasAttribute(this.movementDetails["last_location_x"], this.movementDetails["last_location_y"], "multi_cover");
    }

    getShot(model){
        this.damage(1);
        // Assumes not dead prior to damage
        if (this.isDead()){
            this.gamemode.getEventHandler().emit({
                "victim_class": this.getModel(),
                "killer_class": model,
                "name": "kill"
            });
        }
    }

    getWidth(){
        return RETRO_GAME_DATA["general"]["tile_size"];
    }

    getHeight(){
        return RETRO_GAME_DATA["general"]["tile_size"];
    }

    getInventory(){
        return this.inventory;
    }

    getFacingDirection(){
        return this.animationManager.getDirection();
    }

    getModel(){
        return this.model;
    }

    getModelCategory(){
        return RETRO_GAME_DATA["model_to_model_category"][this.getModel()];
    }

    getInterpolatedCenterX(){
        return this.getInterpolatedX() + this.getImage().width / 2;
    }

    getInterpolatedCenterY(){
        return this.getInterpolatedY() - this.getImage().height / 2;
    }

    getInterpolatedTickCenterX(){
        return this.getInterpolatedTickX() + this.getImage().width / 2;
    }

    getInterpolatedTickCenterY(){
        return this.getInterpolatedTickY() - this.getImage().height / 2;
    }

    tick(){
        this.lookingDetails["look_lock"].tick();
        this.inventory.tick();
        this.inventory.tickSelectedItem();

        this.makeDecisions();
        this.actOnDecisions();
    }

    makeDecisions(){
        this.resetDecisions();
        this.inventory.makeDecisionsForSelectedItem();
    }

    actOnDecisions(){
        this.updateMovement();
        this.inventory.actOnDecisionsForSelectedItem();
    }

    displayWhenFocused(){
        this.inventory.display();
    }

    getImage(){
        return IMAGES[this.model + this.animationManager.getCurrentImageSuffix(this.getXVelocity(), this.getYVelocity())];
    }

    isMoving(){
        return this.movementDetails != null;
    }

    getTileX(){
        return this.tileX;
    }

    getTileY(){
        return this.tileY;
    }

    getInterpolatedTickX(){
        let xOfTile = this.gamemode.getScene().getXOfTile(this.tileX);
        // If not moving (or moving u/d) then x is just tile x
        if (!this.isMoving() || this.movementDetails["direction"] == "up" || this.movementDetails["direction"] == "down"){
            return xOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "left" ? -1 : 1;
        let x = this.gamemode.getScene().getXOfTile(this.movementDetails["last_location_x"]);
        return x + this.movementDetails["speed"] * dir * (TICK_SCHEDULER.getNumTicks() - this.movementDetails["last_tick_number"]) * RETRO_GAME_DATA["general"]["ms_between_ticks"] / 1000;
    }

    getInterpolatedX(){
        let xOfTile = this.gamemode.getScene().getXOfTile(this.tileX);
        // If not moving (or moving u/d) then x is just tile x
        if (!this.isMoving() || this.movementDetails["direction"] == "up" || this.movementDetails["direction"] == "down"){
            return xOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "left" ? -1 : 1;
        let x = this.gamemode.getScene().getXOfTile(this.movementDetails["last_location_x"]);
        return x + this.movementDetails["speed"] * dir * (FRAME_COUNTER.getLastFrameTime() - this.movementDetails["last_frame_time"]) / 1000;
    }

    getDisplayX(lX){
        return (this.getInterpolatedCenterX() - lX) * gameZoom;
    }

    getInterpolatedY(){
        let yOfTile = this.gamemode.getScene().getYOfTile(this.tileY);
        // If not moving (or moving l/r) then y is just tile y
        if (!this.isMoving() || this.movementDetails["direction"] == "left" || this.movementDetails["direction"] == "right"){
            return yOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "down" ? -1 : 1;
        let y = this.gamemode.getScene().getYOfTile(this.movementDetails["last_location_y"]);
        return y + this.movementDetails["speed"] * dir * (FRAME_COUNTER.getLastFrameTime() - this.movementDetails["last_frame_time"]) / 1000;
    }

    getInterpolatedTickY(){
        let yOfTile = this.gamemode.getScene().getYOfTile(this.tileY);
        // If not moving (or moving l/r) then y is just tile y
        if (!this.isMoving() || this.movementDetails["direction"] == "left" || this.movementDetails["direction"] == "right"){
            return yOfTile;
        }
        // Else moving l/r
        let dir = this.movementDetails["direction"] == "down" ? -1 : 1;
        let y = this.gamemode.getScene().getYOfTile(this.movementDetails["last_location_y"]);
        return y + this.movementDetails["speed"] * dir * (TICK_SCHEDULER.getNumTicks() - this.movementDetails["last_tick_number"]) * RETRO_GAME_DATA["general"]["ms_between_ticks"] / 1000;
    }

    getDisplayY(bY){
        return this.gamemode.getScene().changeToScreenY((this.getInterpolatedCenterY() - bY) * gameZoom);
    }

    betweenTiles(){
        if (!this.isMoving()){
            return false;
        }
        return Math.ceil(this.movementDetails["reached_destination_tick"]) != TICK_SCHEDULER.getNumTicks();
    }

    getXVelocity(){
        if (!this.isMoving()){ return 0; }
        if (this.movementDetails["direction"] == "up" || this.movementDetails["direction"] == "down"){ return 0; }
        return this.movementDetails["speed"] * (this.movementDetails["direction"] == "left" ? -1 : 1);
    }

    getYVelocity(){
        if (!this.isMoving()){ return 0; }
        if (this.movementDetails["direction"] == "left" || this.movementDetails["direction"] == "right"){ return 0; }
        return this.movementDetails["speed"] * (this.movementDetails["direction"] == "down" ? -1 : 1);
    }

    display(lX, rX, bY, tY){
        if (this.isDead()){ return; }
        let x = this.getDisplayX(lX);
        let y = this.getDisplayY(bY);
        if (!pointInRectangle(x, y, 0, getScreenWidth(), 0, getScreenHeight())){ return; }
        if (this.animationManager.getDirection() == "back" || this.animationManager.getDirection() == "left"){
            this.inventory.displaySelectedItem(lX, bY);
        }
        
        translate(x, y);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(this.getImage(), -1 * this.getWidth() / 2, -1 * this.getHeight() / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * x, -1 * y);

        if (!(this.animationManager.getDirection() == "back" || this.animationManager.getDirection() == "left")){
            this.inventory.displaySelectedItem(lX, bY);
        }
    }
}