

## Show Trip Stops on Route Map in Trip Detail

### Approach

Replace the static map image in the carousel with an interactive Mapbox map that displays the route line (from start to destination) plus markers for each stop along the route. The trip already has `start_lat/lng`, `end_lat/lng`, and `trip_stops` with `latitude/longitude`.

### Changes

**File: `src/pages/TripDetail.tsx`**

1. Import `RoutePreviewMap` component
2. In the slides array (line 97), replace the static `map_image_url` slide with an interactive map slide using a new type `'interactive-map'`
3. In the carousel rendering (line 330-338), add a conditional: if `slide.type === 'interactive-map'`, render a `RoutePreviewMap` instead of an `<img>` tag, passing `startCoordinates`, `destinationCoordinates`, and `routeCoordinates` from the trip data

**File: `src/components/trip/RoutePreviewMap.tsx`**

1. Add a new `stops` prop: `Array<{ latitude: number; longitude: number; address: string }>`
2. Add a `useEffect` that creates orange/amber circle markers for each stop (similar to start/dest markers but styled distinctly — e.g. amber with a number label)
3. Include stop coordinates in the `fitBounds` calculation so the map viewport includes all stops
4. Store stop markers in a ref array and clean them up on unmount

### Visual Design

- Start marker: green circle (existing)
- Stop markers: amber/primary circle with stop number
- Destination marker: red circle (existing)
- Route line: blue (existing)

