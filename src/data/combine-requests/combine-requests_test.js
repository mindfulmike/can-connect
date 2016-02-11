
var QUnit = require("steal-qunit");
var persist = require("can-connect/data/url/");
var combineRequests = require("can-connect/data/combine-requests/");
var set = require("can-set");
require("when/es6-shim/Promise");
var map = require("can-connect/helpers/").map;

var getId = function(d){ return d.id};


QUnit.module("can-connect/combine_requests",{
	setup: function(){
	}
});


QUnit.test("basics", function(){
	stop();
	var count = 0;


	var res = combineRequests( {
		getListData: function(params){
			deepEqual(params,{},"called for everything");
			count++;
			equal(count,1,"only called once");
			return Promise.resolve([
				{id: 1, type: "critical", due: "today"},
				{id: 2, type: "notcritical", due: "today"},
				{id: 3, type: "critical", due: "yesterday"},
				{id: 4},
				{id: 5, type: "critical"},
				{id: 6, due: "yesterday"}
			]);
		}
	});

	var p1 = res.getListData({type: "critical"});
	var p2 = res.getListData({due: "today"});
	var p3 = res.getListData({});

	Promise.all([p1,p2,p3]).then(function(result){
		var res1 = result[0],
			res2 = result[1],
			res3 = result[2];


		deepEqual(map.call(res1.data, getId), [1,3,5]);
		deepEqual(map.call(res2.data, getId), [1,2]);
		deepEqual(map.call(res3.data, getId), [1,2,3,4,5,6]);
		start();
	});
});


QUnit.test("ranges", function(){
	stop();
	var count = 0;

	var res = combineRequests(  {
		getListData: function(params){
			deepEqual(params,{start: 0, end: 5},"called for everything");
			count++;
			equal(count,1,"only called once");
			return Promise.resolve([
				{id: 1, type: "critical", due: "today"},
				{id: 2, type: "notcritical", due: "today"},
				{id: 3, type: "critical", due: "yesterday"},
				{id: 4},
				{id: 5, type: "critical"},
				{id: 6, due: "yesterday"}
			]);
		},
		algebra: set.comparators.rangeInclusive("start","end")
	});


	var p1 = res.getListData({start: 0, end: 3});
	var p2 = res.getListData({start: 2, end: 5});

	Promise.all([p1,p2]).then(function(result){
		var res1 = result[0], res2 = result[1];

		deepEqual(map.call(res1.data, getId), [1,2,3,4]);
		deepEqual(map.call(res2.data, getId), [3,4,5,6]);
		start();
	});


});

QUnit.test("Rejects when getListData rejects", function(){
	stop();

	var res = combineRequests({
		getListData: function(){
			return Promise.reject(new Error("didn't work"));
		}
	});

	var promise = res.getListData({start: 0, end: 3});

	promise.then(null, function(err){
		equal(err.message, "didn't work", "promise was rejected");
		start();
	});
});
