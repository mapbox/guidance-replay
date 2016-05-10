var test = require('tape');
var Emitter = require('../lib/event-emit');
var EmitterPlace = Emitter.EmitterPlace;
var locationEvent = require('../lib/event-emit').locationEvent;
var route = require('../lib/route');
var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));

test('locationEvents', function(t) {
  t.test('garage', function(assert) {
    var geojson = route(garage);
    var expected = [
      { bearing: 0,                  coords: [ -77.032395, 38.912603 ] },
      { bearing: -89.99993718633088, coords: [ -77.032595, 38.912603 ] },
      { bearing: -89.99997393323372, coords: [ -77.032678, 38.912603 ] },
      { bearing: 0,                  coords: [ -77.032678, 38.91315 ] },
      { bearing: 0.6460836158993326, coords: [ -77.032675, 38.913357 ] }
    ];
    for (var j = 0; j < geojson.geometry.coordinates.length; j++) {
      assert.deepEqual(locationEvent({
        next: geojson.geometry.coordinates[j],
        last: { coords: geojson.geometry.coordinates[j-1] }
      }), expected[j]);
    }
    assert.end();
  });
  t.end();
});

test('emit.all', function(t) {
  t.test('garage', function(assert) {
    var emitter = new Emitter(route(garage), 100);
    var geojson = emitter.all();
    var expected = JSON.parse(JSON.stringify(require('./expected/garage-events')));
    for (var i = 0; i < expected.length; i++) {
      var a = geojson[i];
      var b = expected[i];
      assert.ok(Math.abs(a.bearing - b.bearing) < 0.000001);
      assert.ok(Math.abs(a.coords[0] - b.coords[0]) < 0.000001);
      assert.ok(Math.abs(a.coords[1] - b.coords[1]) < 0.000001);
    }
    assert.end();
  });

  t.test('garage [time]', function(assert) {
    var start = +new Date;
    for (var i = 0; i < 10; i++) {
      var geojson = route(garage);
      var emitter = new Emitter(geojson, 100);
      emitter.all();
    }
    var time = +new Date - start;
    assert.ok(true, time + 'ms for 10 reps');
    assert.end();
  });

  t.test('garage [num events]', function(assert) {
    var emitter = new Emitter(route(garage), 100);
    var events = emitter.all();
    assert.ok(Math.abs(garage.routes[0].duration - (events.length * .1)) < 1, 'Num events * interval should correspond to route duration');
    assert.end();
  });

  t.end();
});

test('emit.next', function(t) {
  t.test('garage', function(assert) {
    var expected = JSON.parse(JSON.stringify(require('./expected/garage-events')));
    var emitter = new Emitter(route(garage), 100);
    for (var i = 0; i < expected.length; i++) {
      step = emitter.next();
      var b = expected[i];
      assert.ok(Math.abs(step.bearing - b.bearing) < 0.000001);
      assert.ok(Math.abs(step.coords[0] - b.coords[0]) < 0.000001);
      assert.ok(Math.abs(step.coords[1] - b.coords[1]) < 0.000001);
    }
    assert.equal(emitter.next(), null);
    assert.end();
  });

  t.end();
});

test('emit.next acceldecel', function(assert) {
  var geojson = route(JSON.parse(JSON.stringify(require('./fixtures/garage.v5'))), { spacing: 'acceldecel' });
  var emitter = new Emitter(geojson, 2000);

  var ev = emitter.next();
  var num = 0;
  // Request events until the last event (indicated by `null`) is reached.
  while (ev) {
    assert.equal(ev.coords.length, 2, 'event ' + num + ' coords');
    assert.equal(typeof ev.bearing, 'number', 'event ' + num + ' bearing');
    assert.equal(typeof ev.speed, 'number', 'event ' + num + ' speed');
    if (num === 0) {
      assert.deepEqual(ev.speedchange, undefined, 'event ' + num + ' speedchange');
    } else {
      assert.equal(typeof ev.speedchange, 'number', 'event ' + num + ' speedchange');
    }
    num++;
    ev = emitter.next();
  }
  assert.deepEqual(ev, null, 'last event is null');
  assert.end();
});

test('speed placer', function(t) {
  var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));
  var garageSteps = garage.routes[0].legs[0].steps;
  var geojson = route.buildTrace(garageSteps, { spacing: 'acceldecel' }); 
  var place = new EmitterPlace(geojson, true);

  t.deepEqual(place.times, [
    0,
    2086,
    5354,
    6935,
    14625,
    14687,
    20384
  ]);
  t.deepEqual(place.coords, [
    [ -77.032395, 38.912603 ],
    [ -77.03242338052249, 38.912603000020766 ],
    [ -77.032595, 38.912603 ],
    [ -77.032678, 38.912603 ],
    [ -77.032678, 38.91315 ],
    [ -77.03267793641194, 38.9131543875888 ],
    [ -77.032675, 38.913357 ]
  ]);
  t.deepEqual(place.speeds, [
    4.239076929829525,
    4.239076929829525,
    20.580506174556888,
    28.48368037697154,
    28.482824403352883,
    28.482824403352883,
    0
  ]);
  t.deepEqual(place.dists, [
    0,
    2.4562913514815197,
    17.309697889401946,
    24.493222513572633,
    65.58772563346119,
    66.03865963511971,
    87.29824204000374
  ]);

  var last;
  for (var i = 0; i < place.times.length; i++) {
    var p = place.point(place.times[i], last);
    delete p.bearing;
    if (p.speedchange === undefined) {
      t.deepEqual(p, {
        coords: place.coords[i],
        speed: place.speeds[i]
      });      
    } else {
      t.deepEqual(p, {
        coords: place.coords[i],
        speed: place.speeds[i],
        speedchange: place.speeds[i] - place.speeds[i - 1] 
      });
    }
    last = p;
  }

  t.deepEqual(place.point(3000, { coords: [ -77.03242338052249, 38.912603000020766 ]}), {
    coords: [ -77.03244251940518, 38.912603000030884 ],
    bearing: -89.99995506617553,
    speed: 8.809476663513983
  });

  t.deepEqual(place.point(6000, { coords: [ -77.032595, 38.912603 ]}), {
    coords: [ -77.03264101805723, 38.912603000007245 ],
    bearing: -89.99997394272637,
    speed: 23.809760149737066
  });

  t.end();
});

