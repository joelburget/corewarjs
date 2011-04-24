
var Dashboard = function(){
    var self = this;
    
    this.scripts = [];
    
	// build editor & bind controls
	jQuery('.editorContainer').each(function(i,cnt) {
	    
	    var scriptId=cnt.id.replace("warrior_","");
	    
	    self.scripts.push(scriptId);
	    
	    self.editorLoad(scriptId);
	    
	    /*
	    var acewidget = jQuery(".editor",cnt).acewidget({
    		width		: "350px",
    		height		: "600px",
    		mode        : "text"
    	});
	    acewidget.bind("load", function(){
    		acewidget.setTabSize(4, function(result){
    			console.log("setTabSize", result.status)
    		});
    	});
    	*/
    	
    	// "Change..." button
    	jQuery('input.reload',cnt).click(function(){
    	    self.editorLoad(scriptId);
	    });

    	// "precompile..." button
    	jQuery('input.translate',cnt).click(function(){
    	    //self.editorLoad(scriptId,function() {
        	    self.editorGetValue(scriptId,function(err,code) {
        	        self.editorSetValue(scriptId,preparse(code));
        	    });
	        //});
	    });
  	
    	// "compile..." button
    	jQuery('input.compile',cnt).click(function(){
    	    //self.editorLoad(scriptId,function() {
        	    self.editorGetValue(scriptId,function(err,code) {
        	        var parsed = parse(code);
        	        self.editorSetValue(scriptId,parsed.cleanSource);
        	    });
	        //});
	    });
	    
    	// "reload" button
    	jQuery('input.change',cnt).click(function(){

            jQuery('#botswitcher input#changebotid').val(scriptId);
    		jQuery('#botswitcher').show();

    	});
    	
	});
	
	
	// Switcher: "Load!" button
	jQuery('#botswitcher input.load').click(function() {
	    var scriptId=jQuery('#botswitcher input#changebotid').val();

	    var url = jQuery('#botswitcher input#changeboturl').val();
	    var library = jQuery('#botswitcher select#changebotlibrary').val();
        
        if (library) {
            url=library;
        }
        
        if (url) {
            jQuery(".editorContainer#warrior_"+scriptId+" .scriptUrl").text(url);
            self.editorLoad(scriptId);
        }
        
	    
	    
	    jQuery('#botswitcher').hide();
	    
	});
	
	//Change viewer
	
	jQuery('#viewerselect').change(function() {
	
	    self.viewerReset();
	});
    

	
	
	//Load library
	jQuery.get('/warriors/list.txt',function(list) {
	    jQuery('#botswitcher select#changebotlibrary')[0].innerHTML = "<option value=''>Choose...</option>"+_.map(list.split("\n"),function(w) {
	        return "<option value='"+w+"'>"+w+"</option>";
	    }).join("");
	});
	
	this.viewerCtor();
}

Dashboard.prototype.editorSetValue	= function(scriptId, scriptData){
    /*
	jQuery("#editorContainer .menu .value").text(scriptId)
	this.acewidget.setValue(scriptData, function(result){
		console.log("setValue", result.status)
	});*/
	
	jQuery(".editorContainer#warrior_"+scriptId+" textarea").val(scriptData);
	
}

Dashboard.prototype.editorGetValue	= function(scriptId,callback){
	
	callback(null,jQuery(".editorContainer#warrior_"+scriptId+" textarea").val());
	
}

Dashboard.prototype.editorLoad = function(scriptId,callback) {
    var self=this;
    self.editorSetValue(scriptId,"loading...");
    loadCode(jQuery(".editorContainer#warrior_"+scriptId+" .scriptUrl").text(),function(err,code) {
        self.editorSetValue(scriptId,code);
        if (callback) callback();
    })
    
}

Dashboard.prototype.setGameStatus = function(status) {
    jQuery("#gamestatus").text(status);
} 


//////////////////////////////////////////////////////////////////////////////////
//		viewer stuff							//
//////////////////////////////////////////////////////////////////////////////////

Dashboard.prototype.viewerCtor	= function()
{
	this.viewerReset();
	this.viewerListen();
	jQuery('#viewerContainer .menu input[value=start]').live('click', function(){
		this.viewerStart();
	}.bind(this));
	jQuery('#viewerContainer .menu input[value=stop]').live('click', function(){
		this.viewerReset();
	}.bind(this));
}
Dashboard.prototype.viewerDtor	= function(){
}


