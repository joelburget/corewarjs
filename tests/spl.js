var fs = require("fs");
var redcode = require("../src/redcode.js");
var core = require("../src/core.js");

var loadWarrior = require("../src/warrior_loader_node.js").loadWarrior;

var core = new core.Core({
    
});
core.initialize();



var warrior1 = "warriors/Test/spl_001.red";


loadWarrior(warrior1,warrior1,function(err,w1) {
        core.loadWarriors([w1]);
        
        for (var i=0;i<30;i++)
            core.runOnce(true);
      
});
