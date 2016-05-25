var fs = require('fs');
var path = require('path');
var test = require('tape');
var turfAlong = require('turf-along');
var route = require('../lib/route');

var interpolateConstant = route.interpolateConstant;
var interpolateAccelDecel = route.interpolateAccelDecel;
var buildTrace = route.buildTrace;
var Place = route.Place;

test('interpolateConstant', function(t) {
  t.test('step', function(assert) {
    var step = {'geometry':{'coordinates':[[-77.032395,38.912603],[-77.032595,38.912603],[-77.032678,38.912603]],'type':'LineString'},'maneuver':{'bearing_after':0,'bearing_before':270.0000260667663,'location':[-77.032678,38.912603],'modifier':'straight','type':'depart','instruction':'Head straight on R St NW'},'mode':'inaccessible','duration':13.3,'name':'R St NW','distance':24.492444483459483};
    var expected = {'geometry':{'coordinates':[[-77.032395,38.912603],[-77.032595,38.912603],[-77.032678,38.912603]],'type':'LineString'},'properties':{'coordinateProperties':{'times':[0,9399,13300]}},'type':'Feature'};
    assert.deepEqual(interpolateConstant(step), expected);
    assert.end();
  });

  t.end();
});

test('buildTrace', function(t) {
  var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));
  t.test('steps', function(assert) {
    var steps = garage.routes[0].legs[0].steps;
    var geojson = buildTrace(steps, { spacing: 'constant' });
    assert.deepEqual(geojson.geometry.coordinates, [
      [ -77.032395, 38.912603 ],
      [ -77.032595, 38.912603 ],
      [ -77.032678, 38.912603 ],
      [ -77.032678, 38.91315 ],
      [ -77.032675, 38.913357 ]
    ]);
    assert.deepEqual(geojson.properties.coordinateProperties.times, [ 0, 14700, 20800, 28490, 31400 ]);
    assert.end();
  });

  t.end();
});

test('route', function(t) {
  t.test('garage (v4)', function(assert) {
    var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v4')));
    var geojson = route(garage);
    assert.deepEqual(geojson.geometry.coordinates, [
      [ -77.03239,38.91261 ],
      [ -77.0326,38.91261 ],
      [ -77.03267,38.91261 ],
      [ -77.03267,38.91263 ],
      [ -77.03267,38.91315 ],
      [ -77.03267,38.91336 ]
    ]);
    assert.deepEqual(geojson.properties.coordinateProperties.times, [ 0, 14250, 19000, 19267, 26200, 29000 ]);
    assert.end();
  });

  t.test('garage (v5)', function(assert) {
    var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));
    var geojson = route(garage);
    assert.deepEqual(geojson.geometry.coordinates, [
      [ -77.032395, 38.912603 ],
      [ -77.032595, 38.912603 ],
      [ -77.032678, 38.912603 ],
      [ -77.032678, 38.91315 ],
      [ -77.032675, 38.913357 ]
    ]);
    assert.deepEqual(geojson.properties.coordinateProperties.times, [ 0, 14700, 20800, 28490, 31400 ]);
    assert.end();
  });

  t.test('rmnp (v5)', function(assert) {
    var rmnp = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5')));
    var geojson = route(rmnp);
    var times = geojson.properties.coordinateProperties.times;
    assert.ok(Math.abs((rmnp.routes[0].duration * 1000) - times[times.length - 1]) < 1);
    assert.end();
  });

  t.test('rmnp (v5)', function(assert) {
    var fixture = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5')));
    var rmnp = fixture.routes[0].legs[0].steps;
    var firstThree = rmnp.slice(0,3);

    var expectedCoords = [
      [-105.584646,40.365773],
      [-105.58469809129294,40.365786196508246], // additional step
      [-105.584871,40.36583],
      [-105.585075,40.365892] // final coordinates of the step
    ];
    var expectedTimes = [ 41791, 42525, 44245, 46318 ];
 
    var firstStep = interpolateAccelDecel(firstThree)[0];
    assert.deepEqual(firstStep.geometry.coordinates.splice(-4), expectedCoords);
    assert.deepEqual(firstStep.properties.coordinateProperties.times.splice(-4), expectedTimes);

    var geojson = buildTrace(firstThree, { spacing: 'acceldecel' });
    var c = [];
    var t = [];
    var coords = geojson.geometry.coordinates.slice(0);
    var times = geojson.properties.coordinateProperties.times.slice(0);
    for (var i = 0; i < times.length; i++) {
      if (times[i] > 41000 && times[i] < 47000) {
        c.push(coords[i]);
        t.push(times[i]);
      }
    }
    assert.deepEqual(c, expectedCoords);
    assert.deepEqual(t, expectedTimes);
    assert.end();
  });

  t.test('concatenate >2 waypoints', function(assert) {
    var waypoints = JSON.parse(JSON.stringify(require('./fixtures/waypoints.v5')));
    var geojson = route(waypoints);
    assert.deepEqual(geojson.geometry.coordinates, [
      [ -122.414708,37.802627 ],
      [ -122.414707,37.802617 ],
      [ -122.414518,37.801697 ],
      [ -122.414419,37.801234 ],
      [ -122.414324,37.800766 ],
      [ -122.414321,37.800754 ],
      [ -122.414241,37.800356 ],
      [ -122.414231,37.8003 ],
      [ -122.414129,37.799836 ],
      [ -122.414594,37.799774 ],
      [ -122.415199,37.799697 ],
      [ -122.415785,37.799623 ],
      [ -122.416538,37.79953 ],
      [ -122.41741,37.799405 ],
      [ -122.417543,37.799969 ],
      [ -122.417615,37.800312 ],
      [ -122.417516,37.800325 ]
    ], 'Coordinates should match');
    assert.equal(geojson.geometry.type, 'LineString', 'v5route response should return LineString');
    assert.ok(geojson.properties.coordinateProperties.times, 'v5route response should have a times object');
    assert.ok(geojson.properties.coordinateProperties.speeds, 'v5route response should have a speeds object');
    assert.end();
  });

  t.end(); 
});


