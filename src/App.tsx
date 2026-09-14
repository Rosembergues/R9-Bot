import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  CheckCircle2, 
  X, 
  LogOut, 
  Zap, 
  Sliders, 
  Send, 
  Users, 
  QrCode, 
  MessageSquare 
} from 'lucide-react';

import { 
  Contact, 
  Attachment, 
  MessageTemplate, 
  BulkJob, 
  WhatsappStatus, 
  ActiveTab,
  WorkspaceInfo 
} from './types';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ConnectionView } from './components/ConnectionView';
import { MessagesView } from './components/MessagesView';
import { SettingsView } from './components/SettingsView';
import { ContactsView } from './components/ContactsView';
import { SendView } from './components/SendView';
import { WorkspaceHome } from './components/WorkspaceHome';
import { HomeGuideView } from './components/HomeGuideView';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export default function App() {
  // Current Active Workspace
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceInfo | null>(() => {
    const saved = localStorage.getItem('r9bot_current_workspace');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved workspace:', e);
      }
    }
    return null;
  });

  // Navigation active tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // WhatsApp connection state
  const [waStatus, setWaStatus] = useState<WhatsappStatus>({
    status: 'disconnected',
    qr: null,
    user: null,
    error: null,
  });
  const [isConnectingLoading, setIsConnectingLoading] = useState(false);

  // Helper for workspace-scoped API requests
  const apiFetch = (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (currentWorkspace) {
      headers['X-Workspace-Id'] = currentWorkspace.id;
      headers['X-Workspace-Name'] = currentWorkspace.name;
    }
    return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  };

  // Message rotator & Gemini AI states
  const [messageVariations, setMessageVariations] = useState<string[]>([
    'Olá {nome}, tudo bem? Seu pedido nº {var1} no valor de {var2} foi enviado com sucesso!',
  ]);
  const [activeVariationIndex, setActiveVariationIndex] = useState(0);

  const [variationCount, setVariationCount] = useState(3);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentMessageText = messageVariations[activeVariationIndex] || '';
  const setCurrentMessageText = (val: string) => {
    setMessageVariations(prev => {
      const next = [...prev];
      next[activeVariationIndex] = val;
      return next;
    });
  };

  // Cadence & Delay parameters
  const [minDelaySec, setMinDelaySec] = useState(5);
  const [maxDelaySec, setMaxDelaySec] = useState(15);
  const [batchSize, setBatchSize] = useState(10);
  const [batchPauseSeconds, setBatchPauseSeconds] = useState(30);

  // Contacts list
  const [pasteInput, setPasteInput] = useState('');
  const [contactsList, setContactsList] = useState<Contact[]>([
    { name: 'Exemplo João', phone: '21999999999', variables: ['10452', 'R$ 150,00'] },
    { name: 'Maria Souza', phone: '11988888888', variables: ['10453', 'R$ 89,90'] },
  ]);

  // Bulk execution job state
  const [jobState, setJobState] = useState<BulkJob>({
    id: '',
    text: '',
    contacts: [],
    status: 'idle',
    currentIndex: 0,
    delayMs: 5000,
    createdAt: '',
  });

  // System UI feedback messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Message templates state with local storage fallback
  const [savedTemplates, setSavedTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem('r9bot_msg_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved templates:', e);
      }
    }
    return [
      {
        id: 'default-1',
        title: 'Confirmação de Pedido',
        text: 'Olá {nome}, tudo bem? Seu pedido nº {var1} no valor de {var2} foi enviado com sucesso!'
      },
      {
        id: 'default-2',
        title: 'Aviso de Cobrança Pessoal',
        text: 'Olá {nome}, identificamos que a fatura do seu plano com código {var1} valor {var2} está disponível. Podemos ajudar?'
      },
      {
        id: 'default-3',
        title: 'Boas-Vindas Vip',
        text: 'Seja muito bem-vindo(a), {nome}! Ficamos felizes em ter você por aqui. Conte conosco sempre!'
      }
    ];
  });
  const [newTemplateTitle, setNewTemplateTitle] = useState('');

  // Handle Workspace Selection
  const handleSelectWorkspace = (ws: WorkspaceInfo) => {
    setCurrentWorkspace(ws);
    localStorage.setItem('r9bot_current_workspace', JSON.stringify(ws));
    setActiveTab('connection');
  };

  const handleSwitchWorkspace = () => {
    setCurrentWorkspace(null);
    localStorage.removeItem('r9bot_current_workspace');
  };

  // LocalStorage Sync for current Workspace
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('r9bot_current_workspace', JSON.stringify(currentWorkspace));
    }
  }, [currentWorkspace]);

  // LocalStorage Sync
  useEffect(() => {
    localStorage.setItem('r9bot_msg_templates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  // Batch pause countdown timer handler
  useEffect(() => {
    if (jobState.isBatchPausing && jobState.batchPauseResumeAt) {
      const calculateRemaining = () => {
        const diff = new Date(jobState.batchPauseResumeAt!).getTime() - Date.now();
        const seconds = Math.max(0, Math.ceil(diff / 1000));
        setCountdown(seconds);
      };
      
      calculateRemaining();
      const timer = setInterval(calculateRemaining, 500);
      return () => clearInterval(timer);
    } else {
      setCountdown(null);
    }
  }, [jobState.isBatchPausing, jobState.batchPauseResumeAt]);

  // Fetch WhatsApp connection status
  const fetchStatus = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await apiFetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    }
  };

  // Fetch Bulk job status
  const fetchJobStatus = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await apiFetch('/api/whatsapp/bulk-status');
      if (res.ok) {
        const data = await res.json();
        setJobState(data);
      }
    } catch (err) {
      console.error('Error fetching bulk job status:', err);
    }
  };

  // Status Polling Intervals
  useEffect(() => {
    if (!currentWorkspace) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (!currentWorkspace) return;
    fetchJobStatus();
    const rate = jobState.status === 'running' ? 1000 : 3000;
    const interval = setInterval(fetchJobStatus, rate);
    return () => clearInterval(interval);
  }, [currentWorkspace?.id, jobState.status]);

  // Trigger connect call when workspace is opened
  useEffect(() => {
    if (currentWorkspace) {
      handleConnect(false);
    }
  }, [currentWorkspace?.id]);

  // WhatsApp Connect Action
  const handleConnect = async (force = false) => {
    if (!currentWorkspace) return;
    setIsConnectingLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      setWaStatus(prev => ({ ...prev, status: data.status }));
      await fetchStatus();
    } catch (err) {
      setErrorMsg('Falha ao se conectar com o servidor WhatsApp.');
    } finally {
      setIsConnectingLoading(false);
    }
  };

  // WhatsApp Disconnect Action
  const handleDisconnect = async () => {
    if (!currentWorkspace) return;
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/whatsapp/disconnect', { method: 'POST' });
      await res.json();
      setWaStatus({
        status: 'disconnected',
        qr: null,
        user: null,
        error: null,
      });
      setShowDisconnectConfirm(false);
      setSuccessMsg(`Sessão do WhatsApp desconectada do workspace ${currentWorkspace.name}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('Falha ao desconectar.');
    }
  };

  // Gemini AI Variation Generator Request
  const handleGenerateVariations = async () => {
    if (!currentMessageText || !currentMessageText.trim()) {
      setAiError('Por favor, digite uma mensagem base no editor primeiro.');
      return;
    }

    setIsGeneratingVariations(true);
    setAiError(null);

    try {
      const response = await apiFetch('/api/whatsapp/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessageText,
          count: variationCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar variações com IA.');
      }

      if (data.variations && Array.isArray(data.variations)) {
        const newVars = data.variations.filter((v: string) => v && v.trim());
        if (newVars.length > 0) {
          setMessageVariations(prev => [...prev, ...newVars]);
          setSuccessMsg(`Sucesso! ${newVars.length} novas variações foram adicionadas ao rotador.`);
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          throw new Error('Nenhuma variação válida retornada do servidor.');
        }
      } else {
        throw new Error('Formato de variação inválido do servidor.');
      }
    } catch (err: any) {
      console.error('Erro ao gerar variações:', err);
      setAiError(err.message || 'Falha de comunicação com o servidor Gemini.');
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  // Attachment file reader
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    Array.from(files).forEach((file: File) => {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg(`O arquivo "${file.name}" excede o limite recomendado de 15MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64Data = evt.target?.result as string;
        if (base64Data) {
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'application/octet-stream',
              data: base64Data,
              size: file.size
            }
          ]);
        }
      };
      reader.onerror = () => {
        setErrorMsg(`Falha ao ler o arquivo "${file.name}".`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Template Handlers
  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) {
      setErrorMsg('Digite um título para o modelo.');
      return;
    }
    if (!currentMessageText.trim()) {
      setErrorMsg('O texto da mensagem não pode estar vazio.');
      return;
    }

    const newTemplate: MessageTemplate = {
      id: Math.random().toString(36).substring(7),
      title: newTemplateTitle.trim(),
      text: currentMessageText
    };

    setSavedTemplates(prev => [...prev, newTemplate]);
    setNewTemplateTitle('');
    setSuccessMsg(`Modelo "${newTemplate.title}" salvo!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleLoadTemplate = (templateText: string) => {
    setCurrentMessageText(templateText);
    setSuccessMsg('Modelo carregado no editor atual.');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleDeleteTemplate = (id: string, title: string) => {
    setSavedTemplates(prev => prev.filter(t => t.id !== id));
    setSuccessMsg(`Modelo "${title}" removido.`);
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Contacts Parser / Importers
  const handleImportPasted = () => {
    if (!pasteInput.trim()) return;
    const lines = pasteInput.split('\n');
    const imported: Contact[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const p1 = parts[0].trim();
        const p2 = parts[1].trim();
        const d1 = p1.replace(/\D/g, '');
        const d2 = p2.replace(/\D/g, '');

        if (d2.length >= 8) {
          imported.push({ name: p1, phone: p2 });
        } else if (d1.length >= 8) {
          imported.push({ name: p2, phone: p1 });
        } else {
          imported.push({ name: p1, phone: p2 });
        }
      } else {
        imported.push({ name: '', phone: line.trim() });
      }
    });

    if (imported.length > 0) {
      setContactsList(prev => [...prev, ...imported]);
      setPasteInput('');
      setSuccessMsg(`${imported.length} contatos importados!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg('Nenhum contato válido encontrado.');
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        if (data.length === 0) {
          setErrorMsg('A planilha está vazia.');
          return;
        }

        const imported: Contact[] = [];
        const headerRow = data[0] as string[];

        let nameIdx = -1;
        let phoneIdx = -1;

        if (headerRow && Array.isArray(headerRow)) {
          headerRow.forEach((col: any, idx: number) => {
            if (typeof col === 'string') {
              const lower = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              if (lower.includes('nome') || lower.includes('name') || lower.includes('cliente')) {
                if (nameIdx === -1) nameIdx = idx;
              }
              if (lower.includes('telefone') || lower.includes('phone') || lower.includes('celular') || lower.includes('whatsapp') || lower.includes('tel')) {
                if (phoneIdx === -1) phoneIdx = idx;
              }
            }
          });
        }

        const startRow = (nameIdx !== -1 || phoneIdx !== -1) ? 1 : 0;
        if (phoneIdx === -1) { phoneIdx = 1; nameIdx = 0; }
        if (nameIdx === -1) { nameIdx = phoneIdx === 0 ? 1 : 0; }

        const extraIndices: number[] = [];
        if (headerRow && Array.isArray(headerRow)) {
          for (let idx = 0; idx < headerRow.length; idx++) {
            if (idx !== nameIdx && idx !== phoneIdx) extraIndices.push(idx);
          }
        }

        for (let i = startRow; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;

          let name = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
          let phone = row[phoneIdx] !== undefined ? String(row[phoneIdx]).trim() : '';

          if (!phone && name) {
            const digits = name.replace(/\D/g, '');
            if (digits.length >= 8) {
              phone = name;
              name = '';
            }
          }

          const variables: string[] = [];
          extraIndices.forEach((idx) => {
            if (idx < row.length && row[idx] !== undefined) {
              variables.push(String(row[idx]).trim());
            }
          });

          if (phone && phone.replace(/\D/g, '').length >= 8) {
            imported.push({ name, phone, variables });
          }
        }

        if (imported.length > 0) {
          setContactsList(prev => [...prev, ...imported]);
          setSuccessMsg(`${imported.length} contatos importados do Excel!`);
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          setErrorMsg('Nenhum contato válido encontrado no arquivo.');
        }
      } catch (err) {
        setErrorMsg('Erro ao ler o arquivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleClearContacts = () => setContactsList([]);

  const handleLoadSamples = () => {
    setContactsList([
      { name: 'João Silva', phone: '21999999999', variables: ['10452', 'R$ 150,00'] },
      { name: 'Maria Souza', phone: '11988888888', variables: ['10453', 'R$ 89,90'] },
      { name: 'Carlos Santos', phone: '21977777777', variables: ['10454', 'R$ 210,50'] },
      { name: 'Ana Oliveira', phone: '31966666666', variables: ['10455', 'R$ 55,00'] }
    ]);
  };

  const handleRemoveContact = (index: number) => {
    setContactsList(prev => prev.filter((_, i) => i !== index));
  };

  // Bulk Dispatch Executions
  const handleStartBulk = async () => {
    if (!currentWorkspace) return;
    if (waStatus.status !== 'connected') {
      setErrorMsg('Conecte o WhatsApp via QR Code antes de iniciar o envio.');
      setActiveTab('connection');
      return;
    }
    if (contactsList.length === 0) {
      setErrorMsg('Adicione pelo menos um contato para iniciar o disparo.');
      setActiveTab('contacts');
      return;
    }

    const nonEmpties = messageVariations.filter(t => t && t.trim() !== '');
    if (nonEmpties.length === 0) {
      setErrorMsg('Escreva pelo menos uma variação de mensagem.');
      setActiveTab('messages');
      return;
    }

    setErrorMsg(null);
    try {
      const finalMin = Math.min(minDelaySec, maxDelaySec);
      const finalMax = Math.max(minDelaySec, maxDelaySec);

      const res = await apiFetch('/api/whatsapp/bulk-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: nonEmpties[0],
          texts: nonEmpties,
          attachments: attachments,
          contacts: contactsList,
          delayMs: finalMin * 1000,
          minDelayMs: finalMin * 1000,
          maxDelayMs: finalMax * 1000,
          batchSize: batchSize,
          batchPauseSeconds: batchPauseSeconds
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao iniciar disparo');
      }

      const data = await res.json();
      setJobState(data);
      setSuccessMsg('Disparo em lote iniciado!');
      setActiveTab('send');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao iniciar o disparo.');
    }
  };

  const handlePauseBulk = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await apiFetch('/api/whatsapp/bulk-pause', { method: 'POST' });
      const data = await res.json();
      setJobState(data);
    } catch (err) {
      setErrorMsg('Falha ao pausar o disparo.');
    }
  };

  const handleResumeBulk = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await apiFetch('/api/whatsapp/bulk-resume', { method: 'POST' });
      const data = await res.json();
      setJobState(data);
    } catch (err) {
      setErrorMsg('Falha ao retomar o disparo.');
    }
  };

  const handleStopBulk = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await apiFetch('/api/whatsapp/bulk-stop', { method: 'POST' });
      const data = await res.json();
      setJobState(data);
    } catch (err) {
      setErrorMsg('Falha ao parar o disparo.');
    }
  };

  // WhatsApp text formatting helper for preview
  const getPersonalizedPreviewText = (template: string, contact: Contact) => {
    if (!template) return '';
    let personalizedText = template;
    const nameReplacer = contact.name ? contact.name.trim() : '';
    personalizedText = personalizedText.replace(/\{\s*nome\s*\}/gi, nameReplacer);
    personalizedText = personalizedText.replace(/\{\s*name\s*\}/gi, nameReplacer);

    if (contact.variables && Array.isArray(contact.variables)) {
      contact.variables.forEach((variableValue, index) => {
        const varNum = index + 1;
        const varRegex = new RegExp(`\\{\\s*var${varNum}\\s*\\}`, 'gi');
        personalizedText = personalizedText.replace(varRegex, variableValue ? variableValue.trim() : '');
      });
    }
    return personalizedText;
  };

  const renderFormattedMessage = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      let elements: React.ReactNode[] = [line];

      // Match bold *text*
      let matched = true;
      while (matched) {
        matched = false;
        const nextElements: React.ReactNode[] = [];
        for (const item of elements) {
          if (typeof item !== 'string') {
            nextElements.push(item);
            continue;
          }
          const match = item.match(/\*([^*]+)\*/);
          if (match && match.index !== undefined) {
            matched = true;
            const before = item.substring(0, match.index);
            const content = match[1];
            const after = item.substring(match.index + match[0].length);
            if (before) nextElements.push(before);
            nextElements.push(<strong key={`bold-${lineIdx}-${match.index}`} className="font-extrabold text-slate-900">{content}</strong>);
            if (after) nextElements.push(after);
          } else {
            nextElements.push(item);
          }
        }
        elements = nextElements;
      }

      return (
        <div key={lineIdx} className="min-h-[1.2em]">
          {elements}
        </div>
      );
    });
  };

  // If no Workspace is selected, display Home Workspace Selection Screen
  if (!currentWorkspace) {
    return <WorkspaceHome onSelectWorkspace={handleSelectWorkspace} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-on-surface">
      {/* Desktop Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewTaskClick={() => {
          setActiveTab('messages');
        }}
        onLogoutClick={() => setShowDisconnectConfirm(true)}
        waStatus={waStatus}
        contactsCount={contactsList.length}
        messageVariationsCount={messageVariations.length}
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={handleSwitchWorkspace}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Navbar */}
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          waStatus={waStatus}
          totalContacts={contactsList.length}
          currentWorkspace={currentWorkspace}
          onSwitchWorkspace={handleSwitchWorkspace}
        />

        {/* Dynamic Alerts Banner */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 bg-error-container/40 border border-error/40 p-3.5 rounded-xl flex items-center justify-between text-on-error-container text-xs z-30"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-error shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 bg-primary/10 border border-primary/30 p-3.5 rounded-xl flex items-center justify-between text-primary text-xs z-30"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'home' && (
              <HomeGuideView 
                setActiveTab={setActiveTab}
                waStatus={waStatus}
                contactsCount={contactsList.length}
                messageVariationsCount={messageVariations.length}
                currentWorkspace={currentWorkspace}
              />
            )}

            {activeTab === 'connection' && (
              <ConnectionView 
                waStatus={waStatus}
                handleConnect={handleConnect}
                handleDisconnect={handleDisconnect}
                isConnectingLoading={isConnectingLoading}
                setShowDisconnectConfirm={setShowDisconnectConfirm}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesView 
                messageVariations={messageVariations}
                setMessageVariations={setMessageVariations}
                activeVariationIndex={activeVariationIndex}
                setActiveVariationIndex={setActiveVariationIndex}
                currentMessageText={currentMessageText}
                setCurrentMessageText={setCurrentMessageText}
                variationCount={variationCount}
                setVariationCount={setVariationCount}
                handleGenerateVariations={handleGenerateVariations}
                isGeneratingVariations={isGeneratingVariations}
                aiError={aiError}
                attachments={attachments}
                handleAttachmentUpload={handleAttachmentUpload}
                removeAttachment={removeAttachment}
                savedTemplates={savedTemplates}
                newTemplateTitle={newTemplateTitle}
                setNewTemplateTitle={setNewTemplateTitle}
                handleSaveAsTemplate={handleSaveAsTemplate}
                handleLoadTemplate={handleLoadTemplate}
                handleDeleteTemplate={handleDeleteTemplate}
                renderFormattedMessage={renderFormattedMessage}
                getPersonalizedPreviewText={getPersonalizedPreviewText}
                contactsList={contactsList}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView 
                minDelaySec={minDelaySec}
                setMinDelaySec={setMinDelaySec}
                maxDelaySec={maxDelaySec}
                setMaxDelaySec={setMaxDelaySec}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                batchPauseSeconds={batchPauseSeconds}
                setBatchPauseSeconds={setBatchPauseSeconds}
                totalContactsCount={contactsList.length}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactsView 
                contactsList={contactsList}
                setContactsList={setContactsList}
                pasteInput={pasteInput}
                setPasteInput={setPasteInput}
                handleImportPasted={handleImportPasted}
                handleExcelUpload={handleExcelUpload}
                handleClearContacts={handleClearContacts}
                handleLoadSamples={handleLoadSamples}
                handleRemoveContact={handleRemoveContact}
              />
            )}

            {activeTab === 'send' && (
              <SendView 
                jobState={jobState}
                waStatus={waStatus}
                handleStartBulk={handleStartBulk}
                handlePauseBulk={handlePauseBulk}
                handleResumeBulk={handleResumeBulk}
                handleStopBulk={handleStopBulk}
                totalContactsCount={contactsList.length}
                countdown={countdown}
              />
            )}
          </div>
        </main>
      </div>

      {/* Disconnect Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full space-y-4 text-center border border-outline-variant shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto border border-error/20">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface text-base">Desconectar WhatsApp?</h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Essa ação encerrará a sessão ativa do workspace <strong className="text-on-surface">{currentWorkspace.name}</strong>. Você precisará escanear um novo QR Code para conectar novamente.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 py-2.5 bg-surface-container border border-outline-variant text-on-surface font-bold text-xs rounded-xl hover:bg-surface-variant/50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 py-2.5 bg-error text-on-error font-bold text-xs rounded-xl hover:brightness-110 transition-all cursor-pointer"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container border-t border-outline-variant flex justify-around items-center px-2 z-40 select-none">
        <button 
          onClick={() => setActiveTab('connection')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'connection' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-bold">Conexão</span>
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'messages' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-bold">Msgs</span>
        </button>
        <button 
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'contacts' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Contatos</span>
        </button>
        <button 
          onClick={() => setActiveTab('send')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'send' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] font-bold">Envio</span>
        </button>
      </nav>
    </div>
  );
}

