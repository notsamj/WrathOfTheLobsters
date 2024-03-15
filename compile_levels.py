import os

def readFile(fileName):
    # fileContents (declare)

    # Assuming each file is just 1 line
    with open(fileName, "r") as file:
        fileContents = file.readline().strip()
    return fileContents

data = {}
dataKeys = []
serverLevelFolderPathStr = "./Game Maker/server/data/level/"
localLevelFolderPathStr = "./data/"
# Read all json files and put in data dict
for fileName in os.listdir(serverLevelFolderPathStr):
    data[fileName] = readFile(serverLevelFolderPathStr + fileName)
    dataKeys.append(fileName)

numLevels = len(dataKeys)

# Open new js file and write the contents
with open(localLevelFolderPathStr + "level_data.js", "w") as file:
    file.write("const LEVEL_DATA = {" + "\r\n")
    for i in range(len(dataKeys)):
        specificLevelData = data[dataKeys[i]]
        file.write("\"")
        file.write(dataKeys[i])
        file.write("\": ")
        file.write(specificLevelData)
        if i != numLevels - 1:
            file.write(",")
        file.write("\r\n")
    file.write("}")