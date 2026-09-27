---
title: "Android-Bildschirm in Chrome anlassen — AwakeTab"
description: "Chrome ab 84 hält unter Android den Bildschirm an, solange der Tab sichtbar ist. Ein App-Wechsel gibt den Lock frei, der Energiesparmodus kann dimmen."
h1: "Android-Bildschirm in Chrome anlassen"
intent: "android bildschirm anlassen chrome"
secondaryQueries: ["android bildschirm nicht ausschalten", "handy bildschirm dauerhaft an chrome", "bildschirm-timeout umgehen ohne app", "samsung bildschirm anlassen browser", "android display anlassen webseite"]
preset: p30
mode: standard
locale: de
reviewed: false
translationOf: "android-chrome"
lastVerified: 2026-09-09
browsers: ["chrome"]
os: ["android"]
crumb: "Android in Chrome"
lead: "Chrome ab Version 84 kann auf Android-Geräten einen nativen Bildschirm-Lock vergeben, solange der Tab sichtbar ist. Sie brauchen dafür weder eine App noch Root-Rechte: AwakeTab fragt den Lock an, und die Statusanzeige zeigt, ob Chrome zustimmt. Drei Dinge sollten Sie kennen: Das Verlassen von Chrome gibt den Lock frei, manche Hersteller legen den Tab nach dem Wechsel komplett schlafen, und der Energiesparmodus kann die Abschaltzeit verkürzen."
facts:
  - label: "Chrome"
    value: "ab 84"
  - label: "Samsung Internet"
    value: "ab 14"
  - label: "Firefox"
    value: "ab 126"
  - label: "Opera"
    value: "ab 70"
toc:
  die-android-einstellung-die-sie-kennen-sollten: "Die Android-Einstellung"
steps:
  - title: "Öffnen Sie awaketab.com in Chrome"
    path: "Chrome › awaketab.com"
    text: "Voreingestellt ist „30 Min.“; wählen Sie bei Bedarf „1 Std.“, „2 Std.“ oder „∞“."
    shot: "AwakeTab in Chrome unter Android mit gewählter Dauer"
  - title: "Starten Sie mit „Bildschirm eingeschaltet lassen“"
    text: "Lesen Sie die Anzeige: „Bildschirm bleibt an“ bedeutet, Chrome hält den Lock wirklich. Erst dann legen Sie das Handy ab."
    shot: "die Statusanzeige von AwakeTab bei laufender Sitzung"
  - title: "Brauchen Sie parallel eine andere App?"
    text: "Nutzen Sie den geteilten Bildschirm oder die Pop-up-Ansicht. AwakeTab muss dabei sichtbar bleiben."
    shot: "geteilter Bildschirm mit AwakeTab in einer Hälfte"
faq:
  - q: "Bleibt das Display an, wenn ich kurz zu Maps oder YouTube springe?"
    a: "Nein. Verlassen Sie Chrome oder wechseln Sie den Tab, gibt der Browser den Wake Lock frei, und die Anzeige zeigt „Pausiert — Tab ausgeblendet“. Kommen Sie zurück, fordert AwakeTab ihn neu an. Legen Sie das Handy erst weg, wenn wieder „Bildschirm bleibt an“ zu sehen ist."
  - q: "Warum zeigt AwakeTab „Blockiert — so beheben Sie es“?"
    a: "Chrome hat den Lock abgelehnt, und die Zeile darunter nennt den Grund. Am Energiesparmodus liegt es nicht, den prüft Chrome gar nicht. Meist war der Tab beim Start nicht sichtbar, oder AwakeTab läuft eingebettet in einer Seite ohne Berechtigung für screen-wake-lock. Öffnen Sie awaketab.com direkt, lassen Sie den Tab vorne und tippen Sie auf „Starten“."
  - q: "Mein Samsung schließt den Tab, nachdem ich weggewechselt habe. Woran liegt das?"
    a: "Manche Hersteller schicken Apps über eigene Listen schlafen, bei Samsung etwa „Apps im Standby“ oder „Apps im Tiefschlaf“. Steht Chrome dort, kann das System den Tab beenden, sobald Sie die App verlassen. Nehmen Sie Chrome aus diesen Listen heraus, wenn der Tab bei der Rückkehr neu lädt."
  - q: "Geht das auch mit Samsung Internet oder Firefox?"
    a: "Ja. Samsung Internet ab Version 14 und Firefox ab 126 gewähren ebenfalls einen nativen Lock. Ältere Firefox-Versionen können nach einem Tippen auf die Video-Ersatzlösung ausweichen, die mehr Akku verbraucht."
