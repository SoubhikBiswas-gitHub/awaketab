---
title: "Verrouillage auto « Jamais » grisé sur iPhone — AwakeTab"
description: "Sur iPhone, Jamais est grisé quand le mode Économie d’énergie règle le Verrouillage automatique sur 30 s, ou quand un profil professionnel le limite."
h1: "Verrouillage automatique « Jamais » grisé sur iPhone : la solution"
ogTitle: "« Jamais » grisé sur iPhone : que faire"
intent: "verrouillage automatique jamais grisé iphone"
secondaryQueries: ["impossible de mettre verrouillage automatique sur jamais", "iphone verrouillage automatique bloqué 30 secondes", "mode économie d'énergie verrouillage automatique", "iphone écran s'éteint après 30 secondes", "garder l'écran allumé iphone"]
preset: p30
mode: standard
locale: fr
reviewed: false
translationOf: "iphone-auto-lock-never-greyed-out"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Pourquoi « Jamais » est-il grisé alors que ma batterie est chargée ?"
    a: "Parce que le mode Économie d’énergie peut rester actif alors que la batterie est remontée. Vérifiez Réglages → Batterie ou l’icône de batterie : si elle est jaune, le mode est encore activé. Sinon, un profil professionnel ou scolaire (MDM) limite peut-être le délai : voyez Réglages → Général → VPN et gestion de l’appareil."
  - q: "AwakeTab fonctionne-t-il quand le mode Économie d’énergie est activé ?"
    a: "Safari ne vérifie pas ce mode et ne refuse donc pas le verrou pour cette raison. Mais le mode règle le Verrouillage automatique sur 30 secondes, et nous n’avons pas encore vérifié sur un appareil si l’écran reste allumé malgré tout. Le résultat figurera sur notre page consacrée aux tests."
  - q: "Si je quitte Safari pour une autre appli, l’écran reste-t-il allumé ?"
    a: "Non. Dès que l’onglet AwakeTab n’est plus visible, iOS retire le verrou et la pastille passe à « En pause — onglet masqué ». C’est alors le Verrouillage automatique qui reprend la main."
  - q: "Faut-il laisser le Verrouillage automatique sur Jamais en permanence ?"
    a: "Ce n’est pas nécessaire. Vous pouvez garder un délai court au quotidien et ouvrir AwakeTab dans Safari seulement quand un écran doit rester allumé ; la session s’arrête à la fin de la durée choisie."
honestLimit: "Le mode Économie d’énergie grise l’option Jamais et règle le verrouillage sur 30 s ; nous n’avons pas encore vérifié sur un appareil si le verrou de Safari tient malgré tout. Un profil professionnel peut aussi limiter ce délai."
related:
  - "/on/iphone-safari"
  - "/learn/low-power-mode-and-wake-locks"
  - "/for/cooking"
  - "/for/night-clock"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Pourquoi l’option est grisée

La cause tient en une phrase : le mode Économie d’énergie grise l’option Jamais dans Réglages → Luminosité et affichage → Verrouillage automatique, et force un verrouillage au bout de 30 secondes. Plus rarement, un profil professionnel ou scolaire (MDM) limite ce délai. Désactivez le mode pour choisir Jamais, ou laissez le réglage tel quel et gardez l’écran allumé avec AwakeTab dans Safari 16.4+ tant que vous restez sur l’onglet.

## Débloquer « Jamais » en trois étapes

1. Ouvrez **Réglages → Batterie** et désactivez **Mode Économie d’énergie**. Vous pouvez aussi toucher l’icône de batterie dans le Centre de contrôle.
2. Revenez dans **Réglages → Luminosité et affichage → Verrouillage automatique**.
3. Touchez **Jamais**, ou une durée plus longue que 30 secondes.

Si l’option devient sélectionnable, le problème venait bien du mode Économie d’énergie.

## Si l’option reste grisée

Revérifiez l’icône de batterie en haut de l’écran : jaune, elle signale que le mode Économie d’énergie est encore actif. Tant qu’il l’est, iOS ne vous laissera pas choisir Jamais. Si l’icône n’est pas jaune, ouvrez Réglages → Général → VPN et gestion de l’appareil : un profil professionnel ou scolaire peut limiter le Verrouillage automatique, et seul son administrateur peut le changer. Rechargez un peu l’iPhone si la batterie est très basse, puis refaites les étapes ci-dessus.

## Ou passez les réglages : ouvrez AwakeTab

Vous ne voulez pas toucher au Verrouillage automatique pour une seule recette ou un seul tutoriel ? AwakeTab garde l’écran allumé depuis Safari, sans modifier vos réglages. La durée proposée ici est de « 30 min » ; touchez Démarrer et attendez que la pastille indique « Écran allumé ».

Deux conditions à respecter. D’abord, touchez Démarrer vous-même : Safari n’accorde le verrou qu’après un toucher. Ensuite, Safari doit rester au premier plan : changer d’application libère le verrou jusqu’à votre retour. Avec le mode Économie d’énergie actif, Safari ne refuse pas le verrou, mais son effet sur l’écran n’a pas encore été vérifié sur un appareil.

Les versions requises : Safari 16.4 ou ultérieur dans le navigateur, et iOS 18.4 si vous avez ajouté AwakeTab à l’écran d’accueil. Sur un iOS plus ancien, un toucher lance une vidéo de secours, plus gourmande en batterie. Tous les détails pour Safari sont sur notre page [iPhone et Safari](/fr/on/iphone-safari).

## Réglage système ou onglet : que choisir ?

Le Verrouillage automatique sur Jamais s’applique partout, à toutes les applications, jusqu’à ce que vous le changiez. C’est pratique sur un iPhone fixé au mur ou branché en permanence, beaucoup moins dans une poche. AwakeTab ne vaut que pour l’onglet visible et s’arrête à la fin de la durée choisie, ce qui évite d’oublier un écran allumé. Dans les deux cas, pensez à la batterie : un écran qui ne s’éteint jamais la vide vite.

Dernière vérification : 9 septembre 2026.
