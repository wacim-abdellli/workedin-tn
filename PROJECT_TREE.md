
```text
📁 src/
    📄 App.css (Config/Static)
    📄 App.tsx
    📄 fix.cjs
    📄 fixClient.cjs
    📄 index.css (Config/Static)
    📄 main.tsx
    📁 components/
        📄 ErrorBoundary.tsx [UI Component] -> Exports: [ErrorBoundary]
        📄 ErrorFallback.tsx [UI Component] -> Exports: [ErrorFallback, JobCardErrorFallback]
        📄 README.md (Config/Static)
        📁 admin/
            📄 StatCard.tsx [UI Component] -> Exports: [StatCard]
        📁 auth/
            📄 AuthShell.tsx [UI Component] -> Exports: [AuthShell]
            📄 LoginForm.tsx [UI Component]
            📄 SignupForm.tsx [UI Component]
            📄 index.ts [UI Component]
            📁 __tests__/
                📄 LoginForm.test.tsx [UI Component]
                📄 SignupForm.test.tsx [UI Component]
        📁 chat/
            📄 ChatInputArea.tsx [UI Component] -> Exports: [ChatInputArea]
            📄 ChatSidebar.tsx [UI Component] -> Exports: [ConversationPreview, ChatSidebar]
            📄 ChatThread.tsx [UI Component] -> Exports: [ChatThreadMessage, ChatThread]
            📄 CollapsibleMessageText.tsx [UI Component] -> Exports: [CollapsibleMessageText]
            📄 ContractCompletionBanner.tsx [UI Component] -> Exports: [ContractCompletionBanner]
            📄 ContractContextBar.tsx [UI Component] -> Exports: [ContractContextBarProps, ContractContextBar]
            📄 ConversationListPanel.tsx [UI Component] -> Exports: [ConversationListPanel]
            📄 EscrowFundingBanner.tsx [UI Component] -> Exports: [EscrowFundingBanner]
            📄 ImageLightbox.tsx [UI Component] -> Exports: [ImageLightbox]
            📄 MessageAudioPlayer.tsx [UI Component] -> Exports: [MessageAudioPlayerProps, MessageAudioPlayer]
            📄 MessageBubble.tsx [UI Component] -> Exports: [MessageBubble]
            📄 MessageBubbleItem.tsx [UI Component] -> Exports: [MessageBubbleItem]
        📁 common/
            📄 ComingSoonBanner.tsx [UI Component] -> Exports: [ComingSoonBanner]
            📄 ErrorBoundary.tsx [UI Component] -> Exports: [ErrorBoundary]
            📄 FileUpload.tsx [UI Component] -> Exports: [FileUpload]
            📄 OptimizedImage.tsx [UI Component] -> Exports: [OptimizedImage]
            📄 SEO.tsx [UI Component] -> Exports: [SEO, SEO_CONFIG]
            📄 SkeletonCard.tsx [UI Component] -> Exports: [Skeleton, SkeletonCard]
            📄 SkeletonList.tsx [UI Component] -> Exports: [SkeletonList]
            📄 SkeletonProfile.tsx [UI Component] -> Exports: [SkeletonProfile]
            📄 SkeletonText.tsx [UI Component] -> Exports: [SkeletonText]
            📄 index.ts [UI Component]
        📁 contracts/
            📄 ChatSection.tsx [UI Component] -> Exports: [ChatSection]
            📄 ContractDetailsSidebar.tsx [UI Component] -> Exports: [ContractActivityEvent, ContractDetailsSidebar]
            📄 ContractModals.tsx [UI Component] -> Exports: [RequestChangesModal, OpenDisputeModal, CancelContractModal]
            📄 ContractModalsBundle.tsx [UI Component] -> Exports: [DeliverWorkModal, AcceptAndPayModal, DisputeModal, ReviewModal, ContractWorkspaceModal, DeleteMessageModal]
            📄 ContractWorkspace.jsx [UI Component] -> Exports: [ContractWorkspace]
        📁 dashboard/
            📄 DashWidget.tsx [UI Component] -> Exports: [DashWidget]
            📄 ProfileRing.tsx [UI Component] -> Exports: [ProfileRing]
        📁 freelancer/
            📄 ContactModal.tsx [UI Component] -> Exports: [ContactModal]
            📄 InviteToJobModal.tsx [UI Component] -> Exports: [InviteToJobModal]
            📄 PortfolioModal.tsx [UI Component] -> Exports: [PortfolioSubmitData, PortfolioModal]
            📄 ProfileCompletionCard.tsx [UI Component]
            📁 profile/
                📄 AboutSection.tsx [UI Component] -> Exports: [AboutSection]
                📄 PortfolioSection.tsx [UI Component] -> Exports: [PortfolioSection]
                📄 ProfileHeader.tsx [UI Component] -> Exports: [ProfileHeader]
                📄 ProfileSidebar.tsx [UI Component] -> Exports: [ProfileSidebar]
                📄 ProfileSkeleton.tsx [UI Component] -> Exports: [ProfileSkeleton]
                📄 ReviewsSection.tsx [UI Component] -> Exports: [ReviewsSection]
                📄 SkillsSection.tsx [UI Component] -> Exports: [SkillsSection]
                📄 ToolsSection.tsx [UI Component] -> Exports: [ToolsSection]
        📁 freelancers/
            📄 FilterSidebar.tsx [UI Component] -> Exports: [FilterSidebar]
            📄 FreelancerCard.tsx [UI Component] -> Exports: [Freelancer]
        📁 home/
            📄 CTASection.tsx [UI Component] -> Exports: [CTASection]
            📄 CategoriesSection.tsx [UI Component] -> Exports: [CategoriesSection]
            📄 HeroSection.tsx [UI Component]
            📄 HowItWorksSection.tsx [UI Component] -> Exports: [HowItWorksSection]
            📄 LiveCounterSection.tsx [UI Component] -> Exports: [LiveCounterSection]
            📄 TestimonialsSection.tsx [UI Component] -> Exports: [TestimonialsSection]
            📄 ValuePropositions.tsx [UI Component] -> Exports: [ValuePropositions]
        📁 job-post/
            📄 JobLinksInput.tsx [UI Component] -> Exports: [JobLinksInput]
            📄 JobWizardLayout.tsx [UI Component] -> Exports: [JobWizardLayout]
            📄 StepBudget.tsx [UI Component] -> Exports: [StepBudget]
            📄 StepJobBasics.tsx [UI Component] -> Exports: [StepJobBasics]
            📄 StepReview.tsx [UI Component] -> Exports: [StepReview]
            📄 StepVisibility.tsx [UI Component] -> Exports: [StepVisibility]
        📁 jobs/
            📄 ClientInfoSidebar.tsx [UI Component] -> Exports: [ClientInfoSidebar]
            📄 FilterSidebar.tsx [UI Component] -> Exports: [FilterSidebar]
            📄 JobCard.tsx [UI Component] -> Exports: [JobForCard]
            📄 SimilarJobCard.tsx [UI Component] -> Exports: [SimilarJobCard]
            📄 index.ts [UI Component]
        📁 layout/
            📄 AccountPanel.tsx [UI Component] -> Exports: [AccountPanel]
            📄 Footer.tsx [UI Component]
            📄 MobileNav.tsx [UI Component] -> Exports: [MobileNav]
            📄 SkipLinks.tsx [UI Component] -> Exports: [SkipLinks]
            📄 index.ts [UI Component]
            📁 Header/
                📄 AuthHeader.tsx [UI Component] -> Exports: [AuthHeader]
                📄 DesktopNav.tsx [UI Component] -> Exports: [WorkspaceNav]
                📄 HeaderSearch.tsx [UI Component] -> Exports: [HeaderSearch]
                📄 LanguageMenu.tsx [UI Component] -> Exports: [LanguageMenu]
                📄 MobileHeader.tsx [UI Component] -> Exports: [MobileHeader]
                📄 SearchModal.tsx [UI Component] -> Exports: [SearchModal]
                📄 UserMenu.tsx [UI Component] -> Exports: [UserMenu]
                📄 index.tsx [UI Component] -> Exports: [Header]
        📁 navigation/
            📄 DashboardRedirect.tsx [UI Component] -> Exports: [DashboardRedirect]
            📄 MyJobsRedirect.tsx [UI Component] -> Exports: [MyJobsRedirect]
            📄 SavedRedirect.tsx [UI Component] -> Exports: [SavedRedirect]
        📁 onboarding/
            📄 OnboardingShell.tsx [UI Component] -> Exports: [OnboardingShell]
            📄 OnboardingStep1.tsx [UI Component] -> Exports: [OnboardingStep1]
            📄 OnboardingStep2.tsx [UI Component] -> Exports: [OnboardingStep2]
            📄 OnboardingStep3.tsx [UI Component] -> Exports: [OnboardingStep3]
            📄 OnboardingStep4.tsx [UI Component] -> Exports: [OnboardingStep4]
            📄 ProgressiveOnboarding.tsx [UI Component] -> Exports: [OnboardingRole, FreelancerOnboardingData, ClientOnboardingData, FreelancerOnboarding, ClientOnboarding, ProgressiveOnboarding]
            📄 index.ts [UI Component]
            📄 schemas.ts [UI Component] -> Exports: [optionalPhoneSchema, step1Schema, Step1FormData, step2Schema, Step2FormData, freelancerStep3Schema, FreelancerStep3FormData, clientStep2Schema, ...]
        📁 payment/
            📄 PaymentLogo.tsx [UI Component] -> Exports: [PaymentProviderId, PaymentLogo]
            📄 PaymentMethodCard.tsx [UI Component] -> Exports: [PaymentMethodStatus, PaymentMethodCard]
            📄 PaymentMethodSelector.tsx [UI Component] -> Exports: [PaymentMethodSelectorProps, PaymentMethodSelector]
        📁 payments/
            📄 FundEscrow.tsx [UI Component]
            📄 WalletCard.tsx [UI Component]
            📄 WithdrawalForm.tsx [UI Component]
            📄 index.ts [UI Component]
        📁 profile/
            📄 ProfileActionSidebar.tsx [UI Component] -> Exports: [WorkspaceInfoItem, AvailabilityItem, LanguageItem, EducationItem, CertificationItem, VerificationItem, OwnerQuickAction, PortfolioLink, ...]
            📄 ProfileHero.tsx [UI Component] -> Exports: [ProfileHeroVariant, ProfileHero]
            📄 ProfilePrimitives.tsx [UI Component] -> Exports: [ProfileAccentType, ProfileAvatar, ProfileSectionCard, ProfileSectionHeader, ProfileStatCard, ProfileEmptyState, ProfileInfoHeader, ProfileInfoRow]
            📄 ProfileSection.tsx [UI Component] -> Exports: [ProfileSection, ProfileTag, ProfileEmptySlot]
            📄 ProfileStatBar.tsx [UI Component] -> Exports: [ProfileStat, ProfileStatBar]
        📁 proposals/
            📄 HireCelebrationPane.tsx [UI Component] -> Exports: [HireCelebrationPane]
            📄 JobSummaryCard.tsx [UI Component] -> Exports: [JobEmptyPane]
            📄 ProposalCard.tsx [UI Component]
            📄 ProposalDetailModal.tsx [UI Component] -> Exports: [ProposalDetailPane]
            📄 ProposalFiltersSidebar.tsx [UI Component] -> Exports: [ProposalFilterBar]
            📄 ProposalModal.tsx [UI Component] -> Exports: [ProposalFormData, ProposalModal]
            📄 index.ts [UI Component]
        📁 reviews/
            📄 ReviewDisplay.tsx [UI Component] -> Exports: [ReviewDisplay]
            📄 ReviewModal.tsx [UI Component] -> Exports: [ReviewModal]
            📄 index.ts [UI Component]
        📁 routing/
            📄 AccountStatusGate.tsx [UI Component] -> Exports: [AccountStatusGate]
            📄 AdminRoute.tsx [UI Component] -> Exports: [AdminRoute]
            📄 OnboardingRoute.tsx [UI Component] -> Exports: [OnboardingRoute]
            📄 ProfileRedirect.tsx [UI Component] -> Exports: [ProfileRedirect]
            📄 ProtectedRoute.tsx [UI Component] -> Exports: [ProtectedRoute]
            📄 WorkspaceRoute.tsx [UI Component] -> Exports: [WorkspaceRoute]
            📁 __tests__/
                📄 AccountStatusGate.test.tsx [UI Component]
                📄 workspace-routing.test.tsx [UI Component]
        📁 settings/
            📄 BasicInfoForm.tsx [UI Component] -> Exports: [BasicFormData, buildBasicInitialForm, BasicInfoForm]
            📄 ClientInfoForm.tsx [UI Component] -> Exports: [extractPrefText, mergePrefText, ClientFormData, buildClientInitialForm, ClientInfoForm]
            📄 FreelancerInfoForm.tsx [UI Component] -> Exports: [FreelancerFormData, buildFreelancerInitialForm, FreelancerInfoForm]
            📄 NotificationSettings.tsx [UI Component] -> Exports: [NotificationSettings]
            📄 ProfileSettings.tsx [UI Component] -> Exports: [ProfileSettings]
            📄 ReportButton.tsx [UI Component] -> Exports: [ReportButton]
            📄 SecuritySettings.tsx [UI Component] -> Exports: [SecuritySettings]
            📁 __tests__/
                📄 SecuritySettings.test.tsx [UI Component]
        📁 ui/
            📄 Badge.tsx [UI Component] -> Exports: [Badge]
            📄 Button.tsx [UI Component]
            📄 Checkbox.tsx [UI Component]
            📄 CustomCursor.tsx [UI Component] -> Exports: [CustomCursor]
            📄 CustomSelect.tsx [UI Component]
            📄 EmptyState.tsx [UI Component] -> Exports: [EmptyState]
            📄 ErrorBoundary.tsx [UI Component]
            📄 FileUpload.tsx [UI Component] -> Exports: [FileUpload]
            📄 FullScreenLoader.tsx [UI Component] -> Exports: [FullScreenLoader]
            📄 IconButton.tsx [UI Component] -> Exports: [IconButtonProps]
            📄 Input.tsx [UI Component]
            📄 LOADING_STATES_README.md (Config/Static)
            📄 Loading.tsx [UI Component] -> Exports: [Loading]
            📄 LoadingStates.example.tsx [UI Component] -> Exports: [LoadingStatesExamples]
            📄 Logo.tsx [UI Component] -> Exports: [Logo]
            📄 Modal.tsx [UI Component]
            📄 NotificationBell.tsx [UI Component] -> Exports: [NotificationBell]
            📄 PaymentModal.tsx [UI Component] -> Exports: [PaymentModal]
            📄 ProgressBar.tsx [UI Component] -> Exports: [ProgressBar, IndeterminateProgress]
            📄 Radio.tsx [UI Component]
            📄 RatingStars.tsx [UI Component] -> Exports: [RatingStars]
            📄 RevealOnScroll.tsx [UI Component] -> Exports: [RevealOnScroll]
            📄 Reviews.tsx [UI Component] -> Exports: [ReviewCard, StarRatingInput, ReviewForm, ReviewsSummary]
            📄 RouteProgress.tsx [UI Component] -> Exports: [RouteProgress]
            📄 SanitizedHtml.tsx [UI Component] -> Exports: [SanitizedHtml]
            📄 ScrollToTop.tsx [UI Component] -> Exports: [ScrollToTop]
            📄 Select.tsx [UI Component]
            📄 Skeleton.tsx [UI Component] -> Exports: [Skeleton, SkeletonGroup]
            📄 Spinner.tsx [UI Component] -> Exports: [Spinner]
            📄 StaggerReveal.tsx [UI Component] -> Exports: [StaggerReveal, StaggerItem]
            📄 ThemeToggle.tsx [UI Component]
            📄 Toast.tsx [UI Component] -> Exports: [ToastProvider, useToast]
            📄 Toggle.tsx [UI Component]
            📄 TypewriterText.tsx [UI Component] -> Exports: [TypewriterText]
            📄 index.ts [UI Component]
            📁 __tests__/
                📄 EmptyState.test.tsx [UI Component]
                📄 LoadingComponents.test.tsx [UI Component]
                📄 NotificationBell.test.tsx [UI Component]
                📄 PaymentModal.test.tsx [UI Component]
        📁 verify/
            📄 DocumentUpload.tsx [UI Component] -> Exports: [FileMeta, DocumentUpload]
            📄 VerificationReview.tsx [UI Component] -> Exports: [VerificationReview]
            📄 VerificationStepper.tsx [UI Component] -> Exports: [VerificationStepper]
    📁 config/
        📄 paymentMethods.ts -> Exports: [PaymentMethodConfig, PAYMENT_METHODS]
    📁 contexts/
        📄 AuthContext.tsx [React Context] -> Exports: [AuthProvider, useAuth, useActiveWorkspace]
        📄 NotificationsContext.tsx [React Context] -> Exports: [NotificationsProvider, useNotifications]
        📄 ThemeContext.tsx [React Context] -> Exports: [ThemeProvider, useTheme]
        📄 WorkspaceContext.tsx [React Context] -> Exports: [WorkspaceContext, WorkspaceProvider, useWorkspace]
        📁 __tests__/
            📄 AuthContext.test.tsx [React Context]
            📄 ThemeContext.test.tsx [React Context]
    📁 hooks/
        📄 README.md (Config/Static)
        📄 index.ts [Custom Hook]
        📄 useAdminData.ts [Custom Hook] -> Exports: [useAdminStats, useAdminVerifications, useAdminDisputes, useAdminPayments, useAdminRefresh]
        📄 useAnimatedCounter.ts [Custom Hook] -> Exports: [useAnimatedCounter]
        📄 useAudioRecorder.ts [Custom Hook] -> Exports: [useAudioRecorder]
        📄 useAuthRateLimit.ts [Custom Hook] -> Exports: [useAuthRateLimit]
        📄 useAuthRealtime.ts [Custom Hook] -> Exports: [useAuthRealtime]
        📄 useAutosave.tsx [Custom Hook] -> Exports: [useAutosave]
        📄 useContractState.ts [Custom Hook] -> Exports: [useContractState]
        📄 useDebounce.ts [Custom Hook] -> Exports: [useDebounce]
        📄 useFileUpload.ts [Custom Hook] -> Exports: [useFileUpload, getFileIcon, formatFileSize]
        📄 useInfiniteScroll.ts [Custom Hook] -> Exports: [useInfiniteScroll]
        📄 useMediaQuery.ts [Custom Hook] -> Exports: [useMediaQuery]
        📄 usePresence.ts [Custom Hook] -> Exports: [usePresence]
        📄 useReadReceipts.ts [Custom Hook] -> Exports: [useReadReceipts]
        📄 useRealtimeChat.ts [Custom Hook] -> Exports: [useRealtimeChat]
        📄 useRealtimeNotifications.ts [Custom Hook] -> Exports: [AppNotification, NOTIFICATIONS_QUERY_KEY, useRealtimeNotifications]
        📄 useRouteFocus.ts [Custom Hook] -> Exports: [useRouteFocus]
        📄 useScrollReveal.ts [Custom Hook] -> Exports: [useScrollReveal]
        📄 useSessionTimeout.ts [Custom Hook] -> Exports: [useSessionTimeout]
        📄 useTypingIndicator.ts [Custom Hook] -> Exports: [useTypingIndicator]
        📄 useVoiceRecording.ts [Custom Hook] -> Exports: [useVoiceRecording]
        📁 __tests__/
            📄 miscHooks.test.tsx [Custom Hook]
            📄 useAdminData.test.tsx [Custom Hook]
            📄 useAuth.test.tsx [Custom Hook]
            📄 useAuthRateLimit.test.tsx [Custom Hook]
            📄 useContractState.test.tsx [Custom Hook]
            📄 useDebounce.test.ts [Custom Hook]
            📄 useFileUpload.test.tsx [Custom Hook]
            📄 useInfiniteScroll.test.ts [Custom Hook]
            📄 useMediaQuery.test.ts [Custom Hook]
            📄 useRealtimeChat.test.tsx [Custom Hook]
            📄 useRealtimeNotifications.test.tsx [Custom Hook]
            📄 useSessionTimeout.test.tsx [Custom Hook]
            📄 useVoiceRecording.test.tsx [Custom Hook]
    📁 i18n/
        📄 ar.ts -> Exports: [ar, Translations]
        📄 en.ts -> Exports: [en]
        📄 fr.ts -> Exports: [fr]
        📄 index.tsx -> Exports: [I18nProvider, useTranslation]
    📁 lib/
        📄 README.md (Config/Static)
        📄 adminAccess.ts [Service/Utility] -> Exports: [hasAdminAccess]
        📄 analytics.ts [Service/Utility] -> Exports: [AnalyticsProperties, initAnalytics, trackEvent, trackPageView]
        📄 audioProcessing.ts [Service/Utility] -> Exports: [fileToBase64, base64ToFile, blobToBase64, normalizeMimeType, canonicalizeVoiceMimeType, getAudioExtensionFromMimeType, buildVoiceMemoFile, hasSignature, ...]
        📄 authUtils.ts [Service/Utility] -> Exports: [clearAllAuthData, hardLogout, hasLingeringAuthTokens]
        📄 avatar.ts [Service/Utility] -> Exports: [getAvatarGradient, getInitials, resolveAccountAvatarUrl]
        📄 colors.ts [Service/Utility] -> Exports: [colors, ThemePalette]
        📄 contractChatSafety.ts [Service/Utility] -> Exports: [ContractChatSafetyCategory, ContractChatSafetyResult, detectContractChatSafetyRisk]
        📄 contractConversationInbox.ts [Service/Utility] -> Exports: [ResolvedContractInbox, ConversationInboxValue, ContractConversationInboxRow, resolveContractConversationInboxPatch]
        📄 contractEvidence.ts [Service/Utility] -> Exports: [isProtectedContractEvidenceMessage]
        📄 contractWorkflow.ts [Service/Utility] -> Exports: [CONTRACT_TRANSITIONS, canTransitionContractStatus, hasRecordedDeliveryEvidence, getStatusAfterDelivery, canFreelancerDeliverForStatus, canClientAcceptForStatus, canClientRequestChangesForStatus, canOpenDisputeForStatus]
        📄 currencyUtils.ts [Service/Utility] -> Exports: [formatCurrency, formatCurrencyCompact, tndToMillimes, millimesToTnd, calculatePlatformFee, calculateTotalWithFee, calculateNetAfterFee, validateWithdrawalAmount, ...]
        📄 dashboardQueries.ts [Service/Utility] -> Exports: [dashboardQueryKeys]
        📄 email.ts [Service/Utility]
        📄 errorMessage.ts [Service/Utility] -> Exports: [getErrorMessage]
        📄 flouci.ts [Service/Utility] -> Exports: [isFlouciConfigured, getFlouciStatus]
        📄 governorates.ts [Service/Utility] -> Exports: [localizeGovernorate, getLocalizedGovernorateOptions]
        📄 healthCheck.ts [Service/Utility] -> Exports: [HealthStatus]
        📄 identityNotificationCopy.ts [Service/Utility] -> Exports: [IdentityNotificationLanguage, IdentityNotificationKind, normalizeIdentityNotificationLanguage, getIdentityNotificationCopy]
        📄 jobCategories.ts [Service/Utility] -> Exports: [JobSubcategory, JobCategory, JOB_CATEGORIES, getLocalizedLabel, getJobCategories, getCategoryName, getSubcategoryName]
        📄 jobLinks.ts [Service/Utility] -> Exports: [JobLinkPlatform, JobReferenceLinkMeta, normalizeJobReferenceLink, isValidJobReferenceLink, sanitizeJobReferenceLinks, detectJobLinkPlatform, getJobReferenceLinkMeta, isMissingJobReferenceLinksColumnError]
        📄 logger.ts [Service/Utility] -> Exports: [logger]
        📄 marketplaceAccess.ts [Service/Utility] -> Exports: [AccessReason, MarketplaceUserState, AccessDecision, getMarketplaceUserState, canSaveJob, canSaveFreelancer, canApplyToJob, canPublishJob, ...]
        📄 messageReplies.ts [Service/Utility] -> Exports: [ReplyMetadata, parseReplyMetadataFromContent, serializeReplyMetadataIntoContent]
        📄 messageUtils.ts [Service/Utility] -> Exports: [MessageAttachment, ThreadMessage, ContractSystemMessageKind, MESSAGE_ATTACHMENT_ACCEPT, TERMINAL_STATUSES, isImageAttachment, isAudioAttachment, formatAttachmentSize, ...]
        📄 messagingLifecycle.ts [Service/Utility] -> Exports: [ContractMessagingStatus, MessagingConversationKind, MessagingPolicyTone, MessagingLifecyclePolicy, normalizeContractStatus, resolveMessagingLifecyclePolicy]
        📄 notificationDisplay.ts [Service/Utility] -> Exports: [getDisplayNotification]
        📄 phone.ts [Service/Utility] -> Exports: [sanitizePhoneInput, normalizePhoneNumber, isValidOptionalPhone, normalizeOptionalPhone]
        📄 portfolioMedia.ts [Service/Utility] -> Exports: [resolvePortfolioMediaUrl, getPortfolioImageUrl, normalizePortfolioMediaFields]
        📄 portfolioTools.ts [Service/Utility] -> Exports: [LEGACY_PORTFOLIO_TOOL_PREFIX, normalizePortfolioTextArray, splitPortfolioSkillsAndTools, composePortfolioSkillsFallback]
        📄 profileCompletion.ts [Service/Utility] -> Exports: [CompletionStep, ProfileCompletionResult, calculateFreelancerProfileCompletion, calculateClientProfileCompletion]
        📄 profileHydrationUtils.ts [Service/Utility] -> Exports: [PROFILES_UPDATE_MAX_RETRIES, getErrorMessageText, extractMissingProfilesColumn]
        📄 queryClient.ts [Service/Utility] -> Exports: [queryClient]
        📄 routes.ts [Service/Utility] -> Exports: [ROUTES, getClientJobProposalsRoute, getJobDetailRoute, getJobEditRoute, getContractWorkspaceRoute]
        📄 sanitization.ts [Service/Utility] -> Exports: [SanitizationPolicy, sanitizeHtml, sanitizeText]
        📄 schemaValidation.ts [Service/Utility] -> Exports: [sanitizeProfileData, sanitizeFreelancerProfileData, isValidProfileField, isBlockedField]
        📄 sentry.ts [Service/Utility] -> Exports: [initSentry, captureError]
        📄 supabase.ts [Service/Utility] -> Exports: [supabaseAnon, supabase, isMissingStorageBucketError, isStoragePermissionError, getStorageConfigErrorMessage, getCurrentUser, getUserProfile, getFreelancerProfile, ...]
        📄 supabaseWithRetry.ts [Service/Utility]
        📄 switchWorkspace.ts [Service/Utility]
        📄 uploadPolicy.ts [Service/Utility] -> Exports: [UploadPolicy, UploadValidationResult, UPLOAD_POLICIES, getUploadPolicy, getFileExtension, sanitizePathSegment, getRawStoragePathSegments, validateUploadSelection, ...]
        📄 utils.ts [Service/Utility] -> Exports: [cn]
        📄 validateEnv.ts [Service/Utility] -> Exports: [AppEnv, validateEnv, getOptionalEnv]
        📄 verificationStatus.ts [Service/Utility] -> Exports: [VerificationStatus, VerificationState, subscribeToVerificationChanges, subscribeToPendingQueue]
        📄 workspaceRoutes.ts [Service/Utility] -> Exports: [Workspace, persistUserTypeSelectionMarker, shouldRequireUserTypeSelection, getWorkspaceCapabilities, promoteUserTypeForWorkspace, getInitialWorkspace, resolveActiveWorkspace, getWorkspaceDashboardPath, ...]
        📄 workspaceState.ts [Service/Utility] -> Exports: [Workspace, getPersistedSupabaseUserId, saveWorkspaceForUser, loadWorkspaceForUser, useWorkspaceStore, clearWorkspaceForUser]
        📁 __tests__/
            📄 adminAccess.test.ts [Service/Utility]
            📄 avatar.test.ts [Service/Utility]
            📄 contractChatSafety.test.ts [Service/Utility]
            📄 currency.authUtils.test.ts [Service/Utility]
            📄 dashboardQueries.test.ts [Service/Utility]
            📄 env.integrations.test.ts [Service/Utility]
            📄 marketplaceAccess.test.ts [Service/Utility]
            📄 messagingLifecycle.test.ts [Service/Utility]
            📄 phone.test.ts [Service/Utility]
            📄 profile.schema.utils.test.ts [Service/Utility]
            📄 queryClient.test.ts [Service/Utility]
            📄 sanitization.test.tsx [Service/Utility]
            📄 supabase.test.ts [Service/Utility]
            📄 uploadPolicy.test.ts [Service/Utility]
        📁 constants/
            📄 profileOptions.ts [Service/Utility] -> Exports: [TOOL_OPTIONS, INDUSTRY_OPTIONS]
    📁 pages/
        📄 AdminDashboard.tsx [Page View] -> Exports: [AdminDashboard]
        📄 AuthCallback.tsx [Page View]
        📄 ClientDashboard.tsx [Page View]
        📄 ClientJobs.tsx [Page View] -> Exports: [ClientJobs]
        📄 ClientOnboarding.tsx [Page View]
        📄 ClientProfile.tsx [Page View] -> Exports: [ClientProfile]
        📄 ContractWorkspace.tsx [Page View] -> Exports: [ContractWorkspace]
        📄 ContractWorkspacePage.tsx [Page View] -> Exports: [ContractWorkspacePage]
        📄 ContractsList.tsx [Page View] -> Exports: [ContractsList]
        📄 EditJob.tsx [Page View] -> Exports: [EditJob]
        📄 FAQ.tsx [Page View] -> Exports: [FAQ]
        📄 FindFreelancers.tsx [Page View] -> Exports: [FindFreelancers]
        📄 ForClients.tsx [Page View]
        📄 ForgotPassword.tsx [Page View]
        📄 FreelancerDashboard.tsx [Page View]
        📄 FreelancerEarnings.tsx [Page View] -> Exports: [FreelancerEarnings]
        📄 FreelancerOnboarding.tsx [Page View]
        📄 FreelancerProfile.tsx [Page View] -> Exports: [FreelancerProfile]
        📄 Home.tsx [Page View]
        📄 HowItWorks.tsx [Page View]
        📄 JobBoard.tsx [Page View]
        📄 JobDetail.tsx [Page View]
        📄 JobMatches.tsx [Page View] -> Exports: [computeMatchScore]
        📄 JobPost.tsx [Page View] -> Exports: [JobPost]
        📄 JobPostSuccess.tsx [Page View] -> Exports: [JobPostSuccess]
        📄 JobProposals.tsx [Page View] -> Exports: [JobProposals]
        📄 LeaveReview.tsx [Page View] -> Exports: [LeaveReview]
        📄 Login.tsx [Page View]
        📄 Messages.tsx [Page View] -> Exports: [Messages]
        📄 MyProposals.tsx [Page View] -> Exports: [MyProposals]
        📄 NotFound.tsx [Page View] -> Exports: [NotFound]
        📄 Notifications.tsx [Page View] -> Exports: [Notifications]
        📄 PaymentFailed.tsx [Page View]
        📄 PaymentSuccess.tsx [Page View]
        📄 PortfolioDashboard.tsx [Page View] -> Exports: [PortfolioDashboard]
        📄 Privacy.tsx [Page View] -> Exports: [Privacy]
        📄 ResetPassword.tsx [Page View]
        📄 SavedJobs.tsx [Page View] -> Exports: [SavedItems, SavedJobsPage]
        📄 SearchResults.tsx [Page View] -> Exports: [SearchResults]
        📄 Settings.tsx [Page View] -> Exports: [Settings]
        📄 Signup.tsx [Page View]
        📄 Terms.tsx [Page View] -> Exports: [Terms]
        📄 VerifyEmail.tsx [Page View]
        📄 VerifyIdentity.tsx [Page View] -> Exports: [VerifyIdentity]
        📄 Wallet.tsx [Page View] -> Exports: [Wallet]
        📁 __tests__/
            📄 ClientProfile.test.tsx [Page View]
            📄 ContractWorkspace.test.tsx [Page View]
            📄 FindFreelancers.test.tsx [Page View]
            📄 FreelancerProfile.test.tsx [Page View]
            📄 Home.test.tsx [Page View]
            📄 JobBoard.test.tsx [Page View]
            📄 JobDetail.test.tsx [Page View]
            📄 JobMatches.logic.test.ts [Page View]
            📄 JobProposals.test.tsx [Page View]
            📄 Messages.lifecycle.test.tsx [Page View]
            📄 Wallet.test.tsx [Page View]
        📁 admin/
            📄 AdminSelect.tsx [Page View] -> Exports: [AdminSelect]
            📄 DisputesTab.tsx [Page View] -> Exports: [DisputesTab]
            📄 JobsTab.tsx [Page View] -> Exports: [ADMIN_JOBS_QUERY_KEY, JobsTab]
            📄 OverviewTab.tsx [Page View] -> Exports: [OverviewTab]
            📄 PaymentsTab.tsx [Page View] -> Exports: [PaymentsTab]
            📄 ReportsTab.tsx [Page View] -> Exports: [ADMIN_REPORTS_QUERY_KEY, ReportsTab]
            📄 SettingsTab.tsx [Page View] -> Exports: [SettingsTab]
            📄 UsersTab.tsx [Page View] -> Exports: [ADMIN_USERS_QUERY_KEY, UsersTab]
            📄 VerificationQueue.tsx [Page View] -> Exports: [VerificationQueue]
            📄 VerificationsTab.tsx [Page View] -> Exports: [VerificationsTab]
            📄 adminTheme.ts [Page View] -> Exports: [adminPanelClass, adminToolbarClass, adminTableShellClass, adminTableHeadClass, adminTableRowClass, adminInsetClass, adminInputClass, adminSelectClass, ...]
    📁 routes/
        📄 accountRoutes.tsx -> Exports: [accountRoutes]
        📄 adminRoutes.tsx -> Exports: [adminRoutes]
        📄 contractRoutes.tsx -> Exports: [contractRoutes]
        📄 index.tsx -> Exports: [appRoutes, appRouteGraph]
        📄 onboardingRoutes.tsx -> Exports: [onboardingRoutes]
        📄 publicRoutes.tsx -> Exports: [publicRoutes]
        📄 routeDefinitions.tsx -> Exports: [RouteSection, RouteGuard, AppRouteDefinition, defineRoute, withErrorBoundary, withProtected, withWorkspace, withOnboarding, ...]
        📄 workspaceRoutes.tsx -> Exports: [workspaceRoutes]
        📁 __tests__/
            📄 routeGraph.test.ts [Test Script]
            📁 __snapshots__/
    📁 services/
        📄 contracts.ts
        📄 dhmad.ts -> Exports: [DhmadEscrowRequest, DhmadEscrowResponse, DhmadReleaseResponse, DhmadRefundResponse, DhmadCheckoutAction, DhmadCheckoutSession]
        📄 index.ts
        📄 jobs.ts -> Exports: [JobFilters, CreateJobInput]
        📄 messages.ts -> Exports: [ConversationScope, Conversation, Message, subscribeToConversation, subscribeToIncomingMessages, subscribeToConversations, subscribeToMessages]
        📄 notifications.ts -> Exports: [createNotification, subscribeToNotifications]
        📄 payments.ts -> Exports: [PaymentMethodRow, getPaymentMethodLabel, getPaymentMethodDetails, buildPaymentMethodInsert, getPaymentMethods, addPaymentMethod]
        📄 profiles.ts
        📄 proposals.ts -> Exports: [DAILY_PROPOSAL_LIMIT, CreateProposalInput, DailyProposalUsage]
        📄 reports.ts -> Exports: [ReportStatus, ReportedType, Report]
        📄 reviews.ts
        📁 __tests__/
            📄 contracts.profiles.payments.test.ts [Test Script]
            📄 jobs.proposals.test.ts [Test Script]
            📄 messages.test.ts [Test Script]
            📄 notifications.test.ts [Test Script]
            📄 reports.test.ts [Test Script]
    📁 styles/
        📄 colors-new.css (Config/Static)
        📄 colors.css (Config/Static)
        📄 design-tokens.css (Config/Static)
    📁 test/
        📄 infrastructure.test.ts [Test Script]
        📄 services.test.ts [Test Script]
        📄 setup.ts
        📄 utils.tsx -> Exports: [createMockUser, createMockProfile, createMockJob, createMockProposal, createMockConversation, waitForElementToBeRemoved, hasArabicText]
        📁 mocks/
            📄 supabase.ts -> Exports: [setMockData, setMockError, setMockUser, resetMocks, mockSupabaseClient, mockWithTimeout, mockUploadFile, createSupabaseMock]
    📁 types/
        📄 README.md (Config/Static)
        📄 admin.ts [Type Defs] -> Exports: [AdminUserMode, AdminAccountStatus, AdminUserRow, AdminUser, AdminJobClientRow, AdminJobRow, AdminJob, IdentityVerificationStatus, ...]
        📄 chat.ts [Type Defs] -> Exports: [ChatMessage, ChatAttachment, TypingState, ChatParticipant, UseRealtimeChatReturn, MessageRealtimePayload, ContractStatusPayload]
        📄 filters.ts [Type Defs] -> Exports: [JobFilters, FreelancerFilters, FilterSidebarFilters, AdminTab, LucideIconType, StatCardProps, AdminTabDefinition]
        📄 freelancer.ts [Type Defs] -> Exports: [FreelancerUsernameLookupRow, FreelancerSkillValue, FreelancerProfileOwnerRow, FreelancerProfilePublicRow, PortfolioItemRow, FreelancerReviewRow, FreelancerData]
        📄 index.ts [Type Defs] -> Exports: [UserType, AccountMode, AccountStatus, Language, JobStatus, MatchStatus, ContractStatus, PaymentStatus, ...]
        📄 payment.ts [Type Defs] -> Exports: [TransactionType, TransactionStatus, WithdrawalStatus, WithdrawalMethod, PaymentMethodType, PaymentDetails, Wallet, Transaction, ...]
        📄 proposal.ts [Type Defs] -> Exports: [ProposalStatus, ProposalAttachment, ProposalFreelancer, Proposal, ProposalFilters, JobStats, JobSummary, ExtendedFreelancerData, ...]
📁 scripts/
    📄 README.md (Config/Static)
    📄 audit-pages-i18n.mjs [Automation Script]
    📄 check-avatar-consistency.mjs [Automation Script]
    📄 check-bundle-budgets.mjs [Automation Script]
    📄 check-design-token-compliance.mjs [Automation Script]
    📄 check-freelancers.cjs [Automation Script]
    📄 dependency-audit.mjs [Automation Script]
    📄 execute_rebrand.cjs [Automation Script]
    📄 extract_contracts.cjs [Automation Script]
    📄 find-all-hardcoded-strings.mjs [Automation Script]
    📄 fix-dark-mode-better.cjs [Automation Script]
    📄 fix-dark-mode-final.cjs [Automation Script]
    📄 fix-dark-mode.cjs [Automation Script]
    📄 fix_i18n.cjs [Automation Script]
    📄 generate_page_audit.js [Automation Script]
    📄 i18n-audit.mjs [Automation Script]
    📄 release-control.mjs [Automation Script]
    📄 setup-e2e-test-accounts.mjs [Test Script]
    📄 test-join.mjs [Test Script]
    📄 update-e2e-test-accounts.mjs [Test Script]
    📄 verify-security-headers.mjs [Automation Script]
    📁 temp_tools/
📁 e2e/
    📄 EXAMPLES.md (Config/Static)
    📄 PRE_TEST_CHECKLIST.md (Config/Static)
    📄 QUICK_START.md (Config/Static)
    📄 README.md (Config/Static)
    📄 TEST_ARCHITECTURE.md (Config/Static)
    📄 a11y-matrix.spec.ts [Test Script]
    📄 auth-protection-a11y.spec.ts [Test Script]
    📄 auth.setup.ts [Test Script]
    📄 auth.spec.ts [Test Script]
    📄 job-post.spec.ts [Test Script]
    📄 payment-flow.spec.ts [Test Script]
    📄 proposal.spec.ts [Test Script]
    📄 routing-matrix.spec.ts [Test Script]
    📄 secure-upload.live-smoke.spec.ts [Test Script]
    📄 setup-test-users.md (Config/Static)
    📄 ui-audit.temp.spec.ts [Test Script]
    📄 visual-regression.spec.ts [Test Script]
    📄 wallet.spec.ts [Test Script]
    📁 fixtures/
        📄 auth.ts [Test Script] -> Exports: [TEST_USERS, test]
        📄 test-data.ts [Test Script] -> Exports: [createJobData, createProposalData, createWithdrawalData, JobTestData, ProposalTestData, WithdrawalTestData, SELECTORS, WAIT_TIMES, ...]
    📁 support/
        📄 roleStateMocks.ts [Test Script] -> Exports: [BASE_URL, FIXED_NOW, DESKTOP_VIEWPORT, TableFixture, TableFixtures, buildProfile, buildFreelancerFixtures, buildClientFixtures]
    📁 visual-regression.spec.ts-snapshots/
📁 design-system/
    📄 IMPLEMENTATION_STATUS.md (Config/Static)
    📄 IMPLEMENTATION_SUMMARY.md (Config/Static)
    📄 README.md (Config/Static)
    📄 TAILWIND_UTILITIES.md (Config/Static)
    📄 TASK_2.2_IMPLEMENTATION_SUMMARY.md (Config/Static)
    📁 docs/
        📄 IMPLEMENTATION_SUMMARY.md (Config/Static)
        📄 README.md (Config/Static)
        📄 package-lock.json (Config/Static)
        📄 package.json (Config/Static)
        📄 postcss.config.js
        📄 tailwind.config.js
        📄 tsconfig.json (Config/Static)
        📄 tsconfig.node.json (Config/Static)
        📄 vite.config.ts
        📁 src/
            📄 App.tsx
            📄 index.css (Config/Static)
            📄 main.tsx
            📁 components/
                📄 CodeBlock.tsx [UI Component] -> Exports: [CodeBlock]
                📄 DocLayout.tsx [UI Component] -> Exports: [DocLayout]
                📄 Header.tsx [UI Component] -> Exports: [Header]
                📄 Navigation.tsx [UI Component] -> Exports: [Navigation]
            📁 pages/
                📄 GettingStarted.tsx [Page View] -> Exports: [GettingStarted]
                📁 components/
                    📄 BadgeDocs.tsx [UI Component] -> Exports: [BadgeDocs]
                    📄 ButtonDocs.tsx [UI Component] -> Exports: [ButtonDocs]
                    📄 InputDocs.tsx [UI Component] -> Exports: [InputDocs]
                    📄 LoadingDocs.tsx [UI Component] -> Exports: [LoadingDocs]
                    📄 ModalDocs.tsx [UI Component] -> Exports: [ModalDocs]
                    📄 ToastDocs.tsx [UI Component] -> Exports: [ToastDocs]
                📁 foundations/
                    📄 Animations.tsx [Page View] -> Exports: [Animations]
                    📄 Colors.tsx [Page View] -> Exports: [Colors]
                    📄 Shadows.tsx [Page View] -> Exports: [Shadows]
                    📄 Spacing.tsx [Page View] -> Exports: [Spacing]
                    📄 Typography.tsx [Page View] -> Exports: [Typography]
                📁 patterns/
                    📄 LayoutPatterns.tsx [Page View] -> Exports: [LayoutPatterns]
                📁 resources/
                    📄 Changelog.tsx [Page View] -> Exports: [Changelog]
                    📄 MigrationGuide.tsx [Page View] -> Exports: [MigrationGuide]
    📁 scripts/
        📄 IMPLEMENTATION_SUMMARY.md (Config/Static)
        📄 MIGRATION_GUIDE.md (Config/Static)
        📄 README.md (Config/Static)
        📄 TEST_SUMMARY.md (Config/Static)
        📄 audit-tokens.js [Automation Script]
        📄 audit-tokens.test.js [Test Script]
        📄 check-token-compliance.test.js [Test Script]
        📄 migrate-colors.js [Automation Script]
        📄 migrate-colors.test.js [Test Script]
    📁 tokens/
        📄 animations.json (Config/Static)
        📄 colors.json (Config/Static)
        📄 radii.json (Config/Static)
        📄 shadows.json (Config/Static)
        📄 spacing.json (Config/Static)
        📄 typography.json (Config/Static)
📁 supabase/
    📁 functions/
        📁 admin-user-control/
            📄 index.ts [DB Script]
        📁 cron-process-timeouts/
            📄 index.ts [DB Script]
        📁 dhmad-checkout-session/
            📄 index.ts [DB Script]
        📁 dhmad-create-escrow/
            📄 index.ts [DB Script]
        📁 dhmad-get-escrow-status/
            📄 index.ts [DB Script]
        📁 dhmad-refund-escrow/
            📄 index.ts [DB Script]
        📁 dhmad-release-escrow/
            📄 index.ts [DB Script]
        📁 dhmad-webhook/
            📄 index.ts [DB Script]
        📁 flouci-initiate-payment/
            📄 index.ts [DB Script]
        📁 flouci-verify-payment/
            📄 index.ts [DB Script]
        📁 hire-proposal-fallback/
            📄 index.ts [DB Script]
        📁 reconcile-payment/
            📄 index.ts [DB Script]
        📁 secure-upload/
            📄 index.ts [DB Script]
        📁 send-email/
            📄 index.ts [DB Script]
    📁 migrations/
```

### Core Configuration Files
- `MASTER_BUG_FIX_PLAN.md`
- `PROJECT_MAP.md`
- `README.md`
- `TODO.md`
- `eslint.config.js`
- `eslint.json`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `postcss.config.js`
- `tailwind.config.js`
- `tsconfig.app.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vercel.json`
- `vite.config.ts`
- `vitest.config.ts`
