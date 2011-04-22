//////////////////////////////////////////////////////////////////////////////////
//		Viewer ctor/dtor						//
//////////////////////////////////////////////////////////////////////////////////

var Dashboard	= function(){
	this.editorCtor();
	this.viewerCtor();
	this.scriptsListUiCtor();
}

Dashboard.prototype.destroy	= function(){
	this.scriptsListUiDtor();
	this.viewerDtor();
	this.editorDtor();
}


//////////////////////////////////////////////////////////////////////////////////
//		acewidget stuff							//
//////////////////////////////////////////////////////////////////////////////////

Dashboard.prototype.editorCtor	= function()
{
	// build editor
	this.acewidget	= jQuery('#editor').acewidget({
		width		: "450px",
		height		: "400px",
		mode        : "text"
	});
	// setTabSize to 8
	this.acewidget.bind("load", function(){
		this.acewidget.setTabSize(8, function(result){
			console.log("setTabSize", result.status)
		});
	}.bind(this));
	// bind the clear button
	jQuery('#editorContainer .menu input[value=clear]').click(function(){
		jQuery("#editorContainer .menu .value").text("none")
		this.acewidget.setValue("", function(result){
			console.log("setValue", result.status)
		});		
	}.bind(this));
}

Dashboard.prototype.editorDtor	= function()
{
}

Dashboard.prototype.editorSetValue	= function(scriptId, scriptData){
	jQuery("#editorContainer .menu .value").text(scriptId)
	this.acewidget.setValue(scriptData, function(result){
		console.log("setValue", result.status)
	});
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
			src	: 'viewers/console/index.html',
			width	: '450px',
			height	: '400px'
		})
	);
}

Dashboard.prototype.viewerCall	= function(event, callback){
	var destWindow	= document.getElementById("viewerIframe").contentWindow;
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
}

