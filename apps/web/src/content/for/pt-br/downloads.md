---
title: "Tela ligada durante downloads — AwakeTab"
description: "O AwakeTab mantém a tela ligada numa aba visível durante downloads longos e, no Chrome ou Edge, evita a suspensão por inatividade. Tampa fechada suspende."
h1: "Tela ligada durante downloads: o que dá e o que não dá para garantir"
ogTitle: "Tela ligada durante downloads"
intent: "manter pc ligado durante download"
secondaryQueries: ["impedir que o computador suspenda durante download", "notebook desliga no meio do download", "manter tela ligada download", "download para quando a tela apaga"]
preset: pinf
mode: standard
locale: pt-br
reviewed: false
translationOf: "downloads"
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Posso minimizar o navegador e deixar o download correndo?"
    a: "Pode, mas o AwakeTab para de segurar a tela. Minimizar ou esconder a aba libera o bloqueio, e o indicador muda para “Pausado — aba oculta”. Deixe a aba do AwakeTab visível, mesmo que pequena, numa janela ao lado do gerenciador de downloads."
  - q: "No Windows, o computador também deixa de entrar em suspensão?"
    a: "Sim, enquanto a tela estiver ligada: Chrome e Edge pedem ao Windows para manter a tela acesa, e com isso ele não suspende por inatividade, segundo a documentação da Microsoft. O mesmo vale para o macOS, segundo a Apple. Para manter o computador acordado com a tela apagada, use uma ferramenta nativa ou o nível Sistema da extensão."
  - q: "Se eu fechar a tampa do notebook, o download continua?"
    a: "Não conte com isso. Fechar a tampa coloca o notebook para dormir (no Mac, exceto no modo tampa fechada com energia e monitor externo), e nenhuma página web ou extensão muda essa regra. Para baixar com a tampa fechada, você precisa de uma configuração do sistema ou de um monitor externo."
  - q: "Isso mantém meu status do Teams ou do Slack como disponível?"
    a: "Não. A presença nesses apps segue o uso do teclado e do mouse, não a tela. O AwakeTab nunca mexe o mouse nem simula teclas, então seu status vai para ausente normalmente."
honestLimit: "O AwakeTab mantém a tela ligada e, no Chrome e no Edge com Windows ou macOS, isso também evita a suspensão por inatividade enquanto a aba está visível. Fechar a tampa ainda suspende o notebook."
related:
  - "/for/work-laptop"
  - "/on/windows-11"
  - "/on/macos"
  - "/vs/caffeine"
  - "/for/night-clock"
author: soubhik
published: 2026-09-26
updated: 2026-09-27
---

## O que dá e o que não dá para garantir

Uma cópia grande trava quando o notebook dorme no meio do caminho. O AwakeTab mantém a **tela** ligada enquanto a aba dele estiver visível. Enquanto a tela fica ligada, nem o Windows nem o macOS entram em suspensão por inatividade, segundo a documentação da Microsoft e da Apple (conferida em 26 de setembro de 2026). A ferramenta já abre em “∞”, sem prazo para acabar: download grande não avisa quando termina.

## Como deixar o download seguro

1. Ligue o notebook na tomada se o download for longo. A economia de energia do Windows (“Energy saver”, antes Economia de bateria) não recusa o bloqueio, mas pode escurecer a tela.
2. Abra o AwakeTab numa janela própria e deixe-a visível num canto da tela, ao lado do cliente de download, da loja de jogos ou do gerenciador de arquivos.
3. Toque em iniciar e espere o indicador dizer “Tela ligada”. A partir daí, o navegador confirmou o bloqueio.
4. Não minimize a janela do AwakeTab. Se ela ficar oculta, o bloqueio é liberado e só volta quando você trouxer a aba para frente.

## Tela ligada não é o mesmo que computador acordado

Muita gente pesquisa “impedir que o computador durma” achando que é tudo a mesma coisa. Não é. Um Wake Lock de tela impede que o monitor apague e bloqueie; ele não é uma chave geral de energia. Enquanto ele segura a tela, o Windows e o macOS não suspendem por inatividade; o que ele não faz é manter o computador acordado com a tela apagada. No Windows 11, os tempos de tela e de suspensão ficam em Configurações → Sistema → Energia e bateria. No Mac, em Ajustes do Sistema → Tela Bloqueada e nos ajustes de bateria ou energia. Se você precisa do Mac acordado com a tela apagada, use uma ferramenta nativa, como o comando `caffeinate` ou o app Caffeine — veja a comparação em [AwakeTab vs Caffeine](/pt-br/vs/caffeine).

Detalhes por sistema:

- **Windows 11**: Chrome 84+ e Edge 84+ seguram a tela nativamente. O passo a passo está em [manter a tela ligada no Windows 11](/pt-br/on/windows-11).
- **macOS**: Safari 16.4+, Chrome 84+ e Firefox 126+ seguram a tela, e enquanto isso o Mac não entra em repouso por inatividade. Para conferir, rode `pmset -g assertions` no Terminal.
- **Qualquer notebook**: fechar a tampa suspende. A exceção é o modo tampa fechada do Mac, com energia e monitor externo.

## O que conferir antes de sair de perto

Confirme que a página abriu em HTTPS, que a janela do AwakeTab está na frente e que o indicador diz “Tela ligada”. Não confie no ícone do seu chat nem num relógio de tela escurecendo. Se o navegador recusar, leia o motivo mostrado e corrija a causa em vez de apertar iniciar de novo: repetir sem mudar nada gera a mesma recusa.

## Downloads que atravessam a madrugada

Uma tela acesa a noite toda gasta energia e esquenta o notebook. Deixe-o na tomada e em superfície ventilada. Em navegadores Chromium, a opção “Parar automaticamente com bateria fraca” encerra a sessão num limite que você escolhe; outros navegadores podem não oferecer isso. Se o seu caso é deixar o computador trabalhando com a tela desligada, esta aba não é a ferramenta certa.
