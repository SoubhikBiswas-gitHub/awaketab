---
title: "Manter a tela do iPhone ligada no Safari — AwakeTab"
description: "No iPhone, o Safari 16.4+ segura a tela com Wake Lock nativo. O Modo de Pouca Energia força o Bloqueio Automático em 30 s e trocar de app libera a tela."
h1: "Como manter a tela do iPhone ligada no Safari"
ogTitle: "Tela do iPhone ligada no Safari"
intent: "manter tela do iphone ligada safari"
secondaryQueries: ["tela do iphone apagando sozinha", "iphone tela sempre ligada", "impedir que a tela do iphone desligue", "safari manter tela acesa"]
preset: p30
mode: standard
locale: pt-br
reviewed: false
translationOf: "iphone-safari"
lastVerified: 2026-09-09
browsers: ["safari"]
os: ["ios"]
lead: "Desde o iOS 16.4, o Safari no iPhone tem Wake Lock (a API que mantém a tela acesa) nativo. Basta abrir o AwakeTab no Safari e iniciar uma sessão: com “Tela ligada” no indicador, o iPhone não bloqueia enquanto a aba seguir aberta na frente. Dois cuidados: o Modo de Pouca Energia continua deixando a opção Nunca do Bloqueio Automático em cinza e trava o Bloqueio Automático em 30 segundos; e sair do Safari libera o bloqueio. Esta página sugere uma sessão de 30 minutos."
crumb: "iPhone no Safari"
facts:
  - label: "Safari no iPhone"
    value: "iOS 16.4"
  - label: "App na Tela de Início"
    value: "iOS 18.4"
toc:
  o-que-o-ios-faz-por-conta-própria: "O que o iOS faz sozinho"
  se-aparecer-bloqueado--veja-como-corrigir: "Se aparecer Bloqueado"
steps:
  - title: "Confira o Modo de Pouca Energia"
    path: "Ajustes › Bateria"
    text: "Se o ícone da bateria estiver amarelo, ele está ativo e o Bloqueio Automático fica em 30 segundos. Se a tela apagar mesmo com o AwakeTab, desative-o."
    shot: "o ícone da bateria em amarelo"
  - title: "Abra o AwakeTab no Safari e escolha a duração"
    text: "Os tempos vão de 15 min a 4 h, ou “∞” para até você parar."
    shot: "o AwakeTab no Safari com as durações"
  - title: "Toque em iniciar"
    text: "O indicador passa por “Iniciando…” e deve chegar a “Tela ligada”."
    shot: "o indicador mostrando “Tela ligada”"
  - title: "Deixe o Safari aberto na aba do AwakeTab"
    text: "Se precisar ler outra coisa, prefira o iPad, com apps em janelas no iPadOS 26 (Split View no iPadOS 18 ou anterior); no iPhone só um app fica na frente, então a aba do AwakeTab precisa ficar na tela."
    shot: "o Safari na frente com a aba do AwakeTab"
matrix:
  label: "Versões mínimas no iPhone, conferidas em 26 de setembro de 2026"
  cols: ["Contexto", "Resultado", "O que acontece"]
  rows:
    - what: "Safari no iPhone, iOS 16.4 ou posterior"
      result: works
      label: "Compatível"
      text: "Wake Lock nativo com a aba visível."
    - what: "App na Tela de Início, iOS 18.4 ou posterior"
      result: works
      label: "Compatível"
      text: "Wake Lock nativo com o app aberto."
    - what: "Safari anterior ao 16.4"
      result: fallback
      label: "Vídeo alternativo"
      text: "Só o vídeo alternativo, após um toque."
rows:
  blockers:
    - title: "Modo de Pouca Energia"
      text: "Define o Bloqueio Automático em 30 segundos (Suporte da Apple). O Safari não recusa o Wake Lock por causa dele; se a tela ainda apaga com o modo ligado é algo que ainda não registramos num teste em aparelho."
    - title: "Trocar de app ou de aba"
      text: "O iOS retira o bloqueio na hora. O cronômetro para e só volta a correr quando a aba aparece de novo."
    - title: "Tela de bloqueio por botão"
      text: "Apertar o botão lateral apaga a tela, com ou sem AwakeTab."
faq:
  - q: "Se eu for para o Instagram e voltar, a tela continua segura?"
    a: "Enquanto você está em outro app, não. Sair do Safari ou trocar de aba libera o bloqueio e o indicador mostra “Pausado — aba oculta”. Ao voltar para a aba do AwakeTab, o bloqueio é pedido de novo; espere aparecer “Tela ligada”."
  - q: "Meu iPhone está com iOS 16.3 ou anterior. Funciona?"
    a: "Não de forma nativa: o Wake Lock chegou ao Safari no iOS 16.4. Atualize o iPhone ou toque em iniciar para usar o vídeo alternativo, que depende de um toque seu e gasta mais bateria."
  - q: "E se eu adicionar o AwakeTab à Tela de Início?"
    a: "Como app da Tela de Início, o Wake Lock exige iOS 18.4 ou posterior. Em versões anteriores, use o AwakeTab direto no Safari. Instalado, ele também pode avisar com notificação quando a sessão terminar."
  - q: "Por que a tela apaga em 30 segundos mesmo com o AwakeTab aberto?"
    a: "Quase sempre é o Modo de Pouca Energia, que define o Bloqueio Automático em 30 segundos. O Safari não recusa o Wake Lock por causa dele, mas ainda não registramos um teste em aparelho que confirme se a tela fica acesa com o modo ligado. Se ela apagar mesmo assim, desative-o em Ajustes → Bateria."
honestLimit: "Só funciona no Safari 16.4 ou posterior. O Modo de Pouca Energia força o Bloqueio Automático em 30 segundos, e trocar de app libera o bloqueio até você voltar para a aba."
related:
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/on/ios-home-screen"
  - "/on/ipad"
  - "/for/cooking"
  - "/learn/browser-support-matrix"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Passo a passo no Safari

::steps

Se você prefere mudar o próprio sistema, o caminho é Ajustes → Tela e Brilho → Bloqueio Automático → Nunca. Se a opção estiver cinza, veja [por que o Bloqueio Automático Nunca fica em cinza](/pt-br/guides/iphone-bloqueio-automatico-nunca-cinza).

::ad

## Versões mínimas

Conferido na documentação da Apple e do WebKit em 26 de setembro de 2026.

::matrix

## O que o iOS faz por conta própria

::rows blockers

## Se aparecer “Bloqueado — veja como corrigir”

O Safari recusou o pedido. Leia a causa mostrada logo abaixo do indicador. No iPhone, o Safari exige um toque recente na página: se o AwakeTab tentou começar sozinho, por um link com início automático por exemplo, toque em iniciar. A outra causa comum é a aba não estar na frente. Repetir sem mudar nada só repete a mesma recusa.

## Bateria

Uma tela acesa por muito tempo esquenta o iPhone e consome carga. Para receitas, partituras ou um relógio de cabeceira, deixe o aparelho no carregador. A parada automática por bateria fraca está disponível só em navegadores Chromium, então no Safari fique de olho na porcentagem você mesmo.

Quer saber como os outros navegadores se comportam? Consulte a [tabela de suporte por navegador](/pt-br/learn/matriz-suporte-navegadores).
