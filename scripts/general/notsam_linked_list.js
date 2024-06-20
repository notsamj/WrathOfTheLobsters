/*
    Class Name: NotSamLinkedList
    Description: An implementation of the Doubly LinkedList pattern.
    Note:
    Copy of NotSamSinglyLinkedList but made doubly.
    Also I haven't made a doubly linked list in many many years so this may have many errors because I haven't tested it :)
*/
class NotSamLinkedList{
        /*
        Method Name: constructor
        Method Parameters:
            array:
                An array used to initialize the data for this linked list
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(array=null){
        this.head = null;
        this.end = null;
        if (array != null){
            this.convertFromArray(array);
        }
    }

    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Empties the list
        Method Return: void
    */
    clear(){
        this.head = null;
        this.end = null;
    }

    /*
        Method Name: convert_from_array
        Method Parameters:
            array:
                An array used to initialize the data for this list
        Method Description: Adds all elements from array to the list
        Method Return: void
    */
    convertFromArray(array){
        for (let i = 0; i < array.length; i++){
            this.insert(array[i]);
        }
    }

    /*
     *   Method Name: append
     *   Method Parameters:
     *   Double value:
     *      Value to add to the list
     *   Method Description:
     *   This method inserts a value into the end of the list.
     *   Method Return: None
     */
    append(value){
        if (this.isEmpty()){
            this.insert(value);
        }else{
            this.end.next = new DLLNode(this.end, value);
            this.end = this.end.next;
        }
    }

    /*
     *   Method Name: insert
     *   Method Parameters:
     *   Double value:
     *      Value to add to the list
     *   Integer index:
     *      Index at which to insert the value
     *   Method Description:
     *   This method inserts a value into the list.
     *   Method Return: None
     */
    insert(value, index=this.getSize()){
        // Note: Inefficient
        let size = this.getSize();
        if (index > size || index < 0){
            console.error(`Invalid insertion index! (${index})`);
            return; 
        }
        let newNode = new DLLNode(null, value);

        // If empty list
        if (size == 0){
            this.head = newNode;
            this.end = newNode;
            return;
        }

        let current = this.head;
        let previous = null;
        let i = 0;
        // Go through the list to a proper insertion index
        while (i < index){
            // Only need to set previous once we get to the index
            if (i == index - 1){
                previous = current;
            }
            current = current.next;
            i++;
        }
        // This is only the case when at the end of the list
        if (index == size){
            this.end = newNode;
            previous.next = newNode;
            newNode.next = null;
            newNode.previous = previous;
        }else{
            // If the list is 1 long
            if (previous != null){
                previous.next = newNode;
            }else{
                this.head = newNode;
            }
            newNode.next = current;
        }
    }

    /*
     *   Method Name: push
     *   Method Parameters:
     *   Double value:
     *      Value to add to the list
     *   Method Description:
     *   This method inserts a value into the end of the list.
     *   Method Return: None
     */
    push(element){ this.append(element); }

    /*
     *   Method Name: add
     *   Method Parameters:
     *   Double value:
     *      Value to add to the list
     *   Method Description:
     *   This method inserts a value into the end of the list.
     *   Method Return: None
     */
    add(element){ this.append(element); }
    
    /*
     *   Method Name: getSize
     *   Method Parameters: None
     *   Method Description:
     *   This method calculates then returns the size of the list.
     *   Method Return: int (Size of the list)
     */
    getSize(){
        let current = this.head;
        let size = 0;
        // Loop through the list
        while (current != null){
            current = current.next;
            size += 1;
        }
        return size;
    }

    /*
     *   Method Name: getSize
     *   Method Parameters: None
     *   Method Description:
     *   This method calculates then returns the size of the list.
     *   Method Return: int (Size of the list)
     */
    getLength(){
        return this.getSize();
    }

    /*
     *   Method Name: print
     *   Method Parameters: None
     *   Method Description:
     *   This method prints every element in the list
     *   Method Return: None
     */
    print(){
        if (this.getSize() == 0){
            console.error("List Empty --> cannot print!!");
            return;
        }

        let current = this.head;
        let i = 0;
        // Loop through the list and print each value
        while (current != null){
            console.log(`${i}: ${current.value}:`);
            i++;
            current = current.next;
        }
    }

    /*
     *   Method Name: get
     *   Method Parameters:
     *   int index:
     *      Index of desired element
     *   Method Description:
     *   This method returns a value from the list.
     *   Method Return: double
     */
    get(index){
        let node = this.getNode(index);
        return node.value;
    }

