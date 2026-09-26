---
title: "Garder l’écran de l’iPhone allumé dans Safari — AwakeTab"
description: "Safari 16.4+ garde l’écran de l’iPhone allumé dans un onglet visible. Le mode Économie d’énergie force un verrouillage à 30 s ; changer d’appli le coupe."
h1: "Garder l’écran de l’iPhone allumé dans Safari"
ogTitle: "Écran d’iPhone allumé dans Safari"
intent: "garder l'écran allumé iphone safari"
secondaryQueries: ["empêcher l'écran de l'iphone de s'éteindre", "iphone écran toujours allumé safari", "safari wake lock iphone", "empêcher la mise en veille iphone", "iphone écran s'éteint trop vite"]
preset: p30
mode: standard
locale: fr
reviewed: false
translationOf: "iphone-safari"
lastVerified: 2026-09-09
browsers: ["safari"]
os: ["ios"]
faq:
  - q: "Si je passe sur une autre appli puis reviens dans Safari, l’écran reste-t-il allumé ?"
    a: "Non. Quitter Safari, revenir à l’écran d’accueil ou changer d’onglet libère le verrou, et la pastille passe à « En pause — onglet masqué ». À votre retour, AwakeTab redemande le verrou ; si l’onglet est resté masqué trop longtemps, la session s’arrête et il faut la relancer."
  - q: "Pourquoi mon iPhone se verrouille après 30 secondes malgré AwakeTab ?"
    a: "Le mode Économie d’énergie est activé. Il grise l’option Jamais du Verrouillage automatique et impose 30 secondes, ce qui l’emporte sur AwakeTab. Désactivez-le dans Réglages → Batterie, puis rechargez la page."
  - q: "Mon iPhone est resté sur une version antérieure à iOS 16.4. Que se passe-t-il ?"
    a: "Safari n’y accorde pas de verrou natif. Touchez Démarrer pour lancer la vidéo de secours : la pastille affiche alors « Écran allumé grâce à la vidéo de secours ». Cette méthode consomme davantage de batterie."
  - q: "Et si j’ajoute AwakeTab à l’écran d’accueil ?"
    a: "Dans une application web ajoutée à l’écran d’accueil, le Wake Lock demande iOS 18.4 ou ultérieur. Sur une version plus ancienne, utilisez simplement AwakeTab dans Safari."
honestLimit: "Safari 16.4 ou ultérieur uniquement ; le mode Économie d’énergie impose un verrouillage automatique après 30 s ; passer à une autre application libère le verrou."
related:
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/on/ios-home-screen"
  - "/on/ipad"
  - "/for/cooking"
author: soubhik
published: 2026-09-26
---

## Safari 16.4 suffit, à une condition

Safari 16.4 et les versions ultérieures prennent en charge le Wake Lock ; sur iPhone, l’onglet doit rester au premier plan. AwakeTab s’en sert pour empêcher l’écran de s’éteindre pendant la durée choisie, sans application à installer. Deux choses l’en empêchent : le mode Économie d’énergie, qui grise l’option Jamais et force un verrouillage rapide, et le fait de quitter Safari, qui libère le verrou.

## Versions prises en charge sur iPhone

| Contexte | Version minimale | Résultat |
|---|---|---|
| Safari | iOS 16.4 | verrou natif, onglet visible |
| Application web sur l’écran d’accueil | iOS 18.4 | verrou natif |
| Safari plus ancien | — | vidéo de secours après un toucher, plus gourmande |

Seules ces lignes figurent dans notre matrice ; nous n’affirmons rien pour d’autres navigateurs sur iPhone.

## Mise en route sur l’iPhone

1. Ouvrez awaketab.com dans Safari. Sur cette page, la durée « 30 min » est présélectionnée.
2. Touchez Démarrer. Attendez que la pastille passe de « Démarrage… » à « Écran allumé ».
3. Laissez Safari au premier plan. Si vous devez consulter autre chose, revenez ensuite sur l’onglet et vérifiez la pastille.
4. À la fin des 30 minutes, une invite vous propose d’ajouter du temps ou d’arrêter.

## Ce qui bloque le plus souvent

**Le mode Économie d’énergie.** C’est la cause numéro un. Il impose un Verrouillage automatique à 30 secondes et prend le pas sur toute page web. AwakeTab affiche alors « Bloqué — voici la solution » et vous indique quoi faire : coupez-le depuis Réglages → Batterie, et rechargez ensuite la page. Notre guide [« Jamais » grisé dans le Verrouillage automatique](/fr/guides/iphone-verrouillage-auto-jamais-gris) détaille la manipulation.

**Le changement d’application.** Ouvrir Messages, l’appareil photo ou revenir à l’écran d’accueil masque l’onglet. Ce n’est pas un bug d’AwakeTab : iOS retire le verrou à toute page qui n’est plus visible.

**Une page ouverte hors HTTPS ou dans un cadre intégré.** Le Wake Lock exige une connexion sécurisée, et une intégration sans l’autorisation `screen-wake-lock` est refusée. Ouvrez AwakeTab directement.

## Où se règle le délai de l’iPhone

Réglages → Luminosité et affichage → Verrouillage automatique. Vous pouvez y garder un délai court au quotidien et laisser AwakeTab prendre le relais seulement quand une recette, une partition ou un tutoriel doit rester affiché.

## Une pastille honnête plutôt qu’une promesse

AwakeTab n’écrit « Écran allumé » que lorsque Safari a confirmé le verrou, et le minuteur ne tourne que pendant ce temps. Si l’écran s’assombrit malgré tout, regardez la pastille : elle vous dira si l’onglet a été masqué ou si la demande a été refusée.

Dernière vérification : 9 septembre 2026.
