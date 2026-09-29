# Critères d'acceptation — état

| Critère du cahier des charges | État | Où / comment |
| --- | --- | --- |
| L'hôte crée une session sans compte ni installation | OK | `/nouvelle`, aucune authentification |
| Choix de la langue de l'hôte et de l'invité | OK | étapes 1 et 2 de l'assistant |
| 中文（繁體） proposé par défaut avec confirmation en contexte taïwanais | OK | carte de confirmation si fuseau `Asia/Taipei` |
| Localisation facultative, refus sans blocage | OK | étape 3 ; le micro n'est jamais demandé à ce moment |
| Écran de confirmation avant création | OK | étape 4, durée de validité affichée |
| QR code + lien temporaire partageable | OK | `/s/<token>` côté hôte (QR, copie, partage natif) |
| L'invité rejoint sans compte ni application | OK | scan du QR ou `/rejoindre` |
| L'invité peut corriger sa langue avant d'entrer | OK | écran d'accueil invité |
| Autorisation micro explicite, possible plus tard | OK | boutons « Autoriser » / « Plus tard » |
| Prise de parole transcrite puis traduite pour l'autre | OK | vérifié de bout en bout (mandarin → français, français → chinois) |
| Original et traduction visibles des deux côtés | OK | écran de conversation |
| Lien expiré, révoqué ou session terminée refusés | OK | codes `expired`, `revoked`, `ended` |
| Régénération du lien (ancien invalidé) | OK | bouton « régénérer » côté hôte |
| Fin de conversation à tout moment | OK | bouton « quitter » des deux côtés |
| Interface multilingue | OK | français, anglais, chinois traditionnel |
| Accessibilité (clavier, contraste, animations réduites) | OK | voir documentation §4 |
| Déploiement en production | Non fait | aucun compte fournisseur fourni (hors périmètre demandé) |
| Synthèse vocale, mode texte complet, sous-titres, app native | Non fait | explicitement « après validation » dans le cahier des charges |
| Comptes, historique, contacts, traduction automatique continue | Non fait | explicitement « plus tard » (F-13) |