test('time', function(t) {
  t.test('garage (v5)', function(assert) {
    var start = +new Date;
    for (var i = 0; i < 10; i++) {
      var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));
      route(garage);
    }
    var time = +new Date - start;
    assert.ok(true, time + 'ms for 10 reps');
    assert.end();
  });

  t.test('rmnp (v5)', function(assert) {
    var start = +new Date;
    for (var i = 0; i < 10; i++) {
      var rmnp = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5')));
      route(rmnp);
    }
    var time = +new Date - start;
    assert.ok(true, time + 'ms for 10 reps');
    assert.end();
  });

  t.end();
});

test('place datapoints [synthetic]', function(t) {
  /*
  
  0                1            
  0min             ? 
  0meters         100meters 
  <--------------->
          A           
 
  0        1       2  
  0min     ?       ? 
  <-------><------>
      A        A'  

  0-1: constant speed 10km/h
  1-2: start speed 10km/h, end speed 1km/h

  */

  var thisSpeed = 10;
  var nextSpeed = 1;
  var thisDist = 100;
  var rate = .25;
  var place = new Place(thisDist, thisSpeed, nextSpeed, rate);

  t.test('place', function(assert) {
    assert.deepEqual(place.dists, [ 0, 45, 100 ]);
    assert.deepEqual(place.times, [ 0, 16.2, 52.2 ]);
    assert.end();
  });

  t.test('place points from seconds', function(assert) {

    /* evth */
    var fromSeconds = 'seconds,speed,distance\n';
    for (var i = 0; i < place.times[2]; i++) {
      fromSeconds = fromSeconds + i + ',' + place.seconds(i).speed + ',' + place.seconds(i).distance + '\n';
    }
    var expected = fs.readFileSync(path.resolve(__dirname, 'expected/fromSeconds.csv')).toString();
    assert.equal(expected, fromSeconds);
    
    /* the important points */
    assert.deepEqual(place.seconds(0), { distance: 0, speed: 10 });
    assert.deepEqual(place.seconds(16.2), { distance: 45, speed: 10 });
    assert.deepEqual(place.seconds(52.2), { distance: 100, speed: 1 });

    /* boundaries are good */
    assert.throws(
      function() {
        place.seconds(-1);
      }, /seconds cannot be negative/);
    assert.throws(
      function() {
        place.seconds(60);
      }, /speed cannot be negative/);    
    
    assert.end();
  });

  t.test('place points from meters', function(assert) {

    /* evth */
    var fromMeters = 'seconds,speed,distance\n';
    for (var i = 0; i < place.dists[2] + 1; i++) {
      fromMeters = fromMeters + place.meters(i).time + ',' + place.meters(i).speed + ',' + i + '\n';
    }
    var expected = fs.readFileSync(path.resolve(__dirname, 'expected/fromMeters.csv')).toString();
    assert.equal(expected, fromMeters);
    
    /* the important points */
    assert.deepEqual(place.meters(0), { speed: 10, time: 0 });
    assert.deepEqual(place.meters(45), { speed: 10, time: 16.2 });
    assert.deepEqual(place.meters(100), { speed: 1, time: 52.2 });
    
    /* boundaries are good */
    assert.throws(
      function() {
        place.meters(-1);
      }, /distance cannot be negative/);
    assert.deepEqual(place.meters(150).speed, 0);
    assert.end();
  });

  t.end();
});

