---
title: "iPhone: mantener la pantalla encendida en Safari — AwakeTab"
description: "Safari 16.4+ en iPhone mantiene la pantalla encendida con Wake Lock nativo. El Modo de bajo consumo fuerza 30 segundos y salir de Safari libera el bloqueo."
h1: "Mantén encendida la pantalla del iPhone en Safari"
ogTitle: "Pantalla del iPhone encendida en Safari"
intent: "mantener pantalla encendida iphone safari"
secondaryQueries: ["que no se apague la pantalla del iphone", "evitar que el iphone se bloquee safari", "pantalla siempre encendida iphone", "iphone pantalla se apaga sola safari", "wake lock safari iphone"]
preset: p30
mode: standard
locale: es
reviewed: false
translationOf: "iphone-safari"
lastVerified: 2026-09-09
browsers: ["safari"]
os: ["ios"]
lead: "Desde Safari 16.4, el iPhone puede mantener la pantalla encendida con el Wake Lock nativo del navegador, sin instalar nada. Abre AwakeTab en Safari, elige una duración (esta página viene con 30 minutos) y comprueba que se lea “Pantalla despierta”. Hay dos cosas que ninguna página web puede cambiar: el Modo de bajo consumo pone en gris la opción Nunca y fuerza un bloqueo corto, y salir de Safari libera el bloqueo."
crumb: "iPhone con Safari"
facts:
  - label: "Safari"
    value: "16.4 o posterior"
  - label: "App en la pantalla de inicio"
    value: "iOS 18.4 o posterior"
toc:
  iphone-con-versiones-anteriores-de-ios: "Versiones anteriores de iOS"
  qué-hace-el-modo-de-bajo-consumo: "Modo de bajo consumo"
steps:
  - title: "Revisa la versión de iOS"
    path: "Ajustes › General › Información"
    text: "Revisa que tu iPhone tenga iOS 16.4 o posterior en Ajustes → General → Información."
    shot: "la pantalla Información con la versión de iOS"
  - title: "Fíjate si el Modo de bajo consumo está activo"
    path: "Ajustes › Batería"
    text: "El ícono de la batería se ve amarillo. Ese modo fija el Bloqueo automático en 30 segundos; si con AwakeTab en marcha la pantalla se bloquea igual, apágalo en Ajustes → Batería."
    shot: "el ícono de la batería en amarillo"
  - title: "Abre AwakeTab en Safari y toca la duración que necesitas"
    text: "Esta página viene con 30 minutos."
    shot: "AwakeTab en Safari con las duraciones"
  - title: "Espera a ver “Pantalla despierta”"
    text: "Si aparece “Bloqueado — aquí está la solución”, lee el mensaje: en Safari suele significar que hace falta tocar la pantalla primero o que la pestaña no estaba al frente."
    shot: "el indicador con “Pantalla despierta”"
  - title: "Deja Safari al frente"
    text: "La pestaña de AwakeTab tiene que quedar visible."
    shot: "Safari al frente con la pestaña de AwakeTab"
matrix:
  label: "Tabla de compatibilidad"
  cols: ["Navegador", "Mecanismo", "Nota"]
  rows:
    - what: "Safari 16.4 o posterior"
      result: works
      label: "Nativo"
      text: "Necesita un toque primero. El Modo de bajo consumo fija el Bloqueo automático del iPhone en 30 s. La pestaña debe seguir visible."
    - what: "App en la pantalla de inicio de iOS"
      result: works
      label: "Nativo"
      text: "Si agregaste AwakeTab a la pantalla de inicio, el Wake Lock dentro de esa app necesita iOS 18.4 o posterior. Con una versión anterior, úsalo desde Safari."
    - what: "iOS anterior a 16.4"
      result: fallback
      label: "Respaldo"
      text: "Requiere un toque o clic y consume más energía que el bloqueo nativo."
