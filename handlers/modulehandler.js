/*
MODULEHANDLER

The module system loads code and commands from individual modules that can be dependent on other modules.
The module handler is designed to load these modules and make sure they have their necessary requirements.
Each module contains at least 4 files:

information.js
--------------
Contains information used in loading the module, such as
name
hardrequirements (other module names that the module cannot function without)

command.js
----------
The file containing the core discord application command for the module. May load subcommands from either
this file or separate files, but the core command must be in this file under 'data'

code.js
-------
The file containing the code for the module. Can draw code from separate files as well, but all exports to
other modules must be in this file. The code.js file must include a "startModule" function export to obtain all its
file information from.

Module Loading
--------------
When loading modules, the handler follows 3 passes
pass 1 obtains information from the information.json file and stores it in a moduleholder
pass 2 ensures all modules have their appropriate hard requirements and removes any that don't
*/

//variables
const CommandHandler = require('./commandhandler.js').CommandHandler;
const modulepath = "../modules";
var moduleholders = {};

//helper requirements
const fs = require('fs');
const path = require('path');

class ModuleHandler{
    client;
    token;

    constructor(client, token){
        this.client = client;
        this.token = token;
    }

    //pass1
    //The first pass retrieves and stores module information for each folder, 
    //verifying each module has appropriate information
    pass1(){
        //retrieve module folders
        var modulefolders = fs.readdirSync(path.join(__dirname, modulepath));
        
        //print to console
        var consolemessage = "Found module folders:";
        for(var i = 0; i < modulefolders.length; i++){
            consolemessage += `\n${modulefolders[i]}`;
        }
        console.log(consolemessage);

        //store module information if present
        for(var i = 0; i < modulefolders.length; i++){
            try{
                console.log(`Loading module for folder '${modulefolders[i]}'...`);

                var goodtoload = true;

                var missingfiles = [];

                //verify appropriate files are there
                var files = fs.readdirSync(path.join(__dirname, `${modulepath}/${modulefolders[i]}`));
                if(!files.includes("information.json")){missingfiles.push("information.json");}
                if(!files.includes("code.js")){missingfiles.push("code.js");}
                if(!files.includes("commands")){missingfiles.push("commands");}

                if(missingfiles.length > 0){
                    var errormessage = `Module in folder '${modulefolders[i]}' missing files:`
                    for(var j = 0; j < missingfiles.length; j++){
                        errormessage += `\n- ${missingfiles[j]}`;
                    }
                    console.error(errormessage);
                    goodtoload = false;
                }

                if(goodtoload){
                    //retrieve information file
                    var information = require(`${modulepath}/${modulefolders[i]}/information.json`);

                    //verify all information is there
                    var missinglist = [];
                    if(information.name === undefined) missinglist.push("name");
                    if(information.hardrequirements === undefined) missinglist.push("hardrequirements");

                    //make sure name is lowercase, or else it won't function with command handler,
                    //as module names are also used as command names, and discord prevents uppercase characters
                    //in command names
                    information.name = information.name.toLowerCase();

                    //retrieve code file
                    var code = require(`${modulepath}/${modulefolders[i]}/code.js`);

                    //print error if exists
                    if(missinglist.length > 0){
                        var errormessage = `Missing module information for folder '${modulefolders[i]}':`;
                        for(var j = 0; j < missinglist.length; j++){
                            errormessage += `\n- ${missinglist[j]}`;
                        }
                        console.error(errormessage);
                        goodtoload = false;
                    }

                    //verify not a duplicate name
                    else if(moduleholders[`${information.name}`] != undefined){
                        console.error(`Module name for folder '${modulefolders[i]}' is the same as for '${moduleholders[`${information.name}`].folder}'`);
                        goodtoload = false;
                    }

                    //verify modulestart is present
                    if(typeof code.moduleStart != "function"){
                        console.error(`Missing 'moduleStart' function in code file for folder '${modulefolders[i]}'`);
                        goodtoload = false;
                    }

                    if(goodtoload){
                        moduleholders[`${information.name}`] = {folder: modulefolders[i], hardrequirements: information.hardrequirements};
                        console.log(`Successfully loaded folder '${modulefolders[i]}' as module '${information.name}'!`);
                    }

                    else{
                        console.log(`Failed to load folder '${modulefolders[i]}' as a module!`);
                    }
                }    
            
            }catch(error){
                console.error(`Error loading module folder: '${modulefolders[i]}'`);
                console.error(error);
            }
        }
    }

    //pass2
    //The second pass checks each module for missing hard requirements recursively, so by the time it's done
    //module holders will contain no modules that are missing anything they need to operate core functions
    pass2(){
        var nodeletions = false;
        //repeat until there are no deletions
        while(!nodeletions){
            //reset nodeletions
            nodeletions = true;

            //check each module to see if it's missing a hard requirement, as hard requirements are necessary to function
            var modulekeys = Object.keys(moduleholders);
            for(var i = 0; i < modulekeys.length; i++){

                //retrieve hard requirements
                var focusedhardrequirements = moduleholders[`${modulekeys[i]}`].hardrequirements;

                //stores missing hard requirements
                var missingrequirements = [];

                //check all hard requirements
                focusedhardrequirements.forEach(hardrequirement => {
                    if(moduleholders[`${hardrequirement}`] === undefined){
                        missingrequirements.push(hardrequirement);
                    }
                })

                //delete if missing requirements
                if(missingrequirements.length > 0){
                    delete moduleholders[`${modulekeys[i]}`];
                    
                    //indicate a recursive check is needed
                    nodeletions = false;

                    var errormessage = `Module ${modulekeys[i]} missing requirements:`;
                    for(var j = 0; j < missingrequirements.length; j++){
                        errormessage += `\n${missingrequirements[j]}`;
                    }
                    console.error(errormessage);
                }
            }
        }
    }

    startModules(){
        var keys = Object.keys(moduleholders);
        keys.forEach(key => {
            try{
                var code = require(`./${modulepath}/${moduleholders[`${key}`].folder}/code.js`);
                code.moduleStart(this.client);
            }catch(error){
                console.error(error);
            }
        });
    }

    loadModules(){
        this.pass1();
        this.pass2();
        this.startModules();
    }

    retrieveCustomExecutorPath(modulekey){
        var executorpath = `./${modulepath}/${moduleholders[`${modulekey}`].folder}/executor.js`;
        if(fs.existsSync(path.join(__dirname, executorpath))){
            return executorpath;
        }
        return "";
    }

    loadCommands(){
        const commandhandler = new CommandHandler(this.client, this.token);
        commandhandler.retrieveModuleCommands(`../administration/commands`, "administration");
        var modulekeys = Object.keys(moduleholders);
        for(var i = 0; i < modulekeys.length; i++){
            //load custom executor if it exists
            const customexecutorpath = this.retrieveCustomExecutorPath(modulekeys[i]);
            moduleholders[`${modulekeys[i]}`].customexecutorpath = customexecutorpath;
            //feed command handlers executor and commands
            commandhandler.retrieveModuleCommands(`${modulepath}/${moduleholders[`${modulekeys[i]}`].folder}/commands`, modulekeys[i], customexecutorpath);
        }
        commandhandler.startHandler();
    }

    load(){
        this.loadModules();
        this.loadCommands();
    }
}

module.exports = {
    ModuleHandler: ModuleHandler
}