/*
    Class Name: NotSamXYCappedLengthSortedArrayList
    Description: A sorted xy array list with a maximum length
*/
class NotSamXYCappedLengthSortedArrayList extends NotSamXYSortedArrayList {
     /*
        Method Name: constructor
        Method Parameters:
            maxLength:
                The maximum length of the array list
            size:
                The current size of the array list
            size_inc:
                A function used to increase the size when the space limit is met
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(maxLength, size=1, size_inc=(size) => size * 2){
        super(size, size_inc);
        this.maxLength = maxLength;
    }

    /*
        Method Name: getMaxLength
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getMaxLength(){
        return this.maxLength;
    }

    /*
        Method Name: set
        Method Parameters: 
            x:
                x coordinate
            y:
                y coordinate
            value:
                A value
        Method Description: Sets the value at x,y to a new value
        Method Return: void
    */
    set(x, y, value){
        // If this set will force an expansion then -> clear then set
        if (!this.has(x, y) && this.getLength() === this.getMaxLength()){
            this.clear();
        }
        super.set(x, y, value);
    }
}