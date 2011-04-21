var fs = require("fs");
var redcode = require("../src/redcode.js");
var core = require("../src/core.js");

var loadWarrior = require("../src/warrior_loader_node.js").loadWarrior;

var core = new core.Core();
core.initialize();


var warrior1 = "warriors/88/simplified/Imp.red";
var warrior2 = "warriors/88/simplified/Imp.red";



loadWarrior(warrior1,warrior1,function(err,w1) {
    loadWarrior(warrior2,warrior2,function(err,w2) {
        console.log("Loaded 2 warriors");
        core.loadWarriors([w1,w2]);
        
        for (var i=0;i<100000;i++)
            core.runOnce(true);
        
    });
});
