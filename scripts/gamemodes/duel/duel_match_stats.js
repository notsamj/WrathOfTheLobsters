/*
    Class Name: DuelMatchStats
    Description: Records the events taking place in a duel for later review
*/
class DuelMatchStats {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.winner = "None";
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
        Method Name: display
        Method Parameters: None
        Method Description: Displays the results of the match (number of kills by team) on the canvas
        Method Return: void
    */
    display(){
        if (this.winner === "None"){ return; }
        
        // Display winner information
        let winnerText = "Winner: " + this.winner;
        // Make winner text
        let winnerColour = Colour.fromCode(WTL_GAME_DATA["duel"]["theme_colour"]);
        Menu.makeText(winnerText, winnerColour, Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight() * 0.9), Math.floor(getScreenWidth()*0.70), Math.floor(getScreenHeight()/4), "center", "hanging");
    }
}

// If using NodeJS then export the lock class
if (typeof window === "undefined"){
    module.exports = DuelMatchStats;
}