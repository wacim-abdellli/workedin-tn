# Settings I18N Roadmap

Step-by-step master plan for full AR/EN/FR coverage across all pages inside Settings. 

### Step 1: `Settings.tsx` & `ProfileSettings.tsx`
* Extract missing textual blocks (e.g. "Active context", "CURRENT WORKSPACE").
* Add structured keys to `en.ts`, `ar.ts`, and `fr.ts`.
* Refactor elements to strictly use `tx('settings.profile.*')` without English fallbacks natively visible to end users.
* Add CSS `dir="auto"` or layout directional tweaks for RTL friendliness.

### Step 2: `NotificationSettings.tsx`
* Extract standard toggle text: "Real-time", "Instant push updates", "In-App & Email", "Delivery speed", "Active rules".
* Add to `en.ts`, `ar.ts`, and `fr.ts` under `settings.notificationSettings`.
* Inject into toggle rows, ensuring label vs description alignments are perfect in LTR and RTL.

### Step 3: `PaymentSettings.tsx` & `WalletSettings.tsx`
* Extract "Billing Details", "Add New Card", "Transaction History", "Download PDF" strings.
* Add translations under `settings.billing` or `settings.payments`.
* Verify payment forms (Stripe/Paypal elements) have proper directionality wrappers so labels ("Card number", "CVC") do not overlap inputs in RTL.

### Step 4: `VerificationSettings.tsx` 
* Ensure ID verification, Passport uploads, and status indicators ("Pending Review", "Approved") are properly translated.

### Execution
We will go sequentially. I am now starting **Step 1 and Step 2** right away.