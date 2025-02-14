/*
    Class Name: CharacterAnimationManager
    Class Description: Manages animations for a character.
*/
class CharacterAnimationManager extends AnimationManager {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super();
        this.visualDirection = "front";
        this.walkingCountLR = 0;
        this.walkingCountUD = 0;
        this.walkingUDNext = 1;
        this.movingStepCD = new CooldownLock(WTL_GAME_DATA["general"]["animation_frame_time"]);
    }

    /*
        Method Name: getVisualDirection
        Method Parameters: None
        Method Description: Getter
        Method Return: string
    */
    getVisualDirection(){
        return this.visualDirection;
    }

    /*
        Method Name: setVisualDirection
        Method Parameters: 
            visualDirection:
                A visual direction (string)
        Method Description: Setter
        Method Return: void
    */
    setVisualDirection(visualDirection){
        this.visualDirection = visualDirection;
    }

    /*
        Method Name: setVisualDirectionFromMovementDirection
        Method Parameters: 
            movementDirection:
                A movement direction (string)
        Method Description: Sets the visual direction given a movement direction
        Method Return: void
    */
    setVisualDirectionFromMovementDirection(movementDirection){
        let visualDirection = getVisualDirectionOf(movementDirection);
        this.setVisualDirection(visualDirection);
    }

    /*
        Method Name: getCurrentImageSuffix
        Method Parameters: 
            xVelocity:
                The current x velocity
            yVelocity:
                The current y velcoity
        Method Description: Determines the current image suffix of the character
        Method Return: string
    */
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

    /*
        Method Name: updateWalkingCountIfMoving
        Method Parameters: 
            xVelocity:
                The current x velocity
            yVelocity:
                The current y velcoity
        Method Description: Updates the walking animation count
        Method Return: void
    */
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

    /*
        Method Name: loadAllImagesOfModel
        Method Parameters: 
            model:
                The character model
        Method Description: Loads all the images of the character to storage
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: loadAllImages
        Method Parameters: 
            model:
                The character model
        Method Description: Loads all the images of all the characters to storage
        Method Return: Promise (implicit)
    */
    static async loadAllImages(){
        for (let characterModel of Object.keys(WTL_GAME_DATA["model_to_model_category"])){
            await CharacterAnimationManager.loadAllImagesOfModel(characterModel);
        }
    }
}