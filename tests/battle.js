var fs = require("fs");
var redcode = require("../src/redcode.js");
var core = require("../src/core.js");

var loadWarrior = require("../src/warrior_loader_node.js").loadWarrior;
var Warrior = require("../src/warrior.js").Warrior;





var warrior1 = "warriors/88/normal/Cannonade.red";
var warrior2 = "warriors/88/normal/PacMan.red";


var results = {}
results[warrior1]=0;
results[warrior2]=0;


    
loadWarrior(warrior1,warrior1,function(err,w1) {
    loadWarrior(warrior2,warrior2,function(err,w2) {
    
        for (var i=0;i<100;i++) {

            w1 = new Warrior(w1.name,w1.offset,w1.code); //.reset(); Y U NO RESET ?
            w2 = new Warrior(w2.name,w2.offset,w2.code); //.reset();
            
    
            var c = new core.Core();
            c.initialize();
    
            console.log("Loaded 2 warriors");
            c.loadWarriors([w1,w2]);
    
            c.subscribe("victory",function(data) {
                console.log("winner:",data);
                results[data]++;
            });
    
            c.run();
            
            
        }
        
        console.log("Results : ",results);
    });
});


