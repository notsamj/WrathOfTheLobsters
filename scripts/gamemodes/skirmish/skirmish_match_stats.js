// When this is opened in NodeJS, import the required files
if (typeof window === "undefined"){
    helperFunctions = require("../general/helper_functions.js");
    objectHasKey = helperFunctions.objectHasKey;
}
/*
    Class Name: SkirmishMatchStats
    Description: Records the events taking place in a Fight for later review
*/
class SkirmishMatchStats {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.reset();
        this.maxKillRowsToDisplay = RETRO_GAME_DATA["match_stats"]["max_rows_of_kills_to_display"];
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Initializes an instance of SkirmishMatchStats
        Method Return: void
    */
    reset(){
        this.winner = "None";
        this.kills = [];
        this.britishText = null;
        this.americanText = null;
        this.killFeedOffset = 0;
        this.killFeedOffsetLock = new Lock();
    }

    /*
        Method Name: addKill
        Method Parameters:
            TODO
            killerClass:
                A string representing the class of the killer
        Method Description: Updates the number of kills of the given killer type
        Method Return: void
    */
    addKill(victimClass, killerClass){
        this.kills.push({
            "victim_class": victimClass,
            "killer_class": killerClass
        });
    }

    /*
        Method Name: getWinnerColour
        Method Parameters: None
        Method Description: Determines the colour of the winning team
        Method Return: String
    */
    getWinnerColour(){
        return SkirmishMatchStats.getTeamNameColour(getProperAdjective(this.winner));
    }

    /*
        Method Name: setWinner
        Method Parameters:
            winner:
                A string with the name of the winning alliance
        Method Description: Sets the winner variable to the given winning team
        Method Return: void
    */
    setWinner(winner){
        this.winner = winner;
        this.britishText = this.makeTeamText("British");
        this.americanText = this.makeTeamText("Americans");
    }

    /*
        Method Name: getWinner
        Method Parameters: None
        Method Description: Getter
        Method Return: String  
    */
    getWinner(){
        return this.winner;
    }

