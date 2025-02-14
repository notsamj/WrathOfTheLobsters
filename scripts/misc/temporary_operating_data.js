/*
    Class Name: TemporaryOperatingData
    Class Description: Temporary data storage
*/
class TemporaryOperatingData {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        let comparisonFunction = (jsonObj1, jsonObj2) => {
            let string1 = jsonObj1["data_key_str"];
            let string2 = jsonObj2["data_key_str"];
            if (string1 > string2){
                return 1;
            }else if (string2 > string1){
                return -1;
            }else{
                return 0;
            }
        }
        this.dataList = new NotSamSortedArrayList(comparisonFunction);
    }

    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Clears all data
        Method Return: void
    */
    clear(){
        this.dataList.clear();
    }

    /*
        Method Name: findObj
        Method Parameters: 
            dataKeyStr:
                The key of the data
        Method Description: Finds the data object
        Method Return: JSON
    */
    findObj(dataKeyStr){
        let index = this.dataList.search({"data_key_str": dataKeyStr});
        if (index === -1){
            throw new Error("Unknown data key: " + dataKeyStr);
        }
        return this.dataList.get(index);
    }

    /*
        Method Name: has
        Method Parameters: 
            dataKeyStr:
                The key of the data
        Method Description: Checks if a key is present
        Method Return: boolean
    */
    has(dataKeyStr){
        return this.dataList.search({"data_key_str": dataKeyStr}) != -1;
    }

    /*
        Method Name: getObjCareful
        Method Parameters: 
            dataKeyStr:
                The key of the data
        Method Description: Gets a data JSON with a matching key
        Method Return: JSON or null
    */
    getObjCareful(dataKeyStr){
        let index = this.dataList.search({"data_key_str": dataKeyStr});
        if (index === -1){
            return null;
        }
        return this.dataList.get(index);
    }

    /*
        Method Name: set
        Method Parameters: 
            dataKeyStr:
                The key of the data
            dataValue:
                Data value
        Method Description: Sets a data value
        Method Return: void
    */
    set(dataKeyStr, dataValue){
        let dataJSON = this.getObjCareful(dataKeyStr);
        // If not found
        if (dataJSON === null){
            this.dataList.push({"data_key_str": dataKeyStr, "data_value": dataValue});
        }else{
            // It's found
            dataJSON["data_value"] = dataValue;
        }
    }

    /*
        Method Name: get
        Method Parameters: 
            dataKeyStr:
                The key of the data
        Method Description: Finds a data value
        Method Return: variable
    */
    get(dataKeyStr){
        return this.findObj(dataKeyStr)["data_value"];
    }
}