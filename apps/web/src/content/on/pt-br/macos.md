---
title: "Impedir que a tela do Mac desligue — AwakeTab"
description: "No Mac, Safari 16.4+, Chrome 84+ e Firefox 126+ mantêm a tela ligada numa aba visível, e o Mac não dorme por inatividade. Tampa fechada, sim."
h1: "Impedir que a tela do Mac desligue pelo navegador"
ogTitle: "Tela do Mac sempre ligada"
intent: "impedir que a tela do mac desligue"
secondaryQueries: ["manter tela do mac ligada", "macbook tela apaga sozinha", "mac não deixar a tela apagar sem app", "tela sempre ligada macos"]
preset: p60
mode: standard
locale: pt-br
reviewed: false
translationOf: "macos"
lastVerified: 2026-09-09
browsers: ["chrome", "safari", "firefox"]
os: ["macos"]
crumb: "macOS"
lead: "No Mac, o Safari 16.4+, o Chrome 84+ e o Firefox 126+ conseguem impedir que a tela desligue enquanto a aba do AwakeTab estiver visível. Clique em iniciar: com “Tela ligada” no indicador, o monitor para de escurecer e não vai para a tela bloqueada por inatividade. Enquanto a tela fica acesa, o Mac também não entra em repouso por inatividade, segundo a documentação da Apple (conferida em 26 de setembro de 2026); dá para conferir com `pmset -g assertions` no Terminal. Mas fechar a tampa ainda coloca o Mac em repouso. Esta página sugere 1 hora."
facts:
  - label: "Safari"
    value: "16.4 ou posterior"
  - label: "Chrome e Edge"
    value: "84 ou posterior"
  - label: "Firefox"
    value: "126 ou posterior"
toc:
  ajustes-do-sistema-se-preferir-mexer-no-mac: "Ajustes do Sistema"
steps:
  - title: "Abra o AwakeTab numa janela própria"
    text: "Deixe-a fora da tela cheia de outros apps."
    shot: "o AwakeTab numa janela própria"
  - title: "Clique em iniciar ou aperte Espaço"
    text: "Confira se o indicador chegou a “Tela ligada”."
    shot: "o indicador com a sessão ativa"
  - title: "Trabalhe em outros apps com a janela do AwakeTab aparecendo num canto"
    text: "Minimizada no Dock, ela deixa de contar como visível."
    shot: "a janela do AwakeTab num canto"
  - title: "A “Janela flutuante” fica por cima de tudo"
    text: "No Chrome, no Edge ou no Firefox 151+, é o jeito mais prático de manter o AwakeTab à vista enquanto você usa outro app em tela cheia."
    shot: "a Janela flutuante sobre outro app"
matrix:
  label: "Navegadores no macOS, conferido em 26 de setembro de 2026"
  cols: ["Navegador", "Resultado", "Observação"]
  rows:
    - what: "Safari 16.4 ou posterior"
      result: works
      label: "Compatível"
      text: "Precisa de um clique na página para começar"
    - what: "Chrome 84 ou posterior"
      result: works
      label: "Compatível"
      text: "A aba precisa continuar visível"
    - what: "Firefox 126 ou posterior"
      result: works
      label: "Compatível"
      text: "Abaixo disso, só o vídeo alternativo, com um clique"
    - what: "Edge 84 ou posterior"
      result: works
      label: "Compatível"
      text: "A aba precisa continuar visível"
rows:
  tools:
    - title: "Mac acordado com a tela apagada"
      text: "O comando `caffeinate` no Terminal ou um app como o Caffeine. Veja [AwakeTab vs Caffeine](/pt-br/vs/caffeine)."
    - title: "Mac com a tampa fechada"
      text: "Nenhuma aba de navegador consegue. É preciso monitor externo, energia e os recursos do próprio macOS."
    - title: "Parecer disponível no chat"
      text: "O AwakeTab não é a resposta, porque nunca simula entrada."
faq:
  - q: "Se eu usar o Mission Control ou mudar de Mesa, a tela continua ligada?"
    a: "Só enquanto a janela do AwakeTab estiver à vista. Minimizada no Dock, esquecida em outra Mesa ou coberta por outras janelas, ela pode ser tratada como oculta; aí o bloqueio é liberado e o indicador mostra “Pausado — aba oculta” até você voltar."
  - q: "O Mac também deixa de entrar em repouso?"
    a: "Sim, no caso do repouso por inatividade, enquanto a tela estiver ligada: o Chrome segura uma asserção que impede o repouso da tela e, segundo a documentação da Apple, o Mac também não entra em repouso por inatividade enquanto ela vale. Para manter o Mac acordado com a tela apagada, use o comando caffeinate ou um app nativo."
  - q: "Dá para usar o MacBook com a tampa fechada e o AwakeTab aberto?"
    a: "Normalmente não. Fechar a tampa coloca o Mac em repouso, e nenhuma aba de navegador muda isso. A exceção é o modo tampa fechada, que exige monitor externo, energia e as ferramentas do próprio sistema."
  - q: "Isso deixa meu status verde no Slack ou no Teams?"
    a: "Não. A presença nesses apps segue o teclado e o trackpad, não a tela. O AwakeTab nunca simula entrada, então seu status muda para ausente como sempre."
honestLimit: "A tela fica ligada e, enquanto isso, o Mac não entra em repouso por inatividade. Fechar a tampa ainda coloca o Mac em repouso (exceto no modo tampa fechada com monitor externo), e esconder a aba libera o bloqueio."
related:
  - "/vs/caffeine"
  - "/vs/caffeinate-command"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/for/presentations"
  - "/learn/does-a-wake-lock-keep-teams-green"
author: soubhik
published: 2026-09-26
updated: 2026-09-28
---

## Como deixar a janela à vista

::steps

::ad

## Navegadores no macOS

Conferido na documentação dos navegadores em 26 de setembro de 2026.

::matrix

Para os números de todos os navegadores, veja a [tabela de suporte do Wake Lock](/pt-br/learn/matriz-suporte-navegadores).

## Ajustes do Sistema, se preferir mexer no Mac

O tempo para a tela desligar fica em Ajustes do Sistema → Tela Bloqueada, e as opções de repouso aparecem em Bateria (MacBook) ou Economia de Energia (Mac de mesa), conforme a versão do macOS. A diferença para o AwakeTab é que o ajuste do sistema vale o tempo todo, inclusive quando você esquece o Mac ligado na mesa; o AwakeTab só segura a tela durante a sessão e devolve o controle ao terminar.

## Quando outra ferramenta é melhor

::rows tools

## Modo de Pouca Energia no MacBook

Com o Modo de Pouca Energia ativo, o macOS pode reduzir o brilho, mas o navegador não recusa o Wake Lock por causa dele. Se o indicador mostrar “Bloqueado — veja como corrigir”, leia a causa: no Safari, quase sempre falta um clique na página; no Firefox, a bateria pode estar em 5 % ou menos sem carregar. Em Chrome e Edge, há ainda a opção de parar automaticamente quando a bateria cair abaixo do limite que você definir.
