---
title: "Manter a tela ligada no Windows 11 e 10 — AwakeTab"
description: "No Windows 11 e 10, Chrome 84+ e Edge 84+ seguram a tela numa aba visível. Minimizar libera o bloqueio e fechar a tampa suspende o notebook."
h1: "Manter a tela ligada no Windows 11 e 10 direto do navegador"
ogTitle: "Tela ligada no Windows 11"
intent: "manter tela ligada windows 11"
secondaryQueries: ["impedir que a tela desligue windows 11", "windows 11 tela apaga sozinha", "tela sempre ligada windows 11 sem programa", "desativar desligamento da tela windows 11"]
preset: p60
mode: standard
locale: pt-br
reviewed: false
translationOf: "windows-11"
lastVerified: 2026-09-09
browsers: ["chrome", "edge"]
os: ["windows"]
crumb: "Windows 11"
lead: "No Windows 11, o Chrome 84+ e o Edge 84+ aceitam o Wake Lock nativo enquanto a aba aparece na tela. Clique em iniciar; assim que surgir “Tela ligada”, o monitor deixa de apagar e de bloquear por inatividade enquanto a janela estiver à vista. Enquanto isso, o Windows também não entra em suspensão por inatividade. Sem instalar programa e sem mexer nas configurações de energia; os mesmos passos valem para o Windows 10. Limites: minimizar o navegador libera o bloqueio, fechar a tampa suspende o notebook, e o Modern Standby é uma história à parte, decidida por firmware. Esta página sugere uma sessão de 1 hora."
facts:
  - label: "Chrome e Edge"
    value: "84 ou posterior"
  - label: "Firefox"
    value: "126 ou posterior"
  - label: "Opera"
    value: "70 ou posterior"
toc:
  economia-de-energia-modo-de-eficiência-e-modern-standby: "Economia de energia e Modern Standby"
steps:
  - title: "Abra o AwakeTab no Chrome ou no Edge e escolha a duração"
    text: "1 h já vem sugerida. Em sessões longas, ligue o notebook na tomada."
    shot: "o AwakeTab no Edge no Windows 11 com a duração escolhida"
  - title: "Clique em iniciar ou aperte Espaço"
    text: "Espere o indicador chegar a “Tela ligada”."
    shot: "o indicador do AwakeTab com a sessão ativa"
  - title: "Vai usar outros programas?"
    text: "Encaixe a janela do AwakeTab num canto da tela, ou abra a “Janela flutuante”, que fica por cima das outras."
    shot: "a janela do AwakeTab num canto da tela"
matrix:
  label: "Navegadores no Windows 11 e 10, conferido em 26 de setembro de 2026"
  cols: ["Navegador", "Resultado", "Observação"]
  rows:
    - what: "Chrome 84 ou posterior"
      result: works
      label: "Compatível"
      text: "A aba precisa continuar visível"
    - what: "Edge 84 ou posterior"
      result: works
      label: "Compatível"
      text: "Base Chromium; o Modo de eficiência não recusa o bloqueio"
    - what: "Firefox 126 ou posterior"
      result: works
      label: "Compatível"
      text: "Versões antigas usam o vídeo alternativo após um toque"
    - what: "Opera 70 ou posterior"
      result: works
      label: "Compatível"
      text: "Base Chromium; a aba precisa continuar visível"
rows:
  blockers:
    - title: "Economia de energia do Windows"
      text: "No Windows 11 24H2, a Economia de bateria passou a se chamar Economia de energia (“Energy saver”). Ela pode escurecer a tela, mas não faz o navegador recusar o Wake Lock: o Chromium não verifica esse modo (código-fonte conferido em 26 de setembro de 2026)."
    - title: "Modo de eficiência do Edge"
      text: "Também não recusa o bloqueio, porque o Edge usa o mesmo código do Chromium."
    - title: "Modern Standby"
      text: "O Wake Lock mexe na tela, não nos estados de baixo consumo que o firmware decide."
faq:
  - q: "Posso minimizar o Chrome e continuar trabalhando no Excel?"
    a: "Minimizado, não. Uma aba minimizada ou coberta por completo fica oculta, e o Windows recebe de volta o controle da tela; o indicador mostra “Pausado — aba oculta”. Deixe a janela do AwakeTab visível num canto ou use a janela flutuante do Chrome, do Edge ou do Firefox 151+."
  - q: "Meu notebook corporativo apaga a tela mesmo com o AwakeTab. Por quê?"
    a: "Em PCs gerenciados, uma política da empresa pode bloquear a tela ou exigir login depois de alguns minutos. Isso é diferente do tempo limite de tela, e um Wake Lock não passa por cima de política corporativa nem de remoção do cartão inteligente."
  - q: "O AwakeTab me mantém disponível no Teams?"
    a: "Não. A presença no Teams, no Slack e no Zoom segue o uso do teclado e do mouse, não a tela acesa. O AwakeTab nunca simula movimentos de mouse ou teclas."
  - q: "O que é Modern Standby e por que ele importa?"
    a: "É o modo de espera moderno de muitos notebooks com Windows 11, controlado por drivers e firmware. O Wake Lock controla a tela, não esses estados de baixo consumo, então o comportamento pode variar de um modelo para outro."
honestLimit: "Minimizar o navegador libera o bloqueio, o Modern Standby tem peculiaridades próprias de firmware e fechar a tampa suspende o notebook, a menos que você mude a ação da tampa no Windows."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/lock-screen-vs-sleep"
  - "/on/edge"
  - "/for/downloads"
  - "/for/presentations"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## Configurando em um minuto

::steps

::ad

## Navegadores no Windows 11 e 10

Conferido na documentação dos navegadores em 26 de setembro de 2026.

::matrix

## Economia de energia, Modo de eficiência e Modern Standby

::rows blockers

## O jeito do sistema, se você preferir

O tempo de tela do Windows 11 fica em Configurações → Sistema → Energia e bateria, na seção de tela e suspensão. Mudar ali vale para o computador todo e fica assim até você lembrar de voltar. Se a tela apaga 1 minuto depois que você bloqueia o PC, isso é um padrão do Windows para a tela de bloqueio, separado do tempo limite normal; o guia [a tela do Windows 11 desliga depois de 1 minuto](/guides/windows-11-screen-turns-off-after-1-minute) explica como mudar.

## O que o AwakeTab não faz no Windows

Ele não impede a suspensão com a tampa fechada, não segura a tela com o navegador minimizado e não muda seu status em apps de chat. Se o bloqueio for recusado, repetir o clique sem mudar a visibilidade ou a causa mostrada só repete a recusa: leia o motivo e corrija a causa.

Usando o PC para baixar arquivos grandes? Veja [manter o PC ligado durante downloads](/pt-br/for/downloads).
