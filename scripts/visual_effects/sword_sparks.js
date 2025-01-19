class SwordSparks extends BasicFadingEffect {
    constructor(squares){
        super();
        this.squares = squares;
    }

    getYCategory(){
        return "air";
    }

    display(scene, lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let currentTime = Date.now();
        for (let squareObject of this.squares){
            if (squareObject["expirey"] < currentTime){ continue; }
            let totalExistenceTime = squareObject["expirey"] - squareObject["spawn_time"];
            let currentExistenceTime = currentTime - squareObject["spawn_time"];
            let screenX = scene.getDisplayX(squareObject["x"] + currentExistenceTime/1000 * squareObject["x_velocity"], 0, lX);
            let screenY = scene.getDisplayY(squareObject["y"] + currentExistenceTime/1000 * squareObject["y_velocity"], 0, bY);
            let colourCode = squareObject["colour_code"];
            noStrokeRectangle(Colour.fromCode(colourCode), screenX, screenY, squareObject["size"], squareObject["size"]);
        }
    }

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

    isExpired(){
        let currentTime = Date.now();
        for (let square of this.squares){
            if (square["expirey"] > currentTime){
                return false;
            }
        }
        return true; 
    }

    static create(sparkType, x, y){
        let squares = [];
        let numSquares = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["min_sparks_per_impact"], WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_sparks_per_impact"]);
        let mainRadius = WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["center_radius"];
        let spawnTime = Date.now();
        for (let i = 0; i < numSquares; i++){
            let squareX = x + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let squareY = y + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let squareSize = WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["size"];
            let squareLifeLength = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["sword_sparks"]["min_life_ms"], WTL_GAME_DATA["visual_effects"]["sword_sparks"]["max_life_ms"]);
            let xVelocity = randomFloatBetween(WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_speed"] * -1, WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_speed"]);
            let yVelocity = randomFloatBetween(WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_speed"] * -1, WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_speed"]);
            let red = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["min_red"], WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_red"]);
            let green = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["min_green"], WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_green"]);
            let blue = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["min_blue"], WTL_GAME_DATA["visual_effects"]["sword_sparks"]["type"][sparkType]["max_blue"]);
            let colourCode = Colour.generateCodeFromValues(red, green, blue);
            squares.push({"x": squareX, "y": squareY, "size": squareSize, "spawn_time": spawnTime, "expirey": spawnTime + squareLifeLength, "x_velocity": xVelocity, "y_velocity": yVelocity, "colour_code": colourCode});
        }
        return new SwordSparks(squares);
    }
}