

## Fix: JSON Data Export Not Accessible on iOS

### Problem
The current implementation creates a hidden `<a>` element and triggers `.click()` to download the file. On iOS Safari (and in-app WebViews), this approach either silently fails or downloads to an inaccessible location. Users see the "Data exported" toast but can't find the file.

### Solution
Replace the invisible download link with a visible approach that works on iOS:

1. **Use `window.open()` with a Blob URL** as a fallback — this opens the JSON in a new tab on iOS, where the user can use the share sheet to save it.
2. **Better approach**: Use the **Web Share API** when available (iOS Safari supports it), offering users the native share sheet to save/send the file. Fall back to the current download method on desktop.

### Changes — `src/pages/Settings.tsx`

Update `handleExportData` (lines 230-239):

```typescript
const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
const fileName = `roadtribe-data-export-${new Date().toISOString().split('T')[0]}.json`;

// Use Web Share API on mobile (iOS Safari supports this)
if (navigator.share && navigator.canShare) {
  const file = new File([blob], fileName, { type: 'application/json' });
  const shareData = { files: [file] };
  if (navigator.canShare(shareData)) {
    await navigator.share(shareData);
  } else {
    // Fallback: open in new tab
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
} else {
  // Desktop: use standard download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

This gives iOS users the native share sheet (Save to Files, AirDrop, etc.) while keeping the current desktop download behavior.

One file changed, ~15 lines modified.