rows:
  limits:
    - title: "El iPhone no te mantiene como “disponible” en Teams o Slack."
      text: "Esas apps siguen la actividad del teclado y el mouse, no la pantalla."
    - title: "Una pantalla encendida gasta batería."
      text: "Para sesiones largas, deja el iPhone conectado."
    - title: "No uses un iPhone sin supervisión como monitor de seguridad."
faq:
  - q: "¿Qué versión de iOS necesito para que funcione en Safari?"
    a: "Safari 16.4 o posterior, que llega con iOS 16.4. En versiones anteriores AwakeTab muestra “Toca para usar el respaldo”: con un toque inicia un video silencioso que mantiene la pantalla encendida, aunque gasta más batería que el Wake Lock nativo."
  - q: "¿Por qué el iPhone se bloquea a los 30 segundos aunque AwakeTab está activo?"
    a: "El Modo de bajo consumo fija el Bloqueo automático en 30 segundos y pone en gris la opción Nunca. Safari no rechaza el Wake Lock por ese modo, pero aún no registramos una prueba en un dispositivo que confirme si la pantalla sigue encendida con él. Si se bloquea igual, desactívalo en Ajustes → Batería."
  - q: "¿Sigue encendida si cambio a otra app o bloqueo el iPhone?"
    a: "No. Al salir de Safari o cambiar de pestaña, iOS libera el bloqueo y el indicador pasa a “En pausa — pestaña oculta”. Si presionas el botón lateral, el iPhone se bloquea como siempre. Vuelve a Safari para que AwakeTab lo pida de nuevo."
  - q: "¿Puedo usarlo como app desde la pantalla de inicio?"
    a: "Sí, pero el Wake Lock en apps web de la pantalla de inicio necesita iOS 18.4 o posterior. Con una versión anterior, usa AwakeTab directamente en Safari."
honestLimit: "Solo en Safari 16.4 o posterior; el Modo de bajo consumo fuerza un Bloqueo automático de 30 segundos; cambiar de app libera el bloqueo."
related:
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/on/ios-home-screen"
  - "/on/ipad"
  - "/for/cooking"
  - "/vs/powertoys-awake"
author: soubhik
published: 2026-09-26
updated: 2026-09-28
---

## Paso a paso en Safari

::steps

::ad

## iPhone con versiones anteriores de iOS

En iOS anterior a 16.4 no hay Wake Lock en Safari. AwakeTab te ofrece “Toca para usar el respaldo”: un video silencioso diminuto que mantiene la pantalla encendida mientras la pestaña está visible. Necesita que toques la pantalla para arrancar y consume más batería. El indicador lo muestra como “Despierta con video de respaldo”, nunca como si fuera el bloqueo nativo.

::matrix

## Qué hace el Modo de bajo consumo

Con el Modo de bajo consumo encendido, iOS fija el Bloqueo automático en 30 segundos y deshabilita la opción Nunca (en Ajustes, sección Pantalla y brillo), según el soporte de Apple. Safari no tiene ninguna regla que rechace el Wake Lock por ese modo, pero todavía no registramos una prueba en un dispositivo que confirme si la pantalla sigue encendida con él activo; el resultado aparecerá en nuestra página sobre cómo probamos. Explicamos los detalles en [Bloqueo automático en gris en iPhone](/es/guides/iphone-bloqueo-automatico-nunca-gris).

## Qué pasa al salir de Safari

iOS solo permite el Wake Lock a la pestaña que tienes enfrente. Si abres WhatsApp, cambias a otra pestaña o bajas al inicio, el navegador suelta el bloqueo en ese momento. AwakeTab no lo esconde: el indicador cambia a “En pausa — pestaña oculta” y el conteo se congela. Al volver a Safari, la sesión se reanuda y el bloqueo se solicita de nuevo. Si presionas el botón lateral, el iPhone se bloquea igual que siempre.

## Otros límites en iPhone

::rows limits

Si usas el iPhone en la cocina, la guía de [cocina](/es/for/cocinar) explica cómo dejar la receta y AwakeTab a la vista.
