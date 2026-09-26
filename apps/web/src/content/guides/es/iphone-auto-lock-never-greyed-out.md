---
title: "Bloqueo automático en gris en iPhone — AwakeTab"
description: "¿Nunca aparece en gris en Bloqueo automático? Es el Modo de bajo consumo. Desactívalo: mientras siga activo, ni AwakeTab evita el bloqueo a los 30 s."
h1: "¿No puedes elegir Nunca en Bloqueo automático del iPhone?"
ogTitle: "Bloqueo automático en gris en iPhone"
intent: "bloqueo automático nunca en gris iphone"
secondaryQueries: ["no me deja poner bloqueo automático en nunca", "bloqueo automático no se puede cambiar iphone", "iphone bloqueo automático 30 segundos", "modo de bajo consumo bloqueo automático", "por qué no puedo cambiar el bloqueo automático"]
preset: p30
mode: standard
locale: es
reviewed: false
translationOf: "iphone-auto-lock-never-greyed-out"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "¿Por qué la opción Nunca está en gris en Bloqueo automático?"
    a: "Porque el Modo de bajo consumo está activado, ya sea porque lo encendiste tú o porque la batería bajó lo suficiente. En ese modo iOS fija el Bloqueo automático en 30 segundos y no deja elegir otro valor hasta que lo desactives."
  - q: "¿AwakeTab puede saltarse el Modo de bajo consumo?"
    a: "No. El Modo de bajo consumo tiene prioridad sobre Safari y sobre cualquier página web, incluida AwakeTab. Mientras esté activo, la pantalla se bloqueará a los 30 segundos. Apágalo y después inicia la sesión."
  - q: "Ya apagué el Modo de bajo consumo, ¿la pantalla sigue encendida si cambio de app?"
    a: "No. Safari solo mantiene el Wake Lock mientras la pestaña está al frente. Si abres otra app o bajas al inicio, el bloqueo se libera y el indicador muestra “En pausa — pestaña oculta” hasta que regreses."
  - q: "¿Qué versión necesito para usar AwakeTab en lugar de cambiar el ajuste?"
    a: "Safari 16.4 o posterior. Si agregaste AwakeTab a la pantalla de inicio, esa app necesita iOS 18.4 o posterior; con versiones anteriores, úsalo en Safari."
honestLimit: "El Modo de bajo consumo pone Nunca en gris y fuerza 30 segundos; mientras siga activo, ni siquiera AwakeTab puede evitar el bloqueo."
related:
  - "/on/iphone-safari"
  - "/learn/low-power-mode-and-wake-locks"
  - "/for/cooking"
  - "/for/downloads"
  - "/for/baby-monitor"
author: soubhik
published: 2026-09-26
---

## Por qué Nunca está en gris

Entras a Ajustes → Pantalla y brillo → Bloqueo automático y la opción Nunca no se deja tocar. En casi todos los casos la causa es el Modo de bajo consumo: se activa cuando tú lo enciendes o cuando la batería ya bajó bastante, y mientras está encendido iOS fija el bloqueo en 30 segundos. La solución es desactivarlo primero. Después, Safari 16.4 o posterior puede mantener la pantalla encendida con un Wake Lock hasta que salgas de la pestaña.

## Cómo desbloquear la opción en dos minutos

1. Abre Ajustes → Batería y apaga Modo de bajo consumo. También puedes hacerlo desde el Centro de control si tienes el botón de la batería.
2. Fíjate en el ícono de la batería: si ya no está amarillo, el modo quedó apagado.
3. Regresa a Ajustes → Pantalla y brillo → Bloqueo automático. Nunca debería aparecer disponible otra vez.
4. Si prefieres no dejar el iPhone en Nunca todo el día, conserva tu ajuste normal y usa AwakeTab solo cuando lo necesites.

Si el Modo de bajo consumo se vuelve a encender solo, conecta el iPhone al cargador: con poca batería, iOS te lo va a sugerir de nuevo.

## Por qué una pestaña es mejor que dejarlo en Nunca

Poner Bloqueo automático en Nunca sirve, pero es fácil olvidarlo y encontrar el iPhone con la pantalla encendida y sin batería horas después. Con AwakeTab el cambio es temporal: eliges 30 minutos (la opción que trae esta página), 1 hora o “∞”, y cuando termina o cierras la pestaña, tu ajuste de siempre vuelve a mandar. El indicador te muestra “Pantalla despierta” solo cuando Safari realmente concedió el bloqueo.

## Lo que el Modo de bajo consumo le hace a AwakeTab

Con el modo encendido, iOS ignora la solicitud de Safari y el iPhone se bloquea a los 30 segundos de todos modos. AwakeTab no lo disimula: verás “Bloqueado — aquí está la solución” y el mensaje te dice que lo desactives en Ajustes → Batería. Tocar Iniciar otra vez sin apagarlo no cambia nada. Lo explicamos con más detalle, junto con los otros límites en Safari, en la guía de [iPhone con Safari](/es/on/iphone-safari).

## Otros casos que conviene conocer

- **Cambiar de app.** Aunque el Modo de bajo consumo esté apagado, el Wake Lock solo vive mientras la pestaña está al frente. Salir de Safari lo libera.
- **iOS antiguo.** Antes de Safari 16.4 no existía el Wake Lock. AwakeTab ofrece un video de respaldo que se activa con un toque y consume más batería.
- **App en la pantalla de inicio.** Instalado como app web, AwakeTab necesita iOS 18.4 o posterior para el bloqueo nativo.

## Cuándo sí vale la pena dejarlo en Nunca

Si usas el iPhone como pantalla fija, siempre enchufado, puede tener sentido cambiar el ajuste del sistema. Para una receta, un ensayo o una [descarga](/es/for/descargas) que necesitas vigilar un rato, una sesión temporal es más cómoda y no te deja sorpresas en la batería.
