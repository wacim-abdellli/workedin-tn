import { supabase } from '@/lib/supabase';
import type { Proposal } from '@/types/proposal';

export interface RecommendationInsight {
    type: 'budget_analysis' | 'skill_match' | 'market_timing' | 'success_predictor' | 'proposal_quality';
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'success';
    actionable: boolean;
    action?: {
        label: string;
        callback: () => void;
    };
}

export interface BudgetBenchmark {
    avgBudget: number;
    minBudget: number;
    maxBudget: number;
    yourBudget: number;
    positionPercentile: number; // 0-100: where their budget falls
}

export interface AIRecommendations {
    freelancerMatches: Proposal[];
    budgetBenchmark: BudgetBenchmark | null;
    insights: RecommendationInsight[];
    opportunityScore: number; // 0-100: likelihood of successful hire
    averageResponseTime?: number; // in hours
}

/**
 * Calculate skill match percentage between job requirements and freelancer skills
 */
function calculateSkillMatch(jobSkills: string[], freelancerTitle: string, freelancerBio?: string): number {
    if (!jobSkills || jobSkills.length === 0) return 50;
    
    const freelancerText = `${freelancerTitle} ${freelancerBio || ''}`.toLowerCase();
    const jobText = jobSkills.join(' ').toLowerCase();
    
    let matches = 0;
    for (const skill of jobSkills) {
        if (freelancerText.includes(skill.toLowerCase())) {
            matches++;
        }
    }
    
    return Math.round((matches / jobSkills.length) * 100);
}

/**
 * Score a proposal based on multiple factors
 */
function scoreProposal(
    proposal: Proposal,
    jobBudgetMin: number,
    jobBudgetMax: number,
    jobDuration: number,
    requiredSkills: string[]
): number {
    let score = 0;

    // Budget fit (30 points)
    const midBudget = (jobBudgetMin + jobBudgetMax) / 2;
    const budgetDiff = Math.abs(proposal.bid_amount - midBudget);
    const budgetRange = jobBudgetMax - jobBudgetMin;
    const budgetFit = Math.max(0, 100 - (budgetDiff / budgetRange) * 100);
    score += (budgetFit / 100) * 30;

    // Timeline fit (20 points)
    const durationFit = Math.max(0, 100 - Math.abs(proposal.duration - jobDuration) * 5);
    score += (durationFit / 100) * 20;

    // Experience (20 points)
    const jobsWeight = Math.min(proposal.freelancer.jobs_completed / 20, 1);
    score += jobsWeight * 20;

    // Success rate (20 points)
    score += (proposal.freelancer.success_rate / 100) * 20;

    // Skill match (10 points bonus)
    const skillMatch = calculateSkillMatch(requiredSkills, proposal.freelancer.title);
    score += (skillMatch / 100) * 10;

    return Math.round(score);
}

/**
 * Analyze proposals and generate recommendations
 */
