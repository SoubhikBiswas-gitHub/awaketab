---
title: "Compatibilidad de Wake Lock por navegador — AwakeTab"
description: "Wake Lock nativo desde Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 y Opera 70, según fuentes revisadas en septiembre de 2026."
h1: "Compatibilidad de Wake Lock por navegador"
ogTitle: "Wake Lock: compatibilidad por navegador"
intent: "compatibilidad wake lock navegadores"
secondaryQueries: ["qué navegadores soportan wake lock", "screen wake lock api compatibilidad", "wake lock safari versión", "wake lock firefox versión", "mantener pantalla encendida navegador compatible"]
preset: p15
mode: standard
locale: es
reviewed: false
translationOf: "browser-support-matrix"
lastVerified: 2026-09-09
browsers: []
os: []
crumb: "Matriz de compatibilidad"
lead: "Estas son las versiones mínimas con Wake Lock nativo según la documentación y el código fuente de los navegadores (revisados el 26 de septiembre de 2026): Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 y Opera 70. Las apps web instaladas en la pantalla de inicio del iPhone lo tienen desde iOS 18.4. Un Firefox más antiguo usa el video de respaldo. Si una combinación no aparece en la tabla, es porque no la revisamos, y no afirmamos que funcione."
rows:
  rules:
    - title: "El bloqueo solo existe mientras la pestaña está visible."
      text: "Ocultarla, minimizar la ventana o cambiar de app lo libera."
    - title: "Cerrar la tapa de una laptop suspende el equipo, salvo excepciones como el modo de tapa cerrada de la Mac con pantalla externa."
    - title: "Ningún navegador de la lista mantiene tu estado “disponible” en Teams, Slack o Zoom."
      text: "Esas apps miden actividad de teclado y mouse."
notes:
  pending:
    kicker: "Nota"
    text: "Aún no registramos pruebas en dispositivos; cuando existan, aparecerán en nuestra página sobre cómo probamos."
faq:
  - q: "¿Qué navegadores mantienen la pantalla encendida sin usar el respaldo?"
    a: "Los que tienen Wake Lock nativo: Chrome 84+, Edge 84+, Firefox 126+, Safari 16.4+, Samsung Internet 14+ y Opera 70+. En todos, la pestaña tiene que estar visible para que el bloqueo se mantenga."
  - q: "¿Qué pasa si uso un Firefox anterior a la versión 126?"
    a: "AwakeTab ofrece el video de respaldo: un video silencioso diminuto que mantiene la pantalla encendida. Necesita que toques o hagas clic para arrancar y consume más energía. El indicador lo muestra como “Despierta con video de respaldo”."
  - q: "¿Funciona como app instalada en la pantalla de inicio del iPhone?"
    a: "Sí, desde iOS 18.4. Con versiones anteriores, el Wake Lock no está disponible en las apps de la pantalla de inicio, así que conviene usar AwakeTab directamente en Safari 16.4 o posterior."
  - q: "¿El bloqueo sigue activo en una pestaña en segundo plano?"
    a: "No, en ningún navegador de la tabla. Al ocultar la pestaña, minimizar la ventana o cambiar de app, el navegador libera el bloqueo y el indicador muestra “En pausa — pestaña oculta” hasta que vuelves."
honestLimit: "La tabla se basa en la documentación y el código fuente de los navegadores, revisados el 26 de septiembre de 2026; aún no registramos pruebas en dispositivos, y las versiones anteriores usan el video de respaldo."
related:
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/on/ios-home-screen"
  - "/learn/screen-wake-lock-api-guide"
  - "/learn/how-we-tested"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Tabla de compatibilidad

| Navegador | Versión mínima | Mecanismo | Plataformas | Nota |
|---|---|---|---|---|
| Chrome | 84 | Nativo | Windows, macOS, Linux, Android, ChromeOS | La pestaña debe seguir visible. Chrome no revisa el Ahorro de batería. |
| Edge | 84 | Nativo | Windows, macOS, Linux, Android | La pestaña debe seguir visible. El modo de eficiencia no rechaza el bloqueo. |
| Firefox | 126 | Nativo | Windows, macOS, Linux, Android | Rechaza y libera el bloqueo con la batería al 5 % o menos sin cargar. Las versiones anteriores usan el video de respaldo después de un gesto. |
| Safari | 16.4 | Nativo | macOS, iOS, iPadOS | Necesita un toque primero. El Modo de bajo consumo fija el Bloqueo automático del iPhone en 30 s. La pestaña debe seguir visible. |
| Samsung Internet | 14 | Nativo | Android | Las “apps en suspensión” pueden cerrar el navegador después de que lo dejas; no afectan una pestaña visible. |
| Opera | 70 | Nativo | Windows, macOS, Linux, Android | Basado en Chromium; la pestaña debe seguir visible. |
| App en la pantalla de inicio de iOS | 18.4 | Nativo | iOS | Con versiones anteriores, usa AwakeTab en Safari. |
| Video de respaldo | — | Respaldo | — | Requiere un toque o clic y consume más energía que el bloqueo nativo. |

## Cómo leer la tabla

**Versión mínima** es la primera versión en la que el navegador concede un Screen Wake Lock a una pestaña visible y segura (HTTPS). No es una promesa sobre tu equipo en particular: una pestaña oculta, una política del sitio (por ejemplo, un marco sin permiso), Safari sin un toque previo o Firefox con la batería al 5 % o menos pueden rechazar la solicitud aunque tu navegador esté al día. Cuando eso ocurre, el indicador cambia a “Bloqueado — aquí está la solución” y explica el motivo; jamás finge un “Pantalla despierta”. Una página sin HTTPS no tiene Wake Lock.

**Nativo** significa que AwakeTab usa la API del navegador directamente. **Respaldo** significa que reproduce un video silencioso de un cuadro para mantener la pantalla encendida; solo arranca después de que tocas la pantalla y gasta más batería.

::ad

## Fecha y actualizaciones

Cada fila se revisó con la documentación y el código fuente de los navegadores el 26 de septiembre de 2026:

- [MDN browser-compat-data, WakeLock](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json)
- [New in Chrome 84](https://developer.chrome.com/blog/new-in-chrome-84/)
- [Firefox 126 release notes for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126)
- [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- [Chromium wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc)
- [WebKit WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp)
- [Firefox WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp)

Si tu versión es anterior a la mínima, actualiza el navegador o usa el video de respaldo; AwakeTab te lo propone con “Toca para usar el respaldo”.

::note pending

## Guías por dispositivo

Si ya sabes qué navegador usas, las guías específicas explican los ajustes del sistema y los límites de cada caso: [iPhone con Safari](/es/on/iphone-safari), [Android con Chrome](/es/on/android-chrome) y [Windows 11](/es/on/windows-11). Para la Mac y otros equipos, revisa las páginas relacionadas.

## Lo que ninguna fila cambia

Todas las filas comparten las mismas reglas de la plataforma.

::rows rules

::limit inline
