---
title: "Display beim Download anlassen — AwakeTab"
description: "AwakeTab hält das Display an, solange der Tab sichtbar ist. Ob der PC auch nicht in den Standby geht, hängt vom System ab. Zugeklappt schläft er immer."
h1: "Display beim Download anlassen – was ein Browser-Tab kann"
ogTitle: "Display beim Download anlassen"
intent: "pc beim download wach halten"
secondaryQueries: ["standby verhindern browser", "laptop beim download nicht in ruhezustand", "bildschirm anlassen während download", "computer wach halten download", "download bricht ab ruhezustand"]
preset: pinf
mode: standard
locale: de
reviewed: false
translationOf: "downloads"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Kann ich das AwakeTab-Fenster minimieren, während die Datei lädt?"
    a: "Dann endet der Wake Lock. Sobald Sie minimieren oder den Tab wechseln, gibt der Browser ihn frei, und die Anzeige springt auf „Pausiert — Tab ausgeblendet“. Ab da gelten wieder Ihre normalen Energieeinstellungen. Lassen Sie AwakeTab lieber in einem eigenen, kleinen Fenster sichtbar."
  - q: "Verhindert AwakeTab unter Windows den Standby?"
    a: "In unseren Tests hat Chromium unter Windows neben dem Display auch den Leerlauf-Ruhezustand des Systems hinausgezögert. Zugesagt wird das nicht, und der Energiesparmodus kann den Lock ablehnen. Wer den PC über Nacht sicher wach halten muss, greift zu einer Energieoption des Systems oder einem nativen Werkzeug."
  - q: "Und auf dem Mac läuft der Download dann durch?"
    a: "Nicht zwingend. Unter macOS bleibt nur das Display an; den Leerlauf-Ruhezustand des Systems hat macOS in unseren Tests nicht aufgehalten. Für einen Download bei ausgeschaltetem Bildschirm brauchen Sie eine Systemeinstellung oder ein natives Dienstprogramm."
  - q: "Zeigt mich Teams als verfügbar, solange der Download läuft?"
    a: "Nein. Teams, Slack und Zoom werten Tastatur- und Mausaktivität aus, nicht das Display. AwakeTab simuliert keine Eingaben, auch nicht bei langen Downloads."
honestLimit: "Hält das Display an. Ob auch der Leerlauf-Ruhezustand des Systems ausbleibt, hängt vom Betriebssystem ab (Chromium unter Windows: in unseren Tests ja; macOS: nein). Wird der Deckel zugeklappt, schläft das Gerät immer."
related:
  - "/for/work-laptop"
  - "/on/windows-11"
  - "/on/macos"
  - "/for/baby-monitor"
  - "/on/chromebook"
author: soubhik
published: 2026-09-26
---

## Die ehrliche Kurzantwort

Große Downloads und lange Kopiervorgänge stocken oder brechen ab, wenn der Laptop einschläft. AwakeTab hält in einem sichtbaren Browser-Tab das Display an. Ob der Rest des Rechners dabei ebenfalls wach bleibt, entscheidet das Betriebssystem, nicht diese Seite: Mit Chromium unter Windows blieb in unseren Tests auch der Leerlauf-Ruhezustand aus, unter macOS nicht. Einen zugeklappten Laptop hält keine Webseite wach.

## Bildschirm an heißt nicht automatisch: kein Standby

Wer „Standby verhindern Browser“ sucht, meint meist zwei Dinge auf einmal. Ein Browser kann aber nur einen Wake Lock für den Bildschirm anfordern. Der verhindert, dass sich das Display verdunkelt und abschaltet. Der Ruhezustand des Systems ist eine eigene Stufe, die jedes Betriebssystem nach seinen Regeln handhabt. Deshalb verspricht AwakeTab für Downloads nur, was es messen kann: Die Anzeige sagt „Bildschirm bleibt an“, solange der Browser den Lock hält, und wechselt sofort, wenn er ihn zurücknimmt.

## So richten Sie den Download-Abend ein

1. Schließen Sie das Notebook ans Netzteil an. Ein leuchtendes Display kostet Energie, und im Akkubetrieb lehnen Energiesparmodi den Lock gern ab.
2. Öffnen Sie diese Seite. Voreingestellt ist „∞“, also bis Sie selbst beenden. Klicken Sie auf „Bildschirm eingeschaltet lassen“.
3. Ziehen Sie den AwakeTab-Tab in ein eigenes Fenster und legen Sie es neben den Download-Manager, sodass beide sichtbar bleiben.
4. Prüfen Sie die Anzeige. Steht dort „Blockiert — so beheben Sie es“, lesen Sie den Hinweis darunter, statt immer wieder auf Starten zu klicken.

## Welche Browser mitspielen

Einen nativen Lock gewähren laut Matrix vom 9. September 2026 Chrome und Edge ab Version 84, Firefox ab 126, Safari ab 16.4 und Samsung Internet ab 14. Ältere Firefox-Versionen nutzen nach einem Klick eine Video-Ersatzlösung, die mehr Strom verbraucht. Unter Linux haben wir Ubuntu 24.04 mit GNOME-Idle-Inhibit getestet, jeweils mit Firefox 126+ und Chrome 84+.

## Wenn der Rechner trotzdem abschaltet

Unter Windows stellen Sie die Zeiten unter Einstellungen → System → Netzbetrieb und Akku ein. Mehr zu Windows lesen Sie auf der Seite [Bildschirm unter Windows 11 anlassen](/de/on/windows-11). Auf dem Mac finden Sie die Optionen unter Systemeinstellungen → Sperrbildschirm bzw. Energie; Details stehen unter [Mac-Display im Browser wach halten](/de/on/macos). Dimmt der Bildschirm trotz „Bildschirm bleibt an“, greift eine andere Regel: eine Firmenrichtlinie für den Sperrbildschirm, eine Smartcard oder ein Monitor, der sich selbst abschaltet.

## Über Nacht herunterladen

Laufzeit und Statistik zählen nur, solange der Lock wirklich gehalten wird, und jede Rechnung stützt sich auf die Systemzeit. So zeigt AwakeTab nach einer Unterbrechung eine ehrliche Zahl. In Chromium-Browsern kann die Sitzung bei einem selbst gewählten Akkustand automatisch enden. Bei OLED-Displays verringert die Pixelverschiebung des Nachtmodus das Einbrennen, schließt es aber nicht aus. Für echte Nachtschichten mit dunklem Bildschirm ist ein natives Werkzeug die bessere Wahl.
