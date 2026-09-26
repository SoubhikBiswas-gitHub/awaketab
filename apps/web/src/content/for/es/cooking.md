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
faq:
  - q: "¿La pantalla sigue encendida si contesto un WhatsApp en medio de la receta?"
    a: "No. Al cambiar de app o de pestaña, el navegador libera el bloqueo y el indicador pasa a “En pausa — pestaña oculta”. Vuelve a AwakeTab y espera a que diga “Pantalla despierta” o “Despierta con video de respaldo” antes de seguir cocinando."
  - q: "¿Puedo ver la receta en otra app al mismo tiempo?"
    a: "Sí, siempre que AwakeTab siga a la vista. En una tablet usa la pantalla dividida (Split View en iPad) con la receta en un lado y AwakeTab en el otro. Si la receta tapa por completo la pestaña, el bloqueo se libera."
  - q: "¿Por qué el iPhone se bloquea a los 30 segundos aunque inicié AwakeTab?"
    a: "Porque el Modo de bajo consumo está activado. En ese modo iOS fuerza un Bloqueo automático de 30 segundos y anula el Wake Lock. Desactívalo en Ajustes → Batería y vuelve a iniciar la sesión."
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
---

## La respuesta rápida

Con las manos llenas de masa no vas a tocar el teléfono cada medio minuto. Abre AwakeTab en el navegador, deja la pestaña a la vista y la pantalla no se apagará mientras sigues la receta. La herramienta de esta página ya viene en modo Cocina y con la duración “∞”, así que se mantiene hasta que tú la detengas. El indicador solo muestra “Pantalla despierta” cuando el navegador confirma el Wake Lock (el permiso que impide que la pantalla se atenúe y se bloquee). Si abres otra app en el teléfono, el bloqueo se libera hasta que regreses.

## Prepara el teléfono o la tablet antes de empezar

1. Apoya el dispositivo donde puedas leerlo sin tocarlo y, si la receta es larga, conéctalo al cargador.
2. Deja AwakeTab visible. Puede ser junto a la receta en pantalla dividida, en Split View si usas iPad, o como la única pestaña que miras mientras lees un recetario de papel.
3. Toca para empezar y confirma que el indicador cambió a “Pantalla despierta”. Si en cambio ves “Despierta con video de respaldo”, tu navegador no tiene Wake Lock nativo y AwakeTab usa un video silencioso, que gasta más batería.

## Cuando sales de la pestaña a media receta

Un mensaje, un video de la técnica o la calculadora para convertir tazas a gramos: cualquier cosa que tape la pestaña hace que el navegador retire el bloqueo. No es una falla de AwakeTab, es una regla de la plataforma. El indicador lo dice sin rodeos con “En pausa — pestaña oculta” y el temporizador se detiene. Cuando regresas, espera a que vuelva a decir “Pantalla despierta” antes de dejar el teléfono en la barra.

## Batería baja y modos de ahorro

En iPhone, el Modo de bajo consumo manda un Bloqueo automático de 30 segundos y le gana a cualquier página web. En Android, el Ahorro de batería puede rechazar la solicitud. En ambos casos aparece “Bloqueado — aquí está la solución” junto al motivo exacto. Tocar Iniciar otra vez sin cambiar nada da el mismo resultado: desactiva el modo de ahorro o conecta el cargador primero. Si quieres revisar el tiempo de pantalla del sistema, en iPhone es Bloqueo automático, dentro de Pantalla y brillo; en Android busca Tiempo de espera de la pantalla dentro de Ajustes → Pantalla. Algunos fabricantes de Android además tienen listas de “apps en suspensión” que conviene revisar.

Hay guías específicas para [iPhone con Safari](/es/on/iphone-safari) y para [Android con Chrome](/es/on/android-chrome) si tu equipo se sigue apagando.

## Navegadores que sirven en la cocina

Nuestra matriz, verificada el 9 de septiembre de 2026, registra bloqueo nativo desde Safari 16.4, Chrome 84, Samsung Internet 14, Edge 84 y Firefox 126. Si instalaste AwakeTab como app en la pantalla de inicio del iPhone, necesitas iOS 18.4 o posterior. Con versiones anteriores de Firefox puedes usar el video de respaldo tocando la pantalla una vez.

## Lo que AwakeTab no hace

- No sigue activo en segundo plano: si la pestaña queda oculta, el bloqueo se va.
- No toca la pantalla por ti ni simula movimientos, y tampoco cambia tu estado en Teams o Slack.
- No es un dispositivo de seguridad: no dejes el teléfono como vigilante de una olla sin nadie cerca.
- Una pantalla encendida gasta energía. En sesiones largas, mejor enchufado.

Si lo que buscas es leer un libro o hacer ejercicio con el teléfono enfrente, las páginas relacionadas de abajo cubren esos casos.
