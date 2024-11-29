class CharacterAnimationManager extends AnimationManager {
    constructor(){
        super();
        this.visualDirection = "front";
        this.walkingCountLR = 0;
        this.walkingCountUD = 0;
        this.walkingUDNext = 1;
        this.movingStepCD = new CooldownLock(RETRO_GAME_DATA["general"]["animation_frame_time"]);
    }

    getVisualDirection(){
        return this.visualDirection;
    }

    setVisualDirection(visualDirection){
        this.visualDirection = visualDirection;
    }

    setVisualDirectionFromMovementDirection(movementDirection){
        let visualDirection = getVisualDirectionOf(movementDirection);
        this.setVisualDirection(visualDirection);
    }

    getCurrentImageSuffix(xVelocity, yVelocity){
        let suffixStart = "_64";
        if (xVelocity < 0){
            this.visualDirection = "left";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += "_left" + (this.walkingCountLR > 0 ? "_step" + this.walkingCountLR.toString() : "");
            return suffixStart;
        }else if (xVelocity > 0){
            this.visualDirection = "right";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += "_right" + (this.walkingCountLR > 0 ? "_step" + this.walkingCountLR.toString() : "");
            return suffixStart;
        }else if (yVelocity > 0){
            this.visualDirection = "back";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += "_back" + (this.walkingCountUD > 0 ? "_step" + this.walkingCountUD.toString() : "");
            return suffixStart;
        }else if (yVelocity < 0){
            this.visualDirection = "front";
            this.updateWalkingCountIfMoving(xVelocity, yVelocity);
            suffixStart += this.walkingCountUD > 0 ? "_step" + this.walkingCountUD.toString() : "";
            return suffixStart;
        }else{
            this.walkingCount = 0;
            // Not moving
            if (this.visualDirection == "front"){
                return suffixStart;
            }
            return suffixStart + "_" + this.visualDirection;
        }
    }

    updateWalkingCountIfMoving(xVelocity, yVelocity){
        let moving = xVelocity != 0 || yVelocity != 0;
        if (!moving || !this.movingStepCD.isReady()){
            return; 
        }
        this.movingStepCD.lock();
        if (this.visualDirection == "front" || this.visualDirection == "back"){
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

    static async loadAllImagesOfModel(model){
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

    static async loadAllImages(){
        for (let characterModel of Object.keys(RETRO_GAME_DATA["model_to_model_category"])){
            await CharacterAnimationManager.loadAllImagesOfModel(characterModel);
        }
    }
}