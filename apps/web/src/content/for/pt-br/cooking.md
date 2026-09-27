---
title: "Manter a tela ligada enquanto cozinha — AwakeTab"
description: "Receita no celular sem a tela apagar: o AwakeTab segura o Wake Lock enquanto a aba está visível. Abrir outro app libera o bloqueio até você voltar."
h1: "Mantenha a tela ligada enquanto cozinha"
intent: "manter tela ligada enquanto cozinha"
secondaryQueries: ["tela do celular apaga na receita", "não deixar a tela apagar cozinhando", "manter tela do tablet ligada receita", "tela sempre ligada na cozinha"]
preset: pinf
mode: cook
locale: pt-br
reviewed: false
translationOf: "cooking"
lastVerified: 2026-09-09
browsers: []
os: []
lead: "Você está no meio da receita, com a mão cheia de massa, e a tela do celular escurece. O AwakeTab resolve isso sem instalar nada: ele pede ao navegador um Wake Lock (o recurso que impede a tela de apagar) e segura a tela acesa enquanto a aba dele fica visível — sozinha, ao lado da receita em tela dividida ou numa janela vizinha. Esta página já abre a ferramenta no modo Cozinha e sem horário de término (“∞”), porque ninguém sabe quanto tempo o feijão vai levar."
crumb: "Cozinha"
toc:
  celular-e-tablet-o-que-o-sistema-pode-atrapalhar: "Celular e tablet"
steps:
  - title: "Deixe o celular ou tablet na tomada, se puder."
    text: "Uma tela acesa por uma hora gasta bateria."
  - title: "Toque em iniciar e confira o indicador."
    text: "Só quando ele mostrar “Tela ligada” é que o navegador confirmou o bloqueio."
  - title: "Se a receita estiver em outro site ou app, coloque os dois lado a lado."
    text: "Tela dividida no Android, apps em janelas no iPadOS 26 (Split View no iPadOS 18 ou anterior), uma segunda janela no computador. No iPhone, só um app fica na frente."
figures:
  - frame: phone
    label: "Captura do celular"
    alt: "o AwakeTab no modo Cozinha num iPhone"
    caption: "O modo Cozinha num iPhone."
  - frame: desktop
    label: "Captura do computador"
    alt: "a receita e o AwakeTab lado a lado em duas janelas no computador"
    caption: "A receita e o AwakeTab lado a lado em duas janelas no computador."
pills:
  - state: held
    text: "O navegador está segurando o bloqueio de verdade. O cronômetro só anda neste estado."
  - state: lost
    text: "Você mudou de app ou de aba. É o comportamento esperado, não um defeito; volte para a aba e o bloqueio é pedido de novo."
  - state: denied
    text: "O navegador recusou, quase sempre porque a aba não estava visível ou porque o Safari precisa de um toque antes (no Firefox, também com bateria em 5 % ou menos sem carregar). Resolva essa causa antes de tentar de novo."
  - state: fallback
    text: "Seu navegador não tem Wake Lock nativo e você aceitou o vídeo silencioso, que consome mais bateria."
faq:
  - q: "Se eu abrir o app de receitas ou o WhatsApp, a tela continua ligada?"
    a: "Não. Quando você troca de app ou a aba fica oculta, o navegador libera o bloqueio e o indicador passa para “Pausado — aba oculta”. Volte para a aba do AwakeTab e espere aparecer “Tela ligada” de novo antes de voltar para a panela."
  - q: "Minha receita está em outro site. Preciso abrir tudo dentro do AwakeTab?"
    a: "Não, mas o AwakeTab precisa continuar visível. No tablet, deixe a receita e o AwakeTab lado a lado (apps em janelas no iPadOS 26, Split View no iPadOS 18 ou anterior, tela dividida no Android). No iPhone só um app fica na frente, então o AwakeTab não mantém acesa uma receita aberta em outro app. No computador, use uma segunda janela."
  - q: "Posso encostar na tela com a mão suja de farinha?"
    a: "No modo Cozinha, tocar no número grande pausa a contagem, e a tela continua ligada. Se você pausar sem querer, toque de novo para retomar. Com o celular longe do fogão, a tela fica ligada sem você precisar mexer nela."
  - q: "Quais navegadores funcionam para cozinhar com o celular?"
    a: "Wake Lock nativo no Chrome 84+, Edge 84+, Firefox 126+, Safari 16.4+ e Samsung Internet 14+, conforme a tabela de 9 de setembro de 2026. Firefox mais antigo usa o vídeo alternativo depois de um toque."
honestLimit: "Funciona enquanto a aba do AwakeTab está na tela. No celular, abrir outro app — inclusive o da própria receita — libera o bloqueio até você voltar para a aba."
related:
  - "/for/reading"
  - "/for/workouts"
  - "/on/android-chrome"
  - "/on/iphone-safari"
  - "/guides/iphone-auto-lock-never-greyed-out"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Montando na cozinha em 30 segundos

::steps

::figures

::ad

## O que o indicador vai mostrar

No modo Cozinha, você também pode adicionar até três temporizadores de cozinha (5, 10, 15, 30 ou 60 min), cada um toca ao chegar a zero, e tocar no número grande pausa a contagem sem apagar a tela.

::pills

## Celular e tablet: o que o sistema pode atrapalhar

No iPhone, o Modo de Pouca Energia define o Bloqueio Automático em 30 segundos e deixa a opção Nunca em cinza em Ajustes → Tela e Brilho → Bloqueio Automático. O Safari não recusa o Wake Lock por causa dele, mas ainda não registramos um teste em aparelho que confirme se a tela fica acesa com o modo ligado; se ela apagar mesmo assim, desative-o em Ajustes → Bateria. Veja [como deixar o iPhone com a tela acesa usando o Safari](/pt-br/on/iphone-safari).

No Android, o tempo limite fica em Configurações → Tela → Tempo limite da tela (no Pixel: Tela e toque). A Economia de bateria pode encurtar esse tempo ou escurecer a tela, mas o Chrome não recusa o pedido por causa dela. Algumas marcas também têm listas de apps colocados em suspensão, que podem encerrar o navegador depois que você sai dele. Os detalhes estão [no passo a passo para Android e Chrome](/pt-br/on/android-chrome).

## Navegadores compatíveis

Na cozinha, o que costuma estar à mão é um celular ou tablet. No iPhone e no iPad, vale o Safari 16.4 ou mais novo. No Android, o Chrome desde a versão 84, o Samsung Internet desde a 14 e o Firefox desde a 126. Se você instalou o AwakeTab na Tela de Início do iPhone, o iOS precisa estar na versão 18.4 ou mais nova. Firefox antigo pode usar o vídeo alternativo, que só começa depois de um toque seu. Esses números seguem a documentação dos navegadores, conferida em 26 de setembro de 2026.

::limit

## Antes de ir para o fogão

Não confie num relógio que está escurecendo — confie no indicador. Se ele diz “Tela ligada”, a receita não vai sumir enquanto a aba ficar na frente. Se você sair para responder uma mensagem, o bloqueio cai e volta quando você retornar. E lembre: o AwakeTab não é temporizador de segurança; não deixe o forno ligado confiando só na tela do celular.
