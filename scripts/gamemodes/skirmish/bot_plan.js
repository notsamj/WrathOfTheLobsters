/*  
    Class Name: BotPlan
    Class Description: Plan for a bot to perform action(s)
*/
class BotPlan {
    /*
        Method Name: constructor
        Method Parameters: 
            player:
                A player
            planDetails:
                JSON details about the plan
        Method Description: constructor
        Method Return: constructor
    */
    constructor(player, planDetails){
        this.player = player;
        this.planDetails = planDetails;
        this.generateRouteIfNeeded();
        this.delayLocks = [];
        this.finished = false;
    }

    /*
        Method Name: finishPlan
        Method Parameters: None
        Method Description: Finishes the plan
        Method Return: void
    */
    finishPlan(){
        this.finished = true;
    }

    /*
        Method Name: isFinished
        Method Parameters: None
        Method Description: Checks if the plan is finished
        Method Return: boolean
    */
    isFinished(){
        return this.finished;
    }

    /*
        Method Name: generateRouteIfNeeded
        Method Parameters: None
        Method Description: Generates a route if necessary
        Method Return: void
    */
    generateRouteIfNeeded(){
        let planType = this.planDetails["type"];
        // If this is a simple move then set the round
        if (planType === "shoot" || planType === "stab" || planType === "move_closer" || planType === "single_bush" || planType === "multi_bush" || planType === "explore" || planType === "move_to_friends"){
            this.planDetails["route"] = this.player.generateShortestRouteToPoint(this.planDetails["tile_x"], this.planDetails["tile_y"]);
        }
        // Else, if this is an cannon order, it may be preceded by a route
        else if (planType === "cannon_troops" || planType === "cannon_rock"){
            this.planDetails["route"] = this.player.generateShortestRouteToPoint(this.planDetails["attached_location"]["tile_x"], this.planDetails["attached_location"]["tile_y"]);
        }
        // Else if its a move/shoot order it may involve two routes
        else if (planType === "order_shoot" || planType === "order_move"){
            this.planDetails["select_route"] = this.player.generateShortestRouteToPoint(this.planDetails["select_location"]["tile_x"], this.planDetails["select_location"]["tile_y"]);
            // Route comes after select route
            this.planDetails["route"] = this.player.generateShortestRouteFromPointToPoint(this.planDetails["select_location"]["tile_x"], this.planDetails["select_location"]["tile_y"], this.planDetails["attached_location"]["tile_x"], this.planDetails["attached_location"]["tile_y"]);
            this.planDetails["has_selected"] = false;
        }
    }

    /*
        Method Name: getRoute
        Method Parameters: None
        Method Description: Gets the route
        Method Return: Route
    */
    getRoute(){
        return this.planDetails["route"];
    }

