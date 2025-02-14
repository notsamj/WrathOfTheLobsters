// If using NodeJS then do required imports
if (typeof window === "undefined"){
    WTL_GAME_DATA = require("../../data/data_json.js");
}

/*
    Function Name: msToTickCeil
    Function Parameters: 
        ms:
            Number of miliseconds
    Function Description: Converts a number of miliseconds to ticks (rounds up)
    Function Return: int
*/
function msToTickCeil(ms){
    return Math.ceil(ms / calculateMSBetweenTicks());
}

/*
    Function Name: floatBandaid
    Function Parameters: 
        myFloat:
            A float
        numDigits=6:
            The maximum number of digits for the float
    Function Description: Limits a float to a number of digits
    Function Return: float
*/
function floatBandaid(myFloat, numDigits=6){
    return Number.parseFloat(myFloat).toFixed(numDigits);
}

/*
    Function Name: calculateAngleRangeOverlapProportion
    Function Parameters: 
        coveringRangeCWEnd:
            The covering range clockwise end
        coveringRangeCCWEnd:
            The covering range counter-clockwise end
        coveredRangeCWEnd:
            The covered range clockwise end
        coveredRangeCCWEnd:
            The covered range counter-clockwise end
    Function Description: Calculates the proportion that the covered range that is covered by the covering range
    Function Return: float [0,1]
*/
function calculateAngleRangeOverlapProportion(coveringRangeCWEnd, coveringRangeCCWEnd, coveredRangeCWEnd, coveredRangeCCWEnd){
    // Check for one source of error
    if (coveringRangeCWEnd === coveringRangeCCWEnd){
        return 0;
    }
    if (coveredRangeCWEnd === coveredRangeCCWEnd){
        return 1;
    }

    // Cases not detailed anywhere but here

    // Case 6 - Both equal
    if (coveringRangeCWEnd === coveredRangeCWEnd && coveringRangeCCWEnd === coveredRangeCCWEnd){
        return 1;
    }
    // Case 3 - Covering range covers completely
    else if (angleBetweenCWRAD(coveredRangeCWEnd, coveringRangeCCWEnd, coveringRangeCWEnd) && angleBetweenCWRAD(coveredRangeCCWEnd, coveringRangeCCWEnd, coveringRangeCWEnd)){
        return 1;
    }
    // Case 4 - Covering range is fully closed by covered range
    else if (angleBetweenCWRAD(coveringRangeCWEnd, coveredRangeCCWEnd, coveredRangeCWEnd) && angleBetweenCWRAD(coveringRangeCCWEnd, coveredRangeCCWEnd, coveredRangeCWEnd)){
        return calculateAngleDiffRAD(coveringRangeCWEnd, coveringRangeCCWEnd) / calculateAngleDiffRAD(coveredRangeCWEnd, coveredRangeCCWEnd);
    }
    // Case 1 - Covering range is completely distinct
    else if (angleBetweenCWRAD(coveringRangeCWEnd, coveredRangeCWEnd, coveredRangeCCWEnd) && angleBetweenCWRAD(coveringRangeCCWEnd, coveredRangeCWEnd, coveredRangeCCWEnd)){
        return 0;
    }
    // Case 2 - Covering range partially covers from the left
    else if (angleBetweenCWRAD(coveringRangeCWEnd, coveredRangeCCWEnd, coveredRangeCWEnd)){
        return calculateAngleDiffRAD(coveringRangeCWEnd, coveredRangeCCWEnd) / calculateAngleDiffRAD(coveredRangeCWEnd, coveredRangeCCWEnd);
    }
    // Case 5 - Covering range partially covers from the right
    else if (angleBetweenCWRAD(coveringRangeCCWEnd, coveredRangeCCWEnd, coveredRangeCWEnd)){
        return calculateAngleDiffRAD(coveringRangeCCWEnd, coveredRangeCWEnd) / calculateAngleDiffRAD(coveredRangeCWEnd, coveredRangeCCWEnd);
    }
    // Unknown case
    else{
        throw new Error("Unhandled case:" + coveringRangeCWEnd.toString() + ',' + coveringRangeCCWEnd.toString() + ',' + coveredRangeCWEnd + ',' + coveredRangeCCWEnd);
    }
}

