

## Fix Download Image and Instagram Story on iOS

### Problem 1: Download Image
The download creates a hidden `<a>` element and calls `.click()` — this silently fails on iOS Safari. The toast says "Image downloaded!" but nothing is saved.

### Problem 2: Instagram Story
The code copies the link and opens `https://www.instagram.com/` in a new tab, which just opens the Instagram website — not the app's story creation screen.

### Fix — `src/pages/Share.tsx`

**Download Image (lines 369-377):**
Replace the hidden `<a>` download with Web Share API on mobile (share the generated PNG file directly via the native share sheet), falling back to standard download on desktop.

```typescript
const blob = await (await fetch(dataUrl)).blob();
const file = new File([blob], `roadtribe-trip-${trip.id}.png`, { type: 'image/png' });

if (navigator.share && navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title: 'RoadTribe Trip' });
  toast.success('Image shared!');
} else {
  // Desktop fallback
  const link = document.createElement('a');
  link.download = `roadtribe-trip-${trip.id}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('Image downloaded!');
}
```

**Instagram Story (lines 126-157):**
Generate the canvas image first, then share the image file via Web Share API (which on iOS shows the share sheet where the user can pick Instagram Stories directly). This is the only reliable cross-platform way to share to Instagram Stories from a web app. Fallback: copy link + open Instagram URL scheme `instagram://story-camera`.

```typescript
const handleInstagramShare = async () => {
  if (!trip || slides.length === 0) return;
  
  // Generate the story image using the same canvas logic as download
  const imageBlob = await generateStoryImage();
  if (!imageBlob) {
    toast.error('Failed to generate image');
    return;
  }
  
  const file = new File([imageBlob], 'roadtribe-story.png', { type: 'image/png' });
  
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'RoadTribe Trip' });
  } else {
    // Fallback: copy link and try Instagram URL scheme
    await navigator.clipboard.writeText(shareUrl);
    window.location.href = 'instagram://story-camera';
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 2000);
    toast.success('Link copied! Share it on Instagram.');
  }
};
```

**Refactor:** Extract the canvas rendering logic into a shared `generateStoryImage()` function used by both Download and Instagram Story buttons, to avoid code duplication.

### Summary
- Download: Uses native share sheet on mobile (save to Photos, Files, etc.) — standard download on desktop
- Instagram: Shares the actual story image via native share sheet where user picks Instagram Stories
- Both buttons produce real, tangible results on iOS

