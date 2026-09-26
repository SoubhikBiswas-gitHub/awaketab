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
    a: "Auf dem Tablet mit geteiltem Bildschirm, etwa Split View auf dem iPad, oder am Laptop mit zwei Fenstern nebeneinander. Entscheidend ist nur, dass der AwakeTab-Tab sichtbar bleibt. Steht das Rezept ohnehin im selben Browser, genügt es, wenn AwakeTab der Tab ist, auf den Sie beim Kochen schauen."
  - q: "Warum wird mein iPhone trotzdem nach 30 Sekunden dunkel?"
    a: "Wahrscheinlich ist der Stromsparmodus aktiv. Er erzwingt eine automatische Sperre nach 30 Sekunden und setzt sich auch über AwakeTab hinweg. Unter Android kann der Energiesparmodus die Anfrage ablehnen. In beiden Fällen zeigt die Anzeige „Blockiert — so beheben Sie es“ statt einer falschen Erfolgsmeldung."
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
---

## Warum das Display mitten im Rezept ausgeht

Teig an den Fingern, das Handy lehnt an der Zuckerdose, und ausgerechnet bei Schritt drei wird der Bildschirm schwarz. Ein Rezept auf Smartphone oder Tablet verschwindet, sobald die automatische Sperre greift, es sei denn, etwas hält das Display bewusst wach. AwakeTab erledigt das direkt im Browser: Solange der Tab sichtbar ist, ob neben dem Rezept, in Split View oder als einziger Tab, auf den Sie am Herd blicken, bleibt der Bildschirm an. Wechseln Sie in eine andere App, endet das, bis Sie zurückkommen.

## In drei Schritten küchentauglich

1. Öffnen Sie diese Seite und lassen Sie das eingebettete Tool sichtbar. Voreingestellt sind der Kochmodus und die Dauer „∞“, der Bildschirm bleibt also an, bis Sie selbst beenden.
2. Tippen Sie auf „Bildschirm eingeschaltet lassen“ und schauen Sie auf die Statusanzeige. Erst wenn dort „Bildschirm bleibt an“ steht, hält der Browser den Lock wirklich.
3. Liegt das Rezept in einer anderen App, teilen Sie den Bildschirm oder öffnen ein zweites Fenster, damit AwakeTab im Blick bleibt.

Haben Sie statt „∞“ eine feste Dauer angetippt, fragt AwakeTab am Ende, ob Sie verlängern möchten. Rechnen Sie in diesem Fall nicht mit einem unbegrenzten Lock, sondern mit genau der gewählten Zeit.

## Was im Hintergrund passiert

AwakeTab bittet den Browser über die Screen Wake Lock API um einen Bildschirm-Lock, und zwar nur aus einer sicheren, sichtbaren Seite. Die Anzeige kennt sieben Zustände: bereit, wird gestartet, gehalten, verloren, blockiert, nicht unterstützt und Ersatzlösung. Einen laufenden Timer sehen Sie ausschließlich in den beiden Zuständen, in denen der Bildschirm tatsächlich an bleibt. Timer und Kochstatistik zählen nur in dieser Zeit weiter.

Laut unserer Support-Matrix vom 9. September 2026 klappt der native Lock ab Safari 16.4, Chrome 84, Edge 84, Samsung Internet 14 und Firefox 126. Als Web-App auf dem iPhone-Home-Bildschirm braucht es iOS 18.4. Ältere Firefox-Versionen starten nach einem Tippen eine winzige Video-Ersatzlösung, die etwas mehr Akku kostet.

## Wenn der Bildschirm trotzdem dunkel wird

- **Stromsparmodus oder Energiesparmodus:** Er kann den Lock verweigern. Auf dem iPhone graut iOS dann bei der automatischen Sperre die Option „Nie“ aus (Einstellungen → Anzeige & Helligkeit); warum, erklärt [unsere Anleitung](/de/guides/iphone-automatische-sperre-nie-ausgegraut).
- **Tab im Hintergrund:** Die Anzeige meldet „Pausiert — Tab ausgeblendet“. Das ist die ehrliche Antwort, kein Fehler.
- **Kein HTTPS oder eine Einbettung ohne Berechtigung für `screen-wake-lock`:** Auch dann sehen Sie „blockiert“, nie ein vorgetäuschtes „gehalten“.

Unter Android legen Sie die normale Abschaltzeit unter Einstellungen → Display → Bildschirm-Timeout fest; einige Hersteller schicken außerdem Apps über eigene Listen schlafen. Lehnt der Browser ab, bringt erneutes Tippen auf Starten nichts. Lesen Sie den Hinweis unter der Anzeige und beheben Sie genau diese Ursache.

## Akku und Sicherheit am Herd

Ein leuchtendes Display verbraucht Strom. Beim stundenlangen Schmoren lohnt sich das Ladekabel. In Chromium-Browsern kann AwakeTab bei einem von Ihnen festgelegten Akkustand selbst stoppen; andere Browser bieten das womöglich nicht. Ein Handy ersetzt keinen Blick in den Topf: Verlassen Sie sich nie darauf, dass ein unbeaufsichtigtes Gerät irgendetwas überwacht. Weitere Szenarien mit Rezeptbuch oder Noten finden Sie beim [Lesen am Bildschirm](/for/reading).
