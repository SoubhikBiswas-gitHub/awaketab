---
title: "Mantener la pantalla encendida en Windows 11 — AwakeTab"
description: "En Windows 11, Chrome y Edge 84+ mantienen la pantalla encendida en una pestaña visible. El ahorro de batería lo rechaza y la tapa cerrada suspende."
h1: "Evita que la pantalla se apague en Windows 11"
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
faq:
  - q: "¿Funciona igual en Edge que en Chrome?"
    a: "Sí. Los dos tienen Wake Lock nativo desde la versión 84 en Windows. En Edge, el modo de eficiencia puede afectar el bloqueo; si el indicador no llega a “Pantalla despierta”, revisa esa opción o conecta el cargador."
  - q: "¿Por qué la pantalla se apaga cuando la laptop está con batería?"
    a: "El ahorro de batería de Windows puede rechazar la solicitud. AwakeTab lo muestra como “Bloqueado — aquí está la solución” en vez de fingir que funciona. Desactiva el ahorro o conecta el equipo y toca Iniciar de nuevo."
  - q: "¿Sigue funcionando si minimizo el navegador o pongo otra ventana encima?"
    a: "Si minimizas la ventana o cambias de pestaña, el navegador libera el bloqueo y verás “En pausa — pestaña oculta”. Deja AwakeTab en una ventana a la vista, aunque sea pequeña o en un segundo monitor."
  - q: "¿AwakeTab puede evitar que Windows se suspenda al cerrar la tapa?"
    a: "No. Cerrar la tapa siempre suspende el equipo, y Modern Standby tiene su propio comportamiento a nivel de firmware. Eso se configura en Windows, no desde una pestaña del navegador."
honestLimit: "El ahorro de batería rechaza el bloqueo; Modern Standby tiene sus propias peculiaridades; cerrar la tapa suspende el equipo."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/modern-standby"
  - "/on/windows-10"
  - "/for/downloads"
  - "/for/presentations"
author: soubhik
published: 2026-09-26
---

## La respuesta para Windows 11

En Windows 11, Chrome 84+ y Edge 84+ conceden un Wake Lock nativo a cualquier pestaña visible. Abre AwakeTab, deja la sesión de 1 hora que trae esta página o elige otra duración, y espera a que el indicador diga “Pantalla despierta”. Desde ese momento, Windows no atenúa ni apaga la pantalla mientras la pestaña siga a la vista. Tres cosas quedan fuera de su alcance: el ahorro de batería puede rechazar la solicitud, cerrar la tapa suspende el equipo y Modern Standby es un tema aparte que depende del firmware.

## Sin tocar la configuración de energía

Muchas guías te mandan a Configuración → Sistema → Energía y batería para subir el tiempo de apagado de la pantalla. Funciona, pero se te olvida regresarlo y la laptop se queda encendida toda la noche. AwakeTab es temporal: mientras la pestaña está al frente la pantalla no se apaga, y cuando detienes la sesión o se acaba el tiempo, Windows vuelve a tu configuración de siempre.

Si tu pantalla se apaga al minuto aunque ya cambiaste ese valor, la guía sobre ese problema está entre las páginas relacionadas de abajo.

## Ahorro de batería y modo de eficiencia

Con el ahorro de batería activado, Windows puede rechazar el Wake Lock. AwakeTab lo dice tal cual con “Bloqueado — aquí está la solución” y la causa. Intentarlo otra vez sin cambiar nada repite el mismo rechazo: primero desactiva el ahorro o conecta el cargador. Y si usas Edge, revisa su modo de eficiencia, que también puede interferir.

## Modern Standby y la tapa cerrada

Muchas laptops con Windows 11 usan Modern Standby, un estado de reposo que maneja el firmware y tiene sus propias rarezas. Un Wake Lock del navegador no controla ese nivel. Lo mismo con la tapa: al cerrarla, el equipo se suspende siempre, sin importar lo que diga cualquier página web o extensión.

## Dónde dejar la ventana

- **Al lado de tu trabajo.** Con Win + las flechas puedes dejar AwakeTab en una esquina mientras usas otra app.
- **En un segundo monitor.** El bloqueo cubre el tiempo de apagado de pantalla del sistema; lo importante es que la pestaña siga visible.
- **Ventana flotante.** En Chrome y Edge, el botón “Ventana flotante” deja un temporizador pequeño por encima de todo.

Si minimizas el navegador o cambias de pestaña, el indicador pasa a “En pausa — pestaña oculta” y la cuenta regresiva se detiene hasta que vuelves.

## Otros navegadores en Windows

La matriz que verificamos el 9 de septiembre de 2026 incluye además Firefox 126+ y Opera 70+ con Wake Lock nativo en Windows. Con un Firefox más antiguo, AwakeTab ofrece un video de respaldo que requiere un clic y consume más energía.

## Lo que no cambia

AwakeTab no mueve el mouse ni presiona teclas, así que no te mantiene “disponible” en Teams. Tampoco pasa por encima de una política de bloqueo de la empresa ni del retiro de una tarjeta inteligente. Si necesitas que una [descarga larga](/es/for/descargas) termine sin cortes, esa guía explica qué esperar de la suspensión del sistema.
