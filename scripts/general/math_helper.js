function getDeclining1OverXOf(a, xOffset, value){
    return 1 / Math.pow(value + xOffset, a);
}

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