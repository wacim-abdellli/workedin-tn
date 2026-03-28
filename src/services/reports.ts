import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
export type ReportedType = 'job' | 'user' | 'proposal';

export interface Report {
    id: string;
    reporter_id: string;
    reported_type: ReportedType;
    reported_id: string;
    reason: string;
    status: ReportStatus;
    created_at: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    reporter: { full_name: string; email: string } | null;
}

const REPORT_RATE_LIMIT_MESSAGE = 'You can submit maximum 5 reports per hour';

function normalizeReportError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Rate limit exceeded: max 5 reports per hour')) {
        return new Error(REPORT_RATE_LIMIT_MESSAGE);
    }

    if (message.includes('no_self_reporting') || message.includes('You cannot report your own content.')) {
        return new Error('You cannot report your own content.');
    }

    return error instanceof Error ? error : new Error(message);
}

export async function getReports(status?: ReportStatus): Promise<Report[]> {
    const client = supabase;
    let query = client
        .from('reports')
        .select('id,reporter_id,reported_type,reported_id,reason,status,created_at,reviewed_by,reviewed_at,reporter:profiles!reporter_id(full_name,email)')
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await supabaseWithRetry(() => query);
    if (error) throw new Error(`Failed to fetch reports: ${error.message}`);
    return (data ?? []) as unknown as Report[];
}

export async function updateReportStatus(
    id: string,
    status: ReportStatus,
    reviewedBy: string
): Promise<void> {
    const client = supabase;
    const { error } = await supabaseWithRetry(() =>
        client
            .from('reports')
            .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
            .eq('id', id)
    );
    if (error) throw new Error(`Failed to update report: ${error.message}`);
}

export async function submitReport(
    reporterId: string,
    reportedType: ReportedType,
    reportedId: string,
    reason: string
): Promise<void> {
    // Cannot report yourself
    if (reportedType === 'user' && reporterId === reportedId) {
        throw new Error('You cannot report your own content.');
    }

    try {
        const { error } = await supabaseWithRetry(() =>
            supabase
                .from('reports')
                .insert({ reporter_id: reporterId, reported_type: reportedType, reported_id: reportedId, reason })
        );

        if (error) {
            throw error;
        }
    } catch (error) {
        throw normalizeReportError(error);
    }
}
