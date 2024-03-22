const PROGRAM_SETTINGS = {
    /*"general": {
        "canvas_width": 1920,
        "canvas_height": 927,
        "center_area_height": 832,
        "center_area_width": 1824,
        "tick_rate": 100,
        "frame_rate": 60,
        "tile_size": 64,
        "walk_speed": 100,
        "animation_frame_time": 200
    },*/

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

    "smoke_generation": {
        "min_circles_per_smoke_cloud": 10,
        "max_circles_per_smoke_cloud": 20,
        "min_radius": 6,
        "max_radius": 10,
        "center_radius": 20,
        "smoke_colour": "#ededeb",
        "smoke_opacity": 0.99,
        "min_life_ms": 2000, // 3000?
        "max_life_ms": 10000, // 10000?
        "max_speed": 0.5
    },

    "general": {
        "tick_rate": 20, // Tick rate of 20 is expected, keep in mind that if the user moves > 1 tile per tick it will cause issues
        "frame_rate": 60,
        "tile_size": 64,
        "walk_speed": 120,
        "sprint_multiplier": 2.0,
        "animation_frame_time": 100,
        "chunk_size": 16
    },

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