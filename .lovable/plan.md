

## Plan: Add Separate Latitude/Longitude Input Fields

Currently, `LocationSearchInput` accepts coordinates only as a single comma-separated string (e.g., `12.3, 45.6`). The user wants dedicated Lat and Lng fields as an alternative input method alongside the name search.

### Approach

Add a toggle inside `LocationSearchInput` that lets the user switch between **"Search by name"** and **"Enter coordinates"** modes.

### Changes

**`src/components/trip/LocationSearchInput.tsx`**:
- Add a small toggle link/button below the search input: "Enter coordinates" / "Search by name"
- When in coordinate mode, show two side-by-side `Input` fields for Latitude and Longitude (replacing the single search input)
- When both lat/lng are valid numbers in range, auto-trigger reverse geocode and show the result in the dropdown for the user to confirm/select
- When in search mode, behavior stays exactly as today
- The toggle switches between modes without losing the other mode's state

### UI Layout (Coordinate Mode)

```text
┌─────────────────────────────────────┐
│  [Latitude]         [Longitude]     │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ e.g. 12.345  │  │ e.g. 45.678  │ │
│  └──────────────┘  └──────────────┘ │
│  🔍 Search by name                  │  ← toggle link
│                                     │
│  ┌─ Dropdown ─────────────────────┐ │
│  │ 📍 Reverse-geocoded place name │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Technical Details

- Coordinate mode uses two controlled inputs with `type="text"` and `inputMode="decimal"` for mobile numeric keyboard
- Validation: lat must be -90 to 90, lng must be -180 to 180
- When both are valid, debounce 500ms then call `reverseGeocode([lng, lat])` and show result
- Selecting the result calls `onSelect()` with the geocoded result (same as name search)
- The existing single-field coordinate regex path stays as a fallback

