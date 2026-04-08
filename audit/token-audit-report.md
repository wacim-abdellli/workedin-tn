> Legacy note: generated token-audit report. Not canonical.
> Use `audit/DESIGN_TOKEN_COMPLIANCE_POLICY.md` and `npm run tokens:compliance` output instead.

# Token Audit Report

Generated: 2026-04-05T19:54:40.902Z

## Summary

- **Total Files Scanned**: 280
- **Files with Issues**: 69
- **Inconsistent Naming**: 1044
- **Deprecated Tokens**: 0
- **Undefined Tokens**: 296
- **Correct Usage**: 127

## Inconsistent Naming (1044)

These tokens use non-standard naming conventions and should be updated:

### `--background` → `--color-bg-base`

- **Category**: background
- **Occurrences**: 1
- **Files affected**:
  - `src\pages\SearchResults.tsx` (lines: 168)

### `--border` → `--color-border-default`

- **Category**: border
- **Occurrences**: 67
- **Files affected**:
  - `src\components\common\FileUpload.tsx` (lines: 166)
  - `src\components\freelancer\profile\AboutSection.tsx` (lines: 7)
  - `src\components\freelancer\profile\PortfolioSection.tsx` (lines: 15, 51)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 37, 87, 91, 95, 104, 163, 172, 181, 190)
  - `src\components\freelancer\profile\ProfileSidebar.tsx` (lines: 22, 48, 66, 82)
  - `src\components\freelancer\profile\ProfileSkeleton.tsx` (lines: 11)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 38, 106)
  - `src\components\freelancer\profile\SkillsSection.tsx` (lines: 8)
  - `src\components\home\HeroSection.tsx` (lines: 110, 110, 230, 241)
  - `src\components\home\HowItWorksSection.tsx` (lines: 37, 42)
  - `src\components\home\TestimonialsSection.tsx` (lines: 33)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 39, 72, 125, 160)
  - `src\components\job-post\StepBudget.tsx` (lines: 89, 138, 158, 171, 177, 181, 185)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 110, 131, 145, 184, 198, 275, 307)
  - `src\components\jobs\FilterSidebar.tsx` (lines: 273)
  - `src\pages\FindFreelancers.tsx` (lines: 197, 305, 334, 354, 358, 362, 369, 409, 436, 452, 458, 462)
  - `src\pages\JobBoard.tsx` (lines: 393)
  - `src\pages\JobPost.tsx` (lines: 454)
  - `src\pages\JobPostSuccess.tsx` (lines: 36, 106, 120, 160, 170, 180)

### `--brand-accent` → `--color-brand-accent`

- **Category**: brand
- **Occurrences**: 137
- **Files affected**:
  - `src\components\common\FileUpload.tsx` (lines: 106, 106, 114, 115, 139, 140, 141, 145, 150, 166, 167, 175, 176)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 63)
  - `src\components\freelancers\FreelancerCard.tsx` (lines: 176, 177)
  - `src\components\home\CTASection.tsx` (lines: 15)
  - `src\components\home\HeroSection.tsx` (lines: 101)
  - `src\components\home\LiveCounterSection.tsx` (lines: 22, 38, 65)
  - `src\components\home\TestimonialsSection.tsx` (lines: 66)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 39, 40, 41, 48, 49, 50, 72, 76, 115, 116, 117, 121, 122, 133, 133, 133, 135)
  - `src\components\job-post\StepBudget.tsx` (lines: 39, 39, 39, 40, 40, 50, 50, 63, 63, 63, 64, 64, 74, 74, 89, 138, 158, 171, 178, 178, 182, 182, 186, 186)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 110, 131, 145, 146, 146, 161, 162, 184, 198, 199, 199, 213, 214, 241, 242, 243, 256, 257, 275, 290, 290, 290, 291, 291, 307)
  - `src\components\job-post\StepVisibility.tsx` (lines: 33, 33, 33, 33, 33, 36, 36, 46, 46, 46, 46, 46, 49, 49, 63, 64, 67)
  - `src\components\layout\Header\SearchModal.tsx` (lines: 319)
  - `src\pages\FindFreelancers.tsx` (lines: 197, 197, 203, 335, 345)
  - `src\pages\JobPost.tsx` (lines: 454, 464, 465, 466, 551, 552)
  - `src\pages\JobPostSuccess.tsx` (lines: 36, 106, 120, 121, 160, 170, 180)
  - `src\pages\Notifications.tsx` (lines: 26, 26)
  - `src\pages\SearchResults.tsx` (lines: 267, 349, 353, 360, 577, 577, 578, 583, 586, 624, 636)

