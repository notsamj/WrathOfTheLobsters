// TODO: Comments
class SimpleComponent extends Component {
    constructor(displayFunc){
        super();
        this.displayFunc = displayFunc;
    }

    display(){
        this.displayFunc();
    }
}