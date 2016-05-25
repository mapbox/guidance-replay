var Locator = require('../lib/locator');
var test = require('tape');

test('maneuvers v4', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v4.json')));
  var locator = new Locator(geojson);
  var timesExpected = [ 0, 5000, 47000, 197000, 243000 ];
  var coordinatesExpected = [
    [ -105.58171, 40.366241 ],
    [ -105.581888, 40.36608 ],
    [ -105.585087, 40.365885 ],
    [ -105.585769, 40.358648 ],
    [ -105.590118, 40.358022 ]
  ];
  var times = locator.maneuvers().times;
  var coordinates = locator.maneuvers().coordinates;
  var length = times.length;

  assert.equal(times.length, coordinates.length, 'Times and coordinates array lengths should be equal');
  for (var i = 0; i < length; i++) {
    assert.ok(Math.abs(timesExpected[i] - times[i]) < 0.00001, 'Time should fall within reasonable threshold of expected');
    assert.ok(Math.abs(coordinatesExpected[i][0] - coordinates[i][0]) < 0.00001, 'Latitude should fall within reasonable treshold of expected');
    assert.ok(Math.abs(coordinatesExpected[i][1] - coordinates[i][1]) < 0.00001, 'Latitude should fall within reasonable treshold of expected');
  }
  assert.end();
});

test('maneuvers v5', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5.json')));
  var locator = new Locator(geojson);
  var timesExpected = [ 0, 47900, 220700, 257400 ];
  var coordinatesExpected = [
    [ -105.581675, 40.366194 ],
    [ -105.585075, 40.365892 ],
    [ -105.586052, 40.358819 ],
    [ -105.590121, 40.358023 ]
  ];
  var times = locator.maneuvers().times;
  var coordinates = locator.maneuvers().coordinates;
  var length = times.length;

  assert.equal(times.length, coordinates.length, 'Times and coordinates array lengths should be equal');
  for (var i = 0; i < length; i++) {
    assert.ok(Math.abs(timesExpected[i] - times[i]) < 0.00001, 'Time should fall within reasonable threshold of expected');
    assert.ok(Math.abs(coordinatesExpected[i][0] - coordinates[i][0]) < 0.00001, 'Latitude should fall within reasonable treshold of expected');
    assert.ok(Math.abs(coordinatesExpected[i][1] - coordinates[i][1]) < 0.00001, 'Latitude should fall within reasonable treshold of expected');
  }
  assert.end();
});

test('maneuvers v5 in acceldecel mode', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5.json')));
  var locator = new Locator(geojson, {'spacing': 'acceldecel'});
  var timesExpected = [ 0, 46318, 219141, 259744 ];
  var coordinatesExpected = [
    [ -105.581675, 40.366194 ],
    [ -105.585075, 40.365892 ],
    [ -105.586052, 40.358819 ],
    [ -105.590121, 40.358023 ]
  ];
  var times = locator.maneuvers().times;
  var coordinates = locator.maneuvers().coordinates;
  var length = times.length;

  assert.equal(times.length, coordinates.length, 'Times and coordinates array lengths should be equal');
  for (var i = 0; i < length; i++) {
    assert.ok(Math.abs(timesExpected[i] - times[i]) < 0.00001, 'Time should fall within reasonable threshold of expected');
    assert.ok(Math.abs(coordinatesExpected[i][0] - coordinates[i][0]) < 0.00001, 'Latitude should fall within reasonable treshold of expected');
    assert.ok(Math.abs(coordinatesExpected[i][1] - coordinates[i][1]) < 0.00001, 'Latitude should fall within reasonable treshold of expected');
  }
  assert.end();
});

