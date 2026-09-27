---
title: "Garder l’écran allumé sur Android avec Chrome — AwakeTab"
description: "Chrome 84+ sur Android garde l’écran allumé dans un onglet visible. Quitter Chrome libère le verrou ; l’économiseur de batterie peut assombrir l’écran."
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
crumb: "Android avec Chrome"
lead: "Chrome 84 et les versions ultérieures sur Android accordent un Wake Lock natif tant que l’onglet reste visible. AwakeTab l’utilise pour empêcher l’écran de s’éteindre pendant 30 minutes par défaut, ou plus si vous changez de durée. Trois choses à savoir : quitter Chrome libère le verrou, certaines listes « applis en veille » des fabricants peuvent fermer l’onglet une fois que vous l’avez quitté, et l’économiseur de batterie peut raccourcir le délai ou baisser la luminosité."
facts:
  - label: "Chrome"
    value: "84 et plus"
  - label: "Samsung Internet"
    value: "14 et plus"
  - label: "Firefox"
    value: "126 et plus"
  - label: "Opera"
    value: "70 et plus"
steps:
  - title: "Ouvrez awaketab.com dans Chrome"
    path: "Chrome › awaketab.com"
    text: "La durée « 30 min » est déjà choisie ; touchez une autre puce si besoin."
    shot: "AwakeTab dans Chrome sur Android avec la durée choisie"
  - title: "Touchez Démarrer"
    text: "Attendez « Écran allumé » dans la pastille."
    shot: "la pastille d’AwakeTab pendant une session"
  - title: "Gardez Chrome au premier plan"
    text: "Pour suivre une autre application en même temps, ouvrez l’écran partagé et placez Chrome dans l’une des deux moitiés."
    shot: "l’écran partagé avec Chrome dans une moitié"
matrix:
  label: "Navigateurs Android dans notre matrice, vérifiée le 9 septembre 2026"
  cols: ["Navigateur", "Résultat", "Mécanisme"]
  rows:
    - what: "Chrome 84 et plus"
      result: works
      label: "Pris en charge"
      text: "natif"
    - what: "Samsung Internet 14 et plus"
      result: works
      label: "Pris en charge"
      text: "natif"
    - what: "Firefox 126 et plus"
      result: works
      label: "Pris en charge"
      text: "natif ; vidéo de secours avant"
    - what: "Opera 70 et plus"
      result: works
      label: "Pris en charge"
      text: "natif (base Chromium)"
rows:
  blockers:
    - title: "L’économiseur de batterie"
      text: "Activé à la main ou automatiquement sous un certain niveau de charge, il peut raccourcir le délai de mise en veille ou baisser la luminosité. Chrome ne le vérifie pas et ne refuse donc pas le verrou à cause de lui ; nous n’avons pas encore vérifié sur un appareil s’il passe outre un verrou accordé. « Bloqué — voici la solution » n’apparaît que lors d’un vrai refus, avec sa cause."
    - title: "Les applis mises en veille par le fabricant"
      text: "Plusieurs surcouches, dont celle de Samsung, endorment les applications peu utilisées pour gagner de l’autonomie. Si Chrome y figure, l’onglet peut être fermé en arrière-plan et la session perdue. Retirez Chrome de cette liste dans les paramètres de batterie."
    - title: "Le changement d’application"
      text: "Ouvrir une notification ou revenir à l’écran d’accueil masque la page. Android retire le verrou ; c’est une règle du système, pas un réglage d’AwakeTab."
faq:
  - q: "L’écran reste-t-il allumé si je passe sur WhatsApp ou YouTube ?"
    a: "Non. Dès que Chrome passe en arrière-plan, l’onglet est masqué et Android retire le verrou ; la pastille affiche « En pause — onglet masqué » à votre retour. Pour garder une autre appli à côté, utilisez l’écran partagé afin que Chrome reste visible."
  - q: "Pourquoi AwakeTab affiche « Bloqué — voici la solution » sur mon téléphone ?"
    a: "Chrome a refusé le verrou, et la ligne sous la pastille en donne la cause. Ce n’est pas l’économiseur de batterie : Chrome ne le vérifie pas. Le plus souvent, l’onglet n’était pas visible au démarrage, ou AwakeTab est intégré dans une page sans l’autorisation screen-wake-lock. Ouvrez awaketab.com directement, gardez l’onglet au premier plan et touchez Démarrer."
  - q: "Ma session avait disparu quand je suis revenu dans Chrome. Pourquoi ?"
    a: "Certains fabricants endorment ou ferment les applications qu’ils jugent inutilisées, et l’onglet avec elles. Vérifiez dans les paramètres de batterie que Chrome ne figure pas dans la liste des applications mises en veille."
  - q: "Ça marche aussi avec Samsung Internet ou Firefox pour Android ?"
    a: "Oui : Samsung Internet 14+ et Firefox 126+ accordent un verrou natif d’après notre matrice du 9 septembre 2026. Un Firefox plus ancien passe par la vidéo de secours après un toucher, qui consomme davantage."
honestLimit: "Quitter Chrome libère le verrou ; certains réglages de fabricants qui mettent en veille les applis inutilisées ferment l’onglet une fois quitté ; l’économiseur de batterie peut raccourcir le délai d’écran."
related:
  - "/on/samsung-internet"
  - "/on/firefox"
  - "/guides/android-screen-timeout-one-app"
  - "/for/cooking"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Trois gestes pour commencer

::steps

::ad

## Navigateurs Android dans notre matrice

Vérifié le 9 septembre 2026. Les navigateurs absents de ce tableau ne sont pas revendiqués.

::matrix

## Les blocages propres à Android

::rows blockers

## Le délai de mise en veille d’Android

Le réglage général se trouve dans Paramètres → Affichage → Mise en veille de l’écran (Pixel sous Android 16 : « Display & touch ») ; son nom varie selon les fabricants. Android standard n’offre pas de délai propre à une seule application, d’où l’intérêt d’un onglet qui ne garde l’écran allumé que pendant que vous en avez besoin.

## Batterie et écran OLED

Beaucoup de téléphones Android ont un écran OLED. Une image fixe affichée des heures peut marquer la dalle ; le mode nuit d’AwakeTab décale légèrement les pixels pour limiter ce risque, sans l’éliminer. Sous Chrome, vous pouvez aussi fixer un seuil de batterie auquel la session s’arrête d’elle-même. Pour les longues sessions, branchez le téléphone.

Pour une recette ou une partition, voyez notre page [cuisine](/fr/for/cuisine) ; pour voir chaque navigateur version par version, consultez [notre tableau de compatibilité](/fr/learn/matrice-prise-en-charge).

Dernière vérification : 9 septembre 2026.
