

## Plan: Fix iOS Auto-Zoom Issue

### Root Cause

The viewport meta tag in `index.html` is missing `maximum-scale=1.0` and `user-scalable=no`. On iOS, this allows the browser to auto-zoom when the user interacts with form inputs (especially if any text input has a font-size below 16px) or accidentally pinch-zooms. Once zoomed, iOS doesn't always zoom back out, leaving the entire UI scaled up and clipped.

### Changes

**`index.html`** (line 5):
- Update the viewport meta tag to prevent user scaling and auto-zoom:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

This single change will prevent iOS from zooming in on input focus and block accidental pinch-zoom, keeping the app at the correct 1:1 scale on all iPhone models.

