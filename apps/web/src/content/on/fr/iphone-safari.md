---
title: "Garder l’écran de l’iPhone allumé dans Safari — AwakeTab"
description: "Safari 16.4+ garde l’écran de l’iPhone allumé dans un onglet visible. Le mode Économie d’énergie règle le verrouillage sur 30 s ; changer d’appli le coupe."
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
    a: "Le mode Économie d’énergie est sans doute activé : il règle le Verrouillage automatique sur 30 secondes et grise l’option Jamais. Safari ne refuse pas le verrou pour autant, mais nous n’avons pas encore vérifié sur un appareil si l’écran reste allumé dans ce cas. Pour retrouver un délai plus long, désactivez-le dans Réglages → Batterie."
  - q: "Mon iPhone est resté sur une version antérieure à iOS 16.4. Que se passe-t-il ?"
    a: "Safari n’y accorde pas de verrou natif. Touchez Démarrer pour lancer la vidéo de secours : la pastille affiche alors « Écran allumé grâce à la vidéo de secours ». Cette méthode consomme davantage de batterie."
  - q: "Et si j’ajoute AwakeTab à l’écran d’accueil ?"
    a: "Dans une application web ajoutée à l’écran d’accueil, le Wake Lock demande iOS 18.4 ou ultérieur. Sur une version plus ancienne, utilisez simplement AwakeTab dans Safari."
honestLimit: "Safari 16.4 ou ultérieur uniquement ; le mode Économie d’énergie règle le Verrouillage automatique sur 30 s (effet sur le verrou pas encore vérifié sur appareil) ; passer à une autre application libère le verrou."
related:
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/on/ios-home-screen"
  - "/on/ipad"
  - "/for/cooking"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Safari 16.4 suffit, à une condition

Safari 16.4 et les versions ultérieures prennent en charge le Wake Lock ; sur iPhone, l’onglet doit rester au premier plan. AwakeTab s’en sert pour empêcher l’écran de s’éteindre pendant la durée choisie, sans application à installer. Quitter Safari libère le verrou. Et le mode Économie d’énergie règle le Verrouillage automatique sur 30 secondes ; nous n’avons pas encore vérifié sur un appareil si un verrou Safari tient malgré tout.

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

**Safari sans toucher.** Safari n’accorde le verrou qu’après un toucher récent. Si la page a démarré seule, la pastille affiche « Bloqué — voici la solution » : touchez Démarrer une fois.

**Le mode Économie d’énergie.** Il règle le Verrouillage automatique sur 30 secondes et grise Jamais (assistance Apple, consultée le 26 septembre 2026). Safari ne vérifie pas ce mode et ne refuse donc pas le verrou ; son effet sur un verrou accordé n’a pas encore été vérifié sur un appareil. Notre guide [« Jamais » grisé dans le Verrouillage automatique](/fr/guides/iphone-verrouillage-auto-jamais-gris) détaille la manipulation.

**Le changement d’application.** Ouvrir Messages, l’appareil photo ou revenir à l’écran d’accueil masque l’onglet. Ce n’est pas un bug d’AwakeTab : iOS retire le verrou à toute page qui n’est plus visible.

**Une page ouverte hors HTTPS ou dans un cadre intégré.** Le Wake Lock exige une connexion sécurisée, et une intégration sans l’autorisation `screen-wake-lock` est refusée. Ouvrez AwakeTab directement.

## Où se règle le délai de l’iPhone

Réglages → Luminosité et affichage → Verrouillage automatique. Vous pouvez y garder un délai court au quotidien et laisser AwakeTab prendre le relais seulement quand une recette, une partition ou un tutoriel doit rester affiché.

## La pastille plutôt qu’une promesse

AwakeTab n’écrit « Écran allumé » que lorsque Safari a confirmé le verrou, et le minuteur ne tourne que pendant ce temps. Si l’écran s’assombrit malgré tout, regardez la pastille : elle vous dira si l’onglet a été masqué ou si la demande a été refusée.

Dernière vérification : 9 septembre 2026.
