---
title: "Compatibilidad de Wake Lock por navegador — AwakeTab"
description: "Wake Lock nativo desde Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 y Opera 70, según la tabla del 9 de septiembre de 2026."
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
faq:
  - q: "¿Qué navegadores mantienen la pantalla encendida sin usar el respaldo?"
    a: "Los que tienen Wake Lock nativo: Chrome 84+, Edge 84+, Firefox 126+, Safari 16.4+, Samsung Internet 14+ y Opera 70+. En todos, la pestaña tiene que estar visible para que el bloqueo se mantenga."
  - q: "¿Qué pasa si uso un Firefox anterior a la versión 126?"
    a: "AwakeTab ofrece el video de respaldo: un video silencioso diminuto que mantiene la pantalla encendida. Necesita que toques o hagas clic para arrancar y consume más energía. El indicador lo muestra como “Despierta con video de respaldo”."
  - q: "¿Funciona como app instalada en la pantalla de inicio del iPhone?"
    a: "Sí, desde iOS 18.4. Con versiones anteriores, el Wake Lock no está disponible en las apps de la pantalla de inicio, así que conviene usar AwakeTab directamente en Safari 16.4 o posterior."
  - q: "¿El bloqueo sigue activo en una pestaña en segundo plano?"
    a: "No, en ningún navegador de la tabla. Al ocultar la pestaña, minimizar la ventana o cambiar de app, el navegador libera el bloqueo y el indicador muestra “En pausa — pestaña oculta” hasta que vuelves."
honestLimit: "La tabla corresponde al 9 de septiembre de 2026; las versiones anteriores usan el video de respaldo y cada fila está ligada a esa fecha de prueba."
related:
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/on/ios-home-screen"
  - "/learn/screen-wake-lock-api-guide"
  - "/learn/how-we-tested"
author: soubhik
published: 2026-09-26
---

## Resumen de la tabla

Estas son las versiones mínimas con Wake Lock nativo según nuestra matriz de compatibilidad del 9 de septiembre de 2026: Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 y Opera 70. Las apps web instaladas en la pantalla de inicio del iPhone lo tienen desde iOS 18.4. Un Firefox más antiguo usa el video de respaldo. Si una combinación no aparece en la tabla, es porque no la probamos, y no afirmamos que funcione.

## Tabla de compatibilidad

| Navegador | Versión mínima | Mecanismo | Plataformas | Nota |
|---|---|---|---|---|
| Chrome | 84 | Nativo | Windows, macOS, Linux, Android, ChromeOS | La pestaña debe seguir visible. El Ahorro de batería puede rechazar o liberar el bloqueo. |
| Edge | 84 | Nativo | Windows, macOS | La pestaña debe seguir visible. El modo de eficiencia puede afectar el bloqueo. |
| Firefox | 126 | Nativo | Windows, macOS, Linux, Android | Las versiones anteriores usan el video de respaldo después de un gesto. |
| Safari | 16.4 | Nativo | macOS, iOS, iPadOS | El Modo de bajo consumo puede impedir el bloqueo. La pestaña debe seguir visible. |
| Samsung Internet | 14 | Nativo | Android | Los ajustes de ahorro de energía pueden rechazar o liberar el bloqueo. |
| Opera | 70 | Nativo | Windows, macOS, Linux, Android | Basado en Chromium; la pestaña debe seguir visible. |
| App en la pantalla de inicio de iOS | 18.4 | Nativo | iOS | Con versiones anteriores, usa AwakeTab en Safari. |
| Video de respaldo | — | Respaldo | — | Requiere un toque o clic y consume más energía que el bloqueo nativo. |

## Cómo leer la tabla

**Versión mínima** es la primera versión en la que el navegador concede un Screen Wake Lock a una pestaña visible y segura (HTTPS). No es una promesa sobre tu equipo en particular: el ahorro de batería, el Modo de bajo consumo o una política del sitio pueden rechazar la solicitud aunque tu navegador esté al día. Cuando eso ocurre, el indicador cambia a “Bloqueado — aquí está la solución” y explica el motivo; jamás finge un “Pantalla despierta”.

**Nativo** significa que AwakeTab usa la API del navegador directamente. **Respaldo** significa que reproduce un video silencioso de un cuadro para mantener la pantalla encendida; solo arranca después de que tocas la pantalla y gasta más batería.

## Lo que ninguna fila cambia

Todas las filas comparten las mismas reglas de la plataforma. El bloqueo solo existe mientras la pestaña está visible: ocultarla, minimizar la ventana o cambiar de app lo libera. Cerrar la tapa de una laptop suspende el equipo siempre. Y ningún navegador de la lista mantiene tu estado “disponible” en Teams, Slack o Zoom, porque esas apps miden actividad de teclado y mouse.

## Guías por dispositivo

Si ya sabes qué navegador usas, las guías específicas explican los ajustes del sistema y los límites de cada caso: [iPhone con Safari](/es/on/iphone-safari), [Android con Chrome](/es/on/android-chrome) y [Windows 11](/es/on/windows-11). Para la Mac y otros equipos, revisa las páginas relacionadas.

## Fecha y actualizaciones

Cada fila está ligada a la fecha de prueba del 9 de septiembre de 2026, que también aparece como fecha de verificación de esta página. Si tu versión es anterior a la mínima, actualiza el navegador o usa el video de respaldo; AwakeTab te lo propone con “Toca para usar el respaldo”.
