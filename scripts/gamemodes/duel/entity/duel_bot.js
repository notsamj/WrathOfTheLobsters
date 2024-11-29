class DuelBot extends DuelCharacter {
    constructor(gamemode, model){
        super(gamemode, model);
        this.botDecisionDetails = {
            "state": "starting",
            "enemy": null,
            "select_slot": null,
            "weapons": {
                "sword": { 
                    "trying_to_swing_sword": false,
                    "trying_to_block": false
                }
            }
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
        if (this.botDecisionDetails["state"] === "starting"){
            this.pickAStartingWeapon();
        }

        // Run check before acting
        if (!this.canSee(this.getEnemy())){
            this.botDecisionDetails["state"] = "searching_for_enemy";
        }else{
            this.botDecisionDetails["state"] = "fighting_enemy";
        }

        // Act
        if (this.botDecisionDetails["state"] === "searching_for_enemy"){
            this.searchForEnemy();
        }else if (this.botDecisionDetails["state"] === "fighting_enemy"){
            this.makeFightingDecisions();
        }
    }

    getEnemy(){
        // If I've already saved the enemy in storage then just return it
        if (this.botDecisionDetails["enemy"] != null){
            return this.botDecisionDetails["enemy"];
        }

        // Otherwise search for it
        let participants = this.gamemode.getParticipants();
        for (let participant of participants){
            if (!participant.is(this)){
                this.botDecisionDetails["enemy"] = participant;
                return participant;
            }
        }

        throw new Error("DuelBot failed to find enemy.");
    }

    makeFightingDecisions(){
        // TODO: Movement and stuff
        // TODO: Determine other stuff
        let equippedWeaponType = "sword"; // TODO: Determine this (also maybe change weapons)

        if (equippedWeaponType === "sword"){
            this.makeAdvancedSwordDecisions();
        }
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

    makeAdvancedSwordDecisions(){
        let sword = this.getInventory().getSelectedItem();
        // Set default
        this.botDecisionDetails["weapons"]["sword"]["trying_to_swing_sword"] = false;
        this.botDecisionDetails["weapons"]["sword"]["trying_to_block"] = false;

        // TODO: Check if currently blocking

        // Don't make decisions mid-swing
        if (sword.isSwinging()){
            return;
        }
        let enemy = this.getEnemy();

        // TODO: Determine can I strike enemy with my sword
        // TODO: Determine can enemy strike me with their sword (if they are carrying one)

        // TODO: Make decisions based on this
        this.botDecisionDetails["weapons"]["sword"]["trying_to_block"] = true;
    }

    makeSwordDecisions(){
        let tryingToSwing = this.botDecisionDetails["weapons"]["sword"]["trying_to_swing_sword"];
        let tryingToBlock = this.botDecisionDetails["weapons"]["sword"]["trying_to_block"];
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