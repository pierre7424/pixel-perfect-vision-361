ALTER TABLE public.conversation_messages ADD COLUMN IF NOT EXISTS display_name text;

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  role text NOT NULL DEFAULT 'guest',
  display_name text NOT NULL,
  lang text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_id)
);

CREATE INDEX IF NOT EXISTS conversation_participants_session_idx
  ON public.conversation_participants (session_id, last_seen_at);

GRANT ALL ON public.conversation_participants TO service_role;

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no direct client access to participants"
  ON public.conversation_participants FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);