import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiLocale = "fr" | "en" | "zh";

export const UI_LOCALES: { code: UiLocale; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "zh", label: "繁體中文" },
];

const fr = {
  brand: "Deux voix",
  nav: {
    home: "Accueil",
    start: "Commencer",
    join: "Rejoindre",
    privacy: "Confidentialité",
    accessibility: "Accessibilité",
    interfaceLanguage: "Langue de l'interface",
    reduceMotion: "Réduire les animations",
  },
  home: {
    overline: "Une conversation. Deux langues. Un lien.",
    title: "Parlez chacun votre langue.",
    subtitle:
      "Créez une session, partagez un QR temporaire et échangez vocalement avec une traduction affichée. Aucun compte obligatoire pour essayer.",
    ctaPrimary: "Commencer une conversation",
    ctaSecondary: "Rejoindre une conversation",
    reassurance:
      "Vous choisissez les langues et autorisez le micro uniquement quand vous décidez de parler. La localisation est facultative.",
    privacyNote:
      "Les données traitées, leur durée de conservation et le fournisseur de traduction seront indiqués avant le démarrage.",
    stepsTitle: "Trois étapes",
    step1: "Choisissez vos langues",
    step2: "Partagez le QR",
    step3: "Parlez à tour de rôle",
    step1Text: "La vôtre et celle de votre interlocuteur, confirmées avant toute création de session.",
    step2Text: "Un lien temporaire à scanner. Pas de Bluetooth, pas d'installation, pas de compte.",
    step3Text: "Maintenez le bouton pour parler, relâchez pour envoyer. L'original et la traduction s'affichent.",
    howTitle: "Comment ça marche ?",
    howText:
      "Chaque prise de parole est transcrite puis traduite. L'original reste visible à côté de la traduction : ce sont des traductions assistées, pas une garantie d'exactitude.",
    exampleOriginal: "Original (français)",
    exampleOriginalText: "Excusez-moi, où se trouve la station la plus proche ?",
    exampleTranslated: "Traduction (中文（繁體）)",
    exampleTranslatedText: "不好意思，請問最近的車站在哪裡？",
    trustTitle: "Ce que nous vous garantissons",
    trust1Title: "Consentement micro explicite",
    trust1Text: "Le micro n'est jamais activé automatiquement, et un refus du navigateur est géré clairement.",
    trust2Title: "Session temporaire",
    trust2Text: "Le lien expire, peut être régénéré ou annulé à tout moment par la personne qui a créé la session.",
    trust3Title: "Fin de session claire",
    trust3Text: "Terminer la conversation arrête les échanges et invalide le lien partagé.",
    languagesNote:
      "Langues disponibles selon le navigateur et le fournisseur sélectionné. Testez une conversation traduite avant de compter dessus.",
  },
  create: {
    title: "Vous créez la session.",
    step: "Étape",
    of: "sur",
    q1: "Quelle langue parlerez-vous ?",
    q2: "Quelle langue parlera votre interlocuteur ?",
    searchPlaceholder: "Rechercher une langue…",
    zhTwTitle: "Le mandarin traditionnel (zh-TW) vous convient-il ?",
    zhTwText:
      "C'est le choix recommandé par défaut. Le taigi (taïwanais) est proposé séparément : ce n'est pas un équivalent automatique de « taïwanais ».",
    zhTwAccept: "Oui, garder le mandarin traditionnel",
    zhTwChange: "Choisir une autre langue",
    limitedWarning:
      "Disponibilité limitée : la reconnaissance vocale et la traduction pour cette langue dépendent du fournisseur et ne sont pas garanties.",
    next: "Continuer",
    back: "Retour",
    geoTitle: "Autoriser votre localisation ? (Facultatif)",
    geoText:
      "Elle peut aider à suggérer un contexte ou des langues pertinentes. Elle ne démarre pas le micro et vous pouvez continuer sans l'autoriser.",
    geoAllow: "Autoriser la localisation",
    geoSkip: "Continuer sans localisation",
    geoDenied: "Localisation non autorisée. Vous pouvez continuer normalement.",
    geoGranted: "Localisation autorisée (zone approximative, non conservée).",
    confirmTitle: "Confirmation",
    youSpeak: "Vous parlerez",
    partnerSpeaks: "Votre interlocuteur parlera",
    geolocation: "Localisation",
    allowed: "autorisée",
    notAllowed: "non autorisée",
    expiry: "Expiration prévue",
    minutes: "minutes",
    hours: "heures",
    dataNote:
      "Votre voix est transcrite puis traduite par un fournisseur tiers. Le texte original et traduit est conservé le temps de la session, puis le lien expire.",
    confirm: "Confirmer et créer la session",
    edit: "Modifier",
    creating: "Création…",
  },
  qr: {
    title: "Votre session est prête",
    invite:
      "Scannez ce QR pour rejoindre la conversation. Parlez chacun votre langue : maintenez le bouton pour parler, relâchez pour envoyer, puis l'original et la traduction s'afficheront à l'écran. Votre micro ne sera utilisé qu'après votre accord.",
    short: "Scannez pour parler chacun votre langue. Session temporaire — aucun compte requis.",
    copy: "Copier le lien",
    copied: "Lien copié",
    share: "Partager le lien",
    waiting: "En attente de l'interlocuteur",
    joined: "Votre interlocuteur a rejoint la session",
    cancel: "Annuler la session",
    regenerate: "Régénérer un lien",
    regenerateNote: "L'ancien lien devient invalide.",
    enter: "Entrer dans la conversation",
    expiresIn: "Expire dans",
  },
  join: {
    title: "Vous êtes invité à une conversation",
    languages: "Langues configurées",
    session: "Session",
    expires: "Expiration",
    chooseYourLang: "Confirmez la langue que vous parlerez",
    chooseNote: "Votre langue n'est jamais déduite de votre position.",
    micTitle: "Pour parler, autorisez l'accès au microphone.",
    micText: "Vous contrôlez chaque prise de parole avec le bouton.",
    micAllow: "Autoriser le micro",
    micLater: "Pas maintenant",
    joinCta: "Rejoindre la conversation",
    nameTitle: "Comment souhaitez-vous apparaître ?",
    nameLabel: "Votre pseudo",
    namePlaceholder: "Ex. Camille",
    nameNote: "Ce nom s'affiche à côté de vos messages pendant la session.",
    nameContinue: "Continuer",
    readOnly:
      "Sans micro, vous pouvez lire les messages reçus. Pour parler, autorisez le micro depuis les réglages de votre navigateur.",
    leave: "Quitter la session",
  },

  session: {
    you: "Vous",
    partner: "Interlocuteur",
    end: "Terminer",
    ended: "Session terminée",
    connected: "Connecté",
    reconnecting: "Connexion interrompue",
    original: "Original",
    translation: "Traduction",
    holdToTalk: "Maintenir pour parler",
    releaseToSend: "Relâchez pour envoyer",
    processing: "Traitement…",
    empty: "Aucun message pour l'instant. Maintenez le bouton et parlez.",
    micRequest: "Autoriser le micro",
    modeVoice: "Micro",
    collapse: "Réduire",
    expand: "Afficher plus",
    modeText: "Clavier",
    typePlaceholder: "Écrivez votre message…",
    send: "Envoyer",
    retry: "Réessayer",
    repeat: "Répéter",
    assistedNote: "Traductions assistées — l'original reste affiché.",
    waitingPartner: "En attente de votre interlocuteur…",
    expiresIn: "Expire dans",
    showQr: "Inviter d'autres personnes",
    showQrNote: "Chaque nouvelle personne parlera la langue invitée de la session.",
    present: "personnes présentes",
    presentOne: "personne présente",
    participants: "Participants",
    notify: "Notifications",
    notifyOn: "Notifications activées",
    notifyDenied: "Notifications bloquées par votre navigateur.",
    notifyTab: "Ouvrez le site dans un onglet à part pour activer les notifications.",
    notifyHelp:
      "Pour recevoir les alertes, autorisez les notifications pour ce site dans les réglages de votre navigateur (icône à gauche de l'adresse).",

    newMessage: "Nouveau message",
  },

  errors: {
    linkGone: "Ce lien n'est plus disponible. Demandez à l'initiateur de créer une nouvelle session.",
    sessionEnded: "Cette session est terminée.",
    sessionFull: "Cette session a déjà deux participants.",
    backHome: "Retour à l'accueil",
    micDenied:
      "Le micro n'est pas autorisé. Ouvrez les réglages de votre navigateur pour ce site, autorisez le microphone, puis réessayez.",
    micUnavailable: "Aucun micro détecté sur cet appareil.",
    transcriptionFailed:
      "La transcription n'a pas abouti. Répétez, parlez plus près du micro, ou réessayez dans un instant.",
    translationFailed: "La traduction n'a pas abouti. Réessayez ou répétez la phrase.",
    tooShort: "Enregistrement trop court. Maintenez le bouton pendant que vous parlez.",
    network: "Connexion interrompue. Vérifiez votre réseau, puis réessayez.",
    generic: "Une erreur est survenue. Réessayez.",
    unsupportedLanguage:
      "Cette langue n'a pas pu être traitée. Choisissez une autre langue : la disponibilité dépend des fournisseurs et du navigateur.",
  },
  privacy: {
    title: "Confidentialité",
    intro:
      "Cette page décrit ce que le service traite pour faire fonctionner une conversation traduite. Elle est proposée pour revue produit et juridique, et n'est pas un avis juridique.",
    sections: [
      {
        h: "Ce qui est traité",
        p: "Les langues choisies, un jeton de session aléatoire, et le texte issu de la reconnaissance vocale ainsi que sa traduction. La localisation est facultative et n'est pas conservée.",
      },
      {
        h: "Audio",
        p: "L'audio est envoyé au serveur uniquement au moment où vous relâchez le bouton, transmis au fournisseur de reconnaissance vocale, puis abandonné. Aucun enregistrement audio n'est stocké.",
      },
      {
        h: "Conservation",
        p: "Les textes original et traduit sont conservés le temps de la session pour afficher la conversation. La session expire automatiquement et le lien devient invalide.",
      },
      {
        h: "Fournisseurs",
        p: "La reconnaissance vocale et la traduction sont effectuées par des modèles tiers appelés depuis le serveur. Les clés d'accès restent côté serveur et ne sont jamais exposées au navigateur.",
      },
      {
        h: "Sécurité",
        p: "HTTPS partout. Le jeton de session est aléatoire et non devinable. Le QR n'est pas une authentification forte : l'initiateur peut révoquer le lien à tout moment.",
      },
    ],
  },
  accessibility: {
    title: "Accessibilité",
    intro:
      "Nos engagements sur cette version, et les limites connues. Signalez-nous tout obstacle rencontré.",
    sections: [
      {
        h: "Contraste et lisibilité",
        p: "Les textes visent un contraste élevé sur fond sombre, avec des tailles confortables sur mobile.",
      },
      {
        h: "États non colorés",
        p: "Les états (en cours, erreur, connexion) sont annoncés par du texte et des icônes, jamais par la couleur ou le son seuls.",
      },
      {
        h: "Animations",
        p: "L'option « Réduire les animations » désactive les effets de fond. Le réglage système prefers-reduced-motion est également respecté.",
      },
      {
        h: "Clavier",
        p: "Le bouton de prise de parole fonctionne au clavier : maintenez Espace ou Entrée pour parler, relâchez pour envoyer.",
      },
      {
        h: "Lecteurs d'écran",
        p: "Les nouveaux messages sont annoncés dans une zone live, et chaque message indique le locuteur, l'original et la traduction.",
      },
    ],
  },
};

