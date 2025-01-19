class BotSharedBrain {
    constructor(gamemode, teamName){
        this.gamemode = gamemode;
        this.teamName = teamName;
        this.lastKnownLocations = {};
        this.spawnPointKnowledge = [];
        this.initializeSpawnPointKnowledge();
        this.gamemode.getEventHandler().addHandler("change_tile", (tileChangeDetailsObject) => {
            // Note: Assume troop has already moved (though visibility hasn't been updated yet :)
            let troopTeam = tileChangeDetailsObject["team"];
            let troopID = tileChangeDetailsObject["troop_id"];
            this.checkForExploredSpawnPoints(troopID, troopTeam);
        });
    }

    getGamemode(){
        return this.gamemode;
    }

    informOfShot(shooterTileX, shooterTileY){
        // If this position is visible then do nothing its fine
        let roster = this.getGamemode().getLivingTeamRosterFromName(this.getTeamName());
        for (let troop of roster){
            if (troop.couldSeeEntityIfOnTile(shooterTileX, shooterTileY)){
                return;
            }
        }
        // If this position is not visible, figure out which unknown enemy likely shot here
        let enemyData = this.getEnemyData();
        let bestEnemyObj = {"enemy_id": null, "estimated_distance": null, "status": null};
        for (let enemyIndivData of enemyData){
            if (enemyIndivData["status"] === "known"){ continue; }
            let estimatedDistance;
            if (enemyIndivData["status"] === "unknown"){
                estimatedDistance = Number.MAX_SAFE_INTEGER;
            }
            // Else last known
            else{
                estimatedDistance = calculateEuclideanDistance(shooterTileX, shooterTileY, enemyIndivData["tile_x"], enemyIndivData["tile_y"]);
            }
            // If the best candidate is further away than this one then replace it
            if (bestEnemyObj["estimated_distance"] === null || bestEnemyObj["estimated_distance"] > estimatedDistance){
                bestEnemyObj["enemy_id"] = enemyIndivData["entity_id"];
                bestEnemyObj["estimated_distance"] = estimatedDistance;
                bestEnemyObj["status"] = enemyIndivData["status"];
            }
        }
        // Note: Given that none of our troops can see the shooter tile there must be at least one "last_known" or "unknown" enemy

        // Assign this location to the most likely unknown enemy
        if (bestEnemyObj["status"] === "unknown"){
            this.lastKnownLocations[bestEnemyObj["enemy_id"]] = {"status": "last_known", "tile_x": shooterTileX, "tile_y": shooterTileY, "health": WTL_GAME_DATA["bot"]["unknown_enemy_health_assumption"]};
        }else{
            if (bestEnemyObj["enemy_id"] === null){ debugger; }
            this.lastKnownLocations[bestEnemyObj["enemy_id"]]["tile_x"] = shooterTileX;
            this.lastKnownLocations[bestEnemyObj["enemy_id"]]["tile_y"] = shooterTileY;
        }
    }

    initializeSpawnPointKnowledge(){
        let size = WTL_GAME_DATA["skirmish"]["area_size"];
        this.spawnPointKnowledge = [{"tile_x": 0, "tile_y": 0, "has_been_explored": false}, {"tile_x": 0, "tile_y": size-1, "has_been_explored": false}, {"tile_x": size-1, "tile_y": 0, "has_been_explored": false}, {"tile_x": size-1, "tile_y": size-1, "has_been_explored": false}];
        let myTeamSpawn = this.gamemode.getSpawnOfTeam(this.getTeamName());
        // Mark own spawn as explored
        for (let spawnPointObj of this.spawnPointKnowledge){
            if (myTeamSpawn["x"] === spawnPointObj["tile_x"] && myTeamSpawn["y"] === spawnPointObj["tile_y"]){
                spawnPointObj["has_been_explored"] = true;
                break;
            }
        }
    }

    checkForExploredSpawnPoints(troopID, troopTeam){
        let movingTroop = this.gamemode.getTroop(troopTeam, troopID);
        // If troop is on the wrong team
        if (movingTroop.getTeamName() != this.getTeamName()){ return; }
        
        // If I don't have unexplored spawn points
        if (!this.hasUnexploredSpawnpoints()){ return; }


        let unexploredSpawnpoints = this.getUnexploredSpawnpoints();
        for (let spawnPointObj of unexploredSpawnpoints){
            // If the moving troop can see this spawn point then mark it as explored
            if (movingTroop.couldSeeEntityIfOnTile(spawnPointObj["tile_x"], spawnPointObj["tile_y"])){
                spawnPointObj["has_been_explored"] = true;
            }
        }
    }

    getTeamName(){
        return this.teamName;
    }

    hasUnexploredSpawnpoints(){
        return this.getUnexploredSpawnpoints().length > 0;
    }

    getUnexploredSpawnpoints(){
        let unexploredSpawnpoints = [];
        for (let spawnPointObj of this.spawnPointKnowledge){
            if (!spawnPointObj["has_been_explored"]){
                unexploredSpawnpoints.push(spawnPointObj);
            }
        }
        return unexploredSpawnpoints;
    }

    getEnemyData(){
        let teamName = this.getTeamName();
        let otherTeamName = this.gamemode.getOtherTeam(teamName);
        let enemies = this.gamemode.getLivingTeamRosterFromName(otherTeamName);
        let enemyData = [];
        for (let enemy of enemies){
            let enemyID = enemy.getID();
            // If the enemy is visible
            if (this.gamemode.isVisibleToTeam(teamName, otherTeamName, enemyID)){
                enemyData.push({"entity": enemy, "entity_id": enemyID, "status": "known", "health": enemy.getHealth(), "tile_x": enemy.getTileX(), "tile_y": enemy.getTileY()});
            }
            // If the enemy has been seen before
            else if (this.hasLastKnownLocationForTroop(enemyID)){
                enemyData.push(mergeCopyObjects({"entity_id": enemyID}, this.lastKnownLocations[enemyID]));
            }
            // Else the enemy has never been seen before
            else{
                // Note: I could just provide entity and only use it for ID but I am making it careful for whatever
                enemyData.push({"entity_id": enemyID, "status": "unknown"});
            }
        }
        return enemyData;
    }

    getHealthOfEnemy(enemyID){
        let teamName = this.getTeamName();
        let otherTeamName = this.gamemode.getOtherTeam(teamName);
        // If visible return health
        if (this.gamemode.isVisibleToTeam(teamName, otherTeamName, enemyID)){
            let enemy = this.gamemode.getTroop(otherTeamName, enemyID);
            if (enemy === null || enemy == null){
                debugger;
            }
            return enemy.getHealth();
        }
        // If was seen before return last recorded heatlh
        else if (this.hasLastKnownLocationForTroop(enemyID)){
            return this.lastKnownLocations[enemyID]["health"];
        }
        // Else assume it has full health
        else{
            return WTL_GAME_DATA["bot"]["unknown_enemy_health_assumption"];
        }
    }

    troopVanishes(enemyID, health, newTileX, newTileY){
        this.lastKnownLocations[enemyID] = {"status": "last_known", "tile_x": newTileX, "tile_y": newTileY, "health": health};
    }

    hasLastKnownLocationForTroop(enemyID){
        return objectHasKey(this.lastKnownLocations, enemyID);
    }

    getScene(){
        return this.gamemode.getScene();
    }

    getEnemyConfidence(enemyID){
        let teamName = this.getTeamName();
        let otherTeamName = this.gamemode.getOtherTeam(teamName);
        let enemies = this.gamemode.getLivingTeamRosterFromName(otherTeamName);
        
        let tileInSingleCover = (tileX, tileY) => {
            return this.getScene().tileAtLocationHasAttribute(tileX, tileY, "single_cover");
        }

        let tileInMultiCover = (tileX, tileY) => {
            return this.getScene().tileAtLocationHasAttribute(tileX, tileY, "multi_cover");
        }

        let countSizeOfMultiCover = (tileX, tileY) => {
            return this.getScene().calculateMultiCoverSize(tileX, tileY);
        }
        
        // If its visible then 100% confidence
        if (this.gamemode.isVisibleToTeam(teamName, otherTeamName, enemyID)){
            return 1;
        }

        // If it has a last known location
        else if (this.hasLastKnownLocationForTroop(enemyID)){
            let tileX = this.lastKnownLocations[enemyID]["tile_x"];
            let tileY = this.lastKnownLocations[enemyID]["tile_y"];
            // If it's a single bush
            if (tileInSingleCover(tileX, tileY)){
                return 1;
            }
            // Else if its a multi-bush
            else if (tileInMultiCover(tileX, tileY)){
                return 1 / countSizeOfMultiCover(tileX, tileY);
            }
            // Else its not a bush
            return WTL_GAME_DATA["bot"]["unknown_enemy_position_confidence"];
        }else{
            return WTL_GAME_DATA["bot"]["unknown_enemy_position_confidence"];
        }
    }
}