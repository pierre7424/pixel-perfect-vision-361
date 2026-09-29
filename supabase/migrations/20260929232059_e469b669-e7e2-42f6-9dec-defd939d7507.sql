CREATE TABLE public.conversation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  host_lang text NOT NULL,
  guest_lang text NOT NULL,
  geolocation_allowed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'waiting',
  revoked boolean NOT NULL DEFAULT false,
  guest_joined_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  speaker text NOT NULL,
  source_lang text NOT NULL,
  target_lang text NOT NULL,
  original_text text,
  translated_text text,
  state text NOT NULL DEFAULT 'processed',
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversation_messages_session_idx ON public.conversation_messages (session_id, created_at);
CREATE INDEX conversation_sessions_token_idx ON public.conversation_sessions (token);

GRANT ALL ON public.conversation_sessions TO service_role;
GRANT ALL ON public.conversation_messages TO service_role;

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no direct client access to sessions" ON public.conversation_sessions FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no direct client access to messages" ON public.conversation_messages FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);