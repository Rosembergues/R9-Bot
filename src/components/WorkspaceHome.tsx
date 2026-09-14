import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Building2, 
  ArrowRight, 
  Shield, 
  Clock, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { WorkspaceInfo } from '../types';

interface WorkspaceHomeProps {
  onSelectWorkspace: (workspace: WorkspaceInfo) => void;
}

export const WorkspaceHome: React.FC<WorkspaceHomeProps> = ({ onSelectWorkspace }) => {
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected workspace modal state for existing workspace
  const [selectedWsModal, setSelectedWsModal] = useState<WorkspaceInfo | null>(null);
  const [modalPin, setModalPin] = useState('');
  const [showModalPin, setShowModalPin] = useState(false);
  const [verifyingModal, setVerifyingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Cleanup info
  const [cleanupInfo, setCleanupInfo] = useState<{ lastCleanupAt?: string; nextCleanupAt?: string } | null>(null);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      }
    } catch (err) {
      console.error('Erro ao buscar workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupStatus = async () => {
    try {
      const response = await fetch('/api/workspaces/cleanup-status');
      if (response.ok) {
        const data = await response.json();
        setCleanupInfo(data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchCleanupStatus();
    const interval = setInterval(fetchWorkspaces, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceInput.trim()) return;

    if (!pinInput.trim() || !/^\d{4,}$/.test(pinInput.trim())) {
      setError('O PIN do workspace deve ser numérico e ter no mínimo 4 dígitos (ex: 1234).');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: workspaceInput.trim(),
          pin: pinInput.trim()
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao criar workspace');
      }

      const ws: WorkspaceInfo = await response.json();
      onSelectWorkspace(ws);
    } catch (err: any) {
      setError(err.message || 'Falha ao acessar workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleCardClick = (ws: WorkspaceInfo) => {
    setSelectedWsModal(ws);
    setModalPin('');
    setModalError(null);
  };

  const handleVerifyModalPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWsModal) return;

    if (!modalPin.trim() || !/^\d{4,}$/.test(modalPin.trim())) {
      setModalError('Digite um PIN numérico válido de no mínimo 4 dígitos.');
      return;
    }

    try {
      setVerifyingModal(true);
      setModalError(null);
      const response = await fetch('/api/workspaces/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: selectedWsModal.id,
          pin: modalPin.trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'PIN incorreto.');
      }

      const data = await response.json();
      if (data.success && data.workspace) {
        onSelectWorkspace(data.workspace);
      }
    } catch (err: any) {
      setModalError(err.message || 'PIN incorreto. Tente novamente.');
    } finally {
      setVerifyingModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Top Bar */}
      <header className="w-full border-b border-outline-variant/60 bg-surface/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
            <Zap className="w-6 h-6 text-primary fill-primary/20" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-primary leading-tight">R9Bot Whatsapp Sender</h1>
            <p className="text-xs text-on-surface-variant font-medium">Plataforma Isolada com Proteção por PIN &amp; Limpeza Diária</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>Proteção por PIN Numérico (Mín. 4 Dígitos)</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
        {/* Daily 00h Cleanup Banner */}
        <div className="bg-surface-container-high/60 border border-outline-variant/80 rounded-xl p-3.5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-on-surface block">Rotina Diária de Limpeza dos Workspaces (Todo dia às 00h)</span>
              <span className="text-on-surface-variant text-[11px]">
                O servidor executa automaticamente a limpeza de memória, anexos temporários e QR codes expirados.
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
            <Building2 className="w-4 h-4" />
            <span>Acesso Seguro com PIN Numérico</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
            Selecione ou Crie seu Workspace
          </h2>
          <p className="text-on-surface-variant text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Cada workspace possui um <strong className="text-primary font-bold">PIN exclusivo de 4+ dígitos</strong>, sessão individual do WhatsApp e QR Code isolado.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-2xl mb-10 relative overflow-hidden">
          <form onSubmit={handleCreateOrJoin} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Workspace Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="workspace-name-input" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Nome do Workspace / Empresa
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    id="workspace-name-input"
                    type="text"
                    value={workspaceInput}
                    onChange={(e) => setWorkspaceInput(e.target.value)}
                    placeholder="Ex: Empresa Vendas, Equipe 01..."
                    className="w-full pl-10 pr-3 py-3 bg-surface-container-high border border-outline-variant rounded-xl text-sm text-on-surface font-medium placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Workspace PIN Input */}
              <div className="space-y-1.5">
                <label htmlFor="workspace-pin-input" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                  <span>PIN Numérico do Workspace</span>
                  <span className="text-[10px] text-primary font-semibold">Mínimo 4 dígitos</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    id="workspace-pin-input"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Digite o PIN (ex: 1234)"
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-high border border-outline-variant rounded-xl text-sm text-on-surface font-mono font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!workspaceInput.trim() || !pinInput.trim() || pinInput.length < 4 || creating}
              className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer shadow-lg shadow-primary/20 text-sm"
            >
              {creating ? (
                <span>Acessando / Criando Workspace...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Entrar com PIN de Segurança</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Workspaces List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Workspaces Ativos no Servidor ({workspaces.length})</span>
            </h3>
            <button
              onClick={fetchWorkspaces}
              className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Atualizar</span>
            </button>
          </div>

          {loading && workspaces.length === 0 ? (
            <div className="p-8 text-center bg-surface-container/50 border border-outline-variant rounded-xl text-xs text-on-surface-variant font-medium">
              Carregando workspaces existentes...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-8 text-center bg-surface-container/50 border border-dashed border-outline-variant rounded-xl text-xs text-on-surface-variant font-medium space-y-2">
              <p>Nenhum workspace ativo criado ainda.</p>
              <p className="text-[11px] opacity-75">Crie seu primeiro workspace com nome e PIN numérico de no mínimo 4 dígitos acima!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspaces.map((ws) => {
                const isConnected = ws.status === 'connected';
                const isConnecting = ws.status === 'connecting' || ws.status === 'qr';

                return (
                  <button
                    key={ws.id}
                    onClick={() => handleCardClick(ws)}
                    className="flex items-center justify-between p-4 bg-surface-container border border-outline-variant hover:border-primary/50 hover:bg-surface-container-high rounded-xl transition-all cursor-pointer text-left group shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                        isConnected 
                          ? 'bg-primary/20 border-primary/30 text-primary'
                          : isConnecting
                          ? 'bg-tertiary/20 border-tertiary/30 text-tertiary animate-pulse'
                          : 'bg-surface-container-highest border-outline-variant text-on-surface-variant'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{ws.name}</span>
                          {ws.hasPin && <Lock className="w-3 h-3 text-primary shrink-0" title="Protegido por PIN" />}
                        </div>
                        <div className="text-[11px] font-mono text-on-surface-variant truncate flex items-center gap-2">
                          <span>ID: {ws.id}</span>
                          <span className="text-[10px] text-primary/80 font-semibold">• PIN Ativo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isConnected
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : isConnecting
                          ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                          : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
                      }`}>
                        {isConnected ? (ws.connectedUser?.name ? `Conectado: ${ws.connectedUser.name}` : '🟢 Conectado') :
                         isConnecting ? '🟡 QR Pronto' :
                         '🔴 Desconectado'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Selected Workspace Modal for Entering PIN */}
      {selectedWsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">Confirmar PIN de Acesso</h3>
                <p className="text-xs text-on-surface-variant">Workspace: <strong className="text-primary font-bold">{selectedWsModal.name}</strong></p>
              </div>
            </div>

            <form onSubmit={handleVerifyModalPin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="modal-pin-input" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  PIN Numérico (no mínimo 4 dígitos)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    id="modal-pin-input"
                    type={showModalPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={modalPin}
                    onChange={(e) => setModalPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Digite o PIN de 4+ dígitos"
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-high border border-outline-variant rounded-xl text-sm text-on-surface font-mono font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPin(!showModalPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    {showModalPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {modalError && (
                <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWsModal(null);
                    setModalError(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!modalPin.trim() || modalPin.length < 4 || verifyingModal}
                  className="flex-1 py-2.5 px-4 bg-primary text-on-primary hover:brightness-110 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {verifyingModal ? (
                    <span>Verificando...</span>
                  ) : (
                    <>
                      <span>Acessar Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/60 bg-surface/50 px-6 py-4 text-center text-xs text-on-surface-variant">
        <span>R9Bot Multi-Tenant Server &bull; Proteção por PIN numérico de 4+ dígitos e Limpeza Automática às 00h.</span>
      </footer>
    </div>
  );
};
