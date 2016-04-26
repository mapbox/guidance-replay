var tape = require('tape');
var route = require('../lib/route');

tape('route.getSteps v4', function(assert) {
  var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v4')));
  var steps = route.getSteps(garage);
  assert.deepEqual(steps.length, 4, 'creates 4 steps');
  // Don't consider the last "arrival" step
  garage.routes[0].steps.slice(0,-1).forEach(function(step, i) {
    assert.deepEqual(steps[i].distance, step.distance, 'step ' + i + ' distance = ' + steps[i].distance);
    assert.deepEqual(steps[i].duration, step.duration, 'step ' + i + ' duration = ' + steps[i].duration);
  });
  assert.deepEqual(steps.reduce(function(memo, step) {
    memo += step.geometry.coordinates.length;
    return memo;
  }, 0), 7, 'has 7 geom coordinates');
  assert.end();
});

tape('route.getSteps v5', function(assert) {
  var garage = JSON.parse(JSON.stringify(require('./fixtures/garage.v5')));
  var steps = route.getSteps(garage);
  assert.deepEqual(steps.length, 2, 'creates 2 steps');
  assert.deepEqual(steps.reduce(function(memo, step) {
    memo += step.geometry.coordinates.length;
    return memo;
  }, 0), 6, 'has 6 geom coordinates');
  assert.end();
});

