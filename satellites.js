'use strict';

var fs 			= require('fs');
var readline 	= require('readline');
var util 		= require('util');

var utility 	= require('./utility');

var satellites = [];

/*
Parse the generate.txt file for satellites
and for satellise phone locations.

Returns a promise with Map of satellite, start and end
positions in the x, y, z space.
*/
satellites.objectify = function(){
	
	var nodes = new Map();
	
	return new Promise(function(resolve, reject){
		var lineReader = readline.createInterface({
			input: fs.createReadStream('generate.txt')
		});

		lineReader.on('line', function (node) {
			
			var nodeArr = node.split(",");
			
			//We run this part of the code when
			//parsing satellite positions
			if(nodeArr[0].lastIndexOf("SAT",0) === 0){
				var newNode = {};
				newNode.x = utility.locToVecPoint('x', nodeArr);
				newNode.y = utility.locToVecPoint('y', nodeArr);
				newNode.z = utility.locToVecPoint('z', nodeArr);
				newNode.neighbours = [];
				nodes.set(nodeArr[0], newNode);
			}
			
			//This part is used when parsin the START and END
			//locations for the route from the last line
			//of generate.txt
			if(nodeArr[0].lastIndexOf("ROUTE",0) === 0){
				var startNode = {};
				startNode.x = utility.locToVecPoint('x1', nodeArr, true);
				startNode.y = utility.locToVecPoint('y1', nodeArr, true);
				startNode.z = utility.locToVecPoint('z1', nodeArr, true);
				startNode.neighbours = [];
				
				var endNode = {};
				endNode.x = utility.locToVecPoint('x2', nodeArr, true);
				endNode.y = utility.locToVecPoint('y2', nodeArr, true);
				endNode.z = utility.locToVecPoint('z2', nodeArr, true);
				endNode.neighbours = [];
				
				nodes.set("START", startNode);
				nodes.set("END", endNode);
			}
			
		});
		
		lineReader.on('close', function (node) {
			resolve(nodes);
		});
	});	
};

/*
Solve which satellites, end and start points
got line of sight.

Returns a promise with Map of satellite, start and end
positions in the x, y, z space with each containing
and array of targets (satellites, start or end points)
that got line of sight with distance to each target.
*/
satellites.neighbours = function(nodeMap){
	
	var relations = new Map();
	
	return new Promise(function(resolve, reject){
		nodeMap.forEach(function(refvalue, refkey, refmap) {
			var refneighbours = [];
			refmap.forEach(function(targetvalue, targetkey, targetmap){
				if(refkey !== targetkey){
					var targetdistance = utility.distanceToNode(refvalue, targetvalue, refkey, targetkey);
					if(targetdistance > 0){
						refneighbours[targetkey] = targetdistance;
					}
				}
			});
			refvalue.neighbours = refneighbours;
			relations.set(refkey, refvalue);
		});
		resolve(relations);
	});
};

/*
Use some brute force to find out a valid path
across the nodes.

This is no way optimised for shortest route or
fewest hops.
*/
satellites.paths = function(relations){
	
	//Store file for later debuging by hand.
	fs.writeFileSync('relations.txt', util.format(relations));
	
	var route = [];
	
	return new Promise(function(resolve, reject){
		
		var thisNode = "START";
		var targetNodes = Object.keys(relations.get("END").neighbours);
		var startNodes = Object.keys(relations.get("START").neighbours);
		
		var rejects = 0;
		var rejected = [];
		
		console.log("Nodes visible for START", startNodes);
		console.log("Nodes visible for END", targetNodes);
		
		//Simple brute force loop for finding a valid path
		while(targetNodes.indexOf(thisNode) == -1){
			
			route.push(thisNode);
			thisNode = satellites.nextHop(thisNode, relations, route, rejects, rejected);
			
			if(thisNode == false){
				rejects = rejects + 1;
				rejected.push(route.pop());
				thisNode = route.pop();
			} else {
				rejects = 0;	
			}
		}
		
		route.push(thisNode);
		route.push("END");
		resolve(route);
	});
}

/*
	Simple fuction that returns the next possible hop.
	Will ignore nodes that have previously determined as
	ones that dont progress the route finding ie. dead ends.
	(rejected array).
	
	We also ignore hops that have already been choosen as
	a waypoint in the route array.
*/
satellites.nextHop = function(nodename, relations, route, rejects, rejected){
	var options = Object.keys(relations.get(nodename).neighbours);
	var index = 0 + rejects;
	
	while(true){
		if(route.indexOf(options[index]) == -1 && rejected.indexOf(options[index]) == -1){
			var selection = typeof options[index] !== 'undefined' ? options[index] : false;
			return selection;
		} else {
			index = index+1;
		}	
	}
};

module.exports = satellites;
