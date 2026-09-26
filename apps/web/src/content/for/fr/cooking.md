---
title: "Garder l’écran allumé en cuisinant — AwakeTab"
description: "La recette reste lisible : AwakeTab empêche l’écran du téléphone ou de la tablette de s’éteindre tant que l’onglet est visible. Changer d’appli le coupe."
h1: "Garder l’écran allumé pendant que vous cuisinez"
ogTitle: "Garder l’écran allumé en cuisinant"
intent: "garder l'écran allumé en cuisinant"
secondaryQueries: ["écran toujours allumé recette", "empêcher l'écran de s'éteindre en cuisine", "téléphone se met en veille pendant la recette", "mode cuisine écran allumé", "tablette cuisine écran qui s'éteint"]
preset: pinf
mode: cook
locale: fr
reviewed: false
translationOf: "cooking"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Je passe sur l’appli minuteur et l’écran s’éteint quand même. Pourquoi ?"
    a: "Dès que vous quittez l’onglet AwakeTab pour une autre application, le navigateur retire le verrou : un onglet masqué ne peut pas le conserver. Revenez sur la page, attendez que la pastille repasse à « Écran allumé », ou placez les deux applis côte à côte en écran partagé."
  - q: "Ma recette est dans une autre appli. Comment garder les deux à l’écran ?"
    a: "Utilisez Split View sur iPad ou l’écran partagé sur Android, avec AwakeTab dans une moitié et la recette dans l’autre. Tant que l’onglet AwakeTab reste affiché, l’écran ne s’éteint pas ; s’il disparaît, le verrou tombe."
  - q: "Faut-il brancher le téléphone pour une longue cuisson ?"
    a: "C’est préférable. Un écran allumé pendant deux heures de mijotage consomme de l’énergie, et si vous activez l’économiseur de batterie ou le mode Économie d’énergie pour compenser, le navigateur peut refuser le verrou."
  - q: "Quels navigateurs fonctionnent sur la tablette de la cuisine ?"
    a: "Le verrou natif est accordé par Safari 16.4+, Chrome 84+, Edge 84+, Firefox 126+ et Samsung Internet 14+ (matrice du 9 septembre 2026). Un Firefox plus ancien peut utiliser la vidéo de secours après un toucher."
honestLimit: "Fonctionne tant que l’onglet AwakeTab est à l’écran ; sur un téléphone, ouvrir une autre application libère le verrou jusqu’à votre retour."
related:
  - "/for/reading"
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/learn/browser-support-matrix"
author: soubhik
published: 2026-09-26
---

## La réponse courte

Les mains pleines de farine, vous levez les yeux vers la recette… et l’écran s’est éteint. AwakeTab garde l’écran allumé directement dans le navigateur grâce au Wake Lock (le verrou d’éveil de l’écran), sans application à installer. Une seule condition : l’onglet AwakeTab doit rester visible, que ce soit en plein écran, à côté de la recette en écran partagé, ou comme seul onglet sur lequel vous jetez un œil. Sur un téléphone, ouvrir une autre application libère le verrou jusqu’à ce que vous reveniez.

## Mise en place avant d’allumer le feu

1. Ouvrez cette page sur le téléphone ou la tablette posé sur le plan de travail. Le mode cuisine et la durée « ∞ » (« Jusqu’à ce que j’arrête ») sont déjà sélectionnés.
2. Touchez Démarrer et attendez que la pastille affiche « Écran allumé ».
3. Si la recette vit dans une autre appli ou un autre site, mettez les deux côte à côte (Split View sur iPad, écran partagé sur Android) pour qu’AwakeTab reste à l’écran.
4. Pour un plat qui mijote longtemps, branchez l’appareil.

## Ce que la pastille vous dit pendant la recette

La pastille est le cœur de l’outil : elle n’annonce « Écran allumé » que lorsque le navigateur a réellement accordé le verrou. Sur un navigateur sans prise en charge native, comme un ancien Firefox, un toucher lance la vidéo de secours et la pastille indique « Écran allumé grâce à la vidéo de secours » ; cette méthode consomme davantage de batterie.

Si vous êtes allé vérifier un message, vous verrez « En pause — onglet masqué » en revenant, le temps que le verrou soit redemandé. Si l’économiseur de batterie ou le mode Économie d’énergie refuse la demande, la pastille passe à « Bloqué — voici la solution » et indique la cause. Toucher Démarrer en boucle ne change rien : tant que la condition reste la même, le refus aussi. Le minuteur et les statistiques ne tournent que lorsque le verrou est réellement détenu.

## Téléphone ou tablette : les réglages à vérifier

- **iPhone et iPad** : Réglages → Luminosité et affichage → Verrouillage automatique. Le mode Économie d’énergie grise l’option Jamais et impose un verrouillage après 30 secondes, AwakeTab compris. Désactivez-le avant de commencer.
- **Android** : Paramètres → Affichage → Mise en veille de l’écran. L’économiseur de batterie peut refuser le verrou, et certaines surcouches de fabricants endorment les applications qu’elles jugent inutilisées.

## Les navigateurs qui conviennent

D’après notre matrice du 9 septembre 2026, Safari à partir de 16.4, Chrome et Edge à partir de 84, Samsung Internet à partir de 14 et Firefox à partir de 126 accordent un verrou natif. Une recette enregistrée comme application sur l’écran d’accueil de l’iPhone demande iOS 18.4. Le détail par navigateur se trouve dans [la matrice de prise en charge](/fr/learn/matrice-prise-en-charge).

## Ce qu’AwakeTab ne fait pas en cuisine

AwakeTab garde un écran allumé ; ce n’est ni une minuterie de sécurité ni un moniteur. Ne laissez pas un téléphone sans surveillance en guise d’alarme près des plaques. Un portable posé dans la cuisine se met en veille dès que vous fermez le capot, quoi que fasse l’onglet. Et sur un écran OLED, laisser la même image affichée des heures n’est jamais sans risque : le mode nuit décale légèrement les pixels, ce qui réduit le marquage sans le supprimer.
