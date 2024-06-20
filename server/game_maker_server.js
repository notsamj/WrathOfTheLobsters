// TODO: File needs comments
const fs = require("fs");
const WebSocketServer = require("ws").WebSocketServer;
const NotSamLinkedList = require("../scripts/general/notsam_linked_list.js");
const Lock = require("../scripts/general/lock.js");
const RETRO_GAME_DATA = require("../data/data_json.js");
class Server {
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

class Client {
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

    handleMessage(dataString){
        let dataJSON = JSON.parse(dataString);
        let action = dataJSON["action"];

        // Check for ping
        if (action == "ping"){
            this.sendJSON({"success": true, "mail_box": dataJSON["mail_box"]});
            return;
        }

        // At this point it must have something to do with files
        let fileName = dataJSON["file_name"];
        let path = "data/" + fileName;
        if (action == "load"){
            if (!fs.existsSync(path)){
                this.sendJSON({"success": false, "mail_box": dataJSON["mail_box"], "reason": "File not found."});
                return;
            }
            this.sendJSON({"success": true, "mail_box": dataJSON["mail_box"], "data": fs.readFileSync(path, {"encoding": "utf8", "flag": "r"})});
        }else if (action == "save"){
            fs.writeFileSync(path, JSON.stringify(dataJSON["data"]));
            console.log("Saving", path)
            this.sendJSON({"success": true, "mail_box": dataJSON["mail_box"]});
        }else{
            console.log("Unknown action:", action);
            this.sendJSON({"success": false, "reason": "Unknown action.", "mail_box": dataJSON["mail_box"]});
        }
    }

    sendJSON(messageJSON){
        this.send(JSON.stringify(messageJSON));
    }

    send(message){
        this.ws.send(message);
    }
}

// Start Up
const SERVER = new Server(RETRO_GAME_DATA["game_maker"]["server_port"]);