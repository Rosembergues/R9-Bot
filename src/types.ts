export interface Contact {
  phone: string;
  name?: string;
  variables?: string[];
}

export interface ContactProgress {
  phone: string;
  name?: string;
  variables?: string[];
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
  sentAt?: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64 data URI
  size: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  text: string;
}

export interface BulkJob {
  id: string;
  text: string;
  texts?: string[];
  attachments?: Attachment[];
  contacts: ContactProgress[];
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed';
  currentIndex: number;
  delayMs: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  createdAt: string;
  batchSize?: number;
  batchPauseSeconds?: number;
  isBatchPausing?: boolean;
  batchPauseResumeAt?: string;
}

export interface WhatsappStatus {
  status: 'disconnected' | 'connecting' | 'qr' | 'connected';
  qr: string | null;
  user: { id: string; name?: string } | null;
  error?: string | null;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  createdAt: string;
  lastActiveAt: string;
  status: 'disconnected' | 'connecting' | 'qr' | 'connected';
  connectedUser?: { id: string; name?: string } | null;
  hasPin?: boolean;
}

export type ActiveTab = 'home' | 'connection' | 'messages' | 'settings' | 'contacts' | 'send';
