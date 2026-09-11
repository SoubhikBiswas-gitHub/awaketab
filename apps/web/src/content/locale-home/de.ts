import type { ILocaleHomeCopy } from './types';

export const de: ILocaleHomeCopy = {
  whatItDoes: [
    'AwakeTab nutzt die Wake-Lock-API des Browsers, solange dieser Tab sichtbar ist, und die Statusanzeige meldet erst dann, dass der Bildschirm eingeschaltet bleibt, wenn der Browser den Lock tatsächlich bestätigt hat. Wählen Sie eine Dauer — 15 Minuten bis 4 Stunden, eine benutzerdefinierte Länge von bis zu sieben Tagen oder eine Uhrzeit —, und der Bildschirm hört auf, sich zu verdunkeln, in den Ruhezustand zu wechseln oder den Sperrbildschirm anzuzeigen. Die Anzeige zeigt „Bildschirm bleibt an“ nur, solange der Browser den Lock tatsächlich hält. Blenden Sie diesen Tab aus, nimmt der Browser den Lock zurück, die Anzeige wechselt zu „Pausiert — Tab ausgeblendet“, und der Timer stoppt, bis Sie zurückkehren.',
    'Es ist kein Konto, kein Download und keine Erweiterung nötig: Das gesamte Tool ist diese Seite. Einstellungen, die aktuelle Sitzung und sieben Tage Statistik bleiben in diesem Browser. Es wird nichts gesendet, es sei denn, Sie lassen das optionale Nutzungs-Beacon aktiviert. Diese Seite lädt keine Skripte oder Web-Fonts von Drittanbietern, bleibt daher auch auf dem Smartphone schnell und funktioniert nach dem ersten Besuch offline. Die Kopfzeile bietet eine Installationsoption, falls Sie das Tool auf dem Startbildschirm oder im Dock ablegen möchten; die installierte App kann beim Ende einer Sitzung einen Ton abspielen und benachrichtigen.',
  ],
  howItWorks: [
    'Sie wählen eine Dauer. Eine Voreinstellung, eine benutzerdefinierte Länge oder eine Uhrzeit startet eine Sitzung. Dieselben Optionen erreichen Sie auch per Tastendruck: 1 bis 6 für Voreinstellungen, 0 für kein Ende, U für eine Uhrzeit und die Leertaste zum Starten oder Beenden.',
    'Der Browser wird um einen Screen Wake Lock gebeten. AwakeTab ruft die Screen Wake Lock API auf — denselben Mechanismus, den auch ein Videoplayer nutzt. Der Browser kann zustimmen, ablehnen oder den Lock später zurücknehmen; alle drei Antworten werden angezeigt, sobald sie eintreten.',
    'Der Timer folgt dem Lock, nicht der Uhr. Der Countdown läuft nur, solange der Lock gehalten wird, und jede Berechnung nutzt die Systemzeit, sodass ein Laptop, der in den Ruhezustand versetzt wurde, mit einer ehrlichen Zahl zurückkehrt. Ist die Zeit abgelaufen, ertönt ein Signal, und Sie können verlängern oder beenden.',
  ],
  honestLimits: [
    'Ein ausgeblendeter Tab kann keinen Wake Lock halten. Das Wechseln der App, das Minimieren oder ein Tab-Wechsel pausiert die Sitzung. Das ist eine Plattformregel. Damit der Bildschirm auch hinter anderen Fenstern eingeschaltet bleibt, nutzen Sie die AwakeTab-Erweiterung für Chrome und Edge.',
    'Das Schließen des Laptop-Deckels versetzt das Gerät weiterhin in den Ruhezustand. Keine Webseite und keine Erweiterung kann das ändern. Dafür braucht es eine Betriebssystem-Einstellung, einen externen Bildschirm oder ein natives Tool.',
    'Der Energiesparmodus gewinnt. Der Stromsparmodus des iPhone erzwingt eine automatische Sperre nach 30 Sekunden; der Akkusparmodus von Android und Windows kann die Anfrage ablehnen. Sie erhalten dann die Anzeige „Blockiert — so beheben Sie es“ mit der Ursache.',
    'Ihren Chat-Status beeinflusst es nicht. Die Anwesenheitsanzeige von Teams, Slack und Zoom richtet sich nach der Leerlaufzeit von Tastatur und Maus, nicht nach dem Bildschirm. Ein Wake Lock hält Sie nicht „grün“, und AwakeTab simuliert niemals Eingaben, um das vorzutäuschen.',
    'Bildschirm-Ruhezustand ist nicht dasselbe wie System-Ruhezustand. Ein Wake Lock hält nur den Bildschirm wach. In unseren Tests hat Chromium unter Windows zusätzlich den Leerlauf-Ruhezustand des Systems verzögert; unter macOS war das nicht der Fall. Damit das Gerät bei ausgeschaltetem Bildschirm wach bleibt, nutzen Sie ein natives Dienstprogramm.',
    'Andere Software folgt ihren eigenen Regeln. Eine Bank-Abmeldung, eine Prüfungsaufsicht-App, ein Monitor, der bei Signalverlust in den Ruhezustand geht, oder eine unternehmensweite Sperrbildschirm-Richtlinie liegen alle außerhalb der Reichweite eines Wake Locks.',
  ],
};