Dashboard.prototype.viewerReset	= function()
{
	jQuery("#viewer").empty().append(
		jQuery('<iframe>').attr({
			id	: "viewerIframe",
			src	: 'viewers/'+jQuery("#viewerselect").val()+'/index.html',
			width	: jQuery("#viewer").width(),
			height	: jQuery("#tableContainer").height()
		})
	);
}

Dashboard.prototype.viewerCall	= function(event, callback){
	var destWindow	= document.getElementById("viewerIframe").contentWindow;
	
	//Need to optimize this, we send 160k events in a second
	
	if (destWindow.viewer) {
	    var method = destWindow.viewer.receiveEvent(event.type,event.data);
	}
	
	
	/*
	// if a callback is present, install it now
	if( callback ){
		event.userdata	= event.userdata	|| {}
		event.userdata.callback	= "editorCall-"+Math.floor(Math.random()*99999).toString(36);
		window[event.userdata.callback]	= function(data){
			callback(data)
		};
	}
	// post the message
	destWindow.postMessage(JSON.stringify(event), "*");
	*/
}

Dashboard.prototype.viewerStart	= function(){

    var self = this;
    var scriptsData = {};
    var warriors = [];
    
    
	// actually start the game
	var allLoaded	= function(){
	    
	    self.setGameStatus("Parsing...");
	    
	    jQuery.each(scriptsData, function(scriptId, code){
	        
	        warriors.push(new Warrior(scriptId,null,code));
	    });
	    
		self.setGameStatus("Starting...");
		
		setTimeout(function() {
		    
            var core = new Core();
            core.initialize();
            
            core.loadWarriors(warriors);
            
            var running = true;
            
            
            
            _.each(["change","exec","victory","defeat","stalemate"],function(evtName) {
                
                core.subscribe(evtName,function(data) {
                    
                    
                    if (evtName=="victory") { // || evtName=="defeat"
                        //console.log("got ",evtName,data);
                        self.setGameStatus("Won by warrior "+data);
                        running = false;
                    }
                    if (evtName=="stalemate") {
                        //console.log("got ",evtName);
                        self.setGameStatus("Stalemate!");
                        running = false;
                    }
                    
                    self.viewerCall({
            			type	: "core"+evtName.substr(0,1).toUpperCase() + evtName.substr(1),
            			data	: data
            		});
                });
            });
            
            
            
            self.viewerCall({
    			type	: "gameStart",
    			data	: null
    		}, function(result){
    			//console.assert(result.status === 'succeed' )
    			//console.log("game started");
    		});
        
            var runFew = function() {
                for (var i=0;i<1000 && running;i++) {
                    core.runOnce();
                }
                    
                if (running) setTimeout(runFew,0);
            }
        
            runFew();
            
          
          
         },10);
         
		
	};
    
    
    var loaded	= function(scriptId, scriptData){
		scriptsData[scriptId]	= scriptData;
		if( _.size(scriptsData) == self.scripts.length) {
			allLoaded()
		}			
	}
	
	_.each(this.scripts, function(scriptId) {
		
		self.editorGetValue(scriptId,function(err,scriptData){
				loaded(scriptId, scriptData);
		});		
		
	},this);

    
	
}

Dashboard.prototype.viewerListen	= function()
{
	jQuery(window).bind('message', function(jQueryEvent){
		var domEvent	= jQueryEvent.originalEvent;
		var viewerWin	= document.getElementById("viewerIframe").contentWindow;
		// ignore events which arent from #viewerIframe
		if( domEvent.source !== viewerWin )	return;
		var viewerEvent	= JSON.parse(domEvent.data)
		// ignore any non request (aka replies)
		if( "type" in viewerEvent === false )	return;


		var eventType	= viewerEvent.type;
		var eventData	= viewerEvent.data;
		// forward to the viewerOn{EventType}() function on the children object
		var methodName	= "viewerOn" + eventType.substr(0,1).toUpperCase() + eventType.substr(1);
		if( methodName in this )	this[methodName](eventType, eventData);

		//console.log("viewer message", event.origin, event.data)
		//console.dir(event)
		//console.log(event.source === document.getElementById("viewerIframe").contentWindow);
		//console.log(event.source === document.getElementById("viewerIframe"));
		//console.log("**********************")
		//console.log("**********************")
		//console.log("**********************")
		//console.dir(event)
	}.bind(this))
}

