---
title: "Bloqueio Automático Nunca em cinza no iPhone — AwakeTab"
description: "A opção Nunca do Bloqueio Automático fica em cinza com o Modo de Pouca Energia ativo. Desative-o primeiro; depois o Safari 16.4+ pode segurar a tela."
h1: "Bloqueio Automático do iPhone com Nunca em cinza: como resolver"
ogTitle: "Bloqueio Automático em cinza no iPhone"
intent: "bloqueio automático nunca cinza iphone"
secondaryQueries: ["não consigo colocar bloqueio automático em nunca", "bloqueio automático travado em 30 segundos", "iphone tela apaga em 30 segundos", "modo de pouca energia bloqueio automático", "opção nunca não aparece iphone"]
preset: p30
mode: standard
locale: pt-br
reviewed: false
translationOf: "iphone-auto-lock-never-greyed-out"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Por que o Bloqueio Automático volta sozinho para 30 segundos?"
    a: "Porque o Modo de Pouca Energia está ativo. Enquanto ele estiver ligado, o iOS trava o Bloqueio Automático em 30 segundos e deixa Nunca em cinza. Desative o modo em Ajustes → Bateria e o menu volta ao normal."
  - q: "O AwakeTab consegue passar por cima do Modo de Pouca Energia?"
    a: "Não. Com o Modo de Pouca Energia ligado, o iOS vence qualquer site, inclusive o AwakeTab. Primeiro desative o modo e recarregue a página; só então o Safari 16.4+ pode conceder o bloqueio da tela."
  - q: "Com o AwakeTab ativo, posso ir para outro app e a tela continua acesa?"
    a: "Não. Trocar de app ou de aba libera o bloqueio na hora. O indicador muda para “Pausado — aba oculta” e só volta a “Tela ligada” quando você retorna para a aba do AwakeTab no Safari."
  - q: "Vale mais a pena deixar o Bloqueio Automático em Nunca ou usar o AwakeTab?"
    a: "Nunca vale para o iPhone inteiro até você lembrar de mudar de volta, e esquecer isso gasta bateria. O AwakeTab segura a tela só durante a sessão que você escolheu e depois devolve o controle ao iOS."
honestLimit: "O Modo de Pouca Energia deixa Nunca em cinza e força o Bloqueio Automático em 30 segundos. Até ele ser desativado, até o AwakeTab é ignorado pelo iOS."
related:
  - "/on/iphone-safari"
  - "/on/ios-home-screen"
  - "/learn/low-power-mode-and-wake-locks"
  - "/for/cooking"
  - "/for/downloads"
author: soubhik
published: 2026-09-26
---

## Por que o Nunca fica em cinza

Se você abre Ajustes → Tela e Brilho → Bloqueio Automático e a opção Nunca está apagada, sem responder ao toque, a causa quase sempre é o Modo de Pouca Energia. Ele é ativado por você ou sugerido pelo iPhone quando a bateria cai bastante, e enquanto estiver ligado trava o Bloqueio Automático em 30 segundos. A solução é desativar o Modo de Pouca Energia primeiro. Depois disso, você pode escolher Nunca — ou deixar o sistema como está e usar o Safari 16.4+ com o AwakeTab, que segura a tela até você sair da aba.

## Passo a passo para liberar a opção Nunca

1. Abra **Ajustes → Bateria**.
2. Desative **Modo de Pouca Energia**. O ícone da bateria deixa de ficar amarelo.
3. Volte para **Ajustes → Tela e Brilho → Bloqueio Automático**.
4. Agora a opção **Nunca** deve responder ao toque. Escolha-a se quiser que a tela nunca apague sozinha.

Se a bateria estiver muito baixa, o iPhone pode sugerir o Modo de Pouca Energia de novo. Ligue o aparelho no carregador para não cair no mesmo ciclo.

## Se continuar em cinza

- **O Modo de Pouca Energia voltou**: confira outra vez em Ajustes → Bateria. Ele pode ter sido reativado por um atalho ou pela Central de Controle.
- **Bateria quase no fim**: carregue um pouco antes de insistir.
- **O problema é só o tempo, não o Nunca**: talvez você não precise mudar nada no sistema. Veja a próxima seção.

## Ou pule os ajustes: use o AwakeTab no Safari

Mudar o Bloqueio Automático para Nunca vale para o iPhone inteiro, e é fácil esquecer de voltar. Se você só precisa da tela acesa durante uma receita, uma partitura ou um treino, abra o AwakeTab no Safari, toque em iniciar e confira o indicador:

- **“Tela ligada”**: o Safari confirmou o bloqueio; a tela fica acesa enquanto a aba estiver na frente.
- **“Bloqueado — veja como corrigir”**: o Modo de Pouca Energia ainda está ligado. O próprio AwakeTab avisa: “Desative-o em Ajustes → Bateria e recarregue a página.”
- **“Pausado — aba oculta”**: você saiu do Safari ou trocou de aba. Volte e o pedido é refeito.

O Wake Lock no Safari existe desde o iOS 16.4. Como app adicionado à Tela de Início, ele precisa do iOS 18.4 ou posterior. Em versões mais antigas, o AwakeTab oferece o vídeo alternativo, que depende de um toque seu e consome mais bateria. O guia completo do navegador está em [manter a tela do iPhone ligada no Safari](/pt-br/on/iphone-safari).

## Um aviso sobre bateria

Tela acesa por horas esquenta o iPhone e acaba com a carga. O Modo de Pouca Energia existe justamente para isso, então só desative-o quando o aparelho estiver no carregador ou com carga de sobra. No Safari não há parada automática por bateria fraca — ela só existe em navegadores Chromium —, então fique de olho na porcentagem. Dados verificados em 9 de setembro de 2026.
