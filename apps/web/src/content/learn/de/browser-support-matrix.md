---
title: "Wake Lock: Browser-Unterstützung im Überblick — AwakeTab"
description: "Nativer Wake Lock ab Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14, Opera 70 und iOS-Web-Apps ab 18.4. Ältere Versionen nur per Video."
h1: "Wake Lock API: Welche Browser den Bildschirm anlassen"
ogTitle: "Wake Lock: Browser-Unterstützung"
intent: "wake lock api browser unterstützung"
secondaryQueries: ["screen wake lock api unterstützung", "wake lock safari ios version", "wake lock firefox ab version", "welcher browser hält den bildschirm an", "standby verhindern browser", "bildschirm anlassen browser vergleich"]
preset: p15
mode: standard
locale: de
reviewed: false
translationOf: "browser-support-matrix"
lastVerified: 2026-09-26
browsers: []
os: []
crumb: "Browser-Übersicht"
lead: "Einen nativen Screen Wake Lock gewähren Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 und Opera 70; Web-Apps auf dem iPhone-Home-Bildschirm ab iOS 18.4. Das ist der Stand unserer Datei `support-matrix.json` vom 26. September 2026. Ältere Firefox-Versionen kommen nur über die Video-Ersatzlösung ans Ziel. Kombinationen, die wir nicht geprüft haben, stehen nicht in der Tabelle und werden auch nicht beansprucht."
rows:
  refusals:
    - title: "Ein ausgeblendeter Tab"
    - title: "Eine Permissions-Policy, die `screen-wake-lock` sperrt"
    - title: "Safari ohne vorheriges Tippen"
    - title: "Firefox bei 5 % Akku oder weniger ohne Ladekabel"
  os:
    - title: "Windows und macOS"
      text: "Solange das Display an bleibt, schlafen Windows und macOS auch nicht bei Inaktivität ein, doch einen zugeklappten Laptop hält kein Browser wach."
    - title: "Linux"
      text: "Unter Linux bitten Chrome und Firefox den Desktop über D-Bus, nicht in den Ruhezustand zu gehen; ob das greift, hängt vom Desktop ab."
notes:
  savers:
    kicker: "Hinweis"
    text: "Energiesparmodi lehnen den Lock nicht ab."
faq:
  - q: "Gilt die Tabelle auch, wenn der Tab im Hintergrund liegt?"
    a: "Nein. In jedem aufgeführten Browser gilt der Wake Lock nur für ein sichtbares Dokument. Minimieren Sie das Fenster, wechseln Sie den Tab oder am Handy die App, gibt der Browser den Lock frei, und die Anzeige zeigt „Pausiert — Tab ausgeblendet“."
  - q: "Warum steht Chrome auf dem iPhone nicht in der Tabelle?"
    a: "Wir führen nur Zeilen, die wir anhand von Browser-Dokumentation und Quellcode geprüft haben. Für iPhone und iPad ist Safari ab 16.4 belegt, für Web-Apps auf dem Home-Bildschirm iOS 18.4. Andere Kombinationen beanspruchen wir nicht."
  - q: "Was bedeutet „Video-Ersatzlösung“ genau?"
    a: "Unterstützt ein Browser die Screen Wake Lock API nicht, etwa Firefox vor Version 126, kann AwakeTab nach einem Tippen oder Klick ein winziges stummes Video abspielen, das den Bildschirm anlässt. Die Anzeige lautet dann „Bildschirm bleibt per Video an“. Das verbraucht mehr Strom als der native Lock."
  - q: "Unterstützt ein Browser den Lock, heißt das, er wird immer gewährt?"
    a: "Nein. Ein Tab, der beim Start nicht sichtbar ist, eine Einbettung ohne Berechtigung für screen-wake-lock, Safari ohne vorheriges Tippen oder Firefox bei 5 % Akku oder weniger ohne Ladekabel führen zu „Blockiert — so beheben Sie es“. Energiesparmodi lehnen nicht ab. Ohne HTTPS fehlt der Lock ganz."
honestLimit: "Die Tabelle gibt den Stand vom 26. September 2026 wieder. Ältere Versionen weichen auf die Video-Ersatzlösung aus, und jede Zeile gilt nur für dieses Prüfdatum."
related:
  - "/learn/screen-wake-lock-api-guide"
  - "/learn/how-we-tested"
  - "/on/ios-home-screen"
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/for/kiosk"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Browser und Mindestversionen

