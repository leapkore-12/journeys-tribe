

## Already Implemented

The Settings page **already contains** a cache management section for offline maps. Looking at the existing code (lines ~460-510 of `Settings.tsx`):

- **"Offline Maps" section** with a header
- **Cached Map Data display** showing tile count or size in KB/MB
- **"Clear offline maps" button** with loading state and destructive styling
- **Conditional rendering** — only shown when `offlineMapsSupported` is true

The section uses the `useOfflineMaps` hook which provides `cacheSize`, `getCacheSize`, and `clearCache`.

### What Could Be Improved

Since the feature exists but could be enhanced, here are optional improvements:

1. **Show last download date** — Track and display when tiles were last cached
2. **Show region names** — Display which route areas are cached (requires storing metadata alongside tiles)
3. **Per-region cache management** — Allow deleting specific route caches instead of all-or-nothing
4. **Always show the section** — Currently hidden when `offlineMapsSupported` is false; could instead show an informational message explaining offline maps require the native app

No changes are needed unless you'd like one of these enhancements. The core cache management section is already live in Settings.

