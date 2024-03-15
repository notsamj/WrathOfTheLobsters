// If using NodeJS then do imports
if (typeof window === "undefined"){
    NotSamLinkedList = require("./notsam_linked_list.js");
}

/*
    Class Name: Lock
    Description: A lock that provides information on its state
*/
class Lock {
    /*
        Method Name: constructor
        Method Parameters:
            ready:
                Whether or not the lock starts out unlocked
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(ready=true){
        this.ready = ready;
        this.promiseUnlock = new NotSamLinkedList();
    }

    /*
        Method Name: isReady
        Method Parameters: None
        Method Description: Provide information whether the lock is ready (unlocked)
        Method Return: Boolean
    */
    isReady(){
        return this.ready;
    }

    /*
        Method Name: notReady
        Method Parameters: None
        Method Description: Provide information whether the lock not is ready (locked)
        Method Return: Boolean
    */
    notReady(){
        return !this.isReady();
    }

    // TODO: Comments
    notLocked(){
        return this.isReady();
    }

    // TODO: Comments
    isLocked(){
        return !this.isReady();
    }

    // TODO: Comments
    isOpen(){
        return this.isReady();
    }

    isUnlocked(){
        return this.isReady();
    }

    /*
        Method Name: lock
        Method Parameters: None
        Method Description: Lock the lock
        Method Return: void
    */
    lock(){
        this.ready = false;
    }

    /*
        Method Name: unlock
        Method Parameters: None
        Method Description: Unlock the lock and handle those awaiting the unlock
        Method Return: void
    */
    unlock(){
        this.ready = true;
        // Do the promised unlock
        if (this.promiseUnlock.getLength() > 0){
            let awaitingObject = this.promiseUnlock.get(0);
            let awaitingResolve = awaitingObject["resolve"];
            let relock = awaitingObject["relock"];
            this.ready = !relock;
            this.promiseUnlock.remove(0);
            awaitingResolve();
        }
    }

    /*
        Method Name: awaitUnlock
        Method Parameters: 
            relock:
                Lock as soon as unlocked to prevent sync issues
        Method Description: Provide a promise to await that will resolve when the lock is unlocked
        Method Return: Promise
    */
    awaitUnlock(relock=false){
        if (this.ready){ return; }
        let instance = this;
        return new Promise((resolve, reject) => {
            instance.promiseUnlock.append({"resolve": resolve, "relock": relock});
        });
    }
}

// If using NodeJS then export the lock class
if (typeof window === "undefined"){
    module.exports = Lock;
}