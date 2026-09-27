---
title: "Garder l’écran allumé sous Windows 11 et 10 — AwakeTab"
description: "Sous Windows 11 et 10, Chrome et Edge 84+ gardent l’écran allumé dans un onglet visible. Fermer le capot endort quand même le PC."
h1: "Empêcher l’écran de s’éteindre sous Windows 11 et 10"
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
    a: "Le navigateur a refusé le verrou, et la cause s’affiche sous la pastille. Ce n’est pas l’« Économiseur d’énergie » : Chrome et Edge ne le vérifient pas. Le plus souvent, l’onglet n’était pas visible au démarrage, ou AwakeTab est intégré dans une page sans l’autorisation screen-wake-lock. Ouvrez awaketab.com directement et cliquez sur Démarrer."
  - q: "Mon PC est compatible veille moderne. Cela change-t-il quelque chose ?"
    a: "La veille moderne (Modern Standby) est une affaire de micrologiciel et de pilotes. Un Wake Lock agit sur l’écran, pas sur les états basse consommation de la machine ; ce sont les pilotes et le firmware qui décident du reste."
  - q: "Teams va-t-il me passer en « Absent » malgré AwakeTab ?"
    a: "Oui, c’est possible. Teams mesure votre présence d’après le clavier et la souris, pas d’après l’écran. AwakeTab ne déplace jamais la souris et n’appuie sur aucune touche."
honestLimit: "L’onglet doit rester visible ; l’« Économiseur d’énergie » peut baisser la luminosité ; la veille moderne (Modern Standby) ajoute ses propres particularités ; fermer le capot met le PC en veille."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/lock-screen-vs-sleep"
  - "/on/edge"
  - "/for/downloads"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Chrome et Edge tiennent l’écran, tant que l’onglet est visible

Sous Windows 11, Chrome 84+ et Edge 84+ accordent un Wake Lock natif, à condition que l’onglet AwakeTab reste visible. C’est la façon la plus simple d’empêcher l’écran de s’éteindre sans toucher aux paramètres d’alimentation ni installer de logiciel. Tant que l’écran reste allumé, Windows ne se met pas non plus en veille pour inactivité. Deux limites : fermer le capot met le PC en veille, et la veille moderne (Modern Standby) obéit à ses propres règles de micrologiciel. Les mêmes étapes fonctionnent sous Windows 10.

## Navigateurs pris en charge sous Windows

| Navigateur | Version minimale | Remarque |
|---|---|---|
| Chrome | 84 | onglet visible requis ; fenêtre flottante dès 116 |
| Edge | 84 | onglet visible requis ; fenêtre flottante dès 116 |
| Firefox | 126 | versions antérieures : vidéo de secours après un clic |
| Opera | 70 | base Chromium, onglet visible requis |

Matrice vérifiée le 9 septembre 2026.

## Pas à pas sur un PC Windows 11

1. Ouvrez awaketab.com dans Chrome ou Edge. Sur cette page, la durée « 1 h » est présélectionnée.
2. Cliquez sur Démarrer (ou touche Espace), puis contrôlez la pastille : elle doit indiquer « Écran allumé ».
3. Pour travailler dans d’autres applications, laissez la fenêtre AwakeTab visible dans un coin, ou ouvrez la « Fenêtre flottante » depuis l’en-tête.
4. Sur un portable, restez sur secteur pour les longues sessions : sur batterie, l’« Économiseur d’énergie » peut baisser la luminosité.

## Les paramètres de Windows à connaître

Les délais d’extinction de l’écran et de mise en veille se trouvent dans Paramètres → Système → Alimentation et batterie. Si vous avez les droits d’administration, les allonger est une solution durable. Sur un PC géré par une entreprise, ces réglages sont souvent verrouillés par une stratégie : AwakeTab reste alors utilisable, mais seulement tant que son onglet est visible. Notre guide sur l’écran qui s’éteint au bout d’une minute détaille ces cas.

## Économiseur d’énergie, mode efficacité, veille moderne

**Économiseur d’énergie.** Depuis Windows 11 24H2, l’ancien « Économiseur de batterie » s’appelle « Économiseur d’énergie » (Energy saver). Il peut baisser la luminosité ou raccourcir les délais, mais ne refuse pas le verrou de Chrome ou d’Edge : Chromium ne le vérifie pas. Si la pastille affiche « Bloqué — voici la solution », la cause est ailleurs et s’affiche avec elle.

**Mode efficacité d’Edge.** Aucune source ne montre qu’il agit sur le verrou, et nous ne l’avons pas encore vérifié sur un appareil. Si la pastille repasse en pause sans raison apparente, vérifiez ce réglage.

**Veille moderne.** Beaucoup de portables récents utilisent cet état de veille « toujours connecté ». Un Wake Lock ne décide que de l’écran ; les pilotes et le firmware gèrent le reste, d’où des comportements variables d’un modèle à l’autre.

## Ce que la page ne peut pas faire

Fermer le capot endort le PC, et aucun onglet n’y peut rien. Un verrouillage de session imposé par l’entreprise ou le retrait d’une carte à puce n’est pas le délai d’extinction de l’écran, et AwakeTab ne le contourne pas. Pour un long transfert, voyez aussi notre page [téléchargements](/fr/for/telechargements).

Dernière vérification : 9 septembre 2026.
