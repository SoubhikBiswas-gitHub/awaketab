---
title: "Bildschirm bei Präsentationen anlassen — AwakeTab"
description: "Vollbild-Folien verdecken den Tab. AwakeTab hält das Display nur, solange er sichtbar bleibt, etwa im schwebenden Fenster von Chrome, Edge oder Firefox."
h1: "Bildschirm während der Präsentation anlassen"
ogTitle: "Bildschirm bei Präsentationen anlassen"
intent: "bildschirm bei präsentation anlassen"
secondaryQueries: ["powerpoint bildschirm geht aus", "beamer geht aus während präsentation", "bildschirm nicht ausschalten präsentation", "laptop bildschirm anlassen vortrag", "präsentation bildschirm dauerhaft an"]
preset: p120
mode: standard
locale: de
reviewed: false
translationOf: "presentations"
lastVerified: 2026-09-09
browsers: []
os: []
lead: "Sie reden, niemand klickt, und nach ein paar Minuten wird die Leinwand schwarz. Präsentationsprogramme wechseln meist in den Vollbildmodus und verdecken dabei den Browser. AwakeTab kann das Display nur so lange anlassen, wie es selbst sichtbar bleibt: als schwebendes Fenster in Chrome, Edge oder Firefox am Desktop, als zweites Fenster oder auf einem Kontrollmonitor, der den Tab weiter zeigt. Die Voreinstellung dieser Seite ist „2 Std.“, genug für einen typischen Vortrag samt Fragerunde."
crumb: "Präsentationen"
toc:
  drei-wege-awaketab-sichtbar-zu-halten: "Drei Wege"
  welche-browser-taugen-für-den-vortrag: "Welche Browser"
  grenzen-die-sie-kennen-sollten: "Grenzen"
  checkliste-fünf-minuten-vor-dem-vortrag: "Checkliste"
figures:
  - frame: phone
    label: "Handy-Screenshot"
    alt: "das schwebende Fenster von AwakeTab mit der Meldung Bildschirm bleibt an"
    caption: "Das schwebende Fenster."
  - frame: desktop
    label: "Desktop-Screenshot"
    alt: "Folien im Vollbild in Chrome mit dem schwebenden Fenster von AwakeTab in einer Ecke"
    caption: "Folien im Vollbild mit dem schwebenden Fenster in einer Ecke."
pills:
  - state: held
    text: "Diese Meldung muss die Anzeige zeigen."
  - state: fallback
    text: "Oder diese, wenn die Video-Ersatzlösung läuft."
  - state: lost
    text: "Steht dort diese Meldung, ist AwakeTab verdeckt."
checklist:
  - "Läuft die Seite über HTTPS und ist der Tab sichtbar?"
  - "Ist das Netzteil eingesteckt? Im Akkubetrieb kann ein Energiesparmodus das Display dimmen oder früher abschalten."
  - "Zeigt die Statusanzeige wirklich, dass der Bildschirm an bleibt? Verlassen Sie sich nicht auf eine Uhr, die gerade noch hell ist."
  - "Reicht die Dauer? Nach Ablauf der gewählten Zeit fragt AwakeTab nach einer Verlängerung, etwa „+30 Min.“. Einen unbegrenzten Lock gibt es nur mit „∞“."
faq:
  - q: "Bleibt der Bildschirm an, wenn PowerPoint oder Keynote in den Vollbildmodus wechselt?"
    a: "Nur, wenn AwakeTab weiterhin irgendwo sichtbar ist: im schwebenden Fenster, in einem zweiten Fenster auf einem anderen Monitor oder in der Referentenansicht. Verdeckt die Präsentation den Tab vollständig, gibt der Browser den Wake Lock frei und die Anzeige zeigt „Pausiert — Tab ausgeblendet“."
  - q: "Was genau ist das schwebende Fenster?"
    a: "Ein kleines Fenster mit der Statusanzeige, das über anderen Fenstern liegt. Es gibt es am Desktop in Chrome und Edge ab 116 sowie in Firefox ab 151, nicht in Safari und nicht unter Android; in Safari öffnet sich stattdessen ein kleines normales Fenster. Blockiert der Browser Pop-ups, erlauben Sie sie für awaketab.com."
  - q: "Warum schaltet der Beamer trotzdem ab?"
    a: "Solange kein Lock gehalten wird, folgt der Beamer der Bildschirm-Abschaltzeit des Betriebssystems. Manche Projektoren und Monitore gehen außerdem bei Signalverlust von selbst in den Ruhezustand; darauf hat ein Wake Lock keinen Einfluss."
  - q: "Bleibe ich in Teams grün, während ich vortrage?"
    a: "Nein. Der Status in Teams, Slack oder Zoom hängt an Tastatur und Maus, nicht am Display. AwakeTab simuliert keine Eingaben. Wenn Sie beim Vortrag nichts anfassen, kann Ihr Status auf abwesend springen."
