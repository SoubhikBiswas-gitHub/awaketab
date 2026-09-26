---
title: "Manter a tela ligada no Windows 11 — AwakeTab"
description: "No Windows 11, Chrome 84+ e Edge 84+ seguram a tela numa aba visível. A economia de bateria nega o pedido e fechar a tampa suspende o notebook."
h1: "Manter a tela ligada no Windows 11 direto do navegador"
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
faq:
  - q: "Posso minimizar o Chrome e continuar trabalhando no Excel?"
    a: "Minimizado, não. Uma aba minimizada ou coberta por completo fica oculta, e o Windows recebe de volta o controle da tela; o indicador mostra “Pausado — aba oculta”. Deixe a janela do AwakeTab visível num canto ou use a janela flutuante do Chrome ou do Edge."
  - q: "Meu notebook corporativo apaga a tela mesmo com o AwakeTab. Por quê?"
    a: "Em PCs gerenciados, uma política da empresa pode bloquear a tela ou exigir login depois de alguns minutos. Isso é diferente do tempo limite de tela, e um Wake Lock não passa por cima de política corporativa nem de remoção do cartão inteligente."
  - q: "O AwakeTab me mantém disponível no Teams?"
    a: "Não. A presença no Teams, no Slack e no Zoom segue o uso do teclado e do mouse, não a tela acesa. O AwakeTab nunca simula movimentos de mouse ou teclas."
  - q: "O que é Modern Standby e por que ele importa?"
    a: "É o modo de espera moderno de muitos notebooks com Windows 11, controlado por drivers e firmware. O Wake Lock controla a tela, não esses estados de baixo consumo, então o comportamento pode variar de um modelo para outro."
honestLimit: "A economia de bateria do Windows nega o bloqueio, o Modern Standby tem peculiaridades próprias de firmware e fechar a tampa sempre suspende o notebook."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/modern-standby"
  - "/on/edge"
  - "/for/downloads"
  - "/for/presentations"
author: soubhik
published: 2026-09-26
---

## A resposta para o Windows 11

No Windows 11, o Chrome 84+ e o Edge 84+ aceitam o Wake Lock nativo enquanto a aba aparece na tela. Clique em iniciar; assim que surgir “Tela ligada”, o monitor deixa de apagar e de bloquear por inatividade enquanto a janela estiver à vista. Sem instalar programa e sem mexer nas configurações de energia. Limites: a economia de bateria nega o pedido, fechar a tampa suspende o notebook, e o Modern Standby é uma história à parte, decidida por firmware. Esta página sugere uma sessão de 1 hora.

## Navegadores testados no Windows 11

| Navegador | Versão mínima | Observação |
|---|---|---|
| Chrome | 84 | A aba precisa continuar visível; a economia de bateria pode negar |
| Edge | 84 | O Modo de eficiência pode afetar o bloqueio |
| Firefox | 126 | Versões antigas usam o vídeo alternativo após um toque |
| Opera | 70 | Base Chromium; a aba precisa continuar visível |

Última verificação: 9 de setembro de 2026.

## Configurando em um minuto

1. Ligue o notebook na tomada ou desative a Economia de bateria nas Configurações rápidas da barra de tarefas.
2. Abra o AwakeTab no Chrome ou no Edge e escolha a duração (1 h já vem sugerida).
3. Clique em iniciar ou aperte Espaço. Espere o indicador chegar a “Tela ligada”.
4. Vai usar outros programas? Encaixe a janela do AwakeTab num canto da tela, ou abra a “Janela flutuante”, que fica por cima das outras.

## O jeito do sistema, se você preferir

O tempo de tela do Windows 11 fica em Configurações → Sistema → Energia e bateria, na seção de tela e suspensão. Mudar ali vale para o computador todo e fica assim até você lembrar de voltar. Se a sua tela apaga depois de 1 minuto e a opção está travada, provavelmente é política da empresa — o guia [a tela do Windows 11 desliga depois de 1 minuto](/guides/windows-11-screen-turns-off-after-1-minute) explica.

## Economia de bateria, Modo de eficiência e Modern Standby

- **Economia de bateria do Windows**: recusa o pedido. O indicador mostra “Bloqueado — veja como corrigir”, e a solução é o carregador.
- **Modo de eficiência do Edge**: pode interferir no bloqueio; se notar pausas estranhas, experimente desativá-lo.
- **Modern Standby**: o Wake Lock mexe na tela, não nos estados de baixo consumo que o firmware decide. Detalhes em [Modern Standby e wake locks](/guides/modern-standby).

## O que o AwakeTab não faz no Windows

Ele não impede a suspensão com a tampa fechada, não segura a tela com o navegador minimizado e não muda seu status em apps de chat. Se o bloqueio for recusado, repetir o clique sem mudar a energia ou a visibilidade só repete a recusa: leia o motivo e corrija a causa.

Usando o PC para baixar arquivos grandes? Veja [manter o PC ligado durante downloads](/pt-br/for/downloads).
