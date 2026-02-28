

## Fix Edit Vehicle Page: Scrolling, Photo Upload Box Size, and Delete Button Visibility

### Problems
1. **Delete Vehicle button disappears** with 4+ photos because the page uses `flex flex-col bg-background` without proper scrolling — same issue as admin pages. Content overflows the container.
2. **Add photos box too large** — uses `aspect-[2/1]` making it take half the screen width in height.
3. **Delete button on photos invisible on touch** — uses `opacity-0 group-hover:opacity-100` which doesn't work on mobile/touch devices.

### Changes

**File: `src/pages/EditVehicle.tsx`**

1. **Fix scrolling** (line 314): Change outer div to `flex flex-col h-full bg-background`, wrap content in `flex-1 overflow-y-auto` with `pb-32` padding so Delete Vehicle button and Finished button are always reachable.

2. **Shrink Add Photos box** (line 381): Change `aspect-[2/1]` to `py-6` — compact fixed padding instead of aspect ratio, keeping the button functional but much smaller.

3. **Make delete button always visible** (line 430): Remove `opacity-0 group-hover:opacity-100` from the delete button so it's always visible on mobile. Keep the `bg-black/60` overlay for contrast.