/*
    Function Name: getIndexOfElementInList
    Function Parameters: 
        list:
            A list
        value:
            A value to search for
    Function Description: Finds the index of an element in a list
    Function Return: int
*/
function getIndexOfElementInList(list, value){
    for (let i = 0; i < list.length; i++){
        if (list[i] === value){
            return i;
        }
    }
    return -1;
}

/*
    Method Name: XYToSeed
    Method Parameters: 
        x:
            An x coordinate
        y:
            A y coordinate
    Method Description: Takes an x and y coordinate and converts them to a more-or-less unique seed
    Method Return: int
*/
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

/*
    Method Name: binarySearch
    Method Parameters: 
        value:
            Value to search for
        array:
            Array to search
        comparisonFunction:
            Function that compares two values (returns 0, -1, 1)
        start:
            Start index
        end:
            End index (inclusive)
    Method Description: Searches a sorted array
    Method Return: int
*/
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

/*
    Function Name: findInsertionPoint
    Function Parameters: 
        value:
            Value to search for
        array:
            Array to search
        comparisonFunction:
            Function that compares two values (returns 0, -1, 1)
        start:
            Start index
        end:
            End index (exclusive)
        hardEnd:
            Length of the array
    Function Description: Finds a point at which one can insert a value into the array
    Function Return: int
*/
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
        obj = obj[path.shift()];
    }
    return obj;
}


/*
    Function Name: isMovingInSameDirection
    Function Parameters: 
        value1:
            A number
        value2:
            A number
    Function Description: Checks if two numbers have the same sign
    Function Return: boolean
*/
function isMovingInSameDirection(value1, value2){
    if (value1 < 0 && value2 < 0){ return true; }
    if (value1 > 0 && value2 > 0){ return true; }
    if (value1 === 0 && value2 === 0){ return true; }
    return false;
}

/*
    Function Name: teamNameIsEqual
    Function Parameters: 
        team1:
            A team name. String
        team2:
            A team name. String
    Function Description: Checks if two team names are the same
    Function Return: boolean
*/
function teamNameIsEqual(team1, team2){
    return getProperAdjective(team1) === getProperAdjective(team2);
}

/*
    Function Name: addToArraySet
    Function Parameters: 
        array:
            An array
        element:
            A value of variable type
    Function Description: Adds a value to an array but treats the array like a set
    Function Return: void
*/
function addToArraySet(array, element){
    // Don't add if already present
    if (getIndexOfElementInArray(array, element) != -1){ return; }
    array.push(element);
}

/*
    Function Name: getIndexOfElementInArray
    Function Parameters: 
        array:
            An array
        value:
            A value to search for
    Function Description: Finds the index of an element in a list
    Function Return: int
*/
function getIndexOfElementInArray(array, element){
    for (let i = 0; i < array.length; i++){
        if (array[i] === element){
            return i;
        }
    }
    return -1;
}

/*
    Function Name: arraySwap
    Function Parameters: 
        array:
            An array
        index1:
            An index
        index2:
            An index
    Function Description: Swaps elements at two indices in an array
    Function Return: void
*/
function arraySwap(array, index1, index2){
    let temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
}

/*
    Function Name: areDirectionsEqual
    Function Parameters: 
        direction1:
            A direction String (visual or movement)
        direction2:
            A direction String (visual or movement)
    Function Description: Checks if two directions are equivalent
    Function Return: boolean
*/
function areDirectionsEqual(direction1, direction2){
    return getMovementDirectionOf(direction1) === getMovementDirectionOf(direction2);
}

/*
    Function Name: getMovementDirectionOf
    Function Parameters: 
        direction:
            Visual or movement direction string
    Function Description: Converts a visual direction to movement direction
    Function Return: String
*/
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

/*
    Function Name: getVisualDirectionOf
    Function Parameters: 
        direction:
            Movement or visual direction string
    Function Description: Converts a movement direction to visual direction
    Function Return: String
*/
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

/*
    Function Name: getOppositeDirectionOf
    Function Parameters: 
        direction:
            Movement or visual direction string
    Function Description: Gets the opposite direction string
    Function Return: String
*/
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

