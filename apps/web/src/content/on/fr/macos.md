---
title: "Empêcher la veille de l’écran du Mac — AwakeTab"
description: "Safari 16.4+, Chrome 84+ et Firefox 126+ gardent l’écran du Mac allumé. La veille système n’est pas retenue dans nos tests ; le capot fermé endort le Mac."
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
faq:
  - q: "AwakeTab peut-il laisser mon Mac finir une tâche longue écran éteint ?"
    a: "Non. AwakeTab tient l’écran, pas le système. Dans nos tests sur macOS, la veille du système pour inactivité n’a pas été retenue. Pour un rendu ou une sauvegarde sans écran, utilisez un outil natif comme la commande caffeinate."
  - q: "Puis-je rabattre l’écran de mon MacBook pendant qu’AwakeTab tourne ?"
    a: "Non. Fermer le capot met toujours le Mac en veille, et aucune page web ni extension ne peut l’en empêcher. Il faut un réglage du système ou un utilitaire natif."
  - q: "Que se passe-t-il si je masque Safari avec ⌘H ou réduis la fenêtre ?"
    a: "L’onglet devient invisible et le navigateur libère le verrou. La pastille passe à « En pause — onglet masqué » et le minuteur s’arrête jusqu’à ce que vous reveniez sur la page."
  - q: "Mon statut Slack ou Teams restera-t-il actif ?"
    a: "Non. Ces applications suivent l’activité du clavier et du trackpad, pas l’état de l’écran. AwakeTab ne simule aucune saisie, donc votre statut évolue comme d’habitude."
honestLimit: "L’écran reste allumé, mais la veille du système pour inactivité n’est pas retenue sur macOS dans nos tests ; fermer le capot met toujours le Mac en veille."
related:
  - "/vs/caffeinate-command"
  - "/vs/amphetamine"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/for/presentations"
author: soubhik
published: 2026-09-26
---

## L’écran, oui ; le système, non

Safari 16.4+, Chrome 84+ et Firefox 126+ peuvent garder l’écran d’un Mac allumé depuis un onglet visible. AwakeTab s’appuie sur ce Wake Lock pour empêcher l’affichage de s’assombrir puis de s’éteindre, sans rien installer. Deux nuances importantes : dans nos tests, la veille du système pour inactivité n’a pas été retenue sur macOS, et un capot fermé met toujours le Mac en veille.

## Navigateurs pris en charge sur macOS

| Navigateur | Version minimale | Mécanisme |
|---|---|---|
| Safari | 16.4 | natif ; le mode Économie d’énergie peut l’empêcher |
| Chrome | 84 | natif |
| Firefox | 126 | natif ; vidéo de secours sur les versions antérieures |
| Edge | 84 | natif |
| Opera | 70 | natif (base Chromium) |

Matrice vérifiée le 9 septembre 2026.

## Mise en route sur le Mac

1. Ouvrez awaketab.com dans votre navigateur. La durée « 1 h » est présélectionnée ici.
2. Appuyez sur Espace ou cliquez sur Démarrer ; attendez « Écran allumé » dans la pastille.
3. Laissez la fenêtre visible. Si vous travaillez dans d’autres apps, redimensionnez-la en petite fenêtre dans un coin au lieu de l’envoyer dans le Dock ; sous Chrome ou Edge, la « Fenêtre flottante » de l’en-tête fait le même travail.
4. Sur un MacBook, restez branché pour les longues sessions.

## Écran contre système : ce que macOS distingue

macOS gère séparément l’extinction de l’écran et la mise en veille de l’ordinateur. Un Wake Lock ne demande que la première. Concrètement, AwakeTab convient pour garder à l’écran une présentation, un tableau de bord ou une recette. Il ne garantit pas que le Mac reste éveillé jusqu’à la fin d’un téléchargement, d’un rendu vidéo ou d’une sauvegarde. Pour ces tâches, la commande `caffeinate -di` dans le Terminal empêche à la fois la veille pour inactivité et celle de l’écran, et des applications comme Amphetamine ou [Caffeine](/fr/vs/caffeine) agissent au niveau du système.

## Les réglages de macOS à connaître

Les délais d’extinction se règlent dans Réglages Système → Écran verrouillé, et les options d’alimentation dans la section Énergie ou Batterie selon votre Mac. Sur un portable, le mode Économie d’énergie peut raccourcir ces délais ; si la pastille affiche « Bloqué — voici la solution », la cause est indiquée juste en dessous.

## Capot fermé : aucune page web n’y peut rien

C’est la question qui revient le plus souvent. Un MacBook dont on rabat l’écran s’endort, point. Seuls un écran externe avec alimentation, un réglage `pmset` ou un utilitaire natif changent ce comportement. AwakeTab ne le prétend pas et ne le fera jamais.

## Pourquoi faire confiance à la pastille

AwakeTab considère le navigateur comme seule source de vérité. Tant que Safari, Chrome ou Firefox n’a pas confirmé le verrou, la pastille n’affiche pas « Écran allumé » et le minuteur ne tourne pas. Si l’écran s’éteint quand même, vous saurez pourquoi : onglet masqué, refus lié à l’énergie, ou règle de verrouillage d’une autre nature.

Dernière vérification : 9 septembre 2026.
