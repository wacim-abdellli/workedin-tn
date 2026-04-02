CREATE OR REPLACE FUNCTION get_total_unread_count(custom_user_id uuid) RETURNS integer AS $$ 
BEGIN 
    RETURN (SELECT SUM(CASE WHEN participant_1 = custom_user_id THEN unread_count_1 ELSE unread_count_2 END) FROM conversations WHERE participant_1 = custom_user_id OR participant_2 = custom_user_id); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;