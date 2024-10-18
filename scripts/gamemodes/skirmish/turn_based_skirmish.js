class TurnBasedSkirmish extends Gamemode {
    constructor(britishAreHuman=true, americansAreHuman=true, aiSeed=null){
        super();

        this.aiRandom = null;
        if (this.aiSeed != null){
            this.aiRandom = new SeededRandomizer(aiSeed);
        }

        this.britishTroops = [];
        this.americanTroops = [];
        this.stats = new MatchStats();
        this.random = null; // Declare
        this.brains = {
            "American": null,
            "British": null
        }
        let scene = this.getScene();
        this.eventHandler.addHandler("kill", (killObject) => {
            scene.addExpiringVisual(BloodPool.create(scene.getCenterXOfTile(killObject["tile_x"]), scene.getCenterYOfTile(killObject["tile_y"])));
            let victimClass = killObject["victim_class"];
            let killerClass = killObject["killer_class"];
            this.stats.addKill(victimClass, killerClass);
        });

        this.eventHandler.addHandler("gun_shot", (eventObj) => {
            scene.addExpiringVisual(SmokeCloud.create(eventObj["x"], eventObj["y"]));
            SOUND_MANAGER.play("gunshot", eventObj["x"], eventObj["y"]);
            // Inform the team that is not moving of a shot
            let otherTeamName = this.getOtherTeam(this.gameState["turn"]);
            if (this.isTeamBot(otherTeamName)){
                this.brains[otherTeamName].informOfShot(eventObj["shooter_tile_x"], eventObj["shooter_tile_y"]);
            }
        });

        this.eventHandler.addHandler("change_tile", (tileChangeDetailsObject) => {
            // Note: Assume troop has already moved (though visibility hasn't been updated yet :)
            let troopTeam = tileChangeDetailsObject["team"];
            let otherTeam = this.getOtherTeam(troopTeam);
            let otherTeamIsABotTeam = this.gameState["operation_type"][getProperAdjective(otherTeam)] === "bot";
            //console.log("Update visiblity!!!")
            if (otherTeamIsABotTeam){
                let troopID = tileChangeDetailsObject["troop_id"];
                let previouslyVisible = this.isVisibleToTeam(otherTeam, troopTeam, troopID);

                // Update visiblity
                this.checkAndUpdateTeamVisibility()

                let nowVisible = this.isVisibleToTeam(otherTeam, troopTeam, troopID);
                // If went from visible -> non-visible
                if (!nowVisible && previouslyVisible){
                    this.getTeamBrain(otherTeam).troopVanishes(troopID, tileChangeDetailsObject["health"], tileChangeDetailsObject["new_tile_x"], tileChangeDetailsObject["new_tile_y"]);
                }
            }else{
                // Update visiblity
                this.checkAndUpdateTeamVisibility()
            }
        });

        this.britishCamera = new SkirmishCamera(this, getProperAdjective("British"));
        this.americanCamera = new SkirmishCamera(this, getProperAdjective("American"));
        this.neutralCamera = new SkirmishCamera(this, "neutral");

        // A camera that needs to be ticked by the game instance
        this.cameraToTick = null;

        this.gameOver = false;
        this.britishSpawn = null;
        this.americanSpawn = null;

        this.gameState = null;
        this.initializeGameState(britishAreHuman, americansAreHuman);

        this.rockHitboxes = [];

        this.startUpLock = new Lock();
        this.startUpLock.lock();
        this.startUp();
    }

    isTeamBot(teamName){
        return this.gameState["operation_type"][getProperAdjective(teamName)] === "bot";
    }

    getTroop(teamName, troopID){
        let roster = this.getTeamRosterFromName(teamName);
        for (let troop of roster){
            if (troop.getID() == troopID){
                return troop;
            }
        }
        return null;
    }

    getTeamBrain(teamName){
        return this.brains[getProperAdjective(teamName)];
    }

    getEnemyVisibilityDistance(){
        return RETRO_GAME_DATA["skirmish"]["enemy_visibility_distance"];
    }

    getRandom(){
        return this.aiRandom;
    }

    getOtherTeam(teamNameString){
        if (getProperAdjective(teamNameString) == getProperAdjective("American")){
            return getProperAdjective("British");
        }
        return getProperAdjective("American");
    }

    getTeamCamera(teamNameString){
        if (getProperAdjective(teamNameString) == getProperAdjective("American")){
            return this.americanCamera;
        }
        return this.britishCamera;
    }

    isBotGame(){
        return this.gameState["operation_type"]["British"] === "bot" && this.gameState["operation_type"]["American"] === "bot";
    }

    getAllTroops(){
        return appendLists(this.britishTroops, this.americanTroops);
    }

    getSpawnObjectByName(teamNameString){
        let teamNameConverted = getProperAdjective(teamNameString);
        if (teamNameConverted == "American"){
            return this.americanSpawn;
        }
        return this.britishSpawn;
    }

    getOfficerCommand(troop){
        let officer = this.getTroopOfficer(troop);

        // No officer for this troop
        if (officer == null){ return null; }

        let selectedItem = officer.getSelectedItem();

        // If the officer is holding something
        if (selectedItem != null){ 
            // If the officer is holding a point to move or point to shoot tool
            if (selectedItem instanceof PointToMove || selectedItem instanceof PointToShoot){
                return selectedItem.getCommandForTroop(troop);
            }
        }

        // Otherwise, no command
        return null;
    }

    getTroopOfficer(troop){
        let teamRoster = this.getLivingTeamRosterFromName(troop.getTeamName());
        // Since one officer per team, an officer cannot be selected
        if (troop.getRankName() === "officer"){
            return null;
        }
        // Loop through all the troops on this troop's team to find the officer
        for (let otherTroop of teamRoster){
            // Skip yourself Note: May not be needed
            if (otherTroop.is(troop)){ continue; }
            // Note: Assuming only 1 officer
            if (otherTroop.getRankName() === "officer"){
                return otherTroop;
            }
        }
        // Officer not found
        return null;
    }

    isTroopSelected(troop){
        let officer = this.getTroopOfficer(troop);

        // If no officer found then return false, not selected
        if (officer === null){ return false; }

        // If officer is not making a move then return false
        if (!officer.isMakingAMove()){ return false; }

        let selectedItem = officer.getSelectedItem();

        // If the officer is holding something
        if (selectedItem != null){ 
            // If the officer is holding a point to move or point to shoot tool
            if (selectedItem instanceof PointToMove || selectedItem instanceof PointToShoot){
                let selectedTroops = selectedItem.getSelectedTroops();
                // Check all of the officer's selected troops to see if 'troop' is on the list
                for (let selectedTroop of selectedTroops){
                    if (selectedTroop.is(troop)){
                        return true;
                    }
                }
            }
        }

        // Troop isn't selected
        return false;
    }

    getTurnCounter(){
        return this.gameState["turn_counter"];
    }

    isVisibleToTeam(observerTeamName, observedTeamName, characterID){
        if (observerTeamName === "neutral"){
            return true;
        }
        // Note: Assumed team1 != team2
        let teamVisibilityJSONPerspective = this.gameState["team_visibility"][observerTeamName];

        // Check all ids
        let ids = teamVisibilityJSONPerspective["visible_enemy_character_ids"];
        for (let id of ids){
            if (id == characterID){
                return true;
            }
        }
        return false;
    }

    checkAndUpdateTeamVisibility(){
        let teamVisibilityJSON = this.gameState["team_visibility"];
        let getLastRecordedPosition = (troop) => {
            let teamName = troop.getTeamName();
            let troopID = troop.getID();
            for (let troopPositionObject of teamVisibilityJSON[teamName]["last_updated_positions"]){
                if (troopPositionObject["id"] === troopID){
                    return troopPositionObject;
                }
            }
            return null;
        }

        let updatedTroops = {
            "American": [],
            "British": []
        };

        //console.log("New visiblity calculation")
        let updateTroops = (teamName) => {
            let troops = this.getTeamRosterFromName(teamName);
            for (let troop of troops){
                let id = troop.getID();
                if (troop.isDead()){
                    updatedTroops[teamName].push({"id": id, "dead": true});
                    continue;
                }
                let positionObject = getLastRecordedPosition(troop);
                let tileX = troop.getTileX();
                let tileY = troop.getTileY();
                let updatePosition = positionObject === null || positionObject["tile_x"] != tileX || positionObject["tile_y"] != tileY;
                
                if (!updatePosition){ continue; }
                
                if (positionObject === null){
                    positionObject = {"id": id};
                    teamVisibilityJSON[teamName]["last_updated_positions"].push(positionObject);
                }
                positionObject["tile_x"] = tileX;
                positionObject["tile_y"] = tileY;
                positionObject["dead"] = false;
                updatedTroops[teamName].push(positionObject);
            }
        }

        // Check for changes in the last updated positions
        updateTroops("British");
        updateTroops("American");

        let noUpdates = updatedTroops["British"].length === 0 && updatedTroops["American"].length === 0;

        // Save time by doing nothing if no updates
        if (noUpdates){ return; }

        let getRecordedSightsForTroop = (troop) => {
            let teamName = troop.getTeamName();
            let troopID = troop.getID();
            for (let troopSightObject of teamVisibilityJSON[teamName]["troop_sightings"]){
                if (troopSightObject["id"] === troopID){
                    return troopSightObject;
                }
            }
            return null;
        }
        /*
            For each british troop
                for each americanTroopUPDATED
                    if americanTroop in sightList of birtsihTroop and no longer visible to british troop
                        remove from sight list
            
            Same for american troops

            Recomute sight list for each

        */

        let updateSightings = (teamName) => {
            let troops = this.getLivingTeamRosterFromName(teamName);
            let otherTeam = this.getOtherTeam(teamName);
            let changesMade = false;

            let updateSight = (troop, sightObject, updateObject) => {
                let otherTeamTroopID = updateObject["id"];
                let otherTroopTileX = updateObject["tile_x"];
                let otherTroopTileY = updateObject["tile_y"];
                let index = getIndexOfElementInArray(sightObject["troops_in_sight"], otherTeamTroopID);
                // If updated opposite team troop isn't sighted by this friendly troop
                if (index === -1){
                    // Check if it is visible (must be alive)
                    if (!updateObject["dead"] && troop.canSeeTileEntityAtTile(otherTroopTileX, otherTroopTileY)){
                        sightObject["troops_in_sight"].push(otherTeamTroopID);
                        return true;
                    }
                }
                // Else if it is present
                else{
                    // Check if it is still visible (and alive)
                    let canBeSeenStill = !updateObject["dead"] && troop.canSeeTileEntityAtTile(otherTroopTileX, otherTroopTileY);
                    // If it can no longer be seen by this troop, then remove it
                    if (!canBeSeenStill){
                        // Swap indices and shift to remove
                        arraySwap(sightObject["troops_in_sight"], 0, index);
                        sightObject["troops_in_sight"].shift();
                        return true;
                    }
                }
                return false;
            }


            // Update what troops on team A can see UPDATED troops on team B
            for (let troop of troops){
                let sightObject = getRecordedSightsForTroop(troop);
                let id = troop.getID();
                if (sightObject === null){
                    sightObject = {"id": id, "troops_in_sight": []};
                    teamVisibilityJSON[teamName]["troop_sightings"].push(sightObject);
                }
                // Loop through opposite team updated troops to maybe remove from sight if no longer visible
                for (let updateObject of updatedTroops[otherTeam]){
                    let newChange = updateSight(troop, sightObject, updateObject);
                    if (newChange){
                        changesMade = true;
                    }
                }
            }

            // Loop through updated troops specifically can see what enemy troops they can see now that they've moved
            let otherTeamRoster = this.getLivingTeamRosterFromName(otherTeam);
            for (let updatedTroop of updatedTroops[teamName]){
                let troop = this.getTroop(teamName, updatedTroop["id"]);
                let sightObject = getRecordedSightsForTroop(troop);
                let id = troop.getID();
                if (sightObject === null){
                    sightObject = {"id": id, "troops_in_sight": []};
                    teamVisibilityJSON[teamName]["troop_sightings"].push(sightObject);
                }
                // Change made is it's dead
                if (updatedTroop["dead"]){ return true; }
                
                // Loop through opposite team troops to maybe remove from sight if no longer visible
                for (let enemy of otherTeamRoster){
                    let newChange = updateSight(troop, sightObject, enemy.getID(), enemy.getTileX(), enemy.getTileY());
                    if (newChange){
                        changesMade = true;
                    }
                }
            }

            return changesMade;
        }
        let britishSightingsUpdated = updateSightings("British");
        let americanSightingsUpdated = updateSightings("American");

        // Don't continue if nothing to update
        if (!britishSightingsUpdated && !americanSightingsUpdated){
            return;
        }

        let consolidateVisibility = (teamName) => {
            let troops = this.getLivingTeamRosterFromName(teamName);
            let newList = [];
            // Note: Full recalculation

            // Loop through all troops and add added
            for (let troop of troops){
                let sightObject = getRecordedSightsForTroop(troop);
                for (let id of sightObject["troops_in_sight"]){
                    //console.log("Adding", id)
                    addToArraySet(newList, id);
                }
            }
            teamVisibilityJSON[teamName]["visible_enemy_character_ids"] = newList;
        }

        // Consolidate the data for simple checking
        if (britishSightingsUpdated){
            consolidateVisibility("British");
        }
        if (americanSightingsUpdated){
            consolidateVisibility("American");
        }
    }

    getTeamRosterFromName(teamName){
        let teamProperAdjective = getProperAdjective(teamName);
        if (teamProperAdjective == "British"){
            return this.britishTroops;
        }
        return this.americanTroops;
    }

    getLivingTeamRosterFromName(teamName){
        let roster = this.getTeamRosterFromName(teamName);
        let livingRoster = [];
        for (let troop of roster){
            if (troop.isAlive()){
                livingRoster.push(troop);
            }
        }
        return livingRoster;
    }

    gameTick(){
        if (this.isOver()){ return; }
        this.makeMove();
    }

    updateCameraToNewMover(currentlyMovingCharacter){
        // If this game is bot vs bot then update the neutral camera
        if (this.isBotGame()){
            this.neutralCamera.focusOn(currentlyMovingCharacter);
            this.cameraToTick = this.neutralCamera;
        }
        // Else if the team of the now moving character is human then focus on the character
        else if (this.gameState["operation_type"][getProperAdjective(currentlyMovingCharacter.getTeamName())] === "human"){
            this.scene.setFocusedEntity(currentlyMovingCharacter);
            this.cameraToTick = null;
        }
        // Else the team of the now moving character is a bot, the other team must be human, set the focus on the human team's camera
        else{
            let camera = this.getTeamCamera(this.getOtherTeam(currentlyMovingCharacter.getTeamName()));
            let cameraTeam = camera.getTeamName();
            this.cameraToTick = camera;
            this.scene.setFocusedEntity(camera);
            // If visible focus on this one
            if (this.isVisibleToTeam(camera.getTeamName(), currentlyMovingCharacter.getTeamName(), currentlyMovingCharacter.getID())){
                camera.focusOn(currentlyMovingCharacter);
            }
        }
    }

    makeMove(){
        // Assuming game still running
        let currentTeamName = this.gameState["turn"];
        let teamRoster = currentTeamName == "British" ? this.britishTroops : this.americanTroops;

        let currentlyMovingCharacter = null;
        let currentlyMovingCharacterIndex = this.gameState["troop_to_move_index"][currentTeamName];
        let livingCount = 0;
        for (let troop of teamRoster){
            if (troop.isAlive()){
                livingCount++;
            }
        }

        // Adjust the index of the currently moving character based on how many are alive on the team
        if (currentlyMovingCharacterIndex >= livingCount){
            currentlyMovingCharacterIndex = 0;
        }

        let characterIndex = 0;
        for (let troop of teamRoster){
            if (troop.isAlive()){
                if (characterIndex === currentlyMovingCharacterIndex){
                    currentlyMovingCharacter = troop;
                    break;
                }
                characterIndex++;
            }
        }

        // Now the currently moving troop is selected
        if (!currentlyMovingCharacter.isMakingAMove() && !currentlyMovingCharacter.isMoveDone()){
            currentlyMovingCharacter.indicateTurn();
            this.updateCameraToNewMover(currentlyMovingCharacter);
            return;
        }

        // currentlyMovingCharacter is making a move

        // If currentlyMovingCharacter is still making the move do nothing
        if (!currentlyMovingCharacter.isMoveDone()){
            if (GENERAL_DEBUGGER.getOrCreateSwitch("who_is_moving").check()){
                console.log("Waiting for move from", currentlyMovingCharacter);
            }
            return;
        }

        // If currentlyMovingCharacter is done their move
        currentlyMovingCharacter.acceptMoveDone();

        // Go to next index
        this.gameState["troop_to_move_index"][currentTeamName] = (currentlyMovingCharacterIndex + 1) % livingCount;

        // Switch teams
        this.gameState["turn"] = this.gameState["turn"] == "British" ? "American" : "British";

        // Increase turn counter (used for simplifying some operations)
        this.gameState["turn_counter"] += 1;

        // Check if over
        this.checkWin();
        if (this.isOver()){ return; }

        // Call again (state changed so its not an infinite loop)
        this.makeMove();
    }

    initializeGameState(britishAreHuman, americansAreHuman){
        this.gameState = {
            "turn": "British",
            "operation_type": {
                "British": (britishAreHuman ? "human" : "bot"),
                "American": (americansAreHuman ? "human" : "bot")
            },
            "troop_to_move_index": {
                "British": 0,
                "American": 0
            },
            "turn_counter": 0,
            "team_visibility": {
                "British": {
                    "visible_enemy_character_ids": [],
                    "troop_sightings": [],
                    "last_updated_positions": []
                },
                "American": {
                    "visible_enemy_character_ids": [],
                    "troop_sightings": [],
                    "last_updated_positions": []
                },
            }
        }
    }

    async startUp(){
        await this.generateTiles();

        this.spawnTroops();

        // If this is a bot vs bot game then set up the camera
        if (this.isBotGame()){
            this.scene.setFocusedEntity(this.neutralCamera);
        }

        this.startUpLock.unlock();
    }

    isOver(){
        return this.gameOver;
    }

    checkWin(){
        let livingAmericans = false;
        for (let american of this.americanTroops){
            if (american.isAlive()){
                livingAmericans = true;
                break;
            }
        }
        if (!livingAmericans){
            this.gameOver = true;
            this.stats.setWinner("British");
            return;
        }
        let livingBritish = false;
        for (let brit of this.britishTroops){
            if (brit.isAlive()){
                livingBritish = true;
                break;
            }
        }
        if (!livingBritish){
            this.gameOver = true;
            this.stats.setWinner("Americans");
        }
    }

    spawnTroops(){
        let officers = [];
        let privates = [];

        let britishAreHuman = this.gameState["operation_type"]["British"] === "human";
        let americansAreHuman = this.gameState["operation_type"]["American"] === "human";

        // Create brains if needed
        
        if (!britishAreHuman){
            this.brains["British"] = new BotSharedBrain(this, "British");
        }

        if (!americansAreHuman){
            this.brains["American"] = new BotSharedBrain(this, "American");
        }

        // Create officers
        for (let i = 0; i < RETRO_GAME_DATA["skirmish"]["game_play"]["officer_count"]; i++){
            let britishOfficer;
            if (britishAreHuman){
                britishOfficer = new SkirmishHuman(this, "british_officer", "officer", "British");
            }else{
                britishOfficer = new SkirmishBot(this, "british_officer", "officer", "British");
            }
            britishOfficer.setID("british_officer_" + i.toString());
            this.britishTroops.push(britishOfficer);
            officers.push(britishOfficer);

            let americanOfficer;
            if (americansAreHuman){
                americanOfficer = new SkirmishHuman(this, "usa_officer", "officer", "American");
            }else{
                americanOfficer = new SkirmishBot(this, "usa_officer", "officer", "American");
            }
            americanOfficer.setID("american_officer_" + i.toString());
            this.americanTroops.push(americanOfficer);
            officers.push(americanOfficer);
        }

        // Equip officers
        for (let officer of officers){
            officer.getInventory().add(new SkirmishPistol("flintlock", {
                "player": officer
            }));

            officer.getInventory().add(new SkirmishSword("cavalry_sword", {
                "player": officer
            }));

            officer.getInventory().add(new PointToMove({
                "player": officer
            }));

            officer.getInventory().add(new PointToShoot({
                "player": officer
            }));

            officer.getInventory().add(new PointToShootCannon({
                "player": officer
            }));
        }

        // Create privates
        for (let i = 0; i < RETRO_GAME_DATA["skirmish"]["game_play"]["private_count"]; i++){
            let britishPrivate;
            if (britishAreHuman){
                britishPrivate = new SkirmishHuman(this, "british_pvt_g", "private", "British");
            }else{
                britishPrivate = new SkirmishBot(this, "british_pvt_g", "private", "British");
            }

            britishPrivate.setID("british_private_" + i.toString());
            this.britishTroops.push(britishPrivate);
            privates.push(britishPrivate);

            let americanPrivate;
            if (americansAreHuman){
                americanPrivate = new SkirmishHuman(this, "usa_pvt", "private", "American");
            }else{
                americanPrivate = new SkirmishBot(this, "usa_pvt", "private", "American");
            }

            americanPrivate.setID("american_private_" + i.toString());
            this.americanTroops.push(americanPrivate);
            privates.push(americanPrivate);
        } 

        // Equip privates
        for (let privateTroop of privates){
            privateTroop.getInventory().add(new SkirmishMusket("brown_bess", {
                "player": privateTroop
            }));

            privateTroop.getInventory().add(new SkirmishSword("clever", {
                "player": privateTroop
            }));
        }

        let allTroops = appendLists(officers, privates);

        // Equip all troops
        for (let troop of allTroops){
            troop.getInventory().add(new WhiteFlag({
                "player": troop
            }));
            this.scene.addEntity(troop);
        }

        // Spawn British troops
        for (let troop of this.britishTroops){
            troop.setTileX(this.britishSpawn["x"]);
            troop.setTileY(this.britishSpawn["y"]);
        }

        // Spawn American troops
        for (let troop of this.americanTroops){
            troop.setTileX(this.americanSpawn["x"]);
            troop.setTileY(this.americanSpawn["y"]);
        }

        // Check and update team visibility
        this.checkAndUpdateTeamVisibility();
    }

    async generateTiles(){
        let scene = this.getScene();
        let size = RETRO_GAME_DATA["skirmish"]["area_size"];

        // Visual Details
        let grassDetails = {"name":"grass","file_link":"images/grass.png"};
        let rockDetails = {"name":"rock_on_grass","file_link":"images/rock_on_grass.png"};
        let waterDetails = {"name":"water","file_link":"images/water.png"};
        let brigeDetails = {"name":"bridge","file_link":"images/bridge.png"};
        let bushDetails = {"name":"bush","file_link":"images/bush.png"};
        let bigBushDetails = {"name":"thick_bush","file_link":"images/thick_bush.png"};

        // Physical Details
        let noWalkDetails = getPhysicalTileDetails("unwalkable");
        let multiCoverDetails = getPhysicalTileDetails("multi_cover");
        let singleCoverDetails = getPhysicalTileDetails("single_cover");
        let fullBlockDetails = getPhysicalTileDetails("full_block");

        // Ensure images are loaded
        await ensureImageIsLoadedFromDetails(grassDetails);
        await ensureImageIsLoadedFromDetails(rockDetails);
        await ensureImageIsLoadedFromDetails(waterDetails);
        await ensureImageIsLoadedFromDetails(brigeDetails);
        await ensureImageIsLoadedFromDetails(bushDetails);
        await ensureImageIsLoadedFromDetails(bigBushDetails);


        // Do the border

        // Left
        for (let y = -1; y <= size; y++){
            scene.placePhysicalTile(fullBlockDetails, -1, y);
        }

        // Right
        for (let y = -1; y <= size; y++){
            scene.placePhysicalTile(fullBlockDetails, size, y);
        }

        // Bottom
        for (let x = -1; x <= size; x++){
            scene.placePhysicalTile(fullBlockDetails, x, -1);
        }

        // Top
        for (let x = -1; x <= size; x++){
            scene.placePhysicalTile(fullBlockDetails, x, size);
        }

        // Fill with grass
        for (let x = 0; x < size; x++){
            for (let y = 0; y < size; y++){
                scene.placeVisualTile(grassDetails, x, y);
            }
        }

        let rockClusteres = 16;
        let minRockClusterSize = 3;
        let maxRockClusterSize = 13;
        let smallBushes = 20;
        let minBigBushSize = 8;
        let maxBigBushSize = 20;
        let bigBushes = 5;

        let seed = randomNumberInclusive(0,RETRO_GAME_DATA["skirmish"]["max_seed"]);

        let setSeed = RETRO_GAME_DATA["skirmish"]["seed"];
        let useSetSeed = setSeed != null;
        if (useSetSeed){
            seed = setSeed;
        }
        this.terrainRandom = new SeededRandomizer(seed);
        // If not otherwise set, use terrain random for ai random
        if (this.aiRandom === null){
            this.aiRandom = this.terrainRandom;
        }
        let random = this.terrainRandom;
        console.log("seed", seed)

        let placeCluster = (visualTileDetails, physicalTileDetails, x, y, clusterSize) => {
            // Note: Assume x and y are within the reasonable borders
            let tilesToCheck = [{"placed": false, "x": x, "y": y}];
            let tilesLeftToCheck = true;
            let placedCount = 0;

            while (tilesLeftToCheck && placedCount < clusterSize){
                tilesLeftToCheck = false;
                let currentTile = null;

                // Find a tile to start with
                let availableTiles = [];
                for (let tile of tilesToCheck){
                    if (!tile["placed"]){
                        availableTiles.push(tile);
                    }
                }
                // If can't find a tile then
                if (availableTiles.length == 0){ break; }
                // Pick a random tile
                currentTile = availableTiles[random.getIntInRangeInclusive(0, availableTiles.length-1)];

                // Explore tiles around current location
                let pairs = [[currentTile["x"], currentTile["y"]+1], [currentTile["x"], currentTile["y"]-1], [currentTile["x"]+1, currentTile["y"]], [currentTile["x"]-1, currentTile["y"]]];
                for (let pair of pairs){
                    let tileX = pair[0];
                    let tileY = pair[1];

                    let isWithinBorders = tileX > -1 && tileX < size && tileY > -1 && tileY < size;
                    // Disregard if not within playable area
                    if (!isWithinBorders){ continue; }

                    let alreadyExists = false;
                    
                    // Check if its already on the todo list
                    for (let tile of tilesToCheck){
                        if (tile["x"] == tileX && tile["y"] == tileY){
                            alreadyExists = true;
                            break;
                        }
                    }
                    // Found a new tile
                    if (!alreadyExists){
                        tilesLeftToCheck = true;
                        tilesToCheck.push({
                            "placed": false,
                            "x": tileX,
                            "y": tileY
                        });
                    }
                }

                // Place the tile
                currentTile["placed"] = true;
                placedCount++;
                scene.placeVisualTile(visualTileDetails, currentTile["x"], currentTile["y"]);

                // If not null -> place, else delete
                if (physicalTileDetails != null){
                    scene.placePhysicalTile(physicalTileDetails, currentTile["x"], currentTile["y"]);
                }else{
                    scene.deletePhysicalTile(currentTile["x"], currentTile["y"]);
                }

                // Extra check to see if not done
                if (!tilesLeftToCheck){
                    for (let tile of tilesToCheck){
                        if (!tile["placed"]){
                            tilesLeftToCheck = true;
                            break;
                        }
                    }
                }
            }
        }

        // Place rock clusters
        for (let i = 0; i < rockClusteres; i++){
            placeCluster(rockDetails, fullBlockDetails, random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(minRockClusterSize, maxRockClusterSize));
        }

        // Place Small Bushes
        for (let i = 0; i < smallBushes; i++){
            let x = random.getIntInRangeInclusive(0, size-1);
            let y = random.getIntInRangeInclusive(0, size-1);
            scene.placeVisualTile(bushDetails, x, y);
            scene.placePhysicalTile(singleCoverDetails, x, y);
        }

        // Place Multi Bushes
        for (let i = 0; i < bigBushes; i++){
            placeCluster(bigBushDetails, multiCoverDetails, random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(0, size-1), random.getIntInRangeInclusive(minBigBushSize, maxBigBushSize));
        }

        // Place River
        let minRiverWidth = 3;
        let maxRiverWidth = 5;
        let numRivers = 3;

        let makeRiver = (riverAngleRAD, riverStartX, riverStartY, currentWidth, riverType, minRiverWidth, maxRiverWidth) => {
            let startingTileX = Math.min(size, Math.max(0, RetroGameScene.getTileXAt(riverStartX)));
            let startingTileY = Math.min(size, Math.max(0, RetroGameScene.getTileXAt(riverStartY)));

            let range = size*RETRO_GAME_DATA["general"]["tile_size"];
            let finalOffsetX = range * Math.cos(riverAngleRAD);
            let finalOffsetY = range * Math.sin(riverAngleRAD);

            let endX = riverStartX + finalOffsetX;
            let endY = riverStartY + finalOffsetY;

            let endTileX = Math.max(0, Math.min(size, RetroGameScene.getTileXAt(endX)));
            let endTileY = Math.max(0, Math.min(size, RetroGameScene.getTileYAt(endY)));

            let tileX = RetroGameScene.getTileXAt(riverStartX);
            let tileY = RetroGameScene.getTileYAt(riverStartY);
            let widthDir = Math.abs(Math.cos(riverAngleRAD)) > Math.abs(Math.sin(riverAngleRAD)) ? "y" : "x";

            // While not at end 
            while (tileX != endTileX || tileY != endTileY){
                let distanceToEndUp = Math.sqrt(Math.pow(endTileX - tileX, 2) + Math.pow(endTileY - (tileY + 1), 2));
                let distanceToEndDown = Math.sqrt(Math.pow(endTileX - tileX, 2) + Math.pow(endTileY - (tileY - 1), 2));
                let distanceToEndLeft = Math.sqrt(Math.pow(endTileX - (tileX-1), 2) + Math.pow(endTileY - tileY, 2));
                let distanceToEndRight = Math.sqrt(Math.pow(endTileX - (tileX+1), 2) + Math.pow(endTileY - tileY, 2));

                let nextDir = "up";
                let nextDirAmount = distanceToEndUp;
                if (distanceToEndDown < nextDirAmount){
                    nextDir = "down";
                    nextDirAmount = distanceToEndDown;
                }
                if (distanceToEndLeft < nextDirAmount){
                    nextDir = "left";
                    nextDirAmount = distanceToEndLeft;
                }
                if (distanceToEndRight < nextDirAmount){
                    nextDir = "right";
                    nextDirAmount = distanceToEndRight;
                }

                let lowerWidthOffset = Math.floor(currentWidth/2);
                let upperWidthOffset = Math.floor(currentWidth/2);
                if (currentWidth % 2 == 0){
                    if (random.getIntInRangeInclusive(0,1) == 0){
                        lowerWidthOffset--;
                    }else{
                        upperWidthOffset++;
                    }
                }

                if (widthDir == "x"){
                    for (let x = tileX - lowerWidthOffset; x <= tileX + upperWidthOffset; x++){
                        if (x < 0 || x >= size){ continue; }
                        scene.placeVisualTile(waterDetails, x, tileY);
                        scene.placePhysicalTile(noWalkDetails, x, tileY);
                    }
                }else{
                    for (let y = tileY - lowerWidthOffset; y <= tileY + upperWidthOffset; y++){
                        if (y < 0 || y >= size){ continue; }
                        scene.placeVisualTile(waterDetails, tileX, y);
                        scene.placePhysicalTile(noWalkDetails, tileX, y);
                    }
                }

                // Move
                if (nextDir == "left"){
                    tileX--;
                }else if (nextDir == "right"){
                    tileX++;
                }else if (nextDir == "up"){
                    tileY++;
                }else{
                    tileY--;
                }

                currentWidth += random.getIntInRangeInclusive(-1, 1);
                currentWidth = Math.max(minRiverWidth, Math.min(maxRiverWidth, currentWidth));
                widthDir = (nextDir == "up" || nextDir == "down") ? "x" : "y";
            }
        }

        // For each river
        for (let i = 0; i < numRivers; i++){
            let riverType = random.getIntInRangeInclusive(1,4);
            let riverAngleRAD;
            let riverStartX;
            let riverStartY;
            let currentWidth = random.getIntInRangeInclusive(minRiverWidth, maxRiverWidth);
            // Bottom Left
            if (riverType == 1){
                riverAngleRAD = random.getFloatInRange(0, Math.PI/2);
                riverStartX = random.getIntInRangeInclusive(0, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = 0;
            }else if (riverType == 2){ // Top Left
                riverAngleRAD = random.getFloatInRange(2 * Math.PI * 3/4, 2 * Math.PI);
                riverStartX = random.getIntInRangeInclusive(0, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = (size-1) * RETRO_GAME_DATA["general"]["tile_size"];
            }else if (riverType == 3){ // Bottom Right
                riverAngleRAD = random.getFloatInRange(Math.PI/2, Math.PI);
                riverStartX = random.getIntInRangeInclusive(0, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2);
                riverStartY = 0;
            }else{ // Rivertype == 4 // Top Right
                riverAngleRAD = random.getFloatInRange(Math.PI, 2 * Math.PI * 3/4);
                riverStartX = (size-1) * RETRO_GAME_DATA["general"]["tile_size"];
                riverStartY = random.getIntInRangeInclusive((size-1) * RETRO_GAME_DATA["general"]["tile_size"]/2, (size-1) * RETRO_GAME_DATA["general"]["tile_size"]);
            }

            // For each x, find the y tile for the river
            makeRiver(riverAngleRAD, riverStartX, riverStartY, currentWidth, riverType, minRiverWidth, maxRiverWidth);
        }

        let spawns = [[0,0], [0,size-1], [size-1,0], [size-1,size-1]];
        // Set british spawn
        let britishSpawnNumber = random.getIntInRangeInclusive(0,3);
        let britishSpawn = spawns[britishSpawnNumber];
        
        // Move around spawns[3] and remove britishSpawnNumber
        spawns[britishSpawnNumber] = spawns[3];
        spawns.pop();

        // Set american spawn
        let americanSpawnNumber = random.getIntInRangeInclusive(0,2);
        let americanSpawn = spawns[americanSpawnNumber];
        spawns[americanSpawnNumber] = spawns[2];
        spawns.pop();

        let createPath = (coordSet1, coordSet2) => {
            let startX = coordSet1[0];
            let startY = coordSet1[1];
            let endX = coordSet2[0];
            let endY = coordSet2[1];

            let canWalk = (x, y) => {
                return !(scene.hasPhysicalTileCoveringLocation(x, y) && scene.getPhysicalTileCoveringLocation(x, y).hasAttribute("no_walk"));
            }

            let tileStorage = [{"x": startX, "y": startY, "can_walk": canWalk(startX, startY), "checked": false}];
            let hasPath = () => {
                for (let element of tileStorage){
                    if (element["x"] == endX && element["y"] == endY && element["can_walk"]){
                        return true;
                    }
                }
                return false;
            }

            let hasUnreadyUnblockedTilesToCheck = () => {
                for (let element of tileStorage){
                    let elementX = element["x"];
                    let elementY = element["y"];
                    // If element isn't ready to walk on and 
                    if (element["can_walk"] && !element["checked"]){
                        return true;
                    }
                }
                return false;
            }

            let withinBoundaries = (x,y) => {
                return x >= 0 && x < size && y >= 0 && y < size;
            } 

            let hasTile = (x,y) => {
                for (let element of tileStorage){
                    if (element["x"] == x && element["y"] == y){
                        return true;
                    }
                }
                return false;
            }

            let destroyTile = (tileObject) => {
                let tileX = tileObject["x"];
                let tileY = tileObject["y"];
                
                // Destroy the physical tile
                scene.deletePhysicalTile(tileX, tileY);

                let visualTile = scene.getVisualTileAtLocation(tileX, tileY);

                // Bridge over water, grass over anything else
                if (visualTile.getMaterialName() == "water"){
                    scene.placeVisualTile(brigeDetails, tileX, tileY);
                }else{
                    scene.placeVisualTile(grassDetails, tileX, tileY);
                }
            }

            // Loop until there is a path found
            while (!hasPath()){
                // Find all accessible tiles that are currentlyn ot blocked
                while (hasUnreadyUnblockedTilesToCheck()){
                    let tile = null; // Note: We know this exists because of while check
                    for (let element of tileStorage){
                        if (element["can_walk"] && !element["checked"]){
                            if (tile == null){
                                tile = element;
                            }else{
                                // Take the closest to end point when possible
                                let distanceToEnd = Math.sqrt(Math.pow(endX-element["x"], 2) + Math.pow(endY-element["y"], 2));
                                let distanceToEndExisting = Math.sqrt(Math.pow(endX-tile["x"], 2) + Math.pow(endY-tile["y"], 2));
                                if (distanceToEnd < distanceToEndExisting){
                                    tile = element;
                                }
                            }
                        }
                    }

                    // So we have the tile to check
                    tile["checked"] = true;
                    let tileX = tile["x"];
                    let tileY = tile["y"];
                    if (withinBoundaries(tileX+1, tileY) && !hasTile(tileX+1, tileY)){
                        tileStorage.push({"x": tileX+1, "y": tileY, "can_walk": canWalk(tileX+1, tileY), "checked": false})
                    }
                    if (withinBoundaries(tileX-1, tileY) && !hasTile(tileX-1, tileY)){
                        tileStorage.push({"x": tileX-1, "y": tileY, "can_walk": canWalk(tileX-1, tileY), "checked": false})
                    }
                    if (withinBoundaries(tileX, tileY+1) && !hasTile(tileX, tileY+1)){
                        tileStorage.push({"x": tileX, "y": tileY+1, "can_walk": canWalk(tileX, tileY+1), "checked": false})
                    }
                    if (withinBoundaries(tileX, tileY-1) && !hasTile(tileX, tileY-1)){
                        tileStorage.push({"x": tileX, "y": tileY-1, "can_walk": canWalk(tileX, tileY-1), "checked": false})
                    }
                }
                // If still haven't found a good path
                if (!hasPath()){
                    let toDestroy = null; // Note: No way we don't have a path unless there is something to be destroyed or invalid input
                    for (let element of tileStorage){
                        if (!element["can_walk"]){
                            if (toDestroy == null){
                                toDestroy = element;
                            }else{
                                // Take the closest to end point when possible
                                let distanceToEnd = Math.sqrt(Math.pow(endX-element["x"], 2) + Math.pow(endY-element["y"], 2));
                                let distanceToEndExisting = Math.sqrt(Math.pow(endX-toDestroy["x"], 2) + Math.pow(endY-toDestroy["y"], 2));
                                if (distanceToEnd < distanceToEndExisting){
                                    toDestroy = element;
                                }
                            }
                        }
                    }
                    destroyTile(toDestroy);
                    toDestroy["can_walk"] = true;
                }
            }
        }

        // Create paths
        createPath(britishSpawn, spawns[0]);
        createPath(americanSpawn, spawns[1]);
        createPath(spawns[0], spawns[1]);

        this.britishSpawn = {
            "x": britishSpawn[0],
            "y": britishSpawn[1]
        }

        this.americanSpawn = {
            "x": americanSpawn[0],
            "y": americanSpawn[1]
        }

        // Add rock hitboxes
        for (let y = 0; y < size; y++){
            for (let x = 0; x < size; x++){
                let tileAtLocation = this.scene.getVisualTileAtLocation(x, y);
                if (!(tileAtLocation.getMaterial()["name"] === "rock_on_grass")){
                    continue;
                }
                this.rockHitboxes.push(new RockHitbox(x,y));
            }
        }
    }

    getSpawnOfTeam(teamNameString){
        if (getProperAdjective(teamNameString) === "British"){
            return this.britishSpawn;
        }
        return this.americanSpawn;
    }

    getRockHitboxes(){
        return this.rockHitboxes;
    }

    display(){
        if (this.startUpLock.isLocked()){ return; }
        this.scene.display();
        this.displayRockHealthBars();
        this.stats.display();
    }

    displayRockHealthBars(){
        let lX = this.scene.getLX();
        let bY = this.scene.getBY();
        for (let rock of this.rockHitboxes){
            let displayX = this.scene.getDisplayXFromTileX(lX, rock.getTileX());
            let displayY = this.scene.getDisplayYFromTileY(bY, rock.getTileY());
            rock.display(displayX, displayY);            
        }
    }

    tick(){
        if (this.startUpLock.isLocked()){ return; }
        this.gameTick();
        if (this.cameraToTick != null){
            this.cameraToTick.tick();
        }
        this.scene.tick();
    }

    static async loadImages(){
        let folderURL = "skirmish/item/special/";
        for (let specialItemName of RETRO_GAME_DATA["skirmish"]["special_item_names"]){
            // Do not load if already exists
            if (objectHasKey(IMAGES, specialItemName)){ continue; }
            //console.log("Loading", specialItemName);
            await loadToImages(specialItemName, folderURL + specialItemName + "/");
        }
    }
}