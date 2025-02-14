const fs = require("fs");
const WebSocketServer = require("ws").WebSocketServer;
const NotSamLinkedList = require("../scripts/general/notsam_linked_list.js");
const Lock = require("../scripts/general/lock.js");
const WTL_GAME_DATA = require("../data/data_json.js");
/*
    Class Name: Server
    Class Description: A WS server
*/
class Server {
    /*
        Method Name: constructor
        Method Parameters: 
            port:
                Server port. int
        Method Description: constructor
        Method Return: constructor
    */
    constructor(port){
        this.server = new WebSocketServer({ "port": port })
        this.port = port;
        this.clients = new NotSamLinkedList();
        this.clientLock = new Lock();
        console.log("Server on and listening to port: %d", port);
        // TODO: Change this to something else with authentication
        this.server.on("connection", async (ws) => {
            await this.clientLock.awaitUnlock(true);
            this.clients.add(new Client(ws));
            this.clientLock.unlock();
        });
    }
}

/*
    Class Name: Client
    Class Description: A WS client
*/
class Client {
    /*
        Method Name: constructor
        Method Parameters: 
            ws:
                A websocket
        Method Description: constructor
        Method Return: constructor
    */
    constructor(ws){
        this.ws = ws;
        console.log("Somebody is attempting to communicate.");
        this.ws.on("message", (dataString) => {
            this.handleMessage(dataString);
        });
        this.ws.on("error", () => {
            console.log("A client has disconnected from the server.");
        });
    }

    /*
        Method Name: handleMessage
        Method Parameters:
            dataString:
                A string of data
        Method Description: Handles a message
        Method Return: void
    */
    handleMessage(dataString){
        let dataJSON = JSON.parse(dataString);
        let action = dataJSON["action"];

        // Check for ping
        if (action === "ping"){
            this.sendJSON({"success": true, "mail_box": dataJSON["mail_box"]});
            return;
        }

        //console.log("Received", dataJSON)
        // At this point it must have something to do with files
        let fileName = dataJSON["file_name"];
        let path = "data/" + fileName;
        if (action === "load"){
            if (!fs.existsSync(path)){
                this.sendJSON({"success": false, "mail_box": dataJSON["mail_box"], "reason": "File not found."});
                return;
            }
            this.sendJSON({"success": true, "mail_box": dataJSON["mail_box"], "data": fs.readFileSync(path, {"encoding": "utf8", "flag": "r"})});
        }else if (action === "save"){
            //console.log("Received", dataJSON, path)
            fs.writeFileSync(path, JSON.stringify(dataJSON["data"]));
            console.log("Saving", path)
            this.sendJSON({"success": true, "mail_box": dataJSON["mail_box"]});
        }else{
            console.log("Unknown action:", action);
            this.sendJSON({"success": false, "reason": "Unknown action.", "mail_box": dataJSON["mail_box"]});
        }
    }

    /*
        Method Name: sendJSON
        Method Parameters:
            messageJSON:
                A json to send
        Method Description: Sends json
        Method Return: void
    */
    sendJSON(messageJSON){
        this.send(JSON.stringify(messageJSON));
    }

    /*
        Method Name: send
        Method Parameters:
            message:
                A string to send
        Method Description: Sends a string
        Method Return: void
    */
    send(message){
        this.ws.send(message);
    }
}

// Start Up
const SERVER = new Server(WTL_GAME_DATA["game_maker"]["server_port"]);