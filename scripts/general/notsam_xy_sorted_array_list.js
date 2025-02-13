/*
    Class Name: NotSamXYSortedArrayList
    Class Description: A sorted array list indexed with x and y indices
    Note: Assumes you NEVER remove an x/y
*/
class NotSamXYSortedArrayList {
    constructor(size=1, size_inc=(size) => size * 2){
        this.size_inc = size_inc;
        this.ySize = size;
        this.clear();
    }

    /*
        Method Name: getNullVersion
        Method Parameters: None
        Method Description: Creates a null version of this 
        Method Return: NotSamXYSortedArrayList
    */
    getNullVersion(){
        let nullCopy = new NotSamXYSortedArrayList();
        for (let [value, x, y] of this){
            nullCopy.set(x, y, null);
        }
        return nullCopy;
    }

    /*
        Method Name: toList
        Method Parameters: None
        Method Description: Creates a list out of the stored values
        Method Return: List of Variable type values
    */
    toList(){
        let outputList = [];
        for (let [item, x, y] of this){
            outputList.push(item);
        }
        return outputList;
    }

    /*
        Method Name: getMaxX
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getMaxX(){
        return this.maxX;
    }

    /*
        Method Name: getMaxY
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getMaxY(){
        return this.maxY;
    }

    /*
        Method Name: getMinX
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getMinX(){
        return this.minX;
    }

    /*
        Method Name: getMinY
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getMinY(){
        return this.minY;
    }

    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Clears the XYArrayList
        Method Return: void
    */
    clear(){
        this.yLength = 0;
        this.yAxis = new Array(this.ySize);

        // Stats
        this.maxX = null;
        this.maxY = null;
        this.minX = null;
        this.minY = null;
    }

    /*
        Method Name: updateStatsX
        Method Parameters: 
            x:
                x value
        Method Description: Updates the x stats
        Method Return: void
    */
    updateStatsX(x){
        if (this.maxX === null || x > this.maxX){
            this.maxX = x;
        }
        if (this.minX === null || x < this.minX){
            this.minX = x;
        }
    }

    /*
        Method Name: updateStatsY
        Method Parameters: 
            y:
                y value
        Method Description: Updates the y stats
        Method Return: void
    */
    updateStatsY(y){
        if (this.maxY === null || y > this.maxY){
            this.maxY = y;
        }
        if (this.minY === null || y < this.minY){
            this.minY = y;
        }
    }

    /*
        Method Name: getYLength
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getYLength(){ return this.yLength; }

    /*
        Method Name: getYSize
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getYSize(){ return this.ySize; }

    /*
        Method Name: resizeYAxis
        Method Parameters: None
        Method Description: Resizes the y axis
        Method Return: void
    */
    resizeYAxis(){
        let newYSize = this.size_inc(this.ySize);
        let newYAxis = new Array(newYSize);

        // Move elements to new array
        for (let i = 0; i < this.yLength; i++){
            newYAxis[i] = this.yAxis[i];
        }

        this.yAxis = newYAxis;
        this.ySize = newYSize;
    }

    /*
        Method Name: resizeXAxis
        Method Parameters: 
            xArrayObj:
                An object representing a row
        Method Description: Resizes an x row
        Method Return: void
    */
    resizeXAxis(xArrayObj){
        let currentSize = xArrayObj["size"];
        let currentArray = xArrayObj["array"];
        let length = xArrayObj["length"];
        
        let newXSize = this.size_inc(currentSize);
        let newXArray = new Array(newXSize);

        // Move elements to new array
        for (let i = 0; i < length; i++){
            newXArray[i] = currentArray[i];
        }

        // Move all to the object
        xArrayObj["size"] = newXSize;
        xArrayObj["array"] = newXArray;
    }

    /*
        Method Name: getLength
        Method Parameters: None
        Method Description: Calculates the total length
        Method Return: int
    */
    getLength(){
        let length = 0;
        for (let yIndex = 0; yIndex < this.getYLength(); yIndex++){
            length += this.yAxis[yIndex]["length"];
        }
        return length;
    }

    /*
        Method Name: getSize
        Method Parameters: None
        Method Description: Calculates the total size
        Method Return: int
        Method Note: This method is somewhat silly
    */
    getSize(){
        let size = 0;
        // Calculate used slots on the y axis
        for (let yIndex = 0; yIndex < this.getYLength(); yIndex++){
            size += this.yAxis[yIndex]["size"];
        }
        // Add unused slots on the y axis
        size += this.ySize - this.yLength;
        return size;
    }

    /*
        Method Name: findYIndex
        Method Parameters: 
            y:
                A y coordinate
            start:
                Start index
            end:
                End index (inclusive)
        Method Description: Finds the index in y of a y coordinate
        Method Return: int
    */
    findYIndex(y, start=0, end=this.yLength-1){
        // If empty return -1
        if (end < 0 || start > end){ return -1; }
        let mid = Math.floor((start + end)/2);
        let comparisonResult = y - this.yAxis[mid]["y"];

        // If we found the y value
        if (comparisonResult === 0){
            return mid;
        }
        // If region too small
        else if (end === start){
            return -1;
        }
        // End point is in the second half of the array
        else if (comparisonResult > 0){
            return this.findYIndex(y, mid+1, end);
        }
        // End point is in the first half of the array
        else{
            return this.findYIndex(y, start, mid-1);
        }
    }

