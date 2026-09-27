---
title: "Bildschirm beim Kochen anlassen — AwakeTab"
description: "Ihr Rezept bleibt auf Handy oder Tablet lesbar, solange der AwakeTab-Tab sichtbar ist. Wechseln Sie in eine andere App, gibt der Browser den Lock frei."
h1: "Bildschirm beim Kochen anlassen"
intent: "bildschirm beim kochen anlassen"
secondaryQueries: ["handy bildschirm beim kochen nicht ausschalten", "rezept bildschirm geht aus", "tablet bildschirm dauerhaft an küche", "kochmodus bildschirm anlassen", "display beim kochen an lassen"]
preset: pinf
mode: cook
locale: de
reviewed: false
translationOf: "cooking"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Bleibt der Bildschirm an, wenn ich zwischendurch zu WhatsApp oder in die Rezept-App wechsle?"
    a: "Nein. Sobald AwakeTab nicht mehr zu sehen ist, gibt der Browser den Wake Lock frei, und die Anzeige wechselt zu „Pausiert — Tab ausgeblendet“. Kehren Sie zum Tab zurück und warten Sie, bis wieder „Bildschirm bleibt an“ oder „Bildschirm bleibt per Video an“ erscheint."
  - q: "Wie habe ich Rezept und AwakeTab gleichzeitig im Blick?"
    a: "Auf dem iPad mit zwei Fenstern nebeneinander (unter iPadOS 26 als Fenster, bis iPadOS 18 per Split View) oder am Laptop mit zwei Fenstern. Entscheidend ist, dass der AwakeTab-Tab sichtbar bleibt. Auf dem iPhone ist immer nur eine App vorne: Ein Rezept in einer anderen App kann AwakeTab dort nicht wach halten."
  - q: "Warum wird mein iPhone trotzdem nach 30 Sekunden dunkel?"
    a: "Wahrscheinlich ist der Stromsparmodus aktiv. Er stellt die automatische Sperre auf 30 Sekunden. Ob ein Wake Lock aus Safari das iPhone dann trotzdem anlässt, haben wir noch nicht auf einem Gerät geprüft. Unter Android kann der Energiesparmodus die Abschaltzeit verkürzen oder das Display dimmen. „Blockiert — so beheben Sie es“ erscheint nur, wenn der Browser wirklich ablehnt, etwa weil Safari erst ein Tippen braucht."
  - q: "Bleibe ich in Teams oder Slack „verfügbar“, während das Tablet in der Küche läuft?"
    a: "Nein. Der Anwesenheitsstatus von Teams, Slack und Zoom richtet sich nach Tastatur- und Mauseingaben, nicht nach dem Bildschirm. AwakeTab bewegt niemals die Maus und drückt keine Tasten."
honestLimit: "Funktioniert, solange der AwakeTab-Tab auf dem Bildschirm zu sehen ist. Öffnen Sie auf dem Handy eine andere App, gibt der Browser den Wake Lock frei, bis Sie zurückkehren."
related:
  - "/for/reading"
  - "/for/workouts"
  - "/on/android-chrome"
  - "/on/iphone-safari"
  - "/guides/iphone-auto-lock-never-greyed-out"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Warum das Display mitten im Rezept ausgeht

Teig an den Fingern, das Handy lehnt an der Zuckerdose, und ausgerechnet bei Schritt drei wird der Bildschirm schwarz. Ein Rezept auf Smartphone oder Tablet verschwindet, sobald die automatische Sperre greift, es sei denn, etwas hält das Display bewusst wach. AwakeTab erledigt das direkt im Browser: Solange der Tab sichtbar ist, ob im Fenster neben dem Rezept oder als einziger Tab, auf den Sie am Herd blicken, bleibt der Bildschirm an. Wechseln Sie in eine andere App, endet das, bis Sie zurückkommen. Auf dem iPhone heißt das: Das Rezept muss in AwakeTab zu sehen sein, nicht in einer anderen App.

## In drei Schritten küchentauglich

