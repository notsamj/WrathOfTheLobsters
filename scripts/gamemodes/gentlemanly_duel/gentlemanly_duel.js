class GentlemanlyDuel extends Gamemode {
    constructor(gameSetupDetails){
        super();

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
        });


        this.camera = this.isABotGame() ? new DuelCamera(this) : null;

        this.gameOver = false;

        // Tracks if it is the turn of either player
        this.shooterTurnID = null;

        this.inPosition = false;
        this.noShotsFired = true;

        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    gameTick(){
        if (this.isOver()){ return; }
        if (this.inPosition){
            this.checkInPosition();
        }
    }

    checkInPosition(){
        let getTileBehind = (tileX, tileY, facingDirection) => {
            let bX;
            let bY;
            if (facingDirection === "up"){
                bX = tileX;
                bY = tileY - 1;
            }else if (facingDirection === "down"){
                bX = tileX;
                bY = tileY + 1;
            }else if (facingDirection === "left"){
                bX = tileX + 1;
                bY = tileY;
            }else if (facingDirection === "right"){
                bX = tileX - 1;
                bY = tileY;
            }
            return {"tile_x": bX, "tile_y": bY}
        }

        // Check if the participants are ready
        for (let participant of this.participants){
            // If one is moving then they are not ready
            if (participant.isMoving()){
                return;
            }

            let tileBehind = getTileBehind(participant.getTileX(), participant.getTileY(), participant.getFacingUDLRDirection());
            let tBX = tileBehind["tile_x"];
            let tBY = tileBehind["tile_y"];

            // If the location behind the participant isn't a "no_walk" then they certainly aren't in position
            if (!this.scene.tileAtLocationHasAttribute(tBX, tBY, "no_walk")){
                return;
            }
        }

        // If they are both not moving and have a no_walk tile behind them then they MUST be ready (just based on the level design)

        // They are now in position
        this.inPosition = true;
    }

    canShoot(id){
        if (!this.inPosition){ return false; }
        return this.noShotsFired || this.shooterTurnID === id;
    }

    getCommandFromGame(participantID){
        let getTileBehind = (tileX, tileY, facingDirection) => {
            let bX;
            let bY;
            if (facingDirection === "up"){
                bX = tileX;
                bY = tileY - 1;
            }else if (facingDirection === "down"){
                bX = tileX;
                bY = tileY + 1;
            }else if (facingDirection === "left"){
                bX = tileX + 1;
                bY = tileY;
            }else if (facingDirection === "right"){
                bX = tileX - 1;
                bY = tileY;
            }
            return {"tile_x": bX, "tile_y": bY}
        }
        let getTileInFront = (tileX, tileY, facingDirection) => {
            let bX;
            let bY;
            if (facingDirection === "up"){
                bX = tileX;
                bY = tileY + 1;
            }else if (facingDirection === "down"){
                bX = tileX;
                bY = tileY - 1;
            }else if (facingDirection === "left"){
                bX = tileX - 1;
                bY = tileY;
            }else if (facingDirection === "right"){
                bX = tileX + 1;
                bY = tileY;
            }
            return {"tile_x": bX, "tile_y": bY}
        }

        // If not in position then check if a command is needed
        if (!this.inPosition){
            let relevantParticipant = null;
            let otherParticipant = null;
            for (let participant of this.participants){
                if (participant.getID() === participantID){
                    relevantParticipant = participant;
                }else{
                    otherParticipant = participant;
                }
            }

            if (relevantParticipant === null){
                throw new Error("Failed to find participant");
            }

            // No need to do anything if I'm currently moving
            if (relevantParticipant.isMoving()){
                return;
            }

            if (otherParticipant === null){
                throw new Error("Failed to find other participant");
            }

            let amTopParticipant = relevantParticipant.getTileY() > otherParticipant.getTileY();

            // If I am the participant going to the top standing position (I also started above the other one)
            if (amTopParticipant){
                let facingUDLR = relevantParticipant.getFacingUDLRDirection();
                if (facingUDLR === "down"){
                    let tileBehindMe = getTileBehind(relevantParticipant.getTileX(), relevantParticipant.getTileY(), facingDirection);
                    let tileBehindMeIsBlocked = this.scene.tileAtLocationHasAttribute(tileBehindMe["tile_x"], tileBehindMe["tile_y"], "no_walk");
                    // Nothing to do, I'm clearly ready to start the game
                    if (tileBehindMeIsBlocked){
                        return {}
                    }
                    // Else this is probably the starting state. Go up -> 
                    else{
                        return {"up": true}
                    }
                }
                // Else assume they are facing up
                else{
                    let tileInFrontOfMe = getTileInFront(relevantParticipant.getTileX(), relevantParticipant.getTileY(), facingDirection);
                    let tileInFrontOfMeIsBlocked = this.scene.tileAtLocationHasAttribute(tileInFrontOfMe["tile_x"], tileInFrontOfMe["tile_y"], "no_walk");
                    // I've reached the correct position. Face the other way
                    if (tileInFrontOfMeIsBlocked){
                        return {"down": true, "break_stride": true}
                    }
                    // Else keep going
                    else{
                        return {"up": true}
                    }
                }
            }else{
                let facingUDLR = relevantParticipant.getFacingUDLRDirection();
                if (facingUDLR === "up"){
                    let tileBehindMe = getTileBehind(relevantParticipant.getTileX(), relevantParticipant.getTileY(), facingDirection);
                    let tileBehindMeIsBlocked = this.scene.tileAtLocationHasAttribute(tileBehindMe["tile_x"], tileBehindMe["tile_y"], "no_walk");
                    // Nothing to do, I'm clearly ready to start the game
                    if (tileBehindMeIsBlocked){
                        return {}
                    }
                    // Else this is probably the starting state. Go down -> 
                    else{
                        return {"down": true}
                    }
                }
                // Else assume they are facing down
                else{
                    let tileInFrontOfMe = getTileInFront(relevantParticipant.getTileX(), relevantParticipant.getTileY(), facingDirection);
                    let tileInFrontOfMeIsBlocked = this.scene.tileAtLocationHasAttribute(tileInFrontOfMe["tile_x"], tileInFrontOfMe["tile_y"], "no_walk");
                    // I've reached the correct position. Face the other way
                    if (tileInFrontOfMeIsBlocked){
                        return {"up": true, "break_stride": true}
                    }
                    // Else keep going
                    else{
                        return {"down": true}
                    }
                }
            }
        }

        // No command needed
        return {}
    }

    end(){
        MY_HUD.clearElement("seed");
        MY_HUD.clearElement("tile_x");
        MY_HUD.clearElement("tile_y");
        MY_HUD.clearElement("Cursor Tile X");
        MY_HUD.clearElement("Cursor Tile Y");
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
            this.stats.setWinner("Player");
        }else{
            this.stats.setWinner("Bot_" + winnerID);
        }
    }

    getEnemyVisibilityDistance(){
        return Number.MAX_SAFE_INTEGER;
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

    async startUp(){
        this.spawns = await this.loadMap();

        if (this.isABotGame()){
            let cameraSpawnX = Math.floor((this.spawns[0][0] + this.spawns[1][0])/2);
            let cameraSpawnY = Math.floor((this.spawns[0][1] + this.spawns[1][1])/2);
            this.camera.setTilePosition(cameraSpawnX, cameraSpawnY);
        }

        this.spawnTroops();

        // If this is a bot vs bot game then set up the camera
        if (this.isABotGame()){
            this.scene.setFocusedEntity(this.camera);
        }

        this.startUpLock.unlock();
    }

    async loadMap(){
        let mapName = "tree_duel.json"; // TODO: Save in data_json.js
        await this.scene.loadTilesFromJSON(LEVEL_DATA[mapName]);
        let spawns = []; 
        for (let [physicalTile, tileX, tileY] of this.scene.getActivePhysicalTiles()){
            if (physicalTile.hasAttribute("spawn")){
                spawns.push([tileX, tileY]);
                if (spawns.length === 2){
                    break;
                }
            }
        }

        return spawns;
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
                participant = new GentlemanlyDuelHuman(this, characterModel, participantObject["extra_details"]);
                // Human is automatically set as the focused entity
                this.scene.setFocusedEntity(participant);
            }else{
                participant = new GentlemanlyDuelBot(this, characterModel, participantObject["extra_details"], participantObject["bot_extra_details"]);
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
                    "corrective_sway_acceleration_constant_c": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["corrective_sway_acceleration_constant_c"],
                    "corrective_sway_acceleration_constant_d": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["corrective_sway_acceleration_constant_d"],
                    "sway_max_angle_deg": participantSwayMultiplier * WTL_GAME_DATA["gun_data"][pistolModelName]["sway_max_angle_deg"]
                }))
            }
        }

        let spawns = copyArray(this.spawns);

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
            participant.setTileX(spawn[0]);
            participant.setTileY(spawn[1]);
        }
    }

    display(){
        if (this.startUpLock.isLocked()){
            LOADING_SCREEN.display();
            return;
        }
        this.scene.display();
        this.stats.display();
        MY_HUD.updateElement("seed", this.seed);
    }

    tick(){
        if (this.startUpLock.isLocked()){ return; }
        if (this.camera != null){
            this.camera.tick();
        }
        this.game.tick();
        this.scene.tick();
    }
}