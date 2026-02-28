

## Make Toast Swipe-Up to Dismiss (iOS-style) + Auto-close at 4.5s

### Changes

**1. `src/components/ui/toast.tsx`** — Change swipe direction and animations:
- On the `ToastProvider`, set `swipeDirection="up"` 
- Update `toastVariants` CSS classes: replace all `translate-x` / `swipe-end-x` / `swipe-move-x` references with `translate-y` / `swipe-end-y` / `swipe-move-y` equivalents, and change `slide-out-to-right-full` to `slide-out-to-top-full`

**2. `src/hooks/use-toast.ts`** — Update auto-dismiss delay:
- Change `TOAST_REMOVE_DELAY` from `3000` to `4500`

### Swipe class mapping (line 30)
```
Current (horizontal):
  data-[swipe=cancel]:translate-x-0
  data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]
  data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
  data-[state=closed]:slide-out-to-right-full

New (vertical/up):
  data-[swipe=cancel]:translate-y-0
  data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)]
  data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)]
  data-[state=closed]:slide-out-to-top-full
```

Two files, minimal changes.

