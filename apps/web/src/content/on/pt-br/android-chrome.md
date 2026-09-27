---
title: "Manter a tela do Android ligada no Chrome — AwakeTab"
description: "No Android, o Chrome 84+ segura a tela numa aba visível. Sair do Chrome libera o bloqueio até você voltar, e apps em suspensão podem fechar a aba."
h1: "Manter a tela do Android ligada pelo Chrome"
ogTitle: "Tela do Android ligada no Chrome"
intent: "manter tela ligada android chrome"
secondaryQueries: ["tela do celular apaga sozinha android", "impedir que a tela desligue android", "android tela sempre ligada sem app", "não deixar a tela apagar celular"]
preset: p30
mode: standard
locale: pt-br
reviewed: false
translationOf: "android-chrome"
lastVerified: 2026-09-09
browsers: ["chrome"]
os: ["android"]
faq:
  - q: "Se eu abrir o YouTube ou outro app, a tela continua ligada?"
    a: "Não pelo AwakeTab. Quando o Chrome vai para segundo plano, o bloqueio é liberado e o indicador mostra “Pausado — aba oculta”. Volte para a aba e o AwakeTab pede o bloqueio de novo. Com a tela dividida, os dois ficam visíveis ao mesmo tempo."
  - q: "Aparece “Bloqueado — veja como corrigir”. O que é?"
    a: "Na maioria das vezes a aba não estava visível quando o AwakeTab pediu o bloqueio, ou a página está dentro de um quadro (iframe) sem permissão; o motivo aparece embaixo do indicador. A Economia de bateria não é a causa: o Chrome não recusa o Wake Lock por causa dela."
  - q: "Meu Samsung ou Xiaomi fecha o Chrome depois de um tempo. Por quê?"
    a: "Algumas fabricantes têm listas de apps colocados em suspensão ou otimização agressiva de bateria. Elas podem encerrar a aba depois que você sai do Chrome. Tire o Chrome dessas listas nas configurações de bateria do aparelho."
  - q: "Preciso instalar algum app para a tela não apagar?"
    a: "Não. O Chrome 84 ou posterior já tem Wake Lock nativo. O Samsung Internet 14+ e o Firefox 126+ também funcionam. Em navegador sem suporte, o AwakeTab oferece o vídeo alternativo, que precisa de um toque e gasta mais bateria."
honestLimit: "Sair do Chrome libera o bloqueio, a Economia de bateria pode encurtar o tempo limite ou escurecer a tela, e as configurações de apps em suspensão de algumas fabricantes podem encerrar a aba."
related:
  - "/on/samsung-internet"
  - "/guides/android-screen-timeout-one-app"
  - "/for/cooking"
  - "/on/firefox"
  - "/learn/browser-support-matrix"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## O que funciona no Android

O Chrome 84 ou posterior no Android aceita o pedido de Wake Lock de qualquer aba que esteja à vista. Inicie o AwakeTab e espere o “Tela ligada”; daí em diante o celular não escurece enquanto o Chrome mostrar essa aba. Não precisa instalar app nenhum. Duas coisas podem atrapalhar: sair do Chrome libera o bloqueio, e listas de “apps em suspensão” de algumas fabricantes podem encerrar a aba depois que você sai. A Economia de bateria pode escurecer a tela, mas o Chrome não recusa o pedido por causa dela. Esta página sugere 30 minutos.

## Versões e navegadores no Android

| Navegador | Versão mínima | Mecanismo |
|---|---|---|
| Chrome | 84 | Wake Lock nativo |
| Samsung Internet | 14 | Wake Lock nativo |
| Firefox | 126 | Wake Lock nativo |
| Opera | 70 | Wake Lock nativo (base Chromium) |
| Versões mais antigas | — | Vídeo alternativo, com um toque seu |

Conferido na documentação dos navegadores em 26 de setembro de 2026.

## Configurando no celular

1. Para sessões longas, ligue o celular no carregador.
2. Abra o AwakeTab no Chrome e escolha a duração.
3. Inicie a sessão e aguarde “Tela ligada” aparecer no indicador; antes disso ele mostra “Iniciando…”.
4. Precisa ver outra coisa ao mesmo tempo? Use a tela dividida com o AwakeTab numa metade. Assim a aba continua visível.

## Mudando o tempo de tela do próprio Android

Se preferir mexer no sistema, o caminho padrão é Configurações → Tela → Tempo limite da tela (no Pixel: Configurações → Tela e toque). O nome exato muda um pouco conforme a marca. O problema é que essa opção vale para o celular inteiro, não só para um app — o Android puro não tem tempo de tela por app. O AwakeTab cobre só o navegador, mas volta ao normal sozinho quando a sessão termina.

## Economia de bateria e fabricantes

- **Economia de bateria**: o Chrome não recusa o Wake Lock por causa dela (segundo o código-fonte do Chromium, conferido em 26 de setembro de 2026), mas ela pode encurtar o tempo limite ou escurecer a tela. Se aparecer “Bloqueado — veja como corrigir”, o AwakeTab mostra a causa real.
- **Apps em suspensão**: Samsung, Xiaomi e outras marcas podem colocar o Chrome para dormir depois que você o deixa em segundo plano. Se a sessão sumir sozinha, confira essas listas nas configurações de bateria.
- **Tela dividida**: se o AwakeTab ocupar uma das metades, ele continua visível e segura o bloqueio; se ficar só na lista de apps recentes, não.
- **Parada por bateria fraca**: no Chrome, as Configurações do AwakeTab têm “Parar automaticamente com bateria fraca”, com o limite que você escolher.

## Quando não esperar milagre

O AwakeTab não segura a tela com o Chrome em segundo plano, com o celular bloqueado pelo botão ou com o app minimizado. Ele também não mantém seu status verde no Teams ou no Slack: a presença segue toques e teclado, e o AwakeTab nunca simula entrada. Para o iPhone, o caminho é outro — veja [o guia do Safari no iPhone](/pt-br/on/iphone-safari).
