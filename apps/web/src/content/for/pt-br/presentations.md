---
title: "Manter a tela ligada na apresentação — AwakeTab"
description: "Slides em tela cheia escondem o navegador. O AwakeTab só segura a tela se continuar visível, como na janela flutuante do Chrome ou Edge ou numa 2ª janela."
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
faq:
  - q: "Se eu colocar o PowerPoint em tela cheia, o AwakeTab continua funcionando?"
    a: "Só se o AwakeTab continuar visível. Um app de slides em tela cheia cobre o navegador, a aba fica oculta e o bloqueio é liberado. Use a janela flutuante no Chrome ou no Edge, ou deixe o AwakeTab no monitor de apoio que você vê enquanto apresenta."
  - q: "O projetor também vai ficar ligado?"
    a: "O projetor e o monitor externo seguem o tempo limite de tela do sistema. Enquanto o AwakeTab segura o bloqueio numa superfície visível, esse tempo não corre. Se a aba some, o sistema volta a contar e o projetor pode apagar."
  - q: "Numa reunião pelo Teams, isso me mantém como disponível?"
    a: "Não. A presença no Teams, no Slack e no Zoom segue o teclado e o mouse, não a tela. O AwakeTab não simula entrada, então não muda seu status durante a apresentação."
  - q: "A sessão sugerida é de 2 horas. Posso mudar para a duração da minha palestra?"
    a: "Pode. Escolha outro tempo predefinido de 15 min a 4 h, uma duração personalizada ou um horário de término em “Até…”. Quando o tempo acaba, o AwakeTab pergunta se você quer estender (+15 min, +30 min ou +1 h) antes de parar."
honestLimit: "Apps de slides em tela cheia escondem a aba e liberam o bloqueio. Use a janela flutuante (Chrome ou Edge) ou a extensão, e lembre que o projetor continua seguindo o tempo limite de tela do sistema."
related:
  - "/for/second-monitor"
  - "/for/video-calls"
  - "/on/windows-11"
  - "/on/macos"
  - "/for/night-clock"
author: soubhik
published: 2026-09-26
---

## O problema com slides em tela cheia

Quando você aperta F5 no PowerPoint ou inicia a apresentação no Keynote ou no Google Slides, o app ocupa a tela inteira e esconde o navegador. Para o navegador, a aba do AwakeTab ficou oculta — e uma aba oculta não pode segurar um Wake Lock. Por isso o AwakeTab só consegue manter a tela ligada se continuar visível em algum lugar: na janela flutuante do Chrome ou do Edge, numa segunda janela ou no monitor de apoio que ainda mostra a aba.

## Três jeitos de montar

**Janela flutuante (Chrome e Edge).** No cabeçalho do AwakeTab, toque em “Janela flutuante”. Um pequeno temporizador fica por cima dos slides e mantém o bloqueio ativo. Em outros navegadores, o AwakeTab abre uma janela pequena comum no lugar.

**Monitor de apoio.** Se você projeta num telão e vê as anotações no notebook, deixe o AwakeTab visível na tela do notebook, ao lado das notas do orador.

**Slides no próprio navegador.** Se a apresentação roda numa aba, abra o AwakeTab em outra janela lado a lado, sem colocar os slides em tela cheia por cima dele.

Depois, toque em iniciar e confira se o indicador mostra “Tela ligada”. Esta página já sugere 2 horas.

## Projetor, monitor externo e o sistema

O Wake Lock segura o tempo limite de tela do sistema operacional, que vale para todas as telas ligadas ao computador. Se o AwakeTab perde a visibilidade, esse relógio volta a correr e o projetor pode apagar no meio de um slide. Antes de uma palestra importante, vale conferir o tempo de tela nas configurações de energia do Windows ou nos Ajustes do Sistema do Mac.

Não feche a tampa do notebook achando que o monitor externo segura tudo: fechar a tampa coloca o computador para dormir, e nenhuma aba do navegador muda isso.

## Enquanto você fala

- **“Tela ligada”**: tudo certo, pode apresentar.
- **“Pausado — aba oculta”**: algo cobriu o AwakeTab. Traga a janela flutuante de volta.
- **“Bloqueado — veja como corrigir”**: a economia de bateria recusou. Ligue o carregador; em notebooks isso quase sempre resolve.

Um detalhe útil: o tempo só conta enquanto o bloqueio está ativo, então os momentos em que a aba ficou oculta não consomem a sua sessão. Quando o tempo programado acaba, aparece a pergunta “O tempo acabou. Continuar?” com +15 min, +30 min ou +1 h. Não suponha que a sessão é infinita se você escolheu uma duração.

## Navegadores e versões

No notebook da palestra, o que conta (verificado em 9 de setembro de 2026): Edge ou Chrome a partir da versão 84, Firefox a partir da 126 e Safari a partir da 16.4, todos com Wake Lock nativo. A janela flutuante de verdade precisa de Chrome ou Edge. Em Firefox mais antigo, o vídeo alternativo começa depois de um toque e gasta mais energia — deixe o notebook na tomada durante a palestra.
