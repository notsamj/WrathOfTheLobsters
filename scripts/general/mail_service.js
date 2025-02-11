/*
    Class Name: MailService
    Class Description: A virtual mail service
    Class Note: This class will have persisent mailboxes with custom ids to properly return mail to what its asked
*/
class MailService {
    /*
        Method Name: constructor
        Method Parameters: 
            serverConnection:
                A server connection instance
        Method Description: constructor
        Method Return: constructor
    */
    constructor(serverConnection){
        this.serverConnection = serverConnection;
        this.mailboxes = new NotSamLinkedList();
    }

    /*
        Method Name: hasMailbox
        Method Parameters: 
            mailboxName:
                The name of a mailbox. String.
        Method Description: Check if a mailbox exists
        Method Return: boolean
    */
    hasMailbox(mailboxName){
        return this.getMailbox(mailboxName) != null;
    }

    /*
        Method Name: getMailbox
        Method Parameters: 
            mailboxName:
                The name of a mailbox. String.
        Method Description: Finds a mailbox
        Method Return: Mailbox or null
    */
    getMailbox(mailboxName){
        for (let [mailbox, mailboxIndex] of this.mailboxes){
            if (mailbox.getName() == mailboxName){
                return mailbox;
            }
        }
        return null;
    }

    /*
        Method Name: sendJSON
        Method Parameters: 
            mailboxName:
                The name of a mailbox. String.
            messageJSON:
                A message details JSON
            timeout:
                The timeout when sending
        Method Description: Sends a JSON
        Method Return: Promise with response JSON
    */
    async sendJSON(mailboxName, messageJSON, timeout=1000){
        if (!this.hasMailbox(mailboxName)){
            this.mailboxes.add(new Mailbox(mailboxName));
        }
        let mailbox = this.getMailbox(mailboxName);
        return await mailbox.sendJSON(this.serverConnection, messageJSON, timeout);
    }

    /*
        Method Name: deliver
        Method Parameters: 
            message:
                A string to deliver
        Method Description: Delivers message
        Method Return: boolean, true -> delivered, false -> can't deliver
    */
    deliver(message){
        let messageJSON = JSON.parse(message);
        if (objectHasKey(messageJSON, "mail_box")){
            this.getMailbox(messageJSON["mail_box"]).deliver(message);
            return true;
        }
        return false;
    }

    /*
        Method Name: addMonitor
        Method Parameters: 
            mailboxName:
                The name of a mailbox. String.
            callback:
                Callback when message is received
        Method Description: Adds a monitor
        Method Return: void
    */
    addMonitor(mailboxName, callback){
        if (!this.hasMailbox(mailboxName)){
            this.mailboxes.add(new Mailbox(mailboxName));
        }
        new MailMonitor(this.getMailbox(mailboxName), callback);
    }
}

/*
    Class Name: Mailbox
    Class Description: A mailbox
*/
class Mailbox {
    /*
        Method Name: constructor
        Method Parameters: 
            mailboxName:
                The name of a mailbox. String.
        Method Description: constructor
        Method Return: constructor
    */
    constructor(mailboxName){
        this.mailboxName = mailboxName;
        this.awaiting = false;
        this.responder = null;
    }

    /*
        Method Name: sendJSON
        Method Parameters: 
            mailboxName:
                The name of a mailbox. String.
            messageJSON:
                A message details JSON
            timeout:
                The timeout when sending
        Method Description: Sends a JSON
        Method Return: Promise with response JSON
    */
    async sendJSON(serverConnection, messageJSON, timeout=1000){
        if (this.awaiting){
            throw new Error("Mail sent with return address before previous response has returned: " + this.getName());
        }
        this.awaiting = true;
        messageJSON["mail_box"] = this.getName();
        return await MessageResponse.sendAndReceiveJSON(serverConnection, this, messageJSON, timeout);
    }

    /*
        Method Name: addResponder
        Method Parameters: 
            responder:
                A responder class
        Method Description: Saves a responder
        Method Return: void
    */
    addResponder(responder){
        this.responder = responder;
    }