type Dict = typeof fr;

const en: Dict = {
  brand: "Two voices",
  nav: {
    home: "Home",
    start: "Start",
    join: "Join",
    privacy: "Privacy",
    accessibility: "Accessibility",
    interfaceLanguage: "Interface language",
    reduceMotion: "Reduce animations",
  },
  home: {
    overline: "One conversation. Two languages. One link.",
    title: "Each speak your own language.",
    subtitle:
      "Create a session, share a temporary QR code and talk out loud with the translation shown on screen. No account required to try it.",
    ctaPrimary: "Start a conversation",
    ctaSecondary: "Join a conversation",
    reassurance:
      "You pick the languages and allow the microphone only when you decide to speak. Location is optional.",
    privacyNote:
      "The data processed, how long it is kept and the translation provider are shown before you start.",
    stepsTitle: "Three steps",
    step1: "Choose your languages",
    step2: "Share the QR code",
    step3: "Take turns speaking",
    step1Text: "Yours and your partner's, confirmed before any session is created.",
    step2Text: "A temporary link to scan. No Bluetooth, no install, no account.",
    step3Text: "Hold the button to speak, release to send. Original and translation both appear.",
    howTitle: "How does it work?",
    howText:
      "Each turn is transcribed, then translated. The original stays next to the translation: these are assisted translations, not a guarantee of accuracy.",
    exampleOriginal: "Original (English)",
    exampleOriginalText: "Excuse me, where is the nearest station?",
    exampleTranslated: "Translation (中文（繁體）)",
    exampleTranslatedText: "不好意思，請問最近的車站在哪裡？",
    trustTitle: "What we commit to",
    trust1Title: "Explicit microphone consent",
    trust1Text: "The microphone is never switched on automatically, and a browser refusal is handled clearly.",
    trust2Title: "Temporary session",
    trust2Text: "The link expires and can be regenerated or cancelled at any time by whoever created the session.",
    trust3Title: "Clear end of session",
    trust3Text: "Ending the conversation stops the exchange and invalidates the shared link.",
    languagesNote:
      "Available languages depend on the browser and the selected provider. Test a translated conversation before relying on it.",
  },
  create: {
    title: "You are creating the session.",
    step: "Step",
    of: "of",
    q1: "Which language will you speak?",
    q2: "Which language will the other person speak?",
    searchPlaceholder: "Search a language…",
    zhTwTitle: "Is Traditional Mandarin (zh-TW) right for you?",
    zhTwText:
      "It is the recommended default. Taigi (Taiwanese) is offered separately: it is not an automatic equivalent of “Taiwanese”.",
    zhTwAccept: "Yes, keep Traditional Mandarin",
    zhTwChange: "Choose another language",
    limitedWarning:
      "Limited availability: speech recognition and translation for this language depend on the provider and are not guaranteed.",
    next: "Continue",
    back: "Back",
    geoTitle: "Allow your location? (Optional)",
    geoText:
      "It can help suggest context or relevant languages. It does not start the microphone and you can continue without allowing it.",
    geoAllow: "Allow location",
    geoSkip: "Continue without location",
    geoDenied: "Location not allowed. You can continue normally.",
    geoGranted: "Location allowed (approximate area, not stored).",
    confirmTitle: "Confirmation",
    youSpeak: "You will speak",
    partnerSpeaks: "Your partner will speak",
    geolocation: "Location",
    allowed: "allowed",
    notAllowed: "not allowed",
    expiry: "Planned expiry",
    minutes: "minutes",
    hours: "hours",
    dataNote:
      "Your voice is transcribed and translated by a third-party provider. The original and translated text is kept for the duration of the session, then the link expires.",
    confirm: "Confirm and create the session",
    edit: "Edit",
    creating: "Creating…",
  },
  qr: {
    title: "Your session is ready",
    invite:
      "Scan this QR code to join the conversation. Each of you speaks your own language: hold the button to speak, release to send, then the original and the translation appear on screen. Your microphone will only be used after you agree.",
    short: "Scan to each speak your own language. Temporary session — no account required.",
    copy: "Copy link",
    copied: "Link copied",
    share: "Share link",
    waiting: "Waiting for the other person",
    joined: "The other person has joined",
    cancel: "Cancel session",
    regenerate: "Regenerate link",
    regenerateNote: "The old link becomes invalid.",
    enter: "Enter the conversation",
    expiresIn: "Expires in",
  },
  join: {
    title: "You have been invited to a conversation",
    languages: "Configured languages",
    session: "Session",
    expires: "Expiry",
    chooseYourLang: "Confirm the language you will speak",
    chooseNote: "Your language is never inferred from your location.",
    micTitle: "To speak, allow access to the microphone.",
    micText: "You control every turn with the button.",
    micAllow: "Allow microphone",
    micLater: "Not now",
    joinCta: "Join the conversation",
    nameTitle: "How should you appear?",
    nameLabel: "Your display name",
    namePlaceholder: "e.g. Alex",
    nameNote: "This name appears next to your messages during the session.",
    nameContinue: "Continue",
    readOnly:
      "Without a microphone you can still read incoming messages. To speak, allow the microphone in your browser settings.",
    leave: "Leave session",
  },

  session: {
    you: "You",
    partner: "Other person",
    end: "End",
    ended: "Session ended",
    connected: "Connected",
    reconnecting: "Connection interrupted",
    original: "Original",
    translation: "Translation",
    holdToTalk: "Hold to talk",
    releaseToSend: "Release to send",
    processing: "Processing…",
    empty: "No messages yet. Hold the button and speak.",
    micRequest: "Allow microphone",
    modeVoice: "Voice",
    collapse: "Collapse",
    expand: "Show more",
    modeText: "Keyboard",
    typePlaceholder: "Type your message…",
    send: "Send",
    retry: "Try again",
    repeat: "Repeat",
    assistedNote: "Assisted translations — the original stays visible.",
    waitingPartner: "Waiting for the other person…",
    expiresIn: "Expires in",
    showQr: "Invite more people",
    showQrNote: "Each new person will speak the session's guest language.",
    present: "people here",
    presentOne: "person here",
    participants: "Participants",
    notify: "Notifications",
    notifyOn: "Notifications on",
    notifyDenied: "Notifications are blocked by your browser.",
    notifyTab: "Open the site in its own tab to enable notifications.",
    notifyHelp:
      "To get alerts, allow notifications for this site in your browser settings (icon left of the address bar).",

    newMessage: "New message",
  },

  errors: {
    linkGone: "This link is no longer available. Ask the host to create a new session.",
    sessionEnded: "This session has ended.",
    sessionFull: "This session already has two participants.",
    backHome: "Back to home",
    micDenied:
      "The microphone is not allowed. Open your browser settings for this site, allow the microphone, then try again.",
    micUnavailable: "No microphone detected on this device.",
    transcriptionFailed:
      "Transcription did not succeed. Repeat, speak closer to the microphone, or try again in a moment.",
    translationFailed: "Translation did not succeed. Try again or repeat the sentence.",
    tooShort: "Recording too short. Hold the button while you speak.",
    network: "Connection interrupted. Check your network, then try again.",
    generic: "Something went wrong. Try again.",
    unsupportedLanguage:
      "This language could not be processed. Choose another one: availability depends on the providers and the browser.",
  },
  privacy: {
    title: "Privacy",
    intro:
      "This page describes what the service processes to run a translated conversation. It is offered for product and legal review, and is not legal advice.",
    sections: [
      {
        h: "What is processed",
        p: "The chosen languages, a random session token, and the text produced by speech recognition along with its translation. Location is optional and is not stored.",
      },
      {
        h: "Audio",
        p: "Audio is sent to the server only when you release the button, forwarded to the speech recognition provider, then discarded. No audio recording is stored.",
      },
      {
        h: "Retention",
        p: "Original and translated text is kept for the duration of the session to display the conversation. The session expires automatically and the link becomes invalid.",
      },
      {
        h: "Providers",
        p: "Speech recognition and translation are performed by third-party models called from the server. Access keys stay server-side and are never exposed to the browser.",
      },
      {
        h: "Security",
        p: "HTTPS everywhere. The session token is random and not guessable. The QR code is not strong authentication: the host can revoke the link at any time.",
      },
    ],
  },
  accessibility: {
    title: "Accessibility",
    intro: "Our commitments in this version, and the known limits. Tell us about any obstacle you hit.",
    sections: [
      {
        h: "Contrast and readability",
        p: "Text aims for high contrast on a dark background, with comfortable sizes on mobile.",
      },
      {
        h: "States without colour",
        p: "States (processing, error, connection) are announced with text and icons, never with colour or sound alone.",
      },
      {
        h: "Animations",
        p: "The “Reduce animations” option disables background effects. The system prefers-reduced-motion setting is respected too.",
      },
      {
        h: "Keyboard",
        p: "The talk button works with a keyboard: hold Space or Enter to speak, release to send.",
      },
      {
        h: "Screen readers",
        p: "New messages are announced in a live region, and each message states the speaker, the original and the translation.",
      },
    ],
  },
};

