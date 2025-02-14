/*
    Class Name: VisualItem
    Class Description: Something that can be displayed on the screen
*/
class VisualItem {
    constructor(width=WTL_GAME_DATA["general"]["tile_size"], height=WTL_GAME_DATA["general"]["tile_size"]){
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getWidth(){
        return this.width;
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getHeight(){
        return this.height;
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getX(){
        return this.x;
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getY(){
        return this.y;
    }

    /*
        Method Name: getCenterX
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getCenterX(){
        return this.getX();
    }

    /*
        Method Name: getCenterY
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getCenterY(){
        return this.getY();
    }

    /*
        Method Name: touchesRegion
        Method Parameters: 
            lX:
                The x of the left of the region
            rX:
                The x of the right of the region
            bY:
                The y of the bottom of the region
            tY:
                The y of the top of the region
        Method Description: Checks if the visual item touches a given region
        Method Return: boolean
    */
    touchesRegion(lX, rX, bY, tY){
        let x = this.getX();
        let width = this.getWidth();
        let lowerX = x - width / 2;
        let higherX = x + width / 2;
        let withinX = (lowerX >= lX && lowerX <= rX) || (higherX >= lX && higherX <= rX);
        
        let y = this.getY();
        let height = this.getHeight();
        let lowerY = y - height / 2;
        let higherY = y + height / 2;
        let withinY = (lowerY >= bY && lowerY <= tY) || (higherY >= bY && higherY <= tY);
        return withinX && withinY;
    }
}