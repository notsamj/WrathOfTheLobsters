class Gun extends RangedWeapon {
    constructor(model, details){
        super();
        this.model = model;
        this.player = objectHasKey(details, "player") ? details["player"] : null;
        this.loaded = true;

        this.reloading = false;
        this.reloadLock = new TickLock(RETRO_GAME_DATA["gun_data"][this.model]["reload_time_ms"] / RETRO_GAME_DATA["general"]["ms_between_ticks"]);
    }

    makeDecisions(){
        this.player.makeGunDecisions();
    }

    forceReload(){
        this.reloading = false;
        this.reloadLock.reset();
        this.loaded = true;
    }

    getDecidedAngleRAD(){
        return this.getDecision("aiming_angle_rad");
    }

    // Abstract
    makeDecisions(){}

    // Abstract
    getSimulatedGunEndPosition(){}

    // Note: Assumes this instance of Gun has decisions
    getDecisions(){
        return this.decisions;
    }

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
        this.getGamemode().getEventHandler().emit({
            "name": "gun_shot",
            "x": this.getEndOfGunX(),
            "y": this.getEndOfGunY(),
            // tbf lets just say you can sort of extrapolate the shooters location its adjacent at worse anyway
            "shooter_tile_x": this.player.getTileX(),
            "shooter_tile_y": this.player.getTileY(),
            "shooter_id": this.player.getID()
        });
        // Try to kill whenever is there
        let angleRAD = this.getDecidedAngleRAD();
        let range = this.getBulletRange();
        let myID = this.player.getID();
        let collision = this.getScene().findInstantCollisionForProjectile(this.getEndOfGunX(), this.getEndOfGunY(), angleRAD, range, (enemy) => { return enemy.getID() == myID; });
        // If it hits an entity
        if (collision["collision_type"] === "entity"){
            collision["entity"].getShot(this.player.getModel(), this.getID());
        }
        // If it hits a physical tile or nothing then create bullet collision particle
        else if (collision["collision_type"] === null || collision["collision_type"] === "physical_tile"){
            // If the shot didn't hit anything alive then show particles when it hit
            // TODO: Add an event for this
            this.getScene().addExpiringVisual(BulletImpact.create(collision["x"], collision["y"]));
        }
        this.loaded = false;
    }

    isLoaded(){
        return this.loaded;
    }

    isAiming(){
        return this.getDecision("trying_to_aim") && this.directionToAimIsOk() && !this.player.isMoving() && !this.isReloading();
    }

    directionToAimIsOk(){
        let angleTryingToAimAtDEG = toFixedDegrees(this.getDecidedAngleRAD());
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