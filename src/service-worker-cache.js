
var connect = require("can-connect");
var can = require("can/util/util");
var getItems = require("./helpers/get-items");
var canSet = require("can-set");

/**
 * @module can-connect/service-worker
 * @parent can-connect.modules
 */
module.exports = connect.behavior("service-worker",function(base){
	
	var worker = new Worker(this.workerURL);
	var requestId = 0;
	var requestDeferreds = {};
	var isReady = new can.Deferred();
	
	var makeRequest = function(data){
		var reqId = requestId++;
		var def = new can.Deferred();
		requestDeferreds[reqId] = def;
		
		isReady.then(function(){
			worker.postMessage({
				request: data,
				requestId: reqId
			});
		});
		
		return def.promise();
	};
	worker.onmessage = function(ev){
		console.log("MAIN - got message", ev.data.type)
		if(ev.data.type === "ready"){ 
			isReady.resolve();
		} else if(ev.data.type === "response") {
			requestDeferreds[ev.data.requestId].resolve(ev.data.response);
		}
		
	};
	
	return {
		getListData: function(params){
			return makeRequest({
				params: params
			});
		}
	};
});