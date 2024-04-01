class CharacterAnimationManager extends AnimationManager {
    constructor(){
        super();
        this.direction = "front";
        this.walkingCountLR = 0;
        this.walkingCountUD = 0;
        this.walkingUDNext = 1;
        this.movingStepCD = new CooldownLock(RETRO_GAME_SETTINGS["general"]["animation_frame_time"]);
    }

    getDirection(){
        return this.direction;
    }

    setDirection(direction){
        this.direction = direction;
    }

    getAlternativeDirection(){
        if (this.direction == "front"){
            return "down";
        }else if (this.direction == "back"){
            return "up";
        }
        return this.direction;
    }

    setDirectionFromAlternate(alternateDirectionRep){
        if (alternateDirectionRep == "down"){
            alternateDirectionRep = "front";
        }else if(alternateDirectionRep == "up"){
            alternateDirectionRep = "back";
        }
        this.setDirection(alternateDirectionRep);
    }

    getCurrentImageSuffix(xVelocity, yVelocity){
        let suffixStart = "_64";
        if (xVelocity < 0){
            this.direction = "left";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += "_left" + (this.walkingCountLR > 0 ? "_step" + this.walkingCountLR.toString() : "");
            return suffixStart;
        }else if (xVelocity > 0){
            this.direction = "right";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += "_right" + (this.walkingCountLR > 0 ? "_step" + this.walkingCountLR.toString() : "");
            return suffixStart;
        }else if (yVelocity > 0){
            this.direction = "back";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += "_back" + (this.walkingCountUD > 0 ? "_step" + this.walkingCountUD.toString() : "");
            return suffixStart;
        }else if (yVelocity < 0){
            this.direction = "front";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += this.walkingCountUD > 0 ? "_step" + this.walkingCountUD.toString() : "";
            return suffixStart;
        }else{
            this.walkingCount = 0;
            // Not moving
            if (this.direction == "front"){
                return suffixStart;
            }
            return suffixStart + "_" + this.direction;
        }
    }

    updateWalkingCountIfMoving(xVelocity, yVelocity){
        let moving = xVelocity != 0 || yVelocity != 0;
        if (!moving || !this.movingStepCD.isReady()){
            return; 
        }
        this.movingStepCD.lock();
        if (this.direction == "front" || this.direction == "back"){
            if (this.walkingCountUD == 2){
                this.walkingCountUD = 0;
                this.walkingUDNext = 1;
            }else if (this.walkingCountUD == 1){
                this.walkingCountUD = 0;
                this.walkingUDNext = 2;
            }else{
                this.walkingCountUD = this.walkingUDNext;
            }
        }else{
            this.walkingCountLR = (this.walkingCountLR + 1) % 2;
        }
    }

    static async loadAllImages(model){
        // Do not load if already exists
        if (objectHasKey(IMAGES, model + "_64")){ return; }
        
        await loadToImages(model + "_64", model + "/");
        await loadToImages(model + "_64" + "_step1", model + "/");
        await loadToImages(model + "_64" + "_step2", model + "/");

        await loadToImages(model + "_64_back", model + "/");
        await loadToImages(model + "_64_back" + "_step1", model + "/");
        await loadToImages(model + "_64_back" + "_step2", model + "/");

        await loadToImages(model + "_64" + "_right", model + "/");
        await loadToImages(model + "_64" + "_right_step1", model + "/");

        await loadToImages(model + "_64" + "_left", model + "/");
        await loadToImages(model + "_64" + "_left_step1", model + "/");
    }
}