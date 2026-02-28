

## Add Loading Spinner to Instagram Story Button

### Changes — `src/pages/Share.tsx`

1. **Add state**: `const [isGeneratingStory, setIsGeneratingStory] = useState(false);`

2. **Wrap `handleInstagramShare`** with loading state:
   - Set `setIsGeneratingStory(true)` at the start
   - Set `setIsGeneratingStory(false)` in a `finally` block

3. **Update the Instagram Story button** (line ~555-560): Add `disabled={isGeneratingStory}` and show `<Loader2 className="mr-2 h-4 w-4 animate-spin" />` + "Generating…" text when loading, similar to the existing download button pattern.

One file, ~10 lines changed.

