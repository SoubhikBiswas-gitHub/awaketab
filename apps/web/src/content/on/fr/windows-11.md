---
title: "Garder l’écran allumé sous Windows 11 — AwakeTab"
description: "Sous Windows 11, Chrome et Edge 84+ gardent l’écran allumé dans un onglet visible. L’économiseur de batterie le refuse ; fermer le capot endort le PC."
h1: "Empêcher l’écran de s’éteindre sous Windows 11"
ogTitle: "Écran allumé sous Windows 11"
intent: "garder l'écran allumé windows 11"
secondaryQueries: ["empêcher l'écran de s'éteindre windows 11", "windows 11 écran se met en veille", "désactiver mise en veille écran windows 11", "écran toujours allumé windows 11", "pc portable écran s'éteint windows 11"]
preset: p60
mode: standard
locale: fr
reviewed: false
translationOf: "windows-11"
lastVerified: 2026-09-09
browsers: ["chrome", "edge"]
os: ["windows"]
faq:
  - q: "Si je réduis Chrome ou change d’onglet, l’écran reste-t-il allumé ?"
    a: "Non. Réduire la fenêtre ou passer à un autre onglet masque la page, et le navigateur libère le verrou. La pastille indique « En pause — onglet masqué » jusqu’à votre retour. Pour travailler dans d’autres fenêtres, gardez AwakeTab visible à côté ou utilisez la fenêtre flottante."
  - q: "Pourquoi « Bloqué — voici la solution » s’affiche sur mon portable ?"
    a: "L’économiseur de batterie de Windows refuse la demande de verrou. Branchez le PC ou désactivez l’économiseur, puis cliquez sur Démarrer. Recommencer sans rien changer mène au même refus."
  - q: "Mon PC est compatible veille moderne. Cela change-t-il quelque chose ?"
    a: "La veille moderne (Modern Standby) est une affaire de micrologiciel et de pilotes. Un Wake Lock agit sur l’écran, pas sur les états basse consommation de la machine ; ce sont les pilotes et le firmware qui décident du reste."
  - q: "Teams va-t-il me passer en « Absent » malgré AwakeTab ?"
    a: "Oui, c’est possible. Teams mesure votre présence d’après le clavier et la souris, pas d’après l’écran. AwakeTab ne déplace jamais la souris et n’appuie sur aucune touche."
honestLimit: "L’économiseur de batterie refuse le verrou ; la veille moderne (Modern Standby) ajoute ses propres particularités ; fermer le capot met toujours le PC en veille."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/modern-standby"
  - "/on/edge"
  - "/for/downloads"
author: soubhik
published: 2026-09-26
---

## Chrome et Edge tiennent l’écran, tant que l’onglet est visible

Sous Windows 11, Chrome 84+ et Edge 84+ accordent un Wake Lock natif, à condition que l’onglet AwakeTab reste visible. C’est la façon la plus simple d’empêcher l’écran de s’éteindre sans toucher aux paramètres d’alimentation ni installer de logiciel. Trois limites : l’économiseur de batterie refuse la demande, fermer le capot met le PC en veille, et la veille moderne (Modern Standby) obéit à ses propres règles de micrologiciel.

## Navigateurs testés sous Windows

| Navigateur | Version minimale | Remarque |
|---|---|---|
| Chrome | 84 | verrou refusé ou perdu possible sous économiseur de batterie |
| Edge | 84 | mode efficacité : effet possible sur le verrou |
| Firefox | 126 | versions antérieures : vidéo de secours après un clic |
| Opera | 70 | base Chromium, onglet visible requis |

Matrice vérifiée le 9 septembre 2026.

## Pas à pas sur un PC Windows 11

1. Ouvrez awaketab.com dans Chrome ou Edge. Sur cette page, la durée « 1 h » est présélectionnée.
2. Cliquez sur Démarrer (ou touche Espace), puis contrôlez la pastille : elle doit indiquer « Écran allumé ».
3. Pour travailler dans d’autres applications, laissez la fenêtre AwakeTab visible dans un coin, ou ouvrez la « Fenêtre flottante » depuis l’en-tête.
4. Sur un portable, restez sur secteur si vous voulez éviter un refus de l’économiseur de batterie.

## Les paramètres de Windows à connaître

Les délais d’extinction de l’écran et de mise en veille se trouvent dans Paramètres → Système → Alimentation et batterie. Si vous avez les droits d’administration, les allonger est une solution durable. Sur un PC géré par une entreprise, ces réglages sont souvent verrouillés par une stratégie : AwakeTab reste alors utilisable, mais seulement tant que son onglet est visible. Notre guide sur l’écran qui s’éteint au bout d’une minute détaille ces cas.

## Économiseur de batterie, mode efficacité, veille moderne

**Économiseur de batterie.** Quand il est actif, Windows peut refuser le verrou d’éveil. La pastille le dit clairement par « Bloqué — voici la solution », avec la cause.

**Mode efficacité d’Edge.** La matrice note qu’il peut influer sur le verrou. Si la pastille repasse en pause sans raison apparente, vérifiez ce réglage.

**Veille moderne.** Beaucoup de portables récents utilisent cet état de veille « toujours connecté ». Un Wake Lock ne décide que de l’écran ; les pilotes et le firmware gèrent le reste, d’où des comportements variables d’un modèle à l’autre.

## Ce que la page ne peut pas faire

Fermer le capot endort le PC, et aucun onglet n’y peut rien. Un verrouillage de session imposé par l’entreprise ou le retrait d’une carte à puce n’est pas le délai d’extinction de l’écran, et AwakeTab ne le contourne pas. Pour un long transfert, voyez aussi notre page [téléchargements](/fr/for/telechargements).

Dernière vérification : 9 septembre 2026.