test('step v4', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v4.json')));
  var locator = new Locator(geojson);
  assert.equal(locator.step(0), 0, 'Time 0 should correspond to step 0');
  assert.equal(locator.step(4999), 0, 'Time 24000 should correspond to step 0');
  assert.equal(locator.step(5000), 1, 'Time 25000 should correspond to step 1');
  assert.equal(locator.step(5001), 1, 'Time 26000 should correspond to step 1');
  assert.equal(locator.step(46999), 1, 'Time 66000 should correspond to step 1');
  assert.equal(locator.step(47000), 2, 'Time 67000 should correspond to step 2');
  assert.equal(locator.step(47001), 2, 'Time 68000 should correspond to step 2');
  assert.equal(locator.step(196999), 2, 'Time 216000 should correspond to step 3');
  assert.equal(locator.step(197000), 3, 'Time 216000 should correspond to step 3');
  assert.equal(locator.step(197001), 3, 'Time 216000 should correspond to step 3');
  assert.equal(locator.step(242999), 3, 'Time 216000 should correspond to step 3');
  assert.equal(locator.step(243000), 4, 'Time 216000 should correspond to step 3');
  assert.end();
});

test('step v5', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5.json')));
  var locator = new Locator(geojson);
  assert.equal(locator.step(0), 0, 'Time 0 should correspond to step 0');
  assert.equal(locator.step(47899), 0, 'Time 46800 should correspond to step 0');
  assert.equal(locator.step(47900), 1, 'Time 47800 should correspond to step 1');
  assert.equal(locator.step(47901), 1, 'Time 48800 should correspond to step 1');
  assert.equal(locator.step(220699), 1, 'Time 219700 should correspond to step 1');
  assert.equal(locator.step(220700), 2, 'Time 220700 should correspond to step 2');
  assert.equal(locator.step(220701), 2, 'Time 230700 should correspond to step 2');
  assert.equal(locator.step(257399), 2, 'Time 230700 should correspond to step 2');
  assert.equal(locator.step(257400), 3, 'Time 257500 should correspond to step 3');
  assert.end();
});

test('step v5 in accdeldecel mode', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5.json')));
  var locator = new Locator(geojson, {'spacing': 'acceldecel'});
  assert.equal(locator.step(0), 0, 'Time 0 should correspond to step 0');
  assert.equal(locator.step(46317), 0, 'Time 46800 should correspond to step 0');
  assert.equal(locator.step(46318), 1, 'Time 47800 should correspond to step 1');
  assert.equal(locator.step(46319), 1, 'Time 48800 should correspond to step 1');
  assert.equal(locator.step(219140), 1, 'Time 219700 should correspond to step 1');
  assert.equal(locator.step(219141), 2, 'Time 220700 should correspond to step 2');
  assert.equal(locator.step(219142), 2, 'Time 230700 should correspond to step 2');
  assert.equal(locator.step(259743), 2, 'Time 230700 should correspond to step 2');
  assert.equal(locator.step(259744), 3, 'Time 257500 should correspond to step 3');
  assert.end();
});

