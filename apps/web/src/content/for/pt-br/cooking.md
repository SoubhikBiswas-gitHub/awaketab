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
faq:
  - q: "Se eu abrir o app de receitas ou o WhatsApp, a tela continua ligada?"
    a: "Não. Quando você troca de app ou a aba fica oculta, o navegador libera o bloqueio e o indicador passa para “Pausado — aba oculta”. Volte para a aba do AwakeTab e espere aparecer “Tela ligada” de novo antes de voltar para a panela."
  - q: "Minha receita está em outro site. Preciso abrir tudo dentro do AwakeTab?"
    a: "Não, mas o AwakeTab precisa continuar visível. No tablet ou no Android, use a tela dividida com a receita de um lado e o AwakeTab do outro. No computador, abra uma segunda janela lado a lado."
  - q: "Posso encostar na tela com a mão suja de farinha?"
    a: "No modo Cozinha, um toque em qualquer lugar pausa a sessão, e o indicador mostra isso. Se você pausar sem querer, toque de novo para retomar. Com o celular longe do fogão, a tela fica ligada sem você precisar mexer nela."
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
---

## A resposta curta

Você está no meio da receita, com a mão cheia de massa, e a tela do celular escurece. O AwakeTab resolve isso sem instalar nada: ele pede ao navegador um Wake Lock (o recurso que impede a tela de apagar) e segura a tela acesa enquanto a aba dele fica visível — sozinha, ao lado da receita em tela dividida ou numa janela vizinha. Esta página já abre a ferramenta no modo Cozinha e sem horário de término (“∞”), porque ninguém sabe quanto tempo o feijão vai levar.

## Montando na cozinha em 30 segundos

1. Deixe o celular ou tablet na tomada, se puder. Uma tela acesa por uma hora gasta bateria.
2. Toque em iniciar e confira o indicador. Só quando ele mostrar “Tela ligada” é que o navegador confirmou o bloqueio.
3. Se a receita estiver em outro site ou app, coloque os dois lado a lado. No Android e no iPad, a tela dividida resolve; no computador, uma segunda janela.

No modo Cozinha, você também pode adicionar até três temporizadores com nome, como “arroz” ou “forno”, e um toque em qualquer lugar pausa a sessão.

## O que o indicador vai mostrar

- **“Tela ligada”**: o navegador está segurando o bloqueio de verdade. O cronômetro só anda neste estado.
- **“Pausado — aba oculta”**: você mudou de app ou de aba. É o comportamento esperado, não um defeito; volte para a aba e o bloqueio é pedido de novo.
- **“Bloqueado — veja como corrigir”**: o sistema recusou, quase sempre por causa da economia de bateria. Leia o motivo mostrado e resolva a causa antes de tocar em iniciar outra vez.
- **“Tela ligada por vídeo alternativo”**: seu navegador não tem Wake Lock nativo e você aceitou o vídeo silencioso, que consome mais bateria.

## Celular e tablet: o que o sistema pode atrapalhar

No iPhone, o Modo de Pouca Energia deixa a opção Nunca em cinza em Ajustes → Tela e Brilho → Bloqueio Automático e força a tela a apagar em 30 segundos; desative-o antes de começar. Veja [como deixar o iPhone com a tela acesa usando o Safari](/pt-br/on/iphone-safari).

No Android, o tempo limite fica em Configurações → Tela → Tempo limite da tela, e a Economia de bateria pode negar o pedido. Algumas marcas também têm listas de apps colocados em suspensão, que podem encerrar o navegador depois que você sai dele. Os detalhes estão [no passo a passo para Android e Chrome](/pt-br/on/android-chrome).

## Navegadores compatíveis

Na cozinha, o que costuma estar à mão é um celular ou tablet. No iPhone e no iPad, vale o Safari 16.4 ou mais novo. No Android, o Chrome desde a versão 84, o Samsung Internet desde a 14 e o Firefox desde a 126. Se você instalou o AwakeTab na Tela de Início do iPhone, o iOS precisa estar na versão 18.4 ou mais nova. Firefox antigo pode usar o vídeo alternativo, que só começa depois de um toque seu. Esses números foram conferidos em 9 de setembro de 2026.

## Antes de ir para o fogão

Não confie num relógio que está escurecendo — confie no indicador. Se ele diz “Tela ligada”, a receita não vai sumir enquanto a aba ficar na frente. Se você sair para responder uma mensagem, o bloqueio cai e volta quando você retornar. E lembre: o AwakeTab não é temporizador de segurança; não deixe o forno ligado confiando só na tela do celular.
