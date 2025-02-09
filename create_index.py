import re
# Load the data_json.js
dataJSONStr = None
with open("data/data_json.js", 'r') as file:
    dataJSONStr = file.read()

# Remove game maker from menu
dataJSONStr = re.sub("{\\s+\"display_name\": \"Gamemaker\",\\s+\"menu_name\": \"game_maker_menu\"\\s+},", "", dataJSONStr)

# Write the index version now
with open("data/index_data_json.js", 'w') as file:
    file.write(dataJSONStr)

# Now tackle the html
htmlFileString = None
with open("wrath_of_the_lobsters.html", 'r') as file:
    htmlFileString = file.read()

# Comment out old data json and add new data json
htmlFileString = re.sub("<script src=\"data/data_json.js\"></script>", "<!--<script src=\"data/data_json.js\"></script>-->\r\n<script src=\"data/index_data_json.js\"></script>", htmlFileString)

# Comment out game maker stuff
htmlFileString = re.sub("<script src=\"scripts/game_maker/game_maker.js\"></script>", "<!--<script src=\"scripts/game_maker/game_maker.js\"></script>-->", htmlFileString)
htmlFileString = re.sub("<script src=\"scripts/game_maker/tile_placer.js\"></script>", "<!--<script src=\"scripts/game_maker/tile_placer.js\"></script>-->", htmlFileString)
htmlFileString = re.sub("<script src=\"scripts/game_maker/game_maker_ui.js\"></script>", "<!--<script src=\"scripts/game_maker/game_maker_ui.js\"></script>-->", htmlFileString)
htmlFileString = re.sub("<script src=\"scripts/server_communication/server_connection.js\"></script>", "<!--<script src=\"scripts/server_communication/server_connection.js\"></script>-->", htmlFileString)

# Write new index.html
with open("index.html", 'w') as file:
    file.write(htmlFileString)

"""
import json
beginningOfDataJSON = "const WTL_GAME_DATA = "

# Load the data_json.js
mainData = None
with open("data/data_json.js", 'r') as file:
    fileString = file.read()
    fileString = re.sub(beginningOfDataJSON, "", fileString)
    fileString = re.sub("//[^\n]+\n", "\n", fileString)
    with open("test1.json", 'w') as file2:
        file2.write(fileString)
    mainData = json.loads(fileString)


# Clear all game_maker stuff
mainData["game_maker"] = None
gamemodes = mainData["menu"]["menus"]["gamemode_viewer_menu"]["gamemodes"]
foundIndex = None
for i in range(len(gamemodes)):
    gamemode = gamemodes[i]
    if gamemode["menu_name"] == "game_maker_menu":
        foundIndex = i
        break

if foundIndex == None:
    raise Exception("Failed to find game maker menu in gamemodes")

# Remove it
gamemodes.pop(foundIndex)

# Remove game maker from ui
mainData["ui"]["game_maker"] = None
"""