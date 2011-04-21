var fs = require("fs");
var redcode = require("../src/redcode.js");
var core = require("../src/core.js");
var Warrior = require("../src/warrior.js").Warrior;



var loadCode = function(path,cb) {
    fs.readFile(path,'utf-8',function(err,code) {
        if (err) return cb(err);
        
        cb(null,code);
        
    });
};

var loadWarrior = function(name,path,cb) {
    
    loadCode(path,function(err,code) {
        
        if (err) return cb(err);
        
        var w = new Warrior(name,null,code);
        
        cb(null,w);
        
    });
};


exports.loadWarrior = loadWarrior;
exports.loadCode = loadCode;
