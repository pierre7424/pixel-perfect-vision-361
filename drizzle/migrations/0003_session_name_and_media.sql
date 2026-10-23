ALTER TABLE public.conversation_sessions ADD COLUMN name text;
ALTER TABLE public.conversation_sessions ADD COLUMN unlimited boolean NOT NULL DEFAULT false;
ALTER TABLE public.conversation_messages ADD COLUMN media_path text;
ALTER TABLE public.conversation_messages ADD COLUMN media_type text;