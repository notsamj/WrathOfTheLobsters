/*
    Class Name: SimpleComponent
    Description: A simple component
*/
class SimpleComponent extends Component {
    /*
        Method Name: constructor
        Method Parameters: 
            displayFunc:
                A function to call when displayed
        Method Description: constructor
        Method Return: constructor
    */
    constructor(displayFunc){
        super();
        this.displayFunc = displayFunc;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays by calling the stored display func
        Method Return: void
    */
    display(){
        this.displayFunc();
    }
}