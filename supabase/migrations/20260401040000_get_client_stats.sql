CREATE OR REPLACE FUNCTION get_client_stats_v2(p_client_id uuid) RETURNS TABLE(job_count integer, total_spent numeric, avg_rating numeric) AS $$ 
SELECT 
    (SELECT COUNT(*) FROM jobs WHERE client_id = p_client_id)::int, 
    COALESCE((SELECT SUM(amount) FROM contracts WHERE client_id = p_client_id AND status = 'completed'), 0), 
    COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewee_id = p_client_id), 0) 
$$ LANGUAGE SQL IMMUTABLE;