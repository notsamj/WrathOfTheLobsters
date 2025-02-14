/*
    Class Name: BulletImpact
    Description: A collection of squares.
*/
class BulletImpact {
    /*
        Method Name: constructor
        Method Parameters: 
            circles:
                List of JSON object "squares"
        Method Description: constructor
        Method Return: constructor
    */
    constructor(squares){
        this.squares = squares;
    }

    /*
        Method Name: getYCategory
        Method Parameters: None
        Method Description: Gets the y category
        Method Return: string
    */
    getYCategory(){
        return "ground";
    }

    /*
        Method Name: display
        Method Parameters: 
            scene:
                The relevant scene
            lX:
                The x coordinate on the left of the screen
            rX:
                The x coordinate on the right of the screen
            bY:
                The y coordinate at the bottom of the screen
            tY:
                The y coordinate at the top of the screen
        Method Description: Displays the effect
        Method Return: void
    */
    display(scene, lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let currentTime = Date.now();
        for (let squareObject of this.squares){
            if (squareObject["expirey"] < currentTime){ continue; }
            let totalExistenceTime = squareObject["expirey"] - squareObject["spawn_time"];
            let currentExistenceTime = currentTime - squareObject["spawn_time"];
            let screenX = scene.getDisplayX(squareObject["x"] + currentExistenceTime/1000 * squareObject["x_velocity"], 0, lX);
            let screenY = scene.getDisplayY(squareObject["y"] + currentExistenceTime/1000 * squareObject["y_velocity"], 0, bY);
            noStrokeRectangle(Colour.fromCode(WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["dirt_colour"]), screenX, screenY, squareObject["size"], squareObject["size"]);
        }
    }

    /*
        Method Name: touchesRegion
        Method Parameters: 
            lX:
                The x coordinate on the left of the region
            rX:
                The x coordinate on the right of the region
            bY:
                The y coordinate at the bottom of the region
            tY:
                The y coordinate at the top of the region
        Method Description: Checks if the effect touches the region
        Method Return: boolean
    */
    touchesRegion(lX, rX, bY, tY){
        let bottomY = Number.MAX_SAFE_INTEGER;
        let topY = Number.MIN_SAFE_INTEGER;
        let rightX = Number.MIN_SAFE_INTEGER;
        let leftX = Number.MAX_SAFE_INTEGER;
        for (let square of this.squares){
            bottomY = Math.min(bottomY, square["y"] + square["size"]);
            topY = Math.max(topY, square["y"] - square["size"]);
            leftX = Math.min(leftX, square["x"] + square["size"]);
            rightX = Math.max(rightX, square["x"] - square["size"]);
        }

        if (leftX > rX){ return false; }
        if (rightX < lX){ return false; }
        if (bottomY > tY){ return false; }
        if (topY < bY){ return false; }
        return true;
    }

    /*
        Method Name: isExpired
        Method Parameters: None
        Method Description: Checks if the effect is expired
        Method Return: boolean
    */
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
        let numSquares = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["min_dirt_per_impact"], WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["max_dirt_per_impact"]);
        let mainRadius = WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["center_radius"];
        let spawnTime = Date.now();
        for (let i = 0; i < numSquares; i++){
            let squareX = x + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let squareY = y + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let squareSize = WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["size"];
            let squareLifeLength = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["min_life_ms"], WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["max_life_ms"]);
            let xVelocity = randomFloatBetween(WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["max_speed"] * -1, WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["max_speed"]);
            let yVelocity = randomFloatBetween(WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["max_speed"] * -1, WTL_GAME_DATA["visual_effects"]["bullet_impact_generation"]["max_speed"]);
            squares.push({"x": squareX, "y": squareY, "size": squareSize, "spawn_time": spawnTime, "expirey": spawnTime + squareLifeLength, "x_velocity": xVelocity, "y_velocity": yVelocity});
        }
        return new BulletImpact(squares);
    }
}