/*
    Class Name: NotSamSortedArrayList
    Description: A sorted array list
*/
class NotSamSortedArrayList extends NotSamArrayList {
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
    constructor(comparisonFunction, array=null, size=1, size_inc=(size) => size * 2){
        super(array, size, size_inc);
        this.comparisonFunction = comparisonFunction;
    }

    /*
        Method Name: add
        Method Parameters: 
            value:
                A value
        Method Description: Adds a value to the array
        Method Return: void
    */
    add(value){
        if (this.getLength() === this.getSize()){
            this.resize();
        }

        let insertionIndex = this.findInsertionPoint(value);
        // Shift everything up
        for (let i = this.length; i > insertionIndex; i--){
            this.array[i] = this.array[i-1];
        }
        this.array[insertionIndex] = value;
        this.length++;
    }

    /*
        Method Name: search
        Method Parameters:
            value:
                Value to be checked
            start:
                The starting index for the search
            end:
                The ending index for the search (inclusive)
        Method Description: Search the array list for a value and return the index found (-1 if not found)
        Method Return: int
    */
    search(value, start=0, end=this.length-1){
        // If not found
        if (end < 0 || start > end){ return -1; }

        let mid = Math.floor((start + end)/2);
        let comparisonResult = this.comparisonFunction(value, this.array[mid]);

        // If we found the value
        if (comparisonResult == 0){
            return mid;
        }
        // If region too small
        else if (end === start){
            return -1;
        }
        // End point is in the second half of the array
        else if (comparisonResult > 0){
            return this.search(value, mid+1, end);
        }
        // End point is in the first half of the array
        else{
            return this.search(value, start, mid-1);
        }
    }

    /*
        Method Name: findInsertionPoint
        Method Parameters: 
            value:
                A value
            start:
                The starting index for the search
            end:
                The ending index for the search (exclusive)
        Method Description: Finds an index at which to insert an element
        Method Return: int
    */
    findInsertionPoint(value, start=0, end=this.length){
        // Handle empty case
        if (end === 0){ return 0; }

        // If the value belongs at the back
        if (end === this.length && end > 0 && this.comparisonFunction(value, this.array[end-1]) > 0){
            return end;
        }

        let mid = Math.floor((start + end)/2);
        let comparisonResult = this.comparisonFunction(value, this.array[mid]);

        let midMinusOneIsLess = (mid -1 < 0 || this.comparisonFunction(value, this.array[mid-1]) > 0);
        let midIsEqualOrMore = comparisonResult <= 0;
        
        // If we found a valid spot
        if (midMinusOneIsLess && midIsEqualOrMore){
            return mid;
        }
        // End point is in the second half of the array
        else if (comparisonResult > 0){
            return this.findInsertionPoint(value, mid, end);
        }
        // End point is in the first half of the array
        else{
            return this.findInsertionPoint(value, start, mid);
        }
    }


    /*
        Method Name: sort
        Method Parameters: 
            start:
                The starting index for the sort
            end:
                The ending index for the sort (inclusive)
        Method Description: performs merge sort on the sorted array list
        Method Return: void
    */
    sort(start=0, end=this.length-1){
        let size = end - start + 1;
        
        let swap = (index1, index2) => {
            let temp = this.array[index1];
            this.array[index1] = this.array[index2];
            this.array[index2] = temp;
        }

        if (size <= 1){ return; }

        if (size == 2){
            if (this.comparisonFunction(this.array[start], this.array[end]) > 0){
                swap(start, end);
            }
            return;
        }

        let mid = Math.floor((start + end) / 2);

        // Sort first half
        this.sort(start, mid);
        
        // Sort second half
        this.sort(mid+1, end);

        // Merge
        let copyArrayRangeToNewArray = (array, startPoint, endPoint) => {
            let size = endPoint - startPoint + 1;
            let newArray = new Array(size);
            for (let i = 0; i < size; i++){
                newArray[i] = array[startPoint + i];
            }
            return newArray;
        }

        let h1Array = copyArrayRangeToNewArray(this.array, start, mid);
        let h2Array = copyArrayRangeToNewArray(this.array, mid+1, end);

        let h1Index = 0;
        let h2Index = 0;
        let i = start;
        while (h1Index < h1Array.length || h2Index < h1Index.length){
            if (this.comparisonFunction(h1Array[h1Index], h2Array[h2Index]) <= 0){
                this.array[i] = h1Array[h1Index];
                h1Index++;
            }else{
                this.array[i] = h2Array[h2Index];
                h2Index++;
            }
            i++;
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
        throw new Error("Set function is unavailable for a sorted array list");
    }
}
// If using NodeJS -> Export the class
if (typeof window === "undefined"){
    module.exports = NotSamSortedArrayList;
}