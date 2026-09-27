---
title: "Manter a tela ligada na apresentação — AwakeTab"
description: "Slides em tela cheia escondem o navegador. O AwakeTab só segura a tela se continuar visível: na janela flutuante ou numa segunda janela."
h1: "Tela ligada durante apresentações de slides"
ogTitle: "Tela ligada na apresentação"
intent: "manter tela ligada durante apresentação"
secondaryQueries: ["tela apaga no meio da apresentação", "projetor desliga durante apresentação", "impedir que a tela desligue powerpoint", "tela sempre ligada para slides"]
preset: p120
mode: standard
locale: pt-br
reviewed: false
translationOf: "presentations"
lastVerified: 2026-09-09
browsers: []
os: []
lead: "Quando você aperta F5 no PowerPoint ou inicia a apresentação no Keynote ou no Google Slides, o app ocupa a tela inteira e esconde o navegador. Para o navegador, a aba do AwakeTab ficou oculta — e uma aba oculta não pode segurar um Wake Lock. Por isso o AwakeTab só consegue manter a tela ligada se continuar visível em algum lugar: na janela flutuante (Chrome, Edge ou Firefox 151+), numa segunda janela ou no monitor de apoio que ainda mostra a aba."
crumb: "Apresentações"
toc:
  projetor-monitor-externo-e-o-sistema: "Projetor e monitor externo"
figures:
  - frame: phone
    label: "Captura do celular"
    alt: "a janela flutuante do AwakeTab mostrando Tela ligada"
    caption: "A janela flutuante."
  - frame: desktop
    label: "Captura do computador"
    alt: "slides em tela cheia no Chrome com a janela flutuante do AwakeTab num canto"
    caption: "Slides em tela cheia com a janela flutuante num canto."
pills:
  - state: held
    text: "Tudo certo, pode apresentar."
  - state: lost
    text: "Algo cobriu o AwakeTab. Traga a janela flutuante de volta."
  - state: denied
    text: "O navegador recusou. Leia o motivo mostrado: em geral a aba não estava visível ou o Safari precisa de um clique antes."
faq:
  - q: "Se eu colocar o PowerPoint em tela cheia, o AwakeTab continua funcionando?"
    a: "Só se o AwakeTab continuar visível. Um app de slides em tela cheia cobre o navegador, a aba fica oculta e o bloqueio é liberado. Use a janela flutuante no Chrome, no Edge ou no Firefox 151+ para computador, ou deixe o AwakeTab no monitor de apoio que você vê enquanto apresenta."
  - q: "O projetor também vai ficar ligado?"
    a: "O projetor e o monitor externo seguem o tempo limite de tela do sistema. Enquanto o AwakeTab segura o bloqueio numa superfície visível, esse tempo não corre. Se a aba some, o sistema volta a contar e o projetor pode apagar."
  - q: "Numa reunião pelo Teams, isso me mantém como disponível?"
    a: "Não. A presença no Teams, no Slack e no Zoom segue o teclado e o mouse, não a tela. O AwakeTab não simula entrada, então não muda seu status durante a apresentação."
  - q: "A sessão sugerida é de 2 horas. Posso mudar para a duração da minha palestra?"
    a: "Pode. Escolha outro tempo predefinido de 15 min a 4 h, uma duração personalizada ou um horário de término em “Até…”. Quando o tempo acaba, o AwakeTab pergunta se você quer estender (+15 min, +30 min ou +1 h) antes de parar."
honestLimit: "Apps de slides em tela cheia escondem a aba e liberam o bloqueio. Use a janela flutuante (Chrome, Edge ou Firefox 151+ no computador) ou a extensão, e lembre que o projetor continua seguindo o tempo limite de tela do sistema."
related:
  - "/guides/second-monitor-turns-off"
  - "/for/video-calls"
  - "/on/windows-11"
  - "/on/macos"
  - "/for/night-clock"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Três jeitos de montar

**Janela flutuante (Chrome, Edge e Firefox 151+ no computador).** No cabeçalho do AwakeTab, toque em “Janela flutuante”. Um pequeno temporizador fica por cima dos slides. Ainda não registramos um teste em aparelho que confirme que ele mantém o bloqueio com a aba original oculta, então confira o indicador. Em outros navegadores, o AwakeTab abre uma janela pequena comum no lugar.

**Monitor de apoio.** Se você projeta num telão e vê as anotações no notebook, deixe o AwakeTab visível na tela do notebook, ao lado das notas do orador.

**Slides no próprio navegador.** Se a apresentação roda numa aba, abra o AwakeTab em outra janela lado a lado, sem colocar os slides em tela cheia por cima dele.

Depois, toque em iniciar e confira se o indicador mostra “Tela ligada”. Esta página já sugere 2 horas.

::figures

::ad

## Enquanto você fala

::pills

Um detalhe útil: o tempo só conta enquanto o bloqueio está ativo, então os momentos em que a aba ficou oculta não consomem a sua sessão. Quando o tempo programado acaba, aparece a pergunta “O tempo acabou. Continuar?” com +15 min, +30 min ou +1 h. Não suponha que a sessão é infinita se você escolheu uma duração.

## Projetor, monitor externo e o sistema

O Wake Lock segura o tempo limite de tela do sistema operacional, que vale para todas as telas ligadas ao computador. Se o AwakeTab perde a visibilidade, esse relógio volta a correr e o projetor pode apagar no meio de um slide. Antes de uma palestra importante, vale conferir o tempo de tela nas configurações de energia do Windows ou nos Ajustes do Sistema do Mac.

Não feche a tampa do notebook achando que o monitor externo segura tudo: fechar a tampa coloca o computador para dormir (a exceção é o modo tampa fechada do Mac, com carregador e monitor externo), e nenhuma aba do navegador muda isso.

## Navegadores e versões

No notebook da palestra, o que conta (segundo a documentação dos navegadores, conferida em 26 de setembro de 2026): Edge ou Chrome a partir da versão 84, Firefox a partir da 126 e Safari a partir da 16.4, todos com Wake Lock nativo. A janela flutuante de verdade precisa de Chrome ou Edge 116+ ou de Firefox 151+ no computador; o Safari não tem. Em Firefox mais antigo, o vídeo alternativo começa depois de um toque e gasta mais energia — deixe o notebook na tomada durante a palestra.

::limit
