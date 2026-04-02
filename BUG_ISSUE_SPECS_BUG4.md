# BUG #4: Dashboard Not Loading on First Visit - Stale Cache Issue

**Severity**: MEDIUM (Data Consistency)  
**Frequency**: Most page loads  
**Root Cause**: Missing React Query cache invalidation after profile updates  
**Impact**: Stale data, confusing UX, data inconsistency between pages

---

## Symptoms

### User Experience
1. **First visit to dashboard**: Shows empty/minimal data (looks broken)
2. **Navigate away and back**: Dashboard loads correctly with real data
3. **Settings → Dashboard**: Shows stale profile data
4. **Avatar/Location changes**: Don't reflect on dashboard until hard refresh

### What's Happening Visually
- First load: Generic avatar "U", 0 active jobs, 0 spending (cached empty state)
- Click Settings → Profile section loads ✅
- Back to Dashboard → Now shows real data, real avatar, real name

---

## Root Cause Analysis

### The Problem: Split Cache Management

The application has **TWO sources of truth**:

1. **AuthContext** (React State)
   - Manages: Current user profile
   - Updated in: `AuthContext.updateProfile()`
   - Problem: Updates context but forgets to invalidate React Query cache

2. **React Query** (Cache Layer)
   - Manages: Dashboard data (stats, jobs, contracts)
   - Updated in: `ClientDashboard.tsx` via 3 `useQuery` hooks
   - Problem: Queries remain "fresh" for 60 seconds even when profile changes

### When Context Updates, But Cache Doesn't Know

**Timeline**:
```
T=0s: User loads dashboard
     - React Query fetches: clientDashboardStats, clientDashboardJobs, clientActiveContracts
     - Data is "fresh" for 60s (staleTime: 60_000)
     - Cache key: ['clientDashboardStats', profile?.id]

T=5s: User edits profile in Settings
     - AuthContext.updateProfile() called
     - Profile state in context CHANGES
     - ❌ React Query cache NOT invalidated
     - Cache still thinks it's fresh

T=10s: User goes back to Dashboard
     - Component re-mounts/re-renders
     - React Query checks: "Is cache fresh?" YES (marked fresh at T=0)
     - ❌ Serves stale data from cache
     - Profile has OLD info for up to 50 more seconds

T=65s: Cache finally expires naturally
     - React Query refetches because staleTime expired
     - NOW shows correct data
```

### Code Evidence

**File**: `src/contexts/AuthContext.tsx` lines 539-569

```typescript
const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', auth.user?.id)
            .select()
            .single();

        if (error) throw error;

        // ✅ Updates local state
        setProfile(nextProfile);
        
        // ❌ MISSING: Invalidate React Query caches!
        // queryClient.invalidateQueries({ 
        //     queryKey: ['clientDashboardStats', auth.user?.id] 
        // });
        // queryClient.invalidateQueries({ 
        //     queryKey: ['clientDashboardJobs', auth.user?.id] 
        // });
        // queryClient.invalidateQueries({ 
        //     queryKey: ['clientActiveContracts', auth.user?.id] 
        // });

        return { success: true };
    } catch (error) {
        return { success: false, error };
    } finally {
        setLoading(false);
    }
}, [auth.user?.id]);
```

---

## Why First Load Fails

### Specific Scenario: New Client First Visit

1. **User logs in** → Redirected to ClientDashboard
2. **AuthContext** initializes from auth.user (minimal profile)
3. **ClientDashboard** mounts, calls 3 useQuery hooks
4. **All 3 queries depend on** `profile?.id` in their queryKey
5. **Profile?.id might be missing** or incomplete initially
6. **Queries use stale profile data** from previous mount
7. **Shows cached empty state** because profile.id was different/missing on last visit

**Solution Path**:
- Settings page loads (different URL)
- Profile GET request completes
- AuthContext updates with full profile data
- User navigates back to Dashboard
- Dashboard queries see updated profile?.id
- Cache is invalidated or re-fetched
- Shows correct data

---

## Affected Components

### 1. ClientDashboard.tsx
**Location**: `src/pages/ClientDashboard.tsx` lines 156-220

```typescript
// Query 1: Dashboard stats
const { data: stats } = useQuery({
    queryKey: ['clientDashboardStats', profile?.id],
    queryFn: () => getClientStats(profile!.id),
    staleTime: 60_000,
    enabled: !!profile?.id,
});

// Query 2: Dashboard jobs
const { data: jobs } = useQuery({
    queryKey: ['clientDashboardJobs', profile?.id],
    queryFn: () => getClientDashboardJobs(profile!.id),
    staleTime: 60_000,
    enabled: !!profile?.id,
});

// Query 3: Active contracts
const { data: contracts } = useQuery({
    queryKey: ['clientActiveContracts', profile?.id],
    queryFn: () => getClientActiveContracts(profile!.id),
    staleTime: 60_000,
    enabled: !!profile?.id,
});
```

**Problem**: All rely on `profile?.id` but cache not invalidated when profile changes

### 2. AuthContext.tsx
**Location**: `src/contexts/AuthContext.tsx` lines 539-569

```typescript
// updateProfile() doesn't invalidate queries
// refreshProfile() doesn't invalidate queries
```

**Problem**: No cache invalidation after mutations

### 3. ProfileSettings.tsx
**Location**: `src/components/settings/ProfileSettings.tsx`

