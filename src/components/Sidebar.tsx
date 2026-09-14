import React from 'react';
import { 
  Zap, 
  Sliders, 
  LogOut, 
  QrCode,
  MessageSquare,
  Users,
  Send,
  Building2,
  ArrowLeftRight,
  LayoutDashboard
} from 'lucide-react';
import { ActiveTab, WhatsappStatus, WorkspaceInfo } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewTaskClick?: () => void;
  onLogoutClick: () => void;
  waStatus: WhatsappStatus;
  contactsCount: number;
  messageVariationsCount: number;
  currentWorkspace?: WorkspaceInfo | null;
  onSwitchWorkspace?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogoutClick,
  waStatus,
  contactsCount,
  messageVariationsCount,
  currentWorkspace,
  onSwitchWorkspace
}) => {
  const navItems = [
    { id: 'home' as ActiveTab, label: 'Início & Tutorial', icon: LayoutDashboard },
    { id: 'connection' as ActiveTab, label: 'Conexão WhatsApp', icon: QrCode, badge: waStatus.status === 'connected' ? 'Ativo' : undefined },
    { id: 'messages' as ActiveTab, label: 'Mensagens & Anexos', icon: MessageSquare, badge: `${messageVariationsCount} var` },
    { id: 'settings' as ActiveTab, label: 'Atraso e Lote', icon: Sliders },
    { id: 'contacts' as ActiveTab, label: 'Contatos', icon: Users, badge: `${contactsCount}` },
    { id: 'send' as ActiveTab, label: 'Envio & Logs', icon: Send },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container border-r border-outline-variant p-4 gap-4 shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-1 px-2 pt-2">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
          <Zap className="w-6 h-6 text-primary fill-primary/20" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-primary tracking-tight leading-tight">R9Bot</h1>
          <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Automator Engine</p>
        </div>
      </div>

      {/* Active Workspace Info Box */}
      {currentWorkspace && (
        <div className="bg-surface-container-high border border-outline-variant/80 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Workspace</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-extrabold text-on-surface truncate">{currentWorkspace.name}</span>
          </div>

          {onSwitchWorkspace && (
            <button
              onClick={onSwitchWorkspace}
              className="mt-1 w-full py-1.5 px-2 bg-surface hover:bg-surface-variant text-primary border border-outline-variant rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Trocar Workspace</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-secondary-container text-primary font-bold cyan-glow shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Actions / Logout */}
      {waStatus.status === 'connected' && (
        <div className="mt-auto pt-3 border-t border-outline-variant/50">
          <button
            onClick={onLogoutClick}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-error hover:bg-error-container/20 rounded-xl transition-all text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Desconectar Bot</span>
          </button>
        </div>
      )}
    </aside>
  );
};

