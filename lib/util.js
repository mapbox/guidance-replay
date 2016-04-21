var turfDistance = require('turf-distance');
var turfBearing = require('turf-bearing');
var turfAlong = require('turf-along');

module.exports = util = {};
util.version = version;
util.distance = distance;
util.bearing = bearing;
util.along = along;
util.speed = speed;
util.distanceFromSpeed = distanceFromSpeed;
util.timeFromSpeed = timeFromSpeed;
util.slope = slope;
util.findYWithSlope = findYWithSlope;
util.findY = findY;
util.findX = findX;
util.changeSegment = changeSegment;

/**
* Function that determines if the directions response
* is v5 or v4.
*
* @param {Object} response Directions API response object.
* @returns {string} v Directions API response version.
*/
function version(response) {
  var v;
  if (response.code) {
    v = 'v5';
  } else {
    v = 'v4';
  }
  return v;
}

/**
 * Wrapper around turf-distance to return the distance,
 * in meters, between two coordinates.
 * @param {Array<number>} coordA Starting coordinate.
 * @param {Array<number>} coordB Ending coordinate.
 * @returns {Number} kilometers Distance, in kilometers, between
 * the two points.
 */
function distance(coordA, coordB) {
  var kilometers = turfDistance(
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': coordA
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': coordB
      }
    });
  return kilometers;
}

/**
 * Wrapper around turf-bearing to return the bearing,
 * in degrees, between two coordinates.
 * @param {Array<number>} coordA Starting coordinate.
 * @param {Array<number>} coordB Ending coordinate.
 * @returns {Number} degrees Bearing, in degrees, between
 * the two points.
 */
function bearing(coordA, coordB) {
  var degrees = turfBearing(
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': coordA
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': coordB
      }
    });
  return degrees;
}

/**
 * Wrapper around turf-along to return the coordinates
 * of a point along the line between two provided coordinates.
 * @param {Array<number>} coordA Starting coordinate.
 * @param {Array<number>} coordB Ending coordinate.
 * @param {number} distance Distance, in kilometers. 
 * @returns {Array<number>} Coordinates of point along the line.
 */
function along(coordA, coordB, dist) {
  var line = {
    'type': 'Feature',
    'properties': {},
    'geometry': {
      'type': 'LineString',
      'coordinates': [coordA, coordB]
    }
  };
  var along = turfAlong(line, dist, 'kilometers');
  return along.geometry.coordinates;
}

/**
 * Convert meters/seconds to km/hour.
 *
 * @param {number} meters Distance in meters.
 * @param {number} seconds Time in seconds.
 * @returns {number} Speed in kilometers per hour.
 */
function speed(meters, seconds) {
  if (!meters || !seconds) return 0;
  var km = meters / 1000;
  var hours = seconds / ( 60 * 60 );
  return (km / hours);
}

/**
 * Given km/hour and num seconds, calculate
 * distance in meters.
 *
 * @param {number} speed Speed in kilometers per hour.
 * @param {number} seconds Time in seconds.
 * @returns {number} Distance in meters.
 */
function distanceFromSpeed(speed, seconds) {
  var hours = seconds / ( 60 * 60 );
  var km = speed * hours;
  var meters = km * 1000;
  return meters;
}

/**
 * Given km/hour and num seconds, calculate
 * distance in meters.
 *
 * @param {number} speed Speed in kilometers per hour.
 * @param {number} meters Distance in meters.
 * @returns {number} Time in seconds.
 */
function timeFromSpeed(speed, meters) {
  var km = meters / 1000;
  var hours = km / speed;
  var seconds = hours * ( 60 * 60 );
  return seconds;
}

/**
 * Find the slope of a line given two points.
 *
 * @param {Array<number>} a Point.
 * @param {Array<number>} b Another point.
 * @returns {number} Slope of the line formed by points a and b.
 */
function slope(a, b) {
  return (b[1] - a[1]) / (b[0] - a[0]);
}

/**
 * Given an x-coordinate, slope of a line, and another 
 * point on the line, find the y-coordinate.
 *
 * @param {number} m Slope of the line.
 * @param {number} x X-coordinate of desired point.
 * @param {Array<number>} point Another point on the line.
 * @returns {number} y Y-coordinate of desired point.
 */
function findYWithSlope(m, x, point) {
  var intercept = point[1] - (m * point[0]);
  var y = (m * x) + intercept;
  return y;
}

/**
 * Given a y-coordinate, slope of a line, and another 
 * point on the line, find the x-coordinate.
 *
 * @param {number} m Slope of the line.
 * @param {number} y y-coordinate of desired point.
 * @param {Array<number>} point Another point on the line.
 * @returns {number} x x-coordinate of desired point.
 */
function findXWithSlope(m, y, point) {
  var intercept = point[1] - (m * point[0]);
  var x = (y - intercept) / m;
  return x;
}

/**
 * Given two points on a line, and an x-coordinate,
 * find the y-coordinate.
 * 
 * @param {Array<number>} pointA A point on the line.
 * @param {Array<number>} pointB Another point on the line.
 * @param {number} x X-coordinate of the desired point.
 * @returns {number} Y-coordinate of desired point.
 */
function findY(pointA, pointB, x) {
  return findYWithSlope(slope(pointA, pointB), x, pointA);
}

/**
 * Given two points on a line, and a y-coordinate,
 * find the x-coordinate.
 * 
 * @param {Array<number>} pointA A point on the line.
 * @param {Array<number>} pointB Another point on the line.
 * @param {number} y Y-coordinate of the desired point.
 * @returns {number} S-coordinate of desired point.
 */
function findX(pointA, pointB, x) {
  return findXWithSlope(slope(pointA, pointB), x, pointA);
}

/**
 * Given two speeds and a rate of change, calculate the distance
 * (in meters) it will take to complete the speed change.
 *
 * @param {number} speedA Speed in kilometers per hour
 * @param {number} speedB Another speed in kilometers per hour.
 * @param {number} rate Rate of change, in kilometers per hour per second.
 * @returns {Object} Two properties: meters, the distance it will.
 * take to complete the change in speed, and seconds, the length of time.
 */
function changeSegment(speedA, speedB, rate) {
  var changeDur = Math.abs((speedA - speedB) / rate) / 3600; // hours
  var seconds = changeDur * 3600;
  var avgSpeed = ((speedA + speedB) / 2); // kmh
  var meters = (changeDur * avgSpeed) * 1000; // meters
  return {
    meters: meters,
    seconds: seconds
  };
}
