/*
    Function Name: getDeclining1OverXOf
    Function Parameters: 
        a:
            An exponent
        xOffset:
            The x offset for the function
        value:
            The x value to transform
    Function Description: Peforms a function on values to produce a result 
    Function Return: float
*/
function getDeclining1OverXOf(a, xOffset, value){
    return 1 / Math.pow(value + xOffset, a);
}

/*
    Function Name: biasedIndexSelection
    Function Parameters: 
        xStart:
            The starting x value of a range for a function
        xEnd:
            The ending x value of a range for a function
        f:
            An explonent
        n:
            The number of indices
        random:
            A random number generator instance
    Function Description: Chooses an index randomly but guided by a function
    Function Return: int [0,n-1]
*/
function biasedIndexSelection(xStart, xEnd, f, n, random){
    let func = (x) => { return 1/Math.pow(x,f); }
    let endY = func(xEnd);
    let startY = func(xStart);
    let pickedX = random.getRandomFloat() * (xEnd - xStart) + xStart;
    let valueAtPickedX = func(pickedX);
    let progressionInY = (startY - valueAtPickedX) / (startY - endY);
    let chosenIndex = Math.floor(n * (1 - progressionInY));
    return chosenIndex;
}

/*
    Function Name: calculateManhattanDistance
    Function Parameters: 
        x1:
            An x coordinate
        y1:
            A y coordinate
        x2:
            An x coordinate
        y2:
            A y coordinate
    Function Description: Calculates the manhattan distance between two points
    Function Return: number
*/
function calculateManhattanDistance(x1, y1, x2, y2){
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}