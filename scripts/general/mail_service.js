// TODO: File needs comments
/*
    Note: This class will have persisent mailboxes with custom ids to properly return mail to what its asked
    for example
    await mailbox["heartbeat"]
    etc. smh I'm dying
*/
class MailService {
    constructor(serverConnection){
        this.serverConnection = serverConnection;
        this.mailboxes = new NotSamLinkedList();
    }

    hasMailbox(mailboxName){
        return this.getMailbox(mailboxName) != null;
    }

    getMailbox(mailboxName){
        for (let [mailbox, mailboxIndex] of this.mailboxes){
            if (mailbox.getName() == mailboxName){
                return mailbox;
            }
        }
        return null;
    }

    // TODO: Add awaiting mail (without sending anything) like for errors

    async sendJSON(mailboxName, messageJSON, timeout=1000){
        if (!this.hasMailbox(mailboxName)){
            this.mailboxes.add(new Mailbox(mailboxName));
        }
        let mailbox = this.getMailbox(mailboxName);
        return await mailbox.sendJSON(this.serverConnection, messageJSON, timeout);
    }

    deliver(message){
        let messageJSON = JSON.parse(message);
        if (objectHasKey(messageJSON, "mail_box")){
            this.getMailbox(messageJSON["mail_box"]).deliver(message);
            return true;
        }
        return false;
    }

    addMonitor(mailboxName, callback){
        if (!this.hasMailbox(mailboxName)){
            this.mailboxes.add(new Mailbox(mailboxName));
        }
        new MailMonitor(this.getMailbox(mailboxName), callback);
    }
}

class Mailbox {
    constructor(mailboxName){
        this.mailboxName = mailboxName;
        this.awaiting = false;
        this.responder = null;
    }

    async sendJSON(serverConnection, messageJSON, timeout=1000){
        if (this.awaiting){
            throw new Error("Mail sent with return address before previous response has returned: " + this.getName());
        }
        this.awaiting = true;
        messageJSON["mail_box"] = this.getName();
        return await MessageResponse.sendAndReceiveJSON(serverConnection, this, messageJSON, timeout);
    }

    addResponder(responder){
        this.responder = responder;
    }

    deliver(message){
        if (!this.awaiting){
            return; // No error because it is expected behavior when a timeout exists
            // throw new Error("Mail delivered with nobody awaiting.");
        }
        this.responder.complete(message);
        this.awaiting = false;
    }

    getName(){
        return this.mailboxName;
    }

    // Used so that you don't run into issue endlessly awaiting say refresh and you send another then get still awaiting cannot send. Instead with thise method you will get nobody is awaiting if the refresh is actually answered at some time 
    stopAwaiting(){
        this.awaiting = false;
    }

    setAwaiting(shouldBeAwaiting){
        this.awaiting = shouldBeAwaiting;
    }
}

class MessageResponse {
    constructor(mailbox, timeout){
        this.result = null;
        this.completedLock = new Lock();
        this.completedLock.lock();
        this.mailbox = mailbox;
        mailbox.addResponder(this);
        this.timeout = setTimeout(() => { /*console.log(timeout, "has passed...", Date.now()); */this.complete(); }, timeout)
    }

    complete(result=null){
        // If this is a timeout then tell the mailbox to give up waiting for a response to the previous message
        if (result == null){
            this.mailbox.stopAwaiting();
        }else{
            clearTimeout(this.timeout);
        }
        // If already completed return
        if (this.completedLock.isReady()){ return; }
        this.result = result;
        this.completedLock.unlock();
    }

    async awaitResponse(){
        // Wait for the lock to no longer be completed
        await this.completedLock.awaitUnlock();
        return this.result;
    }

    static async sendAndReceiveJSON(serverConnection, mailBox, messageJSON, timeout){
        return JSON.parse(await MessageResponse.sendAndReceive(serverConnection, mailBox, JSON.stringify(messageJSON), timeout));
    }

    static async sendAndReceive(serverConnection, mailBox, message, timeout){
        serverConnection.send(message);
        let messageResponse = new MessageResponse(mailBox, timeout);
        let response = await messageResponse.awaitResponse();
        return response;
    }
}

class MailMonitor {
    constructor(mailbox, callback){
        this.mailbox = mailbox;
        this.mailbox.setAwaiting(true);
        this.callback = callback;
        mailbox.addResponder(this);
    }

    complete(result){
        this.callback(result);
    }
}