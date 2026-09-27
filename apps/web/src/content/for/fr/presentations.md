---
title: "Écran allumé pendant une présentation — AwakeTab"
description: "En présentation, AwakeTab tient l’écran s’il reste visible : fenêtre flottante (Chrome, Edge, Firefox) ou second écran. Le plein écran masque l’onglet."
h1: "Garder l’écran allumé pendant une présentation"
ogTitle: "Écran allumé pendant une présentation"
intent: "garder l'écran allumé pendant une présentation"
secondaryQueries: ["empêcher l'écran de s'éteindre pendant un diaporama", "écran se met en veille pendant powerpoint", "projecteur se met en veille présentation", "écran toujours allumé réunion", "empêcher la mise en veille pendant une présentation"]
preset: p120
mode: standard
locale: fr
reviewed: false
translationOf: "presentations"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Mes diapositives sont en plein écran. AwakeTab tient-il encore l’écran ?"
    a: "Seulement si AwakeTab reste visible quelque part : fenêtre flottante sous Chrome, Edge ou Firefox 151+, seconde fenêtre sur l’écran du portable, ou moniteur de retour. Si les diapositives recouvrent complètement l’onglet, il est masqué, le navigateur libère le verrou et la pastille passe à « En pause — onglet masqué »."
  - q: "Pourquoi le projecteur s’éteint-il malgré tout ?"
    a: "Dès que le verrou est libéré, le projecteur suit de nouveau le délai d’extinction de l’écran fixé par votre système. Certains écrans ont aussi leur propre extinction automatique, qu’aucun verrou d’éveil ne contrôle."
  - q: "La fenêtre flottante existe-t-elle dans Safari ou Firefox ?"
    a: "Sur ordinateur, Firefox la propose à partir de la version 151, Chrome et Edge à partir de 116. Safari ne l’a pas, les navigateurs Android non plus. Dans Safari, gardez AwakeTab dans une seconde fenêtre visible, par exemple sur l’écran du portable pendant que les diapositives s’affichent sur le projecteur."
  - q: "Mon statut Teams restera-t-il vert pendant que je présente ?"
    a: "Non. La présence dans Teams, Slack ou Zoom dépend de l’activité du clavier et de la souris, pas de l’écran. AwakeTab ne simule jamais aucune saisie."
honestLimit: "Les logiciels de diaporama en plein écran masquent l’onglet ; utilisez la fenêtre flottante (Chrome, Edge ou Firefox 151+ sur ordinateur), sinon le projecteur suit toujours le délai d’extinction de l’écran du système."
related:
  - "/guides/second-monitor-turns-off"
  - "/for/video-calls"
  - "/on/windows-11"
  - "/on/macos"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Le piège du plein écran

Les logiciels de présentation passent en plein écran et recouvrent le navigateur. Or AwakeTab ne peut garder l’écran allumé que s’il reste une surface visible. Trois montages le permettent : la fenêtre flottante dans Chrome, Edge ou Firefox 151+, une seconde fenêtre du navigateur sur l’écran du portable, ou un moniteur de retour qui affiche encore l’onglet. Sans l’un d’eux, l’onglet est masqué, le verrou est libéré et le projecteur retombe sur le délai d’extinction réglé dans le système.

## Avant d’entrer en salle

1. Ouvrez cette page. La durée « 2 h » est présélectionnée : de quoi couvrir une intervention et les questions.
2. Touchez Démarrer ; la pastille doit indiquer « Écran allumé ».
3. Dans Chrome, Edge ou Firefox 151+, cliquez sur « Fenêtre flottante » dans l’en-tête. Que le verrou tienne quand l’onglet lui-même est masqué n’a pas encore été vérifié sur un appareil : surveillez la pastille.
4. Si le navigateur bloque la fenêtre, autorisez les fenêtres contextuelles pour awaketab.com.
5. Branchez le portable : sur batterie, l’économiseur peut baisser la luminosité ou raccourcir les délais.

## Trois configurations courantes

**Un seul écran, dupliqué sur le projecteur.** C’est le cas le plus fragile, puisque le diaporama occupe tout l’affichage. Sous Chrome, Edge ou Firefox 151+, la fenêtre flottante est la solution. Sous Safari, préférez un diaporama en fenêtre plutôt qu’en plein écran, avec AwakeTab à côté.

**Mode présentateur avec deux écrans.** Les diapositives vont sur le projecteur, vos notes sur le portable. Gardez une fenêtre AwakeTab visible sur l’écran du portable, dans un coin des notes.

**Moniteur de retour.** Si un écran de contrôle face à vous affiche le bureau, placez-y l’onglet AwakeTab : il reste visible, donc le verrou reste accordé.

## Lire la pastille en pleine intervention

Un coup d’œil suffit. « Écran allumé » signifie que le navigateur détient bien le verrou. « En pause — onglet masqué » signifie que les diapositives ont recouvert la page : revenez-y ou ouvrez la fenêtre flottante. « Bloqué — voici la solution » signale un refus, par exemple une page intégrée sans autorisation ou Safari qui attend un clic ; la cause est affichée. Retoucher Démarrer sans rien changer reproduit le même refus. À la fin des deux heures, une invite propose de prolonger (+15 min, +30 min ou +1 h) : ne supposez pas que la session continue indéfiniment.

## Les limites à garder en tête

- Fermer le capot du portable met fin au verrou jusqu’à ce que vous le rouvriez.
- Un verrouillage d’écran imposé par votre entreprise, ou le retrait d’une carte à puce, relève d’une autre règle que le délai d’extinction de l’écran ; AwakeTab n’y touche pas.
- Si vous présentez dans Teams ou Zoom, votre statut de présence suit toujours le clavier et la souris.

Pour un écran secondaire qui s’éteint tout seul, voyez notre page sur le second moniteur ; pour les réglages système, consultez [Windows 11](/fr/on/windows-11) ou [macOS](/fr/on/macos).
