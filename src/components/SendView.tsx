import React from 'react';
import { 
  Send, 
  Play, 
  Pause, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  RotateCcw,
  ShieldCheck,
  CheckCheck,
  XCircle
} from 'lucide-react';
import { BulkJob, WhatsappStatus } from '../types';

interface SendViewProps {
  jobState: BulkJob;
  waStatus: WhatsappStatus;
  handleStartBulk: () => void;
  handlePauseBulk: () => void;
  handleResumeBulk: () => void;
  handleStopBulk: () => void;
  totalContactsCount: number;
  countdown: number | null;
}

export const SendView: React.FC<SendViewProps> = ({
  jobState,
  waStatus,
  handleStartBulk,
  handlePauseBulk,
  handleResumeBulk,
  handleStopBulk,
  totalContactsCount,
  countdown
}) => {
  const totalContacts = jobState.contacts.length || totalContactsCount;
  const sentCount = jobState.contacts.filter(c => c.status === 'sent').length;
  const failedCount = jobState.contacts.filter(c => c.status === 'failed').length;
  const sendingCount = jobState.contacts.filter(c => c.status === 'sending').length;
  const pendingCount = jobState.contacts.filter(c => c.status === 'pending').length;

  const progressPercent = totalContacts > 0 ? Math.round(((sentCount + failedCount) / totalContacts) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Painel de Execução de Disparo em Lote</h2>
          <p className="text-xs text-on-surface-variant">Acompanhe o progresso em tempo real do robô de mensagens e gerencie os estados de disparo.</p>
        </div>
      </div>

      {/* Control Banner Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
              jobState.status === 'running' ? 'bg-primary/20 text-primary border border-primary/30 cyan-glow' :
              jobState.status === 'paused' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' :
              jobState.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'
            }`}>
              {jobState.status === 'running' && <Send className="w-6 h-6 animate-pulse" />}
              {jobState.status === 'paused' && <Pause className="w-6 h-6" />}
              {jobState.status === 'completed' && <CheckCircle2 className="w-6 h-6" />}
              {jobState.status === 'stopped' && <Square className="w-6 h-6" />}
              {jobState.status === 'idle' && <Play className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-on-surface">
                  {jobState.status === 'running' && 'Campanha em Execução'}
                  {jobState.status === 'paused' && 'Campanha Pausada'}
                  {jobState.status === 'completed' && 'Campanha Concluída com Sucesso!'}
                  {jobState.status === 'stopped' && 'Campanha Interrompida'}
                  {jobState.status === 'idle' && 'Pronto para Iniciar Disparo'}
                </h3>
                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  jobState.status === 'running' ? 'bg-primary/20 text-primary border border-primary/30' :
                  jobState.status === 'paused' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {jobState.status}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {totalContacts} contatos na fila de envio.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {jobState.status === 'idle' || jobState.status === 'completed' || jobState.status === 'stopped' ? (
              <button
                onClick={handleStartBulk}
                disabled={waStatus.status !== 'connected' || totalContactsCount === 0}
                className="bg-primary text-on-primary hover:brightness-110 font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Envio em Lote</span>
              </button>
            ) : null}

            {jobState.status === 'running' && (
              <button
                onClick={handlePauseBulk}
                className="bg-tertiary/20 border border-tertiary/30 text-tertiary hover:bg-tertiary/30 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar Disparo</span>
              </button>
            )}

            {jobState.status === 'paused' && (
              <button
                onClick={handleResumeBulk}
                className="bg-primary text-on-primary hover:brightness-110 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Retomar Disparo</span>
              </button>
            )}

            {(jobState.status === 'running' || jobState.status === 'paused') && (
              <button
                onClick={handleStopBulk}
                className="bg-error/20 border border-error/30 text-error hover:bg-error/30 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Interromper</span>
              </button>
            )}
          </div>
        </div>

        {/* Batch Pause Countdown Indicator Widget */}
        {jobState.isBatchPausing && (
          <div className="p-4 bg-tertiary/10 border border-tertiary/30 rounded-2xl flex items-center justify-between text-tertiary animate-pulse">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <div>
                <p className="font-bold text-xs">Pausa Programada entre Lotes Ativa</p>
                <p className="text-[11px] opacity-90">O robô está aguardando o tempo de descanso para evitar alertas de spam no WhatsApp.</p>
              </div>
            </div>
            <span className="font-mono text-xl font-extrabold px-3 py-1 bg-surface-container rounded-xl border border-tertiary/30">
              {countdown !== null ? `${countdown}s` : 'Pausando...'}
            </span>
          </div>
        )}

        {/* Progress Bar & Stats Row */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-on-surface-variant uppercase tracking-wider">Progresso Geral da Campanha</span>
            <span className="text-primary font-mono text-sm">{progressPercent}% Concluído</span>
          </div>

          <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden border border-outline-variant/60">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 cyan-glow"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-center">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Pendente</span>
              <p className="text-lg font-black font-mono text-on-surface">{pendingCount}</p>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-center">
              <span className="text-[10px] font-bold text-primary uppercase">Em Envio</span>
              <p className="text-lg font-black font-mono text-primary">{sendingCount}</p>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-center">
              <span className="text-[10px] font-bold text-primary uppercase">Enviados</span>
              <p className="text-lg font-black font-mono text-primary">{sentCount}</p>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-center">
              <span className="text-[10px] font-bold text-error uppercase">Falhas</span>
              <p className="text-lg font-black font-mono text-error">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Contact Dispatch Log Table */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant pb-3">
          <CheckCheck className="w-4 h-4 text-primary" />
          Histórico Detalhado do Disparo
        </h3>

        <div className="overflow-x-auto max-h-[460px]">
          {jobState.contacts.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-xs space-y-2">
              <Send className="w-8 h-8 mx-auto text-outline" />
              <p>Nenhum disparo em lote ativo no momento.</p>
              <p className="text-[11px] opacity-70">Carregue seus contatos e clique em "Iniciar Envio em Lote" para ver o progresso aqui.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase bg-surface-container-high/40">
                  <th className="p-3">Status</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Horário de Envio</th>
                  <th className="p-3">Detalhes / Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {jobState.contacts.map((c, idx) => (
                  <tr key={idx} className="hover:bg-surface-variant/30 transition-colors">
                    <td className="p-3">
                      {c.status === 'sent' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" /> Enviado
                        </span>
                      )}
                      {c.status === 'sending' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-tertiary/20 text-tertiary border border-tertiary/30 flex items-center gap-1 w-max animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                        </span>
                      )}
                      {c.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-surface-container-high text-on-surface-variant w-max block">
                          Pendente
                        </span>
                      )}
                      {c.status === 'failed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-error/20 text-error border border-error/30 flex items-center gap-1 w-max">
                          <XCircle className="w-3 h-3" /> Falhou
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-primary font-semibold">{c.phone}</td>
                    <td className="p-3 text-on-surface font-semibold">{c.name || '—'}</td>
                    <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                      {c.sentAt ? new Date(c.sentAt).toLocaleTimeString('pt-BR') : '—'}
                    </td>
                    <td className="p-3 text-[11px] text-on-surface-variant">
                      {c.error ? <span className="text-error font-medium">{c.error}</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
