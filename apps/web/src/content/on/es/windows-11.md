---
title: "Mantener la pantalla encendida en Windows 11 y 10 — AwakeTab"
description: "En Windows 11 y 10, Chrome y Edge 84+ mantienen la pantalla encendida en una pestaña visible. Minimizar pausa el bloqueo; cerrar la tapa suspende."
h1: "Evita que la pantalla se apague en Windows 11 y 10"
ogTitle: "Pantalla encendida en Windows 11"
intent: "mantener pantalla encendida windows 11"
secondaryQueries: ["evitar que la pantalla se apague windows 11", "que no se apague la pantalla windows 11", "pantalla siempre encendida windows 11", "windows 11 apaga la pantalla muy rápido", "mantener pantalla encendida sin instalar nada"]
preset: p60
mode: standard
locale: es
reviewed: false
translationOf: "windows-11"
lastVerified: 2026-09-09
browsers: ["chrome", "edge"]
os: ["windows"]
crumb: "Windows 11"
lead: "En Windows 11, Chrome 84+ y Edge 84+ conceden un Wake Lock nativo a cualquier pestaña visible. Abre AwakeTab, deja la sesión de 1 hora que trae esta página o elige otra duración, y espera a que el indicador diga “Pantalla despierta”. Desde ese momento, Windows no atenúa ni apaga la pantalla mientras la pestaña siga a la vista, y tampoco entra en suspensión por inactividad. Los mismos pasos sirven en Windows 10. Tres cosas quedan fuera de su alcance: minimizar la ventana u ocultar la pestaña libera el bloqueo, cerrar la tapa suspende el equipo y Modern Standby es un tema aparte que depende del firmware."
facts:
  - label: "Chrome y Edge"
    value: "84 o posterior"
  - label: "Firefox"
    value: "126 o posterior"
  - label: "Opera"
    value: "70 o posterior"
faq:
  - q: "¿Funciona igual en Edge que en Chrome?"
    a: "Sí. Los dos tienen Wake Lock nativo desde la versión 84 en Windows. El modo de eficiencia de Edge no rechaza el bloqueo, porque Edge usa el mismo código de Chromium; si el indicador no llega a “Pantalla despierta”, el motivo aparece debajo."
  - q: "¿Por qué la pantalla se apaga cuando la laptop está con batería?"
    a: "El ahorro de energía de Windows (“Energy saver”, antes Ahorro de batería) no rechaza el bloqueo, pero puede atenuar la pantalla o acortar los tiempos. Si la pantalla se apaga con el indicador en “Pantalla despierta”, revisa si la pestaña quedó oculta o si una política de la empresa bloquea la sesión."
  - q: "¿Sigue funcionando si minimizo el navegador o pongo otra ventana encima?"
    a: "Si minimizas la ventana o cambias de pestaña, el navegador libera el bloqueo y verás “En pausa — pestaña oculta”. Deja AwakeTab en una ventana a la vista, aunque sea pequeña o en un segundo monitor."
  - q: "¿AwakeTab puede evitar que Windows se suspenda al cerrar la tapa?"
    a: "No. Al cerrar la tapa, Windows hace lo que indique su acción de la tapa (normalmente, suspender), y Modern Standby tiene su propio comportamiento a nivel de firmware. Eso se configura en Windows, no desde una pestaña del navegador."
honestLimit: "Una pestaña oculta o una ventana minimizada liberan el bloqueo; Modern Standby tiene sus propias peculiaridades; cerrar la tapa suspende el equipo salvo que cambies esa acción en Windows."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/lock-screen-vs-sleep"
  - "/learn/browser-support-matrix"
  - "/for/downloads"
  - "/for/presentations"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Dónde dejar la ventana

- **Al lado de tu trabajo.** Con Win + las flechas puedes dejar AwakeTab en una esquina mientras usas otra app.
- **En un segundo monitor.** El bloqueo cubre el tiempo de apagado de pantalla del sistema; lo importante es que la pestaña siga visible.
- **Ventana flotante.** En Chrome, Edge y Firefox 151+, el botón “Ventana flotante” deja un temporizador pequeño por encima de todo.

Si minimizas el navegador o cambias de pestaña, el indicador pasa a “En pausa — pestaña oculta” y la cuenta regresiva se detiene hasta que vuelves.

::ad

## Otros navegadores en Windows

Según la documentación de los navegadores (revisada el 26 de septiembre de 2026), Firefox 126+ y Opera 70+ también tienen Wake Lock nativo en Windows. Con un Firefox más antiguo, AwakeTab ofrece un video de respaldo que requiere un clic y consume más energía.

## Sin tocar la configuración de energía

Muchas guías te mandan a Configuración → Sistema → Energía y batería para subir el tiempo de apagado de la pantalla. Funciona, pero se te olvida regresarlo y la laptop se queda encendida toda la noche. AwakeTab es temporal: mientras la pestaña está al frente la pantalla no se apaga, y cuando detienes la sesión o se acaba el tiempo, Windows vuelve a tu configuración de siempre.

Si tu pantalla se apaga al minuto aunque ya cambiaste ese valor, la guía sobre ese problema está entre las páginas relacionadas de abajo.

## Ahorro de energía y modo de eficiencia

En Windows 11 24H2, el ahorro de batería pasó a llamarse ahorro de energía (“Energy saver”). Ni ese modo ni el modo de eficiencia de Edge hacen que el navegador rechace el Wake Lock: según el código fuente de Chromium (revisado el 26 de septiembre de 2026), Chrome y Edge no los revisan. Lo que sí puede hacer el ahorro de energía es atenuar la pantalla o acortar los tiempos. Si ves “Bloqueado — aquí está la solución”, la causa real aparece debajo, por ejemplo una pestaña oculta o una página dentro de un marco sin permiso. Intentarlo otra vez sin cambiar nada repite el mismo rechazo.

## Modern Standby y la tapa cerrada

Muchas laptops con Windows 11 usan Modern Standby, un estado de reposo que maneja el firmware y tiene sus propias rarezas. Un Wake Lock del navegador no controla ese nivel. Lo mismo con la tapa: al cerrarla, el equipo hace lo que indique la acción de la tapa en Windows (normalmente, suspenderse), sin importar lo que diga cualquier página web o extensión.

## Lo que no cambia

AwakeTab no mueve el mouse ni presiona teclas, así que no te mantiene “disponible” en Teams. Tampoco pasa por encima de una política de bloqueo de la empresa ni del retiro de una tarjeta inteligente. Si necesitas que una [descarga larga](/es/for/descargas) termine sin cortes, esa guía explica qué esperar de la suspensión del sistema.
