var test = require('tape');
var util = require('../lib/util');

test('util.version', function(assert) {
  var v4 = {};
  var v5 = { 'code': 'Ok' };
  assert.equal(util.version(v4), 'v4');
  assert.equal(util.version(v5), 'v5');
  assert.end();
});

test('util.speed', function(assert) {
  assert.equal(util.speed(100, 5), 72);
  assert.end();
});

test('util.distanceFromSpeed', function(assert) {
  assert.equal(util.distanceFromSpeed(72, 5), 100);
  assert.end();        
});

test('util.timeFromSpeed', function(assert) {
  assert.equal(util.timeFromSpeed(72, 100), 5);
  assert.end();        
});

test('util.slope', function(assert) {
  assert.equal(util.slope([0,0], [1,0]), 0);
  assert.equal(util.slope([0,0], [1,1]), 1);
  assert.equal(util.slope([0,0], [-1,-1]), 1);
  assert.equal(util.slope([0,0], [-1, 1]), -1);
  assert.equal(util.slope([0,0], [1, -1]), -1);
  assert.end();
});

test('util.findYWithSlope', function(assert) {
  assert.equal(util.findYWithSlope(1, 2, [1,1]), 2);
  assert.equal(util.findYWithSlope(-1, 2, [0,0]), -2);
  assert.end();
});

test('util.findYWithSlope', function(assert) {
  assert.equal(util.findYWithSlope(1, 2, [1,1]), 2);
  assert.equal(util.findYWithSlope(-1, -2, [0,0]), 2);
  assert.end();
});

test('util.findY', function(assert) {
  assert.equal(util.findY([1,1], [0,0], 2), 2); 
  assert.end();
});

test('util.findX', function(assert) {
  assert.equal(util.findX([1,1], [0,0], 2), 2); 
  assert.end();
});

test('util.changeSegment', function(assert) {
  assert.deepEqual(util.changeSegment(10, 5, 2), { meters: 5.208333333333334, seconds: 2.5 });
  assert.deepEqual(util.changeSegment(10, 5, 10), { meters: 1.0416666666666667, seconds: 0.5 }); // should be fast/short
  assert.deepEqual(util.changeSegment(10, 5, .05), { meters: 208.33333333333331, seconds: 100 }); // should be slow/far
  assert.end();
});