| Browser | Nativ ab Version | Plattformen | Hinweis |
|---|---|---|---|
| Chrome | 84 | Windows, macOS, Linux, Android, ChromeOS | Tab muss sichtbar bleiben; Energiesparmodi lehnen den Lock nicht ab. |
| Edge | 84 | Windows, macOS, Linux, Android | Tab muss sichtbar bleiben. |
| Firefox | 126 | Windows, macOS, Linux, Android | Frühere Versionen nutzen die Video-Ersatzlösung nach einer Nutzeraktion; lehnt bei 5 % Akku oder weniger ohne Ladekabel ab. |
| Safari | 16.4 | macOS, iOS, iPadOS | Braucht zum Start ein Tippen oder einen Klick; Tab muss sichtbar bleiben. |
| Samsung Internet | 14 | Android | Tab muss sichtbar bleiben; Energiespar-Listen können den Tab schließen, nachdem Sie ihn verlassen haben. |
| Opera | 70 | Windows, macOS, Linux, Android | Chromium-Basis; Tab muss sichtbar bleiben. |

## Besondere Umgebungen

| Umgebung | Ab Version | Mechanismus | Hinweis |
|---|---|---|---|
| Web-App auf dem iOS-Home-Bildschirm | 18.4 | nativ | Auf älteren Versionen AwakeTab besser in Safari nutzen. |
| Video-Ersatzlösung | – | Ersatz | Braucht ein Tippen oder einen Klick und verbraucht mehr Strom als der native Lock. |

::ad

## Was „nativ“ in der Praxis heißt

AwakeTab ruft `navigator.wakeLock.request('screen')` aus einer sicheren, sichtbaren Seite auf. Die Statusanzeige kennt sieben Zustände, von „Bereit“ über „Wird gestartet…“ bis „Tippen für die Ersatzlösung“. Einen laufenden Timer zeigt sie nur, wenn der Browser den Lock hält („Bildschirm bleibt an“) oder die Ersatzlösung läuft („Bildschirm bleibt per Video an“). Nimmt der Browser den Lock zurück, heißt es „Pausiert — Tab ausgeblendet“; lehnt er ab, „Blockiert — so beheben Sie es“. Ein vorgetäuschtes „gehalten“ gibt es nicht.

## Methodik und Datum

Jede Zeile beruht auf Browser-Dokumentation und Quellcode (zuletzt geprüft am 26. September 2026), nicht auf eigenen Gerätetests; die tragen wir nach, sobald sie vorliegen. Gerätespezifische Details finden Sie auf den Seiten zu [Safari auf dem iPhone](/de/on/iphone-safari), [Chrome unter Android](/de/on/android-chrome) und [Windows 11](/de/on/windows-11).

## Quellen

- [MDN browser-compat-data, WakeLock](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json)
- [New in Chrome 84](https://developer.chrome.com/blog/new-in-chrome-84/)
- [Firefox 126 release notes for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126)
- [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- [Chromium wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc)
- [WebKit WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp)
- [Firefox WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp)

## Selbst ausprobieren

Das eingebettete Tool startet hier mit „15 Min.“. Tippen Sie auf „Bildschirm eingeschaltet lassen“ und prüfen Sie, welche Meldung Ihr Browser liefert. Zeigt die Anzeige „Tippen für die Ersatzlösung“, fehlt Ihrem Browser der native Lock.

## Was die Tabelle nicht aussagt

Eine Versionsnummer bedeutet Unterstützung der Schnittstelle, keine Garantie im Einzelfall. Ein ausgeblendeter Tab, eine Permissions-Policy, die `screen-wake-lock` sperrt, Safari ohne vorheriges Tippen und Firefox bei 5 % Akku oder weniger führen auch in unterstützten Browsern zur Ablehnung; ohne HTTPS fehlt die Schnittstelle ganz.

::rows refusals

::note savers

Außerdem zielt der Lock auf das Display.

::rows os

Die Anwesenheit in Teams oder Slack beeinflusst der Lock ebenfalls nicht, weil diese Dienste auf Eingaben achten.

::limit inline