honestLimit: "Vollbild-Folien verdecken den Tab. Nutzen Sie das schwebende Fenster (Chrome, Edge, Firefox 151+ am Desktop) oder die Erweiterung, und denken Sie daran: Der Beamer folgt weiterhin der Bildschirm-Abschaltzeit des Betriebssystems."
related:
  - "/guides/second-monitor-turns-off"
  - "/for/night-clock"
  - "/on/windows-11"
  - "/on/macos"
  - "/on/samsung-internet"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Drei Wege, AwakeTab sichtbar zu halten

**Schwebendes Fenster.** Starten Sie die Sitzung und klicken Sie oben auf „Schwebendes Fenster“. Die kleine Statusanzeige liegt dann über den Folien. Das klappt am Desktop in Chrome und Edge ab 116 sowie in Firefox ab 151; Safari öffnet stattdessen ein kleines Fenster. Ob der Lock hält, während der Tab selbst verdeckt ist, haben wir noch nicht auf einem Gerät geprüft.

**Zweiter Bildschirm.** Mit Beamer oder externem Monitor läuft die Präsentation auf der Leinwand, AwakeTab bleibt auf dem Laptop-Display neben Ihren Notizen.

**Referentenansicht.** Zeigt Ihr Kontrollmonitor den Browser-Tab weiter, bleibt der Lock ebenfalls bestehen.

Testen Sie Ihre Variante am besten schon bei der Probe im leeren Raum, nicht erst vor Publikum. Dann wissen Sie, ob Beamer, Kabel und Browser zusammenspielen.

In allen drei Fällen gilt:

::pills

::figures

::ad

## Welche Browser taugen für den Vortrag

Laut Matrix vom 9. September 2026 reicht für den nativen Lock Safari ab 16.4, Firefox ab 126, Samsung Internet ab 14 sowie Chrome oder Edge ab 84. Das schwebende Fenster gibt es am Desktop in Chrome und Edge ab 116 sowie in Firefox ab 151, nicht in Safari und nicht unter Android. Ältere Firefox-Versionen greifen nach einem Klick auf eine Video-Ersatzlösung zurück, die mehr Akku braucht.

Präsentieren Sie vom iPad oder einem Android-Tablet, gilt dieselbe Regel: Der Lock hält nur, solange AwakeTab vorne ist. Schiebt sich die Folien-App in den Vordergrund, springt die Anzeige auf „Pausiert — Tab ausgeblendet“, und das Tablet folgt wieder seiner eigenen Sperrzeit.

## Grenzen, die Sie kennen sollten

Der Beamer folgt der Abschaltzeit des Betriebssystems, sobald kein Lock gehalten wird. Klappen Sie den Laptop zu, schläft er ein; dagegen hilft kein Browser-Tab. Hardware mit eigener Abschaltung, etwa ein Monitor, der ohne Signal einschläft, oder eine Sperrbildschirm-Richtlinie Ihrer Firma liegen außerhalb dessen, was ein Browser steuern kann.

::limit

## Checkliste fünf Minuten vor dem Vortrag

::checklist

Wer die Abschaltzeit lieber direkt im System anpasst: unter Windows unter Einstellungen → System → Netzbetrieb und Akku, auf dem Mac unter Systemeinstellungen → Sperrbildschirm. Beide Geräte stellen wir ausführlicher vor, unter [Windows 11](/de/on/windows-11) und [macOS](/de/on/macos).
