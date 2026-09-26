---
title: "Evita que la pantalla de tu Mac se apague — AwakeTab"
description: "Safari 16.4+, Chrome 84+ y Firefox 126+ mantienen encendida la pantalla de tu Mac. En nuestras pruebas no evitaron el reposo; cerrar la tapa lo activa."
h1: "Evita que la pantalla de tu Mac se apague desde una pestaña"
ogTitle: "Que la pantalla de tu Mac no se apague"
intent: "evitar que la pantalla de la mac se apague desde el navegador"
secondaryQueries: ["mantener pantalla encendida mac", "que no se apague la pantalla de la mac", "evitar reposo de pantalla macbook", "pantalla siempre encendida macbook safari", "mac se bloquea sola cómo evitarlo"]
preset: p60
mode: standard
locale: es
reviewed: false
translationOf: "macos"
lastVerified: 2026-09-09
browsers: ["chrome", "safari", "firefox"]
os: ["macos"]
faq:
  - q: "¿AwakeTab evita que la Mac entre en reposo?"
    a: "Mantiene la pantalla encendida, que es lo que promete. En nuestras pruebas, macOS no evitó el reposo del sistema por inactividad con solo un Wake Lock del navegador. Si necesitas el equipo activo con la pantalla apagada, usa una utilidad nativa."
  - q: "¿Funciona con la tapa de la MacBook cerrada?"
    a: "No. Cerrar la tapa siempre pone la Mac en reposo, y ninguna página web puede evitarlo. AwakeTab solo actúa sobre el tiempo de apagado de la pantalla mientras la pestaña está visible."
  - q: "¿Qué navegador conviene usar en Mac?"
    a: "Cualquiera de estos tiene Wake Lock nativo: Safari 16.4+, Chrome 84+, Firefox 126+, además de Edge 84+ y Opera 70+. Con un Firefox anterior, AwakeTab usa un video de respaldo tras un clic, que gasta más energía."
  - q: "¿Qué pasa si minimizo la ventana o cambio a otra pestaña?"
    a: "El navegador libera el bloqueo y el indicador muestra “En pausa — pestaña oculta”; la cuenta regresiva se detiene. Vuelve a la pestaña y espera a “Pantalla despierta” antes de alejarte."
honestLimit: "La pantalla sigue encendida, pero en nuestras pruebas macOS no evitó el reposo del sistema por inactividad; cerrar la tapa siempre pone la Mac en reposo y el Modo de bajo consumo puede acortar el tiempo."
related:
  - "/vs/caffeine"
  - "/vs/caffeinate-command"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/for/downloads"
  - "/learn/does-a-wake-lock-keep-teams-green"
author: soubhik
published: 2026-09-26
---

## Qué consigues en macOS

Safari 16.4+, Chrome 84+ y Firefox 126+ pueden mantener encendida la pantalla de tu Mac desde una pestaña visible, sin instalar ninguna app. Inicia la sesión de una hora que trae esta página, o cualquier otra duración; estará activa cuando el indicador marque “Pantalla despierta”. Ten presentes dos límites: en nuestras pruebas, macOS no evitó el reposo del sistema por inactividad, y cerrar la tapa siempre pone la Mac en reposo.

## Pantalla encendida no es lo mismo que Mac despierta

macOS separa dos cosas: el reposo de la pantalla y el reposo del sistema. Un Wake Lock del navegador está diseñado para la primera, y en nuestras pruebas macOS no lo trató como motivo para mantener despierto el sistema. Por eso, si tu objetivo es que termine una copia larga o una exportación con la pantalla apagada, AwakeTab no es la herramienta: necesitas una utilidad nativa, como el comando caffeinate que trae macOS. Comparamos ese enfoque con una pestaña en [Caffeine vs. AwakeTab](/es/vs/caffeine).

## Cómo dejarlo listo

1. Conecta la MacBook al cargador si la sesión va a ser larga. El Modo de bajo consumo puede acortar el tiempo o rechazar el bloqueo.
2. Abre AwakeTab en Safari, Chrome o Firefox y elige la duración.
3. Revisa que el indicador diga “Pantalla despierta”. Si dice “Bloqueado — aquí está la solución”, el motivo aparece justo debajo.
4. Deja la ventana a la vista. Puede estar en un costado de la pantalla o en un monitor externo, pero no minimizada.

Los ajustes del sistema que controlan cuándo se apaga la pantalla están en Ajustes del Sistema → Pantalla bloqueada y en Energía (o Batería en una MacBook). AwakeTab no los cambia: solo evita que ese tiempo corra mientras la pestaña sigue al frente.

## La tapa cerrada

Una MacBook con la tapa cerrada entra en reposo siempre. No importa si AwakeTab dice “Pantalla despierta” un segundo antes: ni una página web ni una extensión pueden impedirlo. Entre las páginas relacionadas hay una guía dedicada a la Mac con la tapa cerrada.

## Si minimizas o cambias de pestaña

El Wake Lock pertenece a la pestaña que ves. Minimizar la ventana o pasar a otra pestaña hace que se libere, y AwakeTab lo muestra con “En pausa — pestaña oculta”. Al volver, pide el bloqueo otra vez y la cuenta regresiva continúa desde donde se quedó, calculada con el reloj del sistema.

## Otros límites en Mac

- No mantiene tu estado en verde en Teams, Slack o Zoom. Esas apps se fijan en si usas el teclado o el mouse, algo que AwakeTab jamás simula.
- Si tu empresa impone un bloqueo de sesión por política, esa regla va por fuera del Wake Lock.
- Si vas a dejar la pantalla encendida toda la noche, conéctala a la corriente.

Si tu Mac se queda descargando algo pesado, la guía de [descargas](/es/for/descargas) resume qué esperar en cada sistema.
