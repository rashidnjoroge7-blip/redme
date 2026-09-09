-- RedNote Stage 3C: secure post moderation state and audit trail.
-- Existing posts remain publicly visible by default.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'published';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_moderation_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_moderation_status_check
  CHECK (moderation_status IN ('published', 'hidden'));

CREATE INDEX IF NOT EXISTS posts_moderation_status_created_at_idx
  ON public.posts (moderation_status, created_at DESC);

-- Replace the original permissive public-read policy so hidden posts are
-- excluded from normal client reads. SECURITY DEFINER/admin operations are
-- not subject to this RLS policy when executed by the function owner.
DROP POLICY IF EXISTS "posts are publicly readable" ON public.posts;

CREATE POLICY "published posts are publicly readable"
  ON public.posts
  FOR SELECT
  USING (moderation_status = 'published' OR public.is_admin_user());

CREATE TABLE IF NOT EXISTS public.post_moderation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('hide', 'restore')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_moderation_audit_post_created_idx
  ON public.post_moderation_audit (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS post_moderation_audit_actor_created_idx
  ON public.post_moderation_audit (actor_id, created_at DESC);

ALTER TABLE public.post_moderation_audit ENABLE ROW LEVEL SECURITY;

-- No client-facing audit policies: audit records are written by the secure
-- moderation RPC and are intentionally not exposed to normal clients.

CREATE OR REPLACE FUNCTION public.prevent_non_admin_moderation_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.moderation_status := 'published';
    ELSIF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
      RAISE EXCEPTION 'moderation_status may only be changed by an administrator';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_post_moderation_status ON public.posts;
CREATE TRIGGER protect_post_moderation_status
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_moderation_change();

CREATE OR REPLACE FUNCTION public.moderate_post(
  p_post_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
  current_status text;
  clean_reason text;
BEGIN
  actor := auth.uid();

  IF actor IS NULL OR NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'administrator authorization required';
  END IF;

  IF p_action NOT IN ('hide', 'restore') THEN
    RAISE EXCEPTION 'unsupported moderation action';
  END IF;

  clean_reason := NULLIF(left(btrim(coalesce(p_reason, '')), 1000), '');

  SELECT moderation_status
    INTO current_status
  FROM public.posts
  WHERE id = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post not found';
  END IF;

  IF p_action = 'hide' THEN
    IF current_status = 'hidden' THEN
      RETURN 'ALREADY_HIDDEN';
    END IF;

    UPDATE public.posts
    SET moderation_status = 'hidden', updated_at = now()
    WHERE id = p_post_id;
  ELSE
    IF current_status = 'published' THEN
      RETURN 'ALREADY_PUBLISHED';
    END IF;

    UPDATE public.posts
    SET moderation_status = 'published', updated_at = now()
    WHERE id = p_post_id;
  END IF;

  INSERT INTO public.post_moderation_audit (post_id, actor_id, action, reason)
  VALUES (p_post_id, actor, p_action, clean_reason);

  RETURN CASE WHEN p_action = 'hide' THEN 'HIDDEN' ELSE 'RESTORED' END;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_post(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.moderate_post(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.moderate_post(uuid, text, text) TO authenticated;
