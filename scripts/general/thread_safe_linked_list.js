class ThreadSafeLinkedList extends NotSamLinkedList {
    /*
        Method Name: constructor
        Method Parameters: 
            providedList:
                A list to load from
        Method Description: constructor
        Method Return: constructor
    */
    constructor(providedList=null){
        super();
        this.accessLock = new Lock();
    }

    /*
        Method Name: getAccess
        Method Parameters: None
        Method Description: Awaits access to be granted
        Method Return: Promise (implicit)
    */
    async getAccess(){
        return this.accessLock.awaitUnlock(true);
    }

    /*
        Method Name: relinquishAccess
        Method Parameters: None
        Method Description: Removes access
        Method Return: void
    */
    relinquishAccess(){
        this.accessLock.unlock();
    }
}