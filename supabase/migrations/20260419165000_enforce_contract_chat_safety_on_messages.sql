CREATE OR REPLACE FUNCTION public.enforce_contract_chat_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_content text := COALESCE(NEW.content, '');
BEGIN
    IF NEW.contract_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_content ~* '(?:https?:\/\/)?(?:wa\.me|whatsapp|t\.me|telegram|discord(?:app)?|instagram|\big\b)'
        OR v_content ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
        OR v_content ~ '(?:\+?\d[\d\s().-]{7,}\d)'
    THEN
        RAISE EXCEPTION 'Contract chat safety violation: direct contact sharing is not allowed in protected contract conversations';
    END IF;

    IF v_content ~* '\b(pay me|send (me )?money|bank transfer|wire transfer|western union|moneygram)\b'
        OR v_content ~* '\b(crypto|bitcoin|usdt|binance|wallet address|outside the platform|off platform|direct payment)\b'
        OR v_content ~* '\b(d17|rib|iban|swift)\b'
    THEN
        RAISE EXCEPTION 'Contract chat safety violation: off-platform payment requests are not allowed in protected contract conversations';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_contract_chat_safety ON public.messages;
CREATE TRIGGER trg_enforce_contract_chat_safety
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_contract_chat_safety();

COMMENT ON FUNCTION public.enforce_contract_chat_safety IS 'Blocks contact sharing and off-platform payment attempts in protected contract conversations at insert time.';
