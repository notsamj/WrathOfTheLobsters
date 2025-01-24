class ThreadSafeLinkedList extends NotSamLinkedList {
    constructor(providedList=null){
        super();
        this.accessLock = new Lock();
    }

    async getAccess(){
        return this.accessLock.awaitUnlock(true);
    }

    relinquishAccess(){
        this.accessLock.unlock();
    }
}