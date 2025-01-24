// If using NodeJS then do required imports
if (typeof window === "undefined"){
    WTL_GAME_DATA = require("../../data/data_json.js");
}

function getIndexOfElementInList(list, value){
    for (let i = 0; i < list.length; i++){
        if (list[i] === value){
            return i;
        }
    }
    return -1;
}

function XYToSeed(x, y){
    let sqrtExtreme = Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER));
    let halfSquareRootExtreme = Math.floor(sqrtExtreme/2);
    let modifiedX = x;
    while (Math.abs(modifiedX) < halfSquareRootExtreme){
        modifiedX = -1 * (halfSquareRootExtreme - modifiedX);
    }
    let modifiedY = y;
    while (Math.abs(modifiedY) < halfSquareRootExtreme){
        modifiedY = -1 * (halfSquareRootExtreme - modifiedY);
    }
    let seed = halfSquareRootExtreme * modifiedY + modifiedX;
    return seed;
}

function binarySearch(value, array, comparisonFunction, start=0, end=array.length-1){
    // If empty return -1
    if (end < 0 || start > end){ return -1; }
    let mid = Math.floor((start + end)/2);
    let comparisonResult = comparisonFunction(value, array[mid]);

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
        return binarySearch(value, array, mid+1, end);
    }
    // End point is in the first half of the array
    else{
        return binarySearch(value, array, start, mid-1);
    }
}

function findInsertionPoint(value, array, comparisonFunction, start=0, end=array.length, hardEnd=array.length){
    // Handle empty case
    if (end === 0){ return 0; }

    // If the value belongs at the back
    if (end === hardEnd && end > 0 && comparisonFunction(value, array[end-1]) > 0){
        return end;
    }

    let mid = Math.floor((start + end)/2);
    let comparisonResult = comparisonFunction(value, array[mid]);

    let midMinusOneIsLess = (mid -1 < 0 || comparisonFunction(value, array[mid-1]) > 0);
    let midIsEqualOrMore = comparisonResult <= 0;
    
    // If we found a valid spot
    if (midMinusOneIsLess && midIsEqualOrMore){
        return mid;
    }
    // End point is in the second half of the array
    else if (comparisonResult > 0){
        return findInsertionPoint(value, array, mid, end, hardEnd);
    }
    // End point is in the first half of the array
    else{
        return findInsertionPoint(value, array, start, mid, hardEnd);
    }
}

function calculateRangeOverlapProportion(coveringRangeLow, coveringRangeHigh, coveredRangeLow, coveredRangeHigh){
    // Check for one source of error
    if (coveredRangeHigh === coveredRangeLow){
        throw new Error("Invalid covered range supplied:" + coveredRangeLow.toString() + ',' + coveredRangeHigh.toString());
    }
    // 6 cases handed in overlapping_ranges_problem.png

    // Case 7 - Both equal
    if (coveringRangeLow === coveredRangeLow && coveringRangeHigh === coveredRangeHigh){
        return 1;
    }
    // Case 3 - Covering range covers completely
    else if (coveringRangeLow <= coveredRangeLow && coveringRangeHigh >= coveredRangeHigh){
        return 1;
    }
    // Case 4 - Covering range is fully closed by covered range
    else if (coveringRangeLow >= coveredRangeLow && coveringRangeHigh <= coveredRangeHigh){
        return (coveringRangeHigh - coveringRangeLow) / (coveredRangeHigh - coveredRangeLow);
    }
    // Case 1 - Covering range is completely distinct (to the left)
    else if (coveringRangeHigh <= coveredRangeLow){
        return 0;
    }
    // Case 6 - Covering range is completely distinct (to the right)
    else if (coveringRangeLow <= coveredRangeHigh){
        return 0;
    }
    // Case 2 - Covering range partially covers from the left
    else if (coveringRangeLow < coveredRangeLow && coveringRangeHigh > coveredRangeLow){
        return (coveredRangeHigh - coveringRangeHigh) / (coveredRangeHigh - coveredRangeLow);
    }
    // Case 5 - Covering range partially covers from the right
    else if (coveringRangeLow > coveredRangeLow && coveringRangeHigh > coveredRangeHigh){
        return (coveredRangeHigh - coveringRangeLow) / (coveredRangeHigh - coveredRangeLow);
    }
    // Unknown case
    else{
        throw new Error("Unhandled case:" + coveredRangeLow.toString() + ',' + coveredRangeHigh.toString() + ',' + coveringRangeLow + ',' + coveringRangeHigh);
    }
}