### `--card-bg` → `--color-bg-elevated`

- **Category**: background
- **Occurrences**: 75
- **Files affected**:
  - `src\components\common\FileUpload.tsx` (lines: 114, 140, 145, 150, 167, 175, 196, 206)
  - `src\components\common\SkeletonCard.tsx` (lines: 11, 11)
  - `src\components\freelancer\profile\PortfolioSection.tsx` (lines: 51)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 64, 126, 139)
  - `src\components\freelancer\profile\ProfileSkeleton.tsx` (lines: 10)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 106)
  - `src\components\freelancers\FreelancerCard.tsx` (lines: 172, 176)
  - `src\components\home\CTASection.tsx` (lines: 52)
  - `src\components\home\HeroSection.tsx` (lines: 195, 229)
  - `src\components\home\HowItWorksSection.tsx` (lines: 42)
  - `src\components\home\TestimonialsSection.tsx` (lines: 33)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 40, 49, 73, 126)
  - `src\components\job-post\StepBudget.tsx` (lines: 19, 40, 64, 90, 138, 158, 171, 177, 181, 185)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 92, 111, 132, 145, 185, 198, 242, 257, 276, 308)
  - `src\components\job-post\StepVisibility.tsx` (lines: 17, 33, 46, 64)
  - `src\components\layout\Header\SearchModal.tsx` (lines: 255, 301, 398)
  - `src\components\layout\Header\index.tsx` (lines: 319, 367)
  - `src\pages\FindFreelancers.tsx` (lines: 197, 305, 339, 354, 358, 362, 369, 409, 436, 452, 458, 462)
  - `src\pages\JobPost.tsx` (lines: 455, 465, 552)
  - `src\pages\JobPostSuccess.tsx` (lines: 37, 46, 121)
  - `src\pages\SearchResults.tsx` (lines: 335)

### `--dash-bg` → `--color-bg-base`

- **Category**: background
- **Occurrences**: 6
- **Files affected**:
  - `src\components\home\LiveCounterSection.tsx` (lines: 19, 19)
  - `src\pages\ClientDashboard.tsx` (lines: 177, 188)
  - `src\pages\FreelancerDashboard.tsx` (lines: 263, 274)

### `--dash-border` → `--color-border-default`

- **Category**: border
- **Occurrences**: 12
- **Files affected**:
  - `src\components\common\EmptyState.tsx` (lines: 41)
  - `src\components\dashboard\DashWidget.tsx` (lines: 16, 27, 33)
  - `src\components\dashboard\ProfileRing.tsx` (lines: 22)
  - `src\pages\ClientDashboard.tsx` (lines: 249, 287, 333)
  - `src\pages\FreelancerDashboard.tsx` (lines: 334, 377, 420, 457)

### `--dash-raised` → `--color-bg-elevated`

- **Category**: background
- **Occurrences**: 6
- **Files affected**:
  - `src\components\freelancer\profile\ProfileSkeleton.tsx` (lines: 18, 18)
  - `src\pages\ClientDashboard.tsx` (lines: 295, 420)
  - `src\pages\FreelancerDashboard.tsx` (lines: 342, 508)

