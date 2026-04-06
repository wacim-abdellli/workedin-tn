import { logger } from "@/lib/logger";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  User,
  Wallet,
} from "lucide-react";

import { useTranslation } from "../i18n";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { Header } from "../components/layout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import SEO, { SEO_CONFIG } from "../components/common/SEO";
import ProfileSettings from "../components/settings/ProfileSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import SecuritySettings from "../components/settings/SecuritySettings";

type SettingsTab =
  | "account"
  | "profile"
  | "notifications"
  | "payment"
  | "security";

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  details: string;
  is_default: boolean;
}

function Settings() {
  const { dir, t, tx } = useTranslation();
  const { user, profile, activeMode, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const tabs = useMemo(
    () => [
      {
        id: "account" as SettingsTab,
        label: t.settings.account,
        icon: BriefcaseBusiness,
        description: tx(
          "settings.tabDescriptions.account",
          undefined,
          "Workspace mode, account overview, and setup guidance.",
        ),
      },
      {
        id: "profile" as SettingsTab,
        label: t.settings.profile,
        icon: User,
        description: tx(
          "settings.tabDescriptions.profile",
          undefined,
          "Identity, bio, avatar, and workspace readiness.",
        ),
      },
      {
        id: "notifications" as SettingsTab,
        label: t.settings.notifications,
        icon: Bell,
        description: tx(
          "settings.tabDescriptions.notifications",
          undefined,
          "Choose what reaches you and how often.",
        ),
      },
      {
        id: "payment" as SettingsTab,
        label: t.settings.payment,
        icon: CreditCard,
        description: tx(
          "settings.tabDescriptions.payment",
          undefined,
          "Payout methods, defaults, and transaction-ready details.",
        ),
      },
      {
        id: "security" as SettingsTab,
        label: t.settings.privacy,
        icon: Shield,
        description: tx(
          "settings.tabDescriptions.security",
          undefined,
          "Session control, account safety, and destructive actions.",
        ),
      },
    ],
    [
      t.settings.account,
      t.settings.notifications,
      t.settings.payment,
      t.settings.privacy,
      t.settings.profile,
      tx,
    ],
  );

  useEffect(() => {
    const targetTab = tab || searchParams.get("tab");
    if (targetTab && tabs.some((item) => item.id === targetTab)) {
      setActiveTab(targetTab as SettingsTab);
    }
  }, [searchParams, tab, tabs]);

  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newPaymentForm, setNewPaymentForm] = useState({
    type: "d17",
    details: "",
  });

  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);

    void (async () => {
      try {
        const { data } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (data?.length) {
          setPaymentMethods(
            data.map((payment) => ({
              id: payment.id,
              type: payment.type,
              label:
                payment.type === "d17"
                  ? "D17"
                  : payment.type === "flouci"
                    ? "Flouci"
                    : tx("settings.bankTransfer", undefined, "Bank transfer"),
              details: payment.details,
              is_default: payment.is_default,
            })),
          );
        }
      } catch (error: unknown) {
        logger.error("Error loading payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tx, user?.id]);

  const handleSetDefaultPayment = async (id: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
      setPaymentMethods((prev) =>
        prev.map((payment) => ({ ...payment, is_default: payment.id === id })),
      );
      showToast(
        tx(
          "settings.toasts.defaultPaymentUpdated",
          undefined,
          "Default payment method updated",
        ),
        "success",
      );
    } catch (error) {
      logger.error("Error setting default payment:", error);
      showToast(
        tx("settings.toasts.genericError", undefined, "Something went wrong"),
        "error",
      );
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setPaymentMethods((prev) => prev.filter((payment) => payment.id !== id));
      showToast(
        tx(
          "settings.toasts.paymentDeleted",
          undefined,
          "Payment method deleted",
        ),
        "success",
      );
    } catch (error) {
      logger.error("Error deleting payment method:", error);
      showToast(
        tx(
          "settings.toasts.paymentDeleteError",
          undefined,
          "Failed to delete payment method",
        ),
        "error",
      );
    }
  };

  const handleAddPayment = async () => {
    if (!user?.id || !newPaymentForm.details) return;

    setIsSavingPayment(true);

    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          type: newPaymentForm.type,
          details: newPaymentForm.details,
          is_default: paymentMethods.length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      setPaymentMethods((prev) => [
        ...prev,
        {
          id: data.id,
          type: data.type,
          label:
            data.type === "d17"
              ? "D17"
              : data.type === "flouci"
                ? "Flouci"
                : tx("settings.bankTransfer", undefined, "Bank transfer"),
          details: data.details,
          is_default: data.is_default,
        },
      ]);

      setNewPaymentForm({ type: "d17", details: "" });
      setIsAddPaymentModalOpen(false);
      showToast(
        tx("settings.toasts.paymentAdded", undefined, "Payment method added"),
        "success",
      );
    } catch (error) {
      logger.error("Error adding payment method:", error);
      showToast(
        tx(
          "settings.toasts.paymentAddError",
          undefined,
          "Failed to add payment method",
        ),
        "error",
      );
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const ArrowIcon = dir === "rtl" ? ChevronLeft : ChevronRight;
  const currentTab = tabs.find((item) => item.id === activeTab) ?? tabs[0];
  const dashboardPath =
    activeMode === "freelancer" ? "/freelancer/dashboard" : "/client/dashboard";
  const accountTypeLabel =
    profile?.user_type === "both"
      ? tx("settings.accountTypeBoth", undefined, "Both")
      : profile?.user_type === "freelancer"
        ? tx("settings.accountTypeFreelancer", undefined, "Freelancer")
        : tx("settings.accountTypeClient", undefined, "Client");

  const identityLabel = profile?.cin_verified
    ? tx("settings.identityVerified", undefined, "Identity verified")
    : tx("settings.verifyIdentity", undefined, "Verify your identity");

  const onboardingLabel = profile?.onboarding_completed
    ? tx("settings.setupStatus.complete", undefined, "Complete")
    : tx("settings.setupStatus.pending", undefined, "Pending");

  const renderAccountTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      <div className="grid gap-3 sm:grid-cols-3 relative z-10">
        <div className="group relative overflow-hidden flex flex-col justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-brand-primary)]/5">
          <div className="absolute -right-10 -top-4 h-32 w-32 rounded-full bg-[var(--color-brand-primary)]/10 blur-[40px] pointer-events-none transition-all group-hover:bg-[var(--color-brand-primary)]/20" />
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)]">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-primary)]/80">
                {tx(
                  "settings.currentWorkspace",
                  undefined,
                  "Current workspace",
                )}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-bold text-[var(--color-text-primary)]">
              {activeMode === "freelancer"
                ? t.auth.accountPanel.freelancerLabel
                : t.auth.accountPanel.clientLabel}
            </p>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]/80 mt-1">
              {tx("settings.activeContext", undefined, "Active context")}
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden flex flex-col justify-between p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-background-base)] backdrop-blur-xl shadow-sm transition-all duration-300 hover:border-[var(--color-brand-secondary)]/30 hover:bg-[var(--color-brand-secondary)]/5">
          <div className="absolute -right-10 -top-4 h-32 w-32 rounded-full bg-[var(--color-brand-secondary)]/10 blur-[40px] pointer-events-none transition-all group-hover:bg-[var(--color-brand-secondary)]/20" />
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-brand-secondary)]/20 text-[var(--color-brand-secondary)]">
                <User className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-primary)]/80">
                {tx("settings.accountType", undefined, "Account type")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-bold text-[var(--color-text-primary)]">
              {accountTypeLabel}
            </p>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]/80 mt-1">
              {tx("settings.globalPermission", undefined, "Global permission")}
            </p>
          </div>
        </div>

        <div
          className={`group relative overflow-hidden flex flex-col justify-between p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-background-base)] backdrop-blur-xl shadow-sm transition-all duration-300 ${profile?.onboarding_completed ? "hover:border-[var(--color-status-success)]/30 hover:bg-[var(--color-status-success)]/5" : "hover:border-[var(--color-status-warning)]/30 hover:bg-[var(--color-status-warning)]/5"}`}
        >
          <div
            className={`absolute -right-10 -top-4 h-32 w-32 rounded-full blur-[40px] pointer-events-none transition-all ${profile?.onboarding_completed ? "bg-[var(--color-status-success)]/10 group-hover:bg-[var(--color-status-success)]/20" : "bg-[var(--color-status-warning)]/10 group-hover:bg-[var(--color-status-warning)]/20"}`}
          />
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-[8px] ${profile?.onboarding_completed ? "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)]" : "bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning)]"}`}
              >
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-primary)]/80">
                {tx("settings.onboardingStatus", undefined, "Onboarding")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-bold text-[var(--color-text-primary)]">
              {onboardingLabel}
            </p>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]/80 mt-1">
              {tx("settings.profileReadiness", undefined, "Profile readiness")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-background-elevated)] p-5 shadow-sm backdrop-blur-3xl ring-1 ring-[var(--color-border-subtle)]">
        <div className="absolute -left-20 top-20 h-[300px] w-[300px] rounded-full bg-[var(--color-brand-primary)]/5 blur-[100px] pointer-events-none" />
        <div className="absolute right-10 bottom-10 h-[200px] w-[200px] rounded-full bg-[var(--color-brand-secondary)]/5 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-3 items-start mb-4">
          <div className="md:w-1/3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] shadow-inner border border-[var(--color-brand-primary)]/20 mb-3 group transition-all duration-500 hover:bg-[var(--color-brand-primary)]/20 hover:scale-110 hover:shadow-[0_0_20px_rgba(var(--brand),0.3)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-primary)]/70 bg-clip-text text-transparent">
              {tx(
                "settings.accountOverviewTitle",
                undefined,
                "Your workspace identity and setup status",
              )}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]/90 max-w-sm">
              {tx(
                "settings.accountOverviewDescription",
                undefined,
                "This tab is the control point for how your account is set up. Switch to Profile when you want to edit details or change workspace readiness.",
              )}
            </p>
          </div>

          <div className="md:w-2/3 w-full bg-[var(--color-background-base)] p-4 rounded-xl border border-[var(--color-border-subtle)] backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between p-5 rounded-xl bg-[var(--color-background-base)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-[10px] ${profile?.cin_verified ? "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border border-[var(--color-status-success)]/30" : "bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning)] border border-[var(--color-status-warning)]/30"}`}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">
                    {tx(
                      "settings.identityVerificationTitle",
                      undefined,
                      "Identity Verification",
                    )}
                  </p>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]/80 mt-1">
                    {profile?.cin_verified
                      ? "Successfully verified by a human"
                      : "Pending verification review"}
                  </p>
                </div>
              </div>
              <span
                className={`px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-widest ${profile?.cin_verified ? "border-[var(--color-status-success)]/30 bg-[var(--color-status-success)]/10 text-[var(--color-status-success)] shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)] shadow-[0_0_15px_rgba(249,115,22,0.2)]"}`}
              >
                {identityLabel}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="group flex flex-col justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-muted)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-brand-primary)]/5 hover:shadow-[0_0_30px_-5px_rgba(var(--brand),0.3)]"
              >
                <div>
                  <p className="text-base font-bold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-brand-primary)]">
                    {tx(
                      "settings.goToProfile",
                      undefined,
                      "Go to Profile settings",
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]/80">
                    {tx(
                      "settings.accountTabHint",
                      undefined,
                      "Go to the Profile tab to switch workspace or update your account type.",
                    )}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="group flex flex-col justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-muted)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-secondary)]/40 hover:bg-[var(--color-brand-secondary)]/5 hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.3)]"
              >
                <div>
                  <p className="text-base font-bold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-brand-secondary)]">
                    {tx("settings.goToDashboard", undefined, "Go to dashboard")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]/80">
                    {tx(
                      "settings.goToDashboardDescription",
                      undefined,
                      "Return to your active workspace and continue where you left off.",
                    )}
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className="group mt-2 w-full flex flex-col justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-muted)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-accent)]/40 hover:bg-[var(--color-brand-accent)]/5 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]"
            >
              <div>
                <p className="text-base font-bold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-brand-accent)]">
                  {tx(
                    "settings.reviewNotifications",
                    undefined,
                    "Review notification rules",
                  )}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]/80">
                  {tx(
                    "settings.reviewNotificationsDescription",
                    undefined,
                    "Adjust how updates, reviews, and messages reach you.",
                  )}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      <div className="grid gap-3 sm:grid-cols-3 relative z-10">
        <div className="group relative overflow-hidden flex flex-col justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-[var(--color-status-success)]/30 hover:bg-[var(--color-status-success)]/5">
          <div className="absolute -right-10 -top-4 h-32 w-32 rounded-full bg-[var(--color-status-success)]/10 blur-[40px] pointer-events-none transition-all group-hover:bg-[var(--color-status-success)]/20" />
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-status-success)]/20 text-[var(--color-status-success)]">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-primary)]/80">
                {tx("settings.paymentMethodsCount", undefined, "Saved Methods")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-black text-[var(--color-text-primary)] drop-shadow-sm">
              {paymentMethods.length}
            </p>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]/80 mt-1">
              {tx(
                "settings.readyForTransactions",
                undefined,
                "Ready for transactions",
              )}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 rounded-full bg-[var(--color-brand-primary)]/20 blur-xl animate-pulse"></div>
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-primary)] relative z-10" />
          </div>
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-background-base)] p-5 text-center shadow-2xl backdrop-blur-xl transition-all hover:border-[var(--color-brand-primary)]/40 group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--color-brand-primary)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[50px] pointer-events-none" />
          <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-[var(--color-background-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-primary)] shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
            <CreditCard className="h-8 w-8" />
          </div>
          <h3 className="relative z-10 mt-4 text-base font-bold bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-primary)]/80 bg-clip-text text-transparent">
            {tx(
              "settings.noPaymentMethods",
              undefined,
              "No payment method added yet",
            )}
          </h3>
          <p className="relative z-10 mt-4 max-w-md mx-auto text-base leading-relaxed text-[var(--color-text-secondary)]/80">
            {tx(
              "settings.noPaymentMethodsDescription",
              undefined,
              "Add a payout method now so contracts, earnings, and withdrawals are ready when you need them. Secure and encrypted.",
            )}
          </p>
          <div className="mt-4 relative z-10">
            <Button
              variant="primary"
              size="lg"
              className="rounded-full shadow-lg hover:shadow-[var(--color-brand-primary)]/25 transition-all hover:scale-105"
              leftIcon={<Plus className="w-5 h-5" />}
              onClick={() => setIsAddPaymentModalOpen(true)}
            >
              {tx("settings.addMethod", undefined, "Add your first method")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-elevated)] p-5 shadow-2xl backdrop-blur-3xl ring-1 ring-[var(--color-border-subtle)]">
          <div className="absolute -left-40 top-20 h-[400px] w-[400px] rounded-full bg-[var(--color-brand-primary)]/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
            <div>
              <h3 className="text-base font-bold tracking-tight bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-primary)]/70 bg-clip-text text-transparent">
                {tx("settings.payoutMethods", undefined, "Payout Methods")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]/90 max-w-xl">
                {tx(
                  "settings.payoutMethodsDescription",
                  undefined,
                  "Manage how you receive earnings or make payments. Your default method will be automatically selected during checkout.",
                )}
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`group flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border p-5 transition-all duration-300 ${method.is_default ? "border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/5 shadow-[0_0_30px_-10px_rgba(var(--brand),0.2)]" : "border-[var(--color-border-subtle)] bg-[var(--color-background-base)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-background-elevated)]"}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-inner transition-colors duration-500 ${method.is_default ? "bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/30" : "bg-[var(--color-background-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] group-hover:text-[var(--color-text-primary)]"}`}
                  >
                    <CreditCard
                      className={`h-6 w-6 ${method.is_default ? "drop-shadow-[0_0_8px_rgba(var(--brand),0.8)]" : ""}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-base font-bold transition-colors duration-300 ${method.is_default ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]/80 group-hover:text-[var(--color-text-primary)]"}`}
                    >
                      {method.label}
                    </p>
                    <p className="mt-1 text-sm font-medium tracking-wider text-[var(--color-text-secondary)]/80">
                      {method.details}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {method.is_default ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)] shadow-[0_0_15px_-3px_rgba(var(--brand),0.4)]">
                      <Check className="h-4 w-4" />
                      {tx("settings.default", undefined, "Default")}
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[var(--color-border-subtle)] hover:bg-[var(--color-background-elevated)] transition-colors font-bold tracking-wide"
                      onClick={() => handleSetDefaultPayment(method.id)}
                    >
                      {tx("settings.setDefault", undefined, "Set default")}
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeletePayment(method.id)}
                    aria-label={tx(
                      "settings.deletePaymentMethod",
                      { label: method.label },
                      `Delete ${method.label}`,
                    )}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-background-muted)] text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-status-error)]/20 hover:border-[var(--color-status-error)]/40 hover:text-[var(--color-status-error)] hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === "account") return renderAccountTab();
    if (activeTab === "profile") return <ProfileSettings />;
    if (activeTab === "notifications") return <NotificationSettings />;
    if (activeTab === "payment") return renderPaymentTab();
    return <SecuritySettings />;
  };

  return (
    <div className="page-enter bg-[var(--color-background-base)] min-h-screen selection:bg-[var(--color-brand-primary)]/30 selection:text-[var(--color-text-primary)]">
      <SEO {...SEO_CONFIG.settings} url="/settings" noIndex />
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-4 lg:px-5 py-5 space-y-4 pb-24">
        {/* Modern Hero Section */}
        <section className="relative overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-elevated)] p-6 shadow-2xl backdrop-blur-md transform-gpu">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[var(--color-brand-primary)]/10 blur-[120px] pointer-events-none" />
          <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-[var(--color-brand-secondary)]/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)] shadow-[0_0_15px_-3px_rgba(var(--brand),0.3)] backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                {tx("settings.heroBadge", undefined, "Settings workspace")}
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-primary)]/70 bg-clip-text text-transparent sm:text-base">
                  {tx("settings.pageTitle", undefined, "Settings")}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]/90 font-medium">
                  {tx(
                    "settings.heroDescription",
                    undefined,
                    "Keep account details, security, payouts, and notification behavior in one consistent control surface. Update what matters without losing your place in the product.",
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] px-5 py-2 text-sm font-bold text-[var(--color-text-primary)] shadow-sm backdrop-blur-md hover:bg-[var(--color-background-elevated)] transition-colors">
                  <User className="h-4 w-4 text-[var(--color-brand-primary)]" />
                  {accountTypeLabel}
                </div>
                <div
                  className={`inline-flex items-center gap-2.5 rounded-full border px-5 py-2 text-sm font-bold shadow-sm backdrop-blur-md transition-colors ${
                    profile?.cin_verified
                      ? "border-[var(--color-status-success)]/30 bg-[var(--color-status-success)]/10 text-[var(--color-status-success)] hover:bg-[var(--color-status-success)]/15"
                      : "border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning)]/15"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  {identityLabel}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="rounded-full shadow-lg border-[var(--color-border-subtle)] bg-[var(--color-background-base)] backdrop-blur-md hover:bg-[var(--color-background-elevated)] transition-all hover:scale-105 font-bold tracking-wide border"
              rightIcon={<ArrowUpRight className="h-4 w-4" />}
              onClick={() => navigate(dashboardPath)}
            >
              {tx("settings.goToDashboard", undefined, "Go to dashboard")}
            </Button>
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-[260px_1fr] items-start">
          {/* Floating Sidebar Nav */}
          <aside className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto no-scrollbar relative z-20">
            <nav className="flex flex-col gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-elevated)] p-4 shadow-2xl backdrop-blur-3xl ring-1 ring-[var(--color-border-subtle)]">
              {tabs.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`group relative flex w-full items-center gap-2.5 rounded-[12px] px-3 py-3 text-left transition-all duration-500 overflow-hidden ${
                      isActive
                        ? "bg-[var(--color-brand-primary)]/5 shadow-[0_0_30px_-5px_rgba(var(--brand),0.15)] border border-[var(--color-brand-primary)]/20"
                        : "border border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-background-elevated)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-subtle)]"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-transparent opacity-50" />
                    )}
                    <span
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] transition-all duration-500 ${
                        isActive
                          ? "bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] shadow-[0_0_15px_rgba(var(--brand),0.4)] scale-105 border border-[var(--color-brand-primary)]/30"
                          : "bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)] group-hover:bg-[var(--color-background-muted)] group-hover:text-[var(--color-text-primary)] group-hover:scale-105 border border-[var(--color-border-default)]"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="relative z-10 min-w-0 flex-1">
                      <p
                        className={`text-sm font-bold tracking-tight transition-colors ${isActive ? "text-[var(--color-text-primary)] drop-shadow-md" : "text-[var(--color-text-primary)]/80"}`}
                      >
                        {item.label}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] leading-snug font-medium transition-colors ${isActive ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-secondary)]/60 group-hover:text-[var(--color-text-secondary)]/80"}`}
                      >
                        {item.description}
                      </p>
                    </div>
                    <ArrowIcon
                      className={`relative z-10 h-4 w-4 shrink-0 transition-all duration-300 ${
                        isActive
                          ? "text-[var(--color-brand-primary)] translate-x-1 opacity-100"
                          : "text-transparent -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:text-[var(--color-text-secondary)] group-hover:opacity-100"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <section className="space-y-3 relative z-10 w-full min-w-0 max-w-full">
            <div className="min-h-[600px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-elevated)] p-4 shadow-2xl backdrop-blur-md ring-1 ring-[var(--color-border-subtle)] sm:p-4 w-full min-w-0 max-w-full transform-gpu">
              <div className="mb-3 flex flex-col justify-between items-start sm:flex-row sm:items-end border-b border-[var(--color-border-subtle)] pb-8 gap-3 relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border-default)] to-transparent" />
                <div>
                  <h2 className="text-base font-black tracking-tight bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-primary)]/70 bg-clip-text text-transparent">
                    {currentTab.label}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]/90 font-medium">
                    {currentTab.description}
                  </p>
                </div>
                {activeTab === "payment" ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="rounded-full shrink-0 shadow-[0_0_20px_-5px_rgba(var(--brand),0.6)] font-bold tracking-wide transition-all hover:scale-105 hover:-translate-y-0.5"
                    leftIcon={<Plus className="w-5 h-5" />}
                    onClick={() => setIsAddPaymentModalOpen(true)}
                  >
                    {tx("settings.addMethod", undefined, "Add method")}
                  </Button>
                ) : null}
              </div>

              <div className="w-full min-w-0 max-w-full relative z-10">
                {renderActiveTab()}
              </div>
            </div>

            <div className="flex justify-center pt-8 pb-4">
              <Button
                variant="ghost"
                className="relative group overflow-hidden rounded-full px-4 py-5 font-bold tracking-widest uppercase text-sm border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] hover:border-[var(--color-status-error)]/30 transition-all shadow-xl hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] hover:-translate-y-1"
                onClick={handleLogout}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-status-error)]/0 via-[var(--color-status-error)]/10 to-[var(--color-status-error)]/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                {tx("settings.logout", undefined, "Sign out securely")}
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title={tx(
          "settings.addPaymentMethodModalTitle",
          undefined,
          "Add payment method",
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              {tx(
                "settings.paymentMethodType",
                undefined,
                "Payment method type",
              )}
            </label>
            <select
              value={newPaymentForm.type}
              onChange={(event) =>
                setNewPaymentForm({
                  ...newPaymentForm,
                  type: event.target.value,
                })
              }
              className="form-control"
              disabled={isSavingPayment}
            >
              <option value="d17">D17</option>
              <option value="flouci">Flouci</option>
              <option value="bank_transfer">
                {tx("settings.bankTransfer", undefined, "Bank transfer")}
              </option>
            </select>
          </div>

          <Input
            label={tx("settings.paymentDetails", undefined, "Payment details")}
            value={newPaymentForm.details}
            onChange={(event) =>
              setNewPaymentForm({
                ...newPaymentForm,
                details: event.target.value,
              })
            }
            disabled={isSavingPayment}
            placeholder={
              newPaymentForm.type === "bank_transfer"
                ? tx(
                    "settings.bankAccountNumber",
                    undefined,
                    "Bank account number",
                  )
                : tx("settings.phoneNumber", undefined, "Phone number")
            }
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddPaymentModalOpen(false)}
              disabled={isSavingPayment}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={handleAddPayment}
              disabled={!newPaymentForm.details || isSavingPayment}
              isLoading={isSavingPayment}
            >
              {tx("settings.add", undefined, "Add")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Settings;