/*
    Method Name: modifyDataJSONValue
    Method Parameters:
        path:
            A list of strings representing a path through the PROGRAM_DATA JSON Object
        newValue:
            new value to place in the JSON OBject
    Method Description: Finds a JSON object with a given path
    Method Return: JSON Object
*/
function modifyDataJSONValue(path, newValue){
    path = copyArray(path);
    let finalKey = path[path.length-1];
    getDataJSONObjAtPath(path)[finalKey] = newValue;
}

/*
    Method Name: getDataJSONObjAtPath
    Method Parameters:
        path:
            A list of strings representing a path through the PROGRAM_DATA JSON Object
    Method Description: Finds a value at a given path through the PROGRAM_DATA JSON Object
    Method Return: Unknown
*/
function accessDataJSONValue(path){
    path = copyArray(path);
    let finalKey = path[path.length-1];
    return getDataJSONObjAtPath(path)[finalKey];
}

/*
    Method Name: getDataJSONObjAtPath
    Method Parameters:
        path:
            A list of strings representing a path through the PROGRAM_DATA JSON Object
    Method Description: Finds a JSON object with a given path
    Method Return: JSON Object
*/
function getDataJSONObjAtPath(path){
    let obj = WTL_GAME_DATA;
    while (path.length > 1){
        if (obj === undefined){
            debugger;
        }
        obj = obj[path.shift()];
    }
    return obj;
}


function isMovingInSameDirection(value1, value2){
    if (value1 < 0 && value2 < 0){ return true; }
    if (value1 > 0 && value2 > 0){ return true; }
    if (value1 === 0 && value2 === 0){ return true; }
    return false;
}

function teamNameIsEqual(team1, team2){
    return getProperAdjective(team1) === getProperAdjective(team2);
}

function addToArraySet(array, element){
    // Don't add if already present
    if (getIndexOfElementInArray(array, element) != -1){ return; }
    array.push(element);
}

function getIndexOfElementInArray(array, element){
    for (let i = 0; i < array.length; i++){
        if (array[i] === element){
            return i;
        }
    }
    return -1;
}

function arraySwap(array, index1, index2){
    let temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
}

function areDirectionsEqual(direction1, direction2){
    return getMovementDirectionOf(direction1) === getMovementDirectionOf(direction2);
}

function getMovementDirectionOf(direction){
    if (direction === "front" || direction === "down"){
        return "down";
    }else if (direction === "back" || direction === "up"){
        return "up";
    }else if (direction === "left"){
        return "left";
    }else if (direction === "right"){
        return "right";
    }
    throw new Error("Invalid direction: " + direction);
}

function getVisualDirectionOf(direction){
    if (direction === "down" || direction === "front"){
        return "front";
    }else if (direction === "up" || direction === "back"){
        return "back";
    }else if (direction === "left"){
        return "left";
    }else if (direction === "right"){
        return "right";
    }
    throw new Error("Invalid direction: " + direction);
}

function getOppositeDirectionOf(direction){
    if (direction === "up"){
        return "down";
    }else if (direction === "down"){
        return "up";
    }else if (direction === "front"){
        return "back";
    }else if (direction === "back"){
        return "front";
    }else if (direction === "left"){
        return "right";
    }else if (direction === "right"){
        return "left";
    }
    throw new Error("Invalid direction: " + direction);
}

function getAngleFromMouseToScreenCenter(scene){
    let x = mouseX;
    let y = scene.changeFromScreenY(mouseY);
    let xOffset = x - getScreenWidth() / 2;
    let yOffset = y - getScreenHeight() / 2;
    if (xOffset == 0){
        if (yOffset > 0){
            return Math.PI/2;
        }else if (yOffset < 0){
            return Math.PI*3/2;
        }else{
            return 0;
        }
    }
    let angleRAD = Math.atan(yOffset/xOffset);
    if (xOffset < 0){
        angleRAD -= Math.PI;
    }
    return fixRadians(angleRAD);
}

