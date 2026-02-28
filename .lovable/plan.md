

## Fix Bulk Photo Select and Instant Preview on Edit Vehicle

### Problems
1. **Single photo on native**: `pickMultiplePhotosAsFiles()` uses `Camera.getPhoto()` on native which only picks ONE image. Capacitor Camera plugin has `Camera.pickImages()` for multi-select from gallery.
2. **No instant preview**: After uploading, photos don't appear until navigating away and back. When editing an existing vehicle (`id` present), `refetchVehicle()` is called but for newly created vehicles (`createdVehicleId`), there's no refetch. Also, query invalidation in `useUploadVehicleImage` only invalidates by `user?.id` key, not the specific vehicle query.

### Changes

**File: `src/lib/capacitor-utils.ts`**
- Update `pickMultiplePhotosAsFiles()` native path to use `Camera.pickImages()` API instead of `Camera.getPhoto()`, which returns multiple selected photos from the gallery
- Convert each returned image (base64) into a `File` object

**File: `src/pages/EditVehicle.tsx`**
- After uploading photos, always refetch the vehicle data regardless of whether it's an existing or newly created vehicle
- For newly created vehicles, also invalidate the `['vehicle', createdVehicleId]` query so photos appear immediately
- Use the `createdVehicleId` to fetch and display photos for new vehicles too

**File: `src/hooks/useVehicles.ts`**
- In `useUploadVehicleImage`, also invalidate the specific `['vehicle', vehicleId]` query on success so the photo grid updates immediately

