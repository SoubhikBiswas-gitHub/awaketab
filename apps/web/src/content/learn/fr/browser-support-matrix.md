---
title: "Wake Lock : navigateurs compatibles — AwakeTab"
description: "Wake Lock natif dès Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 et Opera 70 (9 septembre 2026). Plus ancien : vidéo de secours."
h1: "Quels navigateurs prennent en charge le Wake Lock ?"
ogTitle: "Navigateurs compatibles Wake Lock"
intent: "wake lock compatibilité navigateurs"
secondaryQueries: ["screen wake lock api prise en charge", "wake lock safari version ios", "wake lock firefox version", "navigateur compatible garder l'écran allumé", "wake lock samsung internet", "écran toujours allumé navigateur"]
preset: p15
mode: standard
locale: fr
reviewed: false
translationOf: "browser-support-matrix"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Mon navigateur n’est pas dans le tableau. AwakeTab fonctionnera-t-il ?"
    a: "Nous ne revendiquons que les lignes vérifiées. Ouvrez AwakeTab : si le Wake Lock natif est absent, la pastille affiche « Touchez pour utiliser la solution de secours ». La vidéo de secours démarre après ce toucher et consomme davantage d’énergie."
  - q: "Chrome sur iPhone figure-t-il dans la matrice ?"
    a: "Il n’a pas de ligne dédiée, donc nous n’affirmons rien à son sujet. Sur iPhone, les lignes vérifiées sont Safari 16.4+ et les applications web de l’écran d’accueil à partir d’iOS 18.4."
  - q: "Pourquoi le verrou s’arrête quand je change d’onglet, même dans un navigateur compatible ?"
    a: "Parce que la spécification l’exige : un document masqué ne peut pas détenir de Wake Lock. Changer d’onglet, réduire la fenêtre ou passer à une autre application libère le verrou, quelle que soit la version du navigateur."
  - q: "Ces versions sont-elles encore à jour ?"
    a: "Le tableau reflète l’état au 9 septembre 2026, date de notre dernière vérification. Chaque ligne est liée à cette date de vérification ; les versions plus anciennes passent par la vidéo de secours."
honestLimit: "Le tableau reflète l’état au 9 septembre 2026 ; les versions plus anciennes passent par la solution de secours, et chaque ligne ne vaut que pour cette date de vérification."
related:
  - "/learn/screen-wake-lock-api-guide"
  - "/learn/how-we-tested"
  - "/on/ios-home-screen"
  - "/on/firefox"
  - "/on/iphone-safari"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Résumé

D’après notre fichier de référence daté du 9 septembre 2026, le Wake Lock natif (l’API Screen Wake Lock, qui garde l’écran allumé) est disponible à partir de Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 et Opera 70, ainsi que dans les applications web ajoutées à l’écran d’accueil sous iOS 18.4. Un Firefox plus ancien passe par la vidéo de secours. Un navigateur ou une plateforme sans ligne vérifiée n’est pas revendiqué.

## Le tableau de prise en charge

| Navigateur | Version minimale | Mécanisme | Plateformes | Remarque |
|---|---|---|---|---|
| Chrome | 84 | natif | Windows, macOS, Linux, Android, ChromeOS | onglet visible requis ; aucune vérification de l’économiseur de batterie |
| Edge | 84 | natif | Windows, macOS, Linux, Android | onglet visible requis |
| Firefox | 126 | natif | Windows, macOS, Linux, Android | versions antérieures : vidéo de secours après un geste ; refus à 5 % de batterie ou moins hors charge |
| Safari | 16.4 | natif | macOS, iOS, iPadOS | un toucher ou un clic est requis au démarrage |
| Samsung Internet | 14 | natif | Android | certains réglages d’économie peuvent fermer l’onglet une fois quitté |
| Opera | 70 | natif | Windows, macOS, Linux, Android | base Chromium |

## Deux contextes à part

| Contexte | Version minimale | Mécanisme | Remarque |
|---|---|---|---|
| Application web sur l’écran d’accueil iOS | 18.4 | natif | en dessous, utilisez AwakeTab dans Safari |
| Vidéo de secours | aucune | secours | exige un geste de l’utilisateur et consomme plus qu’un verrou natif |

## Comment lire ce tableau

Une version minimale indique à partir de quand le navigateur expose l’API. Elle ne garantit pas que le verrou sera accordé à chaque fois. Même dans un navigateur récent, la demande échoue ou le verrou est perdu dans ces situations :

- l’onglet est masqué (autre onglet, fenêtre réduite, autre application) ;
- elle est intégrée dans un cadre sans l’autorisation `screen-wake-lock` ;
- Safari n’a pas reçu de toucher ou de clic récent ;
- Firefox est à 5 % de batterie ou moins, hors charge.

Sans HTTPS, l’API est absente : la pastille propose alors « Touchez pour utiliser la solution de secours ». L’économiseur de batterie et le mode Économie d’énergie ne refusent pas la demande.

AwakeTab traduit chacun de ces cas en un état visible. La pastille affiche « Écran allumé » ou « Écran allumé grâce à la vidéo de secours » uniquement quand un verrou est réellement actif ; sinon, elle indique « En pause — onglet masqué » ou « Bloqué — voici la solution », avec la cause. Pour Safari sur iPhone, voyez aussi [notre page dédiée](/fr/on/iphone-safari).

## Méthode et date

Toutes les lignes proviennent d’un seul fichier de données, mis à jour le 9 septembre 2026, qui alimente aussi l’outil. Ces lignes s’appuient sur la documentation et le code source des navigateurs (vérifiés le 26 septembre 2026), pas sur des tests d’appareils, qui ne sont pas encore enregistrés. Sous Linux, Chrome et Firefox demandent au bureau, via D-Bus, de ne pas se mettre en veille ; le résultat dépend de l’environnement de bureau. Nous n’ajoutons aucune part de marché ni aucune version non vérifiée. Quand un navigateur change de comportement, la ligne est revérifiée et la date avancée.

## Et la veille du système ?

Ce tableau ne concerne que l’écran. Tant que l’écran reste allumé, ni Windows ni macOS ne se mettent en veille pour inactivité, mais un capot fermé endort un portable. Le détail par système figure sur les pages [Windows 11](/fr/on/windows-11) et [macOS](/fr/on/macos).
