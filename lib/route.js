var util = require('./util');
var assert = require('assert');
var turfAlong = require('turf-along');
var turfLineDistance = require('turf-line-distance');

module.exports = route;
route.interpolateConstant = interpolateConstant;
route.interpolateAccelDecel = interpolateAccelDecel;
route.buildTrace = buildTrace;
route.Place = Place;
route.getSteps = getSteps;

/**
 * Turn a Mapbox Directions API response into timestamped GeoJSON
 * in the format of https://github.com/mapbox/geojson-coordinate-properties
 * 
 * @param {Object} directions Response from Mapbox Directions API.
 * @param {Object} options Optional spacing parameter, which can be 'constant'
 * or 'acceldecel'; default is 'constant'.
 * @returns {Object} GeoJSON LineString with coordinateProperties.times
 * timestamps (ms) for each coordinate in the input geometry,
 * starting at 0.
 */
function route(directions, options) {
  var spacing = (options && options.spacing) ? options.spacing : 'constant';
  var steps = getSteps(directions);
  return buildTrace(steps, { spacing: spacing });
}

/**
 * Retrieve all steps from Directions API response.
 * 
 * @param {Object} directions Response from Mapbox Directions API.
 * @returns {Array<Object>} steps All intermediate steps in a directions response.
 */
function getSteps(directions) {
  var v = util.version(directions);
  var steps = [];
  if (v === 'v4') {
    var route = directions.routes[0];
    var routeSteps = route.steps.slice(0);
    var prev = routeSteps.shift();
    var next = routeSteps.shift();
    var step = { geometry: { type: 'LineString', coordinates:[] } };
    for (var a = 0; a < route.geometry.coordinates.length; a++) {
      if (route.geometry.coordinates[a][0] === next.maneuver.location.coordinates[0] &&
        route.geometry.coordinates[a][1] === next.maneuver.location.coordinates[1]) {
        // Finish previous step
        step.geometry.coordinates.push(route.geometry.coordinates[a]);
        step.duration = prev.duration;
        step.distance = prev.distance;
        steps.push(step);
        // Start next step
        step = { geometry: { type: 'LineString', coordinates:[] } };
        step.geometry.coordinates.push(route.geometry.coordinates[a]);
        // Set next maneuver
        prev = next;
        next = routeSteps.shift();
      } else {
        step.geometry.coordinates.push(route.geometry.coordinates[a]);
      }
    }
    // Mimic arrival step
    steps.push({ distance:0, duration:0, geometry: { type: 'LineString', coordinates:[] } });
    return steps;
  }
  if (v === 'v5') {
    if (directions.routes[0].legs.length === 1) {
      steps = directions.routes[0].legs[0].steps;
    } else {
      steps = [];
      for (var i = 0; i < directions.routes[0].legs.length; i++) {
        steps = steps.concat(directions.routes[0].legs[i].steps); 
      }
    }
    // If a LineString feature contains less than 2 coordinate pairs, drop it
    for (var j = 0; j < steps.length; j++) {
      if (steps[j].geometry.coordinates.length < 2 && steps[j].geometry.type === 'LineString') {
        steps.splice(j, 1);
      }
    }
    return steps;
  }
}

/**
 * Aggregate multiple route steps into a single LineString
 * with timestamps.
 * Uses https://github.com/mapbox/geojson-coordinate-properties.
 *
 * @param {Array<Object>} routeSteps An array of route steps from
 * Directions API response.
 * @param {Object} options Optional spacing parameter, which can be 'constant'
 * or 'acceldecel'; default is 'constant'.
 * @returns {Object} GeoJSON LineString with coordinateProperties.times
 * timestamps (ms) for each coordinate in the input geometry,
 * starting at 0.
 */
