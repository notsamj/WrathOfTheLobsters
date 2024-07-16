class Gun extends Item {
    constructor(model, details){
        super();
        this.model = model;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.loaded = true;

        this.reloading = false;
        this.reloadLock = new TickLock(RETRO_GAME_DATA["gun_data"][this.model]["reload_time_ms"] / RETRO_GAME_DATA["general"]["ms_between_ticks"]);

        this.resetDecisions();
    }

    forceReload(){
        this.reloading = false;
        this.reloadLock.reset();
        this.loaded = true;
    }

    // Abstract
    resetDecisions(){}

    // Abstract
    makeDecisions(){}

    getScene(){
        return this.player.getScene();
    }

    reload(){
        this.reloading = true;
        this.reloadLock.resetAndLock();
    }

    isReloading(){
        return this.reloading;
    }

    cancelReload(){
        this.reloading = false;
    }

    select(){}
    // Abstract
    deselect(){}

    getModel(){
        return this.model;
    }

    getBulletRange(){
        return RETRO_GAME_DATA["gun_data"][this.getModel()]["range"];
    }

    shoot(){
        // Add smoke where gun is shot
        this.getScene().addExpiringVisual(SmokeCloud.create(this.getEndOfGunX(), this.getEndOfGunY()));
        // Try to kill whenever is there
        let angleRAD = this.getAngleRAD();
        let range = this.getBulletRange();
        let myID = this.player.getID();
        let collision = this.getScene().findInstantCollisionForProjectile(this.getEndOfGunX(), this.getEndOfGunY(), angleRAD, range, (enemy) => { return enemy.getID() == myID; });
        // If it hits an entity
        if (collision["collision_type"] == "entity"){
            collision["entity"].getShot(this.player.getModel());
        }
        // If it hits a physical tile or nothing then create bullet collision particle
        else if (collision["collision_type"] == null || collision["collision_type"] == "physical_tile"){
            // If the shot didn't hit anything alive then show particles when it hit
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }
        this.loaded = false;
    }

    isLoaded(){
        return this.loaded;
    }

    isAiming(){
        return this.decisions["trying_to_aim"] && this.directionToAimIsOk() && !this.player.isMoving() && !this.isReloading();
    }

    directionToAimIsOk(){
        let angleTryingToAimAtDEG = toFixedDegrees(this.getAngleRAD());
        let playerDirection = this.player.getFacingDirection();
        if (playerDirection == "front"){
            return angleTryingToAimAtDEG > 180 && angleTryingToAimAtDEG <= 359;
        }else if (playerDirection == "left"){
            return angleTryingToAimAtDEG > 90 && angleTryingToAimAtDEG < 270;
        }else if (playerDirection == "right"){
            return (angleTryingToAimAtDEG > 270 && angleTryingToAimAtDEG < 360) || (angleTryingToAimAtDEG >= 0 && angleTryingToAimAtDEG < 90);
        }else if (playerDirection == "back"){
            return angleTryingToAimAtDEG > 0 && angleTryingToAimAtDEG < 180;
        }
        throw new Error(`Invalid player direction: ${playerDirection}`);
    }
}