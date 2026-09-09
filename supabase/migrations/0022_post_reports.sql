-- RedNote Stage 4: user post reports and administrator resolution queue.

CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  resolution text,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_reports_status_created_idx
  ON public.post_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS post_reports_post_created_idx
  ON public.post_reports (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_reports_reporter_created_idx
  ON public.post_reports (reporter_id, created_at DESC);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can create post reports"
  ON public.post_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "users can view their own post reports"
  ON public.post_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR public.is_admin_user());

CREATE OR REPLACE FUNCTION public.report_post(
  p_post_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reporter uuid;
  report_id uuid;
  clean_reason text;
  clean_details text;
BEGIN
  reporter := auth.uid();
  IF reporter IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  clean_reason := NULLIF(left(btrim(coalesce(p_reason, '')), 120), '');
  clean_details := NULLIF(left(btrim(coalesce(p_details, '')), 2000), '');

  IF clean_reason IS NULL THEN
    RAISE EXCEPTION 'report reason is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = p_post_id) THEN
    RAISE EXCEPTION 'post not found';
  END IF;

  INSERT INTO public.post_reports (post_id, reporter_id, reason, details)
  VALUES (p_post_id, reporter, clean_reason, clean_details)
  RETURNING id INTO report_id;

  RETURN report_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_post_report(
  p_report_id uuid,
  p_status text,
  p_resolution text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
  clean_resolution text;
BEGIN
  actor := auth.uid();
  IF actor IS NULL OR NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'administrator authorization required';
  END IF;

  IF p_status NOT IN ('under_review', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'unsupported report status';
  END IF;

  clean_resolution := NULLIF(left(btrim(coalesce(p_resolution, '')), 1000), '');

  UPDATE public.post_reports
  SET status = p_status,
      resolution = clean_resolution,
      resolved_by = CASE WHEN p_status IN ('resolved', 'dismissed') THEN actor ELSE resolved_by END,
      resolved_at = CASE WHEN p_status IN ('resolved', 'dismissed') THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'report not found';
  END IF;

  RETURN p_status;
END;
$$;

REVOKE ALL ON FUNCTION public.report_post(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_post(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.report_post(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.resolve_post_report(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_post_report(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_post_report(uuid, text, text) TO authenticated;
