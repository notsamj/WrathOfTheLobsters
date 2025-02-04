class GentlemanlyDuelBot extends DuelCharacter {
    constructor(gamemode, model, extraDetails, botExtraDetails){
        super(gamemode, model, extraDetails);
        this.perception = new BotPerception(this, Math.ceil(botExtraDetails["reaction_time_ms"] / calculateMSBetweenTicks()));
        this.disabled = botExtraDetails["disabled"];
        this.randomEventManager = new RandomEventManager(this.getRandom());
        this.temporaryOperatingData = new TemporaryOperatingData();
        this.botDecisionDetails = {
            "enemy": null,
            "state_data": null,
            "decisions": {
                "weapons": {
                    "gun": {
                        "trying_to_aim": false,
                        "trying_to_shoot": false,
                        "trying_to_reload": false
                    }
                }
            }
        }
    }

    drawGunCrosshair(gun, lX, bY){
        let enemy = this.getEnemy();

        let enemyX = enemy.getInterpolatedTickCenterX();
        let enemyY = enemy.getInterpolatedTickCenterY();

        let humanCenterX = this.getInterpolatedTickCenterX();
        let humanCenterY = this.getInterpolatedTickCenterY();

        let distance = Math.sqrt(Math.pow(enemyX - humanCenterX, 2) + Math.pow(enemyY - humanCenterY, 2));
        let swayedAngleRAD = gun.getSwayedAngleRAD();

        let crosshairCenterX = Math.cos(swayedAngleRAD) * distance + humanCenterX;
        let crosshairCenterY = Math.sin(swayedAngleRAD) * distance + humanCenterY;

        let x = this.getScene().getDisplayXOfPoint(crosshairCenterX, lX);
        let y = this.getScene().getDisplayYOfPoint(crosshairCenterY, bY);
        let crosshairImage = IMAGES["crosshair"];
        let crosshairWidth = crosshairImage.width;
        let crosshairHeight = crosshairImage.height;
        
        translate(x, y);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(crosshairImage, -1 * crosshairWidth / 2, -1 * crosshairHeight / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * x, -1 * y);
    }

    getEnemyID(){
        return this.getEnemy().getID();
    }

    isDisabled(){
        return this.disabled;
    }

    getDataToReactTo(dataKey){
        return this.perception.getDataToReactTo(dataKey, this.getCurrentTick());
    }

    hasDataToReactTo(dataKey){
        return this.perception.hasDataToReactTo(dataKey, this.getCurrentTick());
    }

    inputPerceptionData(dataKey, dataValue){
        this.perception.inputData(dataKey, dataValue, this.getCurrentTick());
    }

    tick(){
        if (this.isDead()){ return; }
        this.perceieve();
        super.tick();
    }

    perceieve(){
        let duelStarted = false;
        this.inputPerceptionData("duel_started", duelStarted);
        
    }

    resetBotDecisions(){
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"] = false;
        this.botDecisionDetails["decisions"]["weapons"]["gun"]["cancel_reload"] = false;
    }
    
    makeDecisions(){
        if (this.getGamemode().isOver()){ return; }
        if (this.isDisabled()){ return; }
        // Reset then make bot decisions
        this.resetBotDecisions();
        this.botDecisions();

        // Reset then make decisions (based on bot decisions)
        this.resetDecisions();
        this.makeMovementDecisions();
        this.inventory.makeDecisions();
        // Make decisions foe held item
        if (this.inventory.hasSelectedItem()){
            this.inventory.getSelectedItem().makeDecisions();
        }
    }

    botDecisions(){
        // Execute state decisions
        this.engageInDuel();
    }

    actOnDecisions(){
        if (this.getGamemode().isOver()){ return; }
        super.actOnDecisions();
    }

    engageInDuel(){
        // TODO
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

    getRandom(){
        return this.gamemode.getRandom();
    }

    makeInventoryDecisions(){
        // Reset
        this.amendDecisions({
            "select_slot": this.inventory.getSelectedSlot(),
        });
        let newSlot = this.botDecisionDetails["decisions"]["select_slot"];
        if (newSlot === null){ return; }
        if (newSlot === this.selectedSlot){ return; }

        this.amendDecisions({
            "select_slot": newSlot
        });
    }

    getRandomEventManager(){
        return this.randomEventManager;
    }

    makePistolDecisions(){
        let tryingToAim = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_aim"];
        let tryingToShoot = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_shoot"];
        let tryingToReload = this.botDecisionDetails["decisions"]["weapons"]["gun"]["trying_to_reload"];
        let tryingToCancelReload = this.botDecisionDetails["decisions"]["weapons"]["gun"]["cancel_reload"];
        let aimingAngleRAD = this.botDecisionDetails["decisions"]["weapons"]["gun"]["aiming_angle_rad"];
        this.amendDecisions({
            "trying_to_aim": tryingToAim,
            "trying_to_shoot": tryingToShoot,
            "trying_to_reload": tryingToReload,
            "aiming_angle_rad": aimingAngleRAD,
            "cancel_reload": tryingToCancelReload
        });
    }

    isHuman(){ return false; }
}