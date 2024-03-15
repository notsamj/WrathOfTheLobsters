class VisualItem {
    constructor(scene, width=PROGRAM_SETTINGS["general"]["tile_size"], height=PROGRAM_SETTINGS["general"]["tile_size"]){
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }

    getWidth(){
        return this.width;
    }

    getHeight(){
        return this.height;
    }

    getX(){
        return this.x;
    }

    getY(){
        return this.y;
    }

    getCenterX(){
        return this.getX();
    }

    getCenterY(){
        return this.getY();
    }

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