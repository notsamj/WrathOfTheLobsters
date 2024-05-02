const RETRO_GAME_DATA = {
    "game_maker": {
        "server_ip": "localhost",
        "server_port": 8080,
        "bottom_menu_states": {
            "normal_materials": 0,
            "special_tiles": 1
        }
    },

    "menu": {
        "option_slider": {
            "slider_width_px": 20,
            "x_size": 300
        },
        "text_box_padding_proportion": 0.1
    },

    "tile_attributes": {
        "grass": [
            "walkable"
        ],
        "dirt": [
            "walkable"
        ],
        "house": [
            "walkable"
        ]
    },

    "gun_data": {
        "brown_bess": {
            "range": 150*64,
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
        }
    },

    "ui": {
        "font_family": "arial"
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
        "expected_canvas_height": 1080
    },

    "extra_settings": [],

    "character": {
        "hotbar_size": 10,
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

    "model_positions": {
        "at_the_ready_rotation": 40,
        "british_pvt_g": {
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
            }
        },
        "usa_pvt": {
            "brown_bess": {
                "aiming": {
                    "front": {
                        "x_offset": -1,
                        "y_offset": 5
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
            }
        }
    }
}