test('place datapoints [garage]', function(t) {
  var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));
  var garageSteps = garage.routes[0].legs[0].steps;

  t.test('step 1', function(assert) {
    var thisSpeed = util.speed(garageSteps[0].distance, garageSteps[0].duration);
    var nextSpeed = util.speed(garageSteps[1].distance, garageSteps[1].duration);
    var thisDist = garageSteps[0].distance;
    
    assert.equal(thisSpeed, 4.239076929829525);
    assert.equal(nextSpeed, 28.482824403352883);
    assert.equal(thisDist, 24.492444483459483);

    var place = new Place(thisDist, thisSpeed, nextSpeed, 5);

    assert.deepEqual(place.dists, [ 0, 2.4562913508144355, 24.492444483459483 ]);
    assert.deepEqual(place.times, [ 0, 2.085984521938736, 6.934734016643407 ]);
    
    /* meters */
    assert.deepEqual(place.meters(0), { speed: 4.239076929829525, time: 0 });
    assert.deepEqual(place.meters(1), { speed: 4.239076929829525, time: 0.8492414880861278 });
    assert.deepEqual(place.meters(2.4562913508144355), { speed: 4.239076929829525, time: 2.085984521938736 });
    assert.deepEqual(place.meters(10), { speed: 12.538518597520298, time: 3.74587285547689 });
    assert.deepEqual(place.meters(15), { speed: 18.039421438317838, time: 4.846053423636398 });
    assert.deepEqual(place.meters(20), { speed: 23.54032427911538, time: 5.946233991795907 });
    assert.deepEqual(place.meters(24.492444483459483), { speed: 28.482824403352886, time: 6.934734016643408 });

    /* seconds */
    assert.deepEqual(place.seconds(0), { distance: 0, speed: 4.239076929829525 });
    assert.deepEqual(place.seconds(2.085984521938736), { distance: 2.4562913508144355, speed: 4.239076929829525 });
    assert.deepEqual(place.seconds(6.934734016643407), { distance: 24.49244448345948, speed: 28.48282440335288 });

    // This call will adjust the specified rate (1) until it can be achieved (5)
    var adjustedPlace = new Place(thisDist, thisSpeed, nextSpeed, 1);
    assert.deepEqual(place.dists, adjustedPlace.dists, 'adjusts rate until possible');
    assert.deepEqual(place.times, adjustedPlace.times, 'adjusts rate until possible');

    assert.end();
  });

  t.test('step 2', function(assert) {
    var thisSpeed = util.speed(garageSteps[1].distance, garageSteps[1].duration);
    var nextSpeed = util.speed(garageSteps[2].distance, garageSteps[2].duration);
    var thisDist = garageSteps[1].distance;
    
    assert.equal(thisSpeed, 28.482824403352883);
    assert.equal(nextSpeed, 0);
    assert.equal(thisDist, 83.86609407653904);
    
    var place = new Place(thisDist, thisSpeed, nextSpeed, 5);

    assert.deepEqual(place.dists, [ 0, 61.33078057675475, 83.86609407653904 ]);
    assert.deepEqual(place.times, [ 0, 7.751717559664712, 13.448282440335289 ]);
    
    /* meters */
    assert.deepEqual(place.meters(0), { speed: 28.482824403352883, time: 0 });
    assert.deepEqual(place.meters(61.33078057675475), { speed: 28.482824403352883, time: 7.751717559664712 });
    assert.deepEqual(place.meters(83.86609407653904), { speed: 0, time: 13.448282440335289 });

    /* seconds */
    assert.deepEqual(place.seconds(0), { distance: 0, speed: 28.482824403352883 });
    assert.deepEqual(place.seconds(7.751717559664712), { distance: 61.330780576754755, speed: 28.482824403352883 });
    assert.deepEqual(place.seconds(10), { distance: 70.22486862636748, speed: 17.24141220167644 });
    assert.deepEqual(place.seconds(13.448282440335289), { distance: 83.86609407653904, speed: 0 });

    assert.end();
  });

  t.end();
});