const zh: Dict = {
  brand: "兩種聲音",
  nav: {
    home: "首頁",
    start: "開始",
    join: "加入",
    privacy: "隱私",
    accessibility: "無障礙",
    interfaceLanguage: "介面語言",
    reduceMotion: "減少動畫",
  },
  home: {
    overline: "一場對話。兩種語言。一個連結。",
    title: "各說各的語言。",
    subtitle: "建立一場對話、分享臨時 QR code，用語音交談並在畫面上看到翻譯。試用不需要帳號。",
    ctaPrimary: "開始一場對話",
    ctaSecondary: "加入一場對話",
    reassurance: "語言由你選擇；只有在你決定要說話時才會授權麥克風。定位為選填。",
    privacyNote: "開始前會說明處理哪些資料、保存多久，以及使用哪家翻譯服務。",
    stepsTitle: "三個步驟",
    step1: "選擇語言",
    step2: "分享 QR code",
    step3: "輪流說話",
    step1Text: "你的語言與對方的語言，在建立對話前先確認。",
    step2Text: "掃描一個臨時連結。不需藍牙、不需安裝、不需帳號。",
    step3Text: "按住按鈕說話，放開即送出。原文與翻譯都會顯示。",
    howTitle: "運作方式",
    howText: "每次發言會先轉成文字再翻譯。原文會與翻譯並列顯示：這是輔助翻譯，不保證完全正確。",
    exampleOriginal: "原文（中文（繁體））",
    exampleOriginalText: "不好意思，請問最近的車站在哪裡？",
    exampleTranslated: "翻譯（English）",
    exampleTranslatedText: "Excuse me, where is the nearest station?",
    trustTitle: "我們的承諾",
    trust1Title: "明確的麥克風同意",
    trust1Text: "麥克風絕不會自動開啟，瀏覽器拒絕授權時也會清楚說明。",
    trust2Title: "臨時對話",
    trust2Text: "連結會過期，建立者也可以隨時重新產生或取消。",
    trust3Title: "明確結束",
    trust3Text: "結束對話會停止交談，並讓分享出去的連結失效。",
    languagesNote: "可用語言取決於瀏覽器與所選服務供應商。正式使用前請先實測一次翻譯對話。",
  },
  create: {
    title: "你正在建立這場對話。",
    step: "步驟",
    of: "／",
    q1: "你會說哪一種語言？",
    q2: "對方會說哪一種語言？",
    searchPlaceholder: "搜尋語言…",
    zhTwTitle: "使用中文（繁體，zh-TW）可以嗎？",
    zhTwText: "這是建議的預設值。台語另外列出：它並不等同於「台灣話」的自動選項。",
    zhTwAccept: "好，維持中文（繁體）",
    zhTwChange: "選擇其他語言",
    limitedWarning: "支援有限：此語言的語音辨識與翻譯取決於服務供應商，無法保證。",
    next: "繼續",
    back: "返回",
    geoTitle: "要允許取得你的位置嗎？（選填）",
    geoText: "它可以協助推薦情境或相關語言。它不會啟動麥克風，不允許也可以繼續。",
    geoAllow: "允許定位",
    geoSkip: "不使用定位並繼續",
    geoDenied: "未允許定位。你仍可正常繼續。",
    geoGranted: "已允許定位（僅大略區域，不會保存）。",
    confirmTitle: "確認",
    youSpeak: "你會說",
    partnerSpeaks: "對方會說",
    geolocation: "定位",
    allowed: "已允許",
    notAllowed: "未允許",
    expiry: "預計失效",
    minutes: "分鐘",
    hours: "小時",
    dataNote: "你的語音會由第三方服務轉成文字並翻譯。原文與翻譯文字只在對話期間保存，之後連結即失效。",
    confirm: "確認並建立對話",
    edit: "修改",
    creating: "建立中…",
  },
  qr: {
    title: "對話已就緒",
    invite:
      "掃描此 QR code 加入對話。兩人各說各的語言：按住按鈕說話，放開送出，畫面上會顯示原文與翻譯。麥克風只有在你同意後才會使用。",
    short: "掃描即可各說各的語言。臨時對話，不需要帳號。",
    copy: "複製連結",
    copied: "已複製連結",
    share: "分享連結",
    waiting: "等待對方加入",
    joined: "對方已加入",
    cancel: "取消這場對話",
    regenerate: "重新產生連結",
    regenerateNote: "舊連結將失效。",
    enter: "進入對話",
    expiresIn: "剩餘",
  },
  join: {
    title: "你被邀請加入一場對話",
    languages: "已設定的語言",
    session: "對話",
    expires: "失效時間",
    chooseYourLang: "確認你要說的語言",
    chooseNote: "我們不會用你的位置推測語言。",
    micTitle: "要說話，請允許使用麥克風。",
    micText: "每一次發言都由你用按鈕控制。",
    micAllow: "允許麥克風",
    micLater: "現在不要",
    joinCta: "加入對話",
    nameTitle: "你想以什麼名稱出現？",
    nameLabel: "你的暱稱",
    namePlaceholder: "例如：小明",
    nameNote: "對話期間，這個名稱會顯示在你的訊息旁。",
    nameContinue: "繼續",
    readOnly: "沒有麥克風時你仍可閱讀收到的訊息。若要說話，請到瀏覽器設定允許麥克風。",
    leave: "離開對話",
  },

  session: {
    you: "你",
    partner: "對方",
    end: "結束",
    ended: "對話已結束",
    connected: "已連線",
    reconnecting: "連線中斷",
    original: "原文",
    translation: "翻譯",
    holdToTalk: "按住說話",
    releaseToSend: "放開即送出",
    processing: "處理中…",
    empty: "目前沒有訊息。按住按鈕開始說話。",
    micRequest: "允許麥克風",
    modeVoice: "語音",
    collapse: "收合",
    expand: "顯示更多",
    modeText: "鍵盤",
    typePlaceholder: "輸入訊息…",
    send: "傳送",
    retry: "再試一次",
    repeat: "重說一次",
    assistedNote: "輔助翻譯，原文持續顯示。",
    waitingPartner: "等待對方…",
    expiresIn: "剩餘",
    showQr: "邀請更多人",
    showQrNote: "每位新加入的人將使用對話設定的訪客語言。",
    present: "人在線上",
    presentOne: "人在線上",
    participants: "參與者",
    notify: "通知",
    notifyOn: "通知已開啟",
    notifyDenied: "瀏覽器已封鎖通知。",
    notifyTab: "請在獨立分頁開啟本網站以啟用通知。",
    notifyHelp: "若要接收提醒，請在瀏覽器設定中允許本網站傳送通知（網址列左側的圖示）。",

    newMessage: "新訊息",
  },

  errors: {
    linkGone: "這個連結已無法使用。請對方重新建立一場對話。",
    sessionEnded: "這場對話已結束。",
    sessionFull: "這場對話已經有兩位參與者。",
    backHome: "回到首頁",
    micDenied: "麥克風未獲授權。請到瀏覽器對本網站的設定允許麥克風，再試一次。",
    micUnavailable: "這台裝置偵測不到麥克風。",
    transcriptionFailed: "語音辨識未成功。請重說一次、靠近麥克風，或稍後再試。",
    translationFailed: "翻譯未成功。請再試一次或重說一次。",
    tooShort: "錄音太短。說話時請持續按住按鈕。",
    network: "連線中斷。請檢查網路後再試。",
    generic: "發生錯誤，請再試一次。",
    unsupportedLanguage: "這個語言無法處理。請改選其他語言：支援程度取決於服務供應商與瀏覽器。",
  },
  privacy: {
    title: "隱私",
    intro: "本頁說明本服務為了進行翻譯對話而處理的資料。內容供產品與法務審閱，並非法律意見。",
    sections: [
      { h: "處理哪些資料", p: "所選語言、隨機的對話代碼，以及語音辨識產生的文字與其翻譯。定位為選填且不會保存。" },
      { h: "音訊", p: "只有在你放開按鈕時，音訊才會送到伺服器並轉交語音辨識服務，之後即丟棄。不會保存任何錄音。" },
      { h: "保存期間", p: "原文與翻譯文字只在對話期間保存以便顯示。對話會自動失效，連結隨之無效。" },
      { h: "服務供應商", p: "語音辨識與翻譯由伺服器呼叫的第三方模型執行。存取金鑰僅留在伺服器端，絕不會出現在瀏覽器。" },
      { h: "安全", p: "全站 HTTPS。對話代碼為隨機且無法猜測。QR code 不是強式身分驗證：建立者可隨時撤銷連結。" },
    ],
  },
  accessibility: {
    title: "無障礙",
    intro: "這是本版本的承諾與已知限制。若遇到任何障礙，歡迎告訴我們。",
    sections: [
      { h: "對比與可讀性", p: "深色背景上採用高對比文字，並在手機上使用舒適的字級。" },
      { h: "不只用顏色表示狀態", p: "處理中、錯誤、連線等狀態都以文字與圖示表示，不會只靠顏色或聲音。" },
      { h: "動畫", p: "「減少動畫」可關閉背景效果，同時也遵循系統的 prefers-reduced-motion 設定。" },
      { h: "鍵盤", p: "發言按鈕支援鍵盤：按住空白鍵或 Enter 說話，放開送出。" },
      { h: "螢幕閱讀器", p: "新訊息會在即時區域中播報，每則訊息都標示發言者、原文與翻譯。" },
    ],
  },
};

