import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, ChevronLeft, Send, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import SEO, { SEO_CONFIG } from "@/components/common/SEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import { Header } from "@/components/layout";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { submitReview as submitReviewRequest } from "@/services/reviews";

interface ContractForReview {
  id: string;
  status: string;
  freelancer_id: string;
  client_id: string;
  jobs: { title: string } | { title: string }[] | null;
  freelancer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  client: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface ExistingReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface StarRatingProps {
  rating: number;
  hoveredRating: number;
  onRate: (rating: number) => void;
  onHover: (rating: number) => void;
  onLeave: () => void;
  readonly?: boolean;
}

const getRatingLabel = (rating: number, tx: (key: string, params?: any, fallback?: string) => string): string => {
  const labels: Record<number, { key: string; fallback: string }> = {
    1: { key: "pages.leaveReview.rating.poor", fallback: "Poor" },
    2: { key: "pages.leaveReview.rating.fair", fallback: "Fair" },
    3: { key: "pages.leaveReview.rating.good", fallback: "Good" },
    4: { key: "pages.leaveReview.rating.veryGood", fallback: "Very Good" },
    5: { key: "pages.leaveReview.rating.excellent", fallback: "Excellent" },
  };
  
  const label = labels[rating];
  return label ? tx(label.key, undefined, label.fallback) : "";
};

function getJobTitle(jobs: ContractForReview["jobs"]): string {
  if (!jobs) return "";
  if (Array.isArray(jobs)) return jobs[0]?.title ?? "";
  return jobs.title ?? "";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function StarRating({
  rating,
  hoveredRating,
  onRate,
  onHover,
  onLeave,
  readonly = false,
}: StarRatingProps) {
  const active = hoveredRating || rating;

  return (
    <div
      className="flex items-center gap-2"
      onMouseLeave={readonly ? undefined : onLeave}
      role={readonly ? undefined : "radiogroup"}
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= active;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRate(star)}
            onMouseEnter={() => !readonly && onHover(star)}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            className={`transition-all duration-300 relative group ${readonly ? "cursor-default" : "cursor-pointer hover:scale-125 focus:outline-none"}`}
          >
            {/* Glow effect underneath active stars */}
            {!readonly && isActive && (
               <div className="absolute inset-0 bg-[#E8A020]/40 blur-md rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <Star
              className="w-10 h-10 sm:w-12 sm:h-12 relative z-10"
              style={{
                color: isActive ? "#E8A020" : "rgba(255, 255, 255, 0.1)",
                fill: isActive ? "#E8A020" : "transparent",
                filter: isActive ? "drop-shadow(0 4px 12px rgba(232, 160, 32, 0.3))" : "none",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function GateCard({
  title,
  body,
  onBack,
  buttonLabel,
}: {
  title: string;
  body: string;
  onBack: () => void;
  buttonLabel: string;
}) {
  return (
    <>
      <SEO {...SEO_CONFIG.dashboard} noIndex />
      <div className="min-h-screen bg-[#0B0C0E] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
        
        <Header />
        <main className="relative max-w-lg mx-auto px-4 py-24 z-10 flex flex-col items-center text-center">
          <div className="mb-8 w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-4">
            {title}
          </h1>
          <p className="text-[15px] leading-relaxed text-white/60 mb-10 max-w-sm">
            {body}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="rounded-[14px] bg-white/10 hover:bg-white/15 px-8 py-3.5 text-[14px] font-bold text-white transition-all border border-white/5"
          >
            {buttonLabel}
          </button>
        </main>
      </div>
    </>
  );
}

export default function LeaveReview() {
  const { contractId } = useParams<{ contractId: string }>();
  const { user } = useAuth();
  const { tx } = useTranslation() as any;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const {
    data: contract,
    isLoading: contractLoading,
    error: contractError,
  } = useQuery<ContractForReview>({
    queryKey: ["contract-for-review", contractId],
    queryFn: async () => {
      const { data: contractData, error } = await supabase
        .from("contracts")
        .select(`
            id, status, freelancer_id, client_id,
            jobs(title)
          `)
        .eq("id", contractId!)
        .single();

      if (error) throw error;

      const otherUserId = user!.id === contractData.client_id ? contractData.freelancer_id : contractData.client_id;
      
      let otherProfile = null;
      if (otherUserId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();
          otherProfile = profileData;
      }

      return {
          ...contractData,
          freelancer: user!.id === contractData.client_id ? otherProfile : { id: user!.id, full_name: 'You', avatar_url: null },
          client: user!.id === contractData.freelancer_id ? otherProfile : { id: user!.id, full_name: 'You', avatar_url: null }
      } as unknown as ContractForReview;
    },
    enabled: !!contractId && !!user?.id,
  });

  const { data: existingReview, isLoading: reviewLoading } =
    useQuery<ExistingReview | null>({
      queryKey: ["existing-review", contractId, user?.id],
      queryFn: async () => {
        const { data } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at")
          .eq("contract_id", contractId!)
          .eq("reviewer_id", user!.id)
          .maybeSingle();

        return data as ExistingReview | null;
      },
      enabled: !!contractId && !!user?.id,
    });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!contractId || !user?.id || rating === 0) return;

      const { error } = await submitReviewRequest(contractId, rating, comment);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["existing-review", contractId, user?.id],
      });
      showToast(
        tx("pages.leaveReview.submitted", undefined, "Review submitted successfully!"),
        "success",
      );
      navigate(`/contracts/${contractId}`);
    },
    onError: (error) => {
      const message = error instanceof Error && error.message
        ? error.message
        : tx("pages.leaveReview.error", undefined, "Failed to submit review. Try again.");
      showToast(
        message,
        "error",
      );
    },
  });

  const isLoading = contractLoading || reviewLoading;
  const isParticipant =
    !!contract &&
    !!user &&
    (user.id === contract.client_id || user.id === contract.freelancer_id);
  const canReviewContract = isParticipant && contract?.status === "completed";

  const reviewTarget =
    contract && user
      ? user.id === contract.client_id
        ? contract.freelancer
        : contract.client
      : null;
  const jobTitle = contract ? getJobTitle(contract.jobs) : "";

  if (isLoading) {
    return (
      <>
        <SEO {...SEO_CONFIG.dashboard} noIndex />
        <div className="min-h-screen bg-[#0B0C0E]">
          <Header />
          <main className="max-w-xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 rounded-lg bg-white/5" />
              <div className="h-40 rounded-2xl bg-white/5" />
              <div className="h-64 rounded-2xl bg-white/5" />
            </div>
          </main>
        </div>
      </>
    );
  }

  if (!user || contractError || !contract || !isParticipant) {
    return (
      <GateCard
        title={tx("review.unavailableTitle", undefined, "Review unavailable")}
        body={tx(
          "review.unavailableBody",
          undefined,
          "This contract is not available for review from your account.",
        )}
        buttonLabel={tx("common.goBack", undefined, "Go Back")}
        onBack={() =>
          navigate(contractId ? `/contracts/${contractId}` : "/contracts")
        }
      />
    );
  }

  if (!canReviewContract) {
    return (
      <GateCard
        title={tx(
          "review.completedOnlyTitle",
          undefined,
          "Reviews open after completion",
        )}
        body={tx(
          "review.completedOnlyBody",
          undefined,
          "You can only review a contract after it has been completed.",
        )}
        buttonLabel={tx("common.goBack", undefined, "Go Back")}
        onBack={() => navigate(`/contracts/${contractId}`)}
      />
    );
  }

  return (
    <>
      <SEO {...SEO_CONFIG.dashboard} noIndex />
      <div className="min-h-screen bg-[#0B0C0E] relative overflow-hidden">
        <Header />
        <main className="relative max-w-xl mx-auto px-4 py-8 pb-20 z-10">
          {/* Background Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E8A020]/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-[#9B8FF0]/10 blur-[120px] pointer-events-none" />

          <button
            type="button"
            onClick={() => navigate(`/contracts/${contractId}`)}
            className="relative inline-flex items-center gap-2 mb-8 text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {tx("common.back", undefined, "Back to Workspace")}
          </button>

          <div className="relative mb-8 text-center sm:text-left">
            <h1 className="text-[28px] sm:text-[32px] font-black text-white tracking-tight leading-tight">
              {tx("review.pageTitle", undefined, "Rate your experience")}
            </h1>
            <p className="mt-2 text-[14px] text-white/50">
              Your feedback builds trust and helps the community grow.
            </p>
          </div>

          {reviewTarget && (
            <div className="relative rounded-[20px] border border-white/[0.08] bg-[#161719]/80 backdrop-blur-xl p-5 mb-6 flex items-center gap-4 shadow-lg">
              <div className="relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border-2 border-white/10">
                {reviewTarget.avatar_url ? (
                  <OptimizedImage
                    src={reviewTarget.avatar_url}
                    alt={reviewTarget.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E8A020] to-[#b37a15] flex items-center justify-center text-white text-lg font-bold">
                    {getInitials(reviewTarget.full_name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-white truncate">
                  {reviewTarget.full_name}
                </p>
                {jobTitle && (
                  <p className="text-[13px] font-medium text-white/50 mt-0.5 truncate">
                    {jobTitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {existingReview ? (
            <div className="relative rounded-[24px] border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-[#111113] p-8 shadow-[0_8px_32px_rgba(16,185,129,0.05)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[18px] font-bold text-emerald-400">
                  {tx("review.alreadySubmitted", undefined, "Review Submitted")}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                    <StarRating
                    rating={existingReview.rating}
                    hoveredRating={0}
                    onRate={() => {}}
                    onHover={() => {}}
                    onLeave={() => {}}
                    readonly
                    />
                    <p className="mt-2 text-[14px] font-bold text-emerald-400/80">
                    {getRatingLabel(existingReview.rating, tx)}
                    </p>
                </div>

                {existingReview.comment && (
                  <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                    <p className="text-[14px] leading-relaxed text-white/80">
                        {existingReview.comment}
                    </p>
                  </div>
                )}

                <p className="text-[12px] font-medium text-white/30 uppercase tracking-wider">
                  {new Date(existingReview.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-[24px] border border-white/[0.08] bg-[#111113]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
              
              {/* Rating Section */}
              <div className="mb-8">
                <label className="text-[12px] font-bold uppercase tracking-wider text-white/60 mb-3 block">
                  {tx("review.ratingLabel", undefined, "Overall Rating")}
                  <span className="ml-1 text-red-500">*</span>
                </label>
                
                <div className="bg-[#161719] rounded-[16px] p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                    <StarRating
                    rating={rating}
                    hoveredRating={hoveredRating}
                    onRate={setRating}
                    onHover={setHoveredRating}
                    onLeave={() => setHoveredRating(0)}
                    />
                    <p
                    className="mt-3 text-[14px] font-bold h-5 transition-all duration-200"
                    style={{
                        color: hoveredRating || rating ? "#E8A020" : "transparent",
                        transform: hoveredRating || rating ? "translateY(0)" : "translateY(-4px)"
                    }}
                    >
                    {getRatingLabel(hoveredRating || rating, tx) || "Select a rating"}
                    </p>
                </div>
              </div>

              {/* Comment Section */}
              <div className="mb-8">
                <label htmlFor="review-comment" className="text-[12px] font-bold uppercase tracking-wider text-white/60 mb-3 flex justify-between items-center">
                  <span>{tx("review.commentLabel", undefined, "Written Review")}</span>
                  <span className="text-white/30 font-medium normal-case tracking-normal">
                    {tx("common.optional", undefined, "Optional")}
                  </span>
                </label>

                <div className="relative group">
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    rows={5}
                    placeholder="What was it like working together? Mention the quality of work, communication, and overall experience..."
                    className="w-full resize-none rounded-[16px] bg-[#161719] px-5 py-4 text-[14px] text-white placeholder-white/20 outline-none border border-white/5 transition-all duration-300 focus:border-[#E8A020]/50 focus:bg-[#1a1b1e]"
                  />
                  <div className="absolute bottom-3 right-4 flex items-center gap-2">
                    <span className={`text-[11px] font-bold tabular-nums ${comment.length >= 450 ? "text-amber-500" : "text-white/20"}`}>
                        {comment.length} / 500
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={rating === 0 || submitReviewMutation.isPending}
                onClick={() => submitReviewMutation.mutate()}
                className={`group relative w-full overflow-hidden rounded-[14px] py-4 px-6 font-bold text-[15px] text-white transition-all duration-300
                  ${rating === 0 
                    ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                    : 'bg-[#E8A020] hover:bg-[#f0aa28] hover:shadow-[0_0_24px_rgba(232,160,32,0.4)] hover:-translate-y-0.5'
                  }`}
              >
                <div className="relative flex items-center justify-center gap-2">
                    {submitReviewMutation.isPending ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : (
                        <>
                            <Send className={`w-4 h-4 ${rating > 0 ? 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform' : ''}`} />
                            {tx("review.submitButton", undefined, "Publish Review")}
                        </>
                    )}
                </div>
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