### `--page-bg` → `--color-bg-base`

- **Category**: background
- **Occurrences**: 27
- **Files affected**:
  - `src\App.tsx` (lines: 408)
  - `src\components\freelancer\profile\ProfileSkeleton.tsx` (lines: 5, 23)
  - `src\components\home\CTASection.tsx` (lines: 10)
  - `src\components\home\CategoriesSection.tsx` (lines: 57)
  - `src\components\home\HeroSection.tsx` (lines: 94)
  - `src\components\home\HowItWorksSection.tsx` (lines: 14)
  - `src\components\job-post\StepBudget.tsx` (lines: 90, 90, 138, 158, 171)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 111, 111, 276, 276, 308, 308)
  - `src\components\ui\Loading.tsx` (lines: 16)
  - `src\index.css` (lines: 133)
  - `src\pages\FindFreelancers.tsx` (lines: 330, 334, 335, 335)
  - `src\pages\Home.tsx` (lines: 51)
  - `src\pages\JobPost.tsx` (lines: 394)
  - `src\pages\JobPostSuccess.tsx` (lines: 29)

### `--stat-pill-bg` → `--color-bg-subtle`

- **Category**: background
- **Occurrences**: 2
- **Files affected**:
  - `src\pages\ClientDashboard.tsx` (lines: 219)
  - `src\pages\FreelancerDashboard.tsx` (lines: 305)

### `--stat-pill-border` → `--color-border-subtle`

- **Category**: border
- **Occurrences**: 2
- **Files affected**:
  - `src\pages\ClientDashboard.tsx` (lines: 220)
  - `src\pages\FreelancerDashboard.tsx` (lines: 306)

### `--surface-bg` → `--color-bg-elevated`

- **Category**: background
- **Occurrences**: 60
- **Files affected**:
  - `src\components\common\FileUpload.tsx` (lines: 167)
  - `src\components\freelancer\profile\PortfolioSection.tsx` (lines: 31)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 48, 87, 91, 95, 104, 126, 139)
  - `src\components\freelancer\profile\ProfileSidebar.tsx` (lines: 55)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 46)
  - `src\components\home\HeroSection.tsx` (lines: 240)
  - `src\components\home\TestimonialsSection.tsx` (lines: 41, 48)
  - `src\components\home\ValuePropositions.tsx` (lines: 25)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 40)
  - `src\components\job-post\StepBudget.tsx` (lines: 50, 74, 90)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 111, 276, 291, 308)
  - `src\components\job-post\StepVisibility.tsx` (lines: 36, 49)
  - `src\components\layout\Header\SearchModal.tsx` (lines: 242, 268, 275, 301, 329, 351, 353, 364, 366, 388, 399, 401, 402, 428, 453)
  - `src\pages\FreelancerProfile.tsx` (lines: 281, 295)
  - `src\pages\JobBoard.tsx` (lines: 394)
  - `src\pages\JobPost.tsx` (lines: 455)
  - `src\pages\JobPostSuccess.tsx` (lines: 37, 107, 161, 171, 181)
  - `src\pages\SearchResults.tsx` (lines: 188, 191, 224, 329, 379, 444, 446, 447, 449, 450)
  - `src\pages\Wallet.tsx` (lines: 522)

### `--text-muted` → `--color-text-muted`