/*
    Function Name: getAngleFromMouseToScreenCenter
    Function Parameters: 
        scene:
            A WTLGameScene
    Function Description: Gets the angle from the mouse to screen center
    Function Return: float [0, 2*Math.PI)
*/
function getAngleFromMouseToScreenCenter(scene){
    let x = gMouseX;
    let y = scene.changeFromScreenY(gMouseY);
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

/*
    Function Name: angleToBestFaceDirection
    Function Parameters: 
        angleRAD:
            An angle in radians
    Function Description: Converts an angle to a facing direction
    Function Return: string
*/
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

/*
    Function Name: calculateMSBetweenTicks
    Function Parameters: None
    Function Description: Calculates the number of ms between ticks
    Function Return: number
*/
function calculateMSBetweenTicks(){
    return 1000 / getTickRate();
}

/*
    Function Name: getTickRate
    Function Parameters: None
    Function Description: Gets the tick rate
    Function Return: int
*/
function getTickRate(){
    return WTL_GAME_DATA["general"]["tick_rate"];
}

/*
    Function Name: angleAndHypotenuseToXAndYSides
    Function Parameters: 
        angleRAD:
            An angle in radians
        distance:
            Hypotenuse length / distance
    Function Description: Converts an angle and hypotenuse to the x and y sides
    Function Return: JSON
*/
function angleAndHypotenuseToXAndYSides(angleRAD, distance){
    return {
        "x": Math.cos(angleRAD) * distance,
        "y": Math.sin(angleRAD) * distance
    }
}

/*
    Function Name: calculateEuclideanDistance
    Function Parameters: 
        x1:
            x coordinate
        y1:
            y coordinate
        x2:
            x coordinate
        y2:
            y coordinate
    Function Description: Calculates the euclidean distance
    Function Return: float
*/
function calculateEuclideanDistance(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
}

/*
    Function Name: getTeamNameFromClass
    Function Parameters: 
        characterClass:
            A character class/model String
    Function Description: Converts a class/model to team name
    Function Return: String
*/
function getTeamNameFromClass(characterClass){
    return WTL_GAME_DATA["character_class_to_team_name"][characterClass];
}

/*
    Function Name: getNumKeys
    Function Parameters: 
        obj:
            A json object
    Function Description: Counts the number of keys in a JSON object
    Function Return: int
*/
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

/*
    Function Name: getNoun
    Function Parameters: 
        teamName:
            A team name string
    Function Description: Gets the team name noun
    Function Return: String
*/
function getNoun(teamName){
    return getTeamNameJSON(teamName)["noun"];
}

/*
    Function Name: getProperAdjective
    Function Parameters: 
        teamName:
            A team name string
    Function Description: Gets the team name adjective
    Function Return: String
*/
function getProperAdjective(teamName){
    return getTeamNameJSON(teamName)["proper_adjective"];
}

/*
    Function Name: getProperAdjectivePlural
    Function Parameters: 
        teamName:
            A team name string
    Function Description: Gets the team name plural form
    Function Return: String
*/
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

/*
    Function Name: getTeamNameJSON
    Function Parameters: 
        teamName:
            A team name string
    Function Description: Finds a team name JSON from difference forms
    Function Return: JSON Object
*/
function getTeamNameJSON(teamName){
    let searchableName = teamName.toLowerCase();
    for (let team of WTL_GAME_DATA["team_aliases"]){
        if (team["noun"].toLowerCase() === searchableName || team["proper_adjective"].toLowerCase() === searchableName || team["proper_adjective_plural"].toLowerCase() === searchableName){
            return team;
        }
    }
    throw new Error("Team not found.");
}

/*
    Function Name: getPhysicalTileDetails
    Function Parameters: 
        physicalTileName:
            The name of a physical tile type
    Function Description: Gets the details about a physical tile type
    Function Return: JSON Object or null
*/
function getPhysicalTileDetails(physicalTileName){
    for (let physicalTileDetails of WTL_GAME_DATA["physical_tiles"]){
        if (physicalTileDetails["name"] == physicalTileName){
            return physicalTileDetails;
        }
    }
    return null;
}

/*
    Function Name: ensureImageIsLoadedFromDetails
    Function Parameters: 
        imageDetails:
            JSON object with info on an image
    Function Description: Ensurse an image is loaded
    Function Return: Promise (implicit)
*/
async function ensureImageIsLoadedFromDetails(imageDetails){
    await ensureImageIsLoaded(imageDetails["name"], imageDetails["file_link"])
}

/*
    Function Name: ensureImageIsLoaded
    Function Parameters: 
        imageName:
            The name of an image
        fileLink:
            A link to a file
    Function Description: Ensures an image is loaded
    Function Return: Promise (implicit)
*/
async function ensureImageIsLoaded(imageName, fileLink){
    if (!objectHasKey(IMAGES, imageName)){
        await loadTileToImages(imageName, fileLink);
    }
}

/*
    Function Name: ensureImageIsLoaded
    Function Parameters: 
        imageName:
            The name of an image
        fileLink:
            A link to a file
    Function Description: Loads an image
    Function Return: Promise (implicit)
*/
async function loadTileToImages(imageName, fileLink){
    IMAGES[imageName] = await loadLocalImage(fileLink);
}

/*
    Function Name: loadLocalImage
    Function Parameters: 
        url:
            URL to the image
    Function Description: Loads a local image
    Function Return: Promise (implicit)
*/
async function loadLocalImage(url){
    let newImage = null;
    let wait = new Promise(function(resolve, reject){
        newImage = new Image();
        newImage.onload = function(){
            resolve();
        }
        newImage.onerror = function(error){
            console.error("Error loading image at url", url, "error:", error);
            reject();
        }
        newImage.src = url;
    });
    await wait;
    return newImage;
}

/*
    Function Name: loadToImages
    Function Parameters: 
        imageName:
            The name of an image
        folderPrefix:
            The folder prefix in images
        type:
            The type of file
    Function Description: Loads an image to the image JSON
    Function Return: Promise (implicit)
*/
async function loadToImages(imageName, folderPrefix="", type=".png"){
    IMAGES[imageName] = await loadLocalImage("images/" + folderPrefix + imageName + type);
}

/*
    Function Name: listHasElement
    Function Parameters: 
        list:
            A list
        element:
            An element of variable type
    Function Description: Checks if a list contains an element
    Function Return: boolean
*/
function listHasElement(list, element){
    for (let listElement of list){
        if (listElement === element){
            return true;
        }
    }
    return false;
}

/*
    Function Name: toFixedDegrees
    Function Parameters: 
        angleRAD:
            A radian angle
    Function Description: Converts an angle to a fixed number of degrees
    Function Return: int [0,359]
*/
function toFixedDegrees(angleRAD){
    return fixDegrees(toDegrees(angleRAD));
}

/*
    Function Name: pointInRectangle
    Function Parameters: 
        x:
            x coordinate
        y:
            y coordinate
        lX:
            left x coordinate
        rX:
            right x coordinate
        bY:
            bottom y coordinate
        tY:
            top y coordinate
    Function Description: Checks if a point is in a rectangle
    Function Return: boolean
*/
function pointInRectangle(x, y, lX, rX, bY, tY){
    return x >= lX && x <= rX && y >= bY && y <= tY;
}

/*
    Function Name: getImage
    Function Parameters: 
        imageName:
            The name of an image
    Function Description: Finds an image and returns it
    Function Return: Image
*/
function getImage(imageName){
    return images[imageName];
}


/*
    Function Name: objectHasKey
    Function Parameters: 
        obj:
            A json object
        key:
            The key to look for
    Function Description: Checks if a JSON object contains a key
    Function Return: boolean
*/
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

/*
    Function Name: reverseList
    Function Parameters: 
        myList:
            A list
    Function Description: Reverses the order of elements in a list
    Function Return: List of variable type contents
*/
function reverseList(myList){
    let newList = [];
    for (let i = myList.length - 1; i >= 0; i--){
        newList.push(myList[i]);
    }
    return newList;
}

/*
    Function Name: isJSON
    Function Parameters: 
        e:
            A value
    Function Description: Checks if a value is JSON or not
    Function Return: boolean
*/
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

/*
    Function Name: copyArrayOfJSONObjects
    Function Parameters: 
        array:
            An array
        limit:
            The number of objects to copy to copy
    Function Description: Copies json objects from an array
    Function Return: List of JSON objects
*/
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

/*
    Function Name: randomBoolean
    Function Parameters: None
    Function Description: Creates a random boolean
    Function Return: boolean
*/
function randomBoolean(){
    return Math.random() < 0.5;
}

/*
    Function Name: calculateAngleDiffRAD
    Function Parameters: 
        angle1:
            A radian angle
        angle2:
            A radian angle
    Function Description: Calculates the difference between two angles
    Function Return: float in [0, PI]
*/
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
