class Duel extends Gamemode {
    constructor(gameSetupDetails){
        super();

        /*
            gameSetupDetails = {
                "participants": [
                    {
                        "human": true/false,
                        "model": "model_name",
                        "melee_weapons": ["sword_model_name"],
                        "pistols": ["pistol_model_name"],
                        "muskets": ["musket_model_name"]
                    }
                    ...
                ]
        */

        this.gameSetupDetails = gameSetupDetails;
        this.seed = gameSetupDetails["seed"];
        // Only using when testing
        if (this.seed === null){
            this.seed = randomNumberInclusive(0, Math.floor(Math.pow(10, 3))-1);
            gameSetupDetails["seed"] = this.seed;
        }
        this.aiRandom = new SeededRandomizer(this.seed);

        this.participants = [];

        this.stats = new DuelMatchStats();
        this.random = null; // Declare
        this.spawns = []; // Declare

        let scene = this.getScene();
        this.eventHandler.addHandler("kill", (killObject) => {
            scene.addExpiringVisual(BloodPool.create(killObject["center_x"], killObject["center_y"]));
            // Any time somebody dies the killer wins in duel
            this.endGame(killObject["killer_id"]);
        });

        this.eventHandler.addHandler("injury", (injuryObject) => {
            scene.addExpiringVisual(BloodSpray.create(injuryObject["center_x"], injuryObject["center_y"]));
        });

        this.eventHandler.addHandler("gun_shot", (eventObj) => {
            scene.addExpiringVisual(SmokeCloud.create(eventObj["x"], eventObj["y"]));
            SOUND_MANAGER.play("gunshot", eventObj["x"], eventObj["y"]);
            this.alertBotsOfGunshot(eventObj["shooter_id"], eventObj["shooter_tile_x"], eventObj["shooter_tile_y"], eventObj["shooter_facing_movement_direction"]);
        });

        this.eventHandler.addHandler("sword_swing", (eventObj) => {
            SOUND_MANAGER.play(eventObj["associated_sound_name"], eventObj["x"], eventObj["y"]);
        });

        this.eventHandler.addHandler("sword_sparks", (eventObj) => {
            scene.addExpiringVisual(SwordSparks.create(eventObj["spark_type"], eventObj["x"], eventObj["y"]));
        });

        this.camera = this.isABotGame() ? new DuelCamera(this) : null;

        this.gameOver = false;

        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    getName(){ return "duel"; }

    handleUnpause(){
        for (let participant of this.participants){
            participant.handleUnpause();
        }
    }

    randomReset(){
        this.gameOver = false;
        this.stats.reset();
        if (this.isABotGame()){
            this.setCameraPosition();
        }

        this.prepareTroops();
    }

    setCameraPosition(){
        let cameraSpawnX = Math.floor((this.spawns[0][0] + this.spawns[3][0])/2);
        let cameraSpawnY = Math.floor((this.spawns[0][1] + this.spawns[3][1])/2);
        this.camera.setTilePosition(cameraSpawnX, cameraSpawnY);
    }

    end(){
        MY_HUD.clearElement("seed");
        MY_HUD.clearElement("tile_x");
        MY_HUD.clearElement("tile_y");
        MY_HUD.clearElement("Cursor Tile X");
        MY_HUD.clearElement("Cursor Tile Y");
    }

    alertBotsOfGunshot(shooterID, gunshotShooterTileX, gunshotShooterTileY, gunshotShooterFacingDirection){
        for (let participant of this.participants){
            if (participant instanceof DuelBot){
                if (participant.getID() === shooterID){ continue; }
                participant.notifyOfGunshot(gunshotShooterTileX, gunshotShooterTileY, gunshotShooterFacingDirection);
            }
        }
    }

    getParticipants(){
        return this.participants;
    }

    findParticipantFromID(participantID){
        for (let participant of this.participants){
            if (participant.getID() === participantID){
                return participant;
            }
        }
        throw new Error("Failed to find participant with ID: " + participantID);
    }

    endGame(winnerID){
        this.gameOver = true;
        let winner = this.findParticipantFromID(winnerID);
        if (winner.isHuman()){
            this.stats.setWinner("Human Player");
        }else{
            this.stats.setWinner("Bot_" + winnerID);
        }
    }

    getEnemyVisibilityDistance(){
        return WTL_GAME_DATA["duel"]["enemy_visibility_distance"];
    }

    getRandom(){
        return this.aiRandom;
    }

    isABotGame(){
        for (let participantObject of this.gameSetupDetails["participants"]){
            if (participantObject["human"]){ return false; }
        }
        return true;
    }


    checkForResetRequest(){
        if (GAME_USER_INPUT_MANAGER.isActivated("g_ticked")){
            this.randomReset();
        }
    }

    gameTick(){
        if (this.isOver()){ 
            this.checkForResetRequest();
        }
    }

    async startUp(){
        this.spawns = await LevelGenerator.loadCornerSpawnsPreset(this.getScene(), this.gameSetupDetails["preset_data"], this.gameSetupDetails["seed"], WTL_GAME_DATA["duel"]["area_size"]);

        if (this.isABotGame()){
            this.setCameraPosition();
        }

        this.spawnTroops();

        // If this is a bot vs bot game then set up the camera
        if (this.isABotGame()){
            this.scene.setFocusedEntity(this.camera);
        }

        this.startUpLock.unlock();
    }

    isOver(){
        return this.gameOver;
    }

    checkWin(){
        let aliveCount = 0;
        let winnerID = null;
        for (let participant of this.participants){
            if (participant.isAlive()){
                winnerID = participant.getID(); // Save participant ID as winner (assumed the only one alive)
                // If there is more than 1 alive (counted so far) then the game is not won
                if (++aliveCount > 1){
                    return;
                }
            }
        }

        // Alive count <= 1 but should be 1 because no way for both to die in the same tick?
        this.stats.setWinner(winnerID);
        this.gameOver = true;
    }

    spawnTroops(){
        let participantID = 0;
        for (let participantObject of this.gameSetupDetails["participants"]){
            let characterModel = participantObject["model"];
            let participant;
            if (participantObject["human"]){
                participant = new DuelHuman(this, characterModel, participantObject["extra_details"]);
                // Human is automatically set as the focused entity
                this.scene.setFocusedEntity(participant);
            }else{
                participant = new DuelBot(this, characterModel, participantObject["extra_details"], participantObject["bot_extra_details"]);
            }

            // Set their id
            participant.setID("participant_" + (participantID++).toString());

            // Add them to list
            this.participants.push(participant);

            // Add them to the scene
            this.scene.addEntity(participant);

            // Arm them
            let participantSwayCompensationAbility = participant.getSwayCompensationAbility();
            let participantSwayMultiplier = 1 - participantSwayCompensationAbility;
            for (let pistolModelName of participantObject["pistols"]){
                participant.getInventory().add(new Pistol(pistolModelName, {
                    "player": participant,
                    "sway_acceleration_constant": participantSwayMultiplier * WTL_GAME_DATA["duel"]["pistol_sway_acceleration_constant"],
                    "max_sway_velocity_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["max_sway_velocity_deg"],
                    "maximum_random_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["maximum_random_sway_acceleration_deg"],
                    "minimum_random_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["minimum_random_sway_acceleration_deg"],
                    "corrective_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["corrective_sway_acceleration_deg"],
                    "sway_decline_a": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["sway_decline_a"],
                    "sway_decline_b": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["sway_decline_b"],
                    "corrective_sway_acceleration_constant_c": participantSwayCompensationAbility * WTL_GAME_DATA["gun_data"][pistolModelName]["corrective_sway_acceleration_constant_c"],
                    "corrective_sway_acceleration_constant_d": participantSwayCompensationAbility * WTL_GAME_DATA["gun_data"][pistolModelName]["corrective_sway_acceleration_constant_d"],
                    "sway_max_angle_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["sway_max_angle_deg"]
                }))
            }
            for (let musketModelName of participantObject["muskets"]){
                participant.getInventory().add(new Musket(musketModelName, {
                    "player": participant,
                    "sway_acceleration_constant": WTL_GAME_DATA["duel"]["musket_sway_acceleration_constant"],
                    "max_sway_velocity_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][musketModelName]["max_sway_velocity_deg"],
                    "maximum_random_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][musketModelName]["maximum_random_sway_acceleration_deg"],
                    "minimum_random_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][musketModelName]["minimum_random_sway_acceleration_deg"],
                    "corrective_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][musketModelName]["corrective_sway_acceleration_deg"],
                    "sway_decline_a": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][musketModelName]["sway_decline_a"],
                    "sway_decline_b": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][musketModelName]["sway_decline_b"],
                    "corrective_sway_acceleration_constant_c": participantSwayCompensationAbility * WTL_GAME_DATA["gun_data"][musketModelName]["corrective_sway_acceleration_constant_c"],
                    "corrective_sway_acceleration_constant_d": participantSwayCompensationAbility * WTL_GAME_DATA["gun_data"][musketModelName]["corrective_sway_acceleration_constant_d"],
                    "sway_max_angle_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][musketModelName]["sway_max_angle_deg"]
                }))
            }
            for (let swordModelName of participantObject["swords"]){
                participant.getInventory().add(new Sword(swordModelName, {
                    "player": participant
                }))
            }
        }

