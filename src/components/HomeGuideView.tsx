import React from 'react';
import { 
  Zap, 
  QrCode, 
  MessageSquare, 
  Sliders, 
  Users, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  Building2
} from 'lucide-react';
import { ActiveTab, WhatsappStatus, WorkspaceInfo } from '../types';

interface HomeGuideViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  waStatus: WhatsappStatus;
  contactsCount: number;
  messageVariationsCount: number;
  currentWorkspace?: WorkspaceInfo | null;
}

export const HomeGuideView: React.FC<HomeGuideViewProps> = ({
  setActiveTab,
  waStatus,
  contactsCount,
  messageVariationsCount,
  currentWorkspace
}) => {
  const isConnected = waStatus.status === 'connected';
  const hasMessages = messageVariationsCount > 0;
  const hasContacts = contactsCount > 0;

  const steps = [
    {
      step: 1,
      id: 'connection' as ActiveTab,
      title: 'Conectar WhatsApp',
      icon: QrCode,
      description: 'Conecte o número do seu robô escaneando o QR Code na aba de conexão. A sessão fica ativa de forma segura.',
      isReady: isConnected,
      statusLabel: isConnected ? 'WhatsApp Conectado' : 'Aguardando Conexão',
      actionText: isConnected ? 'Ver Conexão' : 'Conectar Agora'
    },
    {
      step: 2,
      id: 'messages' as ActiveTab,
      title: 'Mensagens & Anexos',
      icon: MessageSquare,
      description: 'Escreva variações de texto com IA ou variáveis ({nome}, {var1}) e adicione imagens ou arquivos PDF.',
      isReady: hasMessages,
      statusLabel: `${messageVariationsCount} variação(ões) cadastrada(s)`,
      actionText: 'Configurar Mensagens'
    },
    {
      step: 3,
      id: 'settings' as ActiveTab,
      title: 'Atraso e Lotes (Anti-Bloqueio)',
      icon: Sliders,
      description: 'Ajuste os intervalos entre cada mensagem (ex: 15s a 30s) e pausa em lotes para proteger o chip do WhatsApp.',
      isReady: true,
      statusLabel: 'Intervalos & Pausas Configurados',
      actionText: 'Ajustar Intervalos'
    },
    {
      step: 4,
      id: 'contacts' as ActiveTab,
      title: 'Importar Lista de Contatos',
      icon: Users,
      description: 'Cole números de telefone ou envie uma planilha Excel (.xlsx/csv) com os nomes e dados dos clientes.',
      isReady: hasContacts,
      statusLabel: `${contactsCount} contato(s) na lista`,
      actionText: 'Gerenciar Contatos'
    },
    {
      step: 5,
      id: 'send' as ActiveTab,
      title: 'Iniciar Envio & Logs',
      icon: Send,
      description: 'Dispare a campanha em lote e acompanhe o progresso mensagem por mensagem com logs detalhados em tempo real.',
      isReady: isConnected && hasMessages && hasContacts,
      statusLabel: (isConnected && hasMessages && hasContacts) ? 'Pronto para Envio!' : 'Aguardando etapas anteriores',
      actionText: 'Ir para Painel de Envio'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Welcome Header */}
      <div className="bg-surface-container border border-outline-variant/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-primary/20" />
              <span>Painel de Automação R9Bot</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Como funciona o Robô de Disparos?
            </h2>

            <p className="text-on-surface-variant text-sm leading-relaxed">
              Bem-vindo ao workspace <strong className="text-primary font-bold">{currentWorkspace?.name || 'R9Bot'}</strong>. Siga o passo a passo de 5 etapas abaixo para configurar suas mensagens, importar sua lista e iniciar o disparo automatizado com segurança.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Workflow Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>Passo a Passo de Operação</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step}
                className={`bg-surface-container border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-primary/50 group relative ${
                  item.isReady ? 'border-outline-variant' : 'border-outline-variant/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary font-extrabold text-xs flex items-center justify-center">
                        {item.step}
                      </span>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>

                    {item.isReady ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Pronto</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant text-[10px] font-semibold text-on-surface-variant">
                        <span>Pendente</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-on-surface-variant truncate">
                    {item.statusLabel}
                  </span>

                  <button
                    onClick={() => setActiveTab(item.id)}
                    className="px-3 py-1.5 bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary border border-outline-variant rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Anti-blocking recommendations banner */}
      <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant space-y-3 text-xs">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span>Boas Práticas de Envio Anti-Bloqueio</span>
        </div>
        <p className="text-on-surface-variant text-xs leading-relaxed">
          Para garantir máxima taxa de entrega e evitar bloqueios pelo WhatsApp, recomendamos cadastrar pelo menos <strong>2 a 3 variações de texto</strong> (com spintax e saudações variadas) e manter o tempo de atraso entre <strong>15 a 30 segundos</strong> por mensagem com pausas programadas por lote.
        </p>
      </div>
    </div>
  );
};
