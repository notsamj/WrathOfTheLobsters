/*
    Class Name: NotSamArrayList
    Description: An implementation of the ArrayList pattern.
    Note:
    This implementation was initially created in 2020 / 2021 by Samuel
    using the moniker NotSam for reasons that I chose not to disclose.
    It has been reappropriated for this program in 2023 and keeps the 'NotSam' to differentiate it 
    from a non-custom ArrayList.
*/
class NotSamArrayList {
    /*
        Method Name: constructor
        Method Parameters:
            array:
                An array used to initialize the data for this array list
            size:
                The current size of the array list
            size_inc:
                A function used to increase the size when the space limit is met
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(array=null, size=1, size_inc=(size) => size * 2){
        this.size_inc = size_inc;
        if (array == null){
            this.size = size;
            this.array = new Array(this.size);
            this.length = 0;
        }else{
            this.size = array.length;
            this.length = array.length;
            this.array = new Array(this.size);
            this.convert_from_array(array);
        }
    }

    // TODO: Comments
    clear(){
        this.length = 0;
    }

    /*
        Method Name: convert_from_array
        Method Parameters:
            array:
                An array used to initialize the data for this array list
        Method Description: Adds all elements from array to the array list
        Method Return: void
    */
    convert_from_array(array){
        for (var i = 0; i < array.length; i++){
            this.add(array[i]);
        }
    }

    /*
        Method Name: resize
        Method Parameters: None
        Method Description: Increases the maximum size of the array list
        Method Return: void
    */
    resize(){
        this.size = this.size_inc(this.size);
        var newArray = new Array(this.size);
        for (var i = 0; i < this.length; i++){
            newArray[i] = this.array[i];
        }
        this.array = newArray;
    }

    /*
        Method Name: getLength
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getLength(){
        return this.length;
    }

    /*
        Method Name: add
        Method Parameters:
            value:
                Value to add
        Method Description: Add a value to the end of the array list
        Method Return: void
    */
    add(value){
        if (this.getLength() == this.getSize()){
            this.resize();
        }

        this.array[this.getLength()] = value;
        this.length++;
    }

    /*
        Method Name: add
        Method Parameters:
            value:
                Value to add
        Method Description: Add a value to the end of the array list
        Method Return: void
    */
    append(value){
        this.add(value);
    }

    // TODO: Comments
    push(value){
        this.add(value);
    }

    /*
        Method Name: has
        Method Parameters:
            value:
                Value to be checked
        Method Description: Check if the arraylist includes a value
        Method Return: boolean, true -> array list has the value, false -> array list does NOT have the value
    */
    has(value){
        var index = this.search(value);
        return !(index == -1);
    }

    /*
        Method Name: search
        Method Parameters:
            value:
                Value to be checked
        Method Description: Search the array list for a value and return the index found (-1 if not found)
        Method Return: int
    */
    search(value){
        for (var i = 0; i < this.getLength(); i++){
            if (this.array[i] === value){
                return i;
            }  
        }

        return -1;
    }

    /*
        Method Name: getSize
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getSize(){
        return this.size;
    }


    /*
        Method Name: getElement
        Method Parameters:
            e:
                Element to find
        Method Description: Find an element by its value
        Method Return: Object (unknown type)
        Note: Assume element exists. Also I realize this method is really stupid and pointless? Whatever 
        CAUTION DO NOT USE (but I won't bother to delete it)
    */
    getElement(e){
        var index = this.search(e);
        return this.get(index)
    }

    /*
        Method Name: get
        Method Parameters:
            index:
                Index at which to find element that is being looked for
        Method Description: Get the element @ index {index}
        Method Return: Object (unknown type)
    */
    get(index){
        if (!((index >= 0 && index < this.getLength()))){
            return null;
        }
        return this.array[index];
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
        if (!((index >= 0 && index < this.getLength()))){
            return;
        }
        this.array[index] = null;
        for (var i = index; i < this.getLength(); i++){
            this.array[i] = this.array[i+1];
        }
        this.length -= 1;
    }

    /*
        Method Name: copy
        Method Parameters: None
        Method Description: Create a copy of the array list
        Method Return: NotSamArrayList
    */
    copy(){
        var newArr = new NotSamArrayList();
        for (var i = 0; i < this.getLength(); i++){
            newArr.add(this.array[i]);
        }
        return newArr;
    }

    /*
        Method Name: print
        Method Parameters: None
        Method Description: Print out all the elements of the array list
        Method Return: void
    */
    print(){
        console.log("s")
        for (var i = 0; i < this.getLength(); i++){
            console.log(i, this.get(i));
        }
        console.log("f")
    }

    /*
        Method Name: isEmpty
        Method Parameters: None
        Method Description: Determine if the array list is empty
        Method Return: boolean, true -> empty, false -> not empty
    */
    isEmpty(){ return this.getLength() == 0; }

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
        this.array[index] = value;
    }

    /*
        Method Name: put
        Method Parameters:
            index:
                index at which to set the value
            value:
                value to put @ {index}
        Method Description: Put value into position {index}
        Method Return: void
    */
    put(index, value){
        this.set(index, value);
    }

    /*
        Method Name: fillWithPlaceholder
        Method Parameters:
            value:
                value to put in all array slots
        Method Description: Fill the arraylist with a placeholder value
        Method Return: void
    */
    fillWithPlaceholder(value){
        while (this.getLength() < this.getSize()){
            this.add(value);
        }
    }

    /*
        Method Name: *[Symbol.iterator]
        Method Parameters: None
        Method Description: Provide each element of the arraylist and its index
        Method Return: N/A
    */
    *[Symbol.iterator](){
        for (let i = 0; i < this.getLength(); i++){
            yield [this.array[i], i];
        }
    }
}
// If using NodeJS -> Export the class
if (typeof window === "undefined"){
    module.exports = NotSamArrayList;
}