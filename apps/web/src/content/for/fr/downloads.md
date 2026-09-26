---
title: "Écran allumé pendant un téléchargement — AwakeTab"
description: "AwakeTab garde l’écran allumé pendant un long téléchargement. La veille du système dépend de l’OS : retenue sous Windows avec Chromium, pas sur macOS."
h1: "Écran allumé pendant un téléchargement : ce qu’AwakeTab garantit"
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
    a: "Oui. Sur macOS, AwakeTab garde l’écran allumé, mais la veille du système pour inactivité n’a pas été retenue dans nos tests. Pour un téléchargement de nuit sur Mac, utilisez un outil natif comme la commande caffeinate, et laissez le capot ouvert."
  - q: "Et sous Windows avec Chrome ou Edge ?"
    a: "Dans nos tests, Chromium sous Windows a aussi retenu la veille du système pendant que l’onglet était visible. L’économiseur de batterie peut toutefois refuser le verrou : branchez le portable. Fermer le capot le met en veille quoi qu’il arrive."
  - q: "Est-ce que cela me garde « Disponible » dans Teams pendant l’attente ?"
    a: "Non. Teams et Slack calculent votre présence d’après l’activité du clavier et de la souris, pas d’après l’écran. AwakeTab ne simule jamais de frappe ni de mouvement de souris."
honestLimit: "Garde l’écran allumé ; la veille du système pour inactivité dépend de l’OS (Chromium sous Windows : oui dans nos tests ; macOS : non). Fermer le capot met toujours l’ordinateur en veille."
related:
  - "/on/windows-11"
  - "/on/macos"
  - "/vs/caffeine"
  - "/for/work-laptop"
author: soubhik
published: 2026-09-26
---

## Ce qu’AwakeTab fait vraiment pendant un téléchargement

Un gros fichier, une sauvegarde vers le cloud ou l’installation d’un jeu s’interrompt net quand l’ordinateur se met en veille. AwakeTab demande au navigateur un Wake Lock d’écran : l’affichage reste allumé tant que l’onglet est visible. Mais un verrou d’écran n’est pas un verrou système. Que le reste de la machine échappe aussi à la veille pour inactivité dépend du système d’exploitation, pas de cette page. Et fermer le capot endort toujours un portable.

## Windows, macOS, Linux : ce que nous avons constaté

| Système | Écran | Veille du système pour inactivité | Capot fermé |
|---|---|---|---|
| Windows (Chromium) | reste allumé | retenue dans nos tests | mise en veille |
| macOS | reste allumé | non retenue dans nos tests | mise en veille |
| Linux (Ubuntu 24.04, GNOME) | idle-inhibit testé avec Firefox 126+ et Chrome 84+ | non affirmé | mise en veille |

Ces résultats datent de la vérification du 9 septembre 2026. Aucun navigateur ne garde un portable éveillé capot fermé.

## Préparer un long téléchargement en quatre gestes

1. Lancez le téléchargement, puis ouvrez AwakeTab dans une fenêtre séparée que vous laissez visible ; un coin de l’écran suffit. La durée « ∞ » est déjà choisie.
2. Touchez Démarrer et vérifiez que la pastille affiche « Écran allumé ».
3. Branchez le portable sur secteur. L’économiseur de batterie de Windows peut refuser le verrou, et la pastille afficherait alors « Bloqué — voici la solution ».
4. Ne réduisez pas la fenêtre et ne rabattez pas l’écran : dans les deux cas, le verrou tombe.

Sous Windows, le délai d’extinction de l’écran et celui de la mise en veille se règlent dans Paramètres → Système → Alimentation et batterie. Allonger vous-même ce délai reste la solution la plus sûre pour un transfert de plusieurs heures.

## Sur un Mac, prévoyez un outil natif

Comme macOS n’a pas retenu la veille du système dans nos tests, AwakeTab ne suffit pas à garantir qu’un Mac termine un téléchargement de nuit écran éteint. Un utilitaire natif agit au niveau du système : la commande `caffeinate` dans le Terminal, ou une application comme Caffeine. Nous comparons les deux approches dans [AwakeTab ou Caffeine](/fr/vs/caffeine). Les délais de l’écran se trouvent dans Réglages Système → Écran verrouillé.

## Batterie et chaleur

Un écran allumé toute la nuit consomme. Sous Chromium, AwakeTab peut s’arrêter seul à un seuil de batterie que vous fixez ; les autres navigateurs n’offrent pas forcément cette option. Si ce seuil est atteint, la session s’arrête et un message vous invite à brancher l’appareil avant de relancer.

## Ce que la pastille ne vous dira jamais

AwakeTab n’affiche « Écran allumé » que si le navigateur détient réellement le verrou. Si la fenêtre a été masquée, vous verrez « En pause — onglet masqué » à votre retour, et le compteur se sera arrêté pendant l’absence. Une pastille fidèle vaut mieux qu’un téléchargement que vous croyez protégé alors qu’il ne l’est plus. Pour tout ce qui relève du système — capot fermé, veille pour inactivité sur Mac, stratégies d’entreprise — un outil natif reste le bon choix.