test('place datapoints [rmnp]', function(t) {
  var rmnp = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5')));
  var routeSteps = rmnp.routes[0].legs[0].steps;

  var rate = 5;
  for (var i = 0; i < routeSteps.length - 1; i++) {
    var thisSpeed = util.speed(routeSteps[i].distance, routeSteps[i].duration);
    var nextSpeed = util.speed(routeSteps[i + 1].distance, routeSteps[i + 1].duration);
    var thisDist = routeSteps[i].distance;
    var constraint = Math.abs(thisSpeed - nextSpeed)/routeSteps[i].duration;
    if (constraint >= rate) rate = Math.ceil(constraint) + 1;
    new Place(thisDist, thisSpeed, nextSpeed, rate);
  }
  
  t.end();
});

test('interpolateAccelDecel', function(t) {
  var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));
  var garageSteps = garage.routes[0].legs[0].steps;

  t.test('garage - steps', function(assert) {
    var steps = interpolateAccelDecel(garageSteps);
    var expected = require('./expected/garage-acceldecel-steps.json');
    assert.deepEqual(steps, expected);
    assert.end();
  });

  t.test('garage - build trace', function(assert) {
    var geojson = buildTrace(garageSteps, { spacing: 'acceldecel' });
    var expected = require('./expected/garage-acceldecel-geojson.json');
    assert.deepEqual(geojson, expected);
    assert.end();
  });

  t.end();
});

test('interpolateConstant [synthetic]', function(assert) {
  // Dummy feature to use with turfAlong when creating fake
  // horizontal line segments of predictable kilometer length.
  var equator = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [0,0],
        [180,0]
      ]
    }
  };

  var input = {
    // 10km/h over 1 minute (everything hourly is divided by 60)
    distance:10e3/60,
    duration:3600/60,
    geometry: {
      type: 'LineString',
      coordinates:[
        [0,0],
        [turfAlong(equator, 7.5e3/60, 'kilometers').geometry.coordinates[0],0],
        [turfAlong(equator, 10e3/60, 'kilometers').geometry.coordinates[0],0]
      ]
    }
  };

  var interpolated = interpolateConstant(input, 5);
  assert.deepEqual(interpolated.geometry, input.geometry, 'interpolated geom matches input geom');
  assert.deepEqual(interpolated.properties.coordinateProperties.times, [ 0, 45e3, 60e3 ], 'interpolates times');
  assert.end();
});

test('interpolateAccelDecel [synthetic]', function(assert) {
  // Dummy feature to use with turfAlong when creating fake
  // horizontal line segments of predictable kilometer length.
  var equator = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [0,0],
        [180,0]
      ]
    }
  };

  var input = [
    // 10km/h over 1 minute (everything hourly is divided by 60)
    {
      distance:10e3/60,
      duration:3600/60,
      geometry: {
        type: 'LineString',
        coordinates:[
          [0,0],
          [turfAlong(equator, 10/60, 'kilometers').geometry.coordinates[0],0]
        ]
      }
    },
    // 20km/h over 1 minute (everything hourly is divided by 60)
    {
      distance:20e3/60,
      duration:3600/60,
      geometry: {
        type: 'LineString',
        coordinates:[
          [turfAlong(equator, 10/60, 'kilometers').geometry.coordinates[0],0],
          [turfAlong(equator, 30/60, 'kilometers').geometry.coordinates[0],0]
        ]
      }
    }
  ];

  var interpolated = interpolateAccelDecel(input);
  assert.deepEqual(
    interpolated[0].geometry.coordinates[0],
    input[0].geometry.coordinates[0],
    'start coords are identical');
  assert.deepEqual(
    interpolated[0].geometry.coordinates[2],
    input[0].geometry.coordinates[1],
    'end coords are identical');
  assert.equal(
    Math.round(interpolated[0].geometry.coordinates[1][0]/interpolated[0].geometry.coordinates[2][0]*100),
    95,
    'interpolated coord is at the 95% mark');
  assert.deepEqual(
    interpolated[0].properties.coordinateProperties.times,
    // Third value here is not 60s as acceleration to 20km/h gains time
    [ 0, 57e3, 59e3 ],
    'interpolates times');
  assert.deepEqual(
    interpolated[0].properties.coordinateProperties.speeds.map(Math.round.bind(Math)),
    [ 10, 10, 20 ],
    'interpolates speeds');
  assert.end();
});