    /*
        Method Name: findYActualOrWouldBeLocation
        Method Parameters: 
            y:
                A y coordinate
        Method Description: Finds the y index of the y coordinate or the would be location if it were added
        Method Return: int
    */
    findYActualOrWouldBeLocation(y){
        return this.findYInsertionPoint(y);
    }

    /*
        Method Name: findYInsertionPoint
        Method Parameters: 
            y:
                A y coordinate
            start:
                Start index
            end:
                End index (exclusive)
            hardEnd:
                Array end index (exclusive)
        Method Description: Finds the insertion point of a y coordinate
        Method Return: int
    */
    findYInsertionPoint(y, start=0, end=this.yLength, hardEnd=this.yLength){
        // Handle empty case
        if (end === 0){ return 0; }

        // If the y value belongs at the back
        if (end === hardEnd && end > 0 && y - this.yAxis[end-1]["y"] > 0){
            return end;
        }

        let mid = Math.floor((start + end)/2);
        let comparisonResult = y - this.yAxis[mid]["y"];

        let midMinusOneIsLess = (mid -1 < 0 || y - this.yAxis[mid-1]["y"] > 0);
        let midIsEqualOrMore = comparisonResult <= 0;
        
        // If we found a valid spot
        if (midMinusOneIsLess && midIsEqualOrMore){
            return mid;
        }
        // End point is in the second half of the array
        else if (comparisonResult > 0){
            return this.findYInsertionPoint(y, mid, end, hardEnd);
        }
        // End point is in the first half of the array
        else{
            return this.findYInsertionPoint(y, start, mid, hardEnd);
        }
    }

    /*
        Method Name: hasYIndex
        Method Parameters: 
            y :
                A y coordinate
        Method Description: Checks if a y value is present
        Method Return: boolean
    */
    hasYValue(y){
        return this.findYIndex(y) != -1;
    }

    /*
        Method Name: addToYAxis
        Method Parameters: 
            y:
                A y coordinate
            insertionIndex:
                The insetion index in the y axis
        Method Description: Adds a y value to the y axis
        Method Return: void
    */
    addToYAxis(y, insertionIndex){
        // If the y axis needs expansion then expand it
        if (this.getYLength() === this.getYSize()){
            this.resizeYAxis();
        }
        // Move everything up (if not at end)
        for (let yIndex = this.getYLength(); yIndex > insertionIndex; yIndex--){
            this.yAxis[yIndex] = this.yAxis[yIndex-1];
        }
        // Insert
        let startingSize = 1;
        this.yAxis[insertionIndex] = {"y": y, "length": 0, "size": startingSize, "array": new Array(startingSize)};

        // Update stats
        this.updateStatsY(y);

        // Increase y length
        this.yLength++;
    }

    /*
        Method Name: addToXAxis
        Method Parameters: 
            x:
                An x coordinate
            insertionIndex:
                Index at which to insert
            xArrayObj:
                A row in the xy array list
        Method Description: Adds an x coordinate to the x axis
        Method Return: void
    */
    addToXAxis(x, insertionIndex, xArrayObj){
        // If the y axis needs expansion then expand it
        let xArrayLength = xArrayObj["length"];
        if (xArrayLength === xArrayObj["size"]){
            this.resizeXAxis(xArrayObj);
        }
        // Move everything up (if not at end)
        let xArray = xArrayObj["array"];
        for (let xIndex = xArrayLength; xIndex > insertionIndex; xIndex--){
            xArray[xIndex] = xArray[xIndex-1];
        }
        // Insert
        xArray[insertionIndex] = {"x": x, "value": null};

        // Update stats
        this.updateStatsX(x);

        // Increase x length
        xArrayObj["length"] += 1;
    }

    /*
        Method Name: findXIndex
        Method Parameters: 
            x:
                An x coordinate
            xArray:
                A row in the xy array list
            start:
                Start index
            end:
                End index (inclusive)
        Method Description: Finds an the x index of an x coordinate
        Method Return: int
    */
    findXIndex(x, xArray, start, end){
        // If empty return -1
        if (end < 0 || start > end){ return -1; }
        let mid = Math.floor((start + end)/2);

        let comparisonResult = x - xArray[mid]["x"];

        // If we found the x value
        if (comparisonResult == 0){
            return mid;
        }
        // If region too small
        else if (end === start){
            return -1;
        }
        // End point is in the second half of the array
        else if (comparisonResult > 0){
            return this.findXIndex(x, xArray,  mid+1, end);
        }
        // End point is in the first half of the array
        else{
            return this.findXIndex(x, xArray,  start, mid-1);
        }
    }

    /*
        Method Name: findXActualOrWouldBeLocation
        Method Parameters: 
            x:
                An x coordinate
            xArrayObj:
                A row in the xy array list
        Method Description: Finds the actual or would be location of an x coordinate
        Method Return: int
        Method Note: Be careful with this function. Say you want index of 5 so you can find all < 5 but array only has 6 this will return index of 6. May cause problems. 
    */
    findXActualOrWouldBeLocation(x, xArrayObj){
        return this.findXInsertionPoint(x, xArrayObj["array"], 0, xArrayObj["length"], xArrayObj["length"]);
    }

