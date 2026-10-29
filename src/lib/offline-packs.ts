/**
 * Offline language packs via the native ML Kit plugin (@capacitor-mlkit/translation)
 * when the site runs inside the Capacitor app. On the web, packs are unavailable
 * and translation falls back to the online service.
 */
type MlKitTranslation = {
  downloadModel(o: { language: string }): Promise<void>;
  deleteDownloadedModel(o: { language: string }): Promise<void>;
  getDownloadedModels(): Promise<{ languages: string[] }>;
  translate(o: { text: string; sourceLanguage: string; targetLanguage: string }): Promise<{ text: string }>;
};

function plugin(): MlKitTranslation | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } }).Capacitor;
  return (cap?.Plugins?.["Translation"] as MlKitTranslation | undefined) ?? null;
}

export function offlineSupported() {
  return plugin() !== null;
}

/** ML Kit uses bare ISO codes; Taigi has no offline model. */
export function mlKitCode(code: string): string | null {
  if (code === "nan-TW") return null;
  if (code.startsWith("zh")) return "zh";
  return code.split("-")[0] ?? null;
}

export async function downloadedPacks(): Promise<string[]> {
  const p = plugin();
  if (!p) return [];
  try {
    return (await p.getDownloadedModels()).languages ?? [];
  } catch {
    return [];
  }
}

export async function downloadPack(code: string) {
  const p = plugin();
  const c = mlKitCode(code);
  if (!p || !c) throw new Error("unsupported");
  await p.downloadModel({ language: c });
}

export async function deletePack(code: string) {
  const p = plugin();
  const c = mlKitCode(code);
  if (!p || !c) return;
  await p.deleteDownloadedModel({ language: c });
}

/** Returns null when either pack is missing so the caller can go online. */
export async function translateOffline(text: string, from: string, to: string): Promise<string | null> {
  const p = plugin();
  const s = mlKitCode(from);
  const t = mlKitCode(to);
  if (!p || !s || !t) return null;
  const have = await downloadedPacks();
  if (!have.includes(s) || !have.includes(t)) return null;
  return (await p.translate({ text, sourceLanguage: s, targetLanguage: t })).text;
}
