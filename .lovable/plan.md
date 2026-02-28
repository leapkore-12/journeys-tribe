

## Fix: iOS Auto-Zoom on Description Textarea

The issue is that iOS Safari automatically zooms in on input fields with font-size smaller than 16px. The Textarea uses `text-sm` (14px), triggering the zoom. The Title input doesn't cause this because tapping it first doesn't trigger zoom at 16px base size (or the zoom is less noticeable).

### Fix in `src/pages/PostTrip.tsx`

Add `text-base` to the Textarea className to ensure 16px font size, preventing iOS auto-zoom:

```tsx
<Textarea
  ...
  className="min-h-24 bg-transparent border-primary text-foreground placeholder:text-muted-foreground resize-none text-base"
/>
```

Single line change — no other files affected.

