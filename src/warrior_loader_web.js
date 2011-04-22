var loadCode = function(path,cb) {
    jQuery.ajax({
        "method":"GET",
        "url":path,
        "error":function(err) {
            
            //Retry with jsonpify proxy
            jQuery.ajax({
                "method":"GET",
                "dataType":"jsonp",
                "url":"/jsonpify?url="+encodeURIComponent(path),
                "error":function(err) {
                    cb(err);
                },
                "success":function(code) {

                    cb(null,code);
                }
            });
            
        },
        "success":function(code) {
        
            cb(null,code);
        }
    });
};

var loadWarrior = function(name,path,cb) {
    
    loadCode(path,function(err,code) {
        
        if (err) return cb(err);
        
        var w = new Warrior(name,null,code);
        
        cb(null,w);
        
    });
};
