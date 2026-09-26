---
title: "Tela ligada durante downloads — AwakeTab"
description: "O AwakeTab mantém a tela ligada numa aba visível durante downloads longos. Se o PC também deixa de suspender depende do sistema; tampa fechada suspende."
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
    a: "Em nossos testes com Chromium no Windows, sim: a suspensão por inatividade também foi adiada. No macOS, não foi. O AwakeTab promete apenas a tela ligada; para o resto, use as opções de energia do sistema ou uma ferramenta nativa."
  - q: "Se eu fechar a tampa do notebook, o download continua?"
    a: "Não conte com isso. Fechar a tampa sempre coloca o notebook para dormir, e nenhuma página web ou extensão muda essa regra. Para baixar com a tampa fechada, você precisa de uma configuração do sistema ou de um monitor externo."
  - q: "Isso mantém meu status do Teams ou do Slack como disponível?"
    a: "Não. A presença nesses apps segue o uso do teclado e do mouse, não a tela. O AwakeTab nunca mexe o mouse nem simula teclas, então seu status vai para ausente normalmente."
honestLimit: "O AwakeTab mantém a tela ligada. Se a suspensão do sistema por inatividade também é adiada depende do sistema: em nossos testes, sim com Chromium no Windows; no macOS, não. Fechar a tampa sempre suspende."
related:
  - "/for/work-laptop"
  - "/on/windows-11"
  - "/on/macos"
  - "/vs/caffeine"
  - "/for/baby-monitor"
author: soubhik
published: 2026-09-26
---

## O que dá e o que não dá para garantir

Uma cópia grande trava quando o notebook dorme no meio do caminho. O AwakeTab mantém a **tela** ligada enquanto a aba dele estiver visível. Se o restante do computador também fica fora da suspensão por inatividade depende do sistema operacional, não desta página: em nossos testes, o Chromium no Windows também adiou a suspensão; no macOS, não. A ferramenta já abre em “∞”, sem prazo para acabar: download grande não avisa quando termina.

## Como deixar o download seguro

1. Ligue o notebook na tomada. A economia de bateria do Windows pode recusar o pedido, e o indicador mostra “Bloqueado — veja como corrigir”.
2. Abra o AwakeTab numa janela própria e deixe-a visível num canto da tela, ao lado do cliente de download, da loja de jogos ou do gerenciador de arquivos.
3. Toque em iniciar e espere o indicador dizer “Tela ligada”. A partir daí, o navegador confirmou o bloqueio.
4. Não minimize a janela do AwakeTab. Se ela ficar oculta, o bloqueio é liberado e só volta quando você trouxer a aba para frente.

## Tela ligada não é o mesmo que computador acordado

Muita gente pesquisa “impedir que o computador durma” achando que é tudo a mesma coisa. Não é. Um Wake Lock de tela impede que o monitor apague e bloqueie; ele não é uma chave geral de energia. No Windows 11, os tempos de tela e de suspensão ficam em Configurações → Sistema → Energia e bateria. No Mac, em Ajustes do Sistema → Tela Bloqueada e nos ajustes de bateria ou energia. Se você precisa do Mac acordado com a tela apagada, use uma ferramenta nativa, como o comando `caffeinate` ou o app Caffeine — veja a comparação em [AwakeTab vs Caffeine](/pt-br/vs/caffeine).

Detalhes por sistema:

- **Windows 11**: Chrome 84+ e Edge 84+ seguram a tela nativamente. O passo a passo está em [manter a tela ligada no Windows 11](/pt-br/on/windows-11).
- **macOS**: Safari 16.4+, Chrome 84+ e Firefox 126+ seguram a tela, mas o Mac pode suspender mesmo assim.
- **Qualquer notebook**: fechar a tampa suspende. Sempre.

## O que conferir antes de sair de perto

Confirme que a página abriu em HTTPS, que a janela do AwakeTab está na frente e que o indicador diz “Tela ligada”. Não confie no ícone do seu chat nem num relógio de tela escurecendo. Se o navegador recusar, leia o motivo mostrado e corrija a causa em vez de apertar iniciar de novo: repetir sem mudar nada gera a mesma recusa.

## Downloads que atravessam a madrugada

Uma tela acesa a noite toda gasta energia e esquenta o notebook. Deixe-o na tomada e em superfície ventilada. Em navegadores Chromium, a opção “Parar automaticamente com bateria fraca” encerra a sessão num limite que você escolhe; outros navegadores podem não oferecer isso. Se o seu caso é deixar o computador trabalhando com a tela desligada, esta aba não é a ferramenta certa.
