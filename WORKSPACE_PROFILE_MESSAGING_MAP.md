# Workspace Profile and Messaging Map

## Goal
Build a marketplace path where one account can operate in two clear workspaces:
- `client` workspace
- `freelancer` workspace

Shared identity stays consistent, while workspace-specific data stays isolated.

---

## 1) Common vs Workspace-Specific Data

### Common (single source of truth)
- account id, email, phone verification
- legal identity and trust status (`cin_verified`, account status)
- language and security state

### Workspace-specific (must not overwrite each other)
- profile avatar (`avatar_url_client`, `avatar_url_freelancer`)
- onboarding depth and profile sections
- messaging inbox context (`conversation_scope`)

---

## 2) Messaging Isolation Rules

### Direct messages
- Client-side conversations are isolated under `conversation_scope = 'client'`
- Freelancer-side conversations are isolated under `conversation_scope = 'freelancer'`

### Contract messages
- Contract thread uses `conversation_scope = 'contract'`
- Contract conversation can co-exist with direct client/freelancer conversation between same users

### Legacy compatibility
- Existing threads are treated as `shared`
- `shared` appears in both workspaces until migrated naturally

---

## 3) Upwork/Fiverr-style UX Expectations (explicit)

### Upwork-style profile logic
- separate role context and trust signals
- mode-aware profile relevance in search and messaging

### Fiverr-style setup logic
- role-specific selling/buying context
- clear scope expectations and communication channel discipline

---

## 4) Technical Path Implemented

1. Add workspace avatar columns on `profiles`
2. Add `conversation_scope` on `conversations`
3. Update `get_or_create_conversation` to resolve scope by:
   - `contract` if `contract_id` exists
   - explicit `p_scope` if passed
   - otherwise caller `active_mode`
4. Filter messages inbox by active workspace scopes:
   - client mode: `client + contract + shared`
   - freelancer mode: `freelancer + contract + shared`
5. Keep compatibility fallbacks for environments not yet migrated

---

## 5) Required DB Migrations

- `supabase/migrations/20260410103000_expand_onboarding_profile_fields.sql`
- `supabase/migrations/20260410114000_fix_set_user_account_status_notification_overload.sql`
- `supabase/migrations/20260410132000_workspace_scoped_conversations_and_mode_avatars.sql`

Apply all before production validation.