test('coords v4', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v4.json')));
  var locator = new Locator(geojson);
  var step0lon = geojson.routes[0].steps[0].maneuver.location.coordinates[0];
  var step0lat = geojson.routes[0].steps[0].maneuver.location.coordinates[1];
  var step1lon = geojson.routes[0].steps[1].maneuver.location.coordinates[0];
  var step1lat = geojson.routes[0].steps[1].maneuver.location.coordinates[1];
  var step2lon = geojson.routes[0].steps[2].maneuver.location.coordinates[0];
  var step2lat = geojson.routes[0].steps[2].maneuver.location.coordinates[1];
  var step3lon = geojson.routes[0].steps[3].maneuver.location.coordinates[0];
  var step3lat = geojson.routes[0].steps[3].maneuver.location.coordinates[1];
  var step4lon = geojson.routes[0].steps[4].maneuver.location.coordinates[0];
  var step4lat = geojson.routes[0].steps[4].maneuver.location.coordinates[1];

  assert.ok(Math.abs(locator.coords(0).geometry.coordinates[0] - step0lon) < 0.00001 &&
            Math.abs(locator.coords(0).geometry.coordinates[1] - step0lat) < 0.00001, 'Time 0 coordinates should correspond to 0th coordinates');
  assert.ok(locator.coords(4999).geometry.coordinates[0] < step0lon && locator.coords(4999).geometry.coordinates[0] > step1lon &&
            locator.coords(4999).geometry.coordinates[1] < step0lat && locator.coords(4999).geometry.coordinates[1] > step1lat, 'Time 4999 coordinates should fall into step 0');
  assert.ok(Math.abs(locator.coords(5000).geometry.coordinates[0] - step1lon) < 0.00001 &&
            Math.abs(locator.coords(5000).geometry.coordinates[1] - step1lat) < 0.00001, 'Time 5000 coordinates should correspond to 1st coordinates');
  assert.ok(locator.coords(46999).geometry.coordinates[0] < step1lon && locator.coords(46999).geometry.coordinates[0] > step2lon &&
            locator.coords(46999).geometry.coordinates[1] < step1lat && locator.coords(46999).geometry.coordinates[1] > step2lat, 'Time 46999 coordinates should fall into step 1');
  assert.ok(Math.abs(locator.coords(47000).geometry.coordinates[0] - step2lon) < 0.00001 &&
            Math.abs(locator.coords(47000).geometry.coordinates[1] - step2lat) < 0.00001, 'Time 47000 coordinates should correspond to 2nd coordinates');
  assert.ok(locator.coords(196999).geometry.coordinates[0] < step2lon && locator.coords(196999).geometry.coordinates[0] > step3lon &&
            locator.coords(196999).geometry.coordinates[1] < step2lat && locator.coords(196999).geometry.coordinates[1] > step3lat, 'Time 196999 coordinates should fall into step 2');
  assert.ok(Math.abs(locator.coords(197000).geometry.coordinates[0] - step3lon) < 0.00001 &&
            Math.abs(locator.coords(197000).geometry.coordinates[1] - step3lat) < 0.00001, 'Time 197000 coordinates should correspond to 3rd coordinates');
  assert.ok(locator.coords(242999).geometry.coordinates[0] < step3lon && locator.coords(242999).geometry.coordinates[0] > step4lon &&
            locator.coords(242999).geometry.coordinates[1] < step3lat && locator.coords(242999).geometry.coordinates[1] > step4lat, 'Time 242999 should fall into step 3');
  assert.ok(Math.abs(locator.coords(243000).geometry.coordinates[0] - step4lon) < 0.00001 &&
            Math.abs(locator.coords(243000).geometry.coordinates[1] - step4lat) < 0.00001, 'Time 243000 coordinates should correspond to 4th coordinates');
  assert.end();
});

test('coords v5', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5.json')));
  var locator = new Locator(geojson);
  var step0lon = geojson.routes[0].legs[0].steps[0].maneuver.location[0];
  var step0lat = geojson.routes[0].legs[0].steps[0].maneuver.location[1];
  var step1lon = geojson.routes[0].legs[0].steps[1].maneuver.location[0];
  var step1lat = geojson.routes[0].legs[0].steps[1].maneuver.location[1];
  var step2lon = geojson.routes[0].legs[0].steps[2].maneuver.location[0];
  var step2lat = geojson.routes[0].legs[0].steps[2].maneuver.location[1];
  var step3lon = geojson.routes[0].legs[0].steps[3].maneuver.location[0];
  var step3lat = geojson.routes[0].legs[0].steps[3].maneuver.location[1];

  assert.ok(Math.abs(locator.coords(0).geometry.coordinates[0] - step0lon) < 0.00001 &&
            Math.abs(locator.coords(0).geometry.coordinates[1] - step0lat) < 0.00001, 'Time 0 coordinates should correspond to 0th coordinates');
  assert.ok(locator.coords(47899).geometry.coordinates[0] < step0lon && locator.coords(47899).geometry.coordinates[0] > step1lon &&
            locator.coords(47899).geometry.coordinates[1] < step0lat && locator.coords(47899).geometry.coordinates[1] > step1lat, 'Time 47899 coordinates should fall into step 0');
  assert.ok(Math.abs(locator.coords(47900).geometry.coordinates[0] - step1lon) < 0.00001 &&
            Math.abs(locator.coords(47900).geometry.coordinates[1] - step1lat) < 0.00001, 'Time 47900 should correspond to 1st coordinates');
  assert.ok(locator.coords(220699).geometry.coordinates[0] < step1lon && locator.coords(220699).geometry.coordinates[0] > step2lon &&
            locator.coords(220699).geometry.coordinates[1] < step1lat && locator.coords(220699).geometry.coordinates[1] > step2lat, 'Time 220699 coordinates should fall into step 1');
  assert.ok(Math.abs(locator.coords(220700).geometry.coordinates[0] - step2lon) < 0.00001 &&
            Math.abs(locator.coords(220700).geometry.coordinates[1] - step2lat) < 0.00001, 'Time 220700 coordinates should correspond to 2nd coordinates');
  assert.ok(locator.coords(257399).geometry.coordinates[0] < step2lon && locator.coords(257399).geometry.coordinates[0] > step3lon &&
            locator.coords(257399).geometry.coordinates[1] < step2lat && locator.coords(257399).geometry.coordinates[1] > step3lat, 'Time 257399 coordinates should fall into step 2');
  assert.ok(Math.abs(locator.coords(257400).geometry.coordinates[0] - step3lon) < 0.00001 &&
            Math.abs(locator.coords(257400).geometry.coordinates[1] - step3lat) < 0.00001, 'Time 257400 coordinates should correspond to 3rd coordinates');
  assert.end();
});

