---
title: "Pantalla encendida al descargar — AwakeTab"
description: "AwakeTab mantiene la pantalla encendida mientras descargas y, en Chrome o Edge, también evita la suspensión por inactividad. Cerrar la tapa sí la provoca."
h1: "Pantalla encendida mientras descargas: qué evita y qué no"
ogTitle: "Pantalla encendida al descargar"
intent: "evitar que la pc se suspenda mientras descarga"
secondaryQueries: ["mantener la computadora encendida mientras descarga", "que no se apague la pantalla al descargar", "evitar suspensión windows durante descarga", "laptop se suspende y se corta la descarga", "mantener pantalla encendida descarga larga"]
preset: pinf
mode: standard
locale: es
reviewed: false
translationOf: "downloads"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "¿Mi descarga sigue si cierro la tapa de la laptop?"
    a: "Normalmente no. Cerrar la tapa suspende el equipo (en Mac, salvo en modo de tapa cerrada con corriente y pantalla externa), y ni una página web ni una extensión pueden impedirlo. Si necesitas trabajar con la tapa cerrada, eso se configura en el sistema operativo o con una herramienta nativa."
  - q: "¿AwakeTab evita que Windows se suspenda o solo mantiene la pantalla?"
    a: "Lo que pide es la pantalla, y eso alcanza: en Chrome y Edge, mientras la pantalla sigue encendida, ni Windows ni macOS entran en suspensión por inactividad, según la documentación de Microsoft y Apple. Para una copia larga con la pantalla apagada, usa una utilidad nativa o el nivel Sistema de la extensión."
  - q: "¿Puedo minimizar el navegador mientras se descarga el archivo?"
    a: "No. Una ventana minimizada o una pestaña en segundo plano pierden el bloqueo, y el indicador muestra “En pausa — pestaña oculta” hasta que vuelves. Deja AwakeTab en una ventana a la vista, aunque sea pequeña."
  - q: "Si la laptop se suspendió de todos modos, ¿el temporizador miente?"
    a: "No. Cada cálculo usa la hora del sistema y las estadísticas solo suman mientras el bloqueo está activo, así que al despertar verás un número honesto en lugar de horas que no ocurrieron."
honestLimit: "Mantiene la pantalla encendida y, en Chrome y Edge sobre Windows o macOS, eso también evita la suspensión por inactividad mientras la pestaña está a la vista. Cerrar la tapa sí suspende el equipo."
related:
  - "/for/work-laptop"
  - "/on/windows-11"
  - "/on/macos"
  - "/for/night-clock"
  - "/on/chromebook"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Lo que de verdad resuelve AwakeTab en una descarga

Un juego de 80 GB, una copia de seguridad a la nube o un respaldo a un disco externo se cortan si la laptop se suspende a mitad del camino. AwakeTab mantiene la pantalla encendida desde una pestaña visible usando el Wake Lock del navegador. Mientras la pantalla siga encendida, Windows y macOS tampoco entran en suspensión por inactividad. Lo que no evita: cerrar la tapa suspende el equipo (en Mac, salvo en modo de tapa cerrada con corriente y pantalla externa).

## Qué pasa en Windows, macOS y Linux

Según la documentación de los navegadores, de Microsoft y de Apple (revisada el 26 de septiembre de 2026), Chrome y Edge le piden a Windows que mantenga la pantalla encendida, y en macOS sostienen una aserción que impide el reposo de la pantalla; mientras está activa, la Mac tampoco entra en reposo por inactividad. Si quieres comprobarlo: en Mac, `pmset -g assertions` en la Terminal; en Windows, `powercfg /requests` en una terminal de administrador. Más detalles en las guías de [macOS](/es/on/macos) y [Windows 11](/es/on/windows-11).

En Linux, Chrome y Firefox le piden al escritorio que no se suspenda; que lo respete depende del escritorio que uses.

## Cómo dejarlo corriendo sin sorpresas

1. Conecta la laptop a la corriente si la descarga es larga. El ahorro de energía de Windows (“Energy saver”, antes Ahorro de batería) no rechaza el bloqueo, pero puede atenuar la pantalla.
2. Abre AwakeTab en una ventana propia y déjala a la vista, al lado del gestor de descargas o en un segundo monitor. Puede ser pequeña, pero no minimizada.
3. Elige “∞” para que no se detenga sola; cuando el indicador muestre “Pantalla despierta”, ya puedes dejarla.
4. No cierres la tapa. Si necesitas la laptop cerrada, configura el sistema o usa una herramienta nativa.

## Por qué el indicador importa más que el reloj

Muchas páginas reproducen un video en bucle y esperan que la pantalla no se apague. AwakeTab solo arranca el temporizador cuando el navegador confirma el bloqueo. Si la pestaña se oculta, verás “En pausa — pestaña oculta” en lugar de una cuenta regresiva que sigue avanzando sin respaldo. Si el equipo llegó a suspenderse, el tiempo se recalcula con el reloj del sistema, así que no te va a mostrar horas falsas.

## Navegadores con bloqueo nativo en escritorio

Chrome 84, Edge 84, Opera 70 y Firefox 126 en adelante tienen Wake Lock nativo en Windows, macOS y Linux, y Safari desde la 16.4 en Mac. En un Firefox anterior, AwakeTab ofrece el video de respaldo después de un clic, que consume algo más de energía.

## Límites que conviene tener claros

- Hay apagados que no vienen del tiempo de espera de la pantalla: una política corporativa, retirar la tarjeta inteligente o un monitor con su propio ahorro de energía. Un Wake Lock no los toca.
- AwakeTab no mueve el mouse ni presiona teclas. Tu estado en Teams o Slack seguirá cambiando a ausente mientras esperas.
- Si lo que necesitas es mantener el equipo activo con la pantalla apagada, una utilidad nativa es la herramienta correcta.
