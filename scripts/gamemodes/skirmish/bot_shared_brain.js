class BotSharedBrain {
    constructor(gamemode, teamName){
        this.gamemode = gamemode;
        this.teamName = teamName;
        this.lastKnownLocations = {};
    }

    getTeamName(){
        return this.teamName;
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
                enemyData.push({"entity": enemy, "status": "known", "health": enemy.getHealth(), "tile_x": enemy.getTileX(), "tile_y": enemy.getTileY()});
            }
            // If the enemy has been seen before
            else if (this.hasLastKnownLocationForTroop(enemyID)){
                this.lastKnownLocations[enemyID]["entity"] = enemy;
                enemyData.push(this.lastKnownLocations[enemyID]);
            }
            // Else the enemy has never been seen before
            else{
                enemyData.push({"status": "unknown"});
            }
        }
        return enemyData;
    }

    getHealthOfEnemy(enemyID){
        let teamName = this.getTeamName();
        let otherTeamName = this.gamemode.getOtherTeam(teamName);
        // If visible return health
        if (this.gamemode.isVisibleToTeam(teamName, otherTeamName, enemyID)){
            let enemy = this.gamemode.getTroop();
            return enemy.getHealth();
        }
        // If was seen before return last recorded heatlh
        else if (this.hasLastKnownLocationForTroop(enemyID)){
            return this.lastKnownLocations[enemyID]["health"];
        }
        // Else assume it has full health
        else{
            return 1;
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
            return RETRO_GAME_DATA["bot"]["unknown_enemy_position_confidence"];
        }else{
            return RETRO_GAME_DATA["bot"]["unknown_enemy_position_confidence"];
        }
    }
}