const DICTS: Record<UiLocale, Dict> = { fr, en, zh };

type I18nValue = {
  locale: UiLocale;
  setLocale: (l: UiLocale) => void;
  t: Dict;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("fr");
  const [reduceMotion, setReduceMotionState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ui-locale") as UiLocale | null;
    if (stored && stored in DICTS) {
      setLocaleState(stored);
    } else {
      const nav = window.navigator.language.toLowerCase();
      if (nav.startsWith("zh")) setLocaleState("zh");
      else if (nav.startsWith("fr")) setLocaleState("fr");
      else setLocaleState("en");
    }
    setReduceMotionState(window.localStorage.getItem("reduce-motion") === "1");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  const setLocale = useCallback((l: UiLocale) => {
    setLocaleState(l);
    window.localStorage.setItem("ui-locale", l);
  }, []);

  const setReduceMotion = useCallback((v: boolean) => {
    setReduceMotionState(v);
    window.localStorage.setItem("reduce-motion", v ? "1" : "0");
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: DICTS[locale], reduceMotion, setReduceMotion }),
    [locale, setLocale, reduceMotion, setReduceMotion],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** UI locale best matching a spoken language code (guest pages follow the session's guest language). */
export function uiLocaleForSpoken(code: string): UiLocale {
  const c = code.toLowerCase();
  if (c.startsWith("zh") || c.startsWith("nan")) return "zh";
  if (c.startsWith("fr")) return "fr";
  if (c.startsWith("en")) return "en";
  return "en";
}

export function languageLabel(
  lang: { native: string; fr: string; en: string; zh: string } | undefined,
  locale: UiLocale,
) {
  if (!lang) return "—";
  const name = locale === "fr" ? lang.fr : locale === "en" ? lang.en : lang.zh;
  return name === lang.native ? name : `${lang.native} · ${name}`;
}