function angleToBestFaceDirection(angleRAD){
    // If to the right
    if (angleBetweenCCWRAD(angleRAD, toRadians(315), toRadians(45))){
        return "right";
    }
    // If up
    else if (angleBetweenCCWRAD(angleRAD, toRadians(45), toRadians(135))){
        return "back";
    }
    // If to the left
    else if (angleBetweenCCWRAD(angleRAD, toRadians(135), toRadians(225))){
        return "left";
    }
    // Else it must be down
    else{
        return "front";
    }
}

function calculateMSBetweenTicks(){
    return 1000 / getTickRate();
}

function getTickRate(){
    return WTL_GAME_DATA["general"]["tick_rate"];
}

function roundUpToNearestMultipleOf(numberToRound, base){
    let sign = (numberToRound < 0) ? -1 : 1;

    // Remove sign from numberToRound
    numberToRound = Math.abs(numberToRound);

    // Make sure base is positive
    base = Math.abs(base);

    let multipleAmount = Math.ceil(numberToRound / base);

    return sign * multipleAmount * base;
}

function angleAndHypotenuseToXAndYSides(angleRAD, distance){
    return {
        "x": Math.cos(angleRAD) * distance,
        "y": Math.sin(angleRAD) * distance
    }
}

function calculateEuclideanDistance(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
}

function getTeamNameFromClass(characterClass){
    return WTL_GAME_DATA["character_class_to_team_name"][characterClass];
}

function getNumKeys(obj){
    let count = 0;
    for (let objKey of Object.keys(obj)){
        count++;
    }
    return count;
}

/*
    Method Name: angleBetweenCCWRAD
    Method Parameters:
        angle:
            An angle in radians
        eAngle1:
            An angle on one edge of a range (radians)
        eAngle2:
            An angle on the other edge of a range (radians)
    Method Description: Determines if angle is between eAngle1 and eAngle2 in the counter clockwise direction
    Method Return: boolean, true -> angle is between, false -> angle is not between
*/
function angleBetweenCCWRAD(angle, eAngle1, eAngle2){
    if (angle < eAngle1){
        angle += 2 * Math.PI;
    }
    if (eAngle2 < eAngle1){
        eAngle2 += 2 * Math.PI;
    }
    let distanceFromEAngle1ToAngleCCW = angle - eAngle1;
    let distanceFromEAngle1ToEAngle2CCW = eAngle2 - eAngle1;
    return distanceFromEAngle1ToAngleCCW <= distanceFromEAngle1ToEAngle2CCW;
}

/*
    Method Name: angleBetweenCWRAD
    Method Parameters:
        angle:
            An angle in radians
        eAngle1:
            An angle on one edge of a range (radians)
        eAngle2:
            An angle on the other edge of a range (radians)
    Method Description: Determines if angle is between eAngle1 and eAngle2 in the clockwise direction
    Method Return: boolean, true -> angle is between, false -> angle is not between
*/
function angleBetweenCWRAD(angle, eAngle1, eAngle2){
    if (angle > eAngle1){
        angle -= 2 * Math.PI;
    }
    if (eAngle2 > eAngle1){
        eAngle2 -= 2 * Math.PI;
    }
    let distanceFromEAngle1ToAngleCW = (angle - eAngle1) / -1;
    let distanceFromEAngle1ToEAngle2CW = (eAngle2 - eAngle1) / -1;
    return distanceFromEAngle1ToAngleCW <= distanceFromEAngle1ToEAngle2CW;
}

function getNoun(teamName){
    return getTeamNameJSON(teamName)["noun"];
}

function getProperAdjective(teamName){
    if (teamName === undefined){
        debugger;
    }
    return getTeamNameJSON(teamName)["proper_adjective"];
}

function getProperAdjectivePlural(teamName){
    return getTeamNameJSON(teamName)["proper_adjective_plural"];
}

/*
    Method Name: toFixedRadians
    Method Parameters:
        angle:
            An angle to "fix"
    Method Description: Converts to degrees and fixes an angle to the range [0,2*PI)
    Method Return: float
*/
function toFixedRadians(angleDEG){
    return fixRadians(toRadians(angleDEG));
}

