---
title: "iPhone-Bildschirm in Safari anlassen — AwakeTab"
description: "Safari hält den iPhone-Bildschirm ab Version 16.4 nativ an. Der Stromsparmodus stellt die Sperre auf 30 Sekunden, ein App-Wechsel beendet den Lock."
h1: "iPhone-Bildschirm in Safari anlassen"
intent: "iphone bildschirm anlassen safari"
secondaryQueries: ["iphone bildschirm nicht ausschalten", "iphone display dauerhaft an safari", "iphone bildschirm anlassen ohne app", "safari automatische sperre verhindern", "iphone bildschirm geht immer aus"]
preset: p30
mode: standard
locale: de
reviewed: false
translationOf: "iphone-safari"
lastVerified: 2026-09-26
browsers: ["safari"]
os: ["ios"]
lead: "Seit Safari 16.4 kann das iPhone eine Webseite um einen nativen Bildschirm-Lock bitten, ganz ohne App aus dem App Store. AwakeTab nutzt genau das: Solange der Tab in Safari vorne ist, bleibt der Bildschirm an, unabhängig davon, was unter „Automatische Sperre“ eingestellt ist. Jeder Wechsel in eine andere App beendet den Lock. Und der Stromsparmodus stellt die automatische Sperre auf 30 Sekunden; ob ein Safari-Lock dagegen hält, haben wir noch nicht auf einem Gerät geprüft."
crumb: "iPhone in Safari"
facts:
  - label: "Safari"
    value: "ab 16.4"
  - label: "Web-App auf dem Home-Bildschirm"
    value: "ab iOS 18.4"
toc:
  stromsparmodus-und-automatische-sperre: "Stromsparmodus"
  was-die-anzeige-auf-dem-iphone-bedeutet: "Was die Anzeige bedeutet"
steps:
  - title: "Öffnen Sie awaketab.com in Safari"
    path: "Safari › awaketab.com"
    text: "Diese Seite startet mit „30 Min.“; tippen Sie auf eine andere Dauer, wenn Sie länger brauchen."
    shot: "AwakeTab in Safari mit der Dauer „30 Min.“"
  - title: "Tippen Sie auf „Bildschirm eingeschaltet lassen“"
    text: "Warten Sie, bis die Anzeige „Bildschirm bleibt an“ meldet. Erst dann hält Safari den Lock wirklich."
    shot: "die Anzeige mit „Bildschirm bleibt an“"
  - title: "Legen Sie das iPhone hin, ohne die App zu wechseln"
    text: "Sobald Sie eine andere App öffnen, ist der Lock weg."
    shot: "das iPhone mit Safari im Vordergrund"
matrix:
  label: "Browser auf dem iPhone, Support-Matrix vom 26. September 2026"
  cols: ["Browser", "Ergebnis", "Hinweis"]
  rows:
    - what: "Safari ab 16.4"
      result: works
      label: "Unterstützt"
      text: "Safari hält den nativen Lock, der Timer läuft."
    - what: "Safari ohne vorheriges Tippen"
      result: blocked
      label: "Blockiert"
      text: "Safari hat abgelehnt, meist weil vorher kein Tippen kam. Fehlte nur das Tippen, genügt ein Tipp auf Starten."
    - what: "Web-App auf dem Home-Bildschirm ab iOS 18.4"
      result: works
      label: "Unterstützt"
      text: "Ab iOS 18.4 erhalten Web-Apps auf dem Home-Bildschirm einen nativen Wake Lock. Auf älteren iOS-Versionen nutzen Sie AwakeTab besser direkt in Safari."
    - what: "Safari vor iOS 16.4"
      result: fallback
      label: "Video-Ersatzlösung"
      text: "Tippen Sie auf „Starten“, um die Video-Ersatzlösung zu verwenden."
