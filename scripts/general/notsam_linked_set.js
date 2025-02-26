/*
    Class Name: NotSamLinkedSet
    Description: A doubly linked list functioning as a set
*/
class NotSamLinkedSet extends NotSamLinkedList {
        /*
        Method Name: constructor
        Method Parameters:
            array:
                An array used to initialize the data for this linked list
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(array=null){
        super(array);
    }

    /*
        Method Name: append
        Method Parameters: 
            value:
                A value
        Method Description: Adds a value to the set if it is not already present
        Method Return: void
    */
    append(value){
        if (this.has(value)){ return; }
        if (this.isEmpty()){
            this.insert(value);
        }else{
            this.end.next = new DLLNode(this.end, value);
            this.end = this.end.next;
        }
    }
}

// If using NodeJS then export the class
if (typeof window === "undefined"){
    module.exports = NotSamLinkedSet;
}