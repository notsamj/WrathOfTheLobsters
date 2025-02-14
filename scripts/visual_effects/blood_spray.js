/*
    Class Name: BloodSpray
    Class Description: TODO
*/
class BloodSpray {
    /*
        Method Name: constructor
        Method Parameters: 
            circles:
                List of JSON object "circles"
        Method Description: constructor
        Method Return: constructor
    */
    constructor(circles){
        this.circles = circles;
    }

    /*
        Method Name: getYCategory
        Method Parameters: None
        Method Description: Gets the y category
        Method Return: string
    */
    getYCategory(){
        return "air"; // "air" || "ground"
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
        // If gore is disabled -> do not display
        if (!WTL_GAME_DATA["user_chosen_settings"]["gore"]){ return; }
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let currentTime = Date.now();
        for (let circleObject of this.circles){
            if (circleObject["expirey"] < currentTime){ continue; }
            let totalExistenceTime = circleObject["expirey"] - circleObject["spawn_time"];
            let currentExistenceTime = currentTime - circleObject["spawn_time"];
            let screenX = scene.getDisplayX(circleObject["x"] + currentExistenceTime/1000 * circleObject["x_velocity"], 0, lX, false);
            let screenY = scene.getDisplayY(circleObject["y"] + currentExistenceTime/1000 * circleObject["y_velocity"], 0, bY, false);
            let smokeColour = Colour.fromCode(WTL_GAME_DATA["visual_effects"]["blood_spray"]["colour"]);
            smokeColour.setAlpha(WTL_GAME_DATA["visual_effects"]["blood_spray"]["opacity"] * (1-currentExistenceTime/totalExistenceTime));
            noStrokeCircle(smokeColour, screenX, screenY, circleObject["radius"]*2*gameZoom);
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

    /*
        Method Name: isExpired
        Method Parameters: None
        Method Description: Checks if the effect is expired
        Method Return: boolean
    */
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
                Center x of the effect
            y:
                Center y of the effect
        Method Description: Creates a blood spray object given x, y
        Method Return: BloodSpray
    */
    static create(x, y){
        let circles = [];
        let numCircles = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["blood_spray"]["min_circles"], WTL_GAME_DATA["visual_effects"]["blood_spray"]["max_circles"]);
        let mainRadius = WTL_GAME_DATA["visual_effects"]["blood_spray"]["center_radius"];
        let spawnTime = Date.now();
        for (let i = 0; i < numCircles; i++){
            let circleX = x + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let circleY = y + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let circleRadius = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["blood_spray"]["min_radius"], WTL_GAME_DATA["visual_effects"]["blood_spray"]["max_radius"]);
            let circleLifeLength = randomNumberInclusive(WTL_GAME_DATA["visual_effects"]["blood_spray"]["min_life_ms"], WTL_GAME_DATA["visual_effects"]["blood_spray"]["max_life_ms"]);
            let xVelocity = randomFloatBetween(WTL_GAME_DATA["visual_effects"]["blood_spray"]["max_speed"] * -1, WTL_GAME_DATA["visual_effects"]["blood_spray"]["max_speed"]);
            let yVelocity = randomFloatBetween(WTL_GAME_DATA["visual_effects"]["blood_spray"]["max_speed"] * -1, WTL_GAME_DATA["visual_effects"]["blood_spray"]["max_speed"]);
            circles.push({"x": circleX, "y": circleY, "radius": circleRadius, "spawn_time": spawnTime, "expirey": spawnTime + circleLifeLength, "x_velocity": xVelocity, "y_velocity": yVelocity});
        }
        return new BloodSpray(circles);
    }
}