---
title: "Écran allumé pendant un téléchargement — AwakeTab"
description: "AwakeTab garde l’écran allumé pendant un long téléchargement. Avec Chrome ou Edge, l’ordinateur ne se met pas non plus en veille, sauf capot fermé."
h1: "Écran allumé pendant un téléchargement : ce que fait AwakeTab"
ogTitle: "Écran allumé pendant un téléchargement"
intent: "empêcher la mise en veille pendant un téléchargement"
secondaryQueries: ["pc se met en veille pendant téléchargement", "garder l'ordinateur allumé pendant un téléchargement", "téléchargement interrompu mise en veille", "empêcher la veille windows téléchargement", "mac se met en veille pendant téléchargement"]
preset: pinf
mode: standard
locale: fr
reviewed: false
translationOf: "downloads"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Si je réduis la fenêtre du navigateur, le PC reste-t-il éveillé ?"
    a: "Pas grâce à AwakeTab. Réduire la fenêtre ou changer d’onglet masque la page, et le navigateur libère aussitôt le verrou : la pastille passe à « En pause — onglet masqué ». À partir de là, ce sont vos réglages d’alimentation qui décident si l’ordinateur s’endort."
  - q: "Mon Mac s’est endormi pendant la nuit alors qu’AwakeTab tournait. C’est normal ?"
    a: "Pas si l’onglet est resté visible et le capot ouvert : tant que l’écran reste allumé, le Mac ne se met pas en veille pour inactivité (documentation IOKit d’Apple). Le plus souvent, la fenêtre a été réduite ou masquée. Pour un téléchargement de nuit écran éteint, utilisez un outil natif comme la commande caffeinate -i."
  - q: "Et sous Windows avec Chrome ou Edge ?"
    a: "Tant que l’onglet est visible, Chrome et Edge demandent à Windows de garder l’écran allumé, et Windows ne se met alors pas en veille pour inactivité (documentation et code source des navigateurs, vérifiés le 26 septembre 2026). L’« Économiseur d’énergie » peut baisser la luminosité sans refuser le verrou. Fermer le capot met le PC en veille quoi qu’il arrive."
  - q: "Est-ce que cela me garde « Disponible » dans Teams pendant l’attente ?"
    a: "Non. Teams et Slack calculent votre présence d’après l’activité du clavier et de la souris, pas d’après l’écran. AwakeTab ne simule jamais de frappe ni de mouvement de souris."
honestLimit: "Garde l’écran allumé tant que l’onglet est visible ; avec Chrome et Edge sous Windows et macOS, l’ordinateur ne se met pas non plus en veille pour inactivité. Fermer le capot le met quand même en veille."
related:
  - "/on/windows-11"
  - "/on/macos"
  - "/vs/caffeine"
  - "/for/work-laptop"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Ce qu’AwakeTab fait vraiment pendant un téléchargement

Un gros fichier, une sauvegarde vers le cloud ou l’installation d’un jeu s’interrompt net quand l’ordinateur se met en veille. AwakeTab demande au navigateur un Wake Lock d’écran : l’affichage reste allumé tant que l’onglet est visible. Un verrou d’écran n’est pas un verrou système, mais tant que l’écran reste allumé, ni Windows ni macOS ne se mettent en veille pour inactivité. Fermer le capot endort en revanche un portable, quel que soit l’onglet.

## Windows, macOS, Linux : ce que disent les sources

| Système | Écran | Veille du système pour inactivité | Capot fermé |
|---|---|---|---|
| Windows (Chrome, Edge) | reste allumé | empêchée tant que l’écran reste allumé | mise en veille |
| macOS (Chrome) | reste allumé | empêchée tant que l’écran reste allumé | mise en veille (sauf mode clamshell) |
| Linux | le navigateur demande au bureau de ne pas se mettre en veille | dépend de l’environnement de bureau | mise en veille |

Ces informations viennent de la documentation des navigateurs et d’Apple et du code source, vérifiés le 26 septembre 2026 ; aucun test sur appareil n’est encore enregistré. Aucun navigateur ne garde un portable éveillé capot fermé.

## Préparer un long téléchargement en quatre gestes

1. Lancez le téléchargement, puis ouvrez AwakeTab dans une fenêtre séparée que vous laissez visible ; un coin de l’écran suffit. La durée « ∞ » est déjà choisie.
2. Touchez Démarrer et vérifiez que la pastille affiche « Écran allumé ».
3. Branchez le portable sur secteur : un écran allumé des heures consomme, et l’« Économiseur d’énergie » de Windows peut baisser la luminosité.
4. Ne réduisez pas la fenêtre et ne rabattez pas l’écran : dans les deux cas, le verrou tombe.

Sous Windows, le délai d’extinction de l’écran et celui de la mise en veille se règlent dans Paramètres → Système → Alimentation et batterie. Allonger vous-même ce délai reste la solution la plus sûre pour un transfert de plusieurs heures.

## Sur un Mac, prévoyez un outil natif

Tant que l’écran reste allumé, le Mac ne se met pas en veille pour inactivité (documentation IOKit d’Apple). Mais pour qu’il termine un téléchargement de nuit écran éteint, AwakeTab ne suffit pas. Un utilitaire natif agit au niveau du système : la commande `caffeinate` dans le Terminal, ou une application comme Caffeine. Nous comparons les deux approches dans [AwakeTab ou Caffeine](/fr/vs/caffeine). Les délais de l’écran se trouvent dans Réglages Système → Écran verrouillé.

## Batterie et chaleur

Un écran allumé toute la nuit consomme. Sous Chromium, AwakeTab peut s’arrêter seul à un seuil de batterie que vous fixez ; les autres navigateurs n’offrent pas forcément cette option. Si ce seuil est atteint, la session s’arrête et un message vous invite à brancher l’appareil avant de relancer.

## Ce que la pastille ne vous dira jamais

AwakeTab n’affiche « Écran allumé » que si le navigateur détient réellement le verrou. Si la fenêtre a été masquée, vous verrez « En pause — onglet masqué » à votre retour, et le compteur se sera arrêté pendant l’absence. Une pastille fidèle vaut mieux qu’un téléchargement que vous croyez protégé alors qu’il ne l’est plus. Pour tout ce qui relève du système, comme le capot fermé, un ordinateur éveillé écran éteint ou les stratégies d’entreprise, un outil natif ou un réglage reste le bon choix.
