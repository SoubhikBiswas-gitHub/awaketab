---
title: "Mac-Display im Browser wach halten — AwakeTab"
description: "Safari ab 16.4, Chrome ab 84 und Firefox ab 126 halten das Mac-Display an. Dabei schläft auch der Mac nicht ein, zugeklappt aber schon."
h1: "Mac-Display im Browser wach halten"
intent: "mac bildschirm ruhezustand verhindern browser"
secondaryQueries: ["mac bildschirm nicht ausschalten", "macbook bildschirm anlassen", "mac display dauerhaft an ohne app", "macbook bildschirm geht aus safari", "mac ruhezustand verhindern browser"]
preset: p60
mode: standard
locale: de
reviewed: false
translationOf: "macos"
lastVerified: 2026-09-09
browsers: ["chrome", "safari", "firefox"]
os: ["macos"]
faq:
  - q: "Läuft mein Mac im Hintergrund weiter, solange das Display an ist?"
    a: "Ja, solange das Display an bleibt. Laut Apples IOKit-Dokumentation schläft der Mac dann auch nicht bei Inaktivität ein; im Terminal zeigt pmset -g assertions die Zusicherung des Browsers. Soll ein Download oder Render-Job bei dunklem Bildschirm weiterlaufen, brauchen Sie ein natives Werkzeug wie den Terminal-Befehl caffeinate -i."
  - q: "Kann ich das MacBook zuklappen, wenn AwakeTab läuft?"
    a: "Nein. Ein zugeklappter Deckel versetzt den Mac in den Ruhezustand, außer im Clamshell-Modus mit Netzteil und externem Monitor. Keine Webseite kann das ändern."
  - q: "Was passiert, wenn ich das Fenster ins Dock lege?"
    a: "Dann ist der Tab ausgeblendet, und der Browser gibt den Wake Lock frei. Die Anzeige zeigt „Pausiert — Tab ausgeblendet“, der Timer steht. Holen Sie das Fenster zurück und warten Sie auf „Bildschirm bleibt an“."
  - q: "Welcher Browser ist auf dem Mac die beste Wahl?"
    a: "Safari 16.4+, Chrome 84+ und Firefox 126+ gewähren alle einen nativen Lock, ebenso Edge 84+ und Opera 70+. Ältere Firefox-Versionen nutzen nach einem Klick eine Video-Ersatzlösung mit höherem Stromverbrauch. Das schwebende Fenster gibt es in Chrome und Edge ab 116 sowie in Firefox ab 151."
honestLimit: "Das Display bleibt an, solange der Tab sichtbar ist, und so lange schläft der Mac auch nicht bei Inaktivität ein. Ein zugeklappter Deckel schickt ihn trotzdem schlafen, außer im Clamshell-Modus mit Netzteil und externem Monitor."
related:
  - "/vs/caffeine"
  - "/vs/caffeinate-command"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/for/downloads"
  - "/learn/does-a-wake-lock-keep-teams-green"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Was auf dem Mac geht und was nicht

Safari ab 16.4, Chrome ab 84 und Firefox ab 126 können auf dem Mac einen nativen Bildschirm-Lock vergeben. AwakeTab nutzt ihn, damit das Display nicht dunkel wird, solange der Tab sichtbar ist. Solange das Display an bleibt, geht laut Apples Dokumentation auch der Mac nicht in den Leerlauf-Ruhezustand. Die wichtigste Grenze: Ein zugeklappter Deckel schickt den Mac schlafen, außer im Clamshell-Modus mit Netzteil und externem Monitor.

## Display-Ruhezustand ist nicht System-Ruhezustand

macOS unterscheidet zwischen dem Abschalten des Bildschirms und dem Schlafen des ganzen Rechners. Ein Wake Lock aus dem Browser zielt auf die erste Stufe. Chrome hält dafür eine Zusicherung gegen den Display-Ruhezustand, und laut Apples IOKit-Dokumentation schläft der Mac dann auch nicht bei Inaktivität ein (Quellen geprüft am 26. September 2026). Soll der Mac dagegen bei ausgeschaltetem Bildschirm wach bleiben, etwa für einen Upload über Nacht, brauchen Sie native Mittel: `caffeinate -i` im Terminal oder Apps wie Caffeine. Wie sich beides von einem Browser-Tab unterscheidet, zeigt unser [Vergleich mit Caffeine](/de/vs/caffeine).

## So starten Sie auf dem Mac

1. Rufen Sie awaketab.com in Safari, Chrome oder Firefox auf; voreingestellt ist „1 Std.“.
2. Starten Sie per Klick auf „Bildschirm eingeschaltet lassen“ oder mit der Leertaste.
3. Legen Sie das Fenster so, dass es sichtbar bleibt, etwa als schmales Fenster neben Ihrer eigentlichen Arbeit. Ein Fenster im Dock oder ein Tab im Hintergrund zählt als ausgeblendet.
4. Achten Sie auf die Anzeige: Erst „Bildschirm bleibt an“ bestätigt den Lock.

Für Vollbild-Apps wie Keynote bietet das „Schwebende Fenster“ in Chrome, Edge und Firefox ab 151 eine kleine Anzeige, die über allem liegt. In Safari öffnet AwakeTab stattdessen ein kleines Fenster.

Typische Mac-Fälle sind ein Dashboard auf dem zweiten Monitor, eine Anleitung neben dem Terminal oder ein Rezept auf dem MacBook in der Küche. Solange das Fenster sichtbar bleibt, bleibt auch der Bildschirm hell. Rutscht es hinter ein anderes Fenster und ist ganz verdeckt, kann der Browser den Lock trotzdem freigeben; prüfen Sie dann die Anzeige.

## Die macOS-Einstellungen dazu

Wann der Bildschirm ausgeht, legen Sie unter Systemeinstellungen → Sperrbildschirm fest; Details zum Energieverhalten finden Sie unter Energie bzw. auf MacBooks unter Batterie. Der Stromsparmodus dort verhindert den Lock nicht, denn weder Safari noch Chrome prüfen ihn. „Blockiert — so beheben Sie es“ zeigt AwakeTab nur bei einer echten Ablehnung, etwa wenn Safari erst einen Klick braucht, und nennt dann die Ursache, statt einen Erfolg vorzutäuschen. Dimmt das Display trotz „Bildschirm bleibt an“, steckt meist eine andere Regel dahinter, etwa ein von der IT verwaltetes Profil oder ein externer Monitor, der sich selbst abschaltet.

## Browser auf dem Mac

| Browser | Nativer Lock ab | Besonderheit |
|---|---|---|
| Safari | 16.4 | braucht zum Start einen Klick |
| Chrome | 84 | schwebendes Fenster ab 116 |
| Firefox | 126 | davor Video-Ersatzlösung nach einem Klick; schwebendes Fenster ab 151 |

Die Versionen stammen aus unserer Support-Matrix vom 9. September 2026. Edge 84+ und Opera 70+ funktionieren auf dem Mac ebenfalls nativ.

## Chat-Status, Akku und Nachtbetrieb

Teams, Slack und Zoom setzen Ihren Status nach Tastatur- und Mausaktivität, nicht nach dem Display; AwakeTab simuliert keine Eingaben. Für lange Sitzungen hängen Sie das MacBook ans Netzteil. In Chrome kann AwakeTab bei einem festgelegten Akkustand automatisch stoppen, Safari und Firefox bieten das womöglich nicht.
