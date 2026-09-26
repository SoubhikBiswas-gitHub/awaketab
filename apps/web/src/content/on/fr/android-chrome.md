---
title: "Garder l’écran allumé sur Android avec Chrome — AwakeTab"
description: "Chrome 84+ sur Android garde l’écran allumé dans un onglet visible. L’économiseur de batterie refuse le verrou, et quitter Chrome le libère aussitôt."
h1: "Garder l’écran allumé sur Android avec Chrome"
ogTitle: "Écran Android allumé avec Chrome"
intent: "garder l'écran allumé android chrome"
secondaryQueries: ["empêcher l'écran de s'éteindre android", "écran toujours allumé android", "android écran s'éteint trop vite", "désactiver mise en veille écran android", "garder l'écran allumé samsung"]
preset: p30
mode: standard
locale: fr
reviewed: false
translationOf: "android-chrome"
lastVerified: 2026-09-09
browsers: ["chrome"]
os: ["android"]
faq:
  - q: "L’écran reste-t-il allumé si je passe sur WhatsApp ou YouTube ?"
    a: "Non. Dès que Chrome passe en arrière-plan, l’onglet est masqué et Android retire le verrou ; la pastille affiche « En pause — onglet masqué » à votre retour. Pour garder une autre appli à côté, utilisez l’écran partagé afin que Chrome reste visible."
  - q: "Pourquoi AwakeTab affiche « Bloqué — voici la solution » sur mon téléphone ?"
    a: "Presque toujours à cause de l’économiseur de batterie, qui refuse la demande de verrou. Désactivez-le ou branchez le téléphone, puis touchez Démarrer. Retenter sans rien changer produira le même refus."
  - q: "Ma session avait disparu quand je suis revenu dans Chrome. Pourquoi ?"
    a: "Certains fabricants endorment ou ferment les applications qu’ils jugent inutilisées, et l’onglet avec elles. Vérifiez dans les paramètres de batterie que Chrome ne figure pas dans la liste des applications mises en veille."
  - q: "Ça marche aussi avec Samsung Internet ou Firefox pour Android ?"
    a: "Oui : Samsung Internet 14+ et Firefox 126+ accordent un verrou natif d’après notre matrice du 9 septembre 2026. Un Firefox plus ancien passe par la vidéo de secours après un toucher, qui consomme davantage."
honestLimit: "L’économiseur de batterie refuse le verrou ; quitter Chrome le libère ; certains réglages de fabricants qui mettent en veille les applis inutilisées ferment l’onglet."
related:
  - "/on/samsung-internet"
  - "/on/firefox"
  - "/guides/android-screen-timeout-one-app"
  - "/for/cooking"
author: soubhik
published: 2026-09-26
---

## Chrome 84 et plus : le verrou natif sur Android

Chrome 84 et les versions ultérieures sur Android accordent un Wake Lock natif tant que l’onglet reste visible. AwakeTab l’utilise pour empêcher l’écran de s’éteindre pendant 30 minutes par défaut, ou plus si vous changez de durée. Trois obstacles existent : l’économiseur de batterie refuse la demande, quitter Chrome libère le verrou, et certaines listes « applis en veille » des fabricants peuvent fermer l’onglet une fois que vous l’avez quitté.

## Navigateurs Android dans notre matrice

| Navigateur | Version minimale | Mécanisme |
|---|---|---|
| Chrome | 84 | natif |
| Samsung Internet | 14 | natif |
| Firefox | 126 | natif ; vidéo de secours avant |
| Opera | 70 | natif (base Chromium) |

Vérifié le 9 septembre 2026. Les navigateurs absents de ce tableau ne sont pas revendiqués.

## Trois gestes pour commencer

1. Ouvrez awaketab.com dans Chrome. La durée « 30 min » est déjà choisie ; touchez une autre puce si besoin.
2. Touchez Démarrer et attendez « Écran allumé » dans la pastille.
3. Gardez Chrome au premier plan. Pour suivre une autre application en même temps, ouvrez l’écran partagé et placez Chrome dans l’une des deux moitiés.

## Les blocages propres à Android

**L’économiseur de batterie.** Activé à la main ou automatiquement sous un certain niveau de charge, il refuse le verrou. La pastille passe alors à « Bloqué — voici la solution », avec un conseil : désactivez-le ou branchez l’appareil, puis touchez Démarrer.

**Les applis mises en veille par le fabricant.** Plusieurs surcouches, dont celle de Samsung, endorment les applications peu utilisées pour gagner de l’autonomie. Si Chrome y figure, l’onglet peut être fermé en arrière-plan et la session perdue. Retirez Chrome de cette liste dans les paramètres de batterie.

**Le changement d’application.** Ouvrir une notification ou revenir à l’écran d’accueil masque la page. Android retire le verrou ; c’est une règle du système, pas un réglage d’AwakeTab.

## Le délai de mise en veille d’Android

Le réglage général se trouve dans Paramètres → Affichage → Mise en veille de l’écran ; son nom varie selon les fabricants. Android standard n’offre pas de délai propre à une seule application, d’où l’intérêt d’un onglet qui ne garde l’écran allumé que pendant que vous en avez besoin.

## Batterie et écran OLED

Beaucoup de téléphones Android ont un écran OLED. Une image fixe affichée des heures peut marquer la dalle ; le mode nuit d’AwakeTab décale légèrement les pixels pour limiter ce risque, sans l’éliminer. Sous Chrome, vous pouvez aussi fixer un seuil de batterie auquel la session s’arrête d’elle-même. Pour les longues sessions, branchez le téléphone.

Pour une recette ou une partition, voyez notre page [cuisine](/fr/for/cuisine) ; pour voir chaque navigateur version par version, consultez [notre tableau de compatibilité](/fr/learn/matrice-prise-en-charge).

Dernière vérification : 9 septembre 2026.
