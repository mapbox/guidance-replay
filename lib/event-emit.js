var util = require('./util');

module.exports = Emitter;
Emitter.locationEvent = locationEvent;
Emitter.EmitterPlace = EmitterPlace;

/**
 * Generate location events for timestamped GeoJSON along a given
 * update interval.
 *
 * @class
 * @param {Object} geojson Timestamped geojson of route.
 * @param {Number} updateInterval Interval (milliseconds) at which
 * to generate location events.
 */
function Emitter(geojson, updateInterval) {
  var speeds = geojson.properties.coordinateProperties.speeds;
  var speedmode = speeds ? true : false;
  // To use speedmode, we need a speed for each coordinate
  if (speedmode) for (var i = 0; i < geojson.properties.coordinateProperties.times.length; i++) {
    if (!speeds[i] &&
        speeds[i] !== 0) speedmode = false;
  }
  var place = new EmitterPlace(geojson, speedmode);
  var stepsTaken = 0;

  /**
   * Return the steps taken given a start time in milliseconds.
   *
   * @param {Number} startTime Time at which to start the emitter
   * in milliseconds.
   * @returns {Number} stepsTaken Number of theoretical steps taken given
   * any start time.
  */
  this.stepsTaken = function(startTime) {
    stepsTaken = startTime / updateInterval;
    return stepsTaken;
  };

  /**
   * Return the next location event for a route.
   *
   * @returns {Object} locationEvent Event with coordinates, bearing,
   * and, if in speedmode, speed and speedchange.
   */
  var last;
  this.next = function() {
    var i = stepsTaken * updateInterval;
    var locationEvent = place.point(i, last);
    last = locationEvent;
    if (locationEvent) {
      locationEvent.time = i;
    }
    stepsTaken++;
    return locationEvent;
  };

  /**
   * Returns all location events for a route.
   *
   * @returns {Object} locationEvent Event with coordinates, bearing,
   * and, if in speedmode, speed and speedchange.
   */
  this.all = function() {
    var locationEvents = [];
    var last;
    for (var i = 0; i < (place.times[place.times.length - 1] + updateInterval); i += updateInterval) {
      var step = place.point(i, last);
      var e = locationEvent({
        next: step.coords,
        last: last
      });
      e.time = i;
      locationEvents.push(e);
      last = step;
    }
    return locationEvents;
  };
}

/**
 * Turn two coordinates into a fake location event with bearing. Event corresponds
 * to next, not last.
 *
 * @param {Array<number>} options Next coordinates of next step.
 * @param {Array<number>} options Last coordinates of previous step.
 * @returns {Object} locationEvent Event with coordinates, bearing, and, if in
 * speedmode, speed and speedchange.
 */
function locationEvent(options) {
  // Do we have last speed? If so, we can see if there's an accel/decel event
  if (options.last && options.last.speed) {
    var speedchange = options.speed - options.last.speed;
  }
  // Bearing needs 2 datapoints
  var ev = {
    coords: options.next,
    bearing: (options.last && options.last.coords) ? util.bearing(options.last.coords, options.next) : 0,
    speed: options.speed,
    speedchange: speedchange
  };
  if (ev.speedchange === undefined) delete ev.speedchange;
  if (!ev.speed && ev.speed !== 0) delete ev.speed;
  return ev;
}

/**
 * Returns location information about the current step.
 *
 * @class
 * @param {Object} geojson Timestamped geojson of route.
 * @param {Boolean} speedmode True if there are speeds in GeoJSON object.
 */
function EmitterPlace(geojson, speedmode) {
  // Need times, distances, and speeds
  var coords = geojson.geometry.coordinates.slice(0);
  var times = geojson.properties.coordinateProperties.times.slice(0);
  var speeds = speedmode ? geojson.properties.coordinateProperties.speeds.slice(0) : undefined;
  var dists = [0];
  for (var i = 1; i < coords.length; i++) {
    dists.push(util.distance(coords[0], coords[i]) * 1000);
  }
  if (coords.length !== times.length || coords.length !== dists.length) throw new Error('coords, times, dists must be same length.');
  if (speedmode && coords.length !== speeds.length) throw new Error('coords & speeds must be same length.');

  this.times = times;
  this.coords = coords;
  this.speeds = speedmode ? speeds : undefined;
  this.dists = dists;
  this.point = speedmode ? speedPoint : constantPoint;

  /**
   * Given time & previous location in speedmode, return the coordinates for that time.
   *
   * @param {number} i Aggregated intervals for all steps taken so far.
   * @param {Object} last LocationEvent.
   * @returns {Object} locationEvent Event with coordinates and speed.
   */
  function speedPoint(i, last) {
    var index;
    // Does it exist?
    if (times.indexOf(i) > -1) {
      index = times.indexOf(i);
      return locationEvent({
        next: coords[index], 
        last: last,
        speed: speeds[index]
      });
    }
    // End of the trace
    if (i > times[times.length-1]) {
      index = times.length-1;
      if (last.coords[0] === coords[index][0] &&
        last.coords[1] === coords[index][1]) {
        return null;
      } else {
        return locationEvent({
          next: coords[index],
          last: last,
          speed: speeds[index]
        });
      }
    }
    // Need to place this in times array to find surrounding points
    allTimes = times.slice(0);
    allTimes.push(i);
    allTimes = allTimes.sort(function(a,b) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    index = allTimes.indexOf(i);
    // Find surrounding datapoints
    var a = {
      speed: speeds[index - 1],
      dist: dists[index - 1],
      time: times[index - 1],
      coords: coords[index - 1]
    };
    var b = {
      speed: speeds[index],
      dist: dists[index],
      time: times[index],
      coords: coords[index]
    };
    var iSpeed = util.findY([a.time, a.speed], [b.time, b.speed], i);
    var avgSpeed = (a.speed + iSpeed) / 2;
    var dist = (util.distanceFromSpeed(avgSpeed, (i - a.time)/1000)) / 1000; // Returns meters
    var along = util.along(a.coords, b.coords, dist);
    if (last &&
        last.coords[0] === along[0] &&
        last.coords[1] === along[1]) {
      return locationEvent({
        next: coords[index],
        last: last,
        speed: speeds[index]
      });
    }
    return locationEvent({
      next: along,
      last: last,
      speed: iSpeed
    });
  }

  /**
   * Given time & previous location, return
   * the coordinates for that time.
   *
   * @param {number} i Time (ms).
   * @param {Array<number>} last Coordinates of previous step.
   * @returns {Object} locationEvent Event with coordinates.
   */
  function constantPoint(i, last) {
    if (i > times[times.length - 1]) return null;
    for (var j = 0; j < times.length; j++) {
      if (i <= times[j+1] && i >= times[j]) {
        var seek = j;
      }
    }
    var newTimes = times.slice(0);
    var newCoords = coords.slice(0);
    newTimes.splice(0,seek);
    newCoords.splice(0,seek);
    var percAlong = (i - newTimes[0])/(newTimes[1] - newTimes[0]);
    var dist = util.distance(newCoords[0], newCoords[1]) * percAlong;
    var along = util.along(newCoords[0], newCoords[1], dist);
    return locationEvent({
      next: along,
      last: last
    });
  }
}
