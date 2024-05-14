/*
    Class Name: ServerConnection
    Description: An object used for handling server connections.
    TODO: Comment this class
*/
class ServerConnection {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.ip = RETRO_GAME_DATA["game_maker"]["server_ip"];
        this.port = RETRO_GAME_DATA["game_maker"]["server_port"];
        this.setup = false;
        this.socket = null;
        this.openedLock = new Lock();
        this.openedLock.lock();
        this.mailService = new MailService();
        this.mailService.addMonitor("error", (errorMessage) => {console.log(errorMessage);});
    }

    async setupConnection(){
        this.socket = new WebSocket("ws://" + this.ip + ":" + this.port);
        this.socket.addEventListener("open", (event) => {
            console.log("Connection to server opened.");
            this.setup = true;
            this.openedLock.unlock();
        });
        this.socket.addEventListener("message", (event) => {
            let data = event.data;
            if (mailService.deliver(data)){
                return;
            }
            console.error("Received unknown data:", data);
        });
        this.socket.addEventListener("error", (event) => {
            console.log("Connection to server failed.", "red", 5000);
            this.openedLock.unlock();
        });
        // Wait for connection to open (or give up after 5 seconds)
        await this.openedLock.awaitUnlock();
        // If the setup failed then return
        if (!this.setup){
            console.log("Failed to setup"); 
        }
    }

    async sendMail(jsonObject, mailBox, timeout=1000){
        return await mailService.sendJSON(mailBox, jsonObject, timeout);
    }

    sendJSON(jsonObject){
        this.send(JSON.stringify(jsonObject));
    }

    send(message){
        this.socket.send(message);
    }
}