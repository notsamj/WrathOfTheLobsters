class BloodPool {
    constructor(circles){
        this.circles = circles;
    }

    getYCategory(){
        return "ground";
    }

    display(scene, lX, rX, bY, tY){
        // If gore is disabled -> do not display
        if (!WTL_GAME_DATA["user_chosen_settings"]["gore"]){ return; }
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let currentTime = Date.now();
        for (let circleObject of this.circles){
            if (circleObject["expirey"] < currentTime){ continue; }
            let totalExistenceTime = circleObject["expirey"] - circleObject["spawn_time"];
            let currentExistenceTime = currentTime - circleObject["spawn_time"];
            let screenX = scene.getDisplayX(circleObject["x"], 0, lX, false);
            let screenY = scene.getDisplayY(circleObject["y"], 0, bY, false);
            let bloodColour = Colour.fromCode(WTL_GAME_DATA["visual_effects"]["blood_generation"]["blood_colour"]);
            bloodColour.setAlpha(WTL_GAME_DATA["visual_effects"]["blood_generation"]["blood_opacity"] * (1-currentExistenceTime/totalExistenceTime));
            noStrokeCircle(bloodColour, screenX, screenY, circleObject["radius"]*2*gameZoom);
        }
    }

    touchesRegion(lX, rX, bY, tY){
        let bottomY = Number.MAX_SAFE_INTEGER;
        let topY = Number.MIN_SAFE_INTEGER;
        let rightX = Number.MIN_SAFE_INTEGER;
        let leftX = Number.MAX_SAFE_INTEGER;
        for (let circle of this.circles){
            bottomY = Math.min(bottomY, circle["y"] + circle["radius"]);
            topY = Math.max(topY, circle["y"] - circle["radius"]);
            leftX = Math.min(leftX, circle["x"] + circle["radius"]);
            rightX = Math.max(rightX, circle["x"] - circle["radius"]);
        }

        if (leftX > rX){ return false; }
        if (rightX < lX){ return false; }
        if (bottomY > tY){ return false; }
        if (topY < bY){ return false; }
        return true;
    }

    isExpired(){
        let currentTime = Date.now();
        for (let circle of this.circles){
            if (circle["expirey"] > currentTime){
                return false;
            }
        }
        return true; 
    }

    /*
        Method Name: create
        Method Parameters:
            x: 
                Center x of the circle
            y:
                Center y of the circle
        Method Description: Creates a smoke cloud object given x, y
        Method Return: SmokeCloud
    */
    static create(x, y){
        let circles = [];
        let numCircles = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["blood_generation"]["min_circles_per_blood_spatter"], WTL_GAME_DATA["visual_effects"]["blood_generation"]["max_circles_per_blood_spatter"]);
        let mainRadius = WTL_GAME_DATA["visual_effects"]["blood_generation"]["center_radius"];
        let spawnTime = Date.now();
        for (let i = 0; i < numCircles; i++){
            let circleX = x + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let circleY = y + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let circleRadius = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["blood_generation"]["min_radius"], WTL_GAME_DATA["visual_effects"]["blood_generation"]["max_radius"]);
            let circleLifeLength = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["blood_generation"]["min_life_ms"], WTL_GAME_DATA["visual_effects"]["blood_generation"]["max_life_ms"]);
            circles.push({"x": circleX, "y": circleY, "radius": circleRadius, "spawn_time": spawnTime, "expirey": spawnTime + circleLifeLength});
        }
        return new BloodPool(circles);
    }
}