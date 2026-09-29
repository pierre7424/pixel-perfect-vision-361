# Deux voix — documentation du MVP

Service de conversation orale multilingue : deux personnes qui ne partagent pas
de langue parlent face à face. L'une crée une session, l'autre rejoint par QR
code ou lien temporaire. Aucun compte, aucune application à installer.

## 1. Parcours utilisateur

1. **Hôte** — `/nouvelle` : assistant en 4 étapes
   - choix de sa langue parlée ;
   - choix de la langue de l'invité (proposition **中文（繁體）** avec carte de
     confirmation lorsque le fuseau horaire est `Asia/Taipei`) ;
   - consentement facultatif à la localisation (refus sans conséquence, le micro
     n'est jamais activé à cette étape) ;
   - récapitulatif avec la durée de validité (30 minutes) puis création.
2. **Hôte** — `/s/<token>` : QR code, lien copiable, partage natif, bouton de
   régénération du lien (l'ancien est révoqué) et bouton d'annulation.
3. **Invité** — scanne le QR ou colle le lien dans `/rejoindre`. Il voit la
   langue détectée, peut la corriger, puis autorise le micro (ou le fait plus
   tard).
4. **Conversation** — bouton « appuyer pour parler ». Chaque prise de parole est
   transcrite, traduite et affichée aux deux participants (original + traduction),
   avec compte à rebours et bouton pour quitter.

Pages annexes : `/` (présentation), `/confidentialite`, `/accessibilite`.

## 2. Architecture

```text
Navigateur (TanStack Start, React)
  └─ server functions (src/lib/conversation.functions.ts)
       ├─ Lovable Cloud / Postgres (service_role, RLS fermée)
       └─ Lovable AI Gateway (src/lib/ai.server.ts)
            ├─ transcription  : google/gemini-3.5-transcribe
            └─ traduction     : openai/gpt-6-astra
```

- Les clients n'accèdent **jamais** directement à la base : les policies RLS
  bloquent `anon` et `authenticated`. Tout passe par les server functions, qui
  utilisent le rôle de service côté serveur.
- Les clés des fournisseurs restent côté serveur (`ai.server.ts`).
- Les server functions renvoient toujours `{ ok: true, ... }` ou
  `{ ok: false, code }` — elles ne lèvent pas d'exception, pour que les erreurs
  traversent proprement la couche RPC et soient traduites dans l'interface.

### Fichiers principaux

| Fichier | Rôle |
| --- | --- |
| `src/lib/conversation.functions.ts` | createSession, getSession, joinSession, endSession, regenerateLink, listMessages, sendUtterance |
| `src/lib/ai.server.ts` | appels transcription / traduction |
| `src/lib/languages.ts` | catalogue des langues parlées, indices de transcription |
| `src/lib/i18n.tsx` | interface en français, anglais et chinois traditionnel |
| `src/components/conversation-view.tsx` | écran de conversation (polling 2,5 s) |
| `src/components/use-recorder.ts` | micro, MediaRecorder, encodage base64 |
| `src/components/push-to-talk.tsx` | bouton parler (pointeur + Espace/Entrée) |
| `src/routes/` | `/`, `/nouvelle`, `/rejoindre`, `/s/$token`, pages légales |

### Données

- `conversation_sessions` : `token` unique, langues hôte/invité, consentement
  géo, statut (`waiting` / `active` / `ended`), `revoked`, `expires_at`
  (création + 30 min).
- `conversation_messages` : `session_id`, `speaker`, langues source/cible, texte
  original, texte traduit, `state` (`processed` / `error`), `error_code`.

Aucune donnée de compte, aucun contact, aucun historique personnel n'est stocké.
Les sessions expirent automatiquement au bout de 30 minutes.

## 3. Codes d'erreur

`not_found`, `expired`, `revoked`, `ended`, `transcription_failed`,
`translation_failed`, `rate_limited`, `unavailable`, `audio_too_short`.
Chacun a un message traduit dans les trois langues d'interface.

## 4. Accessibilité et confort

- Contraste élevé, cibles tactiles larges, focus visible.
- Bouton parler utilisable au clavier (Espace / Entrée).
- Interrupteur « réduire les animations » (et respect de
  `prefers-reduced-motion`).
- Langue d'interface commutable à tout moment (fr / en / 繁體中文), mémorisée
  localement.

## 5. Limites du MVP

- Pas de synthèse vocale : les traductions sont affichées, pas prononcées.
- Pas de mode texte complet ni de sous-titres en continu.
- Pas de compte, d'historique ni de carnet de contacts (prévu « plus tard »).
- Le taïwanais (nan-TW) est marqué comme support limité côté reconnaissance.
- Mise à jour des messages par interrogation périodique (2,5 s), pas en temps
  réel.
- Aucun compte fournisseur externe n'a été fourni : le service n'est pas déployé
  en production.

## 6. Développement

```bash
bun install
bun run dev      # http://localhost:8080
```

La base et les clés IA sont fournies par Lovable Cloud ; aucune configuration
manuelle n'est nécessaire.
