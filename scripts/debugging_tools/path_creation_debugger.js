class PathCreationDebugger {
    constructor(startTileX, startTileY, endTileX, endTileY){
        this.data = {
            "startTileX": startTileX,
            "startTileY": startTileY,
            "endTileX": endTileX,
            "endTileY": endTileY,
            "while_loop_data": []
        }
    }

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

    addEndWhileLoopData(hasUncheckedTiles, notHasFoundTheBestPossiblePath, hasPathsInBothDirections){
        this.data["hasUncheckedTiles"] = hasUncheckedTiles;
        this.data["notHasFoundTheBestPossiblePath"] = notHasFoundTheBestPossiblePath;
        this.data["hasPathsInBothDirections"] = hasPathsInBothDirections;
    }

    print(){
        console.log(this.data);
    }

    openDebugger(){
        debugger;
    }
}