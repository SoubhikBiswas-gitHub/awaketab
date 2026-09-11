import type { ILocaleHomeCopy } from './types';

export const ptBr: ILocaleHomeCopy = {
  whatItDoes: [
    'O AwakeTab usa a API Wake Lock do navegador enquanto esta aba está visível, e o status só diz que a tela está acordada depois que o navegador confirma o bloqueio. Escolha uma duração — de 15 minutos a 4 horas, uma duração personalizada de até sete dias, ou um horário de término — e a tela deixa de escurecer, suspender e exibir a tela de bloqueio. O indicador mostra Tela ligada somente enquanto o navegador está de fato mantendo o bloqueio. Oculte esta aba e o navegador retoma o bloqueio, então o indicador muda para Pausado — aba oculta e o temporizador para até você voltar.',
    'Não é preciso conta, download nem extensão: a ferramenta inteira é esta página. As configurações, a sessão atual e sete dias de estatísticas ficam guardados neste navegador. Nada é enviado, a menos que você deixe ativada a telemetria opcional de uso. Esta página não carrega scripts de terceiros nem fontes web, por isso continua rápida no celular e funciona offline depois da primeira visita. O cabeçalho oferece uma opção de instalação caso você queira colocá-la na tela de início ou no dock; o aplicativo instalado pode tocar um sinal sonoro e notificar quando uma sessão terminar.',
  ],
  howItWorks: [
    'Você escolhe uma duração. Um tempo predefinido, uma duração personalizada ou um horário de término inicia uma sessão. As mesmas opções cabem em uma única tecla: de 1 a 6 para os tempos predefinidos, 0 para nenhum horário de término, U para um horário de término e Espaço para iniciar ou parar.',
    'O navegador recebe um pedido de Wake Lock de tela. O AwakeTab chama a Screen Wake Lock API — o mesmo mecanismo usado por um player de vídeo. O navegador pode aceitar, recusar ou retomar o bloqueio mais tarde; as três respostas aparecem assim que acontecem.',
    'O temporizador segue o bloqueio, não o relógio. A contagem regressiva só avança enquanto o bloqueio está ativo, e cada cálculo usa o horário do sistema, então um notebook que foi suspenso volta com um número honesto. Quando o tempo acaba, você ouve um sinal sonoro e pode escolher estender ou parar.',
  ],
  honestLimits: [
    'Uma aba oculta não consegue manter um Wake Lock. Trocar de aplicativo, minimizar ou mudar de aba pausa a sessão. Essa é uma regra da plataforma. Para manter a tela ligada atrás de outras janelas, use a extensão do AwakeTab para Chrome e Edge.',
    'Fechar a tampa do notebook ainda coloca o computador para dormir. Nenhuma página web ou extensão pode mudar isso. É preciso uma configuração do sistema operacional, um monitor externo ou uma ferramenta nativa.',
    'A economia de bateria sempre vence. O Modo de Pouca Energia do iPhone força o Bloqueio Automático em 30 segundos; a economia de bateria do Android e do Windows pode recusar o pedido. O indicador mostra Bloqueado — veja como corrigir, com a causa indicada.',
    'Ele não interfere no seu status de chat. A presença no Teams, Slack e Zoom segue o tempo de inatividade do teclado e do mouse, não a tela. Um Wake Lock não vai manter seu status como disponível, e o AwakeTab nunca simula uso do teclado ou do mouse para forjar isso.',
    'A suspensão da tela não é a suspensão do sistema. Um Wake Lock mantém a tela ligada. Em nossos testes, o Chromium no Windows também adiou a suspensão por inatividade; no macOS isso não aconteceu. Para manter o computador ligado com a tela desligada, use uma ferramenta nativa.',
    'Outros softwares seguem suas próprias regras. O logout automático de um banco, um aplicativo de monitoramento de provas, um monitor que se desliga ao perder o sinal ou uma política corporativa de bloqueio de tela estão todos fora do alcance de um Wake Lock.',
  ],
};
