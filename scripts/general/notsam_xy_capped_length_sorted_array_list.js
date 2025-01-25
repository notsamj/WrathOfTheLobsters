class NotSamXYCappedLengthSortedArrayList extends NotSamXYSortedArrayList {
    constructor(maxLength, size=1, size_inc=(size) => size * 2){
        super(size, size_inc);
        this.maxLength = maxLength;
    }

    getMaxLength(){
        return this.maxLength;
    }

    set(x, y, value){
        // If this set will force an expansion then -> clear then set
        if (!this.has(x, y) && this.getLength() === this.getMaxLength()){
            this.clear();
        }
        super.set(x, y, value);
    }
}