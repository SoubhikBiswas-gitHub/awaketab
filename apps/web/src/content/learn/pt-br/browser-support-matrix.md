---
title: "Suporte ao Wake Lock por navegador — AwakeTab"
description: "Wake Lock nativo a partir do Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 e Opera 70. Fontes de 26/9/2026; versões antigas usam vídeo."
h1: "Quais navegadores suportam Wake Lock: tabela de compatibilidade"
ogTitle: "Suporte ao Wake Lock por navegador"
intent: "suporte wake lock navegadores"
secondaryQueries: ["wake lock api compatibilidade", "quais navegadores mantêm a tela ligada", "screen wake lock safari versão", "wake lock firefox suporte", "wake lock iphone tela de início"]
preset: p15
mode: standard
locale: pt-br
reviewed: false
translationOf: "browser-support-matrix"
lastVerified: 2026-09-09
browsers: []
os: []
crumb: "Tabela de suporte"
lead: "Pela tabela de suporte do AwakeTab, baseada na documentação e no código-fonte dos navegadores (conferidos em 26 de setembro de 2026), o Wake Lock de tela funciona de forma nativa a partir do Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 e Opera 70. Apps web adicionados à Tela de Início do iPhone precisam do iOS 18.4. Versões mais antigas, como Firefox anterior ao 126, usam o vídeo alternativo depois de um toque. Combinações que não conferimos não entram na tabela: não afirmamos suporte sem fonte."
rows:
  refusals:
    - title: "Aba oculta"
    - title: "Página incorporada sem a permissão `screen-wake-lock`"
    - title: "Safari sem um toque antes"
    - title: "Firefox com bateria em 5 % ou menos"
  limits:
    - title: "Segurar a tela com a aba oculta, o navegador minimizado ou o celular em outro app."
    - title: "Impedir a suspensão com a tampa do notebook fechada."
    - title: "Manter seu status verde no Teams, no Slack ou no Zoom."
      text: "A presença segue o teclado e o mouse."
    - title: "Impedir que a economia de energia do sistema escureça a tela."
      text: "Ela não recusa o bloqueio, mas continua valendo."
notes:
  https:
    kicker: "Um detalhe útil"
    text: "Uma página sem HTTPS nem tem Wake Lock: o AwakeTab oferece a alternativa."
faq:
  - q: "Suporte ao Wake Lock significa que a tela fica ligada com a aba em segundo plano?"
    a: "Não. Em todos os navegadores da tabela, o bloqueio só vale enquanto a aba está visível. Minimizar, trocar de aba ou de app libera o bloqueio, e o AwakeTab mostra “Pausado — aba oculta” até você voltar."
  - q: "Meu navegador está abaixo da versão mínima. O que acontece?"
    a: "O AwakeTab mostra “Toque para usar a alternativa”. Com o seu toque, um pequeno vídeo silencioso mantém a tela ligada. Funciona, mas consome mais bateria do que o Wake Lock nativo, e o indicador passa a dizer “Tela ligada por vídeo alternativo”."
  - q: "Por que o Safari aparece com 16.4 e o app da Tela de Início com 18.4?"
    a: "São contextos diferentes no iPhone. No Safari, o Wake Lock chegou no iOS 16.4. Em apps web adicionados à Tela de Início, ele só funciona a partir do iOS 18.4; em versões anteriores, use o AwakeTab direto no Safari."
  - q: "A tabela vale para sempre?"
    a: "Não. Cada linha reflete a documentação e o código-fonte dos navegadores conferidos em 26 de setembro de 2026. Navegadores mudam, e uma aba oculta, uma política do site ou a falta de um toque no Safari podem negar o bloqueio mesmo numa versão compatível."
honestLimit: "A tabela reflete a documentação dos navegadores conferida em 26 de setembro de 2026; ainda não há testes em aparelhos registrados. Versões mais antigas caem no vídeo alternativo."
related:
  - "/learn/screen-wake-lock-api-guide"
  - "/learn/how-we-tested"
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/on/firefox"
  - "/on/ios-home-screen"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Tabela de compatibilidade

| Navegador ou contexto | Versão mínima | Mecanismo | Plataformas | Observação |
|---|---|---|---|---|
| Chrome | 84 | Nativo | Windows, macOS, Linux, Android, ChromeOS | A aba precisa ficar visível; o Chrome não verifica a Economia de bateria |
| Edge | 84 | Nativo | Windows, macOS, Linux, Android | A aba precisa ficar visível; o Modo de eficiência não recusa o bloqueio |
| Firefox | 126 | Nativo | Windows, macOS, Linux, Android | Recusa e libera com bateria em 5 % ou menos, sem carregar; versões anteriores usam o vídeo alternativo após um gesto |
| Safari | 16.4 | Nativo | macOS, iOS, iPadOS | Precisa de um toque antes; o Modo de Pouca Energia define o Bloqueio Automático do iPhone em 30 s; a aba precisa ficar visível |
| Samsung Internet | 14 | Nativo | Android | Apps em suspensão podem fechar o navegador depois que você sai; não afetam uma aba visível |
| Opera | 70 | Nativo | Windows, macOS, Linux, Android | Base Chromium; a aba precisa ficar visível |
| Web app instalado no iPhone | 18.4 | Nativo | iOS | Em versões anteriores, use o AwakeTab no Safari |
| Vídeo alternativo | — | Alternativo | — | Exige um gesto do usuário e consome mais energia |

## Como ler esta tabela

**Versão mínima** é a primeira versão em que o navegador concede o Wake Lock sem truques. Abaixo dela, o AwakeTab não finge: o indicador mostra “Toque para usar a alternativa”, e só depois do seu toque o vídeo silencioso começa.

**Nativo** quer dizer que o AwakeTab chama `navigator.wakeLock.request('screen')` e o navegador confirma. Só então o indicador diz “Tela ligada”. Se o navegador recusar, aparece “Bloqueado — veja como corrigir”, nunca um falso “ligado”.

**Observação** lista o que costuma derrubar o bloqueio mesmo numa versão compatível:

::rows refusals

::note https

::ad

## Por que só estas versões

Esta tabela vem de um único arquivo de dados do AwakeTab, e todas as páginas do site citam as mesmas versões. Nenhuma página promete um número diferente do que aparece aqui. Quando um navegador mudar, a tabela e a data de verificação mudam juntas.

Fontes verificadas em 26 de setembro de 2026:

- [MDN browser-compat-data, WakeLock](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json)
- [New in Chrome 84](https://developer.chrome.com/blog/new-in-chrome-84/)
- [Firefox 126 release notes for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126)
- [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- [Chromium wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc)
- [WebKit WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp)
- [Firefox WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp)

## Guias por navegador

Se você usa iPhone, veja [tela do iPhone sempre acesa no Safari](/pt-br/on/iphone-safari). Para Android, o caminho está em [tela do celular sempre ligada com o Chrome](/pt-br/on/android-chrome). Para as fontes e os testes em aparelhos, ainda pendentes, consulte [como testamos](/learn/how-we-tested).

## O que nenhum navegador da tabela faz

::rows limits

::limit inline
