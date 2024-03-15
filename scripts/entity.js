class Entity extends VisualItem {
    constructor(width=PROGRAM_SETTINGS["general"]["tile_size"], height=PROGRAM_SETTINGS["general"]["tile_size"]){
        super(width, height);
        this.id = null;
    }

    setID(id){
        this.id = id; 
    }

    getID(){
        return this.id;
    }

    tick(){}
}