

## Simplify Search Page - Users Only, Exclude Admins

### Overview
Remove the Trips tab from the search page and filter out admin users from search results. This will make the search simpler and ensure admin accounts are not discoverable by regular users.

### Changes Required

**1. Update `src/hooks/useSearch.ts`**
- Modify `useSearchUsers` to fetch admin user IDs from the `user_roles` table
- Filter out admin users along with blocked users before returning results
- Remove the `useSearchTrips` hook export (or keep it for potential future use but it won't be called)

**2. Update `src/pages/Search.tsx`**
- Remove the `activeTab` state (no longer needed)
- Remove the Trips tab button from the header
- Remove the `useSearchTrips` import and hook call
- Remove all the Trips-related UI code (lines 126-179)
- Update the search placeholder text from "Search users, trips, locations..." to "Search users..."

### Implementation Details

**useSearch.ts changes:**
```typescript
// Add admin filtering to useSearchUsers
const { data: adminRoles } = await supabase
  .from('user_roles')
  .select('user_id')
  .eq('role', 'admin');
const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);

// Then filter both blocked AND admin users
return (data || []).filter(u => 
  !blockedIds.includes(u.id) && !adminIds.has(u.id)
);
```

**Search.tsx changes:**
- Remove tabs UI completely (lines 60-82)
- Remove trips loading state and results UI
- Simplify to show only user search results

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSearch.ts` | Add admin user filtering in `useSearchUsers` |
| `src/pages/Search.tsx` | Remove tabs, trips import, and trips UI |

### Result
- Search page will only show user search with no tabs
- Admin users will not appear in search results
- Simpler, cleaner user experience