function buildTrace(routeSteps, options) {
  var coordinates = [];
  var times = [];
  var speeds = [];
  var aggTime = 0;
  var aggDuration = 0;
  routeSteps.forEach(function(s) {
    aggDuration += s.duration;
  });

  switch (options.spacing) {
  case 'constant':
    routeSteps = routeSteps.map(function(routeStep) { return interpolateConstant(routeStep); });
    break;
  case 'acceldecel':
    routeSteps = interpolateAccelDecel(routeSteps, 5);
    break;
  default:
    throw new Error('options.spacing must be one of constant or acceldecel.');
  }

  // Clean, validate, aggregate
  for (var i = 0; i < routeSteps.length; i++) {
    // Throw out steps with no geometry (arrival)
    if (!routeSteps[i].geometry.coordinates.length) continue;
    // If the last coordinate in LineString is identical to this, throw this out
    // In v5 response, first coord of this step is a duplicate of final coord of last step
    for (var j = 0; j < routeSteps[i].geometry.coordinates.length; j++) {
      var c = routeSteps[i].geometry.coordinates.slice(j)[0];
      var t = routeSteps[i].properties.coordinateProperties.times.slice(j)[0];
      if (coordinates.length &&
          c[0] === coordinates[coordinates.length - 1][0] &&
          c[1] === coordinates[coordinates.length - 1][1]) {
        continue;
      }
      coordinates.push(c);
      times.push(aggTime + t);
      if (routeSteps[i].properties.coordinateProperties.speeds && routeSteps[i].properties.coordinateProperties.speeds[j] !== undefined) {
        speeds.push(routeSteps[i].properties.coordinateProperties.speeds.slice(j)[0]);
      } else {
        speeds.push(null);
      }
    }
    aggTime = times[times.length - 1];
  }

  assert.equal(coordinates.length, times.length, 'coordinates and coordinateProperties.times should be equivalent.');

  return {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': coordinates
    },
    'properties': {
      'coordinateProperties': {
        'times': times,
        'speeds': speeds
      }
    }
  };
}

/**
 * Given routeSteps with estimated duration and distance,
 * attach an accel/deceleration step buffer to either edge.
 *
 * @param {Array<Object>} routeSteps An array of route steps from
 * Directions API response.
 * @param {number} rate Rate (absolute value) at which to accelerate and 
 * decelerate, in kilometers/hour per second.
 * @returns {Object} GeoJSON LineString with coordinateProperties.times
 * timestamps (ms) for each coordinate.
 */
function interpolateAccelDecel(routeSteps, rate) {
  var steps = [];
  for (var i = 0; i < routeSteps.length - 1; i++) {
    var thisSpeed = util.speed(routeSteps[i].distance, routeSteps[i].duration);
    var nextSpeed = routeSteps[i + 1] ? util.speed(routeSteps[i + 1].distance, routeSteps[i + 1].duration) : 0;
    var thisDist = routeSteps[i].distance;

    // If rate doesn't fit in this step, figure out something that does
    var constraint = Math.abs(thisSpeed - nextSpeed)/routeSteps[i].duration;
    if (constraint >= rate) rate = Math.ceil(constraint) + 1;

    var place = new Place(thisDist, thisSpeed, nextSpeed, rate);
    var times = place.times;
    var dists = place.dists;
    
    var coords = routeSteps[i].geometry.coordinates.slice(0);
    var propsTime = [];
    var propsSpeed = [];
    // Add timestamps to all existing coordinates
    for (var j = 0; j < coords.length; j++) {
      var line = {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': coords.slice(0, j + 1)
        }
      };
      var meters = turfLineDistance(line, 'kilometers') * 1000;
      propsTime.push(Math.round(place.meters(meters).time * 1000));
      propsSpeed.push(place.meters(meters).speed);
    }

    // Add one coordinate - the final coord with thisSpeed
    var additional = {
      speed: thisSpeed,
      time: times[1],
      coords: turfAlong({
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': coords
        },
        'properties': {}
      }, dists[1]/1000, 'kilometers').geometry.coordinates
    };

    // Smoosh new coords & props in
    propsTime.push(Math.round(additional.time * 1000));
    propsTime = propsTime.sort(function(a,b) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    var index = propsTime.indexOf(Math.round(additional.time * 1000));
    coords.splice(index, 0, additional.coords);
    propsSpeed.splice(index, 0, additional.speed);

    steps.push({
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': coords
      },
      'properties': {
        'coordinateProperties': {
          'times': propsTime,
          'speeds': propsSpeed
        }
      }
    });
  }

  return steps;
}

