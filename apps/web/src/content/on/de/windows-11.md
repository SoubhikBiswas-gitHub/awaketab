---
title: "Bildschirm unter Windows 11 und 10 anlassen — AwakeTab"
description: "Chrome und Edge ab 84 halten unter Windows 11 und 10 den Bildschirm an, solange der Tab sichtbar ist. Zugeklappt schläft der Laptop trotzdem ein."
h1: "Windows 11 und 10: Bildschirm nicht ausschalten lassen"
ogTitle: "Bildschirm unter Windows 11 anlassen"
intent: "windows 11 bildschirm nicht ausschalten"
secondaryQueries: ["windows 11 bildschirm anlassen", "windows 11 bildschirm geht aus", "bildschirm dauerhaft an windows 11", "windows 11 bildschirm anlassen ohne installation", "edge bildschirm anlassen"]
preset: p60
mode: standard
locale: de
reviewed: false
translationOf: "windows-11"
lastVerified: 2026-09-09
browsers: ["chrome", "edge"]
os: ["windows"]
faq:
  - q: "Bleibt der Bildschirm an, wenn ich das Browserfenster minimiere?"
    a: "Nein. Minimieren, ein Tab-Wechsel oder ein Fenster, das AwakeTab komplett verdeckt, lassen den Browser den Wake Lock freigeben. Die Anzeige zeigt dann „Pausiert — Tab ausgeblendet“. Holen Sie das Fenster zurück und warten Sie auf „Bildschirm bleibt an“."
  - q: "Wo stelle ich unter Windows 11 ein, wann der Bildschirm ausgeht?"
    a: "Unter Einstellungen → System → Netzbetrieb und Akku. Dort legen Sie getrennt für Akku- und Netzbetrieb fest, wann das Display abschaltet. Auf Firmen-PCs ist diese Einstellung oft per Richtlinie gesperrt; AwakeTab braucht dagegen keine Installation und keine Administratorrechte."
  - q: "Was hat Modern Standby damit zu tun?"
    a: "Modern Standby ist ein eigener Energiezustand, den Firmware und Windows steuern. Er bringt zusätzliche Eigenheiten mit, auf die eine Webseite keinen Einfluss hat. AwakeTab hält das Display an, solange der Tab sichtbar ist; was im Standby selbst passiert, bestimmt das Gerät."
  - q: "Hält AwakeTab mich in Microsoft Teams auf „Verfügbar“?"
    a: "Nein. Teams richtet den Status nach Tastatur- und Mauseingaben, nicht nach dem Bildschirm. AwakeTab bewegt nie die Maus und drückt keine Tasten, auch nicht unter Windows."
honestLimit: "Der Tab muss sichtbar bleiben, der Energiesparmodus kann das Display dimmen, Modern Standby hat eigene Macken, und wird der Laptop zugeklappt, geht er in den Ruhezustand."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/lock-screen-vs-sleep"
  - "/learn/browser-support-matrix"
  - "/for/presentations"
  - "/learn/screen-wake-lock-api-guide"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Die Antwort für Windows 11

Chrome und Edge ab Version 84 gewähren unter Windows 11 einen nativen Bildschirm-Lock, solange der Tab sichtbar ist. Sie müssen dafür nichts installieren und keine Energieeinstellung ändern: AwakeTab stellt die Anfrage, und an der Statusanzeige lesen Sie ab, ob Windows und der Browser mitspielen. Solange das Display an bleibt, geht Windows auch nicht in den Leerlauf-Ruhezustand. Ein zugeklappter Laptop schläft trotzdem ein, und Modern Standby folgt eigenen Regeln der Firmware. Unter Windows 10 funktionieren dieselben Schritte.

## Einrichtung in einer Minute

1. Öffnen Sie awaketab.com in Chrome oder Edge. Diese Seite startet mit „1 Std.“.
2. Klicken Sie auf „Bildschirm eingeschaltet lassen“ oder drücken Sie die Leertaste.
3. Schieben Sie das Fenster an den Rand oder auf einen zweiten Monitor. Es darf klein sein, aber nicht minimiert oder vollständig verdeckt.
4. Prüfen Sie die Anzeige. „Bildschirm bleibt an“ heißt: Der Lock steht.

Arbeiten Sie parallel im Vollbild, etwa in einer Präsentation, nutzen Sie in Chrome oder Edge das „Schwebende Fenster“. Die kleine Anzeige bleibt dann über anderen Programmen sichtbar.

## Wenn der Bildschirm trotzdem ausgeht

**Energiesparmodus.** Seit Windows 11 24H2 heißt der frühere „Stromsparmodus“ „Energiesparmodus“ (Energy saver). Er kann das Display dimmen oder früher abschalten, lehnt den Lock aus Chrome oder Edge aber nicht ab, denn Chromium prüft ihn gar nicht. „Blockiert — so beheben Sie es“ hat andere Ursachen, etwa eine Einbettung ohne Berechtigung, und die Anzeige nennt sie.

**Effizienzmodus in Edge.** Ob er einen gehaltenen Lock beeinflusst, ist nicht belegt und noch nicht auf einem Gerät geprüft. Hält Edge nicht, sagt Ihnen die Anzeige das sofort.

**Firmenrichtlinien.** Ein per Gruppenrichtlinie erzwungener Sperrbildschirm, eine Smartcard-Sperre oder ein Monitor, der sich von selbst abschaltet, stehen über jedem Browser. Dimmt das Display trotz „Bildschirm bleibt an“, liegt die Ursache dort.

Tritt das Problem schon nach einer Minute auf, hilft unsere englische Anleitung zu Windows 11, das den Bildschirm nach einer Minute abschaltet, weiter.

## Modern Standby und der Deckel

Viele neuere Notebooks nutzen Modern Standby statt des klassischen Ruhezustands. Das ist eine Sache zwischen Firmware und Windows mit eigenen Macken, die eine Webseite nicht steuern kann. Ein zugeklappter Deckel schickt den Laptop in jedem Fall schlafen. Für solche Fälle ist ein natives Werkzeug oder eine Systemeinstellung zuständig, nicht ein Browser-Tab.

## Browser unter Windows im Überblick

| Browser | Nativer Lock ab | Hinweis |
|---|---|---|
| Chrome | 84 | Tab muss sichtbar bleiben; schwebendes Fenster ab 116 |
| Edge | 84 | Tab muss sichtbar bleiben; schwebendes Fenster ab 116 |
| Firefox | 126 | ältere Versionen: Video-Ersatzlösung nach Klick |
| Opera | 70 | Chromium-Basis, Tab muss sichtbar bleiben |

Stand der Tabelle ist der 9. September 2026. Die Video-Ersatzlösung verbraucht mehr Strom als der native Lock. Die vollständige Liste finden Sie in der [Browser-Übersicht](/de/learn/browser-support-matrix).

## Lange Sitzungen am PC

Ein helles Display kostet Energie, am Laptop gehört für mehrere Stunden das Netzteil dazu. Chromium-Browser können AwakeTab bei einem von Ihnen gewählten Akkustand automatisch stoppen lassen. Laufzeit und Statistik zählen nur, während der Lock tatsächlich gehalten wird. Steht AwakeTab als Dashboard- oder Infobildschirm im Büro, lohnt morgens ein kurzer Blick, ob die Anzeige noch „Bildschirm bleibt an“ meldet.
