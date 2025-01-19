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
        this.ip = WTL_GAME_DATA["game_maker"]["server_ip"];
        this.port = WTL_GAME_DATA["game_maker"]["server_port"];
        this.setup = false;
        this.socket = null;
        this.openedLock = new Lock();
        this.openedLock.lock();
        this.mailService = new MailService(this);
        this.mailService.addMonitor("error", (errorMessage) => {console.log(errorMessage);});
        this.classLock = new Lock();
    }

    close(){
        if (this.socket == null){ return; }
        this.socket.close();
    }

    async setupConnection(){
        await this.classLock.awaitUnlock(true);
        this.openedLock.lock();
        
        this.setup = false;
        this.socket = new WebSocket("ws://" + this.ip + ":" + this.port);

        let safetyTimeout = setTimeout(() => { this.openedLock.unlock(); }, 1000);

        this.socket.addEventListener("open", (event) => {
            console.log("Connection to server opened.");
            this.setup = true;
            clearTimeout(safetyTimeout);
            this.openedLock.unlock();
        });
        this.socket.addEventListener("message", (event) => {
            let data = event.data;
            if (this.mailService.deliver(data)){
                return;
            }
            console.error("Received unknown data:", data);
        });
        this.socket.addEventListener("error", (event) => {
            console.log("Connection to server failed.", "red", 5000);
            clearTimeout(safetyTimeout);
            this.openedLock.unlock();
        });

        // Wait for connection to open (or give up after 5 seconds)
        await this.openedLock.awaitUnlock();
        
        // If the setup failed then return
        this.classLock.unlock();
        if (!this.setup){
            console.log("Failed to setup server connection.");
            return false; 
        }
        return true;
    }

    async testConnection(){
        await this.classLock.awaitUnlock();
        let response = await this.sendMail({"action": "ping"}, "ping");
        return response != null;
    }

    async sendMail(jsonObject, mailBox, timeout=1000){
        if (!this.setup){ return null; }
        return await this.mailService.sendJSON(mailBox, jsonObject, timeout)
    }

    async sendJSON(jsonObject){
        this.send(JSON.stringify(jsonObject));
    }

    async send(message){
        await this.classLock.awaitUnlock(true);
        await this.socket.send(message);
        this.classLock.unlock(); 
    }
}