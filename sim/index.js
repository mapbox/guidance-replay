var routev5 = require('../lib/route');
var Emitter = require('../lib/event-emit');
var stop = document.getElementById('stop');

// Ensure that access token is set locally
if (!process.env.MapboxAccessToken) {
  throw new Error('An API access token is required to use Mapbox GL. See https://www.mapbox.com/developers/api/#access-tokens');
} else {
  mapboxgl.accessToken = process.env.MapboxAccessToken;
}

mapboxgl.util.getJSON('rmnp.json', function(err, directions) {
  if (err) throw err;
  var route = routev5(directions, { spacing: 'acceldecel' });
  console.log(route);
  var center = route.geometry.coordinates[0];

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v8',
    center: center,
    zoom: 20
  });
  map.setPitch(60);

  map.on('style.load', function() {
    addRoute(route.geometry.coordinates);
    var emitter = new Emitter(route, 100);
    var step;
    var i = 1;
    var loop = setInterval(function() {
      step = emitter.next();
      document.getElementById('event-coords').innerHTML = step.coords;
      document.getElementById('event-speed').innerHTML = (step.speed).toFixed(2);
      if (step.speedchange || step.speechange === 0 ) {
        document.getElementById('event-speedchange').innerHTML = (step.speedchange).toFixed(2);
      } else {
        document.getElementById('event-speedchange').innerHTML = 0;
      }
      if (step === null) {
        setTimeout(function() {
          emitter = new Emitter(route, 100);
        }, 2000);
      } else {
        map.getSource('single-point').setData(
        {
            'type': 'FeatureCollection',
            'features': [{
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'Point',
                'coordinates': step.coords
              }
            }]
        });
        map.easeTo({
          center: step.coords,
          bearing: step.bearing,
          // Makes easing linear, otherwise we get jerky steps
          // as easing accelerates/decelerates.
          easing: function(v) { return v; }
        });
      }
      i++;
    }, 100);

    stop.addEventListener('click', function(e) {
      clearInterval(loop);
    });
  });

  function addRoute(coordinates) {
    map.addSource('route', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': coordinates
        }
      }
    });

    map.addLayer({
      'id': 'route',
      'type': 'line',
      'source': 'route',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': '#888',
        'line-width': 8
      }
    });

    map.addSource('single-point', {
      'type': 'geojson',
      'data': {
        'type': 'FeatureCollection',
        'features': []
      }
    });

    map.addLayer({
       'id': 'point',
       'source': 'single-point',
       'type': 'circle',
       'paint': {
         'circle-radius': 15,
         'circle-color': '#000000'
       }
    });
  }
});
