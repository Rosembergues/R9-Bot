import React from 'react';
import { 
  QrCode, 
  Smartphone, 
  UserCheck, 
  LogOut, 
  Loader2, 
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { WhatsappStatus } from '../types';

interface ConnectionViewProps {
  waStatus: WhatsappStatus;
  handleConnect: (force?: boolean) => void;
  handleDisconnect: () => void;
  isConnectingLoading: boolean;
  setShowDisconnectConfirm: (show: boolean) => void;
}

export const ConnectionView: React.FC<ConnectionViewProps> = ({
  waStatus,
  handleConnect,
  isConnectingLoading,
  setShowDisconnectConfirm
}) => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Conexão WhatsApp (Baileys Engine)</h2>
          <p className="text-xs text-on-surface-variant">Conecte sua conta do WhatsApp via QR Code sem depender de APIs pagas de terceiros.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection QR / Active Status Column */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col items-center justify-between min-h-[440px] text-center relative">
          <div className="w-full flex items-center justify-between pb-3 border-b border-outline-variant/40 mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-on-surface">Canal de Comunicação</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold bg-surface-container px-2.5 py-1 rounded-md border border-outline-variant">
              AUTENTICAÇÃO MULTI-DEVICE
            </span>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center my-auto">
          {waStatus.status === 'disconnected' && (
            <div className="space-y-5 max-w-md py-4">
              <div className="mx-auto w-20 h-20 bg-surface-container text-on-surface-variant rounded-2xl flex items-center justify-center border border-outline-variant shadow-lg">
                <Smartphone className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Pronto para Conectar ao WhatsApp</h3>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  Inicie o processo para gerar o código QR de sincronização. A sessão ficará salva no servidor e reconectará automaticamente caso caia.
                </p>
              </div>
              <button
                onClick={() => handleConnect(false)}
                disabled={isConnectingLoading}
                className="bg-primary hover:brightness-110 text-on-primary font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                {isConnectingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                Gerar QR Code de Conexão
              </button>
            </div>
          )}

          {waStatus.status === 'connecting' && (
            <div className="space-y-4 max-w-sm py-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h3 className="font-bold text-on-surface text-base">Iniciando Servidor do WhatsApp...</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Carregando credenciais de sessão e sincronizando a biblioteca Baileys. Aguarde uns instantes.
              </p>
              <button
                onClick={() => handleConnect(true)}
                className="text-[11px] text-primary hover:underline bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant cursor-pointer mt-2"
              >
                Forçar reinicialização do QR Code
              </button>
            </div>
          )}

          {waStatus.status === 'qr' && (
            <div className="space-y-5 w-full flex flex-col items-center max-w-md py-4">
              <div className="bg-white p-3.5 rounded-2xl shadow-2xl cyan-glow border border-slate-200">
                {waStatus.qr ? (
                  <img 
                    src={waStatus.qr} 
                    alt="WhatsApp QR Code" 
                    className="w-48 h-48 aspect-square rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm">Escaneie o QR Code no WhatsApp do seu celular</h3>
                <div className="text-left text-xs text-on-surface-variant mt-3 space-y-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                  <p className="flex items-center gap-2"><span className="font-mono text-primary font-bold">1.</span> Abra o aplicativo WhatsApp</p>
                  <p className="flex items-center gap-2"><span className="font-mono text-primary font-bold">2.</span> Acesse Menu &gt; <strong className="text-on-surface">Aparelhos Conectados</strong></p>
                  <p className="flex items-center gap-2"><span className="font-mono text-primary font-bold">3.</span> Clique em <strong className="text-on-surface">Conectar um Aparelho</strong></p>
                  <p className="flex items-center gap-2"><span className="font-mono text-primary font-bold">4.</span> Aponte a câmera para a tela</p>
                </div>
              </div>
              <button
                onClick={() => handleConnect(true)}
                className="text-[11px] text-primary hover:underline bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant cursor-pointer"
              >
                QR expirou? Clique para gerar novo código
              </button>
            </div>
          )}

          {waStatus.status === 'connected' && (
            <div className="space-y-5 max-w-sm py-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg">
                <UserCheck className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-xl">Sessão Conectada com Sucesso!</h3>
                <p className="text-xs text-primary font-semibold mt-1">
                  {waStatus.user?.name ? `WhatsApp: ${waStatus.user.name}` : 'Aparelho vinculado e pronto.'}
                </p>
                <p className="text-[11px] font-mono text-on-surface-variant mt-1">
                  ID: {waStatus.user?.id || 'Desconhecido'}
                </p>
              </div>
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="bg-error/10 hover:bg-error/20 text-error border border-error/30 font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
              >
                <LogOut className="w-4 h-4" />
                Desconectar WhatsApp
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Right Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3 text-primary font-bold">
              <Info className="w-4 h-4" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Instruções de Conexão</h3>
            </div>
            <div className="text-xs text-on-surface-variant space-y-3 leading-relaxed">
              <div className="flex items-start gap-2.5 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-on-surface">Conectividade Nativa Baileys</p>
                  <p className="text-[11px] mt-0.5">Utiliza protocolo seguro WebSockets sem passar por intermediários pagos.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-on-surface">Sessão Persistente</p>
                  <p className="text-[11px] mt-0.5">Após parear o código QR, a sessão permanece salva no servidor do robô e reconecta automaticamente.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card - Rule of 9th digit in Brazil */}
          <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant space-y-2 text-xs">
            <div className="flex items-center gap-2 text-primary font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Sincronização do Nono Dígito (Brasil)</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              O R9Bot possui um normalizador nativo que detecta automaticamente se o número necessita do 9º dígito adicional ou remoção, além de realizar consultas em tempo real na API do WhatsApp para garantir a entrega.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
