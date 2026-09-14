import React, { useState } from 'react';
import { 
  Users, 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  Search, 
  CheckCircle2, 
  HelpCircle, 
  Table, 
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { Contact } from '../types';

interface ContactsViewProps {
  contactsList: Contact[];
  setContactsList: React.Dispatch<React.SetStateAction<Contact[]>>;
  pasteInput: string;
  setPasteInput: (val: string) => void;
  handleImportPasted: () => void;
  handleExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearContacts: () => void;
  handleLoadSamples: () => void;
  handleRemoveContact: (idx: number) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contactsList,
  setContactsList,
  pasteInput,
  setPasteInput,
  handleImportPasted,
  handleExcelUpload,
  handleClearContacts,
  handleLoadSamples,
  handleRemoveContact
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualVar1, setManualVar1] = useState('');
  const [manualVar2, setManualVar2] = useState('');

  const handleAddSingleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim()) return;

    setContactsList(prev => [
      ...prev,
      {
        name: manualName.trim(),
        phone: manualPhone.trim(),
        variables: [manualVar1.trim(), manualVar2.trim()].filter(Boolean)
      }
    ]);

    setManualName('');
    setManualPhone('');
    setManualVar1('');
    setManualVar2('');
  };

  const filteredContacts = contactsList.filter(c => 
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Gerenciamento de Contatos ({contactsList.length})</h2>
          <p className="text-xs text-on-surface-variant">Importe listas via Excel (.xlsx/.xls), CSV ou cole diretamente com suporte a colunas customizadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSamples}
            className="px-3.5 py-2 bg-surface-container border border-outline-variant hover:border-primary text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Carregar Exemplos
          </button>
          {contactsList.length > 0 && (
            <button
              onClick={handleClearContacts}
              className="px-3.5 py-2 bg-error/10 border border-error/20 text-error hover:bg-error/20 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Lista
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Import Controls Column (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Upload Box */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Importar Planilha Excel / CSV
            </h3>

            <label className="border-2 border-dashed border-outline-variant hover:border-primary rounded-2xl p-6 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2 bg-surface-container-low/30 cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-primary" />
              <div className="text-xs">
                <span className="font-bold text-on-surface">Clique para escolher o arquivo</span>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Formatos suportados: .XLSX, .XLS, .CSV</p>
              </div>
              <input 
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-on-surface-variant">
              O sistema identifica automaticamente as colunas de <strong className="text-on-surface">Nome</strong> e <strong className="text-on-surface">Telefone</strong>, tratando as colunas seguintes como marcadores <span className="font-mono text-primary">{'{var1}'}</span>, <span className="font-mono text-primary">{'{var2}'}</span>.
            </p>
          </div>

          {/* Raw Paste Area */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-primary" />
              Colar Lista Rápida (Linha ou CSV)
            </h3>

            <textarea 
              rows={4}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder={`Exemplo de cola:\nJoão Silva, 21999999999\nMaria Souza, 11988888888\n21977777777`}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface font-mono focus:outline-none focus:border-primary"
            />

            <button
              onClick={handleImportPasted}
              disabled={!pasteInput.trim()}
              className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              <span>Importar Contatos Colados</span>
            </button>
          </div>

          {/* Add Single Contact Form */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Adicionar Contato Individual
            </h3>

            <form onSubmit={handleAddSingleContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  placeholder="Nome do Cliente"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <input 
                  type="text"
                  placeholder="Telefone (ex: 21999999999)"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  placeholder="Variável 1 {var1}"
                  value={manualVar1}
                  onChange={(e) => setManualVar1(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <input 
                  type="text"
                  placeholder="Variável 2 {var2}"
                  value={manualVar2}
                  onChange={(e) => setManualVar2(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={!manualPhone.trim()}
                className="w-full py-2 bg-secondary-container text-on-secondary-container font-bold text-xs rounded-xl hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                Adicionar à Lista
              </button>
            </form>
          </div>
        </div>

        {/* Contacts Data Table (Right 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col min-h-[500px]">
            {/* Table Search Header */}
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou número de telefone..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary shrink-0 bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                {filteredContacts.length} Encontrado(s)
              </span>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[440px]">
              {filteredContacts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-on-surface-variant gap-2 text-xs">
                  <Users className="w-8 h-8 text-outline" />
                  <p>Nenhum contato encontrado nesta lista.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase bg-surface-container-high/40">
                      <th className="p-3">#</th>
                      <th className="p-3">Nome</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">Variáveis ({'{var1}'}, {'{var2}'})</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {filteredContacts.map((contact, idx) => (
                      <tr key={idx} className="hover:bg-surface-variant/30 transition-colors">
                        <td className="p-3 font-mono text-on-surface-variant text-[11px]">{idx + 1}</td>
                        <td className="p-3 font-semibold text-on-surface">{contact.name || '—'}</td>
                        <td className="p-3 font-mono text-primary">{contact.phone}</td>
                        <td className="p-3 text-[11px] font-mono text-on-surface-variant">
                          {contact.variables && contact.variables.length > 0 ? (
                            <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                              {contact.variables.join(' | ')}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveContact(idx)}
                            className="p-1 text-on-surface-variant hover:text-error transition-colors rounded hover:bg-error/10 cursor-pointer"
                            title="Remover Contato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
