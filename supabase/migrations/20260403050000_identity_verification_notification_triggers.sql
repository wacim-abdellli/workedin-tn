-- Use the existing server-side notification helper for identity verification flows.
-- Also remove the accidental overloaded RPC introduced later.

DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.notify_identity_verification_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_language text := 'en';
    v_title text;
    v_body text;
    v_user_id uuid;
BEGIN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);

    SELECT COALESCE(preferred_language, 'en')
    INTO v_language
    FROM public.profiles
    WHERE id = v_user_id;

    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        v_title := CASE v_language
            WHEN 'ar' THEN 'تم استلام طلب التوثيق'
            WHEN 'fr' THEN 'Demande de verification recue'
            ELSE 'Identity verification request received'
        END;

        v_body := CASE v_language
            WHEN 'ar' THEN 'تم استلام طلب التحقق من الهوية بنجاح. فريقنا يراجع مستنداتك الآن.'
            WHEN 'fr' THEN 'Votre demande de verification d''identite a ete envoyee avec succes. Notre equipe examine maintenant vos documents.'
            ELSE 'Your identity verification request was submitted successfully. Our team is now reviewing your documents.'
        END;

        PERFORM public.create_notification(NEW.user_id, 'system', v_title, v_body, NEW.id, NULL);
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'approved' THEN
            v_title := CASE v_language
                WHEN 'ar' THEN 'تم قبول توثيق هويتك'
                WHEN 'fr' THEN 'Votre identite a ete verifiee'
                ELSE 'Your identity has been verified'
            END;

            v_body := CASE v_language
                WHEN 'ar' THEN 'تهانينا! تمت الموافقة على توثيق هويتك بنجاح ويمكنك الآن الاستفادة من جميع مزايا المنصة.'
                WHEN 'fr' THEN 'Felicitations ! Votre identite a ete verifiee avec succes et vous pouvez maintenant acceder a toutes les fonctionnalites de la plateforme.'
                ELSE 'Congratulations! Your identity was verified successfully and you can now access all platform features.'
            END;

            PERFORM public.create_notification(NEW.user_id, 'system', v_title, v_body, NEW.id, NULL);
            RETURN NEW;
        END IF;

        IF NEW.status IN ('rejected', 'requires_resubmit') THEN
            v_title := CASE v_language
                WHEN 'ar' THEN 'تم رفض طلب توثيق الهوية'
                WHEN 'fr' THEN 'Demande de verification rejetee'
                ELSE 'Identity verification request rejected'
            END;

            v_body := CASE v_language
                WHEN 'ar' THEN 'عذراً، تم رفض طلب توثيق الهوية. يرجى التأكد من وضوح الصور ثم إعادة التقديم.'
                WHEN 'fr' THEN 'Votre demande de verification d''identite a ete rejetee. Assurez-vous que les images sont claires puis renvoyez votre demande.'
                ELSE 'Your identity verification request was rejected. Please make sure the images are clear and submit again.'
            END;

            PERFORM public.create_notification(NEW.user_id, 'system', v_title, v_body, NEW.id, NULL);
            RETURN NEW;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_identity_verification_change ON public.identity_verifications;
CREATE TRIGGER trg_notify_identity_verification_change
    AFTER INSERT OR UPDATE ON public.identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_identity_verification_change();