function getTeamNameJSON(teamName){
    let searchableName = teamName.toLowerCase();
    for (let team of WTL_GAME_DATA["team_aliases"]){
        if (team["noun"].toLowerCase() == searchableName || team["proper_adjective"].toLowerCase() == searchableName || team["proper_adjective_plural"].toLowerCase() == searchableName){
            return team;
        }
    }
    throw new Error("Team not found.");
}

function getPhysicalTileDetails(physicalTileName){
    for (let physicalTileDetails of WTL_GAME_DATA["physical_tiles"]){
        if (physicalTileDetails["name"] == physicalTileName){
            return physicalTileDetails;
        }
    }
    return null;
}

async function ensureImageIsLoadedFromDetails(imageDetails){
    await ensureImageIsLoaded(imageDetails["name"], imageDetails["file_link"])
}

async function ensureImageIsLoaded(imageName, fileLink){
    if (!objectHasKey(IMAGES, imageName)){
        await loadTileToImages(imageName, fileLink);
    }
}

async function loadTileToImages(imageName, fileLink){
    IMAGES[imageName] = await loadLocalImage(fileLink);
}

async function loadLocalImage(url){
    let newImage = null;
    let wait = new Promise(function(resolve, reject){
        newImage = new Image();
        newImage.onload = function(){
            resolve();
        }
        newImage.onerror = function(){
            reject();
        }
        newImage.src = url;
    });
    await wait;
    return newImage;
}

async function loadToImages(imageName, folderPrefix="", type=".png"){
    IMAGES[imageName] = await loadLocalImage("images/" + folderPrefix + imageName + type);
}

// TODO: Comments
function listHasElement(list, element){
    for (let listElement of list){
        if (listElement === element){
            return true;
        }
    }
    return false;
}

// TODO: Comments
function toFixedDegrees(angleRAD){
    return fixDegrees(toDegrees(angleRAD));
}

// TODO: Comments
function pointInRectangle(x, y, lX, rX, bY, tY){
    return x >= lX && x <= rX && y >= bY && y <= tY;
}

// TODO: Comments
function getImage(imageName){
    // If using Node JS return null
    if (typeof window === "undefined"){
        return null;
    }
    return images[imageName];
}


// TODO: Comments
function objectHasKey(obj, key){
    for (let foundKey of Object.keys(obj)){
        if (foundKey == key){ return true; }
    }
    return false;
}

/*
    Method Name: mergeCopyObjects
    Method Parameters:
        obj1:
            Object 1
        obj2:
            Object 2
    Method Description: Creates a JSON object with the contents of two JSON objects. Copying rather than referencing (with limitations)
    Method Return: JSON Object
*/
function mergeCopyObjects(obj1, obj2){
    let newObject = {};
    // Merge in object 1
    for (let key of Object.keys(obj1)){
        if (isJSON(obj1[key])){
            newObject[key] = copyObject(obj1[key]);
        }else{
            newObject[key] = obj1[key];
        }
    }
    // Merge in object 2
    for (let key of Object.keys(obj2)){
        if (isJSON(obj2[key])){
            newObject[key] = copyObject(obj2[key]);
        }else{
            newObject[key] = obj2[key];
        }
    }
    return newObject;
}

/*
    Method Name: copyObject
    Method Parameters:
        obj:
            Object to copy
    Method Description: Creates a copy of an object (to some extent)
    Method Return: JSON Object
    Note: If you give it and instance of a class it will produce a reference not a copy
*/
function copyObject(obj){
    // Deep copy, copy inner objects aswell
    let newObject = {};
    for (let key of Object.keys(obj)){
        if (obj[key] === null){
            newObject[key] = null;
        }else if (Array.isArray(obj[key])){
            newObject[key] = copyArray(obj[key]);
        }else if (isJSON(obj[key])){
            newObject[key] = copyObject(obj[key]);
        }else{
            newObject[key] = obj[key];
        }
    }
    return newObject;
}

/*
    Method Name: appendLists
    Method Parameters:
        list1:
            A list
        list2:
            Another list
    Method Description: Attaches two lists, list1=[l1i0, l1i1, ...], list2=[l2i0, l2i1, ...] result: [l1i0, l1i1, ..., l2i0, l2i1, ...]
    Method Return: list
*/
function appendLists(list1, list2){
    let appendedList = [];
    for (let item of list1){
        appendedList.push(item);
    }
    for (let item of list2){
        appendedList.push(item);
    }
    return appendedList;
}