- **Category**: text
- **Occurrences**: 93
- **Files affected**:
  - `src\App.tsx` (lines: 411)
  - `src\components\common\EmptyState.tsx` (lines: 73)
  - `src\components\common\FileUpload.tsx` (lines: 185, 195, 205)
  - `src\components\dashboard\ProfileRing.tsx` (lines: 40)
  - `src\components\freelancer\profile\AboutSection.tsx` (lines: 10)
  - `src\components\freelancer\profile\PortfolioSection.tsx` (lines: 19, 22)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 58, 105, 168, 177, 186, 195)
  - `src\components\freelancer\profile\ProfileSidebar.tsx` (lines: 55, 74, 88, 92, 96, 100)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 41, 50, 67, 94)
  - `src\components\freelancer\profile\SkillsSection.tsx` (lines: 11)
  - `src\components\home\HeroSection.tsx` (lines: 212, 250, 272)
  - `src\components\home\TestimonialsSection.tsx` (lines: 98)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 94, 141, 148)
  - `src\components\job-post\StepBudget.tsx` (lines: 50, 74, 140, 160, 173)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 125, 133, 138, 141, 177, 186, 191, 194, 230)
  - `src\components\job-post\StepVisibility.tsx` (lines: 36, 49)
  - `src\components\layout\Header\SearchModal.tsx` (lines: 245, 265, 268, 290, 308, 310, 320, 339, 340, 353, 366, 379, 389, 391, 412, 436, 443)
  - `src\components\ui\Input.tsx` (lines: 44)
  - `src\components\ui\Loading.tsx` (lines: 27)
  - `src\index.css` (lines: 720)
  - `src\pages\ClientDashboard.tsx` (lines: 226, 260, 308, 344, 395)
  - `src\pages\FindFreelancers.tsx` (lines: 355, 359, 363, 376, 387, 427, 437, 453, 459, 463)
  - `src\pages\FreelancerDashboard.tsx` (lines: 312, 349, 384, 431, 460, 482)
  - `src\pages\FreelancerProfile.tsx` (lines: 284)
  - `src\pages\JobBoard.tsx` (lines: 304, 373)

### `--text-primary` → `--color-text-primary`

- **Category**: text
- **Occurrences**: 104
- **Files affected**:
  - `src\components\common\EmptyState.tsx` (lines: 69)
  - `src\components\common\FileUpload.tsx` (lines: 182)
  - `src\components\dashboard\DashWidget.tsx` (lines: 48)
  - `src\components\dashboard\ProfileRing.tsx` (lines: 37)
  - `src\components\freelancer\profile\AboutSection.tsx` (lines: 11)
  - `src\components\freelancer\profile\PortfolioSection.tsx` (lines: 20)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 76, 79, 126, 139, 167, 176, 185, 194)
  - `src\components\freelancer\profile\ProfileSidebar.tsx` (lines: 24, 37, 41, 50, 54, 68, 72, 84, 88, 92, 96, 100)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 42, 48, 93)
  - `src\components\freelancer\profile\SkillsSection.tsx` (lines: 12, 19)
  - `src\components\home\CTASection.tsx` (lines: 27, 50)
  - `src\components\home\HeroSection.tsx` (lines: 140, 193, 246, 269, 291)
  - `src\components\home\HowItWorksSection.tsx` (lines: 25, 58)
  - `src\components\home\TestimonialsSection.tsx` (lines: 41, 48)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 57, 79, 87, 144)
  - `src\components\job-post\StepBudget.tsx` (lines: 53, 77, 96, 115, 124, 139, 159, 172)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 133, 162, 186, 214, 280)
  - `src\components\job-post\StepVisibility.tsx` (lines: 39, 52)
  - `src\components\jobs\FilterSidebar.tsx` (lines: 160, 284)
  - `src\components\layout\Header\SearchModal.tsx` (lines: 265, 268, 307, 356, 369, 435)
  - `src\components\ui\Loading.tsx` (lines: 26)
  - `src\components\ui\Logo.tsx` (lines: 132)
  - `src\index.css` (lines: 134, 166, 702, 715)
  - `src\pages\ClientDashboard.tsx` (lines: 203, 223, 257, 305, 341, 392, 421)
  - `src\pages\FindFreelancers.tsx` (lines: 330, 343)
  - `src\pages\FreelancerDashboard.tsx` (lines: 289, 309, 346, 381, 428, 460, 473, 509)
  - `src\pages\FreelancerProfile.tsx` (lines: 285, 361)
  - `src\pages\JobBoard.tsx` (lines: 303, 374)
  - `src\pages\JobPost.tsx` (lines: 471, 556)
  - `src\pages\JobPostSuccess.tsx` (lines: 59, 129, 147, 164, 174, 184)