    /*
        Method Name: deliver
        Method Parameters: 
            message:
                A message to deliver
        Method Description: Delivers a message to a responder
        Method Return: void
    */
    deliver(message){
        if (!this.awaiting){
            return; // No error because it is expected behavior when a timeout exists
            // throw new Error("Mail delivered with nobody awaiting.");
        }
        this.responder.complete(message);
        this.awaiting = false;
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getName(){
        return this.mailboxName;
    }

    /*
        Method Name: stopAwaiting
        Method Parameters: None
        Method Description: Stops awaiting
        Method Return: void
        Method Note: Used so that you don't run into issue endlessly awaiting say refresh and you send another then get still awaiting cannot send. Instead with thise method you will get nobody is awaiting if the refresh is actually answered at some time 
    */
    stopAwaiting(){
        this.awaiting = false;
    }

    /*
        Method Name: setAwaiting
        Method Parameters: 
            shouldBeAwaiting:
                A boolean
        Method Description: Sets the awaiting state
        Method Return: void
    */
    setAwaiting(shouldBeAwaiting){
        this.awaiting = shouldBeAwaiting;
    }
}

/*
    Class Name: MessageResponse
    Class Description: A message responce
*/
class MessageResponse {
    /*
        Method Name: constructor
        Method Parameters: 
            mailbox:
                A mailbox
            timeout:
                A timeout (ms)
        Method Description: constructor
        Method Return: constructor
    */
    constructor(mailbox, timeout){
        this.result = null;
        this.completedLock = new Lock();
        this.completedLock.lock();
        this.mailbox = mailbox;
        mailbox.addResponder(this);
        this.timeout = setTimeout(() => { /*console.log(timeout, "has passed...", Date.now()); */this.complete(); }, timeout)
    }

    /*
        Method Name: complete
        Method Parameters: 
            result:
                The result received
        Method Description: Completes a mail response
        Method Return: void
    */
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

    /*
        Method Name: awaitResponse
        Method Parameters: None
        Method Description: Awaits a response
        Method Return: Promise (implicit)
    */
    async awaitResponse(){
        // Wait for the lock to no longer be completed
        await this.completedLock.awaitUnlock();
        return this.result;
    }

    /*
        Method Name: sendAndReceiveJSON
        Method Parameters: 
            serverConnection:
                A server connection
            mailbox:
                A mailbox
            messageJSON:
                A message details JSON
            timeout:
                The timeout when sending
        Method Description: Sends a json and gets a result
        Method Return: Promise JSON
    */
    static async sendAndReceiveJSON(serverConnection, mailBox, messageJSON, timeout){
        return JSON.parse(await MessageResponse.sendAndReceive(serverConnection, mailBox, JSON.stringify(messageJSON), timeout));
    }

    /*
        Method Name: sendAndReceive
        Method Parameters: 
            serverConnection:
                A server connection
            mailbox:
                A mailbox
            messageJSON:
                A message details JSON
            timeout:
                The timeout when sending
        Method Description: Sends a message and gets a result
        Method Return: Promise and response
    */
    static async sendAndReceive(serverConnection, mailBox, message, timeout){
        serverConnection.send(message);
        let messageResponse = new MessageResponse(mailBox, timeout);
        let response = await messageResponse.awaitResponse();
        return response;
    }
}

/*
    Class Name: MailMonitor
    Class Description: A mail monitor
*/
class MailMonitor {
    /*
        Method Name: constructor
        Method Parameters: 
            mailBox:
                A mailbox
            callback:
                A callback for the mail monitor
        Method Description: constructor
        Method Return: constructor
    */
    constructor(mailBox, callback){
        this.mailBox = mailBox;
        this.mailBox.setAwaiting(true);
        this.callback = callback;
        mailbox.addResponder(this);
    }

    /*
        Method Name: complete
        Method Parameters: 
            result:
                The result from mail
        Method Description: Completes a mail monitor
        Method Return: void
    */
    complete(result){
        this.callback(result);
    }
}