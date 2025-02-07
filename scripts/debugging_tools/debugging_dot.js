class DebuggingDot {
    constructor(colourCode, x, y, radius){
        this.colourCode = colourCode;
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    display(scene, lX, rX, bY, tY){
        if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
        let screenX = scene.getDisplayX(this.x, 0, lX, false);
        let screenY = scene.getDisplayY(this.y, 0, bY, false);
        let colour = Colour.fromCode(this.colourCode);
        noStrokeCircle(colour, screenX, screenY, this.radius*2*gameZoom);
    }

    setColourCode(newColourCode){
        this.colourCode = newColourCode;
    }

    setX(x){
        this.x = x;
    }

    getX(){
        return this.x;
    }

    setY(y){
        this.y = y;
    }

    getY(){
        return this.y;
    }

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