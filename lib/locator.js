var route = require('./route');
var turfAlong = require('turf-along');
var turfDistance = require('turf-distance');
var turfLinestring = require('turf-linestring');
var turfPoint = require('turf-point');
var util = require('./util');

var getSteps = route.getSteps;
var interpolateAccelDecel = route.interpolateAccelDecel;

module.exports = Locator;

/**
 * Generate the location of an event, in terms of step number or
 * coordinates, given any time along the route in milliseconds.
 *
 * @class
 * @param {Object} directions Response from Mapbox Directions API.
 */
function Locator(directions, options) {
  var spacing = (options && options.spacing) ? options.spacing : 'constant';
  var coordinates = [];
  var times = [];
  var timeCounter = 0;
  var i;

  // If in speedmode, generate coordinate <=> time mappings for maneuvers
  // using the interpolateAccelDecel() function.
  // If not in speedmode, generate coordinate <=> time mappings
  // using the API response.
  if (spacing === 'acceldecel') {
    var steps = getSteps(directions);
    var interpolate = interpolateAccelDecel(steps);
    coordinates.push(interpolate[0].geometry.coordinates[0]);
    times.push(0);
    for (i = 0; i < interpolate.length; i++) {
      var last = interpolate[i].geometry.coordinates.length - 1;
      var coord = interpolate[i].geometry.coordinates[last];
      timeCounter += interpolate[i].properties.coordinateProperties.times[last];
      coordinates.push(coord);
      times.push(timeCounter);
    }
  } else {
    var version = util.version(directions);
    if (version === 'v5') {
      for (i = 0; i < directions.routes[0].legs[0].steps.length; i++) {
        timeCounter = timeCounter + directions.routes[0].legs[0].steps[i].duration * 1000;
        times.push(timeCounter);
        coordinates.push(directions.routes[0].legs[0].steps[i].maneuver.location);
      }
    } else if (version === 'v4') {
      for (i = 0; i < directions.routes[0].steps.length; i++) {
        timeCounter = timeCounter + directions.routes[0].steps[i].duration * 1000;
        times.push(timeCounter);
        coordinates.push(directions.routes[0].steps[i].maneuver.location.coordinates);
      }
    }
    times.unshift(0); // adds a lower bounding value to times array
    times.pop(); // removes the arrival step where duration = 0
  }

  /**
   * Get times (milliseconds) and coordinates for the maneuvers
   * along a route.
   *
   * @returns {Object} result Object with `times` and `coordinates` arrays
   */
  this.maneuvers = function() {
    var result = {
      'times': times,
      'coordinates': coordinates
    };
    return result;
  };

  /**
   * Find the current Mapbox Directions API step (see 
   * https://www.mapbox.com/api-documentation/#retrieve-directions) given a time
   * along the route.
   *
   * @param {Number} time Time along the route in milliseconds.
   * @returns {Number} step Step along the route.
   */
  this.step = function(time) {
    for (i = 0; i < times.length; i++) {
      // If time is between current index and index + 1 or if the times value at index + 1 is the same (i.e. end of route)
      if (time >= times[i] && (time < times[i+1] || !times[i+1])) {
        var step = i;
      }
    }
    return step;
  };

  /**
   * Find the current coordinates given a time along the route.
   *
   * @param {Number} time Time along the route in milliseconds.
   * @returns {Object} coords Point feature with at locaiton corresponding to time input.
   */
  this.coords = function(time) {
    var coords;
    for (i = 0; i < times.length; i++) {
      if (time >= times[i] && time < times[i+1]) {
        var segmentDist = turfDistance(turfPoint(coordinates[i]), turfPoint(coordinates[i+1]), 'miles');
        var percAlong = (time - times[i]) / (times[i+1] - times[i]);
        var distCovered = segmentDist * percAlong;
        var segment = turfLinestring([ coordinates[i], coordinates[i+1] ]);
        coords = turfAlong(segment, distCovered, 'miles');
      } else if (time === times[times.length-1]) { // if it's the arrival step, return final coordinate
        coords = turfPoint(coordinates[times.length-1]);
      }
    }
    return coords;
  };
}