### `--text-secondary` → `--color-text-secondary`

- **Category**: text
- **Occurrences**: 58
- **Files affected**:
  - `src\components\freelancer\profile\AboutSection.tsx` (lines: 13)
  - `src\components\freelancer\profile\PortfolioSection.tsx` (lines: 54)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 87, 91, 95, 139)
  - `src\components\freelancer\profile\ProfileSidebar.tsx` (lines: 27, 36, 40, 73)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 60, 99, 100, 109)
  - `src\components\freelancer\profile\SkillsSection.tsx` (lines: 28)
  - `src\components\home\CTASection.tsx` (lines: 34)
  - `src\components\home\HeroSection.tsx` (lines: 167)
  - `src\components\home\HowItWorksSection.tsx` (lines: 62)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 60, 82, 144)
  - `src\components\job-post\StepBudget.tsx` (lines: 55, 79, 179, 183, 187)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 146, 199, 258, 262, 291)
  - `src\components\job-post\StepVisibility.tsx` (lines: 41, 54, 68)
  - `src\components\jobs\FilterSidebar.tsx` (lines: 284)
  - `src\components\layout\Header\SearchModal.tsx` (lines: 246, 276, 329, 390)
  - `src\components\ui\Badge.tsx` (lines: 9)
  - `src\components\ui\PaymentModal.tsx` (lines: 152)
  - `src\pages\ClientDashboard.tsx` (lines: 418, 425)
  - `src\pages\FindFreelancers.tsx` (lines: 349)
  - `src\pages\FreelancerDashboard.tsx` (lines: 506, 513)
  - `src\pages\FreelancerProfile.tsx` (lines: 362)
  - `src\pages\JobPost.tsx` (lines: 474, 553, 557)
  - `src\pages\JobPostSuccess.tsx` (lines: 62, 130, 150, 165, 175, 185)
  - `src\pages\Notifications.tsx` (lines: 27)
  - `src\pages\Wallet.tsx` (lines: 537)

### `--workspace-accent` → `--color-brand-accent`

- **Category**: brand
- **Occurrences**: 57
- **Files affected**:
  - `src\components\freelancers\FreelancerCard.tsx` (lines: 73, 74, 98, 111, 112, 173, 187)
  - `src\components\home\CategoriesSection.tsx` (lines: 76, 90, 91)
  - `src\components\home\ValuePropositions.tsx` (lines: 42, 50, 52)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 92)
  - `src\components\layout\Header\index.tsx` (lines: 418, 733, 733, 763)
  - `src\components\onboarding\OnboardingShell.tsx` (lines: 41, 72, 89, 89, 100)
  - `src\components\ui\ErrorBoundary.tsx` (lines: 55)
  - `src\components\ui\FullScreenLoader.tsx` (lines: 16, 21, 37)
  - `src\components\ui\Input.tsx` (lines: 24, 27, 27)
  - `src\index.css` (lines: 652, 653, 656, 657, 658, 670, 671, 676, 677)
  - `src\pages\AuthCallback.tsx` (lines: 192)
  - `src\pages\Login.tsx` (lines: 88, 89)
  - `src\pages\Messages.tsx` (lines: 1222, 1222, 1222)
  - `src\pages\Notifications.tsx` (lines: 23, 23, 24, 24, 28, 28, 89, 90, 102, 105, 118, 118)

### `--workspace-primary` → `--color-brand-primary`

