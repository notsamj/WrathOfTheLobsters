class LoadingScreenComponent extends Component {
    constructor(allowMovement=true){
        super();
        this.allowMovement = allowMovement;
    }
    display(){
        LOADING_SCREEN.display(this.allowMovement);
    }
}