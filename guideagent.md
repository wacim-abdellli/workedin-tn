# 🧠 Master Guidance: The Path to WorkedIn Perfection
**Status:** Audit & Strategic Planning
**Master Auditor:** Gemini CLI (Advanced Engineering Mode)

This document serves as the **Single Source of Truth** for the execution agent. Every action must align with the standards defined here.

---

## 🎯 The "Standard of Perfection" (SOP)
A task is not complete until:
1. **RTL Integrity:** Zero `left-`, `right-`, `ml-`, `mr-`, `pl-`, `pr-` remain in UI-critical components. Use `start`, `end`, `ms`, `me`, `ps`, `pe`.
2. **Component Granularity:** No file exceeds 1,500 lines. Logic is extracted into custom hooks (`useContractLogic`, `useChatState`).
3. **Build Zero-Warning:** `vite build` produces 0 circular dependency warnings and 0 CSS minification warnings.
4. **Type Safety:** 100% TS coverage in all new/refactored files. No `any`.

---

## 🗺️ Roadmap to Publication

### 📍 Task 1: The Final RTL Sweep (Surgical)
**Goal:** Fix the missed logical properties in the Contract system.
*   **Target 1: `src/components/contracts/ContractWorkspace.jsx`**
    *   Change `left-0` to `start-0` on the tab indicator (Line 148).
    *   Change `left-5 right-5` to `inset-x-5` on the milestone track (Line 392).
    *   Ensure progress bar growth (Line 393) respects direction.
*   **Target 2: `src/components/contracts/ContractDetailsSidebar.tsx`**
    *   Change `-left-[30px]` to `-start-[30px]` for timeline and activity dots (Lines 1681, 1911).

### 📍 Task 2: Component Decompression (Structural)
**Goal:** Break down `ContractDetailsSidebar.tsx` (2.3k lines).
*   **Strategy:** Extract the `Timeline`, `ActivityLog`, and `FileSection` into separate components.
*   **Guidance:** Maintain the `model` prop pattern to keep data flow consistent without introducing prop-drilling or state desync.

### 📍 Task 3: Build & Performance (Optimization)
**Goal:** Eliminate Circular Dependencies & Build Warnings.
*   **Audit Bug 1: Circular Chunk Dependency** (`form-vendor` -> `react-vendor` -> `form-vendor`).
    *   **Action:** Refactor `manualChunks` in `vite.config.ts` to flatten the vendor tree.
*   **Audit Bug 2: CSS Minification Warnings.**
    *   **Action:** Audit arbitrary values in Tailwind classes that trigger `esbuild` warnings.

### 📍 Task 5: Global i18n Restoration (Sprint 1: Wallet & Common)
**Goal:** Purge 'auto.*' and 'dynamic_key_*' from the Wallet system and core UI.

#### **Mapping Table (To be added to ar.ts, en.ts, fr.ts)**

| Key | English | French | Arabic |
| :--- | :--- | :--- | :--- |
| `wallet.lockedFunds` | Locked Funds Schedule | Calendrier des fonds bloqués | جدول الأموال المحجوزة |
| `wallet.noLockedFunds` | No funds currently locked | Aucun fonds bloqué | لا توجد أموال محجوزة حالياً |
| `wallet.requestWithdrawalTitle` | Request Withdrawal | Demander un retrait | طلب سحب أموال |
| `wallet.bankName` | Bank Name | Nom de la banque | اسم البنك |
| `wallet.accHolderName` | Account Holder Name | Nom du titulaire | اسم صاحب الحساب |
| `common.yes` | Yes | Oui | نعم |
| `common.no` | No | Non | لا |
| `common.processing` | Processing... | Traitement... | جاري المعالجة... |

#### **Execution Steps for Agent:**
1.  **Dictionary Sync:** Add the above keys to `src/i18n/ar.ts`, `en.ts`, and `fr.ts`.
2.  **Surgical Replacement:**
    *   In `Wallet.tsx`, replace `tx('auto.locked_funds_schedul', ...)` with `tx('wallet.lockedFunds')`.
    *   Replace `tx('auto.bank_name', ...)` with `tx('wallet.bankName')`.
3.  **Cleanup:** Delete the unused `dynamic_key_XXXX` entries from the end of the translation files once they are fully mapped.

---

### 🛡️ Auditor's Strict Rule for i18n:
**NEVER** use the third parameter (fallback) in `tx()` for new code. Every string **MUST** exist in the dictionary. If a key is missing, the auditor will flag the build as "Failed."

---

## 🛠️ Execution Protocol for the Agent
1. **Read-Before-Act:** Always read the full target component to identify side effects.
2. **Surgical Edits:** Use `replace` tool whenever possible to avoid rewriting 2k line files.
3. **Validation:** After every change, verify with `npm run tsc` (if applicable) and check the RTL layout logic.

---

**"The difference between good and perfect is the attention to the hidden details."**
