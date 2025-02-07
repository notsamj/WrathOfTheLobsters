const DATA_TILE_SIZE = 64;
const WTL_GAME_DATA = {
    "default_settings": {
        "duel": {
            "participants": [
                {
                    "human": true,
                    "model": "british_officer",
                    "swords": [], // "cavalry_sword", "cleaver"
                    "pistols": [], // "flintlock"
                    "muskets": [], // "brown_bess"
                    "extra_details": {
                        "invincible": false,
                        "sway_compensation_ability": 0.3 // 0.2 -> 20% reduction in gun sway
                    },
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 0
                    }
                },
                {
                    "human": false,
                    "model": "usa_officer",
                    "swords": [],
                    "pistols": [],
                    "muskets": [],
                    "extra_details": {
                        "invincible": false,
                        "sway_compensation_ability": 0.3 // 20% reduction in gun sway
                    },
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 0
                    }
                }
            ],
            "seed": null,
            "preset_data": null
        },
        "gentlemanly_duel": {
            "participants": [
                {
                    "human": true,
                    "model": "british_officer",
                    "pistols": ["flintlock"], // "flintlock"
                    "extra_details": {
                        "invincible": false,
                        "sway_compensation_ability": 0.1 // 0.2 -> 20% reduction in gun sway
                    },
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 150
                    }
                },
                {
                    "human": false,
                    "model": "usa_officer",
                    "pistols": ["flintlock"],
                    "extra_details": {
                        "invincible": false,
                        "sway_compensation_ability": 0.1 // 20% reduction in gun sway
                    },
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 250
                    }
                }
            ],
            "seed": null,
            "map_file_name": "tree_duel.json"
        }
    },
    "test_settings": {
        "duel": {
            "participants": [
                {
                    "human": true,
                    "model": "british_officer",
                    "swords": [], // "cavalry_sword", "cleaver"
                    "pistols": [], // "flintlock"
                    "muskets": [], // "brown_bess"
                    "extra_details": {
                        "invincible": false,
                        "sway_compensation_ability": 0.2 // 20% reduction in gun sway
                    },
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 1000
                    }
                },
                {
                    "human": false,
                    "model": "usa_officer",
                    "swords": [],
                    "pistols": [],
                    "muskets": [],
                    "extra_details": {
                        "invincible": false,
                        "sway_compensation_ability": 0.2 // 20% reduction in gun sway
                    },
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 50
                    }
                }
            ],
            "seed": null
        },

        "turn_based_skirmish": {
            "british_are_human": false,
            "americans_are_human": false
        }
    },

    "game_maker": {
        "server_ip": "localhost",
        "server_port": 8080,
        "bottom_menu_states": {
            "normal_materials": 0,
            "special_tiles": 1
        }
    },

    "loading_screen": {
        "far_away_multiplier": 2,
        "mesh_width": 8192/8,
        "mesh_height": 8192/8,
        "tile_width": 512,
        "tile_height": 512,
        "min_x_velocity": 1,
        "min_y_velocity": 1,
        "max_x_velocity": 2,
        "max_y_velocity": 2,
        "origin_x_range_size": 2500,
        "origin_y_range_size": 2500
    },

    "level_generator": {
        "camera": {
            "move_speed": DATA_TILE_SIZE*16  
        },
        "presets": [
            {
                "name": "oak_forest_1",
                "size": 100
            },
            {
                "name": "river_1",
                "size": 100
            }
        ]
    },

    "gentlemanly_duel": {
        "shot_damage": 1,
        "start_delay_ms": 500,
        "min_turn_delay_ms": 100,
        "max_turn_delay_ms": 1200,
        "ai": {
            "shoot_offset_sample_time_ms": 1000, // Time to sample the the sway to predict the maximum offset
            "shot_take_function_a_constant": 5, // 'a' constant for determine how long a bot expects to wait before firing a shot giving a hit probability
            "shot_take_function_b_constant": 0.1, // 'b' constant for determine how long a bot expects to wait before firing a shot giving a hit probability
            "max_expected_ms_to_hold_a_shot": 8000, // Will only hold a shot for up totwenty seconds 
            "good_shot_try_to_aim_delay_ms": 100, // Expected time to wait to start aiming when you have a good shot
            "aiming_precision_degrees": 3 // The number of degrees the bot is able to adjust between two angles when searching for targets
        },
        "gun_data": {
            "pistol_sway_acceleration_constant": 0.4,
            "flintlock": {
                "min_start_sway_deg": 10, // [0,360]
                "sway_max_angle_deg": 25, // [0,360] Maximum angle it can sway
                "max_sway_velocity_deg": 25, // Max degrees to sway in a second
                "sway_decline_a": 1.9, // 1 / [(x+b)^a]
                "sway_decline_b": 0.5, // 1 / [(x+b)^a]
                "maximum_random_sway_acceleration_deg": 9,  // Maximum Random sway acceleration deg/second^2
                "minimum_random_sway_acceleration_deg": 6.2, // Minimum Random sway acceleration deg/second^2
                "corrective_sway_acceleration_deg": 1.55, // Corrective sway acceleration deg/second^2
                "corrective_sway_acceleration_constant_c": 0.35, // Constant for slowing down based on angle offset
                "corrective_sway_acceleration_constant_d": 2.75 // Constant for slowing down based on angular velocity
            }
        }
    },

    "duel": {
        "theme_colour": "#5479ff",
        "area_size": 19, // 17?,
        "enemy_visibility_distance": 12, // 12
        "shot_damage": 0.75,
        "musket_stab_damage": 0.6,
        "max_seed": 100000, // Self-explanatory
        "seed": null,  // null for random seed, 24873 is good (on 10 size)
        "pistol_sway_acceleration_constant": 0.4,
        "musket_sway_acceleration_constant": 0.4,
        "camera": {
            "move_speed": DATA_TILE_SIZE*16  
        },
        "ai": {
            "can_hit_min_angle_range_deg": 10, // In order to consider a tile "hittable" it must have a sufficient range of angle that it can be hit from 
            "search_path_max_length": 15, // A path up to this length will be made when looking for the enemy. Once reached a new one will be made
            "estimated_melee_distance": Math.sqrt(2) + 0.1, // Distance in tiles at which melee combat is estimated to take place <= amount
            "regular_deflect_attempt_probability": 0.6, // [0,1] the proability that a bot will attempt to perform a regular deflect (as opposed to no deflect or stun deflect)
            "expected_swing_delay_ms": 150, // The bot has the ability to swing it's sword at the enemy. This is the expected delay used to calculate probability of swing attmempt per tick
            "adjust_close_duel_delay_ms": 500, // The bots are locked too close. Expected delay before making a pivot.
            "expected_adjacent_pivot_ms": 100, // The bots are probably diagonal to one another. They can hit but it's better to move closer
            "aiming_precision_degrees": 3, // The number of degrees the bot is able to adjust between two angles when searching for targets
            "shot_take_function_a_constant": 5, // 'a' constant for determine how long a bot expects to wait before firing a shot giving a hit probability
            "shot_take_function_b_constant": 0.1, // 'b' constant for determine how long a bot expects to wait before firing a shot giving a hit probability
            "max_expected_ms_to_hold_a_shot": 8000, // Will only hold a shot for up totwenty seconds 
            "stop_aiming_no_target_ms": 2000, // The bot is expected to stop aiming after some time if it cannot hit the enemy
            "good_shot_try_to_aim_delay_ms": 100, // Expected time to wait to start aiming when you have a good shot
            "sword_fight_min_stamina_preference": 0.6, // I would like to have 60% stamina available when I expect to start sword fighting
            "enemy_search_min_stamina_preference": 0.4, // I would like to have 20% stamina available when I am searching for enemies
            "positioning_for_shot_stamina_preference": 0.1, // I would like to have 10% stamina available when I am going to a spot to shoot an enemy
            "positioning_for_reload_stamina_preference": 0.3, // I would like to have 30% stamina available when I am going to a spot to shoot an enemy
            "min_stab_charge_distance": 4, // Minimum distance at which to charge
            "stab_range_close_multiplier": 10, // Multiplier, if dist(myCenter, enemyCenter) < multiplier * stabRange then start running calculations or hitting enemy
            "running_away_stamina_preference": 0, // Amount of stamina I care to keep remaining when running away
            "shoot_offset_sample_time_ms": 1000, // Time to sample the the sway to predict the maximum offset
            "shoot_tile_selection": {
                "shoot_tile_selection_x_start": 0.25, // x start for function 1 / x^f for biasing a random selection
                "shoot_tile_selection_x_end": 3, // x end for function 1 / x^f for biasing a random selection
                "shoot_tile_selection_f": 5, // f value for function 1 / x^f for biasing a random selection
                "from_me_route_mult": -1/15, // multiplier for shooting-tiles that are further from the bot
                "from_enemy_route_mult": 1/15 * 1, // multiplier for shooting-tiles that have a longer route from the enemy of the bot
                "from_enemy_mult": 1/64 * 1/21 * 0.25, // multiplier for shooting-tiles that are further from the enemy of the bot
                "angle_range_mult": 1/60, // multiplier for shooting-tiles that have a larger breadth which which to aim at an enemy
                "nearest_single_cover_mult": -1/15, // multiplier for shooting-tiles that are far from single cover
                "nearest_multi_cover_mult": -1/15, // multiplier for shooting-tiles that are far from mutli cover
                "nearest_physical_cover_mult": -1/15, // multiplier for shooting-tiles that are far from physical cover
                "multi_cover_search_route_distance": 4, // Max route distance when searching for multicover
                "single_cover_search_route_distance": 4, // Max route distance when searching for singlecover
                "physical_cover_search_route_distance": 4, // Max route distance when searching for physical cover
                "on_tile_multiplier": 1.5 // multiplier for reloading-tiles that are currently stood on
            },
            "reload_tile_selection": {
                "from_enemy_route_mult": 1/15 * 4, // multiplier for reloading-tiles that have a long route from the enemy
                "from_enemy_mult": 1/64 * 1/21 * 0.25, // multiplier for reloading-tiles that are far from the enemy
                "can_hit_mult": -1, // multiplier for reloading-tiles that can be hit by the enemy
                "angle_range_mult": -1/60 * 2, // multiplier for reloading-tiles that have a broad range of attack for the enemy
                "in_single_cover_mult": 6, // multiplier for reloading-tiles that are in single cover (far from the enemy)
                "in_multi_cover_mult": 1.5, // multiplier for reloading-tiles that are in multi cover that the enemy is not in
                "reload_tile_selection_x_start": 0.30, // x start value for function 1 / x^f for biasing a random selection
                "reload_tile_selection_x_end": 3, // x end value for function 1 / x^f for biasing a random selection
                "reload_tile_selection_f": 5, // f value for function 1 / x^f for biasing a random selection
                "on_tile_multiplier": 1.5 // multiplier for reloading-tiles that are currently stood on
            },
            "runaway_tile_selection": {
                "from_enemy_route_mult": 1/15 * 8, // multiplier for runaway-tiles that have a long route from the enemy
                "from_enemy_mult": 1/64 * 1/21 * 2, // multiplier for runaway-tiles that are far from the enemy
                "can_hit_mult": -1 * 2, // multiplier for runaway-tiles that can be hit by the enemy
                "angle_range_mult": -1/60 * 4, // multiplier for runaway-tiles that have a broad range of attack for the enemy
                "in_single_cover_mult": 6, // multiplier for runaway-tiles that are in single cover (far from the enemy)
                "in_multi_cover_mult": 1.5, // multiplier for runaway-tiles that are in multi cover that the enemy is not in
                "tile_selection_x_start": 0.35, // x start value for function 1 / x^f for biasing a random selection
                "tile_selection_x_end": 3, // x end value for function 1 / x^f for biasing a random selection
                "tile_selection_f": 5 // f value for function 1 / x^f for biasing a random selection
            }
        }
    },

    "human": {
        "stamina": {
            "max_stamina": 100,
            "stamina_recovery_time_ms": 8000,
            "sprinting_stamina_per_tile": 8
        },
        "look_time_ms": 150, // Time to hold down look key before starting to move in that direction
        "max_stun_time_ms": 1000 // Max time a character can be stunned
    },

    "stamina_bar": {
        "cooling_colour": "#ff212c",
        "threshold_3_colour": "#ff212c",
        "threshold_2_colour": "#ff7536",
        "threshold_1_colour": "#73e34b",
        "threshold_3": 0.2,
        "threshold_2": 0.4,
        "width": 120,
        "height": 40,
        "border_colour": "#000000",
        "border_thickness": 1,
        "recovery_delay_ms": 1000 // used 1000ms for a while
    },

    "health_bar": {
        "recovery_colour": "#590159",
        "threshold_3_colour": "#59010b",
        "threshold_2_colour": "#a10316",
        "threshold_1_colour": "#c9081f",
        "threshold_3": 0.2,
        "threshold_2": 0.4,
        "width": 651,
        "height": 5,
        "recovery_delay_ms": 1000 // used 1000ms for a while
    },

    "visual_effects": {
        "blood_generation": {
            "min_circles_per_blood_spatter": 15,
            "max_circles_per_blood_spatter": 25,
            "min_radius": 3,
            "max_radius": 6,
            "center_radius": 12,
            "blood_colour": "#6e160f",
            "blood_opacity": 1,
            "min_life_ms": 20000,
            "max_life_ms": 30000,
        },
        "blood_spray": {
            "min_circles": 15,
            "max_circles": 25,
            "min_radius": 1,
            "max_radius": 3,
            "center_radius": 12,
            "colour": "#6e160f",
            "opacity": 1,
            "min_life_ms": 500,
            "max_life_ms": 1000,
            "max_speed": 200 // px/second
        },
        "smoke_generation": {
            "min_circles_per_smoke_cloud": 15,
            "max_circles_per_smoke_cloud": 25,
            "min_radius": 6,
            "max_radius": 10,
            "center_radius": 25,
            "smoke_colour": "#ededeb",
            "smoke_opacity": 0.99,
            "min_life_ms": 2000, // 3000?
            "max_life_ms": 10000, // 10000?
            "max_speed": 0.5
        },

        "bullet_impact_generation": {
            "min_dirt_per_impact": 6,
            "max_dirt_per_impact": 7,
            "size": 4,
            "center_radius": 1,
            "dirt_colour": "#404040",
            "min_life_ms": 400,
            "max_life_ms": 600,
            "max_speed": 50
        },

        "sword_sparks": {
            "type": {
                "block": {
                    "min_sparks_per_impact": 3,
                    "max_sparks_per_impact": 5,
                    "size": 4,
                    "center_radius": 15,
                    /*"min_red": 0,
                    "max_red": 0,
                    "min_green": 255,
                    "max_green": 255,
                    "min_blue": 0,
                    "max_blue": 0,*/
                    "min_red": 230,
                    "max_red": 240,
                    "min_green": 168,
                    "max_green": 178,
                    "min_blue": 127,
                    "max_blue": 137,
                    "max_speed": 25
                },
                "deflect": {
                    "min_sparks_per_impact": 7,
                    "max_sparks_per_impact": 11,
                    "size": 3,
                    "center_radius": 12,
                    /*"min_red": 0,
                    "max_red": 0,
                    "min_green": 0,
                    "max_green": 0,
                    "min_blue": 255,
                    "max_blue": 255,*/
                    "min_red": 243,
                    "max_red": 252,
                    "min_green": 145,
                    "max_green": 155,
                    "min_blue": 84,
                    "max_blue": 94,
                    "max_speed": 35
                },
                "stun_deflect": {
                    "min_sparks_per_impact": 15,
                    "max_sparks_per_impact": 19,
                    "size": 2,
                    "center_radius": 10,
                    /*"min_red": 255,
                    "max_red": 255,
                    "min_green": 0,
                    "max_green": 0,
                    "min_blue": 0,
                    "max_blue": 0,*/
                    "min_red": 243,
                    "max_red": 252,
                    "min_green": 135,
                    "max_green": 145,
                    "min_blue": 74,
                    "max_blue": 44,
                    "max_speed": 35
                }
            },
            "min_life_ms": 400,
            "max_life_ms": 600
        },
    },

    "match_stats": {
        "max_rows_of_kills_to_display": 5,
        "text_size": 24,
        "kill_text_colour": "#ffffff"
    },

    "bot": {
        "rock_health_f_value": 1.5,
        "max_rock_value": 20,
        "friend_enemy_cannon_ratio": 5,
        "kill_to_damage_importance_ratio": 3,
        "plan_choosing_f": 5, // previously 1.2
        "plan_choosing_x_start": 0.25,
        "plan_choosing_x_end": 3,
        "unknown_enemy_position_confidence": 0.01, // Confidence that an enemy is at a given position when this enemy's position isn't known
        "multi_cover_friendly_occupied_weight": 0.1, // [0,1]
        "multi_cover_empty_weight": 0.5, // [0,1]
        "multi_cover_enemy_weight": 1, // [0,1]
        "unknown_enemy_health_assumption": 1,
        "delay_ms": 250, // 1500?
        "min_avg_route_to_friend_length_to_ignore": 5, // in tiles 
        "weights": {
            "shoot": 3,
            "stab": 7,
            "move_closer": 1,
            "single_bush": 3,
            "multi_bush": 3,
            "cannon_rock": 6,
            "cannon_troops": 6,
            "order_shoot": 6 * 2,
            "order_move": 2,
            "explore": 6,
            "move_to_friends": 1.5
        }
    },

    "cannon": {
        // error: let x be # of tiles, let # be # of tiles. Shot will land y tiles off of location where x is the distance to target. Function y = (x^f)/g
        "error_f": 1.5,
        "error_g": 100,
        "aoe_tile_radius": 5, // Corresponds with damage, damage f,g should match such taht damage(5) is approximately 0
        // damage: let x be # of tiles from center of hit. Damage = 1/((x+1)^(f * gx))
        "damage_f": 0.5,
        "damage_g": 1,
        "human_damage_multiplier": 0.5,
        "rock_damage_multiplier": 1.2,
        "smoke": {
            "smoke_colour": "#292825",
            "smoke_opacity": 1, // [0,1],
            "min_circles_per_smoke_cloud": 10,
            "max_circles_per_smoke_cloud": 30,
            "center_radius": 128,
            "min_radius": 20,
            "max_radius": 30,
            "min_life_ms": 1500,
            "max_life_ms": 20000,
            "max_speed": 3
        },
        "turn_cooldown": 5, // 5?
        "cooldown_colour": "#ff0000",
        "cooldown_text_size": 40
    },

    "enviromental_health_bar": {
        "width": 32,
        "height": 8,
        "border_colour": "#000000",
        "border_thickness": 1,
        "threshold_4": 0.99,
        "threshold_3": 0.8,
        "threshold_2": 0.55,
        "threshold_4_colour": "#400303",
        "threshold_3_colour": "#ff1212",
        "threshold_2_colour": "#ff7512",
        "threshold_1_colour": "#12ff12",
    },

    "progress_bar": {
        "width": 120,
        "height": 40,
        "border_colour": "#000000",
        "border_thickness": 1,
        "threshold_4": 0.99,
        "threshold_3": 0.8,
        "threshold_2": 0.55,
        "threshold_4_colour": "#4b006e",
        "threshold_3_colour": "#ff1212",
        "threshold_2_colour": "#ff7512",
        "threshold_1_colour": "#12ff12",
    },

    "sword_data": {
        "arm_length": 32,
        "blocking": {
            "deflect_damage": 0,
            "deflect_contender_stamina_drain": 30,
            "deflect_shorter_stamina_drain": 45,
            "block_damage": 0.125,
            "block_contender_stamina_drain": 55,
            "block_shorter_stamina_drain": 70,
            "deflect_proportion": 0.5, // If block is started >= half the ticks through the swing then it's a deflect rather than a block
            "stun_deflect_proportion": 0.9, // If block is started >= half the ticks through the swing then it's a deflect rather than a block
            "stun_time_ms": 1000
        },
        "swords": {
            "cleaver": {
                "swing_time_ms": 200, // 200
                "swing_angle_range_deg": 120,
                "handle_offset_x": 0,
                "handle_offset_y": 0,
                "sword_rotation_deg": 30,
                "swing_damage": 0.2,
                "image_width": 512,
                "image_height": 512,
                "image_scale": 1/16,
                "blade_length": 286/16, // = 17.875
                "stamina_usage_for_swing": 10,
                "swing_cooldown_ms": 200,
                "stun_time_ms": 200
            },
            "white_flag": {
                "swing_time_ms": 200, // 200
                "swing_angle_range_deg": 120,
                "handle_offset_x": 0,
                "handle_offset_y": 0,
                "sword_rotation_deg": 30,
                "swing_damage": 0.0,
                "image_width": 512,
                "image_height": 512,
                "image_scale": 1/16,
                "blade_length": 286/16, // = 17.875
                "alternate_url": "skirmish/item/special/",
                "stamina_usage_for_swing": 0,
                "swing_cooldown_ms": 400,
                "stun_time_ms": 0
            },
            "cavalry_sword": {
                "swing_time_ms": 750, // 250
                "swing_angle_range_deg": 160, // 160
                "handle_offset_x": 55-512/2,
                "handle_offset_y": 512/2-344,
                "sword_rotation_deg": 120,
                "swing_damage": 0.7,
                "image_width": 512,
                "image_height": 512,
                "image_scale": 1/8,
                "blade_length": 414/8,
                "stamina_usage_for_swing": 20,
                "swing_cooldown_ms": 400,
                "stun_time_ms": 500
            }
        }
    },

    "basic_images": ["page_background", "crosshair", "logo", "crossed_out"],

    "skirmish": {
        "area_size": 20, // 50?,
        "troop_selection_distance": 6,
        "selection_colour": "#f2d633",
        "selection_border_width": 3,
        "enemy_visibility_distance": 12, // 12
        "distance_per_turn": {
            "private": 5,
            "officer": 10 // 10
        },
        "game_play": {
            "officer_count": 1,
            "private_count": 4 // 4?
        },
        "special_item_names": [
            "white_flag",
            "point_to_move",
            "point_to_move_crosshair_green",
            "point_to_move_crosshair_orange",
            "point_to_move_crosshair_red",
            "point_to_shoot",
            "point_to_shoot_crosshair",
            "point_to_shoot_cannon",
            "point_to_shoot_cannon_crosshair"
        ],
        "shot_damage": 0.75,
        "stab_damage": 1,
        "camera": {
            "move_speed": DATA_TILE_SIZE*16
        },
        "max_seed": 100000, // Self-explanatory
        "good_seeds": [78518, 39352, 3833, 4216, 93276],
        "seed": null  // null for random seed, 447 is good (on 20 size)
    },

    "controls": {
        "approximate_zoom_peek_time_ms": 500
    },

    "physical_tiles": [
        {
            "name": "full_block",
            "file_link": "images/physical_tiles/full_block.png",
            "attributes": [
                "no_walk",
                "solid"
            ]
        },
        {
            "name": "unwalkable",
            "file_link": "images/physical_tiles/unwalkable.png",
            "attributes": [
                "no_walk"
            ]
        },
        {
            "name": "single_cover",
            "file_link": "images/physical_tiles/single_cover.png",
            "attributes": [
                "single_cover"
            ]
        },
        {
            "name": "multi_cover",
            "file_link": "images/physical_tiles/multi_cover.png",
            "attributes": [
                "multi_cover"
            ]
        },
        {
            "name": "spawn",
            "file_link": "images/physical_tiles/spawn.png",
            "attributes": [
                "spawn"
            ]
        }
    ],

    "team_aliases": [
        {
            "noun": "America",
            "proper_adjective": "American",
            "proper_adjective_plural": "Americans"
        },
        {
            "noun": "Britain",
            "proper_adjective": "British",
            "proper_adjective_plural": "British"
        }
    ],

    "team_to_colour": {
        "British": "#8c130a",
        "American": "#0a0c8c"
    },

    "character_class_to_team_name": {
        "british_pvt_g": "Britain",
        "british_officer": "Britain",
        "usa_pvt": "America",
        "usa_officer": "America"
    },

    "all_character_classes": ["british_pvt_g", "british_officer", "usa_pvt", "usa_officer"],

    "menu": {
        "option_slider": {
            "slider_width_px": 20,
            "x_size": 300
        },
        "text_box_padding_proportion": 0.1,
        "menus": {
            "help_menu": {
                "back_button": {
                    "colour_code": "#3bc44b",
                    "text_colour_code": "#e6f5f4",
                    "text": "Return",
                    "y_offset": 27,
                    "x": 50,
                    "x_size": 200,
                    "y_size": 76
                }
            },
            "level_generator_menu": {
                "back_button": {
                    "colour_code": "#3bc44b",
                    "text_colour_code": "#e6f5f4",
                    "text": "Main Menu",
                    "y_offset": 27,
                    "x": 50,
                    "x_size": 200,
                    "y_size": 76
                },
                "number_button_size": 50,
                "max_digits": 3,
                "number_button_colour_code": "#3bc44b",
                "number_button_text_colour_code": "#e6f5f4"
            },
            "gamemode_viewer_menu": {
                "back_button": {
                    "colour_code": "#3bc44b",
                    "text_colour_code": "#e6f5f4",
                    "text": "Main Menu",
                    "y_offset": 27,
                    "x": 50,
                    "x_size": 200,
                    "y_size": 76
                },
                "scrollable_display": {
                    "scroll_bar": {
                        "x_offset": 150,
                        "y_offset": 150,
                        "width": 40,
                        "min_height": 400,
                        "slider_height": 40,
                        "background_colour_code": "#ffffff",
                        "slider_colour_code": "#ff00ff",
                        "wheel_multiplier": 0.25
                    },
                    "entry": {
                        "y_size": 250,
                        "y_offset": 150,
                        "x_offset": 150,
                        "x_size": 900,
                        "display_name_x_size": 400,
                        "display_name_y_size": 150,
                        "display_name_text_colour_code": "#ffffff",
                        "go_to_menu_button_text": "View",
                        "go_to_menu_button_x_size": 400,
                        "go_to_menu_button_y_size": 100,
                        "go_to_menu_button_background_colour_code": "#3bc44b",
                        "go_to_menu_button_text_colour_code": "#ffffff"
                    }
                },
                "gamemodes": [
                    {
                        "display_name": "Gentlemanly Duel",
                        "menu_name": "gentlemanly_duel_menu"
                    },
                    {
                        "display_name": "Level Generator",
                        "menu_name": "level_generator_menu"
                    },
                    {
                        "display_name": "Gamemaker",
                        "menu_name": "game_maker"
                    },
                    {
                        "display_name": "Duel",
                        "menu_name": "duel_menu"
                    }
                ]
            },
            "main_menu": {
                "featured_gamemode": {
                    "display_name": "Duel",
                    "menu_name": "duel_menu"
                }/*
                "featured_gamemode": {
                    "display_name": "Gentlemanly Duel",
                    "menu_name": "gentlemanly_duel_menu"
                }*/
            },
            "duel_menu": {
                "back_button": {
                    "colour_code": "#3bc44b",
                    "text_colour_code": "#e6f5f4",
                    "text": "Main Menu",
                    "y_offset": 27,
                    "x": 50,
                    "x_size": 200,
                    "y_size": 76
                },
                "p1_start_x": 350,
                "p2_start_x": 650,
                "section_head": {
                    "p1_name": "Player 1",
                    "p2_name": "Player 2",
                    "x_size": 250,
                    "y_size": 100,
                    "text_colour_code": "#000000"
                },
                "character_image": {
                    "selection": ["british_officer_64", "british_pvt_g_64", "usa_officer_64", "usa_pvt_64"],
                    "selection_corresponding_models": ["british_officer", "british_pvt_g", "usa_officer", "usa_pvt"],
                    "y_offset": 0,
                    "width": 128,
                    "height": 128
                },
                "toggle_bot_button": {
                    "y_offset": 25,
                    "x_size": 128,
                    "y_size": 64,
                    "human_text": "Human",
                    "bot_text": "Bot",
                    "bot_colour_code": "#eb4034",
                    "human_colour_code": "#3bc44b",
                    "text_colour_code": "#ffffff"
                },
                "reaction_time_text": {
                    "text": "Bot Reaction time (ms)",
                    "text_colour_code": "#ffffff",
                    "y_offset": 15,
                    "width": 260,
                    "height": 40
                },
                "reaction_time_slider": {
                    "text_colour_code": "#ffffff",
                    "slider_colour_code": "#ffffff",
                    "background_colour_code": "#eb4034",
                    "slider_width": 128,
                    "slider_height": 50,
                    "text_height": 50,
                    "y_offset": -20,
                    "reaction_time_options": [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000],
                    "p1_default_reaction_time_index": 3,
                    "p2_default_reaction_time_index": 5
                },
                "weapon_data": {
                    "width": 64,
                    "height": 64,
                    "y_offset": 15,
                    "sword_model": "cavalry_sword",
                    "sword_image_name": "cavalry_sword",
                    "knife_model": "cleaver",
                    "knife_image_name": "cleaver",
                    "pistol_model": "flintlock",
                    "pistol_image_name": "flintlock",
                    "musket_model": "brown_bess",
                    "musket_image_name": "brown_bess_right"
                },
                "level_generator_start_x": 950,
                "number_button_size": 50,
                "max_digits": 3,
                "number_button_colour_code": "#3bc44b",
                "number_button_text_colour_code": "#e6f5f4",
                "start_game_button": {
                    "text": "START",
                    "colour_code": "#3bc44b",
                    "text_colour_code": "#e6f5f4",
                    "height": 130
                }
            },
            "gentlemanly_duel_menu": {
                "back_button": {
                    "colour_code": "#3bc44b",
                    "text_colour_code": "#e6f5f4",
                    "text": "Main Menu",
                    "y_offset": 27,
                    "x": 50,
                    "x_size": 200,
                    "y_size": 76
                },
                "p1_start_x": 350,
                "p2_start_x": 650,
                "section_head": {
                    "p1_name": "Player 1",
                    "p2_name": "Player 2",
                    "x_size": 250,
                    "y_size": 100,
                    "text_colour_code": "#000000"
                },
                "character_image": {
                    "selection": ["british_officer_64", "british_pvt_g_64", "usa_officer_64", "usa_pvt_64"],
                    "selection_corresponding_models": ["british_officer", "british_pvt_g", "usa_officer", "usa_pvt"],
                    "y_offset": 0,
                    "width": 128,
                    "height": 128
                },
                "toggle_bot_button": {
                    "y_offset": 25,
                    "x_size": 128,
                    "y_size": 64,
                    "human_text": "Human",
                    "bot_text": "Bot",
                    "bot_colour_code": "#eb4034",
                    "human_colour_code": "#3bc44b",
                    "text_colour_code": "#ffffff"
                },
                "reaction_time_text": {
                    "text": "Bot Reaction time (ms)",
                    "text_colour_code": "#ffffff",
                    "y_offset": 15,
                    "width": 260,
                    "height": 40
                },
                "reaction_time_slider": {
                    "text_colour_code": "#ffffff",
                    "slider_colour_code": "#ffffff",
                    "background_colour_code": "#eb4034",
                    "slider_width": 128,
                    "slider_height": 50,
                    "text_height": 50,
                    "y_offset": -20,
                    "reaction_time_options": [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000],
                    "p1_default_reaction_time_index": 3,
                    "p2_default_reaction_time_index": 5
                },
                "gun_skill_text": {
                    "text": "Player Gun Skill",
                    "text_colour_code": "#ffffff",
                    "y_offset": 15,
                    "width": 260,
                    "height": 60
                },
                "gun_skill_slider": {
                    "text_colour_code": "#ffffff",
                    "slider_colour_code": "#ffffff",
                    "background_colour_code": "#eb4034",
                    "slider_width": 128,
                    "slider_height": 50,
                    "text_height": 50,
                    "y_offset": -20,
                    "gun_skill_options": [0,1,2,3,4,5,6,7,8,9,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100],
                    "p1_default_gun_skill_index": 25,
                    "p2_default_gun_skill_index": 25
                },
                "level_generator_start_x": 950,
                "number_button_size": 50,
                "max_digits": 3,
                "number_button_colour_code": "#3bc44b",
                "number_button_text_colour_code": "#e6f5f4",
                "start_game_button": {
                    "text": "START",
                    "colour_code": "#3bc44b",
                    "text_colour_code": "#e6f5f4",
                    "height": 200
                }
            }
        }
    },

    "gun_data": {
        "brown_bess": {
            "type": "musket",
            "reload_time_ms": 5000,
            "stab_time_ms": 600,
            "stab_range": 0.95 * DATA_TILE_SIZE,
            "range": 25*DATA_TILE_SIZE,
            "display": {
                "left": {
                    "x_offset": 2-32,
                    "y_offset": 32-28 // 32-28
                },
                "right": {
                    "x_offset": 62-32,
                    "y_offset": 32-28 // 32-28
                }
            },
            "min_start_sway_deg": 0,
            "sway_max_angle_deg": 70, // [0,360] Maximum angle it can sway
            "max_sway_velocity_deg": 20, // Max degrees to sway in a second
            "sway_decline_a": 1.3, // 1 / [(x+b)^a]
            "sway_decline_b": 0.8, // 1 / [(x+b)^a]
            "maximum_random_sway_acceleration_deg": 5,  // Maximum Random sway acceleration deg/second^2
            "minimum_random_sway_acceleration_deg": 3.2, // Minimum Random sway acceleration deg/second^2
            "corrective_sway_acceleration_deg": 0.75, // Corrective sway acceleration deg/second^2
            "corrective_sway_acceleration_constant_c": 0.35, // Constant for slowing down based on angle offset
            "corrective_sway_acceleration_constant_d": 2.75, // Constant for slowing down based on angular velocity
            "stamina_usage_for_stab": 30,
            "stab_stun_time_ms": 100 // Miliseconds a player is stunned after being stabbed
        },
        "flintlock": {
            "type": "pistol",
            "reload_time_ms": 2500, // 2500
            "range": 14*DATA_TILE_SIZE,
            "image_width": 512,
            "image_height": 512,
            "image_scale": 1/16,
            "end_of_barrel_offset": {
                "x_offset": 497-256,
                "y_offset": 256-230
            },
            "handle_offset_x": 70-512/2,
            "handle_offset_y": 512/2-369,
            "min_start_sway_deg": 0,
            "sway_max_angle_deg": 35, // [0,360] Maximum angle it can sway
            "max_sway_velocity_deg": 35, // Max degrees to sway in a second
            "sway_decline_a": 1.9, // 1 / [(x+b)^a]
            "sway_decline_b": 0.5, // 1 / [(x+b)^a]
            "maximum_random_sway_acceleration_deg": 5,  // Maximum Random sway acceleration deg/second^2
            "minimum_random_sway_acceleration_deg": 3.2, // Minimum Random sway acceleration deg/second^2
            "corrective_sway_acceleration_deg": 0.75, // Corrective sway acceleration deg/second^2
            "corrective_sway_acceleration_constant_c": 0.35, // Constant for slowing down based on angle offset
            "corrective_sway_acceleration_constant_d": 2.75 // Constant for slowing down based on angular velocity
        }
    },

    "ui": {
        "font_family": "arial",

        "game_maker": {
            "scroll_button_width": 100,
            "bottom_bar_height": 100,
            "purple_code": "#c532e3",
            "red_code": "#6b100a",
            "yellow_code": "#fce26d",
            "green_code": "#33f54d",
            "image_width": 100,
            "image_height": 100,
            "top_bar_height": 100,
            "bottom_bar_height": 100
        }
    },

    "sound_data": {
        "sounds": [
            {"name": "gunshot", "type": "discrete"},
            {"name": "longer_block", "type": "discrete"},
            {"name": "longer_deflect", "type": "discrete"},
            {"name": "shorter_block", "type": "discrete"},
            {"name": "shorter_deflect", "type": "discrete"},
            {"name": "slashing", "type": "discrete"},
        ],
        "url": "./sounds",
        "file_type": ".mp3",
        "last_played_delay_ms": 100, // Extra time to wait before preparing to pause a sound
        "extra_display_time_ms": 1000, // Min time to display a sound
        "active_sound_display": {
            "enabled": false, // off by default,
            "num_slots": 2, // Will show information for $num_slots sounds and an indicator if more sounds are active
            "slot_x_size": 100,
            "slot_y_size": 30,
            "background_colour": "#000000",
            "text_colour": "#ffffff"
        }
    },

    "general": {
        "tick_rate": 20, // Tick rate of 20 is expected, keep in mind that if the user moves > 1 tile per tick it will cause issues
        "frame_rate": 60,
        "tile_size": DATA_TILE_SIZE, // 64
        "walk_speed": 120,
        "sprint_multiplier": 1.5,
        "animation_frame_time": 100,
        "chunk_size": 16,
        "expected_canvas_width": 1920,
        "expected_canvas_height": 1080,
        "entity_render_distance": 30,
        "game_zoom": 1
    },

    "user_chosen_settings": {
        "gore": false, // Off by default,
        "cursor_enabled": true // On by default
    },

    "extra_settings": [
        {
            "name": "gore",
            "path": ["user_chosen_settings", "gore"],
            "type": "on_off"
        },
        {
            "name": "active_sound_display",
            "path": ["sound_data", "active_sound_display", "enabled"],
            "type": "on_off"
        },
        {
            "name": "cursor_enabled",
            "path": ["user_chosen_settings", "cursor_enabled"],
            "type": "on_off"
        },
    ],

    "inventory": {
        "hotbar_size": 10,
        "harbar_outline_colour": "#7f838f",
        "hotbar_selected_item_outline_colour": "#fccf5b",
        "slot_size": 64,
        "hotbar_y_offset_from_bottom": 2,
        "text_size": 20
    },

    "tile_types": [
        "dirt",
        "grass",
        "house"
    ],

    "hud": {
        "text_size": 20,
        "key_colour": "#ff6700",
        "value_colour": "#0066ff",
        "extra_time_ms": 1000,
        "display_x_offset": 10,
        "priorities": {
            "fps": 1
        }
    },

    "model_to_model_category": {
        "british_pvt_g": "category_1",
        "british_officer": "category_1",
        "usa_pvt": "category_1",
        "usa_officer": "category_1"
    },

    "model_positions": {
        "holding_rotation": 40,
        "holding_rotation_sword": 60,
        "blocking_rotation": 30,
        "category_1": {
            "brown_bess": {
                "aiming": {
                    "front": {
                        "x_offset": -1, // -1
                        "y_offset": 5 // 5
                    },
                    "left": {
                        "x_offset": -5,
                        "y_offset": 5
                    },
                    "right": {
                        "x_offset": 5,
                        "y_offset": 5
                    },
                    "back": {
                        "x_offset": 0,
                        "y_offset": -20
                    }
                },

                "not_aiming": {
                    "front": {
                        "x_offset": -1,
                        "y_offset": 0
                    },
                    "left": {
                        "x_offset": -5,
                        "y_offset": 5
                    },
                    "right": {
                        "x_offset": 5,
                        "y_offset": 5
                    },
                    "back": {
                        "x_offset": 1,
                        "y_offset": 0
                    }
                }
            },
            "cleaver": {
                "swinging": {
                    "front": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                    "left": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                    "right": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                    "back": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                },
                "not_swinging": {
                    "front": {
                        "x_offset": 20, // -17
                        "y_offset": 28+16 // 28
                    },
                    "left": {
                        "x_offset": 21,
                        "y_offset": 28+16
                    },
                    "right": {
                        "x_offset": 42,
                        "y_offset": 28+16
                    },
                    "back": {
                        "x_offset": 46,
                        "y_offset": 28+16
                    }
                }
            },
            "white_flag": {
                "swinging": {
                    "front": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                    "left": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                    "right": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                    "back": {
                        "x_offset": 32,
                        "y_offset": 32
                    },
                },
                "not_swinging": {
                    "front": {
                        "x_offset": 20, // -17
                        "y_offset": 28+16 // 28
                    },
                    "left": {
                        "x_offset": 21,
                        "y_offset": 28+16
                    },
                    "right": {
                        "x_offset": 42,
                        "y_offset": 28+16
                    },
                    "back": {
                        "x_offset": 46,
                        "y_offset": 28+16
                    }
                }
            },
            "cavalry_sword": {
                "swinging": {
                    "front": {
                        "x_offset": 32, // 32
                        "y_offset": 48 // 48
                    },
                    "left": {
                        "x_offset": 32-16,
                        "y_offset": 32+16
                    },
                    "right": {
                        "x_offset": 32+16,
                        "y_offset": 32+16
                    },
                    "back": {
                        "x_offset": 32,
                        "y_offset": 32-16
                    },
                },
                "not_swinging": {
                    "front": {
                        "x_offset": 7,
                        "y_offset": 49
                    },
                    "left": {
                        "x_offset": 32,
                        "y_offset": 49
                    },
                    "right": {
                        "x_offset": 32,
                        "y_offset": 49
                    },
                    "back": {
                        "x_offset": 57,
                        "y_offset": 49
                    }
                }
            },
            "flintlock": {
                "front": {
                    "x_offset": 7,
                    "y_offset": 49
                },
                "left": {
                    "x_offset": 32,
                    "y_offset": 49
                },
                "right": {
                    "x_offset": 32,
                    "y_offset": 49
                },
                "back": {
                    "x_offset": 57,
                    "y_offset": 49
                }
            }
        }
    }
}
if (typeof window === "undefined"){
    module.exports=WTL_GAME_DATA;
}