var fs = require("fs");
var redcode = require("../src/redcode.js");

var loadWarrior = function(path,cb) {
    fs.readFile("warriors/"+path,'utf-8',function(err,code) {
        if (err) return cb(err);
        
        cb(null,code);
        
    });
};

loadWarrior("88/simplified/Imp.red",function(err,code) {
    
    console.log(code);
    
    console.log(redcode.parse(code));
    console.log("\n--------------- EVAL -------------\n");
    
    setTimeout(function() {
        
        var lines = redcode.getLines(code);
        console.log("Compiled ",lines.length," lines");
        
        redcode.run(code);
        
    },100);
    
    
    
});
