

## Fix Buggy Back Navigation

### Problem
Multiple pages use `useSmartBack`, a custom hook that maintains its own navigation history in sessionStorage. This history diverges from the actual browser history stack, causing the back button to navigate to stale/wrong pages (e.g., going back to Tribe page instead of Settings after visiting Terms of Service).

### Solution
Replace all `useSmartBack` usage with native browser history navigation (`navigate(-1)`) with a fallback route, matching the pattern already used in `Settings.tsx`. Then delete the `useSmartBack` hook entirely.

### Standard pattern (already in Settings.tsx)
```tsx
const navigate = useNavigate();
const handleBack = () => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate('/fallbackRoute', { replace: true });
  }
};
```

### Files to update (12 files)

| File | Fallback | Change |
|------|----------|--------|
| `ManageTribe.tsx` | `/settings` | Replace `useSmartBack` with navigate(-1) pattern |
| `TermsOfService.tsx` | `/settings` | Same |
| `PrivacyPolicy.tsx` | `/settings` | Same |
| `Help.tsx` | `/settings` | Same |
| `Subscription.tsx` | `/settings` | Same |
| `BlockedAccounts.tsx` | `/settings` | Same |
| `ManageConnections.tsx` | `/profile` | Same |
| `Garage.tsx` | `/profile` | Same |
| `EditVehicle.tsx` | `/garage` | Same |
| `TripDetail.tsx` | `/feed` | Same |
| `EditTrip.tsx` | `/feed` | Same |
| `EditProfile.tsx` | `/profile` | Same — need to verify current usage |

### Cleanup
- Delete `src/hooks/useSmartBack.ts` entirely

Each file: remove `useSmartBack` import, add/use `useNavigate`, replace `goBack` with `handleBack` using the standard pattern. ~3 lines changed per file.

