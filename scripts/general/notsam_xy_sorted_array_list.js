// Note: Assumes you NEVER remove an x/y
class NotSamXYSortedArrayList {
    constructor(size=1, size_inc=(size) => size * 2){
        this.size_inc = size_inc;
        this.clear();
    }

    getMaxX(){
        return this.maxX;
    }

    getMaxY(){
        return this.maxY;
    }

    getMinX(){
        return this.minX;
    }

    getMinY(){
        return this.minY;
    }

    clear(){
        this.ySize = 0;
        this.yLength = 0;
        this.yAxis = new Array(this.ySize);

        // Stats
        this.maxX = null;
        this.maxY = null;
        this.minX = null;
        this.minY = null;
    }

    updateStatsX(x){
        if (this.maxX === null || x > this.maxX){
            this.maxX = x;
        }
        if (this.minX === null || x < this.minX){
            this.minX = x;
        }
    }

    updateStatsY(y){
        if (this.maxY === null || y > this.maxY){
            this.maxY = y;
        }
        if (this.minY === null || y < this.minY){
            this.minY = y;
        }
    }

    getYLength(){ return this.yLength; }

    getYSize(){ return this.ySize; }

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

    getLength(){
        let length = 0;
        for (let yIndex = 0; yIndex < this.getYLength(); yIndex++){
            length += this.yAxis[yIndex]["length"];
        }
        return length;
    }

    getSize(){
        // Note: This method is somewhat silly
        let size = 0;
        // Calculate used slots on the y axis
        for (let yIndex = 0; yIndex < this.getYLength(); yIndex++){
            size += this.yAxis[yIndex]["size"];
        }
        // Add unused slots on the y axis
        size += this.ySize - this.yLength;
        return size;
    }

    findYIndex(y, start=0, end=this.yLength-1){
        // If empty return -1
        if (end < 0 || start > end){ return -1; }
        let mid = Math.floor((start + end)/2);
        let comparisonResult = y - this.yAxis[mid]["y"];

        // If we found the y value
        if (comparisonResult == 0){
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

    // Note: Be careful with this function. Say you want index of 5 so you can find all < 5 but array only has 6 this will return index of 6. May cause problems. 
    findYActualOrWouldBeLocation(y){
        return this.findYInsertionPoint(y);
    }

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

    hasYIndex(y){
        return this.findYIndex(y) != -1;
    }

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

    findXIndex(x, xArray, start, end){
        // If empty return -1
        if (end < 0 || start > end){ return -1; }
        let mid = Math.floor((start + end)/2);
        if (xArray[mid] === undefined){
            debugger;
        }
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

    // Note: Be careful with this function. Say you want index of 5 so you can find all < 5 but array only has 6 this will return index of 6. May cause problems. 
    findXActualOrWouldBeLocation(x, xArrayObj){
        return this.findXInsertionPoint(x, xArrayObj["array"], 0, xArrayObj["length"], xArrayObj["length"]);
    }

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

    get(x, y){
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
        return xArray[xIndex]["value"];
    }

    grabYAxis(){
        return this.yAxis;
    }

    has(x, y){
        return this.get(x,y) != null;
    }

    isEmpty(){ return this.getYLength() == 0; }

    *[Symbol.iterator](){
        for (let yIndex = 0; yIndex < this.getYLength(); yIndex++){
            let xArrayObj = this.yAxis[yIndex];
            let xArray = xArrayObj["array"];
            let xArrayLength = xArrayObj["length"];
            for (let xIndex = 0 ; xIndex < xArrayLength; i++){
                let xObj = xArray[xIndex];
                yield [xObj["value"], xObj["x"], xArrayObj["y"]];
            }
        }
    }
}