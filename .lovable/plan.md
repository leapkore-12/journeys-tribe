

## Dynamic Emergency Number Based on User Country

### Approach

Use the user's current GPS coordinates (already available via the trip's geolocation tracking) to determine the country via reverse geocoding, then map it to the correct emergency number. This will be done with a lightweight utility and a country-to-emergency-number lookup.

### Changes

**New file: `src/lib/emergency-numbers.ts`**
- Export a map of country codes to emergency numbers (e.g., US/CA → 911, EU countries → 112, UK → 999, IN → 112, AU → 000, etc.)
- Export a `getEmergencyNumber(countryCode: string): string` function with fallback to 112 (international standard)

**New hook: `src/hooks/useEmergencyNumber.ts`**
- Use the Mapbox reverse geocoding API (already used in `useMapboxGeocoding`) to get the country code from the user's current position (`lastPosition` from the background geolocation hook)
- Cache the result so it doesn't re-fetch on every render
- Return `{ emergencyNumber, countryName, isLoading }` with a default of 112

**Modified file: `src/pages/ActiveTrip.tsx`**
- Import and call `useEmergencyNumber`, passing the current position
- Replace the hardcoded `href="tel:112"` and `Call Emergency (112)` text with the dynamic number from the hook
- Lines ~789-795: Update the `<a>` tag to use `href={`tel:${emergencyNumber}`}` and display `Call Emergency (${emergencyNumber})`

### Emergency Number Coverage
Key mappings: US/CA → 911, most of EU → 112, UK → 999, India → 112, Australia → 000, Japan → 110, China → 110, Brazil → 190, South Africa → 10111, Mexico → 911. Fallback: 112 (works in most countries).

