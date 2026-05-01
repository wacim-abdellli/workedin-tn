import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { CheckCircle2, Lightbulb, Upload, UserCircle2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomSelect from "../ui/CustomSelect";
import { Header } from "../layout";
import { useToast } from "../ui/Toast";
import { useTranslation } from "../../i18n";
import { getLocalizedGovernorateOptions } from "../../lib/governorates";
import { isValidOptionalPhone } from "../../lib/phone";
import { PREDEFINED_SKILLS } from "../../types";

export type OnboardingRole = "freelancer" | "client";

type FreelancerAvailability = "Part-time" | "Full-time" | "As needed";
type FreelancerExperience = "0-2" | "3-5" | "5+";
type ClientAccountType = "Individual" | "Company";
type ClientGoal =
  | "Hire for a specific project"
  | "Build a team"
  | "Just browsing";

export interface FreelancerOnboardingData {
  avatarFile: File | null;
  avatarPreviewUrl: string;
  fullName: string;
  location: string;
  professionalTitle: string;
  bio: string;
  mainCategory: string;
  coreSkills: string[];
  toolsUsed: string[];
  hourlyRate: string;
  yearsOfExperience: FreelancerExperience | "";
  availability: FreelancerAvailability | "";
  portfolioLink: string;
  phoneNumber: string;
}

export interface ClientOnboardingData {
  fullName: string;
  location: string;
  phoneNumber: string;
  accountType: ClientAccountType | "";
  companyName: string;
  primaryGoal: ClientGoal | "";
}

type CompletePayload =
  | { role: "freelancer"; data: FreelancerOnboardingData }
  | { role: "client"; data: ClientOnboardingData };

type Awaitable<T> = T | Promise<T>;

interface OnboardingFlowProps {
  role: OnboardingRole;
  onSaveExit?: () => void;
  onComplete?: (payload: CompletePayload) => Awaitable<void>;
}

interface SharedLayoutProps {
  role: OnboardingRole;
  stepLabels: string[];
  currentStep: number;
  title: string;
  subtitle: string;
  proTipText: string;
  stepErrorSummary?: string;
  onSaveExit: () => void;
  children: ReactNode;
  showBackButton: boolean;
  onBack: () => void;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  isPrimaryActionDisabled?: boolean;
  isBackDisabled?: boolean;
  isSaveExitDisabled?: boolean;
}

interface SearchableTagInputProps {
  label: string;
  hint?: string;
  placeholder: string;
  tags: string[];
  maxTags: number;
  suggestions: string[];
  onChange: (nextTags: string[]) => void;
  error?: string;
}

const INPUT_CLASS =
  "bg-[var(--color-bg-base)] border border-surface rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-[var(--color-text-primary)] p-3.5 w-full outline-none transition-all";

const CLIENT_INPUT_CLASS =
  "bg-[var(--color-bg-base)] border border-surface rounded-xl focus:border-[#E8820C] focus:ring-1 focus:ring-[#E8820C] text-[var(--color-text-primary)] p-3.5 w-full outline-none transition-all";

function scrollToStepAnchor() {
  if (typeof window === "undefined") return;

  const anchor = document.getElementById("onboarding-step-anchor");
  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

type TxFn = (
  key: string,
  params?: Record<string, string | number>,
  fallback?: string,
) => string;

type ErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
};

type CompletionErrorKind = "phone-conflict" | "conflict" | "inactive" | "generic";

type CompletionIssue = {
  kind: CompletionErrorKind;
  message: string;
};

function resolveCompletionIssue(error: unknown, tx: TxFn): CompletionIssue {
  const errorLike = (error && typeof error === "object" ? error : null) as ErrorLike | null;
  const message = (errorLike?.message || "").toLowerCase();
  const details = (errorLike?.details || "").toLowerCase();
  const hint = (errorLike?.hint || "").toLowerCase();
  const code = (errorLike?.code || "").toLowerCase();
  const status = errorLike?.status;

  const isConflict = status === 409 || code === "23505" || message.includes("duplicate key");
  const mentionsPhone =
    message.includes("phone") || details.includes("phone") || hint.includes("phone");

  if (isConflict && mentionsPhone) {
    return {
      kind: "phone-conflict",
      message: tx(
        "onboarding.progressive.common.phoneTaken",
        undefined,
        "This phone number is already in use by another account.",
      ),
    };
  }

  if (isConflict) {
    return {
      kind: "conflict",
      message: tx(
        "onboarding.progressive.common.conflictRetry",
        undefined,
        "A conflicting update was detected. Please try again.",
      ),
    };
  }

  if (message.includes("account is not active") || message.includes("not active")) {
    return {
      kind: "inactive",
      message: tx(
        "onboarding.progressive.common.accountInactive",
        undefined,
        "Your account is not active. Please contact support.",
      ),
    };
  }

  return {
    kind: "generic",
    message: tx(
      "onboarding.progressive.common.completionFailed",
      undefined,
      "Failed to complete onboarding. Please try again.",
    ),
  };
}

const FREELANCER_MAIN_CATEGORIES = [
  "Development",
  "Design",
  "Marketing",
  "Writing",
  "Video",
  "Data",
  "Business",
] as const;

const FREELANCER_MAIN_CATEGORY_KEYS: Record<(typeof FREELANCER_MAIN_CATEGORIES)[number], string> = {
  Development: "development",
  Design: "design",
  Marketing: "marketing",
  Writing: "writing",
  Video: "video",
  Data: "data",
  Business: "business",
};

const FREELANCER_SKILL_SUGGESTIONS = [
  { key: "react", fallback: "React" },
  { key: "typescript", fallback: "TypeScript" },
  { key: "nodejs", fallback: "Node.js" },
  { key: "uiux", fallback: "UI/UX Design" },
  { key: "figma", fallback: "Figma" },
  { key: "contentWriting", fallback: "Content Writing" },
  { key: "seo", fallback: "SEO" },
  { key: "googleAds", fallback: "Google Ads" },
  { key: "motionDesign", fallback: "Motion Design" },
  { key: "dataAnalysis", fallback: "Data Analysis" },
  { key: "python", fallback: "Python" },
  { key: "nextjs", fallback: "Next.js" },
  { key: "tailwind", fallback: "Tailwind CSS" },
  { key: "illustrator", fallback: "Illustrator" },
  { key: "projectManagement", fallback: "Project Management" },
] as const;

const FREELANCER_TOOL_SUGGESTIONS = [
  { key: "figma", fallback: "Figma" },
  { key: "vscode", fallback: "VS Code" },
  { key: "photoshop", fallback: "Photoshop" },
  { key: "illustrator", fallback: "Illustrator" },
  { key: "notion", fallback: "Notion" },
  { key: "jira", fallback: "Jira" },
  { key: "slack", fallback: "Slack" },
  { key: "github", fallback: "GitHub" },
  { key: "docker", fallback: "Docker" },
  { key: "canva", fallback: "Canva" },
  { key: "framer", fallback: "Framer" },
  { key: "webflow", fallback: "Webflow" },
] as const;

const EXTENDED_TOOL_SUGGESTIONS = [
  "Git",
  "GitLab",
  "Bitbucket",
  "Postman",
  "Insomnia",
  "Firebase",
  "Supabase",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Prisma",
  "Sequelize",
  "Django",
  "Flask",
  "FastAPI",
  "Laravel",
  "Spring Boot",
  "Express",
  "NestJS",
  "Kubernetes",
  "Vercel",
  "Netlify",
  "AWS",
  "Azure",
  "Google Cloud",
  "Cloudflare",
  "Jenkins",
  "CircleCI",
  "GitHub Actions",
  "Trello",
  "Asana",
  "Monday.com",
  "ClickUp",
  "Miro",
  "Zeplin",
  "After Effects",
  "Premiere Pro",
  "DaVinci Resolve",
  "Blender",
  "Cinema 4D",
  "Final Cut Pro",
  "Audition",
  "Pro Tools",
  "Ableton Live",
  "WordPress",
  "Shopify",
  "WooCommerce",
  "Magento",
  "HubSpot",
  "Mailchimp",
  "Ahrefs",
  "SEMrush",
  "Notion AI",
  "ChatGPT",
  "Midjourney",
  "Canva Pro",
  "Excel",
  "Google Sheets",
  "Power BI",
  "Tableau",
  "Looker Studio",
  "MATLAB",
  "R",
  "Jupyter",
] as const;

function uniqueCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;

    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

function Stepper({
  stepLabels,
  currentStep,
  accentColor,
  activeLabelColor,
}: {
  stepLabels: string[];
  currentStep: number;
  accentColor: string;
  activeLabelColor: string;
}) {
  return (
    <div id="onboarding-step-anchor" className="mb-8">
      <div className="flex gap-2 mb-2">
        {stepLabels.map((label, index) => {
          const isActiveOrCompleted = index + 1 <= currentStep;
          return (
            <div
              key={label}
              className="h-2 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: isActiveOrCompleted ? accentColor : "#262626" }}
            />
          );
        })}
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${stepLabels.length}, minmax(0, 1fr))` }}
      >
        {stepLabels.map((label, index) => {
          const isActive = index + 1 === currentStep;
          return (
            <p
              key={label}
              className="text-[11px] md:text-xs text-center leading-tight"
              style={{ color: isActive ? activeLabelColor : "#6b7280" }}
            >
              {label}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function SearchableTagInput({
  label,
  hint,
  placeholder,
  tags,
  maxTags,
  suggestions,
  onChange,
  error,
}: SearchableTagInputProps) {
  const { tx } = useTranslation();
  const [query, setQuery] = useState("");

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return suggestions
      .filter((item) => !tags.includes(item))
      .filter((item) =>
        normalizedQuery.length === 0 ? true : item.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [query, suggestions, tags]);

  const addTag = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue || tags.includes(normalizedValue) || tags.length >= maxTags) {
      return;
    }

    onChange([...tags, normalizedValue]);
    setQuery("");
  };

  const removeTag = (value: string) => {
    onChange(tags.filter((item) => item !== value));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">{label}</label>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {tags.length}/{maxTags}
        </span>
      </div>

      {hint ? <p className="text-xs text-[var(--color-text-tertiary)] -mt-1">{hint}</p> : null}

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === ",") && query.trim()) {
            event.preventDefault();
            addTag(query);
          }
        }}
        className={INPUT_CLASS}
        placeholder={placeholder}
      />

      {filteredSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addTag(item)}
              className="px-3 py-1.5 rounded-full border border-surface text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-purple-500/50 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-purple-500/40 bg-purple-500/10 text-purple-200"
            >
              {item}
              <button
                type="button"
                onClick={() => removeTag(item)}
                className="text-purple-200 hover:text-[var(--color-text-primary)] transition-colors"
                aria-label={tx(
                  "onboarding.progressive.common.removeTagAria",
                  { item },
                  `Remove ${item}`,
                )}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function OnboardingLayout({
  role,
  stepLabels,
  currentStep,
  title,
  subtitle,
  proTipText,
  stepErrorSummary,
  onSaveExit,
  children,
  showBackButton,
  onBack,
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryActionDisabled = false,
  isBackDisabled = false,
  isSaveExitDisabled = false,
}: SharedLayoutProps) {
  const { tx } = useTranslation();
  const isClient = role === "client";
  const accentColor = isClient ? "#E8820C" : "#7c3aed";
  const accentHoverClass = isClient ? "hover:bg-[#d4750a]" : "hover:bg-purple-700";
  const stepLabelColor = isClient ? "#f6c27a" : "#c4b5fd";
  const panelAccentBackground = isClient ? "rgba(232, 130, 12, 0.12)" : "rgba(124, 58, 237, 0.12)";
  const panelAccentBorder = isClient ? "rgba(232, 130, 12, 0.3)" : "rgba(124, 58, 237, 0.3)";
  const panelAccentText = isClient ? "#f6c27a" : "#c4b5fd";
  const panelAccentIcon = isClient ? "#E8820C" : "#a78bfa";

  return (
    <div className="min-h-screen page-bg-base">
      <Header />

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2">
            <Stepper
              stepLabels={stepLabels}
              currentStep={currentStep}
              accentColor={accentColor}
              activeLabelColor={stepLabelColor}
            />

            <section className="surface-card border border-surface p-6 md:p-8 rounded-3xl shadow-[0_35px_80px_-60px_rgba(0,0,0,0.9)]">
              <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: panelAccentText }}>
                    {tx(
                      "onboarding.progressive.common.stepCounter",
                      { step: currentStep, total: stepLabels.length },
                      `Step ${currentStep} of ${stepLabels.length}`,
                    )}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
                  <p className="text-sm md:text-base text-[var(--color-text-tertiary)] mt-2">{subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={onSaveExit}
                  disabled={isSaveExitDisabled}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
                  style={{
                    borderColor: panelAccentBorder,
                    backgroundColor: panelAccentBackground,
                    color: panelAccentText,
                    opacity: isSaveExitDisabled ? 0.65 : 1,
                    cursor: isSaveExitDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {tx("onboarding.progressive.common.saveExit", undefined, "Save & Exit")}
                </button>
              </div>

              {stepErrorSummary ? (
                <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {stepErrorSummary}
                </div>
              ) : null}

              <div>{children}</div>

              <footer className="sticky bottom-0 z-10 flex justify-between mt-8 pt-4 pb-1 border-t border-surface bg-gradient-to-t from-[#141414] to-[#141414]/95 backdrop-blur">
                <div>
                  {showBackButton ? (
                    <button
                      type="button"
                      onClick={onBack}
                      disabled={isBackDisabled}
                      className="px-5 py-3 rounded-xl border border-surface text-gray-200 hover:text-[var(--color-text-primary)] transition-colors"
                      style={{
                        borderColor: "#262626",
                        opacity: isBackDisabled ? 0.65 : 1,
                        cursor: isBackDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {tx("onboarding.progressive.common.back", undefined, "Back")}
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={onPrimaryAction}
                  disabled={isPrimaryActionDisabled}
                  className={`text-[var(--color-text-primary)] px-8 py-3 rounded-xl font-medium transition-colors ${accentHoverClass} disabled:cursor-not-allowed disabled:opacity-70`}
                  style={{
                    backgroundColor: accentColor,
                    cursor: isPrimaryActionDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {primaryActionLabel}
                </button>
              </footer>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div
              className="p-6 rounded-2xl sticky top-24"
              style={{
                backgroundColor: panelAccentBackground,
                border: `1px solid ${panelAccentBorder}`,
              }}
            >
              <div className="inline-flex items-center gap-2 font-semibold mb-3" style={{ color: panelAccentText }}>
                <Lightbulb className="w-5 h-5" style={{ color: panelAccentIcon }} />
                <span>{tx("onboarding.progressive.common.proTip", undefined, "Pro Tip")}</span>
              </div>

              <p className="text-sm leading-7" style={{ color: isClient ? "#fde8cc" : "#e9d5ff" }}>{proTipText}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

interface RoleFlowBaseProps {
  onSaveExit: () => void;
  onComplete?: (payload: CompletePayload) => Awaitable<void>;
}

export function FreelancerOnboarding({ onSaveExit, onComplete }: RoleFlowBaseProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepErrorSummary, setStepErrorSummary] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { language, tx } = useTranslation();

  const governorateOptions = useMemo(
    () => getLocalizedGovernorateOptions(language),
    [language],
  );

  const stepLabels = useMemo(
    () => [
      tx("onboarding.progressive.freelancer.steps.identityPitch", undefined, "Identity & Pitch"),
      tx("onboarding.progressive.freelancer.steps.expertise", undefined, "Expertise"),
      tx("onboarding.progressive.freelancer.steps.businessRates", undefined, "Business & Rates"),
      tx("onboarding.progressive.freelancer.steps.trustProof", undefined, "Trust & Proof"),
    ],
    [tx],
  );

  const stepSubtitles = useMemo(
    () => [
      tx(
        "onboarding.progressive.freelancer.stepSubtitles.identityPitch",
        undefined,
        "Start with who you are and how you present your value.",
      ),
      tx(
        "onboarding.progressive.freelancer.stepSubtitles.expertise",
        undefined,
        "Define your strengths so matching quality improves.",
      ),
      tx(
        "onboarding.progressive.freelancer.stepSubtitles.businessRates",
        undefined,
        "Set clear business terms to align expectations.",
      ),
      tx(
        "onboarding.progressive.freelancer.stepSubtitles.trustProof",
        undefined,
        "Add trust signals that make clients confident to hire.",
      ),
    ],
    [tx],
  );

  const tipByStep = useMemo(
    () => [
      tx(
        "onboarding.progressive.freelancer.tips.identityPitch",
        undefined,
        "Clients decide in seconds. A clear title and confident profile summary instantly builds trust.",
      ),
      tx(
        "onboarding.progressive.freelancer.tips.expertise",
        undefined,
        "The right tags make matching smarter. Add only your strongest skills and tools to attract best-fit projects.",
      ),
      tx(
        "onboarding.progressive.freelancer.tips.businessRates",
        undefined,
        "Transparent rates reduce negotiation friction and help serious clients shortlist you faster.",
      ),
      tx(
        "onboarding.progressive.freelancer.tips.trustProof",
        undefined,
        "Verified details and a portfolio link are your credibility boosters. They increase response rates significantly.",
      ),
    ],
    [tx],
  );

  const categoryOptions = useMemo(
    () =>
      FREELANCER_MAIN_CATEGORIES.map((value) => ({
        value,
        label: tx(
          `onboarding.progressive.freelancer.categories.${FREELANCER_MAIN_CATEGORY_KEYS[value]}`,
          undefined,
          value,
        ),
      })),
    [tx],
  );

  const skillSuggestions = useMemo(
    () => {
      const localizedPresetSkills = PREDEFINED_SKILLS.map((skill) =>
        language === "ar" ? skill.name_ar : language === "fr" ? skill.name_fr : skill.name_en,
      );

      const curatedSkills = FREELANCER_SKILL_SUGGESTIONS.map((item) =>
        tx(
          `onboarding.progressive.freelancer.skillSuggestions.${item.key}`,
          undefined,
          item.fallback,
        ),
      );

      return uniqueCaseInsensitive([...localizedPresetSkills, ...curatedSkills]);
    },
    [language, tx],
  );

  const toolSuggestions = useMemo(
    () => {
      const curatedTools = FREELANCER_TOOL_SUGGESTIONS.map((item) =>
        tx(
          `onboarding.progressive.freelancer.toolSuggestions.${item.key}`,
          undefined,
          item.fallback,
        ),
      );

      return uniqueCaseInsensitive([...curatedTools, ...EXTENDED_TOOL_SUGGESTIONS]);
    },
    [tx],
  );

  const experienceOptions = useMemo(
    () => [
      { value: "0-2", label: tx("onboarding.progressive.freelancer.experience.0to2", undefined, "0-2") },
      { value: "3-5", label: tx("onboarding.progressive.freelancer.experience.3to5", undefined, "3-5") },
      { value: "5+", label: tx("onboarding.progressive.freelancer.experience.5plus", undefined, "5+") },
    ],
    [tx],
  );

  const availabilityOptions = useMemo(
    () => [
      {
        value: "Part-time",
        label: tx("onboarding.progressive.freelancer.availability.partTime", undefined, "Part-time"),
      },
      {
        value: "Full-time",
        label: tx("onboarding.progressive.freelancer.availability.fullTime", undefined, "Full-time"),
      },
      {
        value: "As needed",
        label: tx("onboarding.progressive.freelancer.availability.asNeeded", undefined, "As needed"),
      },
    ],
    [tx],
  );

  const [formData, setFormData] = useState<FreelancerOnboardingData>({
    avatarFile: null,
    avatarPreviewUrl: "",
    fullName: "",
    location: "",
    professionalTitle: "",
    bio: "",
    mainCategory: "",
    coreSkills: [],
    toolsUsed: [],
    hourlyRate: "",
    yearsOfExperience: "",
    availability: "",
    portfolioLink: "",
    phoneNumber: "",
  });

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.avatarFile) {
        nextErrors.avatarFile = tx(
          "onboarding.progressive.freelancer.errors.avatarRequired",
          undefined,
          "Avatar is required.",
        );
      }
      if (!formData.fullName.trim()) {
        nextErrors.fullName = tx(
          "onboarding.progressive.freelancer.errors.fullNameRequired",
          undefined,
          "Full name is required.",
        );
      }
      if (!formData.location) {
        nextErrors.location = tx(
          "onboarding.progressive.freelancer.errors.locationRequired",
          undefined,
          "Location is required.",
        );
      }
      if (!formData.professionalTitle.trim()) {
        nextErrors.professionalTitle = tx(
          "onboarding.progressive.freelancer.errors.professionalTitleRequired",
          undefined,
          "Professional title is required.",
        );
      }
      if (!formData.bio.trim()) {
        nextErrors.bio = tx(
          "onboarding.progressive.freelancer.errors.summaryRequired",
          undefined,
          "Summary is required.",
        );
      } else if (formData.bio.length > 500) {
        nextErrors.bio = tx(
          "onboarding.progressive.freelancer.errors.summaryTooLong",
          undefined,
          "Summary must be 500 characters or less.",
        );
      }
    }

    if (currentStep === 2) {
      if (!formData.mainCategory) {
        nextErrors.mainCategory = tx(
          "onboarding.progressive.freelancer.errors.mainCategoryRequired",
          undefined,
          "Main category is required.",
        );
      }
      if (formData.coreSkills.length === 0) {
        nextErrors.coreSkills = tx(
          "onboarding.progressive.freelancer.errors.coreSkillRequired",
          undefined,
          "Add at least one core skill.",
        );
      }
      if (formData.toolsUsed.length === 0) {
        nextErrors.toolsUsed = tx(
          "onboarding.progressive.freelancer.errors.toolRequired",
          undefined,
          "Add at least one tool.",
        );
      }
    }

    if (currentStep === 3) {
      if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) {
        nextErrors.hourlyRate = tx(
          "onboarding.progressive.freelancer.errors.hourlyRateInvalid",
          undefined,
          "Hourly rate must be greater than 0.",
        );
      }
      if (!formData.yearsOfExperience) {
        nextErrors.yearsOfExperience = tx(
          "onboarding.progressive.freelancer.errors.experienceRequired",
          undefined,
          "Select years of experience.",
        );
      }
      if (!formData.availability) {
        nextErrors.availability = tx(
          "onboarding.progressive.freelancer.errors.availabilityRequired",
          undefined,
          "Select availability.",
        );
      }
    }

    if (currentStep === 4) {
      if (!formData.portfolioLink.trim()) {
        nextErrors.portfolioLink = tx(
          "onboarding.progressive.freelancer.errors.portfolioRequired",
          undefined,
          "Portfolio link is required.",
        );
      }
      if (!formData.phoneNumber.trim()) {
        nextErrors.phoneNumber = tx(
          "onboarding.progressive.freelancer.errors.phoneRequired",
          undefined,
          "Phone number is required.",
        );
      } else if (!isValidOptionalPhone(formData.phoneNumber)) {
        nextErrors.phoneNumber = tx(
          "onboarding.progressive.common.invalidPhone",
          undefined,
          "Please enter a valid phone number.",
        );
      }
    }

    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    setStepErrorSummary(
      firstError
        ? tx(
            "onboarding.progressive.common.fixBeforeContinue",
            { error: firstError },
            `Please fix this before continuing: ${firstError}`,
          )
        : "",
    );
    return Object.keys(nextErrors).length === 0;
  };

  const handlePrimaryAction = async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateCurrentStep()) {
      showToast(
        tx(
          "onboarding.progressive.common.completeRequiredFields",
          undefined,
          "Please complete required fields before continuing.",
        ),
        "warning",
      );
      scrollToStepAnchor();
      return;
    }

    if (currentStep < stepLabels.length) {
      setStepErrorSummary("");
      setCurrentStep((previousStep) => previousStep + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete?.({ role: "freelancer", data: formData });
      setIsCompleted(true);
    } catch (error) {
      const issue = resolveCompletionIssue(error, tx);
      setStepErrorSummary(issue.message);
      if (issue.kind === "phone-conflict") {
        setErrors((prev) => ({ ...prev, phoneNumber: issue.message }));
        setCurrentStep(4);
      }
      scrollToStepAnchor();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreviewUrl: previewUrl,
    }));
    setErrors((prev) => ({ ...prev, avatarFile: "" }));
    if (stepErrorSummary) setStepErrorSummary("");
  };

  const hasFreelancerDraft =
    Boolean(formData.avatarFile) ||
    formData.fullName.trim().length > 0 ||
    formData.location.trim().length > 0 ||
    formData.professionalTitle.trim().length > 0 ||
    formData.bio.trim().length > 0 ||
    formData.mainCategory.trim().length > 0 ||
    formData.coreSkills.length > 0 ||
    formData.toolsUsed.length > 0 ||
    formData.hourlyRate.trim().length > 0 ||
    formData.yearsOfExperience.trim().length > 0 ||
    formData.availability.trim().length > 0 ||
    formData.portfolioLink.trim().length > 0 ||
    formData.phoneNumber.trim().length > 0;

  const handleSaveAndExit = () => {
    if (isSubmitting) {
      return;
    }

    if (hasFreelancerDraft && !isCompleted) {
      const shouldExit = window.confirm(
        tx(
          "onboarding.progressive.common.unsavedConfirm",
          undefined,
          "You have unsaved onboarding progress. Exit anyway?",
        ),
      );
      if (!shouldExit) return;
    }
    onSaveExit();
  };

  const stepTitle = stepLabels[currentStep - 1];
  const stepSubtitle = stepSubtitles[currentStep - 1];

  return (
    <OnboardingLayout
      role="freelancer"
      stepLabels={stepLabels}
      currentStep={currentStep}
      title={
        isCompleted
          ? tx(
              "onboarding.progressive.freelancer.completedTitle",
              undefined,
              "Profile setup completed",
            )
          : stepTitle
      }
      subtitle={
        isCompleted
          ? tx(
              "onboarding.progressive.freelancer.completedSubtitle",
              undefined,
              "Your freelancer onboarding data is ready. You can now move to your dashboard.",
            )
          : stepSubtitle
      }
      proTipText={tipByStep[currentStep - 1]}
      stepErrorSummary={stepErrorSummary}
      onSaveExit={handleSaveAndExit}
      showBackButton={currentStep > 1 && !isCompleted}
      onBack={() => setCurrentStep((previousStep) => Math.max(1, previousStep - 1))}
      primaryActionLabel={
        isSubmitting
          ? tx("onboarding.progressive.common.completing", undefined, "Completing...")
          : isCompleted
          ? tx("onboarding.progressive.common.exitOnboarding", undefined, "Exit Onboarding")
          : currentStep === stepLabels.length
            ? tx("onboarding.progressive.common.completeProfile", undefined, "Complete Profile")
            : tx("onboarding.progressive.common.nextStep", undefined, "Next Step")
      }
      isPrimaryActionDisabled={isSubmitting}
      isBackDisabled={isSubmitting}
      isSaveExitDisabled={isSubmitting}
      onPrimaryAction={() => {
        if (isSubmitting) {
          return;
        }

        if (isCompleted) {
          onSaveExit();
          return;
        }

        void handlePrimaryAction();
      }}
    >
      {isCompleted ? (
        <div className="py-6 flex flex-col items-center text-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <p className="text-base text-gray-200 max-w-lg">
            {tx(
              "onboarding.progressive.freelancer.completedMessage",
              undefined,
              "Thanks. Your onboarding information has been captured with a progressive structure.",
            )}
          </p>
        </div>
      ) : null}

      {!isCompleted && currentStep === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-3">
              {tx(
                "onboarding.progressive.freelancer.fields.avatarUpload",
                undefined,
                "Avatar Upload (Required)",
              )}
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border border-surface bg-[var(--color-bg-base)] flex items-center justify-center overflow-hidden hover:border-purple-500/60 transition-colors"
              >
                {formData.avatarPreviewUrl ? (
                  <img
                    src={formData.avatarPreviewUrl}
                    alt={tx("onboarding.progressive.freelancer.fields.avatarPreviewAlt", undefined, "Avatar preview")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="w-10 h-10 text-[var(--color-text-primary)]-subtle" />
                )}
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface bg-[var(--color-bg-base)] text-sm text-gray-200 hover:border-purple-500/60 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {tx("onboarding.progressive.freelancer.fields.chooseAvatar", undefined, "Choose avatar")}
                </button>
                <p className="text-xs text-[var(--color-text-primary)]-subtle mt-2">
                  {tx("onboarding.progressive.freelancer.fields.avatarHint", undefined, "PNG, JPG, WEBP")}
                </p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
            {errors.avatarFile ? <p className="text-xs text-red-400 mt-2">{errors.avatarFile}</p> : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
                {tx("onboarding.progressive.common.fields.fullName", undefined, "Full Name")}
              </label>
              <input
                value={formData.fullName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, fullName: event.target.value }))
                }
                className={INPUT_CLASS}
                placeholder={tx(
                  "onboarding.progressive.common.placeholders.fullName",
                  undefined,
                  "Your full name",
                )}
              />
              {errors.fullName ? <p className="text-xs text-red-400 mt-2">{errors.fullName}</p> : null}
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
                {tx("onboarding.progressive.common.fields.location", undefined, "Location")}
              </label>
              <CustomSelect
                value={formData.location}
                onChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
                options={governorateOptions}
                placeholder={tx(
                  "onboarding.progressive.common.placeholders.selectLocation",
                  undefined,
                  "Select location",
                )}
                variant="freelancer"
              />
              {errors.location ? <p className="text-xs text-red-400 mt-2">{errors.location}</p> : null}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx(
                "onboarding.progressive.freelancer.fields.professionalTitle",
                undefined,
                "Professional Title",
              )}
            </label>
            <input
              value={formData.professionalTitle}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, professionalTitle: event.target.value }))
              }
              className={INPUT_CLASS}
              placeholder={tx(
                "onboarding.progressive.freelancer.placeholders.professionalTitle",
                undefined,
                "Senior React Developer",
              )}
            />
            {errors.professionalTitle ? (
              <p className="text-xs text-red-400 mt-2">{errors.professionalTitle}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.freelancer.fields.bioSummary", undefined, "Bio/Summary")}
            </label>
            <textarea
              value={formData.bio}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, bio: event.target.value.slice(0, 500) }))
              }
              className={`${INPUT_CLASS} min-h-[130px] resize-y`}
              placeholder={tx(
                "onboarding.progressive.freelancer.placeholders.bioSummary",
                undefined,
                "What do you do best and what kind of projects excite you?",
              )}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[var(--color-text-primary)]-subtle">{formData.bio.length}/500</p>
              {errors.bio ? <p className="text-xs text-red-400">{errors.bio}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {!isCompleted && currentStep === 2 ? (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.freelancer.fields.mainCategory", undefined, "Main Category")}
            </label>
            <CustomSelect
              value={formData.mainCategory}
              onChange={(value) => setFormData((prev) => ({ ...prev, mainCategory: value }))}
              options={categoryOptions}
              placeholder={tx(
                "onboarding.progressive.freelancer.placeholders.selectCategory",
                undefined,
                "Select category",
              )}
              variant="freelancer"
            />
            {errors.mainCategory ? (
              <p className="text-xs text-red-400 mt-2">{errors.mainCategory}</p>
            ) : null}
          </div>

          <SearchableTagInput
            label={tx("onboarding.progressive.freelancer.fields.coreSkills", undefined, "Core Skills")}
            hint={tx(
              "onboarding.progressive.freelancer.hints.coreSkills",
              undefined,
              "Search and add up to 30 skills",
            )}
            placeholder={tx(
              "onboarding.progressive.freelancer.placeholders.coreSkills",
              undefined,
              "Type a skill and press Enter",
            )}
            tags={formData.coreSkills}
            maxTags={30}
            suggestions={skillSuggestions}
            onChange={(nextTags) =>
              setFormData((prev) => ({ ...prev, coreSkills: nextTags }))
            }
            error={errors.coreSkills}
          />

          <SearchableTagInput
            label={tx("onboarding.progressive.freelancer.fields.toolsUsed", undefined, "Tools Used")}
            hint={tx(
              "onboarding.progressive.freelancer.hints.toolsUsed",
              undefined,
              "Search and add up to 15 tools",
            )}
            placeholder={tx(
              "onboarding.progressive.freelancer.placeholders.toolsUsed",
              undefined,
              "Type a tool and press Enter",
            )}
            tags={formData.toolsUsed}
            maxTags={15}
            suggestions={toolSuggestions}
            onChange={(nextTags) =>
              setFormData((prev) => ({ ...prev, toolsUsed: nextTags }))
            }
            error={errors.toolsUsed}
          />
        </div>
      ) : null}

      {!isCompleted && currentStep === 3 ? (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.freelancer.fields.hourlyRate", undefined, "Hourly Rate")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-tertiary)]">
                {tx("onboarding.progressive.freelancer.currency", undefined, "TND")}
              </span>
              <input
                type="number"
                min={0}
                value={formData.hourlyRate}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, hourlyRate: event.target.value }))
                }
                className={`${INPUT_CLASS} pl-14`}
                placeholder={tx("onboarding.progressive.freelancer.placeholders.hourlyRate", undefined, "80")}
              />
            </div>
            {errors.hourlyRate ? <p className="text-xs text-red-400 mt-2">{errors.hourlyRate}</p> : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
                {tx(
                  "onboarding.progressive.freelancer.fields.yearsOfExperience",
                  undefined,
                  "Years of Experience",
                )}
              </label>
              <CustomSelect
                value={formData.yearsOfExperience}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, yearsOfExperience: value as FreelancerExperience }))
                }
                options={experienceOptions}
                placeholder={tx(
                  "onboarding.progressive.freelancer.placeholders.experienceRange",
                  undefined,
                  "Select range",
                )}
                variant="freelancer"
              />
              {errors.yearsOfExperience ? (
                <p className="text-xs text-red-400 mt-2">{errors.yearsOfExperience}</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
                {tx("onboarding.progressive.freelancer.fields.availability", undefined, "Availability")}
              </label>
              <CustomSelect
                value={formData.availability}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, availability: value as FreelancerAvailability }))
                }
                options={availabilityOptions}
                placeholder={tx(
                  "onboarding.progressive.freelancer.placeholders.availability",
                  undefined,
                  "Select availability",
                )}
                variant="freelancer"
              />
              {errors.availability ? (
                <p className="text-xs text-red-400 mt-2">{errors.availability}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!isCompleted && currentStep === 4 ? (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.freelancer.fields.portfolioLink", undefined, "Portfolio Link")}
            </label>
            <input
              type="url"
              value={formData.portfolioLink}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, portfolioLink: event.target.value }))
              }
              className={INPUT_CLASS}
              placeholder={tx(
                "onboarding.progressive.freelancer.placeholders.portfolioLink",
                undefined,
                "https://your-portfolio.com",
              )}
            />
            {errors.portfolioLink ? (
              <p className="text-xs text-red-400 mt-2">{errors.portfolioLink}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.common.fields.phoneNumber", undefined, "Phone Number")}
            </label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(event) => {
                const nextValue = event.target.value;
                setFormData((prev) => ({ ...prev, phoneNumber: nextValue }));
                if (errors.phoneNumber) {
                  setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                }
                if (stepErrorSummary) {
                  setStepErrorSummary("");
                }
              }}
              className={INPUT_CLASS}
              placeholder={tx(
                "onboarding.progressive.freelancer.placeholders.phoneNumber",
                undefined,
                "For security and verified badge",
              )}
            />
            <p className="text-xs text-[var(--color-text-primary)]-subtle mt-2">
              {tx(
                "onboarding.progressive.freelancer.hints.phoneNumber",
                undefined,
                "For security and verified badge.",
              )}
            </p>
            {errors.phoneNumber ? (
              <p className="text-xs text-red-400 mt-2">{errors.phoneNumber}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </OnboardingLayout>
  );
}

export function ClientOnboarding({ onSaveExit, onComplete }: RoleFlowBaseProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepErrorSummary, setStepErrorSummary] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { language, tx } = useTranslation();

  const governorateOptions = useMemo(
    () => getLocalizedGovernorateOptions(language),
    [language],
  );

  const stepLabels = useMemo(
    () => [
      tx("onboarding.progressive.client.steps.accountDetails", undefined, "Account Details"),
      tx("onboarding.progressive.client.steps.hiringIntent", undefined, "Hiring Intent"),
    ],
    [tx],
  );

  const tipByStep = useMemo(
    () => [
      tx(
        "onboarding.progressive.client.tips.accountDetails",
        undefined,
        "A complete account profile increases reply rates and reduces drop-off during first client-freelancer contact.",
      ),
      tx(
        "onboarding.progressive.client.tips.hiringIntent",
        undefined,
        "Clear hiring intent improves recommendations and helps the platform suggest higher-quality candidates.",
      ),
    ],
    [tx],
  );

  const accountTypeOptions: Array<{ value: ClientAccountType; label: string }> = useMemo(
    () => [
      {
        value: "Individual",
        label: tx("onboarding.progressive.client.accountTypes.individual", undefined, "Individual"),
      },
      {
        value: "Company",
        label: tx("onboarding.progressive.client.accountTypes.company", undefined, "Company"),
      },
    ],
    [tx],
  );

  const primaryGoalOptions: Array<{ value: ClientGoal; label: string }> = useMemo(
    () => [
      {
        value: "Hire for a specific project",
        label: tx(
          "onboarding.progressive.client.primaryGoals.specificProject",
          undefined,
          "Hire for a specific project",
        ),
      },
      {
        value: "Build a team",
        label: tx("onboarding.progressive.client.primaryGoals.buildTeam", undefined, "Build a team"),
      },
      {
        value: "Just browsing",
        label: tx("onboarding.progressive.client.primaryGoals.justBrowsing", undefined, "Just browsing"),
      },
    ],
    [tx],
  );

  const [formData, setFormData] = useState<ClientOnboardingData>({
    fullName: "",
    location: "",
    phoneNumber: "",
    accountType: "",
    companyName: "",
    primaryGoal: "",
  });

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        nextErrors.fullName = tx(
          "onboarding.progressive.client.errors.fullNameRequired",
          undefined,
          "Full name is required.",
        );
      }
      if (!formData.location) {
        nextErrors.location = tx(
          "onboarding.progressive.client.errors.locationRequired",
          undefined,
          "Location is required.",
        );
      }
      if (!formData.phoneNumber.trim()) {
        nextErrors.phoneNumber = tx(
          "onboarding.progressive.client.errors.phoneRequired",
          undefined,
          "Phone number is required.",
        );
      } else if (!isValidOptionalPhone(formData.phoneNumber)) {
        nextErrors.phoneNumber = tx(
          "onboarding.progressive.common.invalidPhone",
          undefined,
          "Please enter a valid phone number.",
        );
      }
    }

    if (currentStep === 2) {
      if (!formData.accountType) {
        nextErrors.accountType = tx(
          "onboarding.progressive.client.errors.accountTypeRequired",
          undefined,
          "Account type is required.",
        );
      }
      if (formData.accountType === "Company" && !formData.companyName.trim()) {
        nextErrors.companyName = tx(
          "onboarding.progressive.client.errors.companyNameRequired",
          undefined,
          "Company name is required for company accounts.",
        );
      }
      if (!formData.primaryGoal) {
        nextErrors.primaryGoal = tx(
          "onboarding.progressive.client.errors.primaryGoalRequired",
          undefined,
          "Primary goal is required.",
        );
      }
    }

    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    setStepErrorSummary(
      firstError
        ? tx(
            "onboarding.progressive.common.fixBeforeContinue",
            { error: firstError },
            `Please fix this before continuing: ${firstError}`,
          )
        : "",
    );
    return Object.keys(nextErrors).length === 0;
  };

  const handlePrimaryAction = async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateCurrentStep()) {
      showToast(
        tx(
          "onboarding.progressive.common.completeRequiredFields",
          undefined,
          "Please complete required fields before continuing.",
        ),
        "warning",
      );
      scrollToStepAnchor();
      return;
    }

    if (currentStep < stepLabels.length) {
      setStepErrorSummary("");
      setCurrentStep((previousStep) => previousStep + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete?.({ role: "client", data: formData });
      setIsCompleted(true);
    } catch (error) {
      const issue = resolveCompletionIssue(error, tx);
      if (issue.kind === "phone-conflict") {
        setCurrentStep(1);
        setErrors((prev) => ({ ...prev, phoneNumber: issue.message }));
      }
      setStepErrorSummary(issue.message);
      scrollToStepAnchor();
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle = currentStep === 1 ? stepLabels[0] : stepLabels[1];
  const stepSubtitle =
    currentStep === 1
      ? tx(
          "onboarding.progressive.client.stepSubtitles.accountDetails",
          undefined,
          "Just the essentials so your account is trusted and complete.",
        )
      : tx(
          "onboarding.progressive.client.stepSubtitles.hiringIntent",
          undefined,
          "Tell us what you want to hire for so we can personalize matching.",
        );

  const hasClientDraft =
    formData.fullName.trim().length > 0 ||
    formData.location.trim().length > 0 ||
    formData.phoneNumber.trim().length > 0 ||
    formData.accountType.trim().length > 0 ||
    formData.companyName.trim().length > 0 ||
    formData.primaryGoal.trim().length > 0;

  const handleSaveAndExit = () => {
    if (isSubmitting) {
      return;
    }

    if (hasClientDraft && !isCompleted) {
      const shouldExit = window.confirm(
        tx(
          "onboarding.progressive.common.unsavedConfirm",
          undefined,
          "You have unsaved onboarding progress. Exit anyway?",
        ),
      );
      if (!shouldExit) return;
    }
    onSaveExit();
  };

  return (
    <OnboardingLayout
      role="client"
      stepLabels={stepLabels}
      currentStep={currentStep}
      title={
        isCompleted
          ? tx("onboarding.progressive.client.completedTitle", undefined, "Onboarding completed")
          : stepTitle
      }
      subtitle={
        isCompleted
          ? tx(
              "onboarding.progressive.client.completedSubtitle",
              undefined,
              "Your client profile is now ready. You can continue to your dashboard.",
            )
          : stepSubtitle
      }
      proTipText={tipByStep[currentStep - 1]}
      stepErrorSummary={stepErrorSummary}
      onSaveExit={handleSaveAndExit}
      showBackButton={currentStep > 1 && !isCompleted}
      onBack={() => setCurrentStep((previousStep) => Math.max(1, previousStep - 1))}
      primaryActionLabel={
        isSubmitting
          ? tx("onboarding.progressive.common.completing", undefined, "Completing...")
          : isCompleted
          ? tx("onboarding.progressive.common.exitOnboarding", undefined, "Exit Onboarding")
          : currentStep === stepLabels.length
            ? tx("onboarding.progressive.common.completeProfile", undefined, "Complete Profile")
            : tx("onboarding.progressive.common.nextStep", undefined, "Next Step")
      }
      isPrimaryActionDisabled={isSubmitting}
      isBackDisabled={isSubmitting}
      isSaveExitDisabled={isSubmitting}
      onPrimaryAction={() => {
        if (isSubmitting) {
          return;
        }

        if (isCompleted) {
          onSaveExit();
          return;
        }

        void handlePrimaryAction();
      }}
    >
      {isCompleted ? (
        <div className="py-6 flex flex-col items-center text-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <p className="text-base text-gray-200 max-w-lg">
            {tx(
              "onboarding.progressive.client.completedMessage",
              undefined,
              "Client onboarding data is complete and ready.",
            )}
          </p>
        </div>
      ) : null}

      {!isCompleted && currentStep === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.common.fields.fullName", undefined, "Full Name")}
            </label>
            <input
              value={formData.fullName}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, fullName: event.target.value }))
              }
              className={CLIENT_INPUT_CLASS}
              placeholder={tx(
                "onboarding.progressive.common.placeholders.fullName",
                undefined,
                "Your full name",
              )}
            />
            {errors.fullName ? <p className="text-xs text-red-400 mt-2">{errors.fullName}</p> : null}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.common.fields.location", undefined, "Location")}
            </label>
            <CustomSelect
              value={formData.location}
              onChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              options={governorateOptions}
              placeholder={tx(
                "onboarding.progressive.common.placeholders.selectLocation",
                undefined,
                "Select location",
              )}
              variant="client"
            />
            {errors.location ? <p className="text-xs text-red-400 mt-2">{errors.location}</p> : null}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
              {tx("onboarding.progressive.common.fields.phoneNumber", undefined, "Phone Number")}
            </label>
            <input
              value={formData.phoneNumber}
              onChange={(event) => {
                const nextValue = event.target.value;
                setFormData((prev) => ({ ...prev, phoneNumber: nextValue }));
                if (errors.phoneNumber) {
                  setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                }
                if (stepErrorSummary) {
                  setStepErrorSummary("");
                }
              }}
              className={CLIENT_INPUT_CLASS}
              placeholder={tx(
                "onboarding.progressive.client.placeholders.phoneNumber",
                undefined,
                "+216 00 000 000",
              )}
            />
            {errors.phoneNumber ? (
              <p className="text-xs text-red-400 mt-2">{errors.phoneNumber}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isCompleted && currentStep === 2 ? (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-3">
              {tx("onboarding.progressive.client.fields.accountType", undefined, "Account Type")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accountTypeOptions.map((option) => {
                const isActive = formData.accountType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        accountType: option.value,
                        companyName: option.value === "Company" ? prev.companyName : "",
                      }))
                    }
                    className="text-left px-4 py-3.5 rounded-xl border transition-colors"
                    style={{
                      borderColor: isActive ? "#E8820C" : "#262626",
                      backgroundColor: isActive ? "rgba(232, 130, 12, 0.12)" : "#0a0a0a",
                    }}
                  >
                    <span className="text-sm text-[var(--color-text-primary)] font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.accountType ? (
              <p className="text-xs text-red-400 mt-2">{errors.accountType}</p>
            ) : null}
          </div>

          {formData.accountType === "Company" ? (
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
                {tx("onboarding.progressive.client.fields.companyName", undefined, "Company Name")}
              </label>
              <input
                value={formData.companyName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, companyName: event.target.value }))
                }
                className={CLIENT_INPUT_CLASS}
                placeholder={tx(
                  "onboarding.progressive.client.placeholders.companyName",
                  undefined,
                  "Your company name",
                )}
              />
              {errors.companyName ? (
                <p className="text-xs text-red-400 mt-2">{errors.companyName}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-3">
              {tx("onboarding.progressive.client.fields.primaryGoal", undefined, "Primary Goal")}
            </label>
            <div className="space-y-3">
              {primaryGoalOptions.map((option) => {
                const isActive = formData.primaryGoal === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, primaryGoal: option.value }))
                    }
                    className="w-full text-left px-4 py-3.5 rounded-xl border transition-colors"
                    style={{
                      borderColor: isActive ? "#E8820C" : "#262626",
                      backgroundColor: isActive ? "rgba(232, 130, 12, 0.12)" : "#0a0a0a",
                    }}
                  >
                    <span className="text-sm text-[var(--color-text-primary)] font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.primaryGoal ? (
              <p className="text-xs text-red-400 mt-2">{errors.primaryGoal}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </OnboardingLayout>
  );
}

export default function ProgressiveOnboarding({
  role,
  onSaveExit,
  onComplete,
}: OnboardingFlowProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tx } = useTranslation();
  const lastAlertedLocationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const onboardingRequired = Boolean(
      (location.state as { onboardingRequired?: boolean } | null)?.onboardingRequired,
    );
    if (!onboardingRequired) return;

    if (lastAlertedLocationKeyRef.current === location.key) return;
    lastAlertedLocationKeyRef.current = location.key;

    showToast(
      tx(
        "onboarding.progressive.common.onboardingRequired",
        undefined,
        "Please complete your onboarding profile before accessing other pages.",
      ),
      "warning",
    );
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: { from: (location.state as { from?: unknown } | null)?.from },
    });
  }, [location.key, location.pathname, location.search, location.state, navigate, showToast]);

  const handleSaveExit = () => {
    onSaveExit?.();
  };

  if (role === "freelancer") {
    return (
      <FreelancerOnboarding
        onSaveExit={handleSaveExit}
        onComplete={onComplete}
      />
    );
  }

  return (
    <ClientOnboarding onSaveExit={handleSaveExit} onComplete={onComplete} />
  );
}



