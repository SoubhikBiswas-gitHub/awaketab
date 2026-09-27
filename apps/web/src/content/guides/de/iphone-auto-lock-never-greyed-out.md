---
title: "iPhone: Automatische Sperre „Nie“ ausgegraut — AwakeTab"
description: "„Nie“ ist ausgegraut, wenn der Stromsparmodus aktiv ist oder ein Firmenprofil die Sperre begrenzt. Der Stromsparmodus stellt sie auf 30 Sekunden."
h1: "iPhone: Automatische Sperre „Nie“ ausgegraut – so beheben Sie es"
ogTitle: "Automatische Sperre „Nie“ ausgegraut"
intent: "iphone automatische sperre nie ausgegraut"
secondaryQueries: ["automatische sperre nie geht nicht", "iphone automatische sperre lässt sich nicht ändern", "iphone sperrt nach 30 sekunden", "stromsparmodus automatische sperre", "automatische sperre grau iphone"]
preset: p30
mode: standard
locale: de
reviewed: false
translationOf: "iphone-auto-lock-never-greyed-out"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Warum kann ich bei der automatischen Sperre nur „30 Sekunden“ auswählen?"
    a: "Weil der Stromsparmodus eingeschaltet ist. Er graut alle anderen Optionen einschließlich „Nie“ aus und legt die Sperre auf 30 Sekunden fest. Deaktivieren Sie den Modus unter Einstellungen → Batterie, dann sind die Optionen wieder wählbar. Bleiben sie grau, begrenzt meist ein Arbeits- oder Schulprofil die Sperre."
  - q: "Brauche ich „Nie“ überhaupt, wenn ich AwakeTab nutze?"
    a: "Nein. In Safari ab 16.4 hält AwakeTab den Bildschirm an, solange der Tab vorne ist, egal welche Sperrzeit eingestellt ist. Ob der Lock auch bei aktivem Stromsparmodus hält, haben wir noch nicht auf einem Gerät geprüft; das Ergebnis erscheint auf unserer Testseite."
  - q: "Bleibt der Bildschirm an, wenn ich Safari verlasse?"
    a: "Nein. Wechseln Sie die App oder den Tab, gibt Safari den Wake Lock frei, und die Anzeige zeigt „Pausiert — Tab ausgeblendet“. Ab dann gilt wieder die automatische Sperre aus den Einstellungen."
  - q: "Ist „Nie“ auf Dauer eine gute Idee?"
    a: "Für einzelne Aufgaben ist eine zeitlich begrenzte Sitzung meist besser. Ein ständig leuchtendes Display kostet Akku, und auf OLED-Displays droht Einbrennen. AwakeTab endet nach der gewählten Dauer von selbst und fragt, ob Sie verlängern möchten."
honestLimit: "Der Stromsparmodus graut „Nie“ aus und stellt die Sperre auf 30 Sekunden. Ob ein Wake Lock aus Safari dann noch hält, haben wir noch nicht auf einem Gerät geprüft. Ein Firmenprofil kann die Sperre ebenfalls begrenzen."
related:
  - "/on/iphone-safari"
  - "/learn/low-power-mode-and-wake-locks"
  - "/on/ios-home-screen"
  - "/for/downloads"
  - "/for/night-clock"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Die Ursache in einem Satz

Unter Einstellungen → Anzeige & Helligkeit → Automatische Sperre ist „Nie“ ausgegraut, weil der Stromsparmodus aktiv ist; seltener begrenzt ein Arbeits- oder Schulprofil (MDM) die Sperre. Schalten Sie den Stromsparmodus zuerst aus. Danach können Sie „Nie“ wieder wählen, oder Sie lassen die Einstellung, wie sie ist, und halten den Bildschirm mit Safari 16.4 oder neuer nur so lange an, wie Sie den Tab geöffnet haben.

## So bekommen Sie „Nie“ zurück

1. Öffnen Sie **Einstellungen → Batterie** und schalten Sie **Stromsparmodus** aus. Alternativ tippen Sie im Kontrollzentrum auf das Batteriesymbol, falls Sie es dort hinzugefügt haben.
2. Öffnen Sie **Einstellungen → Anzeige & Helligkeit → Automatische Sperre**.
3. Wählen Sie **Nie** oder eine längere Zeitspanne.

Ist der Akku fast leer, hilft das Ladekabel, bevor Sie den Stromsparmodus abschalten. Sonst schlägt iOS ihn bald erneut vor.

## Wenn „Nie“ weiterhin grau bleibt

Prüfen Sie, ob das Batteriesymbol oben rechts noch gelb ist. Gelb bedeutet: Der Stromsparmodus läuft noch, und die automatische Sperre steht auf 30 Sekunden. Safari prüft ihn nicht und lehnt den Lock deshalb auch nicht mit „Blockiert — so beheben Sie es“ ab; ob das iPhone mit gehaltenem Lock trotzdem sperrt, ist noch nicht auf einem Gerät geprüft. Ist das Symbol nicht gelb, sehen Sie unter Einstellungen → Allgemein → VPN und Geräteverwaltung nach: Ein Arbeits- oder Schulprofil kann die Sperre begrenzen, und nur dessen Verwaltung kann das ändern.

Warum koppelt Apple beides? Im Stromsparmodus soll das iPhone so wenig Energie wie möglich verbrauchen, und ein früh abgeschaltetes Display spart davon am meisten. Deshalb lässt iOS die Sperrzeit in diesem Zustand nicht frei wählen.

## Oder die Einstellung ganz überspringen: AwakeTab

Oft wollen Sie gar nicht, dass das iPhone dauerhaft nie sperrt, sondern nur jetzt, für ein Rezept, eine Anleitung oder einen Download. Dafür reicht ein Tab:

1. Rufen Sie in Safari awaketab.com auf; die Dauer steht bereits auf „30 Min.“.
2. Ein Tipp auf „Bildschirm eingeschaltet lassen“ startet die Sitzung.
3. Sobald die Anzeige „Bildschirm bleibt an“ meldet, bleibt das Display an, bis die Zeit abläuft oder Sie den Tab verlassen.

Die Einstellung „Automatische Sperre“ bleibt dabei unverändert. Nach der Sitzung sperrt das iPhone wie gewohnt. Einen nativen Lock gibt es ab Safari 16.4; als Web-App auf dem Home-Bildschirm ab iOS 18.4, so steht es in unserer Support-Matrix vom 9. September 2026. Ältere Versionen können nach einem Tippen eine Video-Ersatzlösung nutzen, die mehr Akku braucht. Alles Weitere zu Safari auf dem iPhone steht auf der Seite [iPhone-Bildschirm in Safari anlassen](/de/on/iphone-safari).

## Was auch ohne Stromsparmodus nicht klappt

Verlassen Sie Safari, wird der Lock sofort freigegeben; die Anzeige wechselt zu „Pausiert — Tab ausgeblendet“ und der Timer hält an. AwakeTab hält Sie außerdem nicht in Teams oder Slack auf „verfügbar“, denn deren Status hängt an Ihren Eingaben, nicht am Display. Und ein iPhone, das unbeaufsichtigt als Babyfon oder Sicherheitsmonitor dient, sollten Sie nicht allein auf einen Wake Lock stützen.