test('stepsTaken', function(t) {
  var austin = JSON.parse(JSON.stringify(require('./fixtures/seek.v5')));
  var geojson = route(austin);
  var frequency = 100;
  var emitter = new Emitter(geojson, frequency);
  emitter.stepsTaken(49591);
  var results = [];
  var step;

  for (var i = 0; i < 17; i++) {
    step = emitter.next();
    results.push(step);
  }

  t.ok(Math.abs(results[0].coords[0] - geojson.geometry.coordinates[6][0]) < 0.0001, 'First step longitude is within reasonable distance of 6th coordinate');
  t.ok(Math.abs(results[0].coords[1] - geojson.geometry.coordinates[6][1]) < 0.0001, 'First step latitude is within reasonable distance of 6th coordinate');
  t.equal(results[0].bearing, 0, 'First step should have a bearing of 0');
  for (var j = 1; j < 16; j++) {
    t.ok(results[j].bearing > 171 && results[j].bearing < 172, 'Bearing for each intermediate step should be between 171 and 172');
    t.ok(results[j].coords[0] > results[j - 1].coords[0], 'Longitude should increase in size as steps increment');
    t.ok(results[j].coords[0] > geojson.geometry.coordinates[6][0] && results[j].coords[0] < geojson.geometry.coordinates[7][0], 'Longitude shoudl be between 6th and 7th coordinates for intermediate steps');
    t.ok(results[j].coords[1] < results[j - 1].coords[1], 'Latitude should decrease in size as steps increment');
    t.ok(results[j].coords[1] < geojson.geometry.coordinates[6][1] && results[j].coords[1] > geojson.geometry.coordinates[7][1], 'Latitude should be between 6th and 7th coordinates for intermediate steps');
  }
  t.ok(results[16].coords[0] > geojson.geometry.coordinates[7][0] && results[16].coords[1] < geojson.geometry.coordinates[7][1], 'Last step should be farther along than 7th coordinate');
  t.end();
});

test('stepsTaken', function(t) {
  var austin = JSON.parse(JSON.stringify(require('./fixtures/seek.v5')));
  var geojson = route(austin, { 'spacing': 'acceldecel' });
  var frequency = 100;
  var emitter = new Emitter(geojson, frequency);
  emitter.stepsTaken(49591);
  var results = [];
  var step;

  for (var i = 0; i < 17; i++) {
    step = emitter.next();
    t.ok(Math.abs(step.speed - 24.69824086603518) < 0.0001, 'Step speed is within reasonable threshold of expected value');
    results.push(step);
  }

  t.ok(Math.abs(results[0].coords[0] - geojson.geometry.coordinates[6][0]) < 0.0001, 'First step longitude is within reasonable distance of 6th coordinate');
  t.ok(Math.abs(results[0].coords[1] - geojson.geometry.coordinates[6][1]) < 0.0001, 'First step latitude is within reasonable distance of 6th coordinate');
  t.equal(results[0].bearing, 0, 'First step should have a bearing of 0');
  for (var j = 1; j < 16; j++) {
    t.ok(results[j].bearing > 171 && results[j].bearing < 172, 'Bearing for each intermediate step should be between 171 and 172');
    t.equal(results[j].speedchange, 0, 'Speed should not change in this interval');
    t.ok(results[j].coords[0] > results[j - 1].coords[0], 'Longitude should increase in size as steps increment');
    t.ok(results[j].coords[0] > geojson.geometry.coordinates[6][0] && results[j].coords[0] < geojson.geometry.coordinates[7][0], 'Longitude should be between 6th and 7th coordinates for intermediate steps');
    t.ok(results[j].coords[1] < results[j - 1].coords[1], 'Latitude should decrease in size as steps increment');
    t.ok(results[j].coords[1] < geojson.geometry.coordinates[6][1] && results[j].coords[1] > geojson.geometry.coordinates[7][1], 'Latitude should be between 6th and 7th coordinates for intermediate steps');
  }
  t.ok(results[16].coords[0] > geojson.geometry.coordinates[7][0] && results[16].coords[1] < geojson.geometry.coordinates[7][1], 'Last step should be farther along than 7th coordinate');
  t.equal(results[16].speedchange, 0, 'Speed should not change in this step');
  t.end();
});
