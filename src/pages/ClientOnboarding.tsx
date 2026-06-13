import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import ProgressiveOnboarding from "../components/onboarding/ProgressiveOnboarding";
import type { ClientOnboardingData, FreelancerOnboardingData } from "../components/onboarding/ProgressiveOnboarding";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useTranslation } from "../i18n";
import { promoteUserTypeForWorkspace } from "../lib/workspaceRoutes";
import { normalizeOptionalPhone } from "../lib/phone";

type OnboardingCompletePayload =
  | { role: "freelancer"; data: FreelancerOnboardingData }
  | { role: "client"; data: ClientOnboardingData };

function ClientOnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { tx } = useTranslation();

  const handleComplete = useCallback(
    async (payload: OnboardingCompletePayload) => {
      if (payload.role !== "client") return;
      if (!user) {
        showToast(tx("auth.login", undefined, "Please log in again"), "error");
        navigate("/login", { replace: true });
        throw new Error("NO_AUTH_SESSION");
      }

      const { data } = payload;
      const normalizedPhone = normalizeOptionalPhone(data.phoneNumber);
      const mergedCommunicationPreferences = {
        ...(profile?.communication_preferences || {}),
        onboarding_primary_goal: data.primaryGoal,
      };

      await updateProfile({
        full_name: data.fullName.trim(),
        location: data.location,
        phone: normalizedPhone,
        company_name: data.accountType === "Company" ? data.companyName.trim() || undefined : undefined,
        communication_preferences: mergedCommunicationPreferences,
        user_type: promoteUserTypeForWorkspace(profile?.user_type, "client"),
        active_mode: "client",
        onboarding_completed: true,
        client_onboarding_completed: true,
      });

      await refreshProfile();
      showToast(tx("onboarding.client.welcome", undefined, "Welcome"), "success");
      navigate("/client/dashboard", { replace: true });
    },
    [navigate, profile?.communication_preferences, profile?.user_type, refreshProfile, showToast, tx, updateProfile, user],
  );

  return (
    <>
      <SEO
        title={tx("onboarding.client.seoTitle", undefined, "Client Onboarding")}
        description={tx(
          "onboarding.client.seoDescription",
          undefined,
          "Set up your client account in a fast, focused flow.",
        )}
      />
      <ProgressiveOnboarding
        role="client"
        onComplete={handleComplete}
      />
    </>
  );
}

export default ClientOnboardingPage;
