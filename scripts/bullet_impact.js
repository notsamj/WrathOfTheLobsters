/*
    Class Name: BulletImpact
    Description: A collection of squares.
*/
class BulletImpact {
    /*
        Method Name: constructor
        Method Parameters:
            TODO
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(squares){
        this.squares = squares;
    }

    /*
        Method Name: display
        Method Parameters:
            TODO
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
        Method Description: Displays all the squares in the cloud.
        Method Return: void
    */
    display(lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let currentTime = Date.now();
        for (let squareObject of this.squares){
            if (squareObject["expirey"] < currentTime){ continue; }
            let totalExistenceTime = squareObject["expirey"] - squareObject["spawn_time"];
            let currentExistenceTime = currentTime - squareObject["spawn_time"];
            let screenX = this.getScene().getDisplayX(squareObject["x"] + currentExistenceTime/1000 * squareObject["x_velocity"], 0, lX);
            let screenY = this.getScene().getDisplayY(squareObject["y"] + currentExistenceTime/1000 * squareObject["y_velocity"], 0, bY);
            noStrokeRectangle(Colour.fromCode(RETRO_GAME_DATA["bullet_impact_generation"]["dirt_colour"]), screenX, screenY, squareObject["size"]);
        }
    }

    touchesRegion(lX, rX, bY, tY){
        let bottomY = Number.MAX_SAFE_INTEGER;
        let topY = Number.MIN_SAFE_INTEGER;
        let rightX = Number.MIN_SAFE_INTEGER;
        let leftX = Number.MAX_SAFE_INTEGER;
        for (let square of this.squares){
            if (square["x"] - square["size"] > rX){ return false; }
            if (square["x"] + square["size"] < lX){ return false; }
            if (square["y"] - square["size"] > tY){ return false; }
            if (square["y"] + square["size"] < bY){ return false; }
        }
        return true;
    }

    isExpired(){
        let currentTime = Date.now();
        for (let square of this.squares){
            if (square["expirey"] > currentTime){
                return false;
            }
        }
        return true; 
    }

    /*
        Method Name: create
        Method Parameters:
            x: 
                Center x of the square
            y:
                Center y of the square
        Method Description: Creates a bullet impact object given x, y
        Method Return: BulletImpact
    */
    static create(x, y){
        let squares = [];
        let numSquares = randomNumberInclusive(RETRO_GAME_DATA["bullet_impact_generation"]["min_dirt_per_impact"], RETRO_GAME_DATA["bullet_impact_generation"]["max_dirt_per_impact"]);
        let mainRadius = randomNumberInclusive(RETRO_GAME_DATA["bullet_impact_generation"]["center_radius"], RETRO_GAME_DATA["bullet_impact_generation"]["center_radius"]);
        let spawnTime = Date.now();
        for (let i = 0; i < numSquares; i++){
            let squareX = x + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let squareY = y + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let squareSize = RETRO_GAME_DATA["bullet_impact_generation"]["size"];
            let squareLifeLength = randomNumberInclusive(RETRO_GAME_DATA["bullet_impact_generation"]["min_life_ms"], RETRO_GAME_DATA["bullet_impact_generation"]["max_life_ms"]);
            let xVelocity = randomFloatBetween(RETRO_GAME_DATA["bullet_impact_generation"]["max_speed"] * -1, RETRO_GAME_DATA["bullet_impact_generation"]["max_speed"]);
            let yVelocity = randomFloatBetween(RETRO_GAME_DATA["bullet_impact_generation"]["max_speed"] * -1, RETRO_GAME_DATA["bullet_impact_generation"]["max_speed"]);
            squares.push({"x": squareX, "y": squareY, "size": squareSize, "spawn_time": spawnTime, "expirey": spawnTime + squareLifeLength, "x_velocity": xVelocity, "y_velocity": yVelocity});
        }
        return new BulletImpact(squares);
    }
}