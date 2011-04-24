var fs = require("fs");
var redcode = require("../src/redcode.js");
var core = require("../src/core.js");
var _ = require("../src/underscore.js")._;

// https://github.com/coopernurse/node-pool
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name     : 'x',
    create   : function(callback) {
        callback(0);
    },
    destroy  : function(client) {  },
    max      : 1,
    idleTimeoutMillis : 30000,
    log : false
});



var loadCode = require("../src/warrior_loader_node.js").loadCode;

var core = new core.Core();

fs.readdir("warriors/88/normal/", function (err, files) {
  files.forEach(function (filename) {
  
    var normal = "warriors/88/normal/"+filename;
    var simplified = "warriors/88/simplified/"+filename;

    loadCode(normal,function(err,code_normal) {
        loadCode(simplified,function(err,code_simplified) {
        
            pool.acquire(function(client) {
                
            
                console.warn("\n\n------------------------------------",filename);
            
                var preparsed_normal = redcode.preparse(code_normal);
                var preparsed_simplified = redcode.preparse(code_simplified);

                //console.warn(preparsed_normal);
                //console.warn(preparsed_simplified);


                var parsed_normal = redcode.parse(code_normal);
                var parsed_simplified = redcode.parse(code_simplified);

                //console.warn(parsed_normal);
                //console.warn(parsed_simplified);
            
                if (_.isEqual(parsed_normal.parsed,parsed_simplified.parsed)) {
                
                    console.log("ok");
                } else {
                    
                        console.warn(preparsed_normal);
//                        console.warn(preparsed_simplified);

                    console.log("nok",parsed_normal,pased_simplified);
                }
            
                pool.release(client);
            });
        
        });
    });
  });
});