```typescript
const handleSave = async () => {
    // Updates AuthContext
    await updateProfile(formData);
    
    // ❌ Doesn't invalidate dashboard queries
    // Should call:
    // queryClient.invalidateQueries({ queryKey: ['client*'] });
};
```

### 4. React Query Config
**Location**: `src/lib/queryClient.ts`

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,          // 30 seconds
            gcTime: 5 * 60_000,         // Keep in cache for 5 min
            retry: 2,
            refetchOnWindowFocus: false, // ❌ DISABLED - won't auto-refresh on tab switch
        },
    },
});
```

**Problem**: `refetchOnWindowFocus: false` means switching tabs won't refresh data

---

## The Fix Required

### Fix 1: Invalidate Cache in AuthContext (CRITICAL)

**File**: `src/contexts/AuthContext.tsx`

Add after line 569 (in updateProfile):

```typescript
// After profile is updated in database:
if (data) {
    setProfile(nextProfile);
    
    // ✅ ADD THIS: Invalidate related caches
    queryClient.invalidateQueries({
        queryKey: ['clientDashboardStats']
    });
    queryClient.invalidateQueries({
        queryKey: ['clientDashboardJobs']
    });
    queryClient.invalidateQueries({
        queryKey: ['clientActiveContracts']
    });
    queryClient.invalidateQueries({
        queryKey: ['freelancerDashboardStats']
    });
    // ... any other profile-dependent queries
}
```

### Fix 2: Invalidate in ProfileSettings (IMPORTANT)

**File**: `src/components/settings/ProfileSettings.tsx`

```typescript
const handleSave = async () => {
    try {
        const result = await updateProfile(formData);
        
        if (result.success) {
            // ✅ ADD THIS: Force refresh dashboard
            queryClient.invalidateQueries({
                queryKey: ['client']  // Matches all client* queries
            });
            
            showToast('Profile updated', 'success');
        }
    } catch (error) {
        showToast('Update failed', 'error');
    }
};
```

### Fix 3: Enable refetchOnWindowFocus (NICE TO HAVE)

**File**: `src/lib/queryClient.ts`

```typescript
// Change from:
refetchOnWindowFocus: false,

// To:
refetchOnWindowFocus: true,  // Refresh data when user switches tabs
```

---

## Why This Happens

### The Cache Key Dependency

Dashboard queries use:
```typescript
queryKey: ['clientDashboardStats', profile?.id]
```

When profile?.id changes, React Query **should** automatically invalidate the old cache and fetch new data. But it doesn't because:

1. **Profile?.id is included in key** (good)
2. **But cache invalidation is manual** (bad - happens rarely)
3. **staleTime is 60 seconds** (too long - shows stale data)
4. **No invalidation in mutation success** (forgotten - cache never updates)

---

## Testing the Bug

### To Reproduce

1. **First time**: Navigate to `/client/dashboard`
   - Notice: Shows minimal/empty data, generic avatar
   - Page looks "broken" but is loading from cache

2. **Navigate away**: Click "Settings" tab
   - Profile data loads properly
   - Avatar, name, email all display correctly

3. **Navigate back**: Click "Dashboard" tab again
   - NOW shows correct data with real avatar and name
   - Why? Because Settings page updated AuthContext

### To Verify Fix Works

After applying fixes:

1. **First visit to dashboard**
   - Should show data immediately with correct profile
   - Avatar shows real image, not placeholder

2. **Edit profile in Settings**
   - Save changes
   - Switch to Dashboard
   - Changes appear immediately (no 60s delay)

3. **Switch browser tabs**
   - Leave app, return to another app
   - Click Khedma tab
   - Data refreshes automatically

---

## Impact

| Before Fix | After Fix |
|-----------|-----------|
| ❌ First load shows empty/stale data | ✅ First load shows correct data |
| ❌ Must navigate away/back to see changes | ✅ Changes visible immediately |
| ❌ Tab switching doesn't refresh | ✅ Tab switching refreshes data |
| ❌ Confusing UX (looks broken initially) | ✅ Consistent reliable UX |
| ❌ 60s wait for cache to expire | ✅ Instant cache invalidation |

---

## Files Needing Changes

| File | Lines | Change |
|------|-------|--------|
| `src/contexts/AuthContext.tsx` | 569-575 | Add queryClient invalidation |
| `src/components/settings/ProfileSettings.tsx` | handleSave | Add queryClient invalidation |
| `src/lib/queryClient.ts` | ~line 20 | Change refetchOnWindowFocus to true |
| `src/pages/ClientDashboard.tsx` | Optional: Reduce staleTime to 30s | Faster detection of stale data |

---

## Summary

**Problem**: Dashboard uses React Query with 60-second cache, but cache never invalidated when profile updates  
**Result**: First load shows stale/empty data, must navigate away and back to refresh  
**Fix**: Add `queryClient.invalidateQueries()` calls when profile updates in AuthContext  
**Benefit**: Instant cache refresh, consistent UX, no stale data

---

## Prepared for AI Agent

This bug is ready for implementation:
- ✅ Root cause identified (missing cache invalidation)
- ✅ Exact locations identified (3 files)
- ✅ Exact code changes needed (4 locations)
- ✅ Testing procedure clear
- ✅ Impact is immediate and noticeable

**Ready to assign to agent**: YES ✅
