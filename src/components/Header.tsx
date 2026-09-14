import React from 'react';
import { Zap, Building2, ArrowLeftRight } from 'lucide-react';
import { ActiveTab, WhatsappStatus, WorkspaceInfo } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  waStatus: WhatsappStatus;
  totalContacts: number;
  currentWorkspace?: WorkspaceInfo | null;
  onSwitchWorkspace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  waStatus,
  currentWorkspace,
  onSwitchWorkspace
}) => {
  return (
    <header className="flex justify-between items-center w-full px-4 md:px-6 h-16 bg-surface border-b border-outline-variant shrink-0 z-10">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 block md:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
            <Zap className="w-5 h-5 text-primary fill-primary/20" />
          </div>
          <span className="text-lg font-extrabold text-primary tracking-tight">R9Bot</span>
        </div>

        {/* Current Workspace Badge & Switcher */}
        {currentWorkspace && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-xl border border-outline-variant/80 text-xs font-bold text-on-surface">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[220px]">{currentWorkspace.name}</span>
            </div>

            {onSwitchWorkspace && (
              <button
                onClick={onSwitchWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-primary rounded-xl border border-outline-variant text-xs font-bold transition-all cursor-pointer"
                title="Trocar de Workspace"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trocar Workspace</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side status */}
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant">
          <span className={`w-2 h-2 rounded-full ${
            waStatus.status === 'connected' ? 'bg-primary animate-pulse' :
            waStatus.status === 'connecting' || waStatus.status === 'qr' ? 'bg-tertiary animate-pulse' : 'bg-error'
          }`} />
          <span className="text-xs font-semibold text-on-surface">
            {waStatus.status === 'connected' && (waStatus.user?.name ? `Conectado: ${waStatus.user.name}` : 'WhatsApp Conectado')}
            {waStatus.status === 'connecting' && 'Conectando...'}
            {waStatus.status === 'qr' && 'Aguardando Escaneamento'}
            {waStatus.status === 'disconnected' && 'WhatsApp Desconectado'}
          </span>
        </div>
      </div>
    </header>
  );
};


