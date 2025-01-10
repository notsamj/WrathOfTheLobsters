class Route {
    constructor(){
        this.tileSequence = [];
    }

    containsTile(tileX, tileY){
        return this.getIndexOfTile(tileX, tileY) != -1;
    }

    getIndexOfTile(tileX, tileY){
        for (let i = 0; i < this.getLength(); i++){
            let tile = this.tileSequence[i];
            if (tile["tile_x"] === tileX && tile["tile_y"] === tileY){
                return i;
            }
        }
        return -1;
    }

    getLastTile(){
        return this.tileSequence[this.getLength() - 1];
    }

    shortenToLength(maxLength){
        // Shorten the route by repeatedly removing the last element
        while (this.getLength() > maxLength){
            this.tileSequence.pop();
        }
    }

    getTileInRouteAtIndex(index){
        return this.tileSequence[index];
    }

    getLength(){
        return this.tileSequence.length;
    }

    getMovementDistance(){
        return this.getLength() - 1;
    }

    isEmpty(){
        return this.getLength() === 0;
    }

    addTile(tileX, tileY){
        this.tileSequence.push({"tile_x": tileX, "tile_y": tileY});
    }

    getStartTile(){
        if (this.isEmpty()){ return null; }
        return this.tileSequence[0];
    }

    getDecisionAt(tileX, tileY){
        // Find the position of the entity sequence
        let position = this.getIndexOfTile(tileX, tileY);

        // If we can't find where the entity is in the sequence
        if (position == -1){
            return {};
        }

        // If at the end then no decision
        if (position == this.tileSequence.length - 1){
            return {};
        }

        let nextPosition = position+1;

        // Determine which way to move
        if (this.tileSequence[nextPosition]["tile_x"] > this.tileSequence[position]["tile_x"]){
            return {"right": true}
        }else if (this.tileSequence[nextPosition]["tile_x"] < this.tileSequence[position]["tile_x"]){
            return {"left": true}
        }else if (this.tileSequence[nextPosition]["tile_y"] > this.tileSequence[position]["tile_y"]){
            return {"up": true}
        }
        // Else go down
        return {"down": true}
    }

    printToConsole(){
        console.log("Start @", this.tileSequence[0]["tile_x"], this.tileSequence[0]["tile_y"]);
        for (let tile of this.tileSequence){
            let direction = this.getDecisionAt(tile["tile_x"], tile["tile_y"]);
            if (direction != null){
                let reachX = tile["tile_x"];
                let reachY = tile["tile_y"];
                let directionStr;
                if (objectHasKey(direction, "up")){
                    directionStr = "up";
                    reachY += 1;
                }else if (objectHasKey(direction, "left")){
                    directionStr = "left";
                    reachX -= 1;
                }else if (objectHasKey(direction, "right")){
                    directionStr = "right";
                    reachX += 1;
                }else{
                    directionStr = "down";
                    reachY -= 1;
                }
                console.log("Move " + directionStr + " to reach", reachX, reachY);
            }else{
                console.log("Arrive @", tile["tile_x"], tile["tile_y"]);
            }
        }
    }

    printToConsoleAsBoard(boardSize){
        let board = [];
        for (let i = 0; i < boardSize; i++){
            board.push([]);
            for (let j = 0; j < boardSize; j++){
                board[i].push(0);
            }
        }
        for (let tile of this.tileSequence){
            board[boardSize-1-tile["tile_y"]][tile["tile_x"]] = "i";
        }
        let boardStr = "";
        for (let i = 0; i < boardSize; i++){
            for (let j = 0; j < boardSize; j++){
                boardStr += board[i][j];
            }
            if (i < boardSize - 1){
                boardStr += '\n';
            }
        }
        console.log(boardStr);
    }

    static fromPath(path){
        let route = new Route();
        for (let tile of path){
            route.addTile(tile["tile_x"], tile["tile_y"]);
        }
        return route;
    }
}