/*
    Method Name: safeDivide
    Method Parameters:
        numerator:
            The numerator of a division
        denominator:
            The denominator of a division 
        closeToZeroAmount:
            Amount between [0,INF], if denominator < closeToZeroAmount then return valueIfCloseToZero
        valueIfCloseToZero:
            Value to return if the denominator is close to zero
    Method Description: Divides two numbers, returning a special result if the denominator is close to zero
    Method Return: float (or special value)
*/
function safeDivide(numerator, denominator, closeToZeroAmount, valueIfCloseToZero){
    if (Math.abs(denominator) < closeToZeroAmount){ return valueIfCloseToZero; }
    return numerator / denominator;
}

/*
    Method Name: getLocalStorage
    Method Parameters:
        key:
            Key of the item in local storage
        valueIfNotFound:
            Value to return if the item cannot be found
    Method Description: Finds a value from storage, returns valueIfNotFound if not found.
    Method Return: void
*/
function getLocalStorage(key, valueIfNotFound=null){
    // In node js, you can't access this storage
    if (typeof window === "undefined"){ return valueIfNotFound; }
    let value = localStorage.getItem(key);
    if (value == null){
        return valueIfNotFound;
    }
    return value;
}

/*
    Method Name: setLocalStorage
    Method Parameters:
        key:
            Key of the item in local storage
        value:
            Value to put in local storage
    Method Description: Assignes a key to a value in local storage. Errors are not *really* handled.
    Method Return: void
*/
function setLocalStorage(key, value){
    // In node js, you can't access this storage
    if (typeof window === "undefined"){ return; }
    try {
        localStorage.setItem(key, value);
    }catch(e){}
}

/*
    Method Name: getScreenWidth
    Method Parameters: None
    Method Description: Determines the screen width in real pixels
    Method Return: void
*/
function getScreenWidth(){
    return window.innerWidth; // * pixelSomething density in the future?
}
/*
    Method Name: getScreenHeight
    Method Parameters: None
    Method Description: Determines the screen height in real pixels
    Method Return: void
*/
function getScreenHeight(){
    return window.innerHeight;
}

function reverseList(myList){
    let newList = [];
    for (let i = myList.length - 1; i >= 0; i--){
        newList.push(myList[i]);
    }
    return newList;
}

function isJSON(e){
    return e != null && e.constructor === ({}).constructor;
}

/*
    Method Name: copyArray
    Method Parameters:
        array:
            An array to copy
        limit:
            Index limit for copying
    Method Description: Creates a copy of an array
    Method Return: void
*/
function copyArray(array, limit=array.length){
    let newArray = [];
    for (let i = 0; i < Math.min(array.length, limit); i++){
        if (array[i] === null){
            newArray.push(null);
        }else if (Array.isArray(array[i])){
            newArray.push(copyArray(array[i]));
        }else if (isJSON(array[i])){
            newArray.push(copyObject(array[i]));
        }else{
            newArray.push(array[i]);
        }
    }
    return newArray;
}

function copyArrayOfJSONObjects(array, limit=array.length){
    let newArray = [];
    for (let i = 0; i < Math.min(array.length, limit); i++){
        newArray.push(copyObject(array[i]));
    }
    return newArray;
}

/*
    Method Name: listMean
    Method Parameters:
        list:
            An list to to find the mean of
    Method Description: Finds the mean value of a list of numbers
    Method Return: Number
*/
function listMean(list){
    if (list.length == 0){ return -1; }
    let total = 0;
    for (let i = 0; i < list.length; i++){
        total += list[i];
    }
    return total / list.length;
}

/*
    Method Name: listMin
    Method Parameters:
        list:
            An list to find the minimum number in
    Method Description: Finds the min value of a list of numbers
    Method Return: Number
*/
function listMin(list){
    let min = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < list.length; i++){
        if (list[i] < min){
            min = list[i];
        }
    }
    return min;
}