- **Category**: brand
- **Occurrences**: 296
- **Files affected**:
  - `src\App.tsx` (lines: 410)
  - `src\components\auth\LoginForm.tsx` (lines: 78, 199)
  - `src\components\auth\SignupForm.tsx` (lines: 182, 304)
  - `src\components\common\EmptyState.tsx` (lines: 40, 41, 54, 59, 60, 61, 64, 84)
  - `src\components\dashboard\DashWidget.tsx` (lines: 21, 39, 40, 59)
  - `src\components\dashboard\ProfileRing.tsx` (lines: 28)
  - `src\components\freelancer\ContactModal.tsx` (lines: 85, 85)
  - `src\components\freelancer\ProfileCompletionCard.tsx` (lines: 177)
  - `src\components\freelancer\profile\AboutSection.tsx` (lines: 8)
  - `src\components\freelancer\profile\PortfolioSection.tsx` (lines: 16, 49, 50, 51, 52)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 31, 32, 37, 37, 72, 72, 79, 117, 138, 138, 138, 191, 191, 196, 196)
  - `src\components\freelancer\profile\ProfileSidebar.tsx` (lines: 23, 49, 67, 83)
  - `src\components\freelancer\profile\ReviewsSection.tsx` (lines: 39, 63, 104, 105, 106, 107)
  - `src\components\freelancer\profile\SkillsSection.tsx` (lines: 9, 19, 19, 26, 27)
  - `src\components\freelancers\FreelancerCard.tsx` (lines: 115, 128, 129, 130, 172)
  - `src\components\home\CTASection.tsx` (lines: 15, 16, 42)
  - `src\components\home\HeroSection.tsx` (lines: 101, 124, 125, 151, 262, 283, 284)
  - `src\components\home\HowItWorksSection.tsx` (lines: 46, 48, 52)
  - `src\components\home\LiveCounterSection.tsx` (lines: 21, 38)
  - `src\components\home\TestimonialsSection.tsx` (lines: 35, 59, 80, 80, 97)
  - `src\components\job-post\JobWizardLayout.tsx` (lines: 92)
  - `src\components\job-post\StepBudget.tsx` (lines: 18, 19, 20)
  - `src\components\job-post\StepJobBasics.tsx` (lines: 91, 92, 93, 125, 129, 177, 182, 230, 234, 234)
  - `src\components\job-post\StepVisibility.tsx` (lines: 16, 17, 18)
  - `src\components\jobs\FilterSidebar.tsx` (lines: 273, 273, 274)
  - `src\components\layout\Footer.tsx` (lines: 45, 51, 57, 69, 69, 69, 69, 86, 96, 105, 140, 142)
  - `src\components\layout\Header\SearchModal.tsx` (lines: 256, 289, 301, 303, 303, 310, 329, 329, 329, 404, 427, 427, 431, 432, 443)
  - `src\components\layout\Header\index.tsx` (lines: 325, 327, 382, 633, 712, 809, 835)
  - `src\components\navigation\DashboardRedirect.tsx` (lines: 28)
  - `src\components\settings\NotificationSettings.tsx` (lines: 145, 145, 146, 146, 149, 149, 184)
  - `src\components\ui\Badge.tsx` (lines: 13)
  - `src\components\ui\Input.tsx` (lines: 27, 51)
  - `src\components\ui\Loading.tsx` (lines: 20, 20, 33, 34, 34, 36)
  - `src\components\ui\Logo.tsx` (lines: 78)
  - `src\components\ui\PaymentModal.tsx` (lines: 146, 146, 147, 148, 151)
  - `src\index.css` (lines: 40, 86, 98, 254, 256, 320, 321, 325, 709, 933)
  - `src\pages\AdminDashboard.tsx` (lines: 70, 70, 105, 105)
  - `src\pages\ClientDashboard.tsx` (lines: 219, 266, 299, 361)
  - `src\pages\FindFreelancers.tsx` (lines: 305, 305, 311, 335, 339, 339, 339, 345, 376, 376, 387, 387, 409, 412, 430, 430, 430)
  - `src\pages\ForClients.tsx` (lines: 147)
  - `src\pages\FreelancerDashboard.tsx` (lines: 305, 343, 356, 436, 439, 457)
  - `src\pages\JobBoard.tsx` (lines: 117, 118, 118, 322, 323, 384, 404, 404, 418, 418)
  - `src\pages\JobDetail.tsx` (lines: 557, 595, 596, 690, 906, 906, 907)
  - `src\pages\Messages.tsx` (lines: 1510)
  - `src\pages\SearchResults.tsx` (lines: 175, 176, 179, 188, 188, 212, 224, 229, 244, 244, 244, 253, 258, 259, 267, 335, 336, 349, 353, 354, 355, 360, 371, 379, 379, 383, 389, 399, 399, 401, 402, 404, 436, 437, 438, 554, 572, 583, 584, 586, 586, 586, 586, 594, 599, 616, 622, 624, 632, 636, 636, 636, 636, 650)
  - `src\pages\Settings.tsx` (lines: 260, 260, 261, 261, 264, 264, 299, 338, 338, 340, 479)
  - `src\pages\Wallet.tsx` (lines: 535, 535, 536, 561, 561)
  - `src\pages\admin\OverviewTab.tsx` (lines: 40, 120)
  - `src\pages\admin\adminTheme.ts` (lines: 9, 9, 10, 10)
  - `src\styles\colors.css` (lines: 228)

