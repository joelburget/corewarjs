(function() {
    

var preparse = require("./redcode.js").preparse;
var parse = require("./redcode.js").parse;


var Core = function(coresize) {
    this.lines = [];
    this.coresize = coresize;
    this.maxIterations = 100;
}

Core.prototype.execOne = function(opcode,modifier,modea,expra,modeb,exprb) {

    var a,b;
    
    console.log(" rel  ",opcode,modea,expra,modeb,exprb);
    
    a = this.address(modea,expra)%this.coresize;
    
    if (exprb!==null) {
        b = this.address(modeb,exprb)%this.coresize;
    }
    
    console.log(" abs  ",opcode,a,b);
    
    if (opcode=="MOV") {
        
        //Copy
        this.lines[b] = this.lines[a];
        
    } else if (opcode=="NOP") {
        
        // do nothing
    } else if (opcode=="JMP") {
        
        
    } else if (opcode=="DAT") {
        
        console.log("got DAT, killing...");
        //Kill the process
        this.alive = false;
    }
    
};

Core.prototype.address = function(mode,expr) {
    if (mode=="$") {
        return this.i+expr;
    }
};
Core.prototype.run = function(code) {
    
    var parsed = parse(code,{
        "CORESIZE":this.coresize
    });
    
    console.log("Running ",parsed.lines.length," instructions, start at",parsed.start);
    
    //TODO put at random pos
    this.lines = parsed.lines;
    
    this.i = parsed.start;
    
    this.alive = true;
    
    for (var iterations=0;iterations<this.maxIterations && this.alive;iterations++) {
        console.log("EXEC ",iterations,this.i);
        var line = this.lines[this.i];
        
        if (!line || !line[0]) {
            console.log("No instructions, killing...");
            break;
        }
        
        this.execOne(line[0][0].toUpperCase(),line[0][1].toUpperCase(),line[1][0],line[1][1],line[2]?line[2][0]:null,line[2]?line[2][1]:null);
        this.i++;
    }
    
    
}

exports.Core = Core;

})();