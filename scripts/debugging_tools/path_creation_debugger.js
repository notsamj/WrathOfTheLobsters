/*
    Class Name: PathCreationDebugger
    Class Description: A class used to help debug path creation
*/
class PathCreationDebugger {
    /*
        Method Name: constructor
        Method Parameters: 
            startTileX:
                An integer representing the x coordinate of a tile at the start of a path
            startTileY:
                An integer representing the y coordinate of a tile at the start of a path
            endTileX:
                An integer representing the x coordinate of a tile at the end of a path
            endTileY:
                An integer representing the y coordinate of a tile at the end of a path
        Method Description: TODO
        Method Return: TODO
    */
    constructor(startTileX, startTileY, endTileX, endTileY){
        this.data = {
            "startTileX": startTileX,
            "startTileY": startTileY,
            "endTileX": endTileX,
            "endTileY": endTileY,
            "while_loop_data": []
        }
    }

    /*
        Method Name: addWhileLoopIteration
        Method Parameters: 
            currentTile:
                A json object representing a tile
            tiles:
                A list of tile objects
        Method Description: Adds information about the tiles at a given point in the computation to review later
        Method Return: void
    */
    addWhileLoopIteration(currentTile, tiles){
        let stringTiles = [];
        for (let tile of stringTiles){
            stringTiles.push(JSON.stringify(tile));
        }
        this.data["while_loop_data"].push({
            "currentTile": JSON.stringify(currentTile),
            "tiles": stringTiles
        });
    }

    /*
        Method Name: addEndWhileLoopData
        Method Parameters: 
            hasUncheckedTiles:
                A boolean value
            notHasFoundTheBestPossiblePath:
                A boolean value
            hasPathsInBothDirections:
                A voolean value
        Method Description: Records information about the state after ending a while loop
        Method Return: void
    */
    addEndWhileLoopData(hasUncheckedTiles, notHasFoundTheBestPossiblePath, hasPathsInBothDirections){
        this.data["hasUncheckedTiles"] = hasUncheckedTiles;
        this.data["notHasFoundTheBestPossiblePath"] = notHasFoundTheBestPossiblePath;
        this.data["hasPathsInBothDirections"] = hasPathsInBothDirections;
    }

    /*
        Method Name: print
        Method Parameters: None
        Method Description: Logs stored data to console
        Method Return: void
    */
    print(){
        console.log(this.data);
    }

    /*
        Method Name: openDebugger
        Method Parameters: None
        Method Description: Calls the debuger in a browser
        Method Return: void
    */
    openDebugger(){
        debugger;
    }
}