    /*
     *   Method Name: getNode
     *   Method Parameters:
     *   int index:
     *      Index of desired node
     *   Method Description:
     *   This method returns a value from the list.
     *   Method Return: DLLNode
     */
    getNode(index){
        // If the index is out of bounds
        if (this.getSize() < index + 1 || index < 0){
            console.error(`Issue @ Index: ${index} (List Size: ${this.getSize()})`);
            return;
        }

        let i = 0;
        let current = this.head;
        // Loop until desired index
        while(i < index){
            current = current.next;
            i++;
        }
        return current;
    }

    /*
        Method Name: has
        Method Parameters:
            e:
                Value to be checked
        Method Description: Check if the linked list includes a value
        Method Return: boolean, true -> list has the value, false -> list does NOT have the value
    */
    has(e){
        return (this.search(e) != -1);
    }

    /*
        Method Name: search
        Method Parameters:
            e:
                Value to be checked
        Method Description: Search the linked list for a value and return the index found (-1 if not found)
        Method Return: int
    */
    search(e){
        let index = -1;
        let current = this.head;
        let i = 0;
        // Loop through the list
        while (current != null){
            if (current.value == e){
                return i;
            }
            current = current.next;
            i++;
        }
        return -1; // not found
    }

    /*
        Method Name: remove
        Method Parameters:
            index:
                Index at which to find element that is being looked for
        Method Description: Remove the element @ index {index}
        Method Return: void
    */
    remove(index){
        let size = this.getSize();
        if (!((index >= 0 && index < size))){
            return;
        }

        if (index == 0){
            this.head = this.head.next;
            if (this.head != null){
                this.head.previous = null;
            } 
            return;
        }else if (index == size){
            this.end = this.end.previous;
            if (this.end != null){
                this.end.next = null;
            }
        }
        let node = this.getNode(index);
        let previous = node.previous; // MUST NOT BE NULL OR ERROR
        previous.next = node.next;
        // If this is the last node then it would be null
        if (node.next != null){
            node.next.previous = previous;
        }
    }

    /*
        Method Name: set
        Method Parameters:
            index:
                index at which to set the value
            value:
                value to put @ {index}
        Method Description: Put value into position {index}
        Method Return: void
    */
    set(index, value){
        let node = this.getNode(index);
        node.value = value;
    }

    /*
        Method Name: isEmpty
        Method Parameters: None
        Method Description: Determine if the array list is empty
        Method Return: boolean, true -> empty, false -> not empty
    */
    isEmpty(){
        return this.head == null;
    }

    /*
        Method Name: pop
        Method Parameters:
            index:
                Index at which to pop the element
        Method Description: Remove the element and return it
        Method Return: Object (Unknown type)
    */
    pop(index){
        if (!((index >= 0 && index < this.getSize()))){
            return null;
        }
        let element = this.get(index);
        this.remove(index);
        return element;
    }

    /*
        Method Name: *[Symbol.iterator]
        Method Parameters: None
        Method Description: Provide each element of the linked list and its index
        Method Return: N/A
    */
    *[Symbol.iterator](){
        let current = this.head;
        let i = 0;
        while (current != null){
            yield [current.value, i];
            current = current.next;
            i++;
        }
    }

    /*
        Method Name: getLastNode
        Method Parameters: None
        Method Description: Returns the last node
        Method Return: DLLNode
    */
    getLastNode(){
        return this.end;
    }

    /*
        Method Name: deleteWithCondition
        Method Parameters:
            conditionFunction:
                A function that takes a single parameter and returns a boolean, true -> delete element, false -> don't delete
        Method Description: Deletes all elements for which the conditionFunction return true
        Method Return: void
    */
    deleteWithCondition(conditionFunction){
        if (this.isEmpty()){ return; }
        let current = this.getLastNode();
        while (current != null){
            // If value matches condition then remove it
            if (conditionFunction(current.value)){
                if (current.next != null){
                    current.next.previous = current.previous;
                }else{ // Else this is the end
                    this.end = current.previous;
                }
                if (current.previous != null){
                    current.previous.next = current.next;
                }else{ // Else this is the head
                    this.head = current.next;
                }
            }
            // Move to next
            current = current.previous;
        }
    }
}

/*
    Class Name: DLLNode
    Description: A doubly linked node.
*/
class DLLNode{
    constructor(previous, value){
        this.value = value;
        this.previous = previous;
        this.next = null;
    }
}
// If using NodeJS then export the class
if (typeof window === "undefined"){
    module.exports = NotSamLinkedList;
}