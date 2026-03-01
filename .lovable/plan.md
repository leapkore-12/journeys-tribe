

## Fix Comment Input Text Visibility

### Problem
The comment input on the Trip Detail page uses `bg-secondary` (dark background) but doesn't include `text-foreground`, so typed text defaults to a dark color that's invisible against the dark background.

### Solution — `src/pages/TripDetail.tsx`

Add `text-foreground` to the comment `<Input>` className (around line 506):

```tsx
// Before
className="flex-1 h-10 bg-secondary border-border"

// After  
className="flex-1 h-10 bg-secondary border-border text-foreground"
```

This follows the project's existing standard (per memory note) that all interactive text inputs on dark backgrounds must explicitly include `text-foreground`.

### Files changed
1. `src/pages/TripDetail.tsx` — Add `text-foreground` to comment input

