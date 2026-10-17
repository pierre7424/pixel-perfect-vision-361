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

/** Best supported spoken language from the browser preferences (client-only). */
export function detectBrowserSpoken(): string | null {
  if (typeof navigator === "undefined") return null;
  const prefs = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  for (const p of prefs) {
    const c = p.toLowerCase();
    if (c.startsWith("nan")) return "nan-TW";
    if (c.startsWith("zh")) return "zh-TW";
    const base = c.split("-")[0];
    const hit = SPOKEN_LANGUAGES.find((l) => l.code === base);
    if (hit) return hit.code;
  }
  return null;
}

/** BCP-47 hint sent to the transcription model; omit for entries with no reliable code. */
export function transcriptionHint(code: string): string | undefined {
  if (code === "nan-TW") return undefined;
  return code;
}

const QR_INVITATIONS: Record<string, string> = {
  "zh-TW": "掃描 QR code 即可加入對話。你們可以各自說自己的語言：不需要帳號，也不需要安裝應用程式。這是臨時連結，只有在你同意後才會使用麥克風。",
  "nan-TW": "掃 QR code 就會當加入對話。逐家會使家己的語言講話：免帳號，嘛免安裝應用程式。這是暫時的連結，愛你同意了後才會使用麥克風。",
  en: "Scan the QR code to join the conversation. Each person can speak their own language—no account or app installation is required. The link is temporary, and your microphone is only used with your permission.",
  fr: "Scannez le QR code pour rejoindre la conversation. Chacun peut parler sa langue, sans compte ni application à installer. Le lien est temporaire et votre micro ne sera utilisé qu'après votre accord.",
  ja: "QRコードを読み取ると会話に参加できます。それぞれ自分の言語で話せます。アカウント登録やアプリのインストールは不要です。リンクは一時的なもので、マイクは同意した場合にのみ使用されます。",
  ko: "QR 코드를 스캔하여 대화에 참여하세요. 각자 자신의 언어로 말할 수 있으며 계정이나 앱 설치가 필요하지 않습니다. 링크는 임시로 사용되며 마이크는 동의한 경우에만 사용됩니다.",
  es: "Escanea el código QR para unirte a la conversación. Cada persona puede hablar en su idioma, sin crear una cuenta ni instalar una aplicación. El enlace es temporal y el micrófono solo se utilizará con tu permiso.",
  de: "Scannen Sie den QR-Code, um dem Gespräch beizutreten. Jeder kann in seiner eigenen Sprache sprechen – ohne Konto und ohne App-Installation. Der Link ist zeitlich begrenzt und Ihr Mikrofon wird nur mit Ihrer Zustimmung verwendet.",
  it: "Scansiona il codice QR per partecipare alla conversazione. Ognuno può parlare nella propria lingua, senza account né applicazioni da installare. Il link è temporaneo e il microfono verrà usato solo con il tuo consenso.",
  pt: "Leia o código QR para entrar na conversa. Cada pessoa pode falar no seu idioma, sem conta nem aplicação para instalar. O link é temporário e o microfone só será utilizado com a sua autorização.",
  id: "Pindai kode QR untuk bergabung dalam percakapan. Setiap orang dapat berbicara dalam bahasanya sendiri tanpa akun atau memasang aplikasi. Tautan ini bersifat sementara dan mikrofon hanya digunakan setelah Anda memberi izin.",
  vi: "Quét mã QR để tham gia cuộc trò chuyện. Mỗi người có thể nói ngôn ngữ của mình mà không cần tài khoản hay cài đặt ứng dụng. Liên kết chỉ dùng tạm thời và micrô chỉ được sử dụng khi bạn đồng ý.",
  th: "สแกนคิวอาร์โค้ดเพื่อเข้าร่วมการสนทนา แต่ละคนสามารถพูดภาษาของตนเองได้ โดยไม่ต้องมีบัญชีหรือติดตั้งแอป ลิงก์นี้เป็นลิงก์ชั่วคราว และไมโครโฟนจะใช้เมื่อคุณอนุญาตเท่านั้น",
  ar: "امسح رمز QR للانضمام إلى المحادثة. يمكن لكل شخص التحدث بلغته، من دون حساب أو تثبيت تطبيق. الرابط مؤقت، ولن يُستخدم الميكروفون إلا بعد موافقتك.",
  hi: "बातचीत में शामिल होने के लिए QR कोड स्कैन करें। हर व्यक्ति अपनी भाषा में बोल सकता है—किसी खाते या ऐप इंस्टॉल करने की ज़रूरत नहीं है। लिंक अस्थायी है और माइक्रोफ़ोन केवल आपकी अनुमति से इस्तेमाल होगा।",
  nl: "Scan de QR-code om deel te nemen aan het gesprek. Iedereen kan zijn eigen taal spreken, zonder account of app-installatie. De link is tijdelijk en uw microfoon wordt alleen met uw toestemming gebruikt.",
  pl: "Zeskanuj kod QR, aby dołączyć do rozmowy. Każda osoba może mówić w swoim języku — bez konta i instalowania aplikacji. Link jest tymczasowy, a mikrofon zostanie użyty tylko za Twoją zgodą.",
  tr: "Konuşmaya katılmak için QR kodunu tarayın. Herkes kendi dilinde konuşabilir; hesap açmanız veya uygulama yüklemeniz gerekmez. Bağlantı geçicidir ve mikrofonunuz yalnızca izninizle kullanılır.",
  ru: "Отсканируйте QR-код, чтобы присоединиться к разговору. Каждый может говорить на своём языке — без учётной записи и установки приложения. Ссылка временная, а микрофон используется только с вашего разрешения.",
  uk: "Відскануйте QR-код, щоб приєднатися до розмови. Кожен може говорити своєю мовою — без облікового запису та встановлення застосунку. Посилання тимчасове, а мікрофон використовується лише з вашого дозволу.",
};

/** Reassurance shown beside the QR code in the guest's selected spoken language. */
export function qrInvitation(code: string): string {
  return QR_INVITATIONS[code] ?? QR_INVITATIONS["en"] ?? "Scan the QR code to join.";
}
