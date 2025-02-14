/*
    Class Name: Route
    Class Description: A route from tile to tile
*/
class Route {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        this.tileSequence = [];
    }

    /*
        Method Name: setTileSequence
        Method Parameters: 
            tileSequence:
                A list of JSON
        Method Description: Setter
        Method Return: void
    */
    setTileSequence(tileSequence){
        this.tileSequence = tileSequence;   
    }

    /*
        Method Name: copy
        Method Parameters: None
        Method Description: Makes a copy of this route
        Method Return: Route
    */
    copy(){
        let routeCopy = new Route();
        routeCopy.setTileSequence(copyArray(this.tileSequence));
        return routeCopy;
    }

    /*
        Method Name: containsTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Checks if the tile sequence contains a tile
        Method Return: boolean
    */
    containsTile(tileX, tileY){
        return this.getIndexOfTile(tileX, tileY) != -1;
    }

    /*
        Method Name: getIndexOfTile
        Method Parameters: 
            tileX:
                A tile x coordinate
            tileY:
                A tile y coordinate
        Method Description: Gets the index of a tile
        Method Return: int
    */
    getIndexOfTile(tileX, tileY){
        for (let i = 0; i < this.getLength(); i++){
            let tile = this.tileSequence[i];
            if (tile["tile_x"] === tileX && tile["tile_y"] === tileY){
                return i;
            }
        }
        return -1;
    }

    /*
        Method Name: includesTile
        Method Parameters: 
            tileX:
                A tile x coordinate (int)
            tileY:
                A tile y coordinate (int)
        Method Description: Checks if the tile sequence contains a tile
        Method Return: boolean
    */
    includesTile(tileX, tileY){
        return this.getIndexOfTile(tileX, tileY) != -1;
    }

    /*
        Method Name: getTile
        Method Parameters: 
            tileIndex:
                An index in the tile sequence. int
        Method Description: Get a tile from the tile sequence
        Method Return: JSON Object
    */
    getTile(tileIndex){
        return this.tileSequence[tileIndex];
    }

    /*
        Method Name: getLastTile
        Method Parameters: None
        Method Description: Gets the last tile in the sequence
        Method Return: JSON
    */
    getLastTile(){
        return this.tileSequence[this.getLength() - 1];
    }

    /*
        Method Name: shortenToLength
        Method Parameters: 
            maxLength:
                The maximum length of the path
        Method Description: Shortens the path to a given length
        Method Return: void
    */
    shortenToLength(maxLength){
        // Shorten the route by repeatedly removing the last element
        while (this.getLength() > maxLength){
            this.tileSequence.pop();
        }
    }

    /*
        Method Name: getTileInRouteAtIndex
        Method Parameters: 
            index:
                An index in the tile sequence. int
        Method Description: Get a tile from the tile sequence
        Method Return: JSON Object
    */
    getTileInRouteAtIndex(index){
        return this.tileSequence[index];
    }

    /*
        Method Name: getLength
        Method Parameters: None
        Method Description: Gets the tile sequence length
        Method Return: int
    */
    getLength(){
        return this.tileSequence.length;
    }

    /*
        Method Name: getMovementDistance
        Method Parameters: None
        Method Description: Gets the number of tile changes in the route
        Method Return: int
    */
    getMovementDistance(){
        return this.getLength() - 1;
    }

    /*
        Method Name: isEmpty
        Method Parameters: None
        Method Description: Checks if the route is empty
        Method Return: boolean
    */
    isEmpty(){
        return this.getLength() === 0;
    }

    /*
        Method Name: addTile
        Method Parameters: 
            tileX:
                A tile x coordinate (int)
            tileY:
                A tile y coordinate (int)
        Method Description: Adds a tile to the route
        Method Return: void
    */
    addTile(tileX, tileY){
        this.tileSequence.push({"tile_x": tileX, "tile_y": tileY});
    }

    /*
        Method Name: getStartTile
        Method Parameters: None
        Method Description: Gets the starting tile in the route
        Method Return: JSON Object
    */
    getStartTile(){
        if (this.isEmpty()){ return null; }
        return this.tileSequence[0];
    }

    /*
        Method Name: getDecisionAt
        Method Parameters: 
            tileX:
                A tile x coordinate (int)
            tileY:
                A tile y coordinate (int)
        Method Description: Gets the movement decision at a tile
        Method Return: JSON Object
    */
    getDecisionAt(tileX, tileY){
        // Find the position of the entity sequence
        let position = this.getIndexOfTile(tileX, tileY);

        // If we can't find where the entity is in the sequence
        if (position === -1){
            throw new Error("Tile not in route");
        }

        // If at the end then no decision
        if (position === this.tileSequence.length - 1){
            return {};
        }

        let nextPosition = position + 1;

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

    /*
        Method Name: printToConsole
        Method Parameters: None
        Method Description: Prints the route to console
        Method Return: void
    */
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

    /*
        Method Name: printToConsoleAsBoard
        Method Parameters: 
            boardSize:
                The board size (int)
        Method Description: Prints the route out as if it is a board
        Method Return: void
    */
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

    /*
        Method Name: fromPath
        Method Parameters: 
            path:
                A tile sequence
        Method Description: Creates a route from a tile path
        Method Return: Route
    */
    static fromPath(path){
        let route = new Route();
        for (let tile of path){
            route.addTile(tile["tile_x"], tile["tile_y"]);
        }
        return route;
    }
}