/*
    Method Name: listMax
    Method Parameters:
        list:
            An list to find the max of
    Method Description: Finds the max value of a list of numbers
    Method Return: Number
*/
function listMax(list){
    let max = Number.MIN_SAFE_INTEGER;
    for (let i = 0; i < list.length; i++){
        if (list[i] > max){
            max = list[i];
        }
    }
    return max;
}

/*
    Method Name: listMedian
    Method Parameters:
        list:
            An list to find the median of
    Method Description: Finds the median number in a list
    Method Return: Number
*/
function listMedian(list){
    if (list.length == 0){ return -1; }
    let newList = copyArray(list);
    newList.sort();
    return newList[Math.floor(newList.length/2)];
}

/*
    Method Name: toRadians
    Method Parameters:
        degrees:
            The number of degrees to convert to radians
    Method Description: Converts degrees to radians
    Method Return: float
*/
function toRadians(degrees){
    return degrees * Math.PI / 180;
}

/*
    Method Name: toDegrees
    Method Parameters:
        radians:
            An amount of radians to convert to degrees
    Method Description: Converts an amount of radians to degrees
    Method Return: int
*/
function toDegrees(radians){
    return radians / (2 * Math.PI) * 360;
}

/*
    Method Name: fixDegrees
    Method Parameters:
        angle:
            An angle to "fix"
    Method Description: Fixes an angle to the range [0,359]
    Method Return: int
*/
function fixDegrees(angle){
    while (angle < 0){
        angle += 360;
    }
    while(angle >= 360){
        angle -= 360;
    }
    return angle;
}

/*
    Method Name: fixRadians
    Method Parameters:
        angle:
            An angle to "fix"
    Method Description: Fixes an angle to the range [0,2*PI)
    Method Return: float
*/
function fixRadians(angle){
    while (angle < 0){
        angle += 2 * Math.PI;
    }
    while (angle >= 2 * Math.PI){
        angle -= 2 * Math.PI;
    }
    return angle;
}

/*
    Method Name: displacementToRadians
    Method Parameters:
        dX:
            The displacement in x
        dY:
            The displacement in y
    Method Description: Converts displacement in x, y to an angle in radians
    Method Return: float
*/
function displacementToRadians(dX, dY){
    // Handle incredibly small displacements
    if (Math.abs(dY) < 1){
        return (dX >= 0) ? toRadians(0) : toRadians(180);
    }else if (Math.abs(dX) < 1){
        return (dY >= 0) ? toRadians(90) : toRadians(270);
    }

    // Convert angle to positive positive
    let angleRAD = Math.atan(Math.abs(dY) / Math.abs(dX));

    // If -,- (x,y)
    if (dX < 0 && dY < 0){
        angleRAD = Math.PI + angleRAD;
    // If -,+ (x,y)
    }else if (dX < 0 && dY > 0){
        angleRAD = Math.PI - angleRAD;
    // If +,- (x,y)
    }else if (dX > 0 && dY < 0){
        angleRAD = 2 * Math.PI - angleRAD;
    }
    // +,+ Needs no modification
    return angleRAD;
}

