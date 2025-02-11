/*
    Class Name: GentlemanlyDuel
    Class Description: A duel gamemode
*/
class GentlemanlyDuel extends Gamemode {
    /*
        Method Name: constructor
        Method Parameters: 
            gameSetupDetails:
                A JSON with details about the game
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gameSetupDetails){
        super();

        this.gameSetupDetails = gameSetupDetails;

        this.seed = gameSetupDetails["seed"];
        // Only using when testing
        if (this.seed === null){
            this.seed = this.generateRandomSeed();
            gameSetupDetails["seed"] = this.seed;
        }
        this.aiRandom = new SeededRandomizer(this.seed);

        this.participants = [];

        this.stats = new GentlemanlyDuelMatchStats();
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
            this.handleGunShot(eventObj);
        });


        this.camera = this.isABotGame() ? new DuelCamera(this) : null;

        this.gameOver = false;

        // Tracks if it is the turn of either player
        this.shooterTurnID = null;

        this.inPosition = false;
        this.noShotsFired = true;

        // Declare
        this.startUnlockTick = undefined;
        this.turnUnlockTick = undefined;

        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    /*
        Method Name: handleUnpause
        Method Parameters: None
        Method Description: Takes actions when the game is unpaused
        Method Return: void
    */
    handleUnpause(){
        for (let participant of this.participants){
            participant.handleUnpause();
        }
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Gets the name of the game
        Method Return: String
    */
    getName(){ return "gentlemanly_duel"; }

    /*
        Method Name: generateRandomSeed
        Method Parameters: None
        Method Description: Comes up with a seed
        Method Return: int
    */
    generateRandomSeed(){
        return randomNumberInclusive(0, Math.floor(Math.pow(10, 3))-1);
    }

    /*
        Method Name: randomReset
        Method Parameters: None
        Method Description: Resets the game
        Method Return: void
    */
    randomReset(){
        this.gameOver = false;
        this.noShotsFired = true;
        this.inPosition = false;
        this.shooterTurnID = null;
        this.stats.reset();
        this.seed = this.generateRandomSeed();
        this.aiRandom = new SeededRandomizer(this.seed);
        if (this.isABotGame()){
            this.setCameraPosition();
        }

        this.prepareTroops();
        this.prepareGameState();
    }

    /*
        Method Name: prepareGameState
        Method Parameters: None
        Method Description: Prepares the game state
        Method Return: void
    */
    prepareGameState(){
        this.startUnlockTick = this.getCurrentTick() + msToTickCeil(WTL_GAME_DATA["gentlemanly_duel"]["start_delay_ms"]);
    }

    /*
        Method Name: setCameraPosition
        Method Parameters: None
        Method Description: Sets the starting camera position
        Method Return: void
    */
    setCameraPosition(){
        let cameraSpawnX = Math.floor((this.spawns[0][0] + this.spawns[1][0])/2);
        let cameraSpawnY = Math.floor((this.spawns[0][1] + this.spawns[1][1])/2);
        this.camera.setTilePosition(cameraSpawnX, cameraSpawnY);
    }

    /*
        Method Name: hasDuelStarted
        Method Parameters: None
        Method Description: Checks if the duel has started
        Method Return: boolean 
    */
    hasDuelStarted(){
        return this.inPosition && this.getCurrentTick() >= this.turnUnlockTick;
    }

    /*
        Method Name: handleGunShot
        Method Parameters: 
            eventObj:
                Event info about gun shot
        Method Description: Takes actions based on a gunshot
        Method Return: void
    */
    handleGunShot(eventObj){
        let shooterID = eventObj["shooter_id"];

        // If this person is not allowed to shoot then its unexpected
        if (!this.noShotsFired && shooterID != this.shooterTurnID){
            throw new Error("Unexpected shot");
        }

        // Acknowledge that shows have been fired
        if (this.noShotsFired){
            this.noShotsFired = false;
        }

        // Set the allowed shooter to the new one
        this.shooterTurnID = this.getOtherPlayerID(shooterID);
    }

    /*
        Method Name: gameTick
        Method Parameters: None
        Method Description: Handles game logic
        Method Return: void
    */
    gameTick(){
        this.checkForResetRequest();
        if (this.isOver()){ return; }
        if (!this.inPosition){
            this.checkInPosition();
        }
    }

    /*
        Method Name: checkInPosition
        Method Parameters: None
        Method Description: Checks if both players are in position
        Method Return: void
    */
    checkInPosition(){
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

        // Check if the participants are ready
        for (let participant of this.participants){
            // If one is moving then they are not ready
            if (participant.isMoving()){
                return;
            }

            let tileBehind = getTileInFront(participant.getTileX(), participant.getTileY(), participant.getFacingUDLRDirection());
            let tFX = tileBehind["tile_x"];
            let tFY = tileBehind["tile_y"];

            // If the location in front the participant isn't a "no_walk" then they certainly aren't in position
            if (!this.scene.tileAtLocationHasAttribute(tFX, tFY, "no_walk")){
                return;
            }
        }

        // If they are both not moving and have a no_walk tile in front them then they MUST be ready (just based on the level design)

        // They are now in position
        this.inPosition = true;
        this.turnUnlockTick = this.getCurrentTick() + Math.max(1, this.getRandom().getIntInRangeInclusive(msToTickCeil(WTL_GAME_DATA["gentlemanly_duel"]["min_turn_delay_ms"]), msToTickCeil(WTL_GAME_DATA["gentlemanly_duel"]["max_turn_delay_ms"])));
    }

    /*
        Method Name: canShoot
        Method Parameters: 
            id:
                Id of a player
        Method Description: Checks if a player can shoot
        Method Return: boolean
    */
    canShoot(id){
        if (!this.hasDuelStarted()){ return false; }
        return this.noShotsFired || this.shooterTurnID === id;
    }

    /*
        Method Name: getCommandFromGame
        Method Parameters: 
            participantID:
                Participant to look for command for
        Method Description: Looks to see if there is a command for the player
        Method Return: JSON Object
    */
    getCommandFromGame(participantID){
        // No commands after start
        if (this.hasDuelStarted()){ return {}; }

        let getTileInFront = (tileX, tileY, facingDirection) => {
            let fX;
            let fY;
            if (facingDirection === "up"){
                fX = tileX;
                fY = tileY + 1;
            }else if (facingDirection === "down"){
                fX = tileX;
                fY = tileY - 1;
            }else if (facingDirection === "left"){
                fX = tileX - 1;
                fY = tileY;
            }else if (facingDirection === "right"){
                fX = tileX + 1;
                fY = tileY;
            }
            return {"tile_x": fX, "tile_y": fY}
        }

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

        let facingUDLR = relevantParticipant.getFacingUDLRDirection();

        if (otherParticipant === null){
            throw new Error("Failed to find other participant");
        }

        let amLeftParticipant = relevantParticipant.getTileX() < otherParticipant.getTileX();

        // If not in position then check if a command is needed
        if (!this.inPosition){
            // If I am the participant going to the right standing position (I also started above the other one)
            if (amLeftParticipant){
                if (facingUDLR === "right"){
                    // this is probably the starting state. Go left -> 
                    return {"left": true}
                }
                // Else assume they are facing left
                else{
                    let tileInFrontOfMe = getTileInFront(relevantParticipant.getTileX(), relevantParticipant.getTileY(), facingUDLR);
                    let tileInFrontOfMeIsBlocked = this.scene.tileAtLocationHasAttribute(tileInFrontOfMe["tile_x"], tileInFrontOfMe["tile_y"], "no_walk");
                    // I've reached the correct position. Stay there
                    if (tileInFrontOfMeIsBlocked){
                        return {}
                    }
                    // Else keep going
                    else{
                        return {"left": true}
                    }
                }
            }else{
                if (facingUDLR === "left"){
                    // this is probably the starting state. Go right -> 
                    return {"right": true}
                }
                // Else assume they are facing right
                else{
                    let tileInFrontOfMe = getTileInFront(relevantParticipant.getTileX(), relevantParticipant.getTileY(), facingUDLR);
                    let tileInFrontOfMeIsBlocked = this.scene.tileAtLocationHasAttribute(tileInFrontOfMe["tile_x"], tileInFrontOfMe["tile_y"], "no_walk");
                    // I've reached the correct position. Stay there
                    if (tileInFrontOfMeIsBlocked){
                        return {}
                    }
                    // Else keep going
                    else{
                        return {"right": true}
                    }
                }
            }
        }
        // Otherwise in position
        else{
            // If this is the tick before the unlock (unlock is always at least 1 tick after inPosition is set and this comes in the same tick after inPosition is set)
            if (this.getCurrentTick() === this.turnUnlockTick - 1){
                if (amLeftParticipant){
                    return {"right": true}
                }else{
                    return {"left": true}
                }
            }else{
                return {}
            }
        }
    }

    /*
        Method Name: end
        Method Parameters: None
        Method Description: Handles actions on game end
        Method Return: void
    */
    end(){
        MY_HUD.clearElement("seed");
        MY_HUD.clearElement("tile_x");
        MY_HUD.clearElement("tile_y");
        MY_HUD.clearElement("Cursor Tile X");
        MY_HUD.clearElement("Cursor Tile Y");
    }

    /*
        Method Name: getParticipants
        Method Parameters: None
        Method Description: Getter
        Method Return: List of GentlemanlyDuelCharacter
    */
    getParticipants(){
        return this.participants;
    }

    /*
        Method Name: findParticipantFromID
        Method Parameters: 
            participantID:
                Participant ID to search for
        Method Description: Finds a participant given an id
        Method Return: DuelCharacter
    */
    findParticipantFromID(participantID){
        for (let participant of this.participants){
            if (participant.getID() === participantID){
                return participant;
            }
        }
        throw new Error("Failed to find participant with ID: " + participantID);
    }

    /*
        Method Name: endGame
        Method Parameters: 
            winnerID:
                The winner'd id
        Method Description: Ends th egame
        Method Return: void
    */
    endGame(winnerID){
        this.gameOver = true;
        let winner = this.findParticipantFromID(winnerID);
        if (winner.isHuman()){
            this.stats.setWinner("Human Player");
        }else{
            this.stats.setWinner("Bot_" + winnerID);
        }
    }

    /*
        Method Name: getEnemyVisibilityDistance
        Method Parameters: None
        Method Description: Gets the visibility distance for enemies
        Method Return: float
    */
    getEnemyVisibilityDistance(){
        return Number.MAX_SAFE_INTEGER;
    }

    /*
        Method Name: getRandom
        Method Parameters: None
        Method Description: Getter
        Method Return: Getter
    */
    getRandom(){
        return this.aiRandom;
    }

    /*
        Method Name: isABotGame
        Method Parameters: None
        Method Description: Checks if the game is bot vs bot
        Method Return: boolean, true -> all participants are bots, false -> not all participants are bots
    */
    isABotGame(){
        for (let participantObject of this.gameSetupDetails["participants"]){
            if (participantObject["human"]){ return false; }
        }
        return true;
    }

    /*
        Method Name: startUp
        Method Parameters: None
        Method Description: Starts up the game
        Method Return: Promise (implicit)
    */
    async startUp(){
        this.spawns = await this.loadMap();

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

    /*
        Method Name: loadMap
        Method Parameters: None
        Method Description: Loads a map from level data
        Method Return: List of spawn point info 
    */
    async loadMap(){
        let mapName = this.gameSetupDetails["map_file_name"];
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

    /*
        Method Name: isOver
        Method Parameters: None
        Method Description: Checks if the game is over
        Method Return: boolean
    */
    isOver(){
        return this.gameOver;
    }

    /*
        Method Name: checkWin
        Method Parameters: None
        Method Description: Checks if a player has won the game
        Method Return: void
    */
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

    /*
        Method Name: spawnTroops
        Method Parameters: None
        Method Description: Spawns the troops
        Method Return: void
    */
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
                    "sway_acceleration_constant": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"]["pistol_sway_acceleration_constant"],
                    "max_sway_velocity_deg": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["max_sway_velocity_deg"],
                    "maximum_random_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["maximum_random_sway_acceleration_deg"],
                    "minimum_random_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["minimum_random_sway_acceleration_deg"],
                    "corrective_sway_acceleration_deg": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["corrective_sway_acceleration_deg"],
                    "sway_decline_a": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["sway_decline_a"],
                    "sway_decline_b": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["sway_decline_b"],
                    "corrective_sway_acceleration_constant_c": participantSwayCompensationAbility * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["corrective_sway_acceleration_constant_c"],
                    "corrective_sway_acceleration_constant_d": participantSwayCompensationAbility * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["corrective_sway_acceleration_constant_d"],
                    "sway_max_angle_deg": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["sway_max_angle_deg"],
                    "min_start_sway_deg": participantSwayMultiplier * WTL_GAME_DATA["gentlemanly_duel"]["gun_data"][pistolModelName]["min_start_sway_deg"]
                }))
            }
        }
        this.prepareTroops();
        this.prepareGameState();
    }

    /*
        Method Name: prepareTroops
        Method Parameters: None
        Method Description: Prepares the troops
        Method Return: void
    */
    prepareTroops(){
        let spawns = copyArray(this.spawns);

        // Make sure there aren't too many spawns
        if (this.participants.length > spawns.length){
            throw new Error("Too many participants (" + this.participants.length + ") for " + spawns.length + " spawns.");
        }

        // Get associated random
        let random = this.getRandom();

        let leftSpawnX = Math.min(this.spawns[0][0], this.spawns[1][0]);

        // Spawn participants randomly
        for (let participant of this.participants){
            let spawnNumber = random.getIntInRangeInclusive(0, spawns.length - 1);
            let spawn = spawns[spawnNumber];

            // Swap with last spawn and remove last one
            spawns[spawnNumber] = spawns[spawns.length - 1];
            spawns.pop();
            participant.setTileX(spawn[0]);
            participant.setTileY(spawn[1]);
            participant.setHealth(1);
            participant.setAlive(true);

            let isLeftSpawn = spawn[0] === leftSpawnX;
            if (isLeftSpawn){
                participant.setFacingUDLRDirection("right");
            }else{
                participant.setFacingUDLRDirection("left");
            }

            // Reload all weapons
            for (let item of participant.getInventory().getItems()){
                if (item === null){ continue; }
                item.reset();
            }
        }
    }

    /*
        Method Name: getOtherPlayerID
        Method Parameters: 
            id:
                ID of a player
        Method Description: Finds the id of the other player in the game
        Method Return: String
    */
    getOtherPlayerID(id){
        for (let participant of this.participants){
            let otherID = participant.getID();
            if (otherID != id){
                return otherID;
            }
        }
        throw new Error("Failed to find other participant.");
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the game
        Method Return: void
    */
    display(){
        if (this.startUpLock.isLocked()){
            LOADING_SCREEN.display();
            return;
        }
        this.scene.display();
        this.stats.display();
        MY_HUD.updateElement("seed", this.seed);
    }

    /*
        Method Name: checkForResetRequest
        Method Parameters: None
        Method Description: Checks if the user wishes to reset the game
        Method Return: void
    */
    checkForResetRequest(){
        if (GAME_USER_INPUT_MANAGER.isActivated("g_ticked")){
            this.randomReset();
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Performs tick processes
        Method Return: void
    */
    tick(){
        if (this.startUpLock.isLocked()){ return; }
        if (this.camera != null){
            this.camera.tick();
        }
        this.gameTick();
        this.scene.tick();
    }
}