    /*
        Method Name: execute
        Method Parameters: 
            decisions:
                Decisions to execute (JSON)
        Method Description: Executes the plan
        Method Return: void
    */
    execute(decisions){
        if (this.isFinished()){
            return;
        }
        let updateFromMoveDecisions = (moveObj) => {
            let directions = ["up", "down", "left", "right"];
            for (let direction of directions){
                if (objectHasKey(moveObj, direction)){
                    decisions[direction] = moveObj[direction];
                    return true;
                }
            }
            return false;
        }

        let waveWhiteFlag = (decisions) => {
            // Swing the white flag
            decisions["trying_to_swing_sword"] = true;
        }

        let equipAnythingButOrderTool = (decisions) => {
            let inventory = this.player.getInventory();
            let items = inventory.getItems();
            let selectedItem = inventory.getSelectedItem();
            // If not holding a troop ordering tool then switch off it
            if (selectedItem instanceof PointToMove || selectedItem instanceof PointToShoot){
                let selectIndex = -1;
                // Find non-order-tool index
                for (let i = 0; i < items.length; i++){
                    let item = items[i];
                    if (!(item instanceof PointToMove || item instanceof PointToShoot)){
                        selectIndex = i;
                        break;
                    }
                }
                decisions["select_slot"] = selectIndex;
                return false;
            }
            return true;
        }

        let equipWhiteFlag = (decisions) => {
            let inventory = this.player.getInventory();
            let items = inventory.getItems();
            let selectedItem = inventory.getSelectedItem();
            // If not holding white flag -> equip it
            if (!(selectedItem instanceof WhiteFlag)){
                let whiteFlagIndex = -1;
                // Find white flag index
                for (let i = 0; i < items.length; i++){
                    let item = items[i];
                    if (item instanceof WhiteFlag){
                        whiteFlagIndex = i;
                        break;
                    }
                }
                decisions["select_slot"] = whiteFlagIndex;
                return false;
            }
            return true;
        }

        let equipSword = (decisions) => {
            let inventory = this.player.getInventory();
            let items = inventory.getItems();
            let selectedItem = inventory.getSelectedItem();
            // If not holding the sword -> equip it
            if (!(selectedItem instanceof Sword) || (selectedItem instanceof WhiteFlag)){
                let swordIndex = -1;
                // Find white flag index
                for (let i = 0; i < items.length; i++){
                    let item = items[i];
                    if ((item instanceof Sword) && !(item instanceof WhiteFlag)){
                        swordIndex = i;
                        break;
                    }
                }
                decisions["select_slot"] = swordIndex;
                return false;
            }
            return true;
        }

        let swingSword = (decisions) => {
            // Swing the sword
            decisions["trying_to_swing_sword"] = true;
        }

        let equipGun = (decisions) => {
            let inventory = this.player.getInventory();
            let items = inventory.getItems();
            let selectedItem = inventory.getSelectedItem();
            // If not holding the gun -> equip it
            if (!(selectedItem instanceof Gun)){
                let gunIndex = -1;
                // Find white flag index
                for (let i = 0; i < items.length; i++){
                    let item = items[i];
                    if (item instanceof Gun){
                        gunIndex = i;
                        break;
                    }
                }
                decisions["select_slot"] = gunIndex;
                return false;
            }

            return true;
        }

        let faceDirection = (decisions) => {
            let isFacingDirectionAlready = true;

            let playerDirection = getMovementDirectionOf(this.player.getFacingDirection());
            if (playerDirection != this.planDetails["direction_to_face"]){
                isFacingDirectionAlready = false;
                decisions[this.planDetails["direction_to_face"]] = true;
            }
            return isFacingDirectionAlready;
        }

        let equipCannon = (decisions) => {
            let inventory = this.player.getInventory();
            let items = inventory.getItems();
            let selectedItem = inventory.getSelectedItem();
            // If not holding the point to shoot cannon -> equip it
            if (!(selectedItem instanceof PointToShootCannon)){
                let desiredIndex = -1;
                // Find canno index
                for (let i = 0; i < items.length; i++){
                    let item = items[i];
                    if (item instanceof PointToShootCannon){
                        desiredIndex = i;
                        break;
                    }
                }
                decisions["select_slot"] = desiredIndex;
                return false;
            }
            return true;
        }


        let equipOrderToShoot = (decisions) => {
            let inventory = this.player.getInventory();
            let items = inventory.getItems();
            let selectedItem = inventory.getSelectedItem();
            // If not holding the point to shoot -> equip it
            if (!(selectedItem instanceof PointToShoot)){
                let desiredIndex = -1;
                // Find equipOrderToShoot index
                for (let i = 0; i < items.length; i++){
                    let item = items[i];
                    if (item instanceof PointToShoot){
                        desiredIndex = i;
                        break;
                    }
                }
                decisions["select_slot"] = desiredIndex;
                return false;
            }
            return true;
        }

        let equipOrderToMove = (decisions) => {
            let inventory = this.player.getInventory();
            let items = inventory.getItems();
            let selectedItem = inventory.getSelectedItem();
            // If not holding the equipOrderToMove -> equip it
            if (!(selectedItem instanceof PointToMove)){
                let desiredIndex = -1;
                // Find equipOrderToMove index
                for (let i = 0; i < items.length; i++){
                    let item = items[i];
                    if (item instanceof PointToMove){
                        desiredIndex = i;
                        break;
                    }
                }
                decisions["select_slot"] = desiredIndex;
                return false;
            }
            return true;
        }
        let planType = this.planDetails["type"];
        if (planType === "shoot"){
            // Delay before moving
            if (this.delay(0)){ return; }
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            // Delay after moving
            if (this.delay(1)){ return; }
            let alreadyFacing = faceDirection(decisions);
            if (!alreadyFacing){ return; }
            // Delay after changing direction
            if (this.delay(2)){ return; }
            let gunEquipped = equipGun(decisions);
            if (!gunEquipped){ return; }
            // Delay after equipping gun
            if (this.delay(3)){ return; }
            decisions["aiming_angle_rad"] = this.planDetails["angle_rad"];
            decisions["trying_to_aim"] = true;
            // Delay before order
            if (this.delay(4)){ return; }
            decisions["trying_to_shoot"] = true;
            this.finishPlan()
        }else if (planType === "stab"){
            let swordIsEquipped = equipSword(decisions);
            if (!swordIsEquipped){ return; }
            // Delay before moving
            if (this.delay(0)){ return; }
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            // Delay before facing
            if (this.delay(1)){ return; }
            let alreadyFacing = faceDirection(decisions);
            if (!alreadyFacing){ return; }
            // Delay before swinging
            if (this.delay(2)){ return; }
            swingSword(decisions);
            this.finishPlan()
        }else if (planType === "move_closer" || planType === "explore" || planType === "single_bush" || planType === "multi_bush" || planType === "move_to_friends"){
            // Delay before moving
            if (this.delay(0)){ return; }
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            // Delay before swinging
            if (this.delay(1)){ return; }
            let whiteFlagIsEquipped = equipWhiteFlag(decisions);
            if (!whiteFlagIsEquipped){ return; }
            waveWhiteFlag(decisions);
            this.finishPlan()
        }else if (planType === "cannon_rock" || planType === "cannon_troops"){
            // Delay before moving
            if (this.delay(0)){ return; }
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            // Delay before equipping
            if (this.delay(1)){ return; }
            let hasEquippedCannon = equipCannon(decisions);
            if (!hasEquippedCannon){ return; }
            // Delay before shooting
            if (this.delay(2)){ return; }
            decisions["crosshair_center_x"] = this.planDetails["cannon_center_x"];
            decisions["crosshair_center_y"] = this.planDetails["cannon_center_y"];
            decisions["new_crosshair_center"] = true;
            // Delay before order
            if (this.delay(3)){ return; }
            decisions["trying_to_shoot"] = true;
            this.finishPlan()
        }else if (planType === "order_shoot"){
            // Swap out of the order first to so you can select new troops later
            if (!this.planDetails["has_swapped"]){
                equipAnythingButOrderTool(decisions);
                this.planDetails["has_swapped"] = true;
                return;
            }
            if (!this.planDetails["has_selected"]){
                // Delay before moving
                if (this.delay(0)){ return; }
                let moving = updateFromMoveDecisions(this.planDetails["select_route"].getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
                if (moving){ return; }
                // Delay before equipping
                if (this.delay(1)){ return; }
                let hasEquippedOrderToShoot = equipOrderToShoot(decisions);
                if (!hasEquippedOrderToShoot){ return; }
                this.planDetails["has_selected"] = true;
            }
            // Delay before moving
            if (this.delay(2)){ return; }
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            // Delay before shooting
            if (this.delay(3)){ return; }
            decisions["crosshair_center_x"] = this.planDetails["x"];
            decisions["crosshair_center_y"] = this.planDetails["y"];
            decisions["new_crosshair_center"] = true;
            // Delay before order
            if (this.delay(4)){ return; }
            decisions["trying_to_shoot"] = true;
            this.finishPlan()
        }else if (planType === "order_move"){
            // Swap out of the order first to so you can select new troops later
            if (!this.planDetails["has_swapped"]){
                equipAnythingButOrderTool(decisions);
                this.planDetails["has_swapped"] = true;
                return;
            }
            if (!this.planDetails["has_selected"]){
                // Delay before moving
                if (this.delay(0)){ return; }
                let moving = updateFromMoveDecisions(this.planDetails["select_route"].getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
                if (moving){ return; }
                // Delay before equipping
                if (this.delay(1)){ return; }
                let hasEquippedOrderToMove = equipOrderToMove(decisions);
                if (!hasEquippedOrderToMove){ return; }
                this.planDetails["has_selected"] = true;
            }
            // Delay before moving to final location
            if (this.delay(2)){ return; }
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            // Delay before preparing order
            if (this.delay(3)){ return; }
            decisions["move_tile_x"] = this.planDetails["tile_x"];
            decisions["move_tile_y"] = this.planDetails["tile_y"];
            decisions["new_move_tile"] = true;
            // Delay before order
            if (this.delay(4)){ return; }
            decisions["trying_to_move_troops"] = true;
            this.finishPlan()
        }else{
            throw new Error("Invalid plan type");
        }
    }

    /*
        Method Name: delay
        Method Parameters: 
            id:
                Delay id
        Method Description: Checks if delayed
        Method Return: boolean
    */
    delay(id){
        // Check for invalid id
        if (id > this.delayLocks.length){
            throw new Error("Unexpected id");
        }
        // If id is only 1 more than its fine
        if (id > this.delayLocks.length - 1){
            let tickDelay = Math.ceil(WTL_GAME_DATA["bot"]["delay_ms"] / calculateMSBetweenTicks());
            let tickLock = new TickLock(tickDelay);
            tickLock.lock();
            this.delayLocks.push(tickLock);
            return true;
        }
        let tickLock = this.delayLocks[id];
        tickLock.tick();
        return tickLock.isLocked();
    }
}