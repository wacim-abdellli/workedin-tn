import { logger } from "@/lib/logger";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  Plus,
  Shield,
  Trash2,
  User,
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
  const { t, tx } = useTranslation();
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
    ? tx("settings.identityVerified", undefined, "Verified")
    : tx("settings.verifyIdentity", undefined, "Not verified");

  const renderAccountTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: tx("settings.currentWorkspace", undefined, "Workspace"),
            value: activeMode === "freelancer" ? t.auth.accountPanel.freelancerLabel : t.auth.accountPanel.clientLabel,
            icon: BriefcaseBusiness,
          },
          {
            label: tx("settings.accountType", undefined, "Account type"),
            value: accountTypeLabel,
            icon: User,
          },
          {
            label: tx("settings.identityVerificationTitle", undefined, "Identity"),
            value: identityLabel,
            icon: profile?.cin_verified ? Check : Shield,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border p-4"
            style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-background-elevated)" }}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: "color-mix(in srgb, var(--workspace-primary) 10%, transparent)" }}>
                <Icon className="h-3.5 w-3.5" style={{ color: "var(--workspace-primary)" }} />
              </div>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>{label}</p>
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-tertiary)" }}>
          {tx("settings.quickActions", undefined, "Quick actions")}
        </h3>
        <div className="space-y-2">
          {[
            {
              label: tx("settings.goToProfile", undefined, "Edit profile"),
              desc: tx("settings.accountTabHint", undefined, "Update your details and workspace"),
              onClick: () => setActiveTab("profile"),
              icon: User,
            },
            {
              label: tx("settings.goToDashboard", undefined, "Go to dashboard"),
              desc: tx("settings.goToDashboardDescription", undefined, "Return to your workspace"),
              onClick: () => navigate(dashboardPath),
              icon: BriefcaseBusiness,
            },
            {
              label: tx("settings.reviewNotifications", undefined, "Manage notifications"),
              desc: tx("settings.reviewNotificationsDescription", undefined, "Control your alerts"),
              onClick: () => setActiveTab("notifications"),
              icon: Bell,
            },
          ].map(({ label, desc, onClick, icon: Icon }) => (
            <button key={label} type="button" onClick={onClick}
              className="group w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 hover:shadow-sm"
              style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-background-elevated)" }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "color-mix(in srgb, var(--workspace-primary) 30%, var(--color-border-subtle))";
                e.currentTarget.style.background = "color-mix(in srgb, var(--workspace-primary) 4%, var(--color-background-elevated))";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                e.currentTarget.style.background = "var(--color-background-elevated)";
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--workspace-primary) 10%, transparent)" }}>
                    <Icon className="h-4 w-4" style={{ color: "var(--workspace-primary)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--workspace-primary)" }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentTab = () => (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--workspace-primary)" }} />
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full mb-4" style={{ background: "color-mix(in srgb, var(--workspace-primary) 10%, transparent)" }}>
            <CreditCard className="h-6 w-6" style={{ color: "var(--workspace-primary)" }} />
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            {tx("settings.noPaymentMethods", undefined, "No payment methods")}
          </h3>
          <p className="text-xs mb-4 max-w-sm mx-auto" style={{ color: "var(--color-text-tertiary)" }}>
            {tx("settings.noPaymentMethodsDescription", undefined, "Add a payout method for transactions")}
          </p>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAddPaymentModalOpen(true)}>
            {tx("settings.addMethod", undefined, "Add method")}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              {paymentMethods.length} {tx("settings.paymentMethodsCount", undefined, "payment methods")}
            </p>
            <Button variant="outline" size="xs" leftIcon={<Plus className="w-3 h-3" />} onClick={() => setIsAddPaymentModalOpen(true)}>
              {tx("settings.addMethod", undefined, "Add")}
            </Button>
          </div>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border"
                style={{
                  borderColor: method.is_default ? "color-mix(in srgb, var(--workspace-primary) 25%, var(--color-border-subtle))" : "var(--color-border-subtle)",
                  background: method.is_default ? "color-mix(in srgb, var(--workspace-primary) 3%, var(--color-background-elevated))" : "var(--color-background-elevated)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: method.is_default ? "color-mix(in srgb, var(--workspace-primary) 12%, transparent)" : "var(--color-background-subtle)" }}>
                    <CreditCard className="h-4 w-4" style={{ color: method.is_default ? "var(--workspace-primary)" : "var(--color-text-secondary)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{method.label}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{method.details}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {method.is_default ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ background: "color-mix(in srgb, var(--workspace-primary) 12%, transparent)", color: "var(--workspace-primary)" }}>
                      <Check className="h-3 w-3" />
                      {tx("settings.default", undefined, "Default")}
                    </span>
                  ) : (
                    <Button variant="outline" size="xs" onClick={() => handleSetDefaultPayment(method.id)}>
                      {tx("settings.setDefault", undefined, "Set default")}
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePayment(method.id)}
                    aria-label={tx("settings.deletePaymentMethod", { label: method.label }, `Delete ${method.label}`)}
                    className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                    style={{ color: "var(--color-text-tertiary)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--color-status-error)"; e.currentTarget.style.background = "color-mix(in srgb, var(--color-status-error) 8%, transparent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
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
    <div className="min-h-screen" style={{ background: "var(--color-background-base)" }}>
      <SEO {...SEO_CONFIG.settings} url="/settings" noIndex />
      <Header />

      <main className="mx-auto max-w-[1400px] px-4 py-6 pb-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {tx("settings.pageTitle", undefined, "Settings")}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            {tx("settings.heroDescription", undefined, "Manage your account, profile, and preferences")}
          </p>
        </div>

        {/* Premium Full-Width Tab Navigation */}
        <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="border-b-2" style={{ borderColor: "var(--color-border-subtle)" }}>
            <nav className="flex gap-1 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
              {tabs.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className="group relative flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                    style={{
                      color: isActive ? "var(--workspace-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    {/* Animated background on hover/active */}
                    <div 
                      className="absolute inset-0 rounded-t-xl transition-all duration-300"
                      style={{
                        background: isActive 
                          ? "color-mix(in srgb, var(--workspace-primary) 8%, transparent)" 
                          : "transparent",
                        opacity: isActive ? 1 : 0,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "color-mix(in srgb, var(--workspace-primary) 4%, transparent)";
                          e.currentTarget.style.opacity = "1";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.opacity = "0";
                        }
                      }}
                    />
                    
                    {/* Icon */}
                    <div className="relative z-10 p-1.5 rounded-lg transition-all duration-200"
                      style={{ background: isActive ? "color-mix(in srgb, var(--workspace-primary) 12%, transparent)" : "transparent" }}>
                      <item.icon className="h-4 w-4 transition-colors duration-200"
                        style={{ color: isActive ? "var(--workspace-primary)" : "var(--color-text-tertiary)" }} />
                    </div>
                    
                    {/* Label */}
                    <span className="relative z-10 font-semibold">{item.label}</span>
                    
                    {/* Active indicator bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-200"
                      style={{ background: isActive ? "var(--workspace-primary)" : "transparent" }} />
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab description bar */}
          <div className="px-4 sm:px-6 lg:px-8 py-4" style={{ background: "color-mix(in srgb, var(--workspace-primary) 3%, var(--color-background-base))" }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--workspace-primary) 12%, transparent)" }}>
                <currentTab.icon className="h-4 w-4" style={{ color: "var(--workspace-primary)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {currentTab.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content with Premium Layout */}
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">{renderActiveTab()}</div>
          
          {/* Enhanced Sidebar Info */}
          <div className="space-y-6">
            {/* Current Tab Info Card */}
            <div className="rounded-2xl border-2 p-6 backdrop-blur-sm relative overflow-hidden group transition-all duration-300 hover:shadow-xl" style={{ borderColor: "color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))", background: "color-mix(in srgb, var(--workspace-primary) 5%, var(--color-background-elevated))" }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: "linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))" }} />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl shadow-lg" style={{ background: "linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))" }}>
                    <currentTab.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {currentTab.label}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {currentTab.description}
                </p>
              </div>
            </div>
            

          </div>
        </div>

        {/* Logout */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <button
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--color-text-tertiary)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--color-status-error)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
            onClick={handleLogout}
          >
            {tx("settings.logout", undefined, "Sign out")}
          </button>
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default Settings;
