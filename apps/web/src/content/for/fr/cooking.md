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
lead: "Les mains pleines de farine, vous levez les yeux vers la recette… et l’écran s’est éteint. AwakeTab garde l’écran allumé directement dans le navigateur grâce au Wake Lock (le verrou d’éveil de l’écran), sans application à installer. Une seule condition : l’onglet AwakeTab doit rester visible, que ce soit en plein écran, à côté de la recette en écran partagé, ou comme seul onglet sur lequel vous jetez un œil. Sur un téléphone, ouvrir une autre application libère le verrou jusqu’à ce que vous reveniez."
crumb: "Cuisine"
toc:
  ce-que-la-pastille-vous-dit-pendant-la-recette: "Ce que dit la pastille"
  téléphone-ou-tablette--les-réglages-à-vérifier: "Les réglages à vérifier"
  ce-quawaketab-ne-fait-pas-en-cuisine: "Ce qu’AwakeTab ne fait pas"
steps:
  - title: "Ouvrez cette page sur le téléphone ou la tablette posé sur le plan de travail."
    text: "Le mode cuisine et la durée « ∞ » (« Jusqu’à ce que j’arrête ») sont déjà sélectionnés. Pour un plat qui mijote longtemps, branchez l’appareil."
  - title: "Touchez Démarrer."
    text: "Attendez que la pastille affiche « Écran allumé »."
  - title: "Si la recette vit dans une autre appli ou un autre site, mettez les deux côte à côte."
    text: "Fenêtres sur iPad, écran partagé sur Android : AwakeTab reste ainsi à l’écran. Sur iPhone, c’est impossible : une seule appli est au premier plan."
figures:
  - frame: phone
    label: "Capture du téléphone"
    alt: "AwakeTab en mode cuisine sur un iPhone"
    caption: "Le mode cuisine sur un iPhone."
  - frame: desktop
    label: "Capture de la tablette"
    alt: "la recette et AwakeTab côte à côte sur un iPad"
    caption: "La recette et AwakeTab côte à côte sur un iPad."
pills:
  - state: held
    text: "Le navigateur a réellement accordé le verrou. Le minuteur et les statistiques ne tournent que dans cet état."
  - state: lost
    text: "Vous êtes allé vérifier un message. Vous verrez cet état en revenant, le temps que le verrou soit redemandé."
  - state: denied
    text: "Le navigateur refuse la demande, par exemple parce que Safari attend un toucher ou que Firefox est à 5 % de batterie ou moins, et la pastille indique la cause. L’économiseur de batterie ne provoque pas ce refus. Hors toucher manquant, toucher Démarrer en boucle ne change rien."
  - state: fallback
    text: "Sur un navigateur sans prise en charge native, comme un ancien Firefox, un toucher lance la vidéo de secours. Cette méthode consomme davantage de batterie."
checklist:
  - "Pour un plat qui mijote longtemps, branchez l’appareil."
  - "Attendez que la pastille affiche « Écran allumé »."
  - "Ne laissez pas un téléphone sans surveillance en guise d’alarme près des plaques."
faq:
  - q: "Je passe sur l’appli minuteur et l’écran s’éteint quand même. Pourquoi ?"
    a: "Dès que vous quittez l’onglet AwakeTab pour une autre application, le navigateur retire le verrou : un onglet masqué ne peut pas le conserver. Revenez sur la page, attendez que la pastille repasse à « Écran allumé », ou placez les deux applis côte à côte en écran partagé."
  - q: "Ma recette est dans une autre appli. Comment garder les deux à l’écran ?"
    a: "Sur iPad, placez les deux fenêtres côte à côte (Split View sur iPadOS 18 et versions antérieures) ; sur Android, utilisez l’écran partagé. Tant que l’onglet AwakeTab reste affiché, l’écran ne s’éteint pas. Sur iPhone, une seule appli est au premier plan : AwakeTab ne peut pas garder allumée une recette ouverte ailleurs."
  - q: "Faut-il brancher le téléphone pour une longue cuisson ?"
    a: "C’est préférable. Un écran allumé pendant deux heures de mijotage consomme de l’énergie, et l’économiseur de batterie ou le mode Économie d’énergie peut raccourcir le délai de mise en veille ; sur iPhone, il règle le Verrouillage automatique sur 30 secondes."
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
updated: 2026-09-27
---

## Mise en place avant d’allumer le feu

::steps

::figures

::ad

## Ce que la pastille vous dit pendant la recette

La pastille est le cœur de l’outil : elle n’annonce « Écran allumé » que lorsque le navigateur a réellement accordé le verrou.

::pills

## Téléphone ou tablette : les réglages à vérifier

- **iPhone et iPad** : Réglages → Luminosité et affichage → Verrouillage automatique. Le mode Économie d’énergie règle le Verrouillage automatique sur 30 secondes et grise l’option Jamais. Safari ne refuse pas le verrou pour autant ; nous n’avons pas encore vérifié sur un appareil si l’écran reste allumé dans ce cas.
- **Android** : Paramètres → Affichage → Mise en veille de l’écran (Pixel : « Display & touch »). L’économiseur de batterie peut raccourcir ce délai ou baisser la luminosité, sans refuser le verrou, et certaines surcouches de fabricants ferment le navigateur une fois que vous l’avez quitté.

::checklist

## Les navigateurs qui conviennent

D’après notre matrice du 9 septembre 2026, Safari à partir de 16.4, Chrome et Edge à partir de 84, Samsung Internet à partir de 14 et Firefox à partir de 126 accordent un verrou natif. Une recette enregistrée comme application sur l’écran d’accueil de l’iPhone demande iOS 18.4. Le détail par navigateur se trouve dans [la matrice de prise en charge](/fr/learn/matrice-prise-en-charge).

## Ce qu’AwakeTab ne fait pas en cuisine

AwakeTab garde un écran allumé ; ce n’est ni une minuterie de sécurité ni un moniteur. Un portable posé dans la cuisine se met en veille dès que vous fermez le capot, quoi que fasse l’onglet. Et sur un écran OLED, laisser la même image affichée des heures n’est jamais sans risque : le mode nuit décale légèrement les pixels, ce qui réduit le marquage sans le supprimer.