export async function generateAIRecommendations(
    jobId: string,
    proposals: Proposal[],
    jobData: any
): Promise<AIRecommendations> {
    const insights: RecommendationInsight[] = [];
    let opportunityScore = 50;

    try {
        // Safely extract job properties
        const category = jobData?.category || jobData?.job_category || '';
        const subcategory = jobData?.subcategory || jobData?.job_subcategory || '';
        const budgetMin = jobData?.budget_min || 0;
        const budgetMax = jobData?.budget_max || 0;
        const jobType = jobData?.job_type || 'fixed_price';
        const duration = String(jobData?.duration || 'more_than_6_months');
        const requiredSkills = Array.isArray(jobData?.required_skills) ? jobData.required_skills : [];
        const createdAt = jobData?.created_at || new Date().toISOString();

        console.log('AI Recommendations - Processing job:', {
            jobId,
            budgetMin,
            budgetMax,
            category,
            proposalsCount: proposals.length,
        });

        // 1. BUDGET ANALYSIS
        const budgetBenchmark = await analyzeBudget(
            category,
            subcategory,
            budgetMin,
            budgetMax,
            jobType
        );

        if (budgetBenchmark) {
            if (budgetBenchmark.yourBudget < budgetBenchmark.avgBudget * 0.7) {
                insights.push({
                    type: 'budget_analysis',
                    title: 'Budget Below Market Average',
                    description: `Your budget is ${Math.round((1 - budgetBenchmark.yourBudget / budgetBenchmark.avgBudget) * 100)}% below average for this type of work. You may receive fewer quality proposals.`,
                    severity: 'warning',
                    actionable: true,
                });
                opportunityScore -= 15;
            } else if (budgetBenchmark.yourBudget > budgetBenchmark.avgBudget * 1.3) {
                insights.push({
                    type: 'budget_analysis',
                    title: 'Competitive Budget',
                    description: `Your budget is ${Math.round((budgetBenchmark.yourBudget / budgetBenchmark.avgBudget - 1) * 100)}% above average. This attracts premium talent!`,
                    severity: 'success',
                    actionable: false,
                });
                opportunityScore += 10;
            }
        }

        // 2. SKILL MATCH ANALYSIS
        const skillMatches = proposals.map(p => ({
            proposal: p,
            skillMatchScore: calculateSkillMatch(requiredSkills, p.freelancer.title, p.freelancer.bio),
        }));

        const avgSkillMatch = skillMatches.length > 0
            ? skillMatches.reduce((sum, m) => sum + m.skillMatchScore, 0) / skillMatches.length
            : 0;

        if (avgSkillMatch < 40 && requiredSkills.length > 0) {
            insights.push({
                type: 'skill_match',
                title: 'Limited Skill Matches',
                description: `Only ${Math.round(avgSkillMatch)}% of proposals match your required skills. Consider adjusting requirements or offering higher budget.`,
                severity: 'warning',
                actionable: true,
            });
            opportunityScore -= 10;
        } else if (avgSkillMatch > 75) {
            insights.push({
                type: 'skill_match',
                title: 'Strong Skill Alignment',
                description: `Proposals have strong skill alignment (${Math.round(avgSkillMatch)}% match). You're likely to find qualified candidates.`,
                severity: 'success',
                actionable: false,
            });
            opportunityScore += 15;
        }

        // 3. MARKET TIMING
        const proposalVelocity = calculateProposalVelocity(proposals);
        if (proposalVelocity.rate < 1) {
            insights.push({
                type: 'market_timing',
                title: 'Slow Proposal Rate',
                description: `Receiving fewer than 1 proposal per day. Consider boosting visibility or adjusting job requirements.`,
                severity: 'warning',
                actionable: true,
            });
            opportunityScore -= 8;
        } else if (proposalVelocity.rate > 3) {
            insights.push({
                type: 'market_timing',
                title: 'High Demand',
                description: `Strong interest with ${Math.round(proposalVelocity.rate)} proposals/day. Quick decision recommended!`,
                severity: 'success',
                actionable: false,
            });
            opportunityScore += 10;
        }

        // 4. PROPOSAL QUALITY ANALYSIS
        const qualityAnalysis = analyzeProposalQuality(proposals, jobData);
        if (qualityAnalysis.qualityScore < 50) {
            insights.push({
                type: 'proposal_quality',
                title: 'Mixed Proposal Quality',
                description: `Average proposal quality is ${Math.round(qualityAnalysis.qualityScore)}/100. Shortlist carefully or ask follow-up questions.`,
                severity: 'warning',
                actionable: false,
            });
        } else if (qualityAnalysis.qualityScore > 75) {
            insights.push({
                type: 'proposal_quality',
                title: 'High-Quality Proposals',
                description: `Receiving high-quality proposals (${Math.round(qualityAnalysis.qualityScore)}/100). You have good options to choose from.`,
                severity: 'success',
                actionable: false,
            });
            opportunityScore += 12;
        }

        // 5. SUCCESS PREDICTOR
        if (proposals.length > 0) {
            const scoredProposals = proposals
                .map(p => ({
                    proposal: p,
                    score: scoreProposal(
                        p,
                        budgetMin,
                        budgetMax,
                        parseInt(duration) || 14,
                        requiredSkills
                    ),
                }))
                .sort((a, b) => b.score - a.score);

            const topCandidate = scoredProposals[0];
            if (topCandidate && topCandidate.score > 75) {
                insights.push({
                    type: 'success_predictor',
                    title: 'Strong Match Available',
                    description: `Top candidate has ${topCandidate.score}/100 match score. High likelihood of successful collaboration.`,
                    severity: 'success',
                    actionable: true,
                });
                opportunityScore += 15;
            }
        }

        // Score top 3 proposals
        const finalScoredProposals = proposals
            .map(p => ({
                proposal: p,
                score: scoreProposal(
                    p,
                    budgetMin,
                    budgetMax,
                    parseInt(duration) || 14,
                    requiredSkills
                ),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.proposal);

        opportunityScore = Math.max(0, Math.min(100, opportunityScore));

        return {
            freelancerMatches: finalScoredProposals,
            budgetBenchmark: budgetBenchmark || null,
            insights,
            opportunityScore,
            averageResponseTime: calculateAverageResponseTime(proposals),
        };
    } catch (error) {
        console.error('Error generating AI recommendations:', error);
        return {
            freelancerMatches: proposals.slice(0, 3),
            budgetBenchmark: null,
            insights: [],
            opportunityScore: 50,
        };
    }
}

/**
 * Analyze budget against market benchmarks
 */
async function analyzeBudget(
    category?: string,
    subcategory?: string,
    budgetMin?: number,
    budgetMax?: number,
    jobType?: string
): Promise<BudgetBenchmark | null> {
    if (!budgetMin || !budgetMax || !category) return null;

    try {
        const yourBudget = (budgetMin + budgetMax) / 2;

        // Get market data for similar jobs
        const { data, error } = await supabase
            .from('jobs')
            .select('budget_min, budget_max')
            .eq('category', category)
            .eq('job_type', jobType || 'fixed_price')
            .gt('budget_min', 0)
            .limit(50);

        if (error || !data || data.length === 0) {
            return null;
        }

        const budgets = data
            .map(j => (j.budget_min + j.budget_max) / 2)
            .sort((a, b) => a - b);

        const avgBudget = budgets.reduce((a, b) => a + b, 0) / budgets.length;
        const minBudget = budgets[0];
        const maxBudget = budgets[budgets.length - 1];

        // Calculate percentile
        const positionPercentile = Math.round(
            (budgets.filter(b => b <= yourBudget).length / budgets.length) * 100
        );

        return {
            avgBudget: Math.round(avgBudget),
            minBudget: Math.round(minBudget),
            maxBudget: Math.round(maxBudget),
            yourBudget: Math.round(yourBudget),
            positionPercentile,
        };
    } catch (error) {
        console.error('Error analyzing budget:', error);
        return null;
    }
}

/**
 * Calculate proposal submission velocity
 */
function calculateProposalVelocity(proposals: Proposal[]) {
    if (proposals.length === 0) return { rate: 0 };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentProposals = proposals.filter(p => {
        const created = new Date(p.created_at);
        return created > oneWeekAgo;
    });

    const rate = (recentProposals.length / 7);
    return { rate };
}

/**
 * Analyze overall quality of proposals
 */
function analyzeProposalQuality(proposals: Proposal[], jobData: any): { qualityScore: number } {
    if (proposals.length === 0) return { qualityScore: 50 };

    let totalQuality = 0;

    for (const proposal of proposals) {
        let quality = 0;

        // Cover letter quality (30 points)
        const coverLetterLength = proposal.cover_letter?.length || 0;
        if (coverLetterLength > 200) quality += 30;
        else if (coverLetterLength > 100) quality += 20;
        else if (coverLetterLength > 50) quality += 10;

        // Attachment presence (20 points)
        if (proposal.attachments && proposal.attachments.length > 0) quality += 20;

        // Freelancer experience (30 points)
        if (proposal.freelancer.jobs_completed > 10) quality += 30;
        else if (proposal.freelancer.jobs_completed > 5) quality += 20;
        else if (proposal.freelancer.jobs_completed > 0) quality += 10;

        // Success rate (20 points)
        if (proposal.freelancer.success_rate > 95) quality += 20;
        else if (proposal.freelancer.success_rate > 80) quality += 15;
        else if (proposal.freelancer.success_rate > 60) quality += 10;

        totalQuality += quality;
    }

    const averageQuality = totalQuality / proposals.length;
    return { qualityScore: Math.round(Math.min(100, averageQuality)) };
}

/**
 * Calculate average response time from freelancers
 */
function calculateAverageResponseTime(proposals: Proposal[]): number {
    if (proposals.length === 0) return 0;

    // Placeholder: in production, would track actual response times
    // For now, estimate based on freelancer success rate (higher = faster)
    const avgResponseScore = proposals.reduce((sum, p) => sum + p.freelancer.success_rate, 0) / proposals.length;
    
    // Convert success rate to estimated hours (80%+ success = ~2 hours response)
    return Math.max(1, 24 - (avgResponseScore / 100) * 20);
}
