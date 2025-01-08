// Note: This code has been tested with a comprehensive suite. JavaScript_REUSEABLE\Linked List Array List. Caution: May have been modified since testing.
class NotSamLinkedList {
    constructor(){
        this.head = null;
        this.end = null;
        this.storedLength = 0;
        this.lastAccessed = null;
        this.lastAccessedIndex = -1;
    }

    print(){
        console.log("Linked List");
        console.log("Size", this.getSize());
        console.log("Length", this.getLength());
        for (let [element, elementIndex] of this){
            console.log("@ Index", elementIndex, "has", element, "fetched", this.get(elementIndex));
        }
    }
    
    clear(){
        this.head = null;
        this.end = null;
        this.storedLength = 0;
        this.lastAccessed = null;
        this.lastAccessedIndex = -1;
    }
    
    insert(value, index){
        let size = this.getSize();
        if (index > size || index < 0){
            throw new Error("Invalid insertion index! (" + index.toString() + ')');
        }
        
        let newNode = new DLLNode(null, value);

        // If empty list
        if (size === 0){
            this.head = newNode;
            this.end = newNode;
            this.storedLength = 1;
            return;
        }
        // if the list is not empty but this is the last element
        else if (index === size){
            // Replace null with newNode
            this.end.next = newNode;

            // Prepare both sides of newNode
            newNode.previous = this.end;
            newNode.next = null;

            // Set the end
            this.end = newNode;
        }
        // Else its replacing somewhere in the middle (or first element)
        else{
            let existingNode = this.getNode(index);
            
            newNode.previous = existingNode.previous;
            newNode.next = existingNode;
            // If this isn't the first node
            if (index != 0){
                existingNode.previous.next = newNode;
            }
            existingNode.previous = newNode;

            // Modify last accessed if its being moved up
            if (index <= this.lastAccessedIndex){
                this.lastAccessedIndex += 1;
            }

            if (index === 0){
                this.head = newNode;
            }
        }

        this.storedLength++;
    }
    
    append(value){
        this.insert(value, this.getSize());
    }

    push(value){ this.append(value); }

    
    add(value){ this.append(value); }

    
    calculateSize(){
        let current = this.head;
        let size = 0;
        // Loop through the list
        while (current != null){
            current = current.next;
            size += 1;
        }
        return size;
    }

    
    getSize(){
        return this.storedLength;
    }

    
    getLength(){
        return this.getSize();
    }

    
    get(index){
        let node = this.getNode(index);
        if (node === null){ debugger; }
        return node.value;
    }

    getNode(index){
        // If the index is out of bounds
        if (this.getSize() < index + 1 || index < 0){
            throw new Error("Issue @ Index: " + index.toString() + "(List Size: " + this.getSize().toString() + ")\n");
            return null;
        }

        let distanceToFront = index;
        let distanceToBack = this.getSize() - 1 - index;
        let distanceToLastAccessed = Math.abs(this.lastAccessedIndex - index);
        // If last accessed is not available, give it a distance too big to be used
        if (this.lastAccessedIndex === -1){
            distanceToLastAccessed = this.getSize(); // The polet is now its higher than distance to front and back
        }

        // Determine starting node
        let current = null;
        let direction;
        let currentIndex;
        if (distanceToFront <= distanceToBack && distanceToFront <= distanceToLastAccessed){
            current = this.head;
            direction = 1;
            currentIndex = 0;
        }else if (distanceToBack <= distanceToFront && distanceToBack <= distanceToLastAccessed){
            current = this.end;
            direction = -1;
            currentIndex = this.getSize() - 1;
        }else{ // last accessed is the closest
            current = this.lastAccessed;
            if (this.lastAccessedIndex > index){
                direction = -1;
            }else{
                direction = 1;
            }
            currentIndex = this.lastAccessedIndex;
        }

        // Loop until desired index
        while(currentIndex != index){
            if (direction > 0){
                current = current.next;
            }else{
                current = current.previous;
            }
            currentIndex += direction;
        }
        return current;
    }

    search(value){
        // TODO: Change
        let index = -1;
        let current = this.head;
        let i = 0;
        // Loop through the list
        while (current != null){
            if (current.value === value){
                return i;
            }
            current = current.next;
            i++;
        }
        return -1; // not found
    }

    
    pop(index){
        let size = this.getSize();
        if (!((index >= 0 && index < size))){
            console.log("index", index);
            console.log("size", size);
            throw new Error("Received invalid removal index");
        }
        let returnValue;

        // If we are removing the last accessed element
        if (this.lastAccessedIndex === index){
            this.lastAccessed = null;
            this.lastAccessedIndex = -1;
        }
        // Otherwise we can make a change if it is above the removed value
        else if (this.lastAccessedIndex > index){
            this.lastAccessedIndex -= 1;
        }

        // If we are remvoing the only element
        if (size === 1){
            returnValue = this.head.value;
            this.head = null;
            this.end = null;
        }
        // If we are removing the first element (and length > 1)
        else if (index === 0){
            returnValue = this.head.value;
            this.head = this.head.next;
            if (this.head != null){
                this.head.previous = null;
            }
        }
        // If we are removing the last element (and length > 1)
        else if (index === size - 1){
            returnValue = this.end.value;
            this.end = this.end.previous;
            if (this.end != null){
                this.end.next = null;
            }
        }else{
            let node = this.getNode(index);
            returnValue = node.value;
            let previous = node.previous; // MUSNOBE NULL OR ERROR
            previous.next = node.next;
            // If this is the last node then it would be 0
            if (node.next != null){
                node.next.previous = previous;
            }
        }
        this.storedLength--;
        return returnValue;
    }

    remove(index){
        this.pop(index);
    }

    
    set(index, value){
        let node = this.getNode(index);
        node.value = value;
    }

    
    isEmpty(){
        return this.storedLength === 0;
    }

    getLastNode(){
        return this.end;
    }

    
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
        // Clear last accessed
        this.lastAccessed = null;
        this.lastAccessedIndex = -1;
        this.storedLength = this.calculateSize();
    }

    *[Symbol.iterator](){
        let current = this.head;
        let i = 0;
        while (current != null){
            yield [current.value, i];
            current = current.next;
            i++;
        }
    }

}
class DLLNode {
    constructor(previous, value){
        this.value = value;
        this.previous = previous;
        this.next = null;
    }
}
// If using NodeJS -> Export the class
if (typeof window === "undefined"){
    module.exports = NotSamLinkedList;
}