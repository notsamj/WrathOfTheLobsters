class DuelBot extends DuelCharacter {
    constructor(gamemode, model){
        super(gamemode, model);
        this.botDecisionDetails = {
            "state": "starting",
            "select_slot": null
        }
    }

    resetBotDecisions(){
        this.botDecisionDetails["select_slot"] = null;
    }
    
    makeDecisions(){
        this.resetDecisions();
        this.resetBotDecisions();
        this.botDecisions();
        this.makeMovementDecisions();
        this.inventory.makeDecisions();
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }
    }

    botDecisions(){
        let state = this.botDecisionDetails["state"];

        // Set loop condition to true while deciding
        let stillDeciding = true;

        let updateStillDeciding = () => {
            stillDeciding = false;
        }
            
        // Keep making decisions until you are certain you're done
        while (stillDeciding){
            if (state === "starting"){
                this.pickAStartingWeapon();
            }else if (state === "searching_for_enemy"){
                this.searchForEnemy();
            }else if (state === "fighting_enemy"){
                this.makeFightingDecisions();
            }
            updateStillDeciding();
        }
    }

    makeFightingDecisions(){
        // TODO: Check if no longer see enemy -> if that is no longer the case -> go back to searching for enemy
    }

    searchForEnemy(){
        // Check if you can see the enemy otherwise move around

        // TODO: Check if enemy is visible -> if so then switch to fighting_enemy

        // TODO: Add moving
    }

    pickAStartingWeapon(){
        // Prepare for next state
        this.botDecisionDetails["state"] = "searching_for_enemy";

        // Pick a weapon and set the decision for selected slot to get it
        let inventory = this.getInventory();
        let numberOfWeapons = inventory.getNumberOfContents();

        // If we are holding the only weapon or there are no weapons
        if (numberOfWeapons === 0){ return; }
        if (numberOfWeapons === 1 && inventory.hasSelectedItem()){ return; }

        // Else if there is one weapon not equipped
        let inventoryList = inventory.getItems();
        if (numberOfWeapons === 1){
            for (let i = 0; i < inventoryList.length; i++){
                let item = inventoryList[i];
                if (item != null){
                    this.botDecisionDetails["select_slot"] = i;
                    return;
                }
            }
        }

        // Else determine which on to pick (TODO)
    }

    makeInventoryDecisions(){
        // Reset
        this.amendDecisions({
            "select_slot": this.inventory.getSelectedSlot(),
        });
        let newSlot = this.botDecisionDetails["select_slot"];
        if (newSlot === null){ return; }
        if (newSlot === this.selectedSlot){ return; }

        this.amendDecisions({
            "select_slot": newSlot
        });
    }

    makeSwordDecisions(){
        let tryingToSwing = false;
        let tryingToBlock = false;
        this.amendDecisions({
            "trying_to_swing_sword": tryingToSwing,
            "trying_to_block": tryingToBlock
        });
    }

    isHuman(){return true;}

    makePistolDecisions(){
        let tryingToAim = false;
        let tryingToShoot = false;
        let tryingToReload = false;
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": 0
        });
    }

    makeMusketDecisions(){
        let tryingToAim = false;
        let tryingToShoot = false;
        let togglingBayonetEquip = false;
        let tryingToReload = false;
        let tryingToStab = false;
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "toggling_bayonet_equip": togglingBayonetEquip,
            "trying_to_reload": tryingToReload,
            "trying_to_stab": tryingToStab,
            "aiming_angle_rad": this.getGunHoldingAngleRAD()
        });
    }

    makeMovementDecisions(){
        this.decisions["up"] = false;
        this.decisions["down"] = false;
        this.decisions["left"] = false;
        this.decisions["right"] = false;
        this.decisions["sprint"] = false;
    }

    isHuman(){ return false; }
}