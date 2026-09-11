import type { ILocaleHomeCopy } from './types';

export const es: ILocaleHomeCopy = {
  whatItDoes: [
    'AwakeTab usa la API Wake Lock del navegador mientras esta pestaña está visible, y el estado solo dice que la pantalla está despierta después de que el navegador confirma el bloqueo. Elige una duración — de 15 minutos a 4 horas, una duración personalizada de hasta siete días, o una hora concreta — y la pantalla deja de atenuarse, de suspenderse y de mostrar la pantalla de bloqueo. El indicador muestra Pantalla despierta solo mientras el navegador mantiene el bloqueo realmente activo. Oculta esta pestaña y el navegador retomará el bloqueo, así que el indicador cambiará a En pausa — pestaña oculta y el temporizador se detendrá hasta que vuelvas.',
    'No necesitas cuenta, descarga ni extensión: la herramienta completa es esta página. La configuración, la sesión actual y siete días de estadísticas se guardan en este navegador. No se envía nada a menos que actives el envío opcional de datos de uso anónimos. Esta página no carga scripts de terceros ni fuentes web, así que se mantiene rápida en un teléfono y funciona sin conexión después de la primera visita. El encabezado ofrece la opción de instalarla si quieres tenerla en la pantalla de inicio o en el dock; la app instalada puede reproducir una campanilla y notificarte cuando termina una sesión.',
  ],
  howItWorks: [
    'Eliges una duración. Un preset, una duración personalizada o una hora concreta inician una sesión. Las mismas opciones están a una sola tecla: del 1 al 6 para los presets, 0 para sin hora de fin, U para una hora concreta y la barra espaciadora para iniciar o detener.',
    'Se le pide al navegador un wake lock de pantalla. AwakeTab llama a la API Screen Wake Lock, el mismo mecanismo que usa un reproductor de video. El navegador puede aceptar, rechazar o retomar el bloqueo más adelante; las tres respuestas se muestran en el momento en que ocurren.',
    'El temporizador sigue al bloqueo, no al reloj. La cuenta regresiva solo avanza mientras el bloqueo está activo, y cada cálculo usa la hora del sistema, así que una laptop que estuvo suspendida vuelve con un número honesto. Cuando se acaba el tiempo, suena una campanilla y puedes elegir extender o detener.',
  ],
  honestLimits: [
    'Una pestaña oculta no puede mantener un wake lock. Cambiar de app, minimizar la ventana o cambiar de pestaña pausa la sesión. Es una regla de la plataforma. Para mantener la pantalla despierta detrás de otras ventanas, usa la extensión de AwakeTab para Chrome y Edge.',
    'Cerrar la tapa sigue suspendiendo el equipo. Ninguna página web ni extensión puede cambiar eso. Se necesita un ajuste del sistema operativo, una pantalla externa o una herramienta nativa.',
    'El ahorro de batería gana siempre. El Modo de bajo consumo del iPhone fuerza un Auto-Lock de 30 segundos; el ahorro de batería de Android y Windows puede rechazar la solicitud. Verás Bloqueado — aquí está la solución junto con la causa.',
    'No afecta tu estado de chat. La presencia en Teams, Slack y Zoom sigue el tiempo de inactividad del teclado y el mouse, no la pantalla. Un wake lock no te mantendrá en verde, y AwakeTab nunca simula pulsaciones ni movimientos para fingirlo.',
    'La suspensión de pantalla no es la suspensión del sistema. Un wake lock mantiene la pantalla activa. En nuestras pruebas, Chromium en Windows también retrasó la suspensión por inactividad; en macOS no ocurrió lo mismo. Para mantener el equipo activo con la pantalla apagada, usa una utilidad nativa.',
    'Otro software sigue sus propias reglas. El cierre de sesión de un banco, una app de supervisión de exámenes, un monitor que se apaga al perder señal o una política corporativa de bloqueo de pantalla quedan fuera del alcance de un wake lock.',
  ],
};
