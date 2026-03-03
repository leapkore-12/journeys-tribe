

## Already Implemented: Latitude/Longitude Input

Good news — the destination search box **already supports** entering coordinates directly. You can type latitude and longitude in the format `lat, lng` (e.g., `12.9716, 77.5946`) and it will:

1. Detect the coordinate pattern automatically
2. Reverse geocode it to show the nearest place name
3. Let you select it as your destination

This works in the destination field, start location field, and stop fields.

### How to use it
Type coordinates in the search box like: `28.6139, 77.2090` (for New Delhi). The dropdown will show the resolved location name which you can tap to select.

### Possible improvement
The placeholder text currently says "Search for destination" which doesn't hint that coordinates are accepted. We could update it to something like `"Search or enter lat, lng"` so users know this option exists.

### Change (optional)
**`src/pages/TripPlanner.tsx`**: Update the destination placeholder from `"Search for destination"` to `"Search or enter lat, lng"` to make the coordinate input discoverable. Same for start location and stops placeholders.

No other code changes needed — the coordinate parsing, validation, and reverse geocoding logic is already in place.

