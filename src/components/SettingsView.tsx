import React from 'react';
import { Sliders, Clock, ShieldCheck, Zap, Info } from 'lucide-react';

interface SettingsViewProps {
  minDelaySec: number;
  setMinDelaySec: (val: number) => void;
  maxDelaySec: number;
  setMaxDelaySec: (val: number) => void;
  batchSize: number;
  setBatchSize: (val: number) => void;
  batchPauseSeconds: number;
  setBatchPauseSeconds: (val: number) => void;
  totalContactsCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  minDelaySec,
  setMinDelaySec,
  maxDelaySec,
  setMaxDelaySec,
  batchSize,
  setBatchSize,
  batchPauseSeconds,
  setBatchPauseSeconds,
  totalContactsCount
}) => {
  // Estimate total time based on delay settings
  const avgDelaySec = (minDelaySec + maxDelaySec) / 2;
  const totalMessageDelaySec = totalContactsCount * avgDelaySec;
  const numBatches = batchSize > 0 ? Math.floor(totalContactsCount / batchSize) : 0;
  const totalBatchPauseSec = numBatches * batchPauseSeconds;
  const estimatedTotalMinutes = Math.ceil((totalMessageDelaySec + totalBatchPauseSec) / 60);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Configurações de Cadência e Pausa em Lote</h2>
          <p className="text-xs text-on-surface-variant">Ajuste os intervalos entre disparos para simular digitação humana e evitar bloqueios operacionais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Randomized Delay Range Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Intervalo Randômico entre Mensagens</h3>
            </div>

            <p className="text-xs text-on-surface-variant">
              O robô escolherá aleatoriamente um tempo entre o valor mínimo e máximo a cada mensagem enviada, replicando o ritmo de uma pessoa real.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1.5">
                  Atraso Mínimo (Segundos):
                </label>
                <input 
                  type="number"
                  min={1}
                  max={120}
                  value={minDelaySec}
                  onChange={(e) => setMinDelaySec(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1.5">
                  Atraso Máximo (Segundos):
                </label>
                <input 
                  type="number"
                  min={minDelaySec}
                  max={300}
                  value={maxDelaySec}
                  onChange={(e) => setMaxDelaySec(Math.max(minDelaySec, parseInt(e.target.value) || minDelaySec))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-[11px] text-on-surface-variant flex items-center justify-between">
              <span>Faixa de intervalo configurada:</span>
              <span className="font-mono font-bold text-primary">{minDelaySec}s até {maxDelaySec}s por contato</span>
            </div>
          </div>

          {/* Batching & Pause Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Pausa Programada em Lotes (Batching)</h3>
            </div>

            <p className="text-xs text-on-surface-variant">
              Faça o robô dar uma pausa maior a cada X mensagens enviadas. Essa pausa estendida é essencial para desarmar gatilhos de spambot.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1.5">
                  Tamanho do Lote (Qtd. Mensagens):
                </label>
                <input 
                  type="number"
                  min={1}
                  max={500}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1.5">
                  Tempo de Pausa do Lote (Segundos):
                </label>
                <input 
                  type="number"
                  min={5}
                  max={3600}
                  value={batchPauseSeconds}
                  onChange={(e) => setBatchPauseSeconds(Math.max(5, parseInt(e.target.value) || 5))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-[11px] text-on-surface-variant flex items-center justify-between">
              <span>Regra de lote:</span>
              <span className="font-mono font-bold text-primary">Pausar por {batchPauseSeconds}s a cada {batchSize} mensagens</span>
            </div>
          </div>
        </div>

        {/* Campaign Time Estimator (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Estimativa de Tempo da Campanha</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-center space-y-1">
                <p className="text-[10px] font-bold text-primary uppercase">TEMPO TOTAL ESTIMADO</p>
                <h4 className="text-2xl font-black text-on-surface font-mono">~ {estimatedTotalMinutes} minutos</h4>
                <p className="text-[11px] text-on-surface-variant">Para {totalContactsCount} contatos carregados</p>
              </div>

              <div className="space-y-2 text-xs text-on-surface-variant pt-2">
                <div className="flex justify-between p-2 bg-surface-container-low rounded-lg border border-outline-variant font-mono">
                  <span>Média de delay por contato:</span>
                  <span className="text-on-surface font-bold">{avgDelaySec.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between p-2 bg-surface-container-low rounded-lg border border-outline-variant font-mono">
                  <span>Pausas totais de lote:</span>
                  <span className="text-on-surface font-bold">{numBatches} pausas de {batchPauseSeconds}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant space-y-3 text-xs">
            <div className="flex items-center gap-2 text-primary font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Segurança &amp; Limpeza Diária do Workspace</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Este workspace é protegido por <strong>PIN numérico exclusivo (mínimo 4 dígitos)</strong>. Além disso, todo dia às <strong>00:00 (meia-noite)</strong> o servidor executa automaticamente a rotina de limpeza de memória e anexos temporários para garantir máxima estabilidade e sigilo.
            </p>
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-[11px] font-mono text-on-surface-variant flex items-center justify-between">
              <span>Limpeza diária automática:</span>
              <span className="font-bold text-primary">Ativa às 00:00h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
