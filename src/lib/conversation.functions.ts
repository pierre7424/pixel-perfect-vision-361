import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { LANGUAGE_CODES, findLanguage, transcriptionHint } from "./languages";

export const SESSION_MINUTES = 30;

export type Role = "host" | "guest";

export type SessionPublic = {
  token: string;
  hostLang: string;
  guestLang: string;
  geolocationAllowed: boolean;
  status: "waiting" | "active" | "ended";
  guestJoined: boolean;
  expiresAt: string;
  createdAt: string;
};

export type MessagePublic = {
  id: string;
  speaker: Role;
  sourceLang: string;
  targetLang: string;
  originalText: string | null;
  translatedText: string | null;
  state: "processed" | "error";
  errorCode: string | null;
  createdAt: string;
};

export type FailureCode =
  | "not_found"
  | "expired"
  | "revoked"
  | "ended"
  | "transcription_failed"
  | "translation_failed"
  | "rate_limited"
  | "unavailable"
  | "audio_too_short";

export type Failure = { ok: false; code: FailureCode };

const fail = (code: FailureCode): Failure => ({ ok: false, code });

const tokenSchema = z.string().min(10).max(64);
const langSchema = z.string().refine((v) => LANGUAGE_CODES.includes(v), "unsupported language");

function makeToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

type SessionRow = {
  id: string;
  token: string;
  host_lang: string;
  guest_lang: string;
  geolocation_allowed: boolean;
  status: string;
  revoked: boolean;
  guest_joined_at: string | null;
  expires_at: string;
  created_at: string;
};

function toPublic(row: SessionRow): SessionPublic {
  return {
    token: row.token,
    hostLang: row.host_lang,
    guestLang: row.guest_lang,
    geolocationAllowed: row.geolocation_allowed,
    status: row.status as SessionPublic["status"],
    guestJoined: row.guest_joined_at != null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadSession(
  token: string,
  opts: { allowEnded?: boolean } = {},
): Promise<{ ok: true; row: SessionRow } | Failure> {
  const db = await admin();
  const { data, error } = await db
    .from("conversation_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[session] load failed", error);
    return fail("unavailable");
  }
  if (!data) return fail("not_found");

  const row = data as SessionRow;
  if (row.revoked) return fail("revoked");
  if (new Date(row.expires_at).getTime() < Date.now()) return fail("expired");
  if (row.status === "ended" && !opts.allowEnded) return fail("ended");
  return { ok: true, row };
}

/** Create a session — only ever called after the host's manual confirmation. */
export const createSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        hostLang: langSchema,
        guestLang: langSchema,
        geolocationAllowed: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true; session: SessionPublic } | Failure> => {
    const db = await admin();
    const { data: row, error } = await db
      .from("conversation_sessions")
      .insert({
        token: makeToken(),
        host_lang: data.hostLang,
        guest_lang: data.guestLang,
        geolocation_allowed: data.geolocationAllowed,
        expires_at: new Date(Date.now() + SESSION_MINUTES * 60_000).toISOString(),
      })
      .select("*")
      .single();

    if (error || !row) {
      console.error("[session] create failed", error);
      return fail("unavailable");
    }
    return { ok: true, session: toPublic(row as SessionRow) };
  });

export const getSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true; session: SessionPublic } | Failure> => {
    const res = await loadSession(data.token, { allowEnded: true });
    if (!res.ok) return res;
    return { ok: true, session: toPublic(res.row) };
  });

export const joinSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: tokenSchema, guestLang: langSchema.optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true; session: SessionPublic } | Failure> => {
    const res = await loadSession(data.token);
    if (!res.ok) return res;
    const db = await admin();
    const { data: updated, error } = await db
      .from("conversation_sessions")
      .update({
        guest_joined_at: res.row.guest_joined_at ?? new Date().toISOString(),
        status: "active",
        ...(data.guestLang ? { guest_lang: data.guestLang } : {}),
      })
      .eq("id", res.row.id)
      .select("*")
      .single();

    if (error || !updated) {
      console.error("[session] join failed", error);
      return fail("unavailable");
    }
    return { ok: true, session: toPublic(updated as SessionRow) };
  });

export const endSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true } | Failure> => {
    const db = await admin();
    const { error } = await db
      .from("conversation_sessions")
      .update({ status: "ended", revoked: true, ended_at: new Date().toISOString() })
      .eq("token", data.token);
    if (error) {
      console.error("[session] end failed", error);
      return fail("unavailable");
    }
    return { ok: true };
  });

