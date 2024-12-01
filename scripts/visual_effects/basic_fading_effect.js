class BasicFadingEffect {
    constructor(){
    }

    // "ground", "air", ...?
    getYCategory(){ throw new Error("Expect this to be overridden."); }

    display(scene, lX, rX, bY, tY){
    	throw new Error("Expect this to be overridden.");
        //if (!this.touchesRegion(lX, rX, bY, tY)){ return; }
    }

    touchesRegion(lX, rX, bY, tY){
    	throw new Error("Expect this to be overridden.");
    }

    isExpired(){
    	throw new Error("Expect this to be overridden.");
    }
}