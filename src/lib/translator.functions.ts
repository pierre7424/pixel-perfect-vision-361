import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { LANGUAGE_CODES, findLanguage } from "./languages";

const Input = z.object({
  text: z.string().trim().min(1).max(2000),
  from: z.enum(LANGUAGE_CODES as [string, ...string[]]),
  to: z.enum(LANGUAGE_CODES as [string, ...string[]]),
});

/** Online translation used when no offline pack is available on the device. */
export const quickTranslate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input as z.infer<typeof Input>)
  .handler(async ({ data }) => {
    const parsed = Input.safeParse(data);
    if (!parsed.success) return { ok: false as const, code: "invalid" };
    const { text, from, to } = parsed.data;
    if (from === to) return { ok: true as const, text };
    const { translateText, AiError } = await import("./ai.server");
    try {
      const out = await translateText(text, findLanguage(from)?.en ?? from, findLanguage(to)?.en ?? to);
      return { ok: true as const, text: out };
    } catch (e) {
      return { ok: false as const, code: e instanceof AiError ? e.code : "unavailable" };
    }
  });
