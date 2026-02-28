

## Standardize Header Icons Across All Pages

### Problem
Header icons are inconsistent in size and touch target across pages:
- **Feed.tsx**: Search/Bell at `h-5 w-5` inside `<Button size="icon">` (~40px container)
- **TripHeader.tsx**: ChevronLeft/Bell at `h-6 w-6` with `min-h-11 min-w-11` (44px)
- **TripReview.tsx**: Search/Bell at `h-5 w-5` in `w-10 h-10` containers
- **Profile.tsx**: Search/Settings at `h-6 w-6` with no touch target sizing
- **TripDetail.tsx**: ArrowLeft at `h-6 w-6` with `p-2 -ml-2` (inconsistent)
- Many other pages: bare buttons with no `min-h-11 min-w-11`

### Standard to Apply (matching TripHeader pattern)
- All header icons: **`h-6 w-6`**
- All header icon buttons: **`min-h-11 min-w-11 flex items-center justify-center active:opacity-70`**
- This ensures 44px touch targets and consistent visual weight

### Files to Update

| File | What changes |
|------|-------------|
| `src/pages/Feed.tsx` | Search & Bell icons → `h-6 w-6`, replace `<Button size="icon">` with standard button pattern |
| `src/pages/TripReview.tsx` | Search & Bell → `h-6 w-6`, containers → `min-h-11 min-w-11` |
| `src/pages/Profile.tsx` | Search & Settings → add `min-h-11 min-w-11` touch targets |
| `src/pages/TripDetail.tsx` | ArrowLeft buttons → replace `p-2 -ml-2` with `min-h-11 min-w-11` pattern |
| `src/pages/Comments.tsx` | Verify ArrowLeft button has consistent pattern |
| `src/pages/Notifications.tsx` | ArrowLeft button → consistent pattern |
| `src/pages/Settings.tsx` | ArrowLeft button → consistent pattern |
| `src/pages/Help.tsx` | ArrowLeft → add touch target |
| `src/pages/Subscription.tsx` | ArrowLeft → add touch target |
| `src/pages/TermsOfService.tsx` | ArrowLeft → add touch target |
| `src/pages/PrivacyPolicy.tsx` | ArrowLeft → add touch target |
| `src/pages/ManageConnections.tsx` | ArrowLeft → consistent sizing |
| `src/pages/BlockedAccounts.tsx` | Uses `<Button size="icon">` → standardize |
| `src/pages/EditProfile.tsx` | ArrowLeft → add touch target |
| `src/pages/Garage.tsx` | ArrowLeft → add touch target |
| `src/pages/EditVehicle.tsx` | ArrowLeft → add touch target |
| `src/pages/NotificationSettings.tsx` | Already correct — verify only |
| `src/pages/UserProfile.tsx` | Check and fix header icons |
| `src/pages/PostTrip.tsx` | Check and fix header icons |
| `src/pages/Search.tsx` | Already has `min-h-11 min-w-11` — verify icon size |

~20 files, ~1-3 lines each. All icons become `h-6 w-6`, all containers become `min-h-11 min-w-11 flex items-center justify-center active:opacity-70`.

