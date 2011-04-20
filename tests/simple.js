var fs = require("fs");
var redcode = require("../src/redcode.js");
var vm = require("../src/vm.js");


var loadWarrior = function(path,cb) {
    fs.readFile("warriors/"+path,'utf-8',function(err,code) {
        if (err) return cb(err);
        
        cb(null,code);
        
    });
};

loadWarrior("88/simplified/Imp.red",function(err,code) {
    
    console.log(code);
    
    console.log(redcode.preparse(code));
    console.log("\n--------------- EVAL -------------\n");
    
    setTimeout(function() {
        
        var parsed = redcode.parse(code);
        console.log("Compiled ",parsed.lines.length," lines");
        console.log(parsed.lines);
        
        //redcode.run(code);
        
        
        setTimeout(function() {

            var core = new vm.Core(8000);
            
            core.run(code);
            
        },100);
        
    },100);
    
    
    
});