/**
 * Helper for interpolating points along a route step with
 * a speed change.
 *
 * Speed is stable (thisSpeed) between speedA & speedB.
 * Distance on a point between distA & distB can be calculated 
 * with thisSpeed.
 * Anything on slowdown/speedup range can be calculated with
 * y = util.findY(_B, _C, x) or y = util.findX(_B, _C, y)
 * @class
 * @param {number} thisDist Distance for current step in meters.
 * @param {number} thisSpeed Speed for current step in kilometers per hour.
 * @param {number} nextSpeed Speed for next step in kilometers per hour.
 * @param {number} rate Acceleration between current and next step in kilometers per hour per second.
 */
function Place(thisDist, thisSpeed, nextSpeed, rate) {
  var changeSegment = util.changeSegment(thisSpeed, nextSpeed, rate);
  while (changeSegment.meters > thisDist) {
    rate++;
    changeSegment = util.changeSegment(thisSpeed, nextSpeed, rate);
  }
  var dists = [0, thisDist - changeSegment.meters, thisDist];
  var times = [0];
  times.push(util.timeFromSpeed(thisSpeed, thisDist - changeSegment.meters));
  times.push(times[1] + changeSegment.seconds);

  this.dists = dists;
  this.times = times;

  /**
   * Given time along a step, return the speed & distance traveled
   * 
   * @param {number} p Seconds traveled along route step.
   * @returns {Object} Speed and distance.
   */
  this.seconds = function(p) {
    if (p < 0) throw new Error('seconds cannot be negative.');
    if (p >= times[0] && p <= times[1]) {
      return {
        speed: thisSpeed,
        distance: util.distanceFromSpeed(thisSpeed, p)
      };
    } else if (p > times[1]) {
      var speed = util.findY([times[1], thisSpeed], [times[2], nextSpeed], p);
      if (speed < 0) throw new Error('speed cannot be negative.');
      return {
        speed: speed,
        distance: util.findY([times[1], dists[1]], [times[2], dists[2]], p)
      };
    }
  };

  /**
   * Given distance along a step, return the speed & time traveled
   * 
   * @param {number} p Distance (meters) traveled along route step.
   * @returns {Object} Speed and time (seconds).
   */
  this.meters = function(p) {
    if (p < 0) throw new Error('distance cannot be negative.');
    if (p >= dists[0] && p <= dists[1]) {
      return {
        speed: thisSpeed,
        time: util.timeFromSpeed(thisSpeed, p)
      };
    } else if (p > dists[1]) {
      var time = util.findX([times[1], dists[1]], [times[2], dists[2]], p);
      var speed = util.findY([times[1], thisSpeed], [times[2], nextSpeed], time);
      if (speed < 0) speed = 0; // some lenience for distance
      return {
        speed: speed,
        time: time 
      };
    }
  };
}

/**
 * Generate timestamps for each coordinate in a LineString,
 * given the estimated duration and distance.
 *
 * @param {Object} routeStep A given step in the route.
 * @param {Object} routeStep.geometry A GeoJSON LineString.
 * @param {number} routeStep.duration Estimated duration of
 * route, in seconds.
 * @param {number} routeStep.distance Total distance of route,
 * in meters.
 * @returns {Object} GeoJSON LineString with coordinateProperties.times
 * timestamps (ms) for each coordinate in the input geometry,
 * starting at 0.
 */
function interpolateConstant(routeStep) {
  var coordinates = routeStep.geometry.coordinates;
  var totalDist = 0;
  var totalTime = 0;
  var intervals = [];
  var times = [0];

  for (var i = 1; i < coordinates.length; i++) {
    var dist = util.distance(coordinates[i - 1], coordinates[i]) * 1000;
    totalDist += dist;
    intervals.push(dist);
  }

  for (var j = 0; j < intervals.length; j++) {
    intervals[j] = intervals[j] / totalDist;
    totalTime += intervals[j] * routeStep.duration * 1000;
    times.push(Math.round(totalTime));
  }

  assert.ok(Math.abs(routeStep.duration * 1000 - times[times.length-1]) < 1 );

  return {
    'type': 'Feature',
    'geometry': routeStep.geometry,
    'properties': {
      'coordinateProperties': {
        'times': times
      }
    }
  };
}