/** Revoke the current link and issue a fresh one for the same language pair. */
export const regenerateLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true; session: SessionPublic } | Failure> => {
    const res = await loadSession(data.token, { allowEnded: true });
    if (!res.ok) return res;
    const db = await admin();

    await db
      .from("conversation_sessions")
      .update({ revoked: true, status: "ended" })
      .eq("id", res.row.id);

    const { data: fresh, error } = await db
      .from("conversation_sessions")
      .insert({
        token: makeToken(),
        host_lang: res.row.host_lang,
        guest_lang: res.row.guest_lang,
        geolocation_allowed: res.row.geolocation_allowed,
        expires_at: new Date(Date.now() + SESSION_MINUTES * 60_000).toISOString(),
      })
      .select("*")
      .single();

    if (error || !fresh) {
      console.error("[session] regenerate failed", error);
      return fail("unavailable");
    }
    return { ok: true, session: toPublic(fresh as SessionRow) };
  });

export const listMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: tokenSchema, since: z.string().optional() }).parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; session: SessionPublic; messages: MessagePublic[] } | Failure> => {
      const res = await loadSession(data.token, { allowEnded: true });
      if (!res.ok) return res;
      const db = await admin();

      let query = db
        .from("conversation_messages")
        .select("*")
        .eq("session_id", res.row.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data.since) query = query.gt("created_at", data.since);

      const { data: rows, error } = await query;
      if (error) {
        console.error("[messages] list failed", error);
        return fail("unavailable");
      }

      return {
        ok: true,
        session: toPublic(res.row),
        messages: (rows ?? []).map((m) => ({
          id: m.id as string,
          speaker: m.speaker as Role,
          sourceLang: m.source_lang as string,
          targetLang: m.target_lang as string,
          originalText: m.original_text as string | null,
          translatedText: m.translated_text as string | null,
          state: m.state as MessagePublic["state"],
          errorCode: m.error_code as string | null,
          createdAt: m.created_at as string,
        })),
      };
    },
  );

/** Transcribe + translate one push-to-talk utterance and store it. */
export const sendUtterance = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d)
  .handler(async ({ data: raw }): Promise<{ ok: true; message: MessagePublic } | Failure> => {
    const parsed = z
      .object({
        token: tokenSchema,
        role: z.enum(["host", "guest"]).catch("guest"),
        audioBase64: z.string().max(9_000_000),
        mimeType: z.string().max(80).catch("audio/webm"),
      })
      .safeParse(raw);
    if (!parsed.success) return { ok: false, code: "unavailable" };
    const data = parsed.data;
    if (data.audioBase64.length < 100) return { ok: false, code: "audio_too_short" };
    const res = await loadSession(data.token);
    if (!res.ok) return res;
    const row = res.row;

    const sourceLang = data.role === "host" ? row.host_lang : row.guest_lang;
    const targetLang = data.role === "host" ? row.guest_lang : row.host_lang;

    const { transcribeAudio, translateText, AiError } = await import("./ai.server");
    const db = await admin();
    const sourceMeta = findLanguage(sourceLang);
    const targetMeta = findLanguage(targetLang);

    let original: string;
    try {
      original = await transcribeAudio(
        data.audioBase64,
        data.mimeType,
        transcriptionHint(sourceLang),
      );
    } catch (err) {
      const code = (err instanceof AiError ? err.code : "transcription_failed") as FailureCode;
      console.error("[utterance] transcription failed", err);
      await db.from("conversation_messages").insert({
        session_id: row.id,
        speaker: data.role,
        source_lang: sourceLang,
        target_lang: targetLang,
        state: "error",
        error_code: code,
      });
      return fail(code);
    }

    let translated: string | null = null;
    let errorCode: string | null = null;
    try {
      translated = await translateText(
        original,
        `${sourceMeta?.en ?? sourceLang} (${sourceLang})`,
        `${targetMeta?.en ?? targetLang} (${targetLang})`,
      );
    } catch (err) {
      errorCode = err instanceof AiError ? err.code : "translation_failed";
      console.error("[utterance] translation failed", err);
    }

    const { data: inserted, error } = await db
      .from("conversation_messages")
      .insert({
        session_id: row.id,
        speaker: data.role,
        source_lang: sourceLang,
        target_lang: targetLang,
        original_text: original,
        translated_text: translated,
        state: errorCode ? "error" : "processed",
        error_code: errorCode,
      })
      .select("*")
      .single();

    if (error || !inserted) {
      console.error("[utterance] insert failed", error);
      return fail("unavailable");
    }

    return {
      ok: true,
      message: {
        id: inserted.id as string,
        speaker: data.role,
        sourceLang,
        targetLang,
        originalText: original,
        translatedText: translated,
        state: errorCode ? "error" : "processed",
        errorCode,
        createdAt: inserted.created_at as string,
      },
    };
  });