### `--workspace-primary-hover` → `--color-brand-primary-hover`

- **Category**: brand
- **Occurrences**: 12
- **Files affected**:
  - `src\components\auth\LoginForm.tsx` (lines: 199)
  - `src\components\auth\SignupForm.tsx` (lines: 304)
  - `src\components\freelancer\ProfileCompletionCard.tsx` (lines: 177)
  - `src\components\freelancer\profile\ProfileHeader.tsx` (lines: 117)
  - `src\components\layout\Footer.tsx` (lines: 142)
  - `src\index.css` (lines: 282, 284, 933)
  - `src\pages\AdminDashboard.tsx` (lines: 70, 105)
  - `src\pages\ForClients.tsx` (lines: 147)
  - `src\pages\admin\OverviewTab.tsx` (lines: 118)

### `--workspace-primary-light` → `--color-brand-primary-light`

- **Category**: brand
- **Occurrences**: 5
- **Files affected**:
  - `src\components\layout\Header\index.tsx` (lines: 325, 381, 713, 808)
  - `src\pages\JobDetail.tsx` (lines: 595)

### `--workspace-primary-mid` → `--color-brand-primary-mid`

- **Category**: brand
- **Occurrences**: 24
- **Files affected**:
  - `src\components\dashboard\DashWidget.tsx` (lines: 48, 57, 62)
  - `src\components\home\CTASection.tsx` (lines: 21)
  - `src\components\home\HeroSection.tsx` (lines: 126, 151, 211, 288)
  - `src\components\home\HowItWorksSection.tsx` (lines: 19)
  - `src\components\home\LiveCounterSection.tsx` (lines: 38)
  - `src\components\home\TestimonialsSection.tsx` (lines: 97)
  - `src\components\layout\Header\index.tsx` (lines: 807)
  - `src\components\ui\Badge.tsx` (lines: 13)
  - `src\index.css` (lines: 933)
  - `src\pages\ClientDashboard.tsx` (lines: 200, 428)
  - `src\pages\FindFreelancers.tsx` (lines: 345)
  - `src\pages\FreelancerDashboard.tsx` (lines: 286, 516)
  - `src\pages\admin\OverviewTab.tsx` (lines: 119)
  - `src\pages\admin\adminTheme.ts` (lines: 9, 9, 10, 10)

## Undefined Tokens (296)

These tokens are not defined in the design system:

### `--amber-300`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--amber-400`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--amber-50`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--amber-500`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--amber-600`

- **Occurrences**: 10
- **Action**: Review usage and either add to design system or replace with standard token