    /*
        Method Name: findXInsertionPoint
        Method Parameters: 
            x:
                An x coordinate
            xArray:
                A row
            start:
                Starting index
            end:
                End index (exlusivee)
            hardEnd:
                Row length 
        Method Description: Finds the x insertion point of an x coordinate
        Method Return: int
    */
    findXInsertionPoint(x, xArray, start, end, hardEnd){
        // Handle empty case
        if (end === 0){ return 0; }

        // If the x value belongs at the back
        if (end === hardEnd && end > 0 && x - xArray[end-1]["x"] > 0){
            return end;
        }

        let mid = Math.floor((start + end)/2);
        let comparisonResult = x - xArray[mid]["x"];

        let midMinusOneIsLess = (mid -1 < 0 || x - xArray[mid-1]["x"] > 0);
        let midIsEqualOrMore = comparisonResult <= 0;
        
        // If we found a valid spot
        if (midMinusOneIsLess && midIsEqualOrMore){
            return mid;
        }
        // End point is in the second half of the array
        else if (comparisonResult > 0){
            return this.findXInsertionPoint(x, xArray, mid, end, hardEnd);
        }
        // End point is in the first half of the array
        else{
            return this.findXInsertionPoint(x, xArray, start, mid, hardEnd);
        }
    }

    /*
        Method Name: set
        Method Parameters: 
            x:
                An x coordinate
            y:
                A y coordinate
            value:
                A value
        Method Description: Sets the value at an x,y coordinate set
        Method Return: void
    */
    set(x, y, value){
        let yIndex = this.findYIndex(y);
        // If y is not found
        if (yIndex === -1){
            let insertionIndex = this.findYInsertionPoint(y);
            this.addToYAxis(y, insertionIndex);

            // Set yIndex to insertion index
            yIndex = insertionIndex;
        }

        let xArrayObj = this.yAxis[yIndex];
        let xArray = xArrayObj["array"];

        let xIndex = this.findXIndex(x, xArray, 0, xArrayObj["length"]-1);
        // If x is not found
        if (xIndex === -1){
            let insertionIndex = this.findXInsertionPoint(x, xArray, 0, xArrayObj["length"], xArrayObj["length"]);
            this.addToXAxis(x, insertionIndex, xArrayObj);

            // Update xArray to new one
            xArray = xArrayObj["array"];

            // Set xIndex to insertion index
            xIndex = insertionIndex;
        }

        // Set the value in the x array
        xArray[xIndex]["value"] = value;
    }

    /*
        Method Name: get
        Method Parameters: 
            x:
                An x coordinate
            y:
                A y coordinate
        Method Description: Gets the value at a given x,y coordinate set
        Method Return: Variable
    */
    get(x, y){
        let node = this.getNode(x, y);
        if (node === null){ return null; }
        return node["value"];
    }

    /*
        Method Name: getNode
        Method Parameters: 
            x:
                An x coordinate
            y:
                A y coordinate
        Method Description: Gets the Node at a given x,y coordinate set
        Method Return: Variable
    */
    getNode(x, y){
        let yIndex = this.findYIndex(y);
        // If y index is not found
        if (yIndex === -1){
            return null;
        }

        let xArrayObj = this.yAxis[yIndex];
        let xArray = xArrayObj["array"];
        let xIndex = this.findXIndex(x, xArray, 0, xArrayObj["length"]-1);
        // If x index is not found
        if (xIndex === -1){
            return null;
        }

        // Return found value
        return xArray[xIndex];
    }

    /*
        Method Name: grabYAxis
        Method Parameters: None
        Method Description: Gets the y axis
        Method Return: Array of JSON objects
    */
    grabYAxis(){
        return this.yAxis;
    }

    /*
        Method Name: has
        Method Parameters: 
            x:
                An x coordinate
            y:
                A y coordinate
        Method Description: Checks if a coordinate set is present
        Method Return: boolean
    */
    has(x, y){
        return this.getNode(x,y) != null;
    }

    /*
        Method Name: isEmpty
        Method Parameters: None
        Method Description: Checks if the array is is empty
        Method Return: boolean
    */
    isEmpty(){ return this.getYLength() == 0; }

    /*
        Method Name: iterator
        Method Parameters: None
        Method Description: Loops through the xy array list and yields values
        Method Return: [value, xCoordinate, yCoordinate]
    */
    *[Symbol.iterator](){
        for (let yIndex = 0; yIndex < this.getYLength(); yIndex++){
            let xArrayObj = this.yAxis[yIndex];
            let xArray = xArrayObj["array"];
            let xArrayLength = xArrayObj["length"];
            for (let xIndex = 0 ; xIndex < xArrayLength; xIndex++){
                let xObj = xArray[xIndex];
                let value = xObj["value"];
                //if (value === null){ continue; }
                yield [value, xObj["x"], xArrayObj["y"]];
            }
        }
    }
}