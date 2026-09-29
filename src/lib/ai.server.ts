/**
 * Server-only calls to the Lovable AI Gateway.
 * Provider keys never leave the server.
 */

const GATEWAY = "https://ai.gateway.lovable.dev";
const TRANSCRIBE_MODEL = "google/gemini-3.5-transcribe";
const TRANSLATE_MODEL = "openai/gpt-6-astra";

export class AiError extends Error {
  constructor(
    public code: "transcription_failed" | "translation_failed" | "rate_limited" | "unavailable",
    message: string,
  ) {
    super(message);
  }
}

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError("unavailable", "Missing LOVABLE_API_KEY");
  return key;
}

function mapStatus(status: number, body: string): AiError {
  if (status === 429) return new AiError("rate_limited", body);
  if (status === 402 || status === 403) return new AiError("unavailable", body);
  return new AiError("unavailable", `HTTP ${status}: ${body}`);
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  languageHint?: string,
): Promise<string> {
  const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  if (bytes.byteLength < 1200) throw new AiError("transcription_failed", "audio too short");

  const form = new FormData();
  // Gemini transcription rejects video/* parts; MediaRecorder often labels audio as video/webm.
  const safeMime = mimeType.startsWith("audio/") ? mimeType : "audio/webm";
  form.append("file", new Blob([bytes as unknown as BlobPart], { type: safeMime }), "speech.webm");
  form.append("model", TRANSCRIBE_MODEL);
  if (languageHint) form.append("language", languageHint);

  const res = await fetch(`${GATEWAY}/v1/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[transcribe] ${res.status}: ${body}`);
    if (res.status === 400) throw new AiError("transcription_failed", body);
    throw mapStatus(res.status, body);
  }

  const data = (await res.json()) as { text?: string };
  const text = (data.text ?? "").trim();
  if (!text) throw new AiError("transcription_failed", "empty transcript");
  return text;
}

export async function translateText(
  text: string,
  sourceLabel: string,
  targetLabel: string,
): Promise<string> {
  const res = await fetch(`${GATEWAY}/v1/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({
      model: TRANSLATE_MODEL,
      store: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: [
            "You translate one spoken utterance for a live face-to-face conversation.",
            `Source language: ${sourceLabel}. Target language: ${targetLabel}.`,
            "Output ONLY the translation in the target language.",
            "Keep the speaker's register and brevity. Do not add notes, quotes or explanations.",
            "If the utterance is already in the target language, output it unchanged.",
          ].join(" "),
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[translate] ${res.status}: ${body}`);
    throw mapStatus(res.status, body);
  }

  const data = (await res.json()) as {
    output?: { type?: string; content?: { type?: string; text?: string }[] }[];
  };
  const out = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("")
    .trim();

  if (!out) throw new AiError("translation_failed", "empty translation");
  return out;
}
