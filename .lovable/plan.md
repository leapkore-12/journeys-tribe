

## Fix Comment Input Background

The `FixedBottomActions` component uses `bg-background` which resolves to pure black in dark mode. The issue is likely a transparency/blur effect bleeding through, or the area behind the input looking disconnected from the rest of the page.

### Changes — `src/pages/Comments.tsx`

Update the `FixedBottomActions` usage (~line 194) to pass a className that ensures a solid black background with no transparency, and a subtle top border for a cleaner, modern look:

```tsx
<FixedBottomActions showBorder className="bg-black">
```

### Changes — `src/components/layout/FixedBottomActions.tsx`

Ensure the component uses a solid background with no backdrop blur or transparency artifacts. Add `z-50` to keep it above scrolling content:

- Line 27: Change class to `"fixed left-0 right-0 p-4 bg-background z-50 max-w-[430px] mx-auto"`

Two files, ~2 lines changed.

