class ScrollBar extends Component {
    constructor(xFunction, yFunction, width, minHeight, sliderHeight, maxHeightFunction, entryYSize, entryYSpaceFunction, backgroundColourCode, sliderColourCode){
        super();
        this.xFunction = xFunction;
        this.yFunction = yFunction;
        this.width = width;
        this.minHeight = minHeight;
        this.sliderHeight = sliderHeight;
        this.maxHeightFunction = maxHeightFunction;
        this.backgroundColour = Colour.fromCode(backgroundColourCode);
        this.sliderColour = Colour.fromCode(sliderColourCode);
        this.sliderProgress = 0; // [0,1]
        this.entryYSize = entryYSize;
        this.numEntries = 0;
        this.entryYSpaceFunction = entryYSpaceFunction;
        this.scrollWheelMultiplier = WTL_GAME_DATA["menu"]["menus"]["gamemode_viewer_menu"]["scrollable_display"]["scroll_bar"]["wheel_multiplier"];
    }

    getMinHeight(){
        return this.minHeight;
    }

    getMaxEntries(){
        let maxPositions = 1 + this.getMinHeight() - this.getSliderHeight();
        return maxPositions;
    }

    increaseNumEntries(amount=1){
        this.numEntries += amount;
        if (this.numEntries > this.getMaxEntries()){
            debugger;
            throw new Error("Too many entries!");  
        }
    }

    getYOffsetOf(index){
        let sliderProgress = this.getSliderProgress();
        let fullYRange = this.getYRange();
        let offsetOfScreen = sliderProgress * fullYRange;
        let offsetOfIndex = index * this.entryYSize;

        return offsetOfIndex - offsetOfScreen;
    }

    covers(mouseX, mouseY){
        let displayHeight = this.getHeight();
        let displayWidth = this.getWidth();

        let x = this.getX();
        let y = this.getY();
        let inX = mouseX >= x && gMouseX < x + displayWidth;
        let inY = mouseX >= y && gMouseY < y + displayHeight;
        return inX && inY;
    }

    tick(){
        let hasMouseOn = this.covers(gMouseX, gMouseY);
        let activated = GENERAL_USER_INPUT_MANAGER.isActivated("scroll_bar_grab");
        // If they clicked on the bar
        if (activated && hasMouseOn){ 
            // Sliding
            this.moveToY(gMouseY);
        }else{
            let scrollValue = GENERAL_USER_INPUT_MANAGER.get("scroll_in_dir").getValue();
            if (scrollValue != 0){
                this.moveByScrollValue(scrollValue);
            }
        }
    }

    moveByScrollValue(scrollValue){
        let currentOffset = this.getSliderOffset();
        let newOffset = currentOffset + this.scrollWheelMultiplier * scrollValue;
        let scrollBarHeight = this.getHeight();
        let scrollBarHeightDiff = scrollBarHeight - this.getSliderHeight();
        let newSliderPogress = newOffset / scrollBarHeightDiff;
        this.sliderProgress = Math.max(0, Math.min(1, newSliderPogress));
    }

    moveToY(mouseY){
        let desiredCenterY = gMouseY - this.getY();
        let desiredOffset = desiredCenterY - this.getSliderHeight()/2;
        let scrollBarHeightDiff = this.getHeight() - this.getSliderHeight();
        let newProgress = desiredOffset / scrollBarHeightDiff;
        this.sliderProgress = Math.max(0, Math.min(1, newProgress));
    }

    getSliderProgress(){
        return this.sliderProgress;
    }

    getNumEntries(){
        return this.numEntries;
    }

    getYRange(){
        return (this.getNumEntries() - 1) * this.getEntryYSize();
    }

    getVisibleEntriesIndicesRange(){
        let screenYRegionSize = getScreenHeight() - 2 * this.getEntryYSize();
        let sliderProgress = this.getSliderProgress();
        let fullYRange = this.getYRange();

        let offset = sliderProgress * fullYRange;
        let startIndex = Math.ceil(offset / this.entryYSize);
        let endIndex = Math.min(this.getNumEntries()-1, Math.floor((offset + screenYRegionSize) / this.entryYSize));
        return {
            "start_index": startIndex,
            "end_index": endIndex
        }
    }

    getEntryYSize(){
        return this.entryYSize;
    }

    getSliderHeight(){
        return this.sliderHeight;
    }

    getSliderOffset(){
        let scrollBarHeight = this.getHeight();
        let scrollBarHeightDiff = scrollBarHeight - this.getSliderHeight();
        return Math.floor(this.getSliderProgress() * scrollBarHeightDiff);
    }

    getWidth(){
        return this.width;
    }

    getX(){
        return this.xFunction(getScreenWidth());
    }

    getY(){
        return this.yFunction(getScreenHeight());
    }

    getHeight(){
        return Math.max(this.minHeight, this.maxHeightFunction(getScreenHeight()));
    }

    display(){
        // Display the background
        let displayHeight = this.getHeight();
        let displayWidth = this.getWidth();

        let x = this.getX();
        let y = this.getY();
        noStrokeRectangle(this.backgroundColour, x, y, displayWidth, displayHeight);

        // Display the slider
        let slideHeight = this.getSliderHeight();
        let sliderOffset = this.getSliderOffset();
        noStrokeRectangle(this.sliderColour, x, y+sliderOffset, displayWidth, slideHeight);
    }
}