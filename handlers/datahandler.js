/*
DATAHANDLER

This file handles all file writes and reads from and to files in the data folder.
Each individual folder in the data folder must be mapped to an id.
*/

const fs = require('fs');
const path = require('path');
const datapath = "../data";
const {GameError, err} = require('../GameError.js');

//id folder functions

/** Returns whether an id matches an existing folder
 * @param {String} id 
 * @returns {Boolean} True if the id matches an existing folder, false otherwise
 */
var folderExists = function(id){
    var folderpath = `${datapath}/${id}`;
    if(fs.existsSync(path.join(__dirname, folderpath))){
        return true;
    }
    return false;
}

/** Creates a game folder if it doesn't already exist
 * @param {String} id 
 * @returns {Number} The returncode
 */
var createFolder = function(id){
    var folderpath = `${datapath}/${id}`;
    if(fs.existsSync(path.join(__dirname, folderpath))){
        throw new GameError(err.GAME_DOESNT_EXIST);
    }
    fs.mkdirSync(path.join(__dirname, folderpath));
}

/** Deletes a game folder if it exists
 * @param {String} id 
 * @returns {Number} The returncode
 */
var deleteFolder = function(id){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        throw new GameError(err.GAME_DOESNT_EXIST);
    }

    fs.rmSync(path.join(__dirname, folderpath), { recursive: true, force: true });
}

//path/file functions

/** Retrieves all game folder names (aka game ids)
 * @returns {Array<String>}
 */
var getFolderIds = function(){
    return fs.readdirSync(path.join(__dirname, datapath));
}

/** Get the absolute path for a file
 * @param {String} id 
 * @param {String} subpath 
 * @returns {String} The absolute path
 */
var getAbsolutePath = function(id, subpath, creategamefolder=false){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        if(creategamefolder) createFolder(id);
        else return undefined;
    }

    //return the absolute path
    return path.join(__dirname, `${folderpath}/${subpath}`);
}

/** Create a folder at a given subpath, creating the subpath if necessary
 * @param {String} id 
 * @param {String} subpath 
 * @returns {Number} The returncode
 */
var createSubFolder = function(id, subpath){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        throw new GameError(err.GAME_DOESNT_EXIST);
    }

    var currpath = `${folderpath}`;
    var subpaths = subpath.split("/");
    subpaths.forEach(folder => {
        currpath += `/${folder}`;
        if(!fs.existsSync(path.join(__dirname, currpath))){
            try{
                fs.mkdir(path.join(__dirname, currpath));
            }catch(error){
                throw new GameError(err.FILE_WRITE_ERROR);
            }
        }
    });
}

/** Deletes a folder at a given subpath
 * @param {String} id 
 * @param {String} subpath 
 */
var deleteSubFolder = function(id, subpath){
    deleteFile(id, subpath);
}

/** Returns a list of all file names in a given directory
 * @param {String} id 
 * @param {String} subpath 
 * @returns {Array<String>} An array of file names
 */
var retrieveSubFolder = function(id, subpath){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        return [];
    }

    var subfolderpath = `${folderpath}/${subpath}`;
    if(fs.existsSync(path.join(__dirname, subfolderpath))){
        try{
            return fs.readdirSync(path.join(__dirname, subfolderpath));
        }catch(error){
            console.error(error);
            return [];
        }
    }
    return [];
}

/** Returns whether a given subpath points to an existing file
 * @param {String} id 
 * @param {String} subpath 
 * @returns {Boolean} True if the file exists, false if not
 */
var fileExists = function(id, subpath){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        return false;
    }

    var filepath = `${folderpath}/${subpath}`;
    if(fs.existsSync(path.join(__dirname, filepath))){
        return true;
    }
    return false;
}

/** Retrieve the path to an existing file
 * @param {String} id 
 * @param {String} subpath 
 * @returns {(String|undefined)} The file path
 */
var retrieveFilePath = function(id, subpath){
    if(!fileExists(id, subpath)) return undefined;
    var folderpath = `${datapath}/${id}`;
    var filepath = `${folderpath}/${subpath}`;
    var fullpath = path.join(__dirname, filepath);
    return fullpath;
}

/** Retrieves data from a file and returns it in its raw form
 * @param {String} id 
 * @param {String} subpath 
 * @returns {Object} The data
 */
var retrieveData = function(id, subpath){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        return undefined;
    }

    try{
        var filepath = `${folderpath}/${subpath}`;
        if(!fs.existsSync(path.join(__dirname, filepath))){
            return undefined;
        }

        var data = fs.readFileSync(path.join(__dirname, filepath));
        return data;
    }catch(error){
        console.log(error);
        return undefined;
    }
}

/** Puts data in a file by a given subpath. Overwrites anything that was there
 * @param {String} id 
 * @param {String} subpath 
 * @param {String} data 
 * @returns {Number} The returncode
 */
var putData = function(id, subpath, data){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        throw new GameError(err.GAME_DOESNT_EXIST);
    }

    try{
        var currpath = folderpath;
        var subpaths = subpath.split("/");
        for(var i = 0; i < (subpaths.length - 1); i++){
            currpath += `/${subpaths[i]}`;
            if(!fs.existsSync(path.join(__dirname, currpath))){
                fs.mkdirSync(path.join(__dirname, currpath));
            }
        }

        var filepath = `${folderpath}/${subpath}`;
        fs.writeFileSync(path.join(__dirname, filepath), data);
    }catch(error){
        console.log(error);
        throw new GameError(err.FILE_WRITE_ERROR);
    }
}

/** Appends data at the end of a specified subpath
 * @param {String} id 
 * @param {String} subpath 
 * @param {String} data 
 * @returns {Number}
 */
var appendData = function(id, subpath, data){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        throw new GameError(err.GAME_DOESNT_EXIST);
    }

    try{
        var filepath = `${folderpath}/${subpath}`;
        fs.appendFileSync(path.join(__dirname, filepath), data);
    }catch(error){
        console.log(error);
        throw new GameError(err.FILE_WRITE_ERROR);
    }
}

/** Deletes a file under a given subpath
 * @param {String} id 
 * @param {String} subpath 
 * @returns {Number} The returncode
 */
var deleteFile = function(id, subpath){
    var folderpath = `${datapath}/${id}`;
    if(!fs.existsSync(path.join(__dirname, folderpath))){
        throw new GameError(err.GAME_DOESNT_EXIST);
    }

    try{
        if(!fs.existsSync(path.join(__dirname, `${folderpath}/${subpath}`))){
            throw new GameError(err.FILE_DOESNT_EXIST);
        }
        fs.rmSync(path.join(__dirname, `${folderpath}/${subpath}`), { recursive: true, force: true });
    }catch(error){
        console.log(error);
        throw new GameError(err.FILE_DELETION_ERROR);
    }
}

module.exports={
    folderExists: folderExists,
    createFolder: createFolder,
    deleteFolder: deleteFolder,
    getFolderIds: getFolderIds,
    getAbsolutePath: getAbsolutePath,
    createSubFolder: createSubFolder,
    deleteSubFolder: deleteSubFolder,
    retrieveSubFolder: retrieveSubFolder,
    fileExists: fileExists,
    retrieveFilePath: retrieveFilePath,
    retrieveData: retrieveData,
    putData: putData,
    appendData: appendData,
    deleteFile: deleteFile,
}