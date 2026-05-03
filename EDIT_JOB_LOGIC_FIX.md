# Edit Job Button Logic Fix

## Problem
The "Edit Job" button was always enabled, even after hiring a freelancer and creating an active contract. This could lead to:
- Changing job details while someone is actively working
- Confusion about project scope during active work
- Potential disputes over changed requirements

## Solution - Business Logic

### When Edit is DISABLED ❌
The Edit button is now disabled when there's an **active contract**:
- Contract status is: `active`, `in_progress`, `pending_payment`, or `delivery_submitted`
- Someone is hired and actively working on the job
- Work is in progress or awaiting review

### When Edit is ENABLED ✅
The Edit button is enabled when:
- Job status is `open` (no one hired yet)
- All contracts are `completed` or `cancelled`
- No active work in progress

## Implementation

### 1. Added State to Track Active Contracts
```typescript
const [hasActiveContract, setHasActiveContract] = useState(false);
```

### 2. Check for Active Contracts on Page Load
When loading job proposals, we now also check if there are any active contracts:
```typescript
const contractsRes = await supabase.from('contracts')
    .select('id, status')
    .eq('job_id', jobId)
    .in('status', ['active', 'in_progress', 'pending_payment', 'delivery_submitted']);

setHasActiveContract(contractsRes.data.length > 0);
```

### 3. Disable Edit Button When Contract is Active
```typescript
<Button 
    variant="outline" 
    size="sm" 
    leftIcon={<Edit className="w-3.5 h-3.5" />}
    onClick={() => navigate(getJobEditRoute(jobId))}
    disabled={hasActiveContract}
    title={hasActiveContract ? 'Cannot edit job with active contract' : 'Edit job details'}
>
    Edit
</Button>
```

### 4. Update State When Hiring
When a freelancer is hired, immediately mark that an active contract exists:
```typescript
onSuccess: (contract) => {
    setHasActiveContract(true);
    // ... rest of success logic
}
```

## Contract Statuses Explained

### Active Statuses (Edit Disabled)
- **active**: Contract is ongoing, freelancer is working
- **in_progress**: Work is actively being done
- **pending_payment**: Waiting for payment to start work
- **delivery_submitted**: Work delivered, awaiting client review

### Inactive Statuses (Edit Enabled)
- **completed**: Work finished and paid
- **cancelled**: Contract was cancelled
- **disputed**: Contract in dispute (can be resolved)

## User Experience

### Before Hiring
```
┌─────────────────────────────────┐
│ [Share] [Edit] [•••]            │  ← Edit is ENABLED
└─────────────────────────────────┘
```

### After Hiring (Active Contract)
```
┌─────────────────────────────────┐
│ [Share] [Edit] [•••]            │  ← Edit is DISABLED (grayed out)
│         ↑                        │
│    Tooltip: "Cannot edit job    │
│    with active contract"         │
└─────────────────────────────────┘
```

### After Contract Completes
```
┌─────────────────────────────────┐
│ [Share] [Edit] [•••]            │  ← Edit is ENABLED again
└─────────────────────────────────┘
```

## Benefits

✅ **Prevents scope changes during active work**
- Protects both client and freelancer from mid-project changes
- Maintains clear project requirements

✅ **Reduces disputes**
- Job details can't be changed after hiring
- Original agreement is preserved

✅ **Clear user feedback**
- Disabled button with tooltip explains why
- Users understand they can't edit during active work

✅ **Proper workflow**
- Edit before hiring: ✅ Allowed
- Edit during work: ❌ Blocked
- Edit after completion: ✅ Allowed (for reposting)

## Testing

### Test Case 1: Before Hiring
1. Create a new job
2. Go to proposals page
3. **Expected**: Edit button is enabled
4. Click Edit → Should navigate to edit page

### Test Case 2: After Hiring
1. Hire a freelancer from proposals
2. Stay on proposals page
3. **Expected**: Edit button becomes disabled
4. Hover over Edit → Should show tooltip
5. Try to click → Nothing happens (disabled)

### Test Case 3: After Contract Completes
1. Complete an active contract
2. Return to proposals page
3. **Expected**: Edit button is enabled again
4. Can edit job for reposting

### Test Case 4: Page Refresh
1. Hire a freelancer
2. Refresh the proposals page
3. **Expected**: Edit button loads as disabled
4. State persists across page loads

## Files Modified

- `src/pages/JobProposals.tsx`
  - Added `hasActiveContract` state
  - Added contract status check in data fetch
  - Disabled Edit button when contract is active
  - Added tooltip for disabled state
  - Update state when hiring

## Database Query

The check queries the `contracts` table:
```sql
SELECT id, status 
FROM contracts 
WHERE job_id = $1 
AND status IN ('active', 'in_progress', 'pending_payment', 'delivery_submitted')
```

If any rows are returned, the job has an active contract and editing is disabled.
