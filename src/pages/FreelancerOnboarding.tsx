import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import ProgressiveOnboarding from "../components/onboarding/ProgressiveOnboarding";
import type { Availability, SkillEntry } from "../types";
import { PREDEFINED_SKILLS } from "../types";
import type { ClientOnboardingData, FreelancerOnboardingData } from "../components/onboarding/ProgressiveOnboarding";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useTranslation } from "../i18n";
import { promoteUserTypeForWorkspace } from "../lib/workspaceRoutes";
import { normalizeOptionalPhone } from "../lib/phone";

type OnboardingCompletePayload =
  | { role: "freelancer"; data: FreelancerOnboardingData }
  | { role: "client"; data: ClientOnboardingData };

function FreelancerOnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, updateFreelancerProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { tx } = useTranslation();

  const handleComplete = useCallback(
    async (payload: OnboardingCompletePayload) => {
      if (payload.role !== "freelancer") return;
      if (!user) {
        showToast(tx("onboarding.freelancer.noAuthSession", undefined, "No auth session - please login again"), "error");
        navigate("/login", { replace: true });
        throw new Error("NO_AUTH_SESSION");
      }

      const { data } = payload;
      const normalizedSkillIdByName = new Map<string, string>();
      for (const skill of PREDEFINED_SKILLS) {
        normalizedSkillIdByName.set(skill.name_en.toLocaleLowerCase(), skill.id);
        normalizedSkillIdByName.set(skill.name_fr.toLocaleLowerCase(), skill.id);
        normalizedSkillIdByName.set(skill.name_ar.toLocaleLowerCase(), skill.id);
      }

      const skillEntries: SkillEntry[] = (data.coreSkills as string[])
        .map((rawSkill) => {
          const normalized = rawSkill.trim();
          if (!normalized) return null;
          const mappedId = normalizedSkillIdByName.get(normalized.toLocaleLowerCase()) || normalized;
          return {
            name: mappedId,
            level: "intermediate" as const,
          };
        })
        .filter(Boolean) as SkillEntry[];

      const mappedAvailability: Availability =
        data.availability === "As needed"
          ? "busy"
          : data.availability === "Part-time" || data.availability === "Full-time"
            ? "available"
            : "available";

      const yearsExperienceValue =
        data.yearsOfExperience === "0-2"
          ? 2
          : data.yearsOfExperience === "3-5"
            ? 5
            : data.yearsOfExperience === "5+"
              ? 6
              : undefined;

      const normalizedPhone = normalizeOptionalPhone(data.phoneNumber);

      await updateProfile({
        full_name: data.fullName.trim(),
        location: data.location,
        phone: normalizedPhone,
        bio: data.bio.trim(),
      });

      await updateFreelancerProfile({
        title: data.professionalTitle.trim() || undefined,
        hourly_rate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
        availability: mappedAvailability,
        skills: skillEntries,
        years_experience: yearsExperienceValue,
        tools: data.toolsUsed,
        portfolio_links: data.portfolioLink ? [data.portfolioLink.trim()] : [],
      });

      await updateProfile({
        user_type: promoteUserTypeForWorkspace(profile?.user_type, "freelancer"),
        active_mode: "freelancer",
        freelancer_onboarding_completed: true,
      });

      await refreshProfile();
      showToast(tx("onboarding.freelancer.welcomeToast", undefined, "Welcome to WorkedIn!"), "success");
      navigate("/freelancer/dashboard", { replace: true });
    },
    [navigate, profile?.user_type, refreshProfile, showToast, tx, updateFreelancerProfile, updateProfile, user],
  );

  return (
    <>
      <SEO
        title={tx("onboarding.freelancer.seoTitle", undefined, "Freelancer Onboarding")}
        description={tx(
          "onboarding.freelancer.seoDescription",
          undefined,
          "Complete your freelancer profile in guided steps.",
        )}
      />
      <ProgressiveOnboarding
        role="freelancer"
        onSaveExit={() => navigate("/freelancer/dashboard")}
        onComplete={handleComplete}
      />
    </>
  );
}

export default FreelancerOnboardingPage;
