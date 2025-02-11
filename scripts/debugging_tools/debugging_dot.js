/*
    Class Name: DebuggingDot
    Class Description: A dot used in debugging
*/
class DebuggingDot {
    /*
        Method Name: constructor
        Method Parameters: 
            colourCode:
                The colour code for the dot
            x:
                The x position of the dot
            y:
                The y position of the dot
            radius:
                The radius of the dot
        Method Description: constructor
        Method Return: constructor
    */
    constructor(colourCode, x, y, radius){
        this.colourCode = colourCode;
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    /*
        Method Name: display
        Method Parameters: 
            scene:
                The scene to use for display
            lX:
                The x coordinate of the left of the screen
            rX:
                The x coordinate of the right of the screen
            bY:
                The y coordinate of the bottom of the screen
            tY:
                The y coordinate of the top of the screen
        Method Description: Displays the dot
        Method Return: void
    */
    display(scene, lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let screenX = scene.getDisplayX(this.x, 0, lX, false);
        let screenY = scene.getDisplayY(this.y, 0, bY, false);
        let colour = Colour.fromCode(this.colourCode);
        noStrokeCircle(colour, screenX, screenY, this.radius*2*gameZoom);
    }

    /*
        Method Name: setColourCode
        Method Parameters: 
            newColourCode:
                A new color code
        Method Description: Setter
        Method Return: void
    */
    setColourCode(newColourCode){
        this.colourCode = newColourCode;
    }

    /*
        Method Name: setX
        Method Parameters: 
            x:
                A new x value
        Method Description: Setter
        Method Return: void
    */
    setX(x){
        this.x = x;
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
        Method Name: setY
        Method Parameters: 
            y:
                A new y value
        Method Description: Setter
        Method Return: void
    */
    setY(y){
        this.y = y;
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
        Method Name: touchesRegion
        Method Parameters: 
            lX:
                The x coordinate of the left of the screen
            rX:
                The x coordinate of the right of the screen
            bY:
                The y coordinate of the bottom of the screen
            tY:
                The y coordinate of the top of the screen
        Method Description: Checks if the dot touches a screen region
        Method Return: Boolean, true -> touches the region, false -> does not touch the region
    */
    touchesRegion(lX, rX, bY, tY){
        let bottomY = this.y - this.radius;
        let topY = this.y + this.radius;
        let rightX = this.x + this.radius;
        let leftX = this.x - this.radius;

        if (leftX > rX){ return false; }
        if (rightX < lX){ return false; }
        if (bottomY > tY){ return false; }
        if (topY < bY){ return false; }
        return true;
    }
}