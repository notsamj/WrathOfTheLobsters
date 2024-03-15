const PROGRAM_SETTINGS = {
    "general": {
        "tick_rate": 50,
        "frame_rate": 60,
        "tile_size": 64,
        "walk_speed": 100,
        "animation_frame_time": 200,
        "chunk_size": 16
    },

    "server_data": {
        "server_ip": "localhost",
        "server_port": "8080"
    },

    "ui": {
        "canvas_width": 1920,
        "canvas_height": 927,
        "center_area_height": 832,
        "center_area_width": 1824,
        "side_area_widths": 200,
        "side_area_heights": 128
    },

    "hud": {
        "text_size": 20,
        "key_colour": "#ff6700",
        "value_colour": "#0066ff"
    }
}
if (typeof window === "undefined"){
    module.exports = PROGRAM_SETTINGS;
}