
/**
 * Module dependencies.
 */

var express = require('express'),
    sys = require('sys'),
    
    path = require('path'),
    fs = require('fs'),
    
    request = require('request');
    
var app = module.exports = express.createServer();



app.configure(function(){
//    app.set('views', __dirname + '/views');
    
    app.use(express.logger({ format : ":method :url"}));
    app.use(express.bodyParser());
    
    app.use(app.router);
  
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    
    app.use(express.static(path.normalize(__dirname + '/../frontend/')));
    
    
});

app.configure('production', function(){
   app.use(express.errorHandler()); 
   
   app.use(express.static(path.normalize(__dirname + '/../frontend/')));
 
});


var jsonp_return = function(req,res,ret) {
    res.send(req.param("callback")?(req.param("callback")+"("+JSON.stringify(ret)+");"):ret);
};
var jsonp_return_direct = function(req,res,ret) {
    res.send(req.param("callback")?(req.param("callback")+"("+ret+");"):ret);
};

app.get('/jsonpify', function(req, res){
    
    var json = req.param("url");
    
    request({'uri':json},function(error, response, body) {
        jsonp_return(req,res,body);
    });
    
});



// Only listen on $ node app.js
if (!module.parent) {
    console.log("Server starting on port ",process.env.PORT || 40008);
    app.listen(process.env.PORT || 40008);
}