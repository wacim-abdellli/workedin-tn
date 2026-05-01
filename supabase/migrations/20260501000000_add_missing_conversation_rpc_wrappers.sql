CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1 UUID,
    user2 UUID
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $body
  SELECT public.get_or_create_conversation(user1, user2, NULL::uuid, NULL::text);
$body;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1 UUID,
    user2 UUID,
    p_scope TEXT
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $body
  SELECT public.get_or_create_conversation(user1, user2, NULL::uuid, p_scope);
$body;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, TEXT) TO authenticated;
