class Route {
    constructor(){
        this.tileSequence = [];
    }

    addTile(tileX, tileY){
        this.tileSequence.push({"tile_x": tileX, "tile_y": tileY});
    }

    getStartTile(){
        if (this.tileSequence.length == 0){ return null; }
        return this.tileSequence[0];
    }

    getDecisionAt(tileX, tileY){
        let position = -1;

        // Find the position of the entity sequence
        for (let i = 0; i < tileSequence.length; i++){
            if (this.tileSequence[i]["tile_x"] == tileX && this.tileSequence[i]["tile_y"] == tileY){
                position = i;
                break;
            }
        }

        // If we can't find where the entity is in the sequence
        if (position == -1){
            return null;
        }

        // If at the end then no decision
        if (position == this.tileSequence.length){
            return null;
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
}