Dashboard.prototype.viewerStart	= function(){
	var scripts	= this.scriptsListCollect();
	var editScriptId= jQuery("#editorContainer .menu .value").text()
	// load all scriptsData from their scriptUrl
	var scriptsData	= {}
	jQuery.each(scripts, function(scriptId, scriptUrl){
		var loaded	= function(scriptId, scriptData){
			scriptsData[scriptId]	= scriptData;
			if( Object.keys(scriptsData).length == Object.keys(scripts).length ){
				allLoaded()
			}			
		}
		if( scriptId === editScriptId ){
			this.acewidget.getValue(function(result){
				console.log("getValue", scriptData)
				var scriptData	= result.data.data;
				loaded(scriptId, scriptData);
			});
		}else{
			loadCode(scriptUrl, function(err,scriptData){
				loaded(scriptId, scriptData);
			}.bind(this), 'html');		
		}
	}.bind(this));

    var warriors = [];

	// actually start the game
	var allLoaded	= function(){
	    var self = this;
	    console.log("all warriors loaded");
	    
	    jQuery.each(scriptsData, function(scriptId, code){
	        
	        warriors.push(new Warrior(scriptId,null,code));
	    });
	    
	    console.log("all warriors parsed");
		
		
		setTimeout(function() {
		    
            var core = new Core();
            core.initialize();
            console.log(warriors);
            core.loadWarriors(warriors);
            
            var running = true;
            
            _.each(["change","exec","victory","defeat","stalemate"],function(evtName) {
                
                core.subscribe(evtName,function(data) {
                    
                    if (evtName=="victory" || evtName=="defeat" || evtName=="stalemate") {
                        console.log("got game end event : ",evtName);
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
    			console.assert(result.status === 'succeed' )
    			console.log("game started");
    		});
        
            for (var i=0;i<100000 && running;i++)
                core.runOnce();
          
          
         },10);
         
		
	}.bind(this);
	
}

Dashboard.prototype.viewerOnEnd	= function(eventType, eventData)
{
	console.log("viewerOnEnd", eventType, eventData)
	var winScriptId	= eventData.deathOrder[eventData.deathOrder.length - 1];
	var str		= "Game won by " + winScriptId + " after "+eventData.turnIdx+"-turns";
	alert(str)
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


//////////////////////////////////////////////////////////////////////////////////
//		Script List Ui							//
//////////////////////////////////////////////////////////////////////////////////

Dashboard.prototype.scriptsListUiCtor	= function()
{
	jQuery('#ScriptListMenu input[value=insert]').live('click', function(){
		this.scriptsListUiAppendItem();
	}.bind(this));

	jQuery('#ScriptList input[type=button][value=edit]').live('click', function(event){
		var target	= event.currentTarget;
		var item	= jQuery(target).parent('div.item');
		var scriptId	= jQuery("input[name=scriptId]", item).val();
		var scriptUrl	= jQuery("input[name=scriptUrl]", item).val();
		
		loadCode(scriptUrl, function(error,scriptData){
			this.editorSetValue(scriptId, scriptData)
		}.bind(this), 'html');
		
	}.bind(this));

	jQuery('#ScriptList input[type=button][value=remove]').live('click', function(event){
		var target	= event.currentTarget;
		var item	= jQuery(target).parent('div.item');
		if( this.scriptsListUiNbItems() == 1 )	return;
		item.remove();
	}.bind(this));

	jQuery('#ScriptList .item input[type=text]').live('change', function(event){
		console.log("changed", event)
		this.scriptsListPutLocation();
	}.bind(this));


	// initialisation of the item in ScriptsList	
	var scripts	= this.scriptsListGetLocation();
	console.log("scripts", scripts)
	if( scripts ){
		this.scriptsListUiClear();
		Object.keys(scripts).forEach(function(scriptId){
			var scriptUrl	= scripts[scriptId];
			this.scriptsListUiAppendItem(scriptId, scriptUrl)
		}.bind(this))
	}else{
		this.scriptsListUiAppendItem();
	}
}

Dashboard.prototype.scriptsListUiDtor	= function()
{
}

Dashboard.prototype.scriptsListUiNbItems	= function()
{
	return jQuery('#ScriptList div.item').length;
}

Dashboard.prototype.scriptsListUiClear	= function()
{
	jQuery('#ScriptList div.item').remove();
}

Dashboard.prototype.scriptsListUiAppendItem	= function(scriptId, scriptUrl)
{
	// TODO to honor scriptId, scriptUrl
	var element	= jQuery('#ScriptListItemSample div.item').clone();
	if( scriptId )	jQuery("input[name=scriptId]", element).val(scriptId)
	if( scriptUrl )	jQuery("input[name=scriptUrl]", element).val(scriptUrl)
	element.appendTo('#ScriptList');
}

/**
 * collect the data in the scriptsList
*/
Dashboard.prototype.scriptsListCollect	= function()
{
	var scripts	= {};
	jQuery('#ScriptList div.item').each(function(){
		var scriptId	= jQuery("input[name=scriptId]", this).val();
		var scriptUrl	= jQuery("input[name=scriptUrl]", this).val();
		if( scriptId.length === 0 || scriptUrl.length === 0 )	return;
		scripts[scriptId]	= scriptUrl;
	});
	return scripts;
}

Dashboard.prototype.scriptsListIdConflict	= function()
{
	var scripts	= this.scriptsListCollect();
	var nbUiItems	= jQuery('#ScriptList div.item').length;
	var conflicting	= Object.keys(scripts).length != nbUiItems;
	return conflicting;
}

Dashboard.prototype.scriptsListGetLocation	= function()
{
	if( !window.location.hash )	return null;
	var hash	= window.location.hash.substr(1);
	var scripts	= JSON.parse(hash);
	if( Object.keys(scripts).length === 0 )	return null;
	return scripts;
}

Dashboard.prototype.scriptsListPutLocation	= function()
{
	var scripts	= this.scriptsListCollect();
	var str		= ''
	if( Object.keys(scripts).length > 0 )	str	= JSON.stringify(scripts)
	window.location.hash	= '#'+str;
}


