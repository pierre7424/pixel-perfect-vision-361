export type SpokenLanguage = {
  code: string;
  native: string;
  fr: string;
  en: string;
  zh: string;
  /** Speech recognition / translation coverage is unverified for this entry. */
  limited?: boolean;
};

export const SPOKEN_LANGUAGES: SpokenLanguage[] = [
  { code: "zh-TW", native: "中文（繁體）", fr: "Mandarin traditionnel", en: "Mandarin (Traditional)", zh: "中文（繁體）" },
  {
    code: "nan-TW",
    native: "台語",
    fr: "Taigi / taïwanais",
    en: "Taigi / Taiwanese Hokkien",
    zh: "台語（台灣閩南語）",
    limited: true,
  },
  { code: "en", native: "English", fr: "Anglais", en: "English", zh: "英語" },
  { code: "fr", native: "Français", fr: "Français", en: "French", zh: "法語" },
  { code: "ja", native: "日本語", fr: "Japonais", en: "Japanese", zh: "日語" },
  { code: "ko", native: "한국어", fr: "Coréen", en: "Korean", zh: "韓語" },
  { code: "es", native: "Español", fr: "Espagnol", en: "Spanish", zh: "西班牙語" },
  { code: "de", native: "Deutsch", fr: "Allemand", en: "German", zh: "德語" },
  { code: "it", native: "Italiano", fr: "Italien", en: "Italian", zh: "義大利語" },
  { code: "pt", native: "Português", fr: "Portugais", en: "Portuguese", zh: "葡萄牙語" },
  { code: "id", native: "Bahasa Indonesia", fr: "Indonésien", en: "Indonesian", zh: "印尼語" },
  { code: "vi", native: "Tiếng Việt", fr: "Vietnamien", en: "Vietnamese", zh: "越南語" },
  { code: "th", native: "ไทย", fr: "Thaï", en: "Thai", zh: "泰語" },
  { code: "ar", native: "العربية", fr: "Arabe", en: "Arabic", zh: "阿拉伯語" },
  { code: "hi", native: "हिन्दी", fr: "Hindi", en: "Hindi", zh: "印地語" },
  { code: "nl", native: "Nederlands", fr: "Néerlandais", en: "Dutch", zh: "荷蘭語" },
  { code: "pl", native: "Polski", fr: "Polonais", en: "Polish", zh: "波蘭語" },
  { code: "tr", native: "Türkçe", fr: "Turc", en: "Turkish", zh: "土耳其語" },
  { code: "ru", native: "Русский", fr: "Russe", en: "Russian", zh: "俄語" },
  { code: "uk", native: "Українська", fr: "Ukrainien", en: "Ukrainien", zh: "烏克蘭語" },
];

export const LANGUAGE_CODES = SPOKEN_LANGUAGES.map((l) => l.code);

export function findLanguage(code: string): SpokenLanguage | undefined {
  return SPOKEN_LANGUAGES.find((l) => l.code === code);
}

/** BCP-47 hint sent to the transcription model; omit for entries with no reliable code. */
export function transcriptionHint(code: string): string | undefined {
  if (code === "nan-TW") return undefined;
  return code;
}
