var fs = require("fs");
var redcode = require("../src/redcode.js");
var core = require("../src/core.js");

var loadCode = require("../src/warrior_loader_node.js").loadCode;

var core = new core.Core();




loadCode("warriors/88/normal/Fat_Expansion_V.red",function(err,code) {
    
    
    console.log("\n--------------- SOURCE -------------\n");
    
    console.log(code);
    
    setTimeout(function() {
    
        console.log("\n--------------- JS TRANSLATION -------------\n");
    
        setTimeout(function() {
    
            console.log(redcode.preparse(code));
    
            console.log("\n--------------- ASSEMBLY -------------\n");
    
            setTimeout(function() {
        
                var parsed = redcode.parse(code);
                console.log("Compiled ",parsed.lines.length," lines, start at",parsed.start,"\n\n");
        
                console.log(parsed.lines);
        
                //console.log(parsed.instructions);
        
                console.log("\n\n");
            },100);
        },100);
    },100);
    
    
    
});
