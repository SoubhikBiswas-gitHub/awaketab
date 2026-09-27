---
title: "Empêcher la veille de l’écran du Mac — AwakeTab"
description: "Safari 16.4+, Chrome 84+ et Firefox 126+ gardent l’écran du Mac allumé. Le Mac ne s’endort pas non plus, sauf si vous fermez le capot."
h1: "Empêcher la mise en veille de l’écran du Mac depuis un onglet"
ogTitle: "Écran du Mac allumé depuis un onglet"
intent: "empêcher la mise en veille de l'écran mac navigateur"
secondaryQueries: ["garder l'écran allumé mac", "mac écran s'éteint trop vite", "empêcher la mise en veille macbook", "écran toujours allumé macbook", "empêcher l'écran de s'éteindre mac sans logiciel"]
preset: p60
mode: standard
locale: fr
reviewed: false
translationOf: "macos"
lastVerified: 2026-09-09
browsers: ["chrome", "safari", "firefox"]
os: ["macos"]
crumb: "macOS"
lead: "Safari 16.4+, Chrome 84+ et Firefox 126+ peuvent garder l’écran d’un Mac allumé depuis un onglet visible. AwakeTab s’appuie sur ce Wake Lock pour empêcher l’affichage de s’assombrir puis de s’éteindre, sans rien installer. Tant que l’écran reste allumé, le Mac ne se met pas non plus en veille pour inactivité, d’après la documentation d’Apple. En revanche, un capot fermé le met en veille, sauf en mode clamshell avec secteur et écran externe."
facts:
  - label: "Safari"
    value: "16.4 et plus"
  - label: "Chrome et Edge"
    value: "84 et plus"
  - label: "Firefox"
    value: "126 et plus"
  - label: "Opera"
    value: "70 et plus"
toc:
  écran-contre-système--ce-que-macos-distingue: "Écran contre système"
  capot-fermé--aucune-page-web-ny-peut-rien: "Capot fermé"
steps:
  - title: "Ouvrez awaketab.com dans votre navigateur"
    text: "La durée « 1 h » est présélectionnée ici. Sur un MacBook, restez branché pour les longues sessions."
    shot: "AwakeTab dans Safari sur un Mac"
  - title: "Appuyez sur Espace ou cliquez sur Démarrer"
    text: "Attendez « Écran allumé » dans la pastille."
    shot: "la pastille d’AwakeTab pendant une session"
  - title: "Laissez la fenêtre visible"
    text: "Si vous travaillez dans d’autres apps, redimensionnez-la en petite fenêtre dans un coin au lieu de l’envoyer dans le Dock ; sous Chrome, Edge ou Firefox 151+, la « Fenêtre flottante » de l’en-tête fait le même travail."
    shot: "une petite fenêtre AwakeTab dans un coin"
matrix:
  label: "Navigateurs pris en charge sur macOS, matrice vérifiée le 9 septembre 2026"
  cols: ["Navigateur", "Résultat", "Mécanisme"]
  rows:
    - what: "Safari 16.4 et plus"
      result: works
      label: "Pris en charge"
      text: "natif ; un clic est nécessaire au démarrage"
    - what: "Chrome 84 et plus"
      result: works
      label: "Pris en charge"
      text: "natif"
    - what: "Firefox 126 et plus"
      result: works
      label: "Pris en charge"
      text: "natif ; vidéo de secours sur les versions antérieures"
    - what: "Edge 84 et plus"
      result: works
      label: "Pris en charge"
      text: "natif"
    - what: "Opera 70 et plus"
      result: works
      label: "Pris en charge"
      text: "natif (base Chromium)"
faq:
  - q: "AwakeTab peut-il laisser mon Mac finir une tâche longue écran éteint ?"
    a: "Pas écran éteint. Tant qu’AwakeTab garde l’écran allumé, le Mac ne se met pas en veille pour inactivité (documentation IOKit d’Apple). Mais pour un rendu ou une sauvegarde sans écran, utilisez un outil natif comme la commande caffeinate -i."
  - q: "Puis-je rabattre l’écran de mon MacBook pendant qu’AwakeTab tourne ?"
    a: "Non. Fermer le capot met le Mac en veille, sauf en mode clamshell (secteur et écran externe), et aucune page web ni extension ne peut l’en empêcher. Il faut un réglage du système ou un utilitaire natif."
  - q: "Que se passe-t-il si je masque Safari avec ⌘H ou réduis la fenêtre ?"
    a: "L’onglet devient invisible et le navigateur libère le verrou. La pastille passe à « En pause — onglet masqué » et le minuteur s’arrête jusqu’à ce que vous reveniez sur la page."
  - q: "Mon statut Slack ou Teams restera-t-il actif ?"
    a: "Non. Ces applications suivent l’activité du clavier et du trackpad, pas l’état de l’écran. AwakeTab ne simule aucune saisie, donc votre statut évolue comme d’habitude."
honestLimit: "L’écran reste allumé tant que l’onglet est visible, et le Mac ne se met alors pas en veille pour inactivité ; fermer le capot le met quand même en veille, sauf en mode clamshell avec secteur et écran externe."
related:
  - "/vs/caffeinate-command"
  - "/vs/amphetamine"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/for/presentations"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Mise en route sur le Mac

::steps

::ad

## Navigateurs pris en charge sur macOS

Matrice vérifiée le 9 septembre 2026.

::matrix

## Écran contre système : ce que macOS distingue

macOS gère séparément l’extinction de l’écran et la mise en veille de l’ordinateur. Un Wake Lock demande la première, mais d’après la documentation IOKit d’Apple, le Mac ne se met alors pas en veille pour inactivité non plus (sources consultées le 26 septembre 2026). Vérifiez-le avec `pmset -g assertions` dans le Terminal. Tout cela suppose un onglet visible et un écran allumé. Pour finir un téléchargement, un rendu ou une sauvegarde écran éteint, la commande `caffeinate -di` dans le Terminal empêche à la fois la veille pour inactivité et celle de l’écran, et des applications comme Amphetamine ou [Caffeine](/fr/vs/caffeine) agissent au niveau du système.

## Les réglages de macOS à connaître

Les délais d’extinction se règlent dans Réglages Système → Écran verrouillé, et les options d’alimentation dans la section Énergie ou Batterie selon votre Mac. Sur un portable, le mode Économie d’énergie peut réduire la luminosité, mais Safari et Chrome ne refusent pas le verrou pour autant ; si la pastille affiche « Bloqué — voici la solution », la cause (par exemple un clic manquant dans Safari) est indiquée juste en dessous.

## Capot fermé : aucune page web n’y peut rien

C’est la question qui revient le plus souvent. Un MacBook dont on rabat l’écran s’endort, point. Seuls un écran externe avec alimentation, un réglage `pmset` ou un utilitaire natif changent ce comportement. AwakeTab ne le prétend pas et ne le fera jamais.

## Pourquoi faire confiance à la pastille

AwakeTab considère le navigateur comme seule source de vérité. Tant que Safari, Chrome ou Firefox n’a pas confirmé le verrou, la pastille n’affiche pas « Écran allumé » et le minuteur ne tourne pas. Si l’écran s’éteint quand même, vous saurez pourquoi : onglet masqué, refus du navigateur, ou règle de verrouillage d’une autre nature.

Dernière vérification : 9 septembre 2026.
