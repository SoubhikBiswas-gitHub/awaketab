---
title: "Evita que la pantalla de tu Mac se apague — AwakeTab"
description: "Safari 16.4+, Chrome 84+ y Firefox 126+ mantienen encendida la pantalla de tu Mac desde una pestaña visible. Cerrar la tapa sí la pone en reposo."
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
crumb: "macOS"
lead: "Safari 16.4+, Chrome 84+ y Firefox 126+ pueden mantener encendida la pantalla de tu Mac desde una pestaña visible, sin instalar ninguna app. Inicia la sesión de una hora que trae esta página, o cualquier otra duración; estará activa cuando el indicador marque “Pantalla despierta”. Mientras la pantalla siga encendida, la Mac tampoco entra en reposo por inactividad. Ten presentes dos límites: cerrar la tapa la pone en reposo, y minimizar la ventana o cambiar de pestaña libera el bloqueo."
facts:
  - label: "Safari"
    value: "16.4 o posterior"
  - label: "Chrome"
    value: "84 o posterior"
  - label: "Firefox"
    value: "126 o posterior"
toc:
  pantalla-encendida-no-es-lo-mismo-que-mac-despierta: "Pantalla encendida y Mac despierta"
steps:
  - title: "Abre AwakeTab en Safari, Chrome o Firefox y elige la duración"
    text: "Conecta la MacBook al cargador si la sesión va a ser larga."
    shot: "AwakeTab en Safari en una Mac con la duración elegida"
  - title: "Revisa el indicador"
    text: "Debe decir “Pantalla despierta”. Si dice “Bloqueado — aquí está la solución”, el motivo aparece justo debajo."
    shot: "el indicador de AwakeTab con la sesión activa"
  - title: "Deja la ventana a la vista"
    text: "Puede estar en un costado de la pantalla o en un monitor externo, pero no minimizada."
    shot: "una ventana pequeña de AwakeTab junto a otra app"
faq:
  - q: "¿AwakeTab evita que la Mac entre en reposo?"
    a: "Sí, mientras la pantalla siga encendida. Chrome sostiene una aserción que impide el reposo de la pantalla y, según la documentación de Apple, la Mac tampoco entra en reposo por inactividad mientras está activa. Si necesitas el equipo activo con la pantalla apagada, usa caffeinate u otra utilidad nativa."
  - q: "¿Funciona con la tapa de la MacBook cerrada?"
    a: "Normalmente no. Cerrar la tapa pone la Mac en reposo, salvo en modo de tapa cerrada (con corriente y una pantalla externa), y ninguna página web puede evitarlo. AwakeTab solo actúa sobre el tiempo de apagado de la pantalla mientras la pestaña está visible."
  - q: "¿Qué navegador conviene usar en Mac?"
    a: "Cualquiera de estos tiene Wake Lock nativo: Safari 16.4+, Chrome 84+, Firefox 126+, además de Edge 84+ y Opera 70+. Con un Firefox anterior, AwakeTab usa un video de respaldo tras un clic, que gasta más energía."
  - q: "¿Qué pasa si minimizo la ventana o cambio a otra pestaña?"
    a: "El navegador libera el bloqueo y el indicador muestra “En pausa — pestaña oculta”; la cuenta regresiva se detiene. Vuelve a la pestaña y espera a “Pantalla despierta” antes de alejarte."
honestLimit: "La pantalla sigue encendida y, mientras lo está, la Mac no entra en reposo por inactividad; cerrar la tapa sí la pone en reposo (salvo en modo de tapa cerrada con pantalla externa) y ocultar la pestaña libera el bloqueo."
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

## Cómo dejarlo listo

::steps

Los ajustes del sistema que controlan cuándo se apaga la pantalla están en Ajustes del Sistema → Pantalla bloqueada y en Energía (o Batería en una MacBook). AwakeTab no los cambia: solo evita que ese tiempo corra mientras la pestaña sigue al frente.

::ad

## Pantalla encendida no es lo mismo que Mac despierta

macOS separa dos cosas: el reposo de la pantalla y el reposo del sistema. Un Wake Lock del navegador está diseñado para la primera, pero arrastra la segunda: Chrome sostiene una aserción que impide el reposo de la pantalla y, según la documentación de Apple (IOKit, revisada el 26 de septiembre de 2026), mientras está activa la Mac no entra en reposo por inactividad. Puedes comprobarlo con `pmset -g assertions` en la Terminal. Pero si tu objetivo es que termine una copia larga o una exportación con la pantalla apagada, AwakeTab no es la herramienta: necesitas una utilidad nativa, como el comando caffeinate que trae macOS. Comparamos ese enfoque con una pestaña en [Caffeine vs. AwakeTab](/es/vs/caffeine).

## La tapa cerrada

Una MacBook con la tapa cerrada entra en reposo, salvo en modo de tapa cerrada (con corriente y una pantalla externa conectada). No importa si AwakeTab dice “Pantalla despierta” un segundo antes: ni una página web ni una extensión pueden impedirlo. Entre las páginas relacionadas hay una guía dedicada a la Mac con la tapa cerrada.

## Si minimizas o cambias de pestaña

El Wake Lock pertenece a la pestaña que ves. Minimizar la ventana o pasar a otra pestaña hace que se libere, y AwakeTab lo muestra con “En pausa — pestaña oculta”. Al volver, pide el bloqueo otra vez y la cuenta regresiva continúa desde donde se quedó, calculada con el reloj del sistema.

## Otros límites en Mac

- No mantiene tu estado en verde en Teams, Slack o Zoom. Esas apps se fijan en si usas el teclado o el mouse, algo que AwakeTab jamás simula.
- Si tu empresa impone un bloqueo de sesión por política, esa regla va por fuera del Wake Lock.
- Si vas a dejar la pantalla encendida toda la noche, conéctala a la corriente.

Si tu Mac se queda descargando algo pesado, la guía de [descargas](/es/for/descargas) resume qué esperar en cada sistema.
