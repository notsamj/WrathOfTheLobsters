const RETRO_GAME_DATA = {
    "game_maker": {
        "server_ip": "localhost",
        "server_port": 8080,
        "bottom_menu_states": {
            "normal_materials": 0,
            "special_tiles": 1
        }
    },

    "run": {
        "british_are_human": false,
        "americans_are_human": false
    },

    "bot": {
        "rock_health_f_value": 1.5,
        "max_rock_value": 20,
        "friend_enemy_cannon_ratio": 5,
        "kill_to_damage_importance_ratio": 3,
        "plan_choosing_f": 1.2,
        "plan_choosing_x_start": 0.25,
        "plan_choosing_x_end": 3,
        "unknown_enemy_position_confidence": 0.01, // Confidence that an enemy is at a given position when this enemy's position isn't known
        "multi_cover_friendly_occupied_weight": 0.1, // [0,1]
        "multi_cover_empty_weight": 0.5, // [0,1]
        "multi_cover_enemy_weight": 1, // [0,1]
        "delay_ms": 250, // 1500?
        "weights": {
            "shoot": 3,
            "stab": 7,
            "move_closer": 1,
            "single_bush": 3,
            "multi_bush": 4,
            "cannon_rock": 2,
            "cannon_troops": 2,
            "order_shoot": 5,
            "order_move": 2,
            "explore": 6
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
            "blade_length": 286/16 // = 17.875
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
            "alternate_url": "skirmish/item/special/"
        },
        "cavalry_sword": {
            "swing_time_ms": 250, // 250
            "swing_angle_range_deg": 160, // 160
            "handle_offset_x": 55-512/2,
            "handle_offset_y": 512/2-344,
            "sword_rotation_deg": 120,
            "swing_damage": 0.7,
            "image_width": 512,
            "image_height": 512,
            "image_scale": 1/8,
            "blade_length": 414/8
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
            "private_count": 2 // 4?
        },
        "special_item_names": [
            "white_flag",
            "point_to_move",
            "point_to_move_crosshair",
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
        "seed": 834 // null for random seed, 447 is good (on 20 size)
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

    "characharacter_class_to_team_name": {
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

    "sound_data": {
        "sounds": [
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
        "at_the_ready_rotation": 40,
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