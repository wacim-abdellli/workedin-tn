# User Type Selection & Workspace-Scoped Messaging Audit

## Executive Summary

This document provides a comprehensive audit of WorkedIn's user type selection flow and workspace-scoped messaging implementation. The analysis reveals that the current system properly implements workspace-scoped messaging but has a **critical gap in the signup flow** where new users are not prompted to choose between Freelancer and Client during initial registration.

---

## Part 1: User Type Selection Flow

### Current Implementation

#### 1.1 Signup Flow (`src/pages/Signup.tsx`)

**What Happens:**
- User enters email and password
- System creates account via `signUpWithEmail()`
- User is redirected to `/verify-email` page
- **NO user type selection occurs during signup**

**Critical Finding:**
```typescript
// In Signup.tsx - after successful signup
await signUpWithEmail(data.email, data.password);
navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
// ❌ User type is NOT selected here
```

#### 1.2 Post-Email-Verification Flow

**What Should Happen (but doesn't always):**
After email verification, the system should redirect to user type selection, but this depends on the auth callback handling.

**The SignupForm Component** (`src/components/auth/SignupForm.tsx`) has TWO modes:
1. **Email/Password Entry Mode** (step === 'email')
2. **User Type Selection Mode** (step === 'userType')

The user type selection UI exists but is only shown when:
```typescript
const shouldShowTypeSelection = searchParams.get('step') === 'select-type';
```

**Critical Gap:** The main signup flow (`/signup`) does NOT automatically redirect to `?step=select-type` after email verification.

#### 1.3 User Type Selection UI

When shown, the user type selection presents two options:

```typescript
const userTypes = [
    {
        type: 'freelancer',
        icon: <User />,
        title: t.auth.freelancer,
        description: t.auth.userTypeFreelancerDesc,
    },
    {
        type: 'client',
        icon: <Briefcase />,
        title: t.auth.client,
        description: t.auth.userTypeClientDesc,
    },
];
```

**What Happens After Selection:**
```typescript
const handleSelectUserType = async (userType: UserType) => {
    await setUserType(userType); // Calls RPC: set_user_type_rpc
    await refreshProfile();
    
    // Determines onboarding path
    const startWorkspace = userType === 'client' ? 'client' : 'freelancer';
    navigate(getWorkspaceOnboardingPath(startWorkspace));
};
```

### 1.4 Onboarding Routing

**Freelancer Onboarding** (`/onboarding/freelancer`):
- 3-step process
- Sets `user_type` to 'freelancer' or 'both' (if already client)
- Sets `freelancer_onboarding_completed = true`
- Redirects to `/freelancer/dashboard`

**Client Onboarding** (`/onboarding/client`):
- 2-step process
- Sets `user_type` to 'client' or 'both' (if already freelancer)
- Sets `client_onboarding_completed = true`
- Redirects to `/client/dashboard`

---

## Part 2: Workspace-Scoped Messaging Implementation

### 2.1 Database Schema

**Conversations Table:**
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    participant_1 UUID REFERENCES profiles(id),
    participant_2 UUID REFERENCES profiles(id),
    contract_id UUID REFERENCES contracts(id),
    conversation_scope TEXT, -- 'client' | 'freelancer' | 'contract' | 'shared'
    last_message_text TEXT,
    last_message_at TIMESTAMP,
    unread_count_1 INTEGER DEFAULT 0,
    unread_count_2 INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Column:** `conversation_scope` determines which workspace can see the conversation.

### 2.2 Conversation Scope Logic

**Scope Values:**
- `'client'` - Only visible in client workspace
- `'freelancer'` - Only visible in freelancer workspace
- `'contract'` - Visible in both workspaces (contract-related)
- `'shared'` - Visible in both workspaces (general)

**Scope Resolution Function** (`src/services/messages.ts`):
```typescript
const resolveConversationScopes = (activeMode: string | null | undefined): ConversationScope[] => {
    if (activeMode === 'freelancer') return ['freelancer', 'contract', 'shared'];
    if (activeMode === 'client') return ['client', 'contract', 'shared'];
    return ['client', 'freelancer', 'contract', 'shared']; // fallback: show all
};
```

### 2.3 Message Filtering in UI

**Messages.tsx Implementation:**
```typescript
const { activeMode } = useAuth(); // Gets current workspace: 'client' or 'freelancer'
const conversationScopes = resolveConversationScopes(activeMode);

// Fetch conversations filtered by scope
const { data, error } = await getConversations(user.id, page, limit, {
    scopes: conversationScopes,
});
```

**Database Query** (`src/services/messages.ts`):
```typescript
// Two separate queries for performance (avoids .or() full table scan)
const query1 = supabase
    .from('conversations')
    .select('*')
    .eq('participant_1', userId)
    .in('conversation_scope', scopes); // Filters by workspace

const query2 = supabase
    .from('conversations')
    .select('*')
    .eq('participant_2', userId)
    .in('conversation_scope', scopes); // Filters by workspace
```

### 2.4 Workspace-Scoped Avatar URLs

**Profile Table Columns:**
- `avatar_url` - Legacy/fallback avatar
- `avatar_url_client` - Avatar for client workspace
- `avatar_url_freelancer` - Avatar for freelancer workspace

**Avatar Resolution** (`src/contexts/AuthContext.tsx`):
```typescript
function resolveModeAvatarUrl(profile: Profile): string | undefined {
    if (profile.active_mode === 'freelancer' && profile.avatar_url_freelancer) {
        return profile.avatar_url_freelancer;
    }
    if (profile.active_mode === 'client' && profile.avatar_url_client) {
        return profile.avatar_url_client;
    }
    return profile.avatar_url_freelancer || profile.avatar_url_client || profile.avatar_url;
}
```

---

## Part 3: Real-World Scenario Analysis

### Scenario: Account1 (Client) → Account2 (Freelancer)

**Setup:**
- Account1 has `user_type = 'client'`, `active_mode = 'client'`
- Account2 has `user_type = 'freelancer'`, `active_mode = 'freelancer'`

**Step 1: Account1 sends message to Account2**
```typescript
// In Messages.tsx
await sendMessage({
    conversationId: conversation.id,
    senderId: account1.id,
    receiverId: account2.id,
    content: "Hello, I need a developer",
    contractId: null,
    attachments: []
});
```

**Step 2: Conversation is created with scope**
```typescript
// In get_or_create_conversation RPC function
// Since Account1 is in client mode, scope is set to 'client'
conversation_scope = 'client'
```

**Step 3: Account2 checks messages in freelancer workspace**
```typescript
// Account2's active_mode = 'freelancer'
const scopes = resolveConversationScopes('freelancer');
// Returns: ['freelancer', 'contract', 'shared']

// Query filters conversations
.in('conversation_scope', ['freelancer', 'contract', 'shared'])
// ❌ Conversation with scope='client' is NOT returned
```

**Result:** Account2 CANNOT see the message in freelancer workspace.

**Step 4: Account2 switches to client workspace**
```typescript
// Account2 switches active_mode to 'client'
const scopes = resolveConversationScopes('client');
// Returns: ['client', 'contract', 'shared']

// Query filters conversations
.in('conversation_scope', ['client', 'contract', 'shared'])
// ✅ Conversation with scope='client' IS returned
```

**Result:** Account2 CAN see the message in client workspace.

---

## Part 4: Issues & Gaps

### 4.1 Critical Issues

#### Issue #1: Missing User Type Selection in Signup Flow
**Severity:** HIGH  
**Impact:** New users complete signup without selecting Freelancer/Client, leading to:
- Unclear onboarding path
- Users may not understand workspace concept
- Potential confusion about which dashboard to use

**Current Behavior:**
```
Signup → Email Verification → ??? → Onboarding
```

**Expected Behavior:**
```
Signup → Email Verification → User Type Selection → Onboarding
```

**Recommendation:**
Add automatic redirect to `/signup?step=select-type` after email verification in the auth callback handler.

#### Issue #2: Conversation Scope Assignment Logic
**Severity:** MEDIUM  
**Impact:** Conversations may be scoped incorrectly based on sender's active_mode at creation time

**Current Behavior:**
- Conversation scope is determined by the RPC function `get_or_create_conversation`
- Scope is set based on the `p_scope` parameter passed from the client
- If `p_scope` is null, the function uses a default (likely 'shared')

**Potential Problem:**
If Account1 (who has both client and freelancer profiles) sends a message while in client mode, the conversation is scoped to 'client'. If Account2 only has a freelancer profile, they may not see the message in their freelancer workspace.

**Recommendation:**
Implement intelligent scope detection:
- If both users have the same single user_type, use that scope
- If users have different user_types, use 'shared' scope
- For contract-related messages, always use 'contract' scope

### 4.2 Minor Issues

#### Issue #3: No Visual Indicator of Conversation Scope
**Severity:** LOW  
**Impact:** Users cannot tell which workspace a conversation belongs to

**Recommendation:**
Add a small badge or icon in the conversation list showing the scope (client/freelancer/contract/shared).

#### Issue #4: No Bulk Scope Migration Tool
**Severity:** LOW  
**Impact:** Existing conversations created before workspace-scoped messaging may have null or incorrect scopes

**Recommendation:**
Create a migration script to backfill conversation_scope for existing conversations based on:
- Contract ID (if present → 'contract')
- Participant user_types (if both client → 'client', if both freelancer → 'freelancer', else → 'shared')

---

## Part 5: Recommendations

### 5.1 Immediate Actions (High Priority)

1. **Fix Signup Flow**
   - Add user type selection step after email verification
   - Update auth callback to redirect to `/signup?step=select-type`
   - Ensure all new users select Freelancer or Client before onboarding

2. **Improve Conversation Scope Logic**
   - Update `get_or_create_conversation` RPC to intelligently determine scope
   - Consider both participants' user_types when assigning scope
   - Default to 'shared' for cross-workspace conversations

3. **Add Scope Validation**
   - Validate that conversation scope matches participants' capabilities
   - Prevent creating 'freelancer' scoped conversations if sender is client-only

### 5.2 Medium-Term Improvements

1. **Add Scope Indicators in UI**
   - Show workspace badges in conversation list
   - Add filter to show only client/freelancer/contract conversations
   - Display scope in conversation header

2. **Implement Scope Migration**
   - Create SQL migration to backfill conversation_scope
   - Add admin tool to manually adjust conversation scopes
   - Log scope changes for audit trail

3. **Enhance Onboarding**
   - Add explanation of workspace concept during user type selection
   - Show preview of client vs freelancer dashboards
   - Explain that users can have both profiles

### 5.3 Long-Term Enhancements

1. **Smart Scope Switching**
   - Auto-switch workspace when user clicks on a conversation from the other workspace
   - Show notification: "Switching to client workspace to view this conversation"

2. **Unified Inbox Option**
   - Add "All Messages" view that shows conversations from both workspaces
   - Clearly label each conversation's workspace
   - Allow filtering by workspace

3. **Conversation Scope History**
   - Track scope changes over time
   - Allow users to see why a conversation is in a specific workspace
   - Provide option to move conversations between workspaces (with validation)

---

## Part 6: Testing Checklist

### 6.1 User Type Selection Tests

- [ ] New user completes signup → sees user type selection
- [ ] User selects "Freelancer" → redirected to freelancer onboarding
- [ ] User selects "Client" → redirected to client onboarding
- [ ] User cannot skip user type selection
- [ ] User type is saved to database correctly

### 6.2 Workspace-Scoped Messaging Tests

- [ ] Client sends message to freelancer → conversation has correct scope
- [ ] Freelancer sends message to client → conversation has correct scope
- [ ] User with both profiles can see conversations in correct workspaces
- [ ] Switching workspaces shows/hides correct conversations
- [ ] Contract-related messages visible in both workspaces
- [ ] Shared conversations visible in both workspaces

### 6.3 Edge Cases

- [ ] User with only client profile cannot see freelancer-scoped conversations
- [ ] User with only freelancer profile cannot see client-scoped conversations
- [ ] User adds second profile → can now see conversations in both workspaces
- [ ] Conversation scope updates when contract is added
- [ ] Deleted conversations don't appear in any workspace

---

## Conclusion

The workspace-scoped messaging system is **architecturally sound** and properly implemented in the database and backend logic. The main issue is the **missing user type selection step in the signup flow**, which should be addressed immediately to ensure all new users understand the workspace concept from the start.

The conversation scope filtering works correctly, but could benefit from smarter scope assignment logic and better UI indicators to help users understand which workspace they're viewing messages in.

**Priority Actions:**
1. Fix signup flow to include user type selection (HIGH)
2. Improve conversation scope assignment logic (MEDIUM)
3. Add visual scope indicators in UI (LOW)
4. Create scope migration tool for existing data (LOW)
