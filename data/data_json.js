const RETRO_GAME_DATA = {
    "test_settings": {
        "duel": {
            "participants": [
                {
                    "human": false,
                    "model": "british_officer",
                    "swords": ["clever"],
                    "pistols": [],
                    "muskets": [],
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 50
                    }
                },
                {
                    "human": false,
                    "model": "usa_officer",
                    "swords": ["cavalry_sword"],
                    "pistols": [],
                    "muskets": [],
                    "bot_extra_details": {
                        "disabled": false,
                        "reaction_time_ms": 50
                    }
                }
            ]
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
        "max_x_velocity": 2,
        "max_y_velocity": 2,
        "origin_x_range_size": 2500,
        "origin_y_range_size": 2500
    },

    "duel": {
        "theme_colour": "#5479ff",
        "area_size": 10, // 50?,
        "enemy_visibility_distance": 12, // 12
        "shot_damage": 0.75,
        "stab_damage": 1,
        "max_seed": 100000, // Self-explanatory
        "seed": null,  // null for random seed, 24873 is good (on 10 size)
        "camera": {
            "move_speed": 64*16  
        },
        "ai": {
            "search_path_max_length": 15, // A path up to this length will be made when looking for the enemy. Once reached a new one will be made
            "estimated_melee_distance": Math.sqrt(2) + 0.1, // Distance in tiles at which melee combat is estimated to take place <= amount
            "regular_deflect_attempt_probability": 0.6, // [0,1] the proability that a bot will attempt to perform a regular deflect (as opposed to no deflect or stun deflect)
            "expected_swing_delay_ms": 150, // The bot has the ability to swing it's sword at the enemy. This is the expected delay used to calculate probability of swing attmempt per tick
            "adjust_close_duel_delay_ms": 500, // The bots are locked too close. Expected delay before making a pivot.
            "expected_adjacent_pivot_ms": 100 // The bots are probably diagonal to one another. They can hit but it's better to move closer
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
        "recovery_delay_ms": 1000
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
                    "max_red": 250,
                    "min_green": 168,
                    "max_green": 178,
                    "min_blue": 127,
                    "max_blue": 137,
                    "max_speed": 25
                },
                "deflect": {
                    "min_sparks_per_impact": 7,
                    "max_sparks_per_impact": 13,
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
                    "min_green": 145,
                    "max_green": 155,
                    "min_blue": 84,
                    "max_blue": 94,
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

    "run": {
        "british_are_human": true,
        "americans_are_human": true
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

    "health_bar": {
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
            "deflect_contender_stamina_drain": 20,
            "deflect_shorter_stamina_drain": 30,
            "block_damage": 0.125,
            "block_contender_stamina_drain": 45,
            "block_shorter_stamina_drain": 55,
            "deflect_proportion": 0.5, // If block is started >= half the ticks through the swing then it's a deflect rather than a block
            "stun_deflect_proportion": 0.9, // If block is started >= half the ticks through the swing then it's a deflect rather than a block
            "stun_time_ms": 1000
        },
        "swords": {
            "clever": {
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
                "stun_time_ms": 100
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
                "stun_time_ms": 200
            }
        }
    },

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
            "move_speed": 64*16
        },
        "max_seed": 100000, // Self-explanatory
        "good_seeds": [78518, 39352, 3833, 4216, 93276],
        "seed": null  // null for random seed, 447 is good (on 20 size)
    },

    "controls": {
        "approximate_zoom_peek_time_ms": 500
    },

    "settings": {
        "game_zoom": 1
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

    "menu": {
        "option_slider": {
            "slider_width_px": 20,
            "x_size": 300
        },
        "text_box_padding_proportion": 0.1
    },

    "gun_data": {
        "brown_bess": {
            "type": "musket",
            "reload_time_ms": 5000,
            "stab_time_ms": 600,
            "stab_range": 1.2*64,
            "range": 25*64,
            "display": {
                "left": {
                    "x_offset": 2-32,
                    "y_offset": 32-28 // 32-28
                },
                "right": {
                    "x_offset": 62-32,
                    "y_offset": 32-28 // 32-28
                }
            }
        },
        "flintlock": {
            "type": "pistol",
            "reload_time_ms": 2500, // 2500
            "range": 12*64,
            "image_width": 512,
            "image_height": 512,
            "image_scale": 1/16,
            "end_of_barrel_offset": {
                "x_offset": 497-256,
                "y_offset": 256-230
            },
            "handle_offset_x": 70-512/2,
            "handle_offset_y": 512/2-369
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
        "file_type": ".mp3"
    },

    "general": {
        "tick_rate": 20, // Tick rate of 20 is expected, keep in mind that if the user moves > 1 tile per tick it will cause issues
        "frame_rate": 60,
        "tile_size": 64,
        "walk_speed": 120,
        "sprint_multiplier": 2.0,
        "animation_frame_time": 100,
        "chunk_size": 16,
        "expected_canvas_width": 1920,
        "expected_canvas_height": 1080,
        "entity_render_distance": 30
    },

    "extra_settings": [],

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
        "value_colour": "#0066ff"
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
            "clever": {
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
    module.exports=RETRO_GAME_DATA;
}