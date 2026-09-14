import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Paperclip, 
  Bookmark, 
  Save, 
  Eye, 
  Loader2, 
  FileText, 
  Image, 
  Video, 
  File, 
  Check, 
  X,
  MessageSquare,
  HelpCircle,
  Copy
} from 'lucide-react';
import { Attachment, MessageTemplate, Contact } from '../types';

interface MessagesViewProps {
  messageVariations: string[];
  setMessageVariations: React.Dispatch<React.SetStateAction<string[]>>;
  activeVariationIndex: number;
  setActiveVariationIndex: (idx: number) => void;
  currentMessageText: string;
  setCurrentMessageText: (val: string) => void;
  variationCount: number;
  setVariationCount: (val: number) => void;
  handleGenerateVariations: () => void;
  isGeneratingVariations: boolean;
  aiError: string | null;
  attachments: Attachment[];
  handleAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  savedTemplates: MessageTemplate[];
  newTemplateTitle: string;
  setNewTemplateTitle: (val: string) => void;
  handleSaveAsTemplate: (e: React.FormEvent) => void;
  handleLoadTemplate: (text: string) => void;
  handleDeleteTemplate: (id: string, title: string) => void;
  renderFormattedMessage: (text: string) => React.ReactNode;
  getPersonalizedPreviewText: (template: string, contact: Contact) => string;
  contactsList: Contact[];
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  messageVariations,
  setMessageVariations,
  activeVariationIndex,
  setActiveVariationIndex,
  currentMessageText,
  setCurrentMessageText,
  variationCount,
  setVariationCount,
  handleGenerateVariations,
  isGeneratingVariations,
  aiError,
  attachments,
  handleAttachmentUpload,
  removeAttachment,
  savedTemplates,
  newTemplateTitle,
  setNewTemplateTitle,
  handleSaveAsTemplate,
  handleLoadTemplate,
  handleDeleteTemplate,
  renderFormattedMessage,
  getPersonalizedPreviewText,
  contactsList
}) => {
  const [previewIndex, setPreviewIndex] = useState(0);

  const sampleContact: Contact = contactsList.length > 0 ? contactsList[previewIndex % contactsList.length] : {
    name: 'João Silva',
    phone: '21999999999',
    variables: ['10452', 'R$ 150,00']
  };

  const addVariation = () => {
    setMessageVariations(prev => [...prev, 'Nova variação de mensagem com {nome}.']);
    setActiveVariationIndex(messageVariations.length);
  };

  const deleteVariation = (idx: number) => {
    if (messageVariations.length <= 1) return;
    setMessageVariations(prev => prev.filter((_, i) => i !== idx));
    if (activeVariationIndex >= messageVariations.length - 1) {
      setActiveVariationIndex(Math.max(0, messageVariations.length - 2));
    }
  };

  const personalizedText = getPersonalizedPreviewText(currentMessageText, sampleContact);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Conteúdo das Mensagens e Anexos</h2>
          <p className="text-xs text-on-surface-variant">Configure variações do texto, use IA para diversificar mensagens e anexe imagens, áudios e documentos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor & Variations Column (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Rotator Variations Bar */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Rotador de Mensagens ({messageVariations.length} Variações)
              </h3>
              <button
                onClick={addVariation}
                className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Variação</span>
              </button>
            </div>

            {/* Variation Tabs */}
            <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-none">
              {messageVariations.map((_, idx) => (
                <div key={idx} className="flex items-center shrink-0">
                  <button
                    onClick={() => setActiveVariationIndex(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeVariationIndex === idx
                        ? 'bg-primary text-on-primary shadow-md shadow-primary/10'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant'
                    }`}
                  >
                    <span>Variação #{idx + 1}</span>
                    {messageVariations.length > 1 && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteVariation(idx);
                        }}
                        className="p-0.5 hover:bg-black/20 rounded cursor-pointer"
                        title="Excluir Variação"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Textarea Editor */}
            <div className="space-y-2">
              <textarea
                rows={5}
                value={currentMessageText}
                onChange={(e) => setCurrentMessageText(e.target.value)}
                placeholder="Escreva sua mensagem aqui... Use {nome}, {var1}, {var2} para personalização dinâmica."
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-xs text-on-surface focus:outline-none focus:border-primary leading-relaxed"
              />
              <div className="flex flex-wrap items-center justify-between text-[11px] text-on-surface-variant gap-2 pt-1">
                <div className="flex flex-wrap gap-2 font-mono">
                  <span className="px-2 py-0.5 bg-surface-container-high rounded border border-outline-variant text-primary font-bold">{'{nome}'}</span>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded border border-outline-variant">{'{var1}'}</span>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded border border-outline-variant">{'{var2}'}</span>
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  Formatos WhatsApp: <strong className="text-on-surface">*negrito*</strong>, <em className="text-on-surface">_itálico_</em>, <del className="text-on-surface">~tachado~</del>
                </div>
              </div>
            </div>

            {/* Gemini AI Variation Generator Section */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Gerador de Variações Gemini AI</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface-variant">Qtd:</span>
                  <select
                    value={variationCount}
                    onChange={(e) => setVariationCount(Number(e.target.value))}
                    className="bg-surface-container border border-outline-variant rounded-lg text-xs px-2 py-1 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value={2}>2 variações</option>
                    <option value={3}>3 variações</option>
                    <option value={5}>5 variações</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant">
                Gere versões sinônimas da mensagem acima mantendo as saudações e variáveis <span className="font-mono text-primary">{'{nome}'}</span> intactas para evitar o filtro de spam do WhatsApp.
              </p>

              {aiError && (
                <p className="text-xs text-error font-semibold bg-error/10 p-2 rounded-lg border border-error/20">
                  {aiError}
                </p>
              )}

              <button
                onClick={handleGenerateVariations}
                disabled={isGeneratingVariations || !currentMessageText.trim()}
                className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-primary/10"
              >
                {isGeneratingVariations ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Gerar Variações com IA Gemini</span>
              </button>
            </div>
          </div>

          {/* File Attachments Upload Section */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />
                Anexos de Mídia e Documentos ({attachments.length})
              </h3>
              <label className="px-3.5 py-1.5 bg-surface-container border border-outline-variant hover:border-primary text-on-surface rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                <span>Adicionar Arquivo</span>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleAttachmentUpload}
                  className="hidden" 
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <div className="border-2 border-dashed border-outline-variant rounded-2xl p-6 text-center text-on-surface-variant space-y-2 bg-surface-container-low/30">
                <Paperclip className="w-8 h-8 mx-auto text-outline" />
                <p className="text-xs font-semibold">Nenhum anexo adicionado ainda.</p>
                <p className="text-[11px] opacity-70">Envie imagens (PNG/JPG), vídeos (MP4), PDFs ou áudios para acompanhar o disparo das mensagens.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att, idx) => {
                  const isImage = att.type.startsWith('image/');
                  const isVideo = att.type.startsWith('video/');
                  const sizeMb = (att.size / (1024 * 1024)).toFixed(2);

                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {isImage ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                            <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 text-primary">
                            {isVideo ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="overflow-hidden text-xs">
                          <p className="font-bold text-on-surface truncate">{att.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{sizeMb} MB</p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeAttachment(idx)}
                        className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error/10 cursor-pointer"
                        title="Remover anexo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Templates Library Section */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              Modelos Salvos de Mensagem
            </h3>

            {/* Save Form */}
            <form onSubmit={handleSaveAsTemplate} className="flex gap-2">
              <input 
                type="text"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                placeholder="Título do modelo (ex: Promoção de Boas Vindas)..."
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {savedTemplates.map((tpl) => (
                <div key={tpl.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant flex justify-between items-start gap-3">
                  <div className="space-y-1 overflow-hidden">
                    <h5 className="font-bold text-xs text-on-surface">{tpl.title}</h5>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2">{tpl.text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleLoadTemplate(tpl.text)}
                      className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                    >
                      Carregar
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                      className="p-1 text-on-surface-variant hover:text-error cursor-pointer"
                      title="Excluir modelo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live WhatsApp Mobile Mockup Preview Column (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Pré-visualização do WhatsApp
              </h3>
              {contactsList.length > 0 && (
                <button
                  onClick={() => setPreviewIndex(prev => prev + 1)}
                  className="text-[10px] text-primary hover:underline font-mono font-bold"
                >
                  Alternar Contato #{previewIndex + 1}
                </button>
              )}
            </div>

            {/* Mobile Device Frame */}
            <div className="mx-auto max-w-[300px] bg-slate-900 border-4 border-slate-700 rounded-[32px] overflow-hidden shadow-2xl flex flex-col min-h-[460px]">
              {/* WhatsApp Header */}
              <div className="bg-[#075e54] text-white p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                  {sampleContact.name ? sampleContact.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-tight">{sampleContact.name || 'Contato Exemplo'}</h4>
                  <p className="text-[10px] text-emerald-200 font-mono">{sampleContact.phone}</p>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 bg-[#efeae2] p-3 space-y-3 overflow-y-auto min-h-[340px]">
                {/* Chat Bubble */}
                <div className="bg-[#dcf8c6] text-slate-900 p-3 rounded-xl rounded-tr-none max-w-[88%] ml-auto text-xs shadow-sm space-y-2">
                  {/* Attachments Preview inside bubble */}
                  {attachments.map((att, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-300 bg-white/50 p-1">
                      {att.type.startsWith('image/') ? (
                        <img src={att.data} alt="Anexo" className="w-full max-h-36 object-cover rounded" />
                      ) : (
                        <div className="flex items-center gap-2 p-1.5 text-[11px] font-semibold text-slate-800">
                          <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="truncate">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="leading-relaxed whitespace-pre-wrap break-words text-[11px]">
                    {renderFormattedMessage(personalizedText) || 'Sua mensagem aparecerá aqui...'}
                  </div>

                  <div className="text-[9px] text-slate-500 text-right font-mono pt-1">
                    12:30 ✓✓
                  </div>
                </div>
              </div>

              {/* Input Footer */}
              <div className="bg-slate-800 p-2 text-slate-400 text-[10px] text-center border-t border-slate-700 font-mono">
                WhatsApp Preview Real-time
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