### `--amber-700`

- **Occurrences**: 5
- **Action**: Review usage and either add to design system or replace with standard token

### `--amber-800`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--border-strong`

- **Occurrences**: 20
- **Action**: Review usage and either add to design system or replace with standard token

### `--brand`

- **Occurrences**: 15
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-bg-secondary`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-border`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-border-default`

- **Occurrences**: 12
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-border-strong`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-border-subtle`

- **Occurrences**: 5
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-error`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-fg`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-fg-muted`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-fg-secondary`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-info`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-success`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-text-primary`

- **Occurrences**: 10
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-text-secondary`

- **Occurrences**: 8
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-text-tertiary`

- **Occurrences**: 9
- **Action**: Review usage and either add to design system or replace with standard token

### `--color-warning`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--cyan-300`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--cyan-500`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--cyan-600`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--dash-border-hover`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--dash-card`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--dash-card-hover`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--elevation-1`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--elevation-2`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--elevation-modal`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--freelancer-accent`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--gradient-primary`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--info-600`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--input-bg`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--input-border`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--motion-base`

- **Occurrences**: 5
- **Action**: Review usage and either add to design system or replace with standard token

### `--motion-ease-standard`

- **Occurrences**: 20
- **Action**: Review usage and either add to design system or replace with standard token

### `--motion-fast`

- **Occurrences**: 15
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-100`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-200`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-300`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-400`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-50`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-500`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-600`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--neutral-900`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--purple-400`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--purple-50`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--purple-500`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--purple-600`

- **Occurrences**: 13
- **Action**: Review usage and either add to design system or replace with standard token

### `--purple-700`

- **Occurrences**: 11
- **Action**: Review usage and either add to design system or replace with standard token

### `--purple-800`

- **Occurrences**: 5
- **Action**: Review usage and either add to design system or replace with standard token

### `--radius-card`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--radius-panel`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--radius-shell`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--shadow-glow`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

### `--shadow-glow-accent`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--shadow-lg`

- **Occurrences**: 3
- **Action**: Review usage and either add to design system or replace with standard token

### `--shadow-md`

- **Occurrences**: 5
- **Action**: Review usage and either add to design system or replace with standard token

### `--shadow-xl`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--success-600`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--text-3xl`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--text-4xl`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--text-5xl`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--text-base`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--text-placeholder`

- **Occurrences**: 8
- **Action**: Review usage and either add to design system or replace with standard token

### `--warning-600`

- **Occurrences**: 4
- **Action**: Review usage and either add to design system or replace with standard token

### `--workspace-primary-rgb`

- **Occurrences**: 1
- **Action**: Review usage and either add to design system or replace with standard token

### `--workspace-primary-shadow`

- **Occurrences**: 7
- **Action**: Review usage and either add to design system or replace with standard token

### `--workspace-primary-text`

- **Occurrences**: 2
- **Action**: Review usage and either add to design system or replace with standard token

## Token Usage Statistics

Top 10 most used tokens:

1. `--workspace-primary` - 296 usage(s)
2. `--brand-accent` - 137 usage(s)
3. `--text-primary` - 104 usage(s)
4. `--text-muted` - 93 usage(s)
5. `--card-bg` - 75 usage(s)
6. `--border` - 67 usage(s)
7. `--color-bg-muted` - 61 usage(s)
8. `--surface-bg` - 60 usage(s)
9. `--text-secondary` - 58 usage(s)
10. `--workspace-accent` - 57 usage(s)

## Recommendations

1. **Standardize naming**: Update all inconsistent token names to follow the `--color-{category}-{variant}` pattern
2. **Remove deprecated tokens**: Replace deprecated tokens with their modern equivalents
3. **Define missing tokens**: Add undefined tokens to the design system or replace with existing tokens
4. **Create migration script**: Consider creating automated migration scripts for high-frequency tokens
