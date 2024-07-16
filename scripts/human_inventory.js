class HumanInventory extends Inventory {
    checkChangeSelectedSlot(){
        let newSlot = this.selectedSlot;
        if (USER_INPUT_MANAGER.isActivated("1_ticked")){
            newSlot = 0;
        }else if (USER_INPUT_MANAGER.isActivated("2_ticked")){
            newSlot = 1;
        }else if (USER_INPUT_MANAGER.isActivated("3_ticked")){
            newSlot = 2;
        }else if (USER_INPUT_MANAGER.isActivated("4_ticked")){
            newSlot = 3;
        }else if (USER_INPUT_MANAGER.isActivated("5_ticked")){
            newSlot = 4;
        }else if (USER_INPUT_MANAGER.isActivated("6_ticked")){
            newSlot = 5;
        }else if (USER_INPUT_MANAGER.isActivated("7_ticked")){
            newSlot = 6;
        }else if (USER_INPUT_MANAGER.isActivated("8_ticked")){
            newSlot = 7;
        }else if (USER_INPUT_MANAGER.isActivated("9_ticked")){
            newSlot = 8;
        }else if (USER_INPUT_MANAGER.isActivated("0_ticked")){
            newSlot = 9;
        }

        if (newSlot == this.selectedSlot){
            return;
        }

        if (this.hasSelectedItem()){
            this.getItemAtSelectedSlot().deselect();
        }
        this.selectedSlot = newSlot;
        if (this.hasSelectedItem()){
            this.getItemAtSelectedSlot().select();
        }
    }
}