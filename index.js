'use strict';

var utility = require('./utility');
var satellites = require('./satellites');

//Simple chain of promises to solve the problem in hand.
satellites.objectify()
	.then(satellites.neighbours)
	.then(satellites.paths)
	.then(function(route){
		console.log('Solution: ' + route);
	}
);
