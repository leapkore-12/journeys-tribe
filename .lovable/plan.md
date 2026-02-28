

## Add Fullscreen Image Viewer to Garage Page

### Change

**File: `src/pages/Garage.tsx`**

1. Add state for the selected image URL (`selectedImage: string | null`)
2. Make each photo in the grid clickable — on tap, set `selectedImage` to that photo's URL
3. Add a `Dialog` overlay that shows the selected image fullscreen with a dark background, pinch-friendly layout, and a close button (X)
4. Use the existing `Dialog` component from `@radix-ui/react-dialog` (already in the project) for the overlay

The dialog will render the image at full width with `object-contain` so the entire photo is visible without cropping, on a black background. Tapping the X or the overlay closes it.

