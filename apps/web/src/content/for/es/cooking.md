---
title: "Pantalla encendida mientras cocinas — AwakeTab"
description: "Que no se apague la pantalla mientras sigues una receta: AwakeTab usa el Wake Lock del navegador. Si abres otra app en el teléfono, se libera."
h1: "Mantén la pantalla encendida mientras cocinas"
ogTitle: "Pantalla encendida mientras cocinas"
intent: "mantener la pantalla encendida mientras cocino"
secondaryQueries: ["que no se apague la pantalla al cocinar", "pantalla siempre encendida para recetas", "evitar que el celular se apague mientras cocino", "mantener pantalla encendida receta tablet", "modo cocina pantalla encendida"]
preset: pinf
mode: cook
locale: es
reviewed: false
translationOf: "cooking"
lastVerified: 2026-09-09
browsers: []
os: []
lead: "Con las manos llenas de masa no vas a tocar el teléfono cada medio minuto. Abre AwakeTab en el navegador, deja la pestaña a la vista y la pantalla no se apagará mientras sigues la receta. La herramienta de esta página ya viene en modo Cocina y con la duración “∞”, así que se mantiene hasta que tú la detengas. El indicador solo muestra “Pantalla despierta” cuando el navegador confirma el Wake Lock (el permiso que impide que la pantalla se atenúe y se bloquee). Si abres otra app en el teléfono, el bloqueo se libera hasta que regreses."
crumb: "Cocina"
toc:
  prepara-el-teléfono-o-la-tablet-antes-de-empezar: "Prepáralo"
  cuando-sales-de-la-pestaña-a-media-receta: "Si sales de la pestaña"
steps:
  - title: "Apoya el dispositivo donde puedas leerlo sin tocarlo."
    text: "Si la receta es larga, conéctalo al cargador."
  - title: "Deja AwakeTab visible."
    text: "En una tablet puede ir junto a la receta: con apps en ventanas en iPadOS 26, en Split View en iPadOS 18 o anterior, o en pantalla dividida en Android. En un iPhone solo se ve una app a la vez: úsalo como única pestaña, por ejemplo con un recetario de papel."
  - title: "Toca para empezar y confirma que el indicador cambió a “Pantalla despierta”."
    text: "Si en cambio ves “Despierta con video de respaldo”, tu navegador no tiene Wake Lock nativo y AwakeTab usa un video silencioso, que gasta más batería."
figures:
  - frame: phone
    label: "Captura del teléfono"
    alt: "AwakeTab en modo Cocina en un iPhone"
    caption: "El modo Cocina en un iPhone."
  - frame: desktop
    label: "Captura de la tablet"
    alt: "la receta y AwakeTab lado a lado en una tablet"
    caption: "La receta y AwakeTab lado a lado en una tablet."
pills:
  - state: lost
    text: "El temporizador se detiene. Cuando regresas, espera a que vuelva a decir “Pantalla despierta” antes de dejar el teléfono en la barra."
  - state: denied
    text: "El motivo aparece al lado: casi siempre la pestaña no estaba a la vista o Safari necesita que toques la pantalla primero (en Firefox, también la batería al 5 % o menos sin cargar)."
checklist:
  - "Una pantalla encendida gasta energía. En sesiones largas, mejor enchufado."
  - "En iPhone, el Modo de bajo consumo fija el Bloqueo automático en 30 segundos. Safari no rechaza el Wake Lock por ese modo, pero aún no registramos una prueba en un dispositivo que lo confirme."
  - "En Android, el Ahorro de batería puede acortar el tiempo de espera o atenuar la pantalla; Chrome no rechaza el bloqueo por eso."
  - "Para revisar el tiempo de pantalla del sistema, en iPhone es Bloqueo automático, dentro de Pantalla y brillo."
  - "En Android busca Tiempo de espera de la pantalla en Ajustes → Pantalla (en un Pixel, Pantalla y función táctil)."
  - "Algunos fabricantes de Android además tienen listas de “apps en suspensión” que pueden cerrar el navegador cuando lo dejas en segundo plano."
faq:
  - q: "¿La pantalla sigue encendida si contesto un WhatsApp en medio de la receta?"
    a: "No. Al cambiar de app o de pestaña, el navegador libera el bloqueo y el indicador pasa a “En pausa — pestaña oculta”. Vuelve a AwakeTab y espera a que diga “Pantalla despierta” o “Despierta con video de respaldo” antes de seguir cocinando."
  - q: "¿Puedo ver la receta en otra app al mismo tiempo?"
    a: "En una tablet, sí: pon la receta y AwakeTab lado a lado (apps en ventanas en iPadOS 26, Split View en iPadOS 18 o anterior, pantalla dividida en Android). En un iPhone solo hay una app al frente, así que AwakeTab no puede mantener despierta una receta abierta en otra app. Si la receta tapa por completo la pestaña, el bloqueo se libera."
  - q: "¿Por qué el iPhone se bloquea a los 30 segundos aunque inicié AwakeTab?"
    a: "Probablemente porque el Modo de bajo consumo está activado: en ese modo iOS fija el Bloqueo automático en 30 segundos. Safari no rechaza el Wake Lock por ese modo, pero aún no registramos una prueba en un dispositivo que confirme si la pantalla sigue encendida con él. Si se bloquea igual, desactívalo en Ajustes → Batería para recuperar tu tiempo normal."
  - q: "¿En qué navegadores funciona para cocinar?"
    a: "Con bloqueo nativo: Safari 16.4+, Chrome 84+, Samsung Internet 14+, Edge 84+ y Firefox 126+, según la matriz del 9 de septiembre de 2026. Un Firefox más antiguo puede usar el video de respaldo después de que toques la pantalla."
honestLimit: "Funciona mientras la pestaña de AwakeTab está en pantalla; si abres otra app en el teléfono, el bloqueo se libera hasta que regreses."
related:
  - "/for/reading"
  - "/for/workouts"
  - "/on/android-chrome"
  - "/on/iphone-safari"
author: soubhik
published: 2026-09-26
updated: 2026-09-28
---

## Prepara el teléfono o la tablet antes de empezar

::steps

::figures

::ad

## Cuando sales de la pestaña a media receta

Un mensaje, un video de la técnica o la calculadora para convertir tazas a gramos: cualquier cosa que tape la pestaña hace que el navegador retire el bloqueo. No es una falla de AwakeTab, es una regla de la plataforma. El indicador lo dice sin rodeos:

::pills

## Batería baja y modos de ahorro

::checklist

Hay guías específicas para [iPhone con Safari](/es/on/iphone-safari) y para [Android con Chrome](/es/on/android-chrome) si tu equipo se sigue apagando.

## Navegadores que sirven en la cocina

Según la documentación de los navegadores, revisada el 26 de septiembre de 2026, hay bloqueo nativo desde Safari 16.4, Chrome 84, Samsung Internet 14, Edge 84 y Firefox 126. Si instalaste AwakeTab como app en la pantalla de inicio del iPhone, necesitas iOS 18.4 o posterior. Con versiones anteriores de Firefox puedes usar el video de respaldo tocando la pantalla una vez.

## Lo que AwakeTab no hace

- No sigue activo en segundo plano: si la pestaña queda oculta, el bloqueo se va.
- No toca la pantalla por ti ni simula movimientos, y tampoco cambia tu estado en Teams o Slack.
- No es un dispositivo de seguridad: no dejes el teléfono como vigilante de una olla sin nadie cerca.

Si lo que buscas es leer un libro o hacer ejercicio con el teléfono enfrente, las páginas relacionadas de abajo cubren esos casos.

::limit