1. Öffnen Sie diese Seite und lassen Sie das eingebettete Tool sichtbar. Voreingestellt sind der Kochmodus und die Dauer „∞“, der Bildschirm bleibt also an, bis Sie selbst beenden.
2. Tippen Sie auf „Bildschirm eingeschaltet lassen“ und schauen Sie auf die Statusanzeige. Erst wenn dort „Bildschirm bleibt an“ steht, hält der Browser den Lock wirklich.
3. Liegt das Rezept in einer anderen App, legen Sie auf Tablet oder Laptop beide Fenster nebeneinander, damit AwakeTab im Blick bleibt. Auf dem iPhone geht das nicht, dort ist nur eine App vorne.

Haben Sie statt „∞“ eine feste Dauer angetippt, fragt AwakeTab am Ende, ob Sie verlängern möchten. Rechnen Sie in diesem Fall nicht mit einem unbegrenzten Lock, sondern mit genau der gewählten Zeit.

## Was im Hintergrund passiert

AwakeTab bittet den Browser über die Screen Wake Lock API um einen Bildschirm-Lock, und zwar nur aus einer sicheren, sichtbaren Seite. Die Anzeige kennt sieben Zustände: bereit, wird gestartet, gehalten, verloren, blockiert, nicht unterstützt und Ersatzlösung. Einen laufenden Timer sehen Sie ausschließlich in den beiden Zuständen, in denen der Bildschirm tatsächlich an bleibt. Timer und Kochstatistik zählen nur in dieser Zeit weiter.

Laut unserer Support-Matrix vom 9. September 2026 klappt der native Lock ab Safari 16.4, Chrome 84, Edge 84, Samsung Internet 14 und Firefox 126. Als Web-App auf dem iPhone-Home-Bildschirm braucht es iOS 18.4. Ältere Firefox-Versionen starten nach einem Tippen eine winzige Video-Ersatzlösung, die etwas mehr Akku kostet.

## Wenn der Bildschirm trotzdem dunkel wird

- **Stromsparmodus (iPhone) oder Energiesparmodus (Android):** Er lehnt den Lock nicht ab, kann aber die Abschaltzeit verkürzen. Auf dem iPhone stellt er die automatische Sperre auf 30 Sekunden und graut „Nie“ aus (Einstellungen → Anzeige & Helligkeit); mehr dazu in [unserer Anleitung](/de/guides/iphone-automatische-sperre-nie-ausgegraut).
- **Tab im Hintergrund:** Die Anzeige meldet „Pausiert — Tab ausgeblendet“. Das ist die ehrliche Antwort, kein Fehler.
- **Eine Einbettung ohne Berechtigung für `screen-wake-lock`, Safari ohne vorheriges Tippen oder Firefox bei 5 % Akku oder weniger:** Dann sehen Sie „Blockiert — so beheben Sie es“, nie ein vorgetäuschtes „gehalten“. Ohne HTTPS gibt es gar keinen Lock; die Anzeige bietet dann „Tippen für die Ersatzlösung“.

Unter Android legen Sie die normale Abschaltzeit unter Einstellungen → Display → Bildschirm-Timeout fest (Pixel: „Display & touch“); einige Hersteller schicken außerdem Apps über eigene Listen schlafen. Lehnt der Browser ab, lesen Sie den Hinweis unter der Anzeige und beheben Sie genau diese Ursache. Nur wenn Safari ein Tippen vermisst hat, genügt ein neuer Tipp auf Starten.

## Akku und Sicherheit am Herd

Ein leuchtendes Display verbraucht Strom. Beim stundenlangen Schmoren lohnt sich das Ladekabel. In Chromium-Browsern kann AwakeTab bei einem von Ihnen festgelegten Akkustand selbst stoppen; andere Browser bieten das womöglich nicht. Ein Handy ersetzt keinen Blick in den Topf: Verlassen Sie sich nie darauf, dass ein unbeaufsichtigtes Gerät irgendetwas überwacht. Weitere Szenarien mit Rezeptbuch oder Noten finden Sie beim [Lesen am Bildschirm](/for/reading).