/*
    Method Name: randomNumberInclusive
    Method Parameters:
        min:
            Minimum value (inclusive)
        maxInclusive:
            Maximum value (inclusive)
    Method Description: Come up with a number in a given range [min, maxInclusive]
    Method Return: int
*/
function randomNumberInclusive(min, maxInclusive){
    return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

/*
    Method Name: randomNumberInclusive
    Method Parameters:
        maxExclusive:
            Minimum value (exclusive)
    Method Return: int
*/
function randomNumber(maxExclusive){
    return randomNumberInclusive(0, maxExclusive-1);
}


/*
    Method Name: rotateCWRAD
    Method Parameters:
        angle:
            Angle to rotate
        amount:
            Amount to rotate by
    Method Description: Rotates an angle clockwise by an amount
    Method Return: int
*/
function rotateCWRAD(angle, amount){
    return fixRadians(angle - amount);
}

/*
    Method Name: rotateCCWRAD
    Method Parameters:
        angle:
            Angle to rotate
        amount:
            Amount to rotate by
    Method Description: Rotates an angle counter clockwise by an amount
    Method Return: int
*/
function rotateCCWRAD(angle, amount){
    return fixRadians(angle + amount);
}


/*
    Method Name: lessThanDir
    Method Parameters:
        p1:
            A point in a 1d space
        p2:
            Another point in a 1d space
        velocity:
            Velocity of an object
    Method Description: Whether p1 is less than p2 while travelling in a direction
    Method Return: Boolean, true -> p1 < p2 in the direction of velocity, false -> otherwise
*/
function lessThanDir(p1, p2, velocity){
    return (velocity >= 0) ? (p1 < p2) : (p1 > p2);
}

/*
    Method Name: lessThanEQDir
    Method Parameters:
        p1:
            A point in a 1d space
        p2:
            Another point in a 1d space
        velocity:
            Velocity of an object
    Method Description: Whether p1 is less than p2 while travelling in a direction
    Method Return: Boolean, true -> p1 <= p2 in the direction of velocity, false -> otherwise
*/
function lessThanEQDir(p1, p2, velocity){
    return (velocity >= 0) ? (p1 <= p2) : (p1 >= p2);
}

/*
    Method Name: nextIntInDir
    Method Parameters:
        floatValue:
            A float value
        velocity:
            Direction in which an object is moving
    Method Description: Finds the ceiling or floor of a float depending on the direction it is moving
    Method Return: int
*/
function nextIntInDir(floatValue, velocity){
    let newValue = Math.ceil(floatValue);
    if (velocity < 0){
        newValue = Math.floor(floatValue);
    }

    // If floatValue is an int then go by 1 in the next direction
    if (newValue == floatValue){
        newValue += (velocity < 0) ? -1 : 1;
    }

    return newValue;
}

/*
    Method Name: randomFloatBetween
    Method Parameters:
        lowerBound:
            Lower bound float value
        upperBound:
            Upper bound float value
    Method Description: Finds a random float between two ends
    Method Return: float
*/
function randomFloatBetween(lowerBound, upperBound){
    return Math.random() * (upperBound - lowerBound) + lowerBound;
}

function randomBoolean(){
    return Math.random() < 0.5;
}

function calculateAngleDiffRAD(angle1, angle2){
    let diff = Math.max(angle1, angle2) - Math.min(angle1, angle2);
    if (diff > Math.PI){
        diff = 2*Math.PI - diff;
    }
    return diff;
}

/*
    Method Name: calculateAngleDiffCWRAD
    Method Parameters:
        angle1:
            An angle in radians
        angle2:
            An angle in radians
    Method Description: Calculate the distance in radians from angle1 to angle2
    Method Return: Float
*/
function calculateAngleDiffCWRAD(angle1, angle2){
    if (angle2 > angle1){
        angle2 -= 2 * Math.PI;
    }
    let difference = (angle2 - angle1) / -1;
    return difference;
}

/*
    Method Name: calculateAngleDiffCCWRAD
    Method Parameters:
        angle1:
            An angle in radians
        angle2:
            An angle in radians
    Method Description: Calculate the distance in radians from angle1 to angle2
    Method Return: Float
*/
function calculateAngleDiffCCWRAD(angle1, angle2){
    if (angle2 < angle1){
        angle2 += 2 * Math.PI;
    }
    let difference = angle2 - angle1;
    return difference;
}

/*
    Method Name: sleep
    Method Parameters:
        ms:
            A number of ms to sleep for
    Method Description: Sleeps for a given amount of time
    Method Return: Promise
*/
async function sleep(ms){
    return new Promise((resolve, reject) => { setTimeout(resolve, ms); })
}

// If using NodeJS then export all the functions
if (typeof window === "undefined"){
    module.exports = {
        copyArray,
        toRadians,
        toDegrees,
        fixDegrees,
        fixRadians,
        displacementToRadians,
        randomNumberInclusive,
        randomNumber,
        lessThanDir,
        lessThanEQDir,
        nextIntInDir,
        randomFloatBetween,
        sleep,
        listMean,
        listMedian,
        listMin,
        listMax,
        getTickMultiplier,
        objectHasKey,
        mergeCopyObjects,
        copyObject,
        appendLists,
        safeDivide,
        getLocalStorage,
        setLocalStorage,
        getScreenWidth,
        getScreenHeight,
        getDegreesFromDisplacement,
        copyArray,
        getImage
    }
}
