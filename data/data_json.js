const RETRO_GAME_DATA = {
    "game_maker": {
        "server_ip": "localhost",
        "server_port": 8080,
        "bottom_menu_states": {
            "normal_materials": 0,
            "special_tiles": 1
        }
    },

    "skirmish": {
        "area_size": 20 // 50
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

    "menu": {
        "option_slider": {
            "slider_width_px": 20,
            "x_size": 300
        },
        "text_box_padding_proportion": 0.1
    },

    "gun_data": {
        "brown_bess": {
            "reload_time_ms": 5000,
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
if (typeof window === "undefined"){
    module.exports=RETRO_GAME_DATA;
}