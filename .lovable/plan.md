

## Fix Vehicle Make/Model Display on Profile Trip Cards

### Problem Identified
The trip cards on your profile are showing engine specs like "1498 cc | 4 Cylinders Inline..." instead of the vehicle make and name (e.g., "Skoda Kushaq").

### Root Cause
The EditVehicle form is mapping fields incorrectly to database columns:

| Form Field | Saved To | Should Be |
|------------|----------|-----------|
| "Make and model" | `name` column | Correct |
| "Description" | `make` column | Wrong - should go to a `description` column |

When you entered "1.5 TSI with Active Cylinder Technology..." in the Description field, it got saved to the `make` column. Then the trip card displays `vehicle.make` + `vehicle.model`, showing the engine specs instead of the actual make.

### Solution

**Step 1: Fix the EditVehicle Form Field Mapping**

Update `src/pages/EditVehicle.tsx` to use proper field mapping:
- Parse the "Make and model" input to extract `make` and `model` separately
- OR use the `name` field for display since it already contains "Skoda Kushaq"

**Step 2: Update ProfileTripCard Display**

Change line 118 in `src/components/ProfileTripCard.tsx`:
```tsx
// Current (broken):
🚗 {trip.vehicle.make} {trip.vehicle.model}

// Fixed - use vehicle.name which stores "Skoda Kushaq":
🚗 {trip.vehicle.name}
```

**Step 3: Also Update TripCard.tsx (Feed Card)**

The same fix in `src/components/TripCard.tsx` line 171 and 227 to use `vehicle.name` instead of `make/model`.

**Step 4: Fix Your Existing Vehicle Data**

After the code fix, you'll need to update your existing vehicles in the database:
- Go to **Garage → Edit your Skoda Kushaq**
- Clear the Description field (or move the engine specs there properly)
- The "Make and model" field should have "Skoda Kushaq"

### Files to Modify

| File | Change |
|------|--------|
| `src/components/ProfileTripCard.tsx` | Line 118: Use `vehicle.name` instead of `make + model` |
| `src/components/TripCard.tsx` | Lines 171, 227: Same fix |
| `src/pages/EditVehicle.tsx` | Fix field mapping so `make` stores actual make, not description |

### Immediate Workaround

If you want it fixed right now before the code update:
1. Open your Garage
2. Edit the Skoda Kushaq
3. Put "Skoda" in a new field or clear the description

### Expected Result

| Before | After |
|--------|-------|
| 🚗 1498 cc | 4 Cylinders... | 🚗 Skoda Kushaq |