    /*
        Method Name: makeTeamText
        Method Parameters:
            team:
                A string with the name of an alliance
        Method Description: Creates a string representing information about the number of kills achieved by an alliance
        Method Return: String
    */
    makeTeamText(team){
        let text = team + " Total Kills:";
        let ranking = [];

        // Create class kill counts
        let classKillCounts = {};
        for (let kill of this.kills){
            // If victim on team B then its a kill for team A. This helps with cases like friendly-fire
            if (getProperAdjective(RETRO_GAME_DATA["character_class_to_team_name"][kill["victim_class"]]) != getProperAdjective(team)){
                let killerClass = kill["killer_class"];
                if (!objectHasKey(classKillCounts, killerClass)){
                    classKillCounts[killerClass] = 1;
                }else{
                    classKillCounts[killerClass] += 1;
                }
            }
        }

        // Find kills on this team
        for (let killerClass of Object.keys(classKillCounts)){
            ranking.push({"name": killerClass, "kills": classKillCounts[killerClass]});
        }

        // Sort high to low
        ranking.sort((e1, e2) => {
            return e2["kills"] - e1["kills"];
        });

        // Add ranking to text
        for (let nameKillsPair of ranking){
            text += "\n" + nameKillsPair["name"] + ": " + nameKillsPair["kills"]; 
        }
        return text;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the results of the match (number of kills by team) on the canvas
        Method Return: void
    */
    display(){
        this.tick();

        // Display kill feed
        this.displayKillFeed();
        if (this.winner === "None"){ return; }
        
        // Display winner information
        let winnerText = "Winner: " + this.winner;
        // Make winner text
        Menu.makeText(winnerText, this.getWinnerColour(), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight() * 0.9), Math.floor(getScreenWidth()*0.70), Math.floor(getScreenHeight()/4), "center", "hanging");
        Menu.makeText(this.britishText, SkirmishMatchStats.getTeamNameColour(getProperAdjective("British")), 0, Math.floor(getScreenHeight()*2/3), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight()*2/3), "left", "middle");
        Menu.makeText(this.americanText, SkirmishMatchStats.getTeamNameColour(getProperAdjective("Americans")), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight()*2/3), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight()*2/3), "left", "middle");
    }

    displayKillFeed(){
        let lastToDisplayIndex = this.kills.length - 1 - this.killFeedOffset;
        let firstToDisplayIndex = Math.max(0, lastToDisplayIndex - this.maxKillRowsToDisplay);
        let textSize = RETRO_GAME_DATA["match_stats"]["text_size"];
        updateFontSize(textSize);

        let startY = 0;
        let rightX = getScreenWidth();
        let killTextColour = Colour.fromCode(RETRO_GAME_DATA["match_stats"]["kill_text_colour"]);
        let killText = " killed ";
        for (let i = firstToDisplayIndex; i <= lastToDisplayIndex; i++){
            let currentY = startY + (i - firstToDisplayIndex) * textSize;
            let killerClass = this.kills[i]["killer_class"];
            let victimClass = this.kills[i]["victim_class"];
            //console.log(RETRO_GAME_DATA["character_class_to_team_name"][killerClass], RETRO_GAME_DATA["character_class_to_team_name"][victimClass])
            let killerTeam = getProperAdjective(RETRO_GAME_DATA["character_class_to_team_name"][killerClass]);
            let victimTeam = getProperAdjective(RETRO_GAME_DATA["character_class_to_team_name"][victimClass]);
            let killerTeamColour = Colour.fromCode(SkirmishMatchStats.getTeamNameColour(killerTeam));
            let victimTeamColour = Colour.fromCode(SkirmishMatchStats.getTeamNameColour(victimTeam));
            let victimTextLength = Math.ceil(measureTextWidth(victimClass));
            let killerTextLength = Math.ceil(measureTextWidth(killerClass));
            let killTextLength = Math.ceil(measureTextWidth(killText));
            makeTextExplicit(killerClass, textSize, killerTeamColour, rightX - victimTextLength - killTextLength - killerTextLength, currentY, "left", "top");
            makeTextExplicit(killText, textSize, killTextColour, rightX - victimTextLength - killTextLength, currentY, "left", "top");
            makeTextExplicit(victimClass, textSize, victimTeamColour, rightX - victimTextLength, currentY, "left", "top");
        }
    }

    tick(){
        let newKillFeedOffset = this.killFeedOffset;
        let up = USER_INPUT_MANAGER.isActivated("kill_feed_up");
        let down = USER_INPUT_MANAGER.isActivated("kill_feed_down");
        // If both / neither button are pressed then do nothing
        if ((up && down) || (!up && !down)){
            this.killFeedOffsetLock.unlock();
            return;
        }
        if (this.killFeedOffsetLock.isLocked()){
            return;
        }
        this.killFeedOffsetLock.lock();
        if (up){
            newKillFeedOffset += 1;
        }else if (down){
            newKillFeedOffset -= 1;
        }

        // Don't allow < 0
        if (newKillFeedOffset < 0){
            return;
        }

        // Must be in range [0, this.kills.length - this.maxKillRowsToDisplay]
        newKillFeedOffset = Math.min(newKillFeedOffset, Math.max(0, this.kills.length - this.maxKillRowsToDisplay));
        this.killFeedOffset = newKillFeedOffset;
    }

    /*
        Method Name: getTeamNameColour
        Method Parameters:
            team:
                String representing the name of an alliance
        Method Description: Determines string the colour assigned to a given alliance
        Method Return: String
    */
    static getTeamNameColour(team){
        return RETRO_GAME_DATA["team_to_colour"][team];
    }

    /*
        Method Name: toJSON
        Method Parameters: None
        Method Description: Create a JSON representation of the current stats
        Method Return: JSON Object
    */
    toJSON(){
        return {
            "winner": this.winner,
            "kills": kills
        }
    }

    /*
        Method Name: fromJSON
        Method Parameters:
            statsObject:
                A Json representation of an SkirmishMatchStats instance
        Method Description: Load instance details from a JSON object
        Method Return: void
    */
    fromJSON(statsObject){
        this.winner = statsObject["winner"];
        this.kills = statsObject["kills"];
        if (this.winner != null){
            this.britishText = this.makeTeamText("British");
            this.americanText = this.makeTeamText("Americans");
        }
    }
}

// If using NodeJS then export the lock class
if (typeof window === "undefined"){
    module.exports = SkirmishMatchStats;
}