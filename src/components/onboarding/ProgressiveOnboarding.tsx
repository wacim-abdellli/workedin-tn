import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { CheckCircle2, Lightbulb, Upload, UserCircle2, X, Building2, User, Target, Users, Search, Check } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../ui/CustomSelect";
import { Header } from "../layout";
import { useToast } from "../ui/Toast";
import { useTranslation } from "../../i18n";
import { getLocalizedGovernorateOptions } from "../../lib/governorates";
import { isValidOptionalPhone, formatPhoneAsYouType } from "../../lib/phone";
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
  children: ReactNode;
  showBackButton: boolean;
  onBack: () => void;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  isPrimaryActionDisabled?: boolean;
  isBackDisabled?: boolean;
  onStepClick: (step: number) => void;
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
  "bg-[var(--input-bg)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] focus:border-[var(--workspace-primary)] focus:ring-1 focus:ring-[var(--workspace-primary)]/20 text-[var(--color-text-primary)] p-3.5 w-full outline-none transition-all rounded-xl";

const CLIENT_INPUT_CLASS = INPUT_CLASS;

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
  onStepClick,
}: {
  stepLabels: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div id="onboarding-step-anchor" className="mb-12 select-none">
      <div className="relative flex items-center justify-between px-12 sm:px-16 md:px-24">
        {/* Progress Track Container */}
        <div className="absolute left-12 right-12 sm:left-16 sm:right-16 md:left-24 md:right-24 top-1/2 -translate-y-1/2 h-[2px] z-0">
          {/* Background Track Line */}
          <div className="w-full h-full bg-zinc-800 rounded-full" />
          
          {/* Filled Progress Line */}
          <div 
            className="absolute left-0 top-0 h-full bg-[var(--workspace-primary)] rounded-full transition-all duration-350 ease-out" 
            style={{ 
              width: `${((currentStep - 1) / (stepLabels.length - 1 || 1)) * 100}%`,
              boxShadow: '0 0 8px var(--workspace-primary)'
            }}
          />
        </div>
        
        {/* Step Nodes */}
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isClickable = stepNumber < currentStep;

          return (
            <div key={label} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick(stepNumber)}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300
                  ${isCompleted 
                    ? "bg-[var(--workspace-primary)] text-white hover:scale-105 cursor-pointer" 
                    : isActive 
                      ? "bg-zinc-950 border-[2px] border-[var(--workspace-primary)] text-[var(--workspace-primary)] scale-105" 
                      : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                  }
                `}
                style={
                  isActive 
                    ? { 
                        boxShadow: '0 0 0 4px color-mix(in srgb, var(--workspace-primary) 12%, transparent), 0 0 20px color-mix(in srgb, var(--workspace-primary) 30%, transparent)' 
                      }
                    : isCompleted 
                      ? { 
                          boxShadow: '0 0 10px color-mix(in srgb, var(--workspace-primary) 30%, transparent)' 
                        }
                      : undefined
                }
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  stepNumber
                )}
              </button>
              
              {/* Step Label */}
              <span 
                onClick={() => isClickable && onStepClick(stepNumber)}
                className={`
                  absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-wider uppercase text-center transition-all duration-300
                  ${isActive 
                    ? "text-[var(--workspace-primary)] font-bold scale-102" 
                    : isCompleted 
                      ? "text-zinc-300 hover:text-white cursor-pointer" 
                      : "text-zinc-500"
                  }
                `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Spacer */}
      <div className="h-6" />
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
              className="px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--workspace-primary)]/50 transition-colors"
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
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-[var(--workspace-primary)]/30 bg-[var(--workspace-primary-dim)] text-[var(--color-text-primary)]"
            >
              {item}
              <button
                type="button"
                onClick={() => removeTag(item)}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label={tx(
                  "onboarding.progressive.common.removeTagAria",
                  { item },
                  `Remove ${item}`,
                )}
              >
                <X className="w-3 h-3" />
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
  children,
  showBackButton,
  onBack,
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryActionDisabled = false,
  isBackDisabled = false,
  onStepClick,
}: SharedLayoutProps) {
  const { tx } = useTranslation();
  const isClient = role === "client";
  const accentColor = "var(--workspace-primary)";
  const accentHoverClass = isClient ? "hover:bg-[#d4750a]" : "hover:bg-purple-700";

  return (
    <div className="min-h-screen page-bg-base">
      <Header />

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2">
            <Stepper
              stepLabels={stepLabels}
              currentStep={currentStep}
              onStepClick={onStepClick}
            />

            <section className="relative overflow-hidden bg-zinc-950/45 dark:bg-zinc-950/45 border border-zinc-800/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              {/* Premium Glow Top Bar */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[var(--workspace-primary)] to-transparent opacity-80" />

              <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: "var(--workspace-primary)" }}>
                    {tx(
                      "onboarding.progressive.common.stepCounter",
                      { step: currentStep, total: stepLabels.length },
                      `Step ${currentStep} of ${stepLabels.length}`,
                    )}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
                  <p className="text-sm md:text-base text-[var(--color-text-tertiary)] mt-2">{subtitle}</p>
                </div>
              </div>

              {stepErrorSummary ? (
                <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {stepErrorSummary}
                </div>
              ) : null}

              <div>{children}</div>

              <footer className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-800/80 bg-transparent">
                <div>
                  {showBackButton ? (
                    <button
                      type="button"
                      onClick={onBack}
                      disabled={isBackDisabled}
                      className="px-5 py-3 rounded-xl border border-zinc-805 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                      style={{
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
                  className="text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 hover:opacity-95"
                  style={{
                    backgroundColor: "var(--workspace-primary)",
                    cursor: isPrimaryActionDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {primaryActionLabel}
                </button>
              </footer>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-zinc-950/45 border border-zinc-800/80 backdrop-blur-xl p-6 rounded-2xl sticky top-24 shadow-lg overflow-hidden transition-all duration-300 hover:border-[var(--workspace-primary)]/30">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--workspace-primary)]" />
              <div className="inline-flex items-center gap-2 font-semibold mb-3 text-[var(--workspace-primary)]">
                <Lightbulb className="w-5 h-5 text-[var(--workspace-primary)]" />
                <span>{tx("onboarding.progressive.common.proTip", undefined, "Pro Tip")}</span>
              </div>

              <p className="text-sm leading-relaxed text-zinc-300">{proTipText}</p>
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

function AvatarUploadZone({
  previewUrl,
  onFileSelect,
  error,
  tx,
}: {
  previewUrl: string;
  onFileSelect: (file: File) => void;
  error?: string;
  tx: any;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div className="space-y-2 flex flex-col items-center">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-36 h-36 border-2 border-dashed rounded-full flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden transition-all duration-300 mx-auto
          ${isDragActive 
            ? "border-[var(--workspace-primary)] bg-[var(--workspace-primary)]/5 shadow-[0_0_15px_var(--workspace-shadow)]" 
            : "border-zinc-800 bg-zinc-900/50 hover:border-[var(--workspace-primary)]/50 hover:bg-zinc-900"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
          }}
        />

        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover animate-fade-in" />
            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-1.5 text-white transition-opacity duration-300 backdrop-blur-xs">
              <Upload className="w-5 h-5 text-[var(--workspace-primary)] animate-bounce" />
              <span className="text-[10px] font-semibold text-center px-2">{tx("onboarding.progressive.freelancer.fields.chooseAvatar", undefined, "Change")}</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-zinc-800 rounded-full text-zinc-400 group-hover:text-[var(--workspace-primary)] transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center px-3">
              <p className="text-[11px] font-semibold text-zinc-300 leading-tight">{tx("onboarding.progressive.freelancer.fields.chooseAvatar", undefined, "Upload Photo")}</p>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-none">PNG, JPG</p>
            </div>
          </>
        )}
      </div>
      {error ? <p className="text-xs text-red-400 mt-1 text-center">{error}</p> : null}
    </div>
  );
}

export function FreelancerOnboarding({ onSaveExit, onComplete }: RoleFlowBaseProps) {
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
    phoneNumber: "+216",
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

  const handleFileSelect = (file: File) => {
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

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      setStepErrorSummary("");
    }
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
      onStepClick={handleStepClick}
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
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-6"
          >
            {currentStep === 1 && (
              <>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-3">
                    {tx(
                      "onboarding.progressive.freelancer.fields.avatarUpload",
                      undefined,
                      "Avatar Upload (Required)",
                    )}
                  </label>
                  <AvatarUploadZone
                    previewUrl={formData.avatarPreviewUrl}
                    onFileSelect={handleFileSelect}
                    error={errors.avatarFile}
                    tx={tx}
                  />
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
              </>
            )}

            {currentStep === 2 && (
              <>
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
              </>
            )}

            {currentStep === 3 && (
              <>
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
              </>
            )}

            {currentStep === 4 && (
              <>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-2">
                    {tx("onboarding.progressive.freelancer.fields.portfolioLink", undefined, "Portfolio Link (Optional)")}
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
                      const nextValue = formatPhoneAsYouType(event.target.value);
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
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
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
    phoneNumber: "+216",
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

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      setStepErrorSummary("");
    }
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
      onStepClick={handleStepClick}
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
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-6"
          >
            {currentStep === 1 && (
              <>
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
                  {errors.fullName ? <p className="text-xs text-red-450 mt-2">{errors.fullName}</p> : null}
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
                      const nextValue = formatPhoneAsYouType(event.target.value);
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
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-3">
                    {tx("onboarding.progressive.client.fields.accountType", undefined, "Account Type")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {accountTypeOptions.map((option) => {
                      const isActive = formData.accountType === option.value;
                      const IconComponent = option.value === "Individual" ? User : Building2;
                      const description = option.value === "Individual"
                        ? tx("onboarding.progressive.client.accountTypes.individualDesc", undefined, "Hire as a single person for personal projects")
                        : tx("onboarding.progressive.client.accountTypes.companyDesc", undefined, "Hire on behalf of an agency, startup, or company");

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
                          className={`
                            text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 relative overflow-hidden group
                            ${isActive 
                              ? "border-[var(--workspace-primary)] bg-[var(--workspace-primary-dim)] shadow-[0_0_20px_var(--workspace-shadow)]" 
                              : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/50"
                            }
                          `}
                        >
                          <div className={`
                            p-3 rounded-xl transition-colors duration-300
                            ${isActive 
                              ? "bg-[var(--workspace-primary)] text-white" 
                              : "bg-zinc-900 text-zinc-400 group-hover:text-zinc-200"
                            }
                          `}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{option.label}</span>
                            <span className="block text-xs text-zinc-500 mt-1 leading-relaxed">{description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.accountType ? (
                    <p className="text-xs text-red-400 mt-2">{errors.accountType}</p>
                  ) : null}
                </div>

                {formData.accountType === "Company" && (
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
                )}

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] block mb-3">
                    {tx("onboarding.progressive.client.fields.primaryGoal", undefined, "Primary Goal")}
                  </label>
                  <div className="space-y-3">
                    {primaryGoalOptions.map((option) => {
                      const isActive = formData.primaryGoal === option.value;
                      const IconComponent = option.value === "Hire for a specific project"
                        ? Target
                        : option.value === "Build a team"
                          ? Users
                          : Search;
                      const description = option.value === "Hire for a specific project"
                        ? tx("onboarding.progressive.client.primaryGoals.specificProjectDesc", undefined, "Post a job and find a freelancer for a one-off task or scope")
                        : option.value === "Build a team"
                          ? tx("onboarding.progressive.client.primaryGoals.buildTeamDesc", undefined, "Bring on multiple experts for long-term collaboration")
                          : tx("onboarding.progressive.client.primaryGoals.justBrowsingDesc", undefined, "Explore freelancers, profiles, and active job postings first");

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, primaryGoal: option.value }))
                          }
                          className={`
                            w-full text-left p-5 rounded-2xl border transition-all duration-355 flex items-center gap-4 relative overflow-hidden group
                            ${isActive 
                              ? "border-[var(--workspace-primary)] bg-[var(--workspace-primary-dim)] shadow-[0_0_20px_var(--workspace-shadow)]" 
                              : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/50"
                            }
                          `}
                        >
                          <div className={`
                            p-3 rounded-xl transition-colors duration-300
                            ${isActive 
                              ? "bg-[var(--workspace-primary)] text-white" 
                              : "bg-zinc-900 text-zinc-400 group-hover:text-zinc-200"
                            }
                          `}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{option.label}</span>
                            <span className="block text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.primaryGoal ? (
                    <p className="text-xs text-red-400 mt-2">{errors.primaryGoal}</p>
                  ) : null}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
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



