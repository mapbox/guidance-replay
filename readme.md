# guidance-replay

An event source loop for visual guidance simulator. It turns timestamped GeoJSON into mock location events.


## API

### Emitter

Generate location events for timestamped GeoJSON along a given update interval.

**Parameters**

-   `geojson` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Timestamped geojson of route.
-   `updateInterval` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Interval (milliseconds) at which to generate location events.

#### Emitter.all

Return all location events for a route. Useful for debugging.

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** Location events with coordinates, bearing, and, if in speedmode, speed and speedchange.

#### Emitter.next

Return the next location event for a route. Useful for long and/or complex routes.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Location events with coordinates, bearing, and, if in speedmode, speed and speedchange.


### Route

Turn a Mapbox Directions API response into timestamped GeoJSON in the format of [GeoJSON Coordinate Properties](https://github.com/mapbox/geojson-coordinate-properties).

**Parameters**

-   `directions` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Response from Mapbox Directions API.
-   `options` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Optional spacing parameter, which can be `constant` or `acceldecel`. Default is `constant`.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** GeoJSON LineString with coordinateProperties.times timestamps in milliseconds for each coordinate in the input geometry, starting at 0 ms.

### Locator

Generate the location of an event, in terms of step number or coordinates, given any time along the route in milliseconds.

**Parameters**

-   `directions` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Response from Mapbox Directions API.

#### Locator.maneuvers

Get times (milliseconds) and coordinates for the maneuvers along the route.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object with `times` and `coordinates` arrays for maneuvers along route.

#### Locator.step

Find the current [Mapbox Directions API step](https://www.mapbox.com/api-documentation/#retrieve-directions) given a time along the route.

**Parameters**

-   `time` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Time along the route in milliseconds.

Returns **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Step along the route.

#### Locator.coords

Find the current coordinates given a time along the route.

**Parameters**

-   `time` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Time along the route in milliseconds.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Point feature with at locaiton corresponding to time input.

## Development

### test

```sh
npm test
```

### run simulator

```sh
npm start
# --> http://localhost:9966/
```
