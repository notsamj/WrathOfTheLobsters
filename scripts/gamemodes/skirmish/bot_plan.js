class BotPlan {
    constructor(player, planDetails){
        this.player = player;
        this.planDetails = planDetails;
        this.generateRouteIfNeeded();
    }

    generateRouteIfNeeded(){
        let planType = this.planDetails["type"];
        // If this is a simple move then set the round
        if (planType === "shoot" || planType === "stab" || planType === "move_closer" || planType === "single_bush" || planType === "multi_bush"){
            this.planDetails["route"] = this.player.generateShortestRouteToPoint(this.planDetails["tile_x"], this.planDetails["tile_y"]);
        }
        // Else, if this is an order, it may be preceded by a route
        else if (planType === "order_shoot" || planType === "order_move" || planType === "cannon_troops" || planType === "cannon_rock"){
            this.planDetails["route"] = this.player.generateShortestRouteToPoint(this.planDetails["attached_closer_tile"]["tile_x"], this.planDetails["attached_closer_tile"]["tile_y"]);
        }
    }

    getRoute(){
        return this.planDetails["route"];
    }

    execute(decisions){
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
                return;
            }

            // Swing the white flag
            decisions["trying_to_swing_sword"] = true;
        }

        let swingSword = (decisions) => {
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
                return;
            }

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

            let playerDirection = getAlternativeDirectionFormatOf(this.player.getFacingDirection());
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

        if (this.planDetails["type"] === "shoot"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            let alreadyFacing = faceDirection(decisions);
            if (!alreadyFacing){ return; }
            let gunEquipped = equipGun(decisions);
            if (!gunEquipped){ return; }
            decisions["aiming_angle_rad"] = this.planDetails["angle_rad"];
            decisions["trying_to_aim"] = true;
            decisions["trying_to_shoot"] = true;
        }else if (this.planDetails["type"] === "stab"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            let alreadyFacing = faceDirection(decisions);
            if (!alreadyFacing){ return; }
            swingSword(decisions);
        }else if (this.planDetails["type"] === "move_closer"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            waveWhiteFlag(decisions);
        }else if (this.planDetails["type"] === "single_bush"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            waveWhiteFlag(decisions);
        }else if (this.planDetails["type"] === "multi_bush"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            waveWhiteFlag(decisions);
        }else if (this.planDetails["type"] === "cannon_rock"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            let hasEquippedCannon = equipCannon(decisions);
            if (!hasEquippedCannon){ return; }
            decisions["crosshair_center_x"] = this.planDetails["cannon_center_x"];
            decisions["crosshair_center_y"] = this.planDetails["cannon_center_y"];
            decisions["new_crosshair_center"] = true;
            decisions["trying_to_shoot"] = true;
        }else if (this.planDetails["type"] === "cannon_troops"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            let hasEquippedCannon = equipCannon(decisions);
            if (!hasEquippedCannon){ return; }
            decisions["crosshair_center_x"] = this.planDetails["cannon_center_x"];
            decisions["crosshair_center_y"] = this.planDetails["cannon_center_y"];
            decisions["new_crosshair_center"] = true;
            decisions["trying_to_shoot"] = true;
        }else if (this.planDetails["type"] === "order_shoot"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            let hasEquippedOrderToShoot = equipOrderToShoot(decisions);
            if (!hasEquippedOrderToShoot){ return; }
            decisions["crosshair_center_x"] = this.planDetails["x"];
            decisions["crosshair_center_y"] = this.planDetails["y"];
            decisions["new_crosshair_center"] = true;
            decisions["trying_to_shoot"] = true;
        }else if (this.planDetails["type"] === "order_move"){
            let moving = updateFromMoveDecisions(this.getRoute().getDecisionAt(this.player.getTileX(), this.player.getTileY())) || this.player.isMoving();
            if (moving){ return; }
            let hasEquippedOrderToMove = equipOrderToMove(decisions);
            if (!hasEquippedOrderToMove){ return; }
            decisions["move_tile_x"] = this.planDetails["tile_x"];
            decisions["move_tile_y"] = this.planDetails["tile_y"];
            decisions["new_move_tile"] = true;
            decisions["trying_to_move_troops"] = true;
        }
    }
}