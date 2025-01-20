class RotatingStaticImage extends StaticImage {
    constructor(initialImageName, x, y, imageSelection, maxWidth=null, maxHeight=null){
        super(IMAGES[initialImageName], x, y, maxWidth, maxHeight);
        this.imageSelection = imageSelection;
        this.imageIndex = this.findImageIndex(initialImageName);
    }

    getImageIndex(){
        return this.imageIndex;
    }

    getImageName(){
        return this.imageSelection[this.imageIndex];
    }

    findImageIndex(imageName){
        for (let i = 0; i < this.imageSelection.length; i++){
            if (this.imageSelection[i] === imageName){
                return i;
            }
        }
        throw new Error("Failed to find image.");
    }

    clicked(){
        this.imageIndex = (this.imageIndex + 1) % this.imageSelection.length;
        this.setImage(IMAGES[this.imageSelection[this.imageIndex]]);
    }
}