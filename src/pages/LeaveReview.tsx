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

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
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
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRate(star)}
          onMouseEnter={() => !readonly && onHover(star)}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          className={[
            "transition-transform duration-100",
            readonly
              ? "cursor-default"
              : "cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-primary)] rounded",
          ].join(" ")}
        >
          <Star
            className="w-9 h-9"
            style={{
              color:
                star <= active
                  ? "var(--color-status-warning)"
                  : "var(--color-border-subtle)",
              fill:
                star <= active ? "var(--color-status-warning)" : "transparent",
              transition: "color 0.12s, fill 0.12s",
            }}
          />
        </button>
      ))}
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
      <div
        className="min-h-screen"
        style={{ background: "var(--color-background-base, #f9fafb)" }}
      >
        <Header />
        <main className="max-w-xl mx-auto px-4 py-12">
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{
              background: "var(--color-background-elevated)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {body}
            </p>
            <Button variant="secondary" size="sm" onClick={onBack}>
              {buttonLabel}
            </Button>
          </div>
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
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `
            id, status, freelancer_id, client_id,
            jobs(title),
            freelancer:public_profiles!contracts_freelancer_id_fkey(id, full_name, avatar_url),
            client:public_profiles!contracts_client_id_fkey(id, full_name, avatar_url)
          `,
        )
        .eq("id", contractId!)
        .single();

      if (error) throw error;
      return data as unknown as ContractForReview;
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
        tx("review.submitted", undefined, "Review submitted successfully!"),
        "success",
      );
      navigate(`/contracts/${contractId}`);
    },
    onError: (error) => {
      const message = error instanceof Error && error.message
        ? error.message
        : tx("review.error", undefined, "Failed to submit review. Try again.");
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
        <div
          className="min-h-screen"
          style={{ background: "var(--color-background-base, #f9fafb)" }}
        >
          <Header />
          <main className="max-w-xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div
                className="h-8 w-48 rounded-lg"
                style={{ background: "var(--color-background-elevated)" }}
              />
              <div
                className="h-40 rounded-2xl"
                style={{ background: "var(--color-background-elevated)" }}
              />
              <div
                className="h-64 rounded-2xl"
                style={{ background: "var(--color-background-elevated)" }}
              />
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
      <div
        className="min-h-screen"
        style={{ background: "var(--color-background-base, #f9fafb)" }}
      >
        <Header />
        <main className="max-w-xl mx-auto px-4 py-8 pb-16">
          <button
            type="button"
            onClick={() => navigate(`/contracts/${contractId}`)}
            className="inline-flex items-center gap-1.5 mb-6 text-sm font-medium transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            {tx("common.back", undefined, "Back to contract")}
          </button>

          <h1
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--color-text-primary)" }}
          >
            {tx("review.pageTitle", undefined, "Leave a Review")}
          </h1>

          {reviewTarget && (
            <div
              className="rounded-2xl border p-5 mb-5 flex items-center gap-4"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <div className="relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden">
                {reviewTarget.avatar_url ? (
                  <OptimizedImage
                    src={reviewTarget.avatar_url}
                    alt={reviewTarget.full_name}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold select-none"
                    style={{ background: "var(--workspace-primary)" }}
                  >
                    {getInitials(reviewTarget.full_name)}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className="text-base font-semibold truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {reviewTarget.full_name}
                </p>
                {jobTitle && (
                  <p
                    className="text-sm mt-0.5 truncate"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {jobTitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {existingReview ? (
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle
                  className="w-5 h-5"
                  style={{ color: "var(--color-status-success)" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-status-success)" }}
                >
                  {tx("review.alreadySubmitted", undefined, "Review Submitted")}
                </span>
              </div>

              <div className="space-y-1">
                <StarRating
                  rating={existingReview.rating}
                  hoveredRating={0}
                  onRate={() => {}}
                  onHover={() => {}}
                  onLeave={() => {}}
                  readonly
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {RATING_LABELS[existingReview.rating] ?? ""}
                </p>
              </div>

              {existingReview.comment && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {existingReview.comment}
                </p>
              )}

              <p
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {new Date(existingReview.created_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl border p-6 space-y-6"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold block"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {tx("review.ratingLabel", undefined, "Your Rating")}
                  <span
                    className="ml-1"
                    style={{ color: "var(--color-status-error)" }}
                  >
                    *
                  </span>
                </label>

                <StarRating
                  rating={rating}
                  hoveredRating={hoveredRating}
                  onRate={setRating}
                  onHover={setHoveredRating}
                  onLeave={() => setHoveredRating(0)}
                />

                <p
                  className="text-sm font-medium h-5 transition-opacity"
                  style={{
                    color: "var(--color-status-warning)",
                    opacity: hoveredRating || rating ? 1 : 0,
                  }}
                >
                  {RATING_LABELS[hoveredRating || rating] ?? ""}
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="review-comment"
                  className="text-sm font-semibold block"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {tx("review.commentLabel", undefined, "Your Comment")}{" "}
                  <span
                    className="font-normal text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    ({tx("common.optional", undefined, "optional")})
                  </span>
                </label>

                <div className="relative">
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(event) =>
                      setComment(event.target.value.slice(0, 500))
                    }
                    rows={4}
                    placeholder={tx(
                      "review.commentPlaceholder",
                      undefined,
                      "Share your experience working with this person...",
                    )}
                    className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-[box-shadow] focus:ring-2"
                    style={{
                      background: "var(--color-background-elevated)",
                      border: "1.5px solid var(--color-border-default)",
                      color: "var(--color-text-primary)",
                      boxShadow: "none",
                    }}
                    onFocus={(event) => {
                      event.currentTarget.style.borderColor =
                        "var(--workspace-primary)";
                      event.currentTarget.style.boxShadow =
                        "0 0 0 3px color-mix(in srgb, var(--workspace-primary) 15%, transparent)";
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.borderColor =
                        "var(--color-border-default)";
                      event.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <span
                    className="absolute bottom-2.5 right-3 text-xs select-none pointer-events-none tabular-nums"
                    style={{
                      color:
                        comment.length >= 480
                          ? "var(--color-status-error)"
                          : "var(--color-text-secondary)",
                    }}
                  >
                    {comment.length}/500
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={rating === 0}
                isLoading={submitReviewMutation.isPending}
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => submitReviewMutation.mutate()}
              >
                {tx("review.submitButton", undefined, "Submit Review")}
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
