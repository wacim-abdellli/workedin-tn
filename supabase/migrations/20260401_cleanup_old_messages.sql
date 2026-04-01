CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages
    WHERE created_at < NOW() - INTERVAL '6 months'
      AND is_read = true;

    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- If using pg_cron (ensure the extension is enabled in Supabase)
-- SELECT cron.schedule('cleanup-task', '0 2 * * 0', $$SELECT cleanup_old_messages()$$);