faq:
  - q: "Was passiert, wenn ich kurz zu Nachrichten oder zur Kamera wechsle?"
    a: "Dann gibt Safari den Wake Lock frei, und die Anzeige zeigt „Pausiert — Tab ausgeblendet“. Der Timer bleibt stehen. Öffnen Sie Safari wieder mit dem AwakeTab-Tab im Vordergrund und warten Sie, bis „Bildschirm bleibt an“ erscheint, bevor Sie das iPhone hinlegen."
  - q: "Funktioniert AwakeTab auch als App auf dem Home-Bildschirm?"
    a: "Ja, ab iOS 18.4 erhalten Web-Apps auf dem Home-Bildschirm einen nativen Wake Lock. Auf älteren iOS-Versionen nutzen Sie AwakeTab besser direkt in Safari."
  - q: "Mein iPhone läuft noch mit einer Version vor iOS 16.4. Geht es trotzdem?"
    a: "Einen nativen Lock gibt es dort nicht. Aktualisieren Sie iOS oder tippen Sie auf „Starten“, um die Video-Ersatzlösung zu verwenden. Ein winziges stummes Video hält dann den Bildschirm an; das verbraucht mehr Akku als der native Weg."
  - q: "Hält AwakeTab mein iPhone in Teams oder Slack auf „verfügbar“?"
    a: "Nein. Die mobilen Apps von Teams und Slack werten Ihre Aktivität aus, nicht, ob in Safari ein Bildschirm an bleibt. AwakeTab tippt oder wischt niemals für Sie."
honestLimit: "Nur ab Safari 16.4. Der Stromsparmodus stellt die automatische Sperre auf 30 Sekunden; ob der Lock dann hält, ist noch nicht auf einem Gerät geprüft. Wer die App wechselt, beendet den Wake Lock."
related:
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/on/ios-home-screen"
  - "/on/ipad"
  - "/for/cooking"
  - "/vs/powertoys-awake"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## So geht es in Safari

::steps

Läuft die gewählte Zeit ab, fragt AwakeTab, ob Sie verlängern möchten. Ohne Antwort endet die Sitzung, und das iPhone folgt wieder der automatischen Sperre.

Praktisch ist das für alles, worauf Sie nur ab und zu blicken: ein Rezept, Noten auf dem Pult, eine Checkliste in der Werkstatt. Die Einstellung in iOS bleibt dabei unangetastet, Sie müssen hinterher also nichts zurückstellen.

::ad

## Stromsparmodus und automatische Sperre

Ist der Stromsparmodus aktiv, stellt iOS die automatische Sperre auf 30 Sekunden und graut unter Einstellungen → Anzeige & Helligkeit → Automatische Sperre die übrigen Optionen aus, auch „Nie“ (Apple Support, geprüft am 26. September 2026). Safari prüft den Stromsparmodus nicht und lehnt den Lock deshalb nicht ab. Ob das iPhone mit gehaltenem Lock trotzdem nach 30 Sekunden sperrt, haben wir noch nicht auf einem Gerät geprüft; das Ergebnis erscheint auf unserer Testseite. Den ganzen Ablauf erklärt die Anleitung [„Nie“ bei der automatischen Sperre ausgegraut](/de/guides/iphone-automatische-sperre-nie-ausgegraut).

## Was die Anzeige auf dem iPhone bedeutet

| Anzeige | Bedeutung |
|---|---|
| Bildschirm bleibt an | Safari hält den nativen Lock, der Timer läuft. |
| Pausiert — Tab ausgeblendet | Sie haben die App oder den Tab gewechselt; der Lock ist freigegeben. |
| Blockiert — so beheben Sie es | Safari hat abgelehnt, meist weil vorher kein Tippen kam. |
| Tippen für die Ersatzlösung | Kein nativer Lock verfügbar, etwa vor iOS 16.4. |

Lesen Sie bei „Blockiert“ den Hinweis darunter. Fehlte nur das Tippen, genügt ein Tipp auf Starten; bei anderen Ursachen, etwa einer Einbettung ohne Berechtigung, lehnt Safari jedes Mal wieder ab.

## Die Grenzen

Nur Safari 16.4 und neuer bekommt den nativen Lock; unsere Angaben stammen aus der Support-Matrix vom 26. September 2026. Die Web-App auf dem Home-Bildschirm braucht iOS 18.4.

::matrix

Ein iPhone ist kein Babyfon und kein Sicherheitsmonitor, lassen Sie es also nicht unbeaufsichtigt als Wächter liegen. Ein hell leuchtendes Display kostet Akku; für lange Sitzungen gehört das iPhone ans Ladekabel. Auf OLED-Modellen reduziert die Pixelverschiebung im Nachtmodus das Einbrennen, beseitigt es aber nicht vollständig. Wenn Sie beim Kochen das Rezept im Blick behalten wollen, hilft die Seite [Bildschirm beim Kochen anlassen](/de/for/kochen).
