class TemporaryOperatingData {
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

    findObj(dataKeyStr){
        let index = this.dataList.search({"data_key_str": dataKeyStr});
        if (index === -1){
            throw new Error("Unknown data key: " + dataKeyStr);
        }
        return this.dataList.get(index);
    }

    has(dataKeyStr){
        return this.dataList.search({"data_key_str": dataKeyStr}) != -1;
    }

    getObjCareful(dataKeyStr){
        let index = this.dataList.search({"data_key_str": dataKeyStr});
        if (index === -1){
            return null;
        }
        return this.dataList.get(index);
    }

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

    get(dataKeyStr){
        return this.findObj(dataKeyStr)["data_value"];
    }
}