honestLimit: "Wer Chrome verlässt, gibt den Wake Lock frei, manche Hersteller-Einstellungen für schlafende Apps beenden den Tab danach ganz, und der Energiesparmodus kann das Display dimmen."
related:
  - "/on/samsung-internet"
  - "/on/firefox"
  - "/guides/android-screen-timeout-one-app"
  - "/for/cooking"
  - "/vs/nosleep-js"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Schritt für Schritt in Chrome

::steps

Nach Ablauf der Dauer erscheint eine Frage, ob Sie verlängern möchten, etwa um „+15 Min.“. Wer eine feste Dauer gewählt hat, bekommt keinen unbegrenzten Lock.

::ad

## Welche Android-Browser was können

Laut Support-Matrix vom 9. September 2026 gewähren Chrome 84+, Samsung Internet 14+, Firefox 126+ und Opera 70+ unter Android einen nativen Lock. Ältere Firefox-Versionen können nach einem Tippen auf ein kleines stummes Video als Ersatzlösung ausweichen; das kostet mehr Akku.

## Die Android-Einstellung, die Sie kennen sollten

Die normale Abschaltzeit finden Sie unter Einstellungen → Display → Bildschirm-Timeout (Pixel mit Android 16: „Display & touch“). Je nach Hersteller heißt der Punkt leicht anders, zum Beispiel „Bildschirm-Zeitlimit“. AwakeTab ändert diese Einstellung nicht. Der Lock gilt nur für die Zeit, in der der Tab vorne ist, danach greift wieder Ihr gewohntes Zeitlimit. Genau das ist praktisch, wenn nur eine einzige Seite länger an bleiben soll.

## Energiesparmodus und Hersteller-Listen

Den Energiesparmodus prüft Chrome nicht; er lehnt den Lock also nicht ab. Er kann aber die Abschaltzeit verkürzen oder das Display dimmen. Ob er sich über einen gehaltenen Lock hinwegsetzt, haben wir noch nicht auf einem Gerät geprüft. „Blockiert — so beheben Sie es“ erscheint nur, wenn Chrome wirklich ablehnt, und darunter steht die Ursache.

Heikler sind die eigenen Energiesparlisten mancher Hersteller. Bei Samsung heißen sie zum Beispiel „Apps im Standby“ und „Apps im Tiefschlaf“, bei anderen Marken gibt es ähnliche Menüs. Landet Chrome dort, kann das System den Tab beenden, sobald Sie die App verlassen. Beim Zurückkehren lädt die Seite dann neu, und Sie müssen die Sitzung erneut starten.

## Was Chrome auf Android nicht kann

Einen Chat-Status hält AwakeTab nicht grün, denn Teams, Slack und Zoom werten Eingaben aus, nicht das Display, und AwakeTab simuliert keine Berührungen. Ein Handy, das unbeaufsichtigt als Aufpasser dient, ist keine gute Idee. Und ein leuchtendes Display zieht Akku: Wer länger als eine Stunde braucht, steckt das Ladekabel ein. Auf OLED-Bildschirmen mindert die Pixelverschiebung des Nachtmodus das Einbrennen, verhindert es aber nicht ganz.