test('coords v5 in acceldecel mode', function (assert) {
  var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5.json')));
  var locator = new Locator(geojson, {'spacing': 'acceldecel'});
  var step0lon = geojson.routes[0].legs[0].steps[0].maneuver.location[0];
  var step0lat = geojson.routes[0].legs[0].steps[0].maneuver.location[1];
  var step1lon = geojson.routes[0].legs[0].steps[1].maneuver.location[0];
  var step1lat = geojson.routes[0].legs[0].steps[1].maneuver.location[1];
  var step2lon = geojson.routes[0].legs[0].steps[2].maneuver.location[0];
  var step2lat = geojson.routes[0].legs[0].steps[2].maneuver.location[1];
  var step3lon = geojson.routes[0].legs[0].steps[3].maneuver.location[0];
  var step3lat = geojson.routes[0].legs[0].steps[3].maneuver.location[1];

  assert.ok(Math.abs(locator.coords(0).geometry.coordinates[0] - step0lon) < 0.00001 &&
            Math.abs(locator.coords(0).geometry.coordinates[1] - step0lat) < 0.00001, 'Time 0 coordinates should correspond to 0th coordinates');
  assert.ok(locator.coords(46317).geometry.coordinates[0] < step0lon && locator.coords(46317).geometry.coordinates[0] > step1lon &&
            locator.coords(46317).geometry.coordinates[1] < step0lat && locator.coords(46317).geometry.coordinates[1] > step1lat, 'Time 46317 coordinates should fall into step 0');
  assert.ok(Math.abs(locator.coords(46318).geometry.coordinates[0] - step1lon) < 0.00001 &&
            Math.abs(locator.coords(46318).geometry.coordinates[1] - step1lat) < 0.00001, 'Time 46318 should correspond to 1st coordinates');
  assert.ok(locator.coords(219140).geometry.coordinates[0] < step1lon && locator.coords(219140).geometry.coordinates[0] > step2lon &&
            locator.coords(219140).geometry.coordinates[1] < step1lat && locator.coords(219140).geometry.coordinates[1] > step2lat, 'Time 219140 coordinates should fall into step 1');
  assert.ok(Math.abs(locator.coords(219141).geometry.coordinates[0] - step2lon) < 0.00001 &&
            Math.abs(locator.coords(219141).geometry.coordinates[1] - step2lat) < 0.00001, 'Time 219141 coordinates should correspond to 2nd coordinates');
  assert.ok(locator.coords(259743).geometry.coordinates[0] < step2lon && locator.coords(259743).geometry.coordinates[0] > step3lon &&
            locator.coords(259743).geometry.coordinates[1] < step2lat && locator.coords(259743).geometry.coordinates[1] > step3lat, 'Time 259743 coordinates should fall into step 2');
  assert.ok(Math.abs(locator.coords(259744).geometry.coordinates[0] - step3lon) < 0.00001 &&
            Math.abs(locator.coords(259744).geometry.coordinates[1] - step3lat) < 0.00001, 'Time 259744 coordinates should correspond to 3rd coordinates');
  assert.end();
});
