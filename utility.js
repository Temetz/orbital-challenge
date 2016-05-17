'use strict';

var Vector = require('vectorz/3d');

var utility = [];

/*
Calculate the distance between two nodes.
If the nodes dont have line of sight this returns 0.

Simple calculation of two vectors.
*/
utility.distanceToNode = function(n1, n2, refkey, targetkey){
	var rx, ry, rz, tx, ty, tz;

	rx = n1.x;
	ry = n1.y;
	rz = n1.z;

	tx = n2.x;
	ty = n2.y;
	tz = n2.z;

	var v1 = Vector(rx, ry, rz);
	var v2 = Vector(tx, ty, tz);
	var spaceL = v1.distance(v2);

	if(utility.los(v1, v2, refkey, targetkey)){
		return spaceL;
	} else {
		return 0;
	}
};

/*
Utility function for converting radians to degress.
*/
utility.radTodeg = function(radians){
	return parseFloat(radians) * (180 / Math.PI);
};

/*
Utility function for converting degress to radians.
*/
utility.degTorad  = function(degrees) {
	return parseFloat(degrees) * Math.PI / 180;
};

/*
Utility function for lat, lng and alt to 
a point in x, y, z space where 0,0,0
represents center of earth.
*/
utility.locToVecPoint = function(type, points, route){

	route = typeof route !== 'undefined' ? route : false;

	var latitude = 0;
	var longitude = 0;
	var altitude = 0;
	var R = 6371;
	var x, y, z, LAT, LON;

	if(route){
		switch(type){
			case 'x1':
				LAT = points[1] * Math.PI/180;
				LON = points[2] * Math.PI/180;
				return -R * Math.cos(LAT) * Math.cos(LON);
			break;

			case 'x2':
				LAT = points[3] * Math.PI/180;
				LON = points[4] * Math.PI/180;
				return -R * Math.cos(LAT) * Math.cos(LON);
			break;
				
			case 'y1':
				LAT = points[1] * Math.PI/180;
				LON = points[2] * Math.PI/180;
				return R * Math.sin(LAT);
			break;

			case 'y2':
				LAT = points[3] * Math.PI/180;
				LON = points[4] * Math.PI/180;
				return R * Math.sin(LAT);
			break;

			case 'z1':
				LAT = points[1] * Math.PI/180;
				LON = points[2] * Math.PI/180;
				return (R+altitude) * Math.cos(LAT) * Math.sin(LON);
			break;

			case 'z2':
				LAT = points[3] * Math.PI/180;
				LON = points[4] * Math.PI/180;
				return (R+altitude) * Math.cos(LAT) * Math.sin(LON);
			break;
		}
	} else {
		latitude = points[1];
		longitude = points[2];
		altitude = points[3];

		LAT = latitude * Math.PI/180;
		LON = longitude * Math.PI/180;

		switch(type){
			case 'x':
				return -(R+parseFloat(altitude)) * Math.cos(LAT) * Math.cos(LON);
			break;

			case 'y':
				return (R+parseFloat(altitude)) * Math.sin(LAT);
			break;

			case 'z':
				return (R+parseFloat(altitude)) * Math.cos(LAT) * Math.sin(LON);
			break;
		}
	}
}

/*
Returns true if two nodes have line of sight.
Returns false if two nodes dont have line of sight.
*/
utility.los = function(v1, v2, refkey, targetkey){

	//START and END cannot ever have line of sight
	if((refkey === "START" && targetkey === "END") || (refkey === "END" && targetkey === "START")){
		return false;
	}

	//When checking for ground to earth line of sight
	//we need to first determine the right vectors.
	//Else we would sometime end up with opposite angle
	//we wanted to calculate.
	if(refkey == "START" || refkey == "END"){

		var groundv = Math.round(v1.magnitude()) == 6371 ? v1 : v2;
		var satellitev = Math.round(v1.magnitude()) == 6371 ? v2 : v1;
		var spaceV = satellitev.sub(groundv);
		var groundSpaceAngle = 180-groundv.angleDeg(spaceV);

		return groundSpaceAngle > 90 ? true : false;
	}

	//Otherwise we are only checking the the lowest point
	//of the spaceVector between two satellites has height
	//that is more than the radius of the earth.
	var spaceVector = v1.sub(v2);
	var spaceAngle = utility.degTorad(180)-v2.angle(spaceVector);
	var lineHeight = v2.magnitude()*Math.sin(spaceAngle);

	return lineHeight >= 6371 ? true : false;
};

module.exports = utility;
