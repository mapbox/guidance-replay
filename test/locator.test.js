var Locator = require('../lib/locator');
var test = require('tape');

// test('step v4', function (assert) {
//   var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v4.json')));
//   var locator = new Locator(geojson);
//   assert.equal(locator.step(0), 0, 'Time 0 should correspond to step 0');
//   assert.equal(locator.step(4999), 0, 'Time 24000 should correspond to step 0');
//   assert.equal(locator.step(5000), 1, 'Time 25000 should correspond to step 1');
//   assert.equal(locator.step(5001), 1, 'Time 26000 should correspond to step 1');
//   assert.equal(locator.step(46999), 1, 'Time 66000 should correspond to step 1');
//   assert.equal(locator.step(47000), 2, 'Time 67000 should correspond to step 2');
//   assert.equal(locator.step(47001), 2, 'Time 68000 should correspond to step 2');
//   assert.equal(locator.step(196999), 2, 'Time 216000 should correspond to step 3');
//   assert.equal(locator.step(197000), 3, 'Time 216000 should correspond to step 3');
//   assert.equal(locator.step(197001), 3, 'Time 216000 should correspond to step 3');
//   assert.equal(locator.step(242999), 3, 'Time 216000 should correspond to step 3');
//   assert.equal(locator.step(243000), 4, 'Time 216000 should correspond to step 3');
//   assert.end();
// });

// test('step v5', function (assert) {
//   var geojson = JSON.parse(JSON.stringify(require('./fixtures/rmnp.v5.json')));
//   var locator = new Locator(geojson);
//   assert.equal(locator.step(0), 0, 'Time 0 should correspond to step 0');
//   assert.equal(locator.step(47899), 0, 'Time 46800 should correspond to step 0');
//   assert.equal(locator.step(47900), 1, 'Time 47800 should correspond to step 1');
//   assert.equal(locator.step(47901), 1, 'Time 48800 should correspond to step 1');
//   assert.equal(locator.step(220699), 1, 'Time 219700 should correspond to step 1');
//   assert.equal(locator.step(220700), 2, 'Time 220700 should correspond to step 2');
//   assert.equal(locator.step(220701), 2, 'Time 230700 should correspond to step 2');
//   assert.equal(locator.step(257399), 2, 'Time 230700 should correspond to step 2'); 
//   assert.equal(locator.step(257400), 3, 'Time 257500 should correspond to step 3');
//   assert.end();
// });

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
