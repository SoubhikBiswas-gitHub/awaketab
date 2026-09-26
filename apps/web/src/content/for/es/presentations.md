---
title: "Mantener la pantalla encendida al presentar — AwakeTab"
description: "Evita que la pantalla se apague en tu presentación con AwakeTab en una ventana flotante. Las diapositivas en pantalla completa ocultan la pestaña."
h1: "Evita que la pantalla se apague durante tu presentación"
ogTitle: "Pantalla encendida al presentar"
intent: "mantener la pantalla encendida durante una presentación"
secondaryQueries: ["evitar que la pantalla se apague en una presentación", "que no se apague la pantalla en powerpoint", "pantalla se apaga durante presentación proyector", "mantener pantalla encendida google slides", "laptop se bloquea mientras presento"]
preset: p120
mode: standard
locale: es
reviewed: false
translationOf: "presentations"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "¿Funciona si pongo PowerPoint, Keynote o Google Slides en pantalla completa?"
    a: "La pantalla completa tapa la pestaña de AwakeTab y el navegador libera el bloqueo. Para evitarlo, abre la ventana flotante en Chrome o Edge, deja AwakeTab en una segunda ventana o en el monitor del presentador, donde siga a la vista."
  - q: "¿El proyector también se queda encendido?"
    a: "El proyector o la pantalla externa siguen el tiempo de apagado de pantalla del sistema operativo. Mientras AwakeTab esté visible y el indicador diga “Pantalla despierta”, ese tiempo no corre; si la pestaña se oculta, la regla del sistema vuelve a aplicar."
  - q: "¿Qué pasa si cambio de ventana para abrir un video en plena charla?"
    a: "Si ese video tapa AwakeTab por completo, el bloqueo se libera y el indicador muestra “En pausa — pestaña oculta”. Al regresar, AwakeTab vuelve a solicitarlo; espera a ver “Pantalla despierta” antes de seguir hablando."
  - q: "¿Me mantiene como disponible en Teams mientras presento?"
    a: "No. La presencia en Teams, Slack y Zoom depende de la actividad del teclado y el mouse, no de la pantalla. AwakeTab nunca simula pulsaciones ni movimientos para fingirla."
honestLimit: "Las apps de diapositivas en pantalla completa ocultan la pestaña: usa la ventana flotante en Chromium o la extensión, y recuerda que el proyector sigue el tiempo de apagado de pantalla del sistema."
related:
  - "/for/second-monitor"
  - "/on/windows-11"
  - "/on/macos"
  - "/for/night-clock"
  - "/on/samsung-internet"
author: soubhik
published: 2026-09-26
---

## El problema con las diapositivas en pantalla completa

Estás a mitad de la presentación, te detienes a responder una pregunta y la pantalla se oscurece frente a todo el público. AwakeTab lo evita, con una condición: tiene que seguir siendo una superficie visible. Las diapositivas en pantalla completa tapan el navegador, y un navegador oculto no puede mantener el Wake Lock. Por eso la configuración correcta depende de dónde quede AwakeTab mientras presentas: en la ventana flotante de Chromium, en una segunda ventana o en un monitor del presentador que siga mostrando la pestaña.

## Tres formas de dejar AwakeTab a la vista

**Ventana flotante (Chrome y Edge).** El botón “Ventana flotante” abre un temporizador pequeño que queda por encima de las diapositivas. En otros navegadores se abre una ventana pequeña en su lugar. Si el navegador bloquea ventanas emergentes, permítelas para awaketab.com.

**Monitor del presentador.** Si presentas con dos pantallas, deja AwakeTab en la que ves tú (junto a tus notas) y las diapositivas en el proyector.

**Extensión para Chrome y Edge.** Si prefieres no tener nada visible, la extensión de AwakeTab mantiene la pantalla despierta detrás de otras ventanas.

## Antes de subir al escenario

1. Enchufa la laptop antes de empezar: tanto el ahorro de batería de Windows como el Modo de bajo consumo de macOS pueden rechazar o anular el bloqueo.
2. Abre esta página: ya viene con una sesión de 2 horas. Si la charla se alarga, al terminar el tiempo suena una campanilla y puedes extender la sesión o detenerla.
3. Coloca AwakeTab en la ventana flotante o en tu monitor, y confirma que el indicador dice “Pantalla despierta”.
4. Pon las diapositivas en pantalla completa y revisa que el temporizador flotante siga corriendo.

## Si la pantalla se apaga de todos modos

Si el sistema oscurece la pantalla con el indicador en “Pantalla despierta”, la causa es otra política: el bloqueo de sesión de la empresa, una tarjeta inteligente o un monitor que se apaga cuando pierde señal. Un Wake Lock no controla nada de eso. Si ves “Bloqueado — aquí está la solución”, lee el motivo que aparece debajo y corrige esa condición; volver a tocar Iniciar sin cambiar nada da el mismo resultado.

Para ajustar el tiempo de apagado de la pantalla del sistema, revisa las guías de [Windows 11](/es/on/windows-11) y [macOS](/es/on/macos).

## Navegadores con Wake Lock nativo

Para presentar desde la laptop sirven Chrome 84+, Edge 84+, Safari 16.4+, Firefox 126+ y Opera 70+, según nuestra matriz del 9 de septiembre de 2026. La ventana flotante con temporizador necesita Chrome o Edge. Un Firefox anterior puede usar el video de respaldo tras un clic, con un poco más de consumo.

## Lo que no hace

AwakeTab no mueve el mouse, no avanza tus diapositivas y no cambia tu estado en Teams. Tampoco evita que el equipo se suspenda si cierras la tapa. Su trabajo es uno: que la pantalla no se apague mientras presentas, y decirte con honestidad cuándo lo está logrando.
