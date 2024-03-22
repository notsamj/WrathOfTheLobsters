/*
    Class Name: SmokeCloud
    Description: A collection of circles.
*/
class SmokeCloud {
    /*
        Method Name: constructor
        Method Parameters:
            TODO
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(circles){
        this.circles = circles;
    }

    /*
        Method Name: display
        Method Parameters:
            TODO
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
        Method Description: Displays all the circles in the cloud.
        Method Return: void
    */
    display(lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let currentTime = Date.now();
        for (let circleObject of this.circles){
            if (circleObject["expirey"] < currentTime){ continue; }
            let totalExistenceTime = circleObject["expirey"] - circleObject["spawn_time"];
            let currentExistenceTime = currentTime - circleObject["spawn_time"];
            let screenX = SCENE.getDisplayX(circleObject["x"] + currentExistenceTime/1000 * circleObject["x_velocity"], 0, lX);
            let screenY = SCENE.getDisplayY(circleObject["y"] + currentExistenceTime/1000 * circleObject["y_velocity"], 0, bY);
            strokeWeight(0);
            let smokeColour = color(PROGRAM_SETTINGS["smoke_generation"]["smoke_colour"]);
            smokeColour.setAlpha(Math.floor(PROGRAM_SETTINGS["smoke_generation"]["smoke_opacity"]*255 * (1-currentExistenceTime/totalExistenceTime)));
            fill(smokeColour);
            circle(screenX, screenY, circleObject["radius"]*2);
            strokeWeight(1);
        }
    }

    touchesRegion(lX, rX, bY, tY){
        let bottomY = Number.MAX_SAFE_INTEGER;
        let topY = Number.MIN_SAFE_INTEGER;
        let rightX = Number.MIN_SAFE_INTEGER;
        let leftX = Number.MAX_SAFE_INTEGER;
        for (let circle of this.circles){
            if (circle["x"] - circle["radius"] > rX){ return false; }
            if (circle["x"] + circle["radius"] < lX){ return false; }
            if (circle["y"] - circle["radius"] > tY){ return false; }
            if (circle["y"] + circle["radius"] < bY){ return false; }
        }
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
        let numCircles = randomNumberInclusive(PROGRAM_SETTINGS["smoke_generation"]["min_circles_per_smoke_cloud"], PROGRAM_SETTINGS["smoke_generation"]["max_circles_per_smoke_cloud"]);
        let mainRadius = randomNumberInclusive(PROGRAM_SETTINGS["smoke_generation"]["min_radius"], PROGRAM_SETTINGS["smoke_generation"]["max_radius"]);
        let spawnTime = Date.now();
        for (let i = 0; i < numCircles; i++){
            let circleX = x + randomNumberInclusive(-1 * PROGRAM_SETTINGS["smoke_generation"]["center_radius"], PROGRAM_SETTINGS["smoke_generation"]["center_radius"]);
            let circleY = y + randomNumberInclusive(-1 * mainRadius, mainRadius);
            let circleRadius = randomNumberInclusive(PROGRAM_SETTINGS["smoke_generation"]["min_radius"], PROGRAM_SETTINGS["smoke_generation"]["max_radius"]);
            let circleLifeLength = randomNumberInclusive(PROGRAM_SETTINGS["smoke_generation"]["min_life_ms"], PROGRAM_SETTINGS["smoke_generation"]["max_life_ms"]);
            let xVelocity = randomFloatBetween(PROGRAM_SETTINGS["smoke_generation"]["max_speed"] * -1, PROGRAM_SETTINGS["smoke_generation"]["max_speed"]);
            let yVelocity = randomFloatBetween(PROGRAM_SETTINGS["smoke_generation"]["max_speed"] * -1, PROGRAM_SETTINGS["smoke_generation"]["max_speed"]);
            circles.push({"x": circleX, "y": circleY, "radius": circleRadius, "spawn_time": spawnTime, "expirey": spawnTime + circleLifeLength, "x_velocity": xVelocity, "y_velocity": yVelocity});
        }
        return new SmokeCloud(circles);
    }

    /*static create(x, y){
        let circles = [];
        let spawnTime = Date.now();
        circles.push({"x": x, "y": y, "radius": 3, "spawn_time": spawnTime, "expirey": spawnTime + 1000, "x_velocity": 0, "y_velocity": 0});
        return new SmokeCloud(circles);
    }*/
}