/*
    Note: I just realized I never made an abstract class called Hitbox. I really wish JavaScript had the syntax of Java. These classes disgust me.
*/
/*
    Class Name: CircleHitbox
    Description: A circular hitbox
*/
class CircleHitbox {
    /*
        Method Name: constructor
        Method Parameters:
            radius:
                The radius of the circle hitbox
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(radius){
        this.x = -1;
        this.y = -1;
        this.radius = radius;
    }

    /*
        Method Name: update
        Method Parameters:
            x:
                x value at the center of the hitbox
            y:
                y value at the center of the hitbox
        Method Description: Updates the position of the hitbox
        Method Return: void
    */
    update(x, y){
        this.x = x;
        this.y = y;
    }

    /*
        Method Name: collidesWith
        Method Parameters:
            otherHitbox:
                The other hitbox that may be collided with
        Method Description: Determines whether two hitboxes collide
        Method Return: Boolean, true -> collision, false -> no collision
    */
    collidesWith(otherHitbox){
        if (otherHitbox instanceof RectangleHitbox){
            return circleWithRectangle(this, otherHitbox);
        }else{
            return circleWithCircle(this, otherHitbox);
        }
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getX(){
        return this.x;
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getY(){
        return this.y;
    }

    /*
        Method Name: getCenterX
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getCenterX(){
        return this.getX();
    }

    /*
        Method Name: getCenterY
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getCenterY(){
        return this.getY();
    }

    /*
        Method Name: getRadius
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getRadius(){
        return this.radius;
    }

    /*
        Method Name: getRadiusEquivalentX
        Method Parameters: None
        Method Description: Get the radius
        Method Return: float
    */
    getRadiusEquivalentX(){
        return this.getRadius();
    }

    /*
        Method Name: getRadiusEquivalentY
        Method Parameters: None
        Method Description: Get the radius
        Method Return: float
    */
    getRadiusEquivalentY(){
        return this.getRadius();
    }

    /*
        Method Name: getRightX
        Method Parameters: None
        Method Description: Determines the right most coordinate on the hitbox
        Method Return: Number
    */
    getRightX(){
        return this.x + this.radius;
    }

    /*
        Method Name: getLeftX
        Method Parameters: None
        Method Description: Determines the left most coordinate on the hitbox
        Method Return: Number
    */
    getLeftX(){
        return this.x - this.radius;
    }

    /*
        Method Name: getTopY
        Method Parameters: None
        Method Description: Determines the top coordinate on the hitbox
        Method Return: Number
    */
    getTopY(){
        return this.y + this.radius;
    }

    /*
        Method Name: getBottomY
        Method Parameters: None
        Method Description: Determines the bottom coordinate on the hitbox
        Method Return: Number
    */
    getBottomY(){
        return this.y - this.radius;
    }


}

/*
    Class Name: RectangleHitbox
    Description: A rectangular hitbox
*/
class RectangleHitbox {
    /*
        Method Name: constructor
        Method Parameters:
            width:
                The width of the rectangle hitbox
            height:
                The height of the rectangle hitbox
            centerX:
                x at the center of the rectangle hitbox
            centerY:
                y at the center of the rectangle hitbox
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(width, height, centerX=null, centerY=null){
        this.x1 = -1;
        this.x2 = -1;
        this.y1 = -1;
        this.y2 = -1;
        this.width = width;
        this.height = height;
        if (centerX != null){
            this.x1 = centerX - this.width / 2;
            this.x2 = centerX + this.width / 2;
        }
        if (centerY != null){
            this.y1 = centerY + this.height / 2;
            this.y2 = centerY - this.height / 2;
        }
    }

    /*
        Method Name: setWidth
        Method Parameters:
            width:
                New width value to take
        Method Description: Sets the width value to the given value
        Method Return: void
    */
    setWidth(width){
        this.width = width;
    }

    /*
        Method Name: setHeight
        Method Parameters:
            height:
                New height value to take
        Method Description: Sets the height value to the given value
        Method Return: void
    */
    setHeight(height){
        this.height = height;
    }

    /*
        Method Name: update
        Method Parameters:
            x:
                x value at the center of the hitbox
            y:
                y value at the center of the hitbox
        Method Description: Updates the position of the hitbox
        Method Return: void
    */
    update(x, y){
        this.x1 = x - this.width / 2;
        this.x2 = x + this.width / 2;
        this.y1 = y + this.height / 2;
        this.y2 = y - this.height / 2;
    }

    /*
        Method Name: collidesWith
        Method Parameters:
            otherHitbox:
                The other hitbox that may be collided with
        Method Description: Determines whether two hitboxes collide
        Method Return: Boolean, true -> collision, false -> no collision
    */
    collidesWith(otherHitbox){
        if (otherHitbox instanceof RectangleHitbox){
            return rectangleWithRectangle(this, otherHitbox);
        }else{
            return circleWithRectangle(otherHitbox, this);
        }
    }

    /*
        Method Name: collidesWithAt
        Method Parameters:
            otherRectangleHitbox:
                The other hitbox that may be collided with
        Method Description: Determines where two hitboxes collide
        Method Return: Integer
    */
    collidesWithAt(otherRectangleHitbox){
        return cwaRectRect(this, otherRectangleHitbox);
    }

    /*
        Method Name: getX1
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getX1(){
        return this.x1;
    }

    /*
        Method Name: getX2
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getX2(){
        return this.x2;
    }

    /*
        Method Name: getY1
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getY1(){
        return this.y1;
    }

    /*
        Method Name: getY2
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getY2(){
        return this.y2;
    }

    /*
        Method Name: getCenterX
        Method Parameters: None
        Method Description: calculates the center x
        Method Return: float
    */
    getCenterX(){
        return (this.getX1() + this.getX2())/2;
    }

    /*
        Method Name: getCenterY
        Method Parameters: None
        Method Description: calculates the center y
        Method Return: float
    */
    getCenterY(){
        return (this.getY1() + this.getY2())/2;
    }

    /*
        Method Name: getRadiusEquivalentX
        Method Parameters: None
        Method Description: Get the closest approximation to a radius in x
        Method Return: float
    */
    getRadiusEquivalentX(){
        return this.width / 2;
    }

    /*
        Method Name: getRadiusEquivalentY
        Method Parameters: None
        Method Description: Get the closest approximation to a radius in x
        Method Return: float
    */
    getRadiusEquivalentY(){
        return this.height / 2;
    }
    
    /*
        Method Name: getRightX
        Method Parameters: None
        Method Description: Determines the right most coordinate on the hitbox
        Method Return: Number
    */
    getRightX(){
        return Math.max(this.getX1(), this.getX2());
    }

    /*
        Method Name: getLeftX
        Method Parameters: None
        Method Description: Determines the left most coordinate on the hitbox
        Method Return: Number
    */
    getLeftX(){
        return Math.min(this.getX1(), this.getX2());
    }

    /*
        Method Name: getRightX
        Method Parameters: None
        Method Description: Determines the top coordinate on the hitbox
        Method Return: Number
    */
    getTopY(){
        return Math.max(this.getY1(), this.getY2());
    }

    /*
        Method Name: getBottomY
        Method Parameters: None
        Method Description: Determines the bottom coordinate on the hitbox
        Method Return: Number
    */
    getBottomY(){
        return Math.min(this.getY1(), this.getY2());
    }
}

/*
    Method Name: circleWithRectangle
    Method Parameters:
        circleHitbox:
            Hitbox of a circle
        rectangleHitbox:
            Hitbox of a rectangle
    Method Description: Determine if a circle and a rectangle collide
    Method Return: Boolean, true -> collision, false -> no collision
*/
function circleWithRectangle(circleHitbox, rectangleHitbox){
    let circleCenterX = circleHitbox.getX();
    let circleCenterY = circleHitbox.getY();
    let circleRadius = circleHitbox.getRadius();

    // If center is fully within the rectangle
    let withinX = circleCenterX >= rectangleHitbox.getX1() && circleCenterX <= rectangleHitbox.getX2();
    let withinY = circleCenterY <= rectangleHitbox.getY1() && circleCenterY >= rectangleHitbox.getY2();
    if (withinX && withinY){ return true; }

    // Subtract circle middle from rectangle verticies to calculate around the origin
    let x1 = rectangleHitbox.getX1() - circleCenterY;
    let x2 = rectangleHitbox.getX2() - circleCenterY;
    let y1 = rectangleHitbox.getY1() - circleCenterY;
    let y2 = rectangleHitbox.getY2() - circleCenterY;

    // Check all corners, if any within radius then the rectangle is within touching the circle
    if (Math.pow(x1, 2) + Math.pow(y1, 2) < Math.pow(circleRadius, 2)){ return true; }
    if (Math.pow(x1, 2) + Math.pow(y2, 2) < Math.pow(circleRadius, 2)){ return true; }
    if (Math.pow(x2, 2) + Math.pow(y1, 2) < Math.pow(circleRadius, 2)){ return true; }
    if (Math.pow(x2, 2) + Math.pow(y2, 2) < Math.pow(circleRadius, 2)){ return true; }

    // If the circle right is in the rectangle
    let circleRightX = circleHitbox.getX() + circleHitbox.getRadius();
    let rightWithinX = circleRightX >= rectangleHitbox.getX1() && circleRightX <= rectangleHitbox.getX2();
    if (rightWithinX && withinY){
        return true;
    }

    // If the circle left is in the rectangle
    let circleLeftX = circleHitbox.getX() + circleHitbox.getRadius();
    let leftWithinX = circleLeftX >= rectangleHitbox.getX1() && circleLeftX <= rectangleHitbox.getX2();
    if (leftWithinX && withinY){
        return true;
    }

    // If the circle top is in the rectangle
    let circleTopY = circleHitbox.getY() + circleHitbox.getRadius();
    let topWithinY = circleTopY >= rectangleHitbox.getY1() && circleTopY <= rectangleHitbox.getY2();
    if (topWithinY && withinX){
        return true;
    }

    // If the circle bottom is in the rectangle
    let circleBottomY = circleHitbox.getY() + circleHitbox.getRadius();
    let bottomWithinY = circleBottomY >= rectangleHitbox.getY1() && circleBottomY <= rectangleHitbox.getY2();
    if (bottomWithinY && withinX){
        return true;
    }

    return false;
}

/*
    Method Name: circleWithCircle
    Method Parameters:
        circleHitbox1:
            Hitbox of a circle
        circleHitbox2:
            Hitbox of another circle
    Method Description: Determine if a circle and a circle collide
    Method Return: Boolean, true -> collision, false -> no collision
*/
function circleWithCircle(circleHitbox1, circleHitbox2){
    let c1X = circleHitbox1.getX();
    let c2X = circleHitbox2.getX();
    let c1Y = circleHitbox1.getY();
    let c2Y = circleHitbox2.getY();
    let c1R = circleHitbox1.getRadius();
    let c2R = circleHitbox2.getRadius();
    let distance = Math.sqrt(Math.pow(c2X-c1X, 2) + Math.pow(c2Y-c1Y, 2));
    let collide = distance < c1R + c2R;
    return collide;
}

/*
    Method Name: rectangleWithRectangle
    Method Parameters:
        rectangleHitbox1:
            Hitbox of a rectangle
        rectangleHitbox2:
            Hitbox of another rectangle
    Method Description: Determine if a rectangle and a rectangle collide
    Method Return: Boolean, true -> collision, false -> no collision
*/
function rectangleWithRectangle(rectangleHitbox1, rectangleHitbox2){
    let lXr1 = rectangleHitbox1.getX1();
    let rXr1 = rectangleHitbox1.getX2(); 
    let lXr2 = rectangleHitbox2.getX1();
    let rXr2 = rectangleHitbox2.getX2();
    let tYr1 = rectangleHitbox1.getY1();
    let bYr1 = rectangleHitbox1.getY2(); 
    let tYr2 = rectangleHitbox2.getY1();
    let bYr2 = rectangleHitbox2.getY2();
    let cXr1 = rectangleHitbox1.getCenterX();
    let cXr2 = rectangleHitbox2.getCenterX();
    let cYr1 = rectangleHitbox1.getCenterY();
    let cYr2 = rectangleHitbox2.getCenterY();

    // If rectangle1's top left corner is within rectangle2
    if (pointInRectangle(lXr1, tYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's bottom left corner is within rectangle2
    if (pointInRectangle(lXr1, bYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's top right corner is within rectangle2
    if (pointInRectangle(rXr1, tYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's bottom right corner is within rectangle2
    if (pointInRectangle(rXr1, bYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's center is within rectangle2
    if (pointInRectangle(cXr1, cYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle2's center is within rectangle1
    if (pointInRectangle(cXr2, cYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's top left corner is within rectangle1
    if (pointInRectangle(lXr2, tYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's bottom left corner is within rectangle1
    if (pointInRectangle(lXr2, bYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's top right corner is within rectangle1
    if (pointInRectangle(rXr2, tYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's bottom right corner is within rectangle21
    if (pointInRectangle(rXr2, bYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // Else not overlapping
    return false;
}

/*
    Method Name: pointInRectangle
    Method Parameters:
        x:
            x value of a point
        y:
            y value of a point
        x1:
            x1 value of a rectangle
        x2:
            x2 value of a rectangle
        y1:
            y1 value of a rectangle
        y2:
            y2 value of a rectangle

    Method Description: Determine if a point is inside a rectangle
    Method Return: Boolean, true -> point is inside, false -> not inside
*/
function pointInRectangle(x, y, x1, x2, y1, y2){
    if (x > x1 && x < x2 && y < y1 && y > y2){ return true; }
    if (x == x1 && x < x2 && y < y1 && y > y2){ return true; }
    if (x > x1 && x == x2 && y < y1 && y > y2){ return true; }
    if (x > x1 && x < x2 && y == y1 && y > y2){ return true; }
    if (x > x1 && x < x2 && y < y1 && y == y2){ return true; }
    return false;
}

/*
    Method Name: cwaRectRect
    Method Parameters:
        rectangleHitbox1:
            Hitbox of a rectangle
        rectangleHitbox2:
            Hitbox of another rectangle
    Method Description: Determine the way that a rectangle and a rectangle collide
    Method Return: Boolean, true -> collision, false -> no collision
*/
function cwaRectRect(rectangleHitbox1, rectangleHitbox2){
    let lXr1 = rectangleHitbox1.getX1();
    let rXr1 = rectangleHitbox1.getX2(); 
    let lXr2 = rectangleHitbox2.getX1();
    let rXr2 = rectangleHitbox2.getX2();
    let tYr1 = rectangleHitbox1.getY1();
    let bYr1 = rectangleHitbox1.getY2(); 
    let tYr2 = rectangleHitbox2.getY1();
    let bYr2 = rectangleHitbox2.getY2();
    let cXr1 = rectangleHitbox1.getCenterX();
    let cXr2 = rectangleHitbox2.getCenterX();
    let cYr1 = rectangleHitbox1.getCenterY();
    let cYr2 = rectangleHitbox2.getCenterY();

    let lr = false;
    // If my right is hitting other's left
    if (rXr1 > lXr2){
        lr = true;
    }else if (lXr1 < rXr2){ // If my left is hitting other's right
        lr = true;
    }

    let bt = false;
    // If my bottom is hitting other's top
    if (bYr1 < tYr2){
        bt = true;
    }else if (tYr1 > bYr2){ // My top is hitting other's bottom
        bt = true;
    }

    let score = 0;
    score += lr ? 1 : 0;
    score += bt ? 2 : 0;
    /*
        Score Guide
        0 - Should be impossible (func only called if colliding)
        1 - LR Hit
        2 - BT Hit
        3 - LR & BT Hit
    */
    return score;
}

// If using NodeJS then export the classes
if (typeof window === "undefined"){
    module.exports = { CircleHitbox, RectangleHitbox };
}