        this.prepareTroops();
    }

    prepareTroops(){
        let spawns = copyArray(this.spawns);

        // Reset the AI random
        this.aiRandom.reset();

        // Make sure there aren't too many spawns
        if (this.participants.length > spawns.length){
            throw new Error("Too many participants (" + this.participants.length + ") for " + spawns.length + " spawns.");
        }

        // Get associated random
        let random = this.getRandom();

        // Spawn participants randomly
        for (let participant of this.participants){
            let spawnNumber = random.getIntInRangeInclusive(0, spawns.length - 1);
            let spawn = spawns[spawnNumber];

            // Swap with last spawn and remove last one
            spawns[spawnNumber] = spawns[spawns.length - 1];
            spawns.pop();
            participant.resetMovement();
            participant.resetDecisions();
            participant.setTileX(spawn[0]);
            participant.setTileY(spawn[1]);
            participant.setFacingUDLRDirection("down");
            participant.setHealth(1);
            participant.setAlive(true);

            // Reload all weapons
            for (let item of participant.getInventory().getItems()){
                if (item === null){ continue; }
                item.reset();
            }

            // Reset bot ai
            if (participant instanceof DuelBot){
                participant.reset();
            }
        }
    }

    display(){
        if (this.startUpLock.isLocked()){
            LOADING_SCREEN.display();
            return;
        }
        //console.log(this.getCurrentTick())
        this.scene.display();
        this.stats.display();
        MY_HUD.updateElement("seed", this.seed);
    }

    tick(){
        if (this.startUpLock.isLocked()){ return; }
        this.gameTick();
        if (this.camera != null){
            this.camera.tick();
        }
        //console.log("Ticking scene")
        this.scene.tick();
    }
}