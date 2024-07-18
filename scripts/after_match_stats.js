// When this is opened in NodeJS, import the required files
if (typeof window === "undefined"){
    helperFunctions = require("../general/helper_functions.js");
    objectHasKey = helperFunctions.objectHasKey;
}
/*
    Class Name: AfterMatchStats
    Description: Records the events taking place in a Fight for later review
*/
class AfterMatchStats {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.reset();
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Initializes an instance of AfterMatchStats
        Method Return: void
    */
    reset(){
        this.winner = "None";
        this.kills = [];
        this.britishText = null;
        this.americanText = null;
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
        return AfterMatchStats.getTeamColour(getProperAdjective(this.winner));
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
            if (getProperAdjective(RETRO_GAME_DATA["character_class_to_team"][kill["victim_class"]]) != getProperAdjective(team)){
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
        let winnerText = "Winner: " + this.winner;
        // Make winner text
        Menu.makeText(winnerText, this.getWinnerColour(), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight() * 0.9), Math.floor(getScreenWidth()*0.70), Math.floor(getScreenHeight()/4), "center", "hanging");
        Menu.makeText(this.britishText, AfterMatchStats.getTeamColour(getProperAdjective("British")), 0, Math.floor(getScreenHeight()*2/3), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight()*2/3), "left", "middle");
        Menu.makeText(this.americanText, AfterMatchStats.getTeamColour(getProperAdjective("Americans")), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight()*2/3), Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight()*2/3), "left", "middle");
    }

    /*
        Method Name: getTeamColour
        Method Parameters:
            team:
                String representing the name of an alliance
        Method Description: Determines string the colour assigned to a given alliance
        Method Return: String
    */
    static getTeamColour(team){
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
                A Json representation of an aftermatchstats instance
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
    module.exports = AfterMatchStats;
}