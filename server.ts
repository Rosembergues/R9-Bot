import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as baileysImport from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { GoogleGenAI, Type } from "@google/genai";

// Lazy Gemini Client initialization
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Safely resolve makeWASocket and other exports for both ESM/CJS interop and bundlers (e.g. Render/Vercel)
function getBaileysExport(name: string): any {
  const b = baileysImport as any;
  if (!b) return undefined;
  if (b[name] !== undefined) return b[name];
  if (b.default && b.default[name] !== undefined) return b.default[name];
  if (b.default && b.default.default && b.default.default[name] !== undefined) return b.default.default[name];
  return undefined;
}

function createWASocket(options: any): any {
  const b = baileysImport as any;
  const fn = 
    (typeof b === 'function' && b) ||
    (typeof b?.default === 'function' && b.default) ||
    (typeof b?.makeWASocket === 'function' && b.makeWASocket) ||
    (typeof b?.default?.default === 'function' && b.default.default) ||
    (typeof b?.default?.makeWASocket === 'function' && b.default.makeWASocket);

  if (typeof fn !== 'function') {
    console.error("baileysImport structure debug:", {
      isBFunction: typeof b === 'function',
      bKeys: b ? Object.keys(b) : null,
      defaultType: typeof b?.default,
      defaultKeys: b?.default ? Object.keys(b.default) : null
    });
    throw new Error(`Baileys makeWASocket function not found in import.`);
  }
  return fn(options);
}

type WASocket = any;

// Brazilian Phone Number Normalizer (Local Fallback Heuristic)
function formatBrazilNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  
  // Check if it's a Brazilian number
  const isBrazilian = phone.trim().startsWith('+55') || 
                      (clean.startsWith('55') && clean.length >= 12) || 
                      (!phone.trim().startsWith('+') && clean.length <= 11);

  if (!isBrazilian) {
    return clean;
  }

  // If starts with 55, remove it temporarily to normalize
  if (clean.startsWith('55') && clean.length > 10) {
    clean = clean.substring(2);
  }
  
  if (clean.length < 10) {
    return '55' + clean;
  }
  
  const ddd = parseInt(clean.substring(0, 2), 10);
  let number = clean.substring(2);
  
  // Check if the number is a landline (in Brazil, landlines start with 2, 3, 4, 5)
  const firstDigit = number.charAt(0);
  const isLandline = firstDigit === '2' || firstDigit === '3' || firstDigit === '4' || firstDigit === '5';
  
  // Only apply 9th digit rules to mobile numbers
  if (!isLandline) {
    if (number.length === 9 && number.startsWith('9')) {
      // If DDD is outside SP/RJ/ES (11 to 28), we remove the 9th digit (first 9)
      if (ddd < 11 || ddd > 28) {
        number = number.substring(1);
      }
    } else if (number.length === 8) {
      // If DDD is inside SP/RJ/ES (11 to 28), and the number only has 8 digits, we prefix it with 9
      if (ddd >= 11 && ddd <= 28) {
        number = '9' + number;
      }
    }
  }
  
  return `55${ddd}${number}`;
}

// Types
interface ContactProgress {
  phone: string;
  name?: string;
  variables?: string[];
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
  sentAt?: string;
}

interface AttachmentPayload {
  name: string;
  type: string;
  data: string; // base64 data URI
}

interface BulkJob {
  id: string;
  text: string;
  texts?: string[];
  attachments?: AttachmentPayload[];
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

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

// Enable CORS for external frontends (e.g. Vercel)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Favicon handler
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0284c7"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="240" font-weight="900" letter-spacing="-6px">R9</text></svg>`;

app.get(["/favicon.ico", "/favicon.svg"], (req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(FAVICON_SVG);
});

// Multi-Workspace State Management
interface WorkspaceSession {
  id: string;
  name: string;
  pin?: string | null;
  createdAt: string;
  lastActiveAt: string;
  sock: WASocket | null;
  qrCodeDataUrl: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'qr' | 'connected';
  connectedUser: { id: string; name?: string } | null;
  lastConnectionError: string | null;
  activeJob: BulkJob;
  jobTimeout: NodeJS.Timeout | null;
  authDir: string;
}

const workspaceSessions = new Map<string, WorkspaceSession>();
const baseAuthDir = path.join(process.cwd(), 'auth_info_baileys');

interface WorkspaceMetadata {
  id: string;
  name: string;
  pin?: string | null;
  createdAt: string;
  lastActiveAt: string;
}

function saveWorkspaceMetadata(session: WorkspaceSession) {
  try {
    if (!fs.existsSync(session.authDir)) {
      fs.mkdirSync(session.authDir, { recursive: true });
    }
    const metaPath = path.join(session.authDir, 'workspace.json');
    const data: WorkspaceMetadata = {
      id: session.id,
      name: session.name,
      pin: session.pin || null,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt
    };
    fs.writeFileSync(metaPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[WS:${session.id}] Erro ao salvar metadados do workspace:`, e);
  }
}

function loadWorkspaceMetadata(session: WorkspaceSession) {
  try {
    const metaPath = path.join(session.authDir, 'workspace.json');
    if (fs.existsSync(metaPath)) {
      const content = fs.readFileSync(metaPath, 'utf-8');
      const data: WorkspaceMetadata = JSON.parse(content);
      if (data.name) session.name = data.name;
      if (data.pin) session.pin = data.pin;
      if (data.createdAt) session.createdAt = data.createdAt;
    }
  } catch (e) {
    console.error(`[WS:${session.id}] Erro ao carregar metadados do workspace:`, e);
  }
}

function isValidNumericPin(pin: any): boolean {
  if (pin === undefined || pin === null) return false;
  const str = String(pin).trim();
  return /^\d{4,}$/.test(str);
}

// Rotina Diária de Limpeza dos Workspaces às 00:00
let lastCleanupAt: string | null = null;
let nextCleanupAt: string | null = null;

function runDailyCleanupRoutine() {
  const nowStr = new Date().toISOString();
  console.log(`\n==================================================`);
  console.log(`[ROTINA DIÁRIA 00:00] Executando limpeza e manutenção dos workspaces (${nowStr})...`);
  
  let cleanedJobsCount = 0;
  let clearedQrsCount = 0;

  workspaceSessions.forEach((session) => {
    // 1. Limpar buffers de memória de anexos em trabalhos concluídos ou parados
    if (session.activeJob && (session.activeJob.status === 'completed' || session.activeJob.status === 'stopped' || session.activeJob.status === 'idle')) {
      if (session.activeJob.attachments && session.activeJob.attachments.length > 0) {
        session.activeJob.attachments = [];
        cleanedJobsCount++;
      }
    }

    // 2. Limpar QR Codes obsoletos em sessões desconectadas
    if (session.connectionStatus === 'disconnected' && session.qrCodeDataUrl) {
      session.qrCodeDataUrl = null;
      clearedQrsCount++;
    }

    // 3. Atualizar e salvar metadados
    saveWorkspaceMetadata(session);
  });

  lastCleanupAt = nowStr;
  console.log(`[ROTINA DIÁRIA 00:00] Limpeza concluída com sucesso! (${cleanedJobsCount} anexos liberados, ${clearedQrsCount} QRs limpos)`);
  console.log(`==================================================\n`);
}

function scheduleDailyMidnightCleanup() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);

  const msUntilMidnight = nextMidnight.getTime() - now.getTime();
  nextCleanupAt = nextMidnight.toISOString();

  console.log(`[ROTINA DIÁRIA 00:00] Próxima execução de limpeza agendada para: ${nextMidnight.toLocaleString('pt-BR')} (daqui a ${(msUntilMidnight / (1000 * 60 * 60)).toFixed(2)}h)`);

  setTimeout(() => {
    try {
      runDailyCleanupRoutine();
    } catch (e) {
      console.error('[ROTINA DIÁRIA 00:00] Erro ao executar limpeza diária:', e);
    }
    scheduleDailyMidnightCleanup();
  }, msUntilMidnight);
}

// Iniciar agendador diário da meia-noite
scheduleDailyMidnightCleanup();

// Slugify helper for workspace ID
function slugifyWorkspace(name: string): string {
  if (!name || typeof name !== 'string') return 'default';
  const clean = name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || 'default';
}

function getWorkspaceSession(workspaceIdRaw?: string, workspaceNameRaw?: string): WorkspaceSession {
  const id = slugifyWorkspace(workspaceIdRaw || 'default');
  let session = workspaceSessions.get(id);

  if (!session) {
    const wsName = (workspaceNameRaw && workspaceNameRaw.trim()) 
      ? workspaceNameRaw.trim() 
      : (id === 'default' ? 'Espaço Principal' : (workspaceIdRaw?.trim() || id));
      
    const wsAuthDir = path.join(baseAuthDir, `ws_${id}`);

    session = {
      id,
      name: wsName,
      pin: null,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      sock: null,
      qrCodeDataUrl: null,
      connectionStatus: 'disconnected',
      connectedUser: null,
      lastConnectionError: null,
      activeJob: {
        id: '',
        text: '',
        contacts: [],
        status: 'idle',
        currentIndex: 0,
        delayMs: 4000,
        minDelayMs: 4000,
        maxDelayMs: 8000,
        createdAt: '',
        batchSize: 10,
        batchPauseSeconds: 30,
        isBatchPausing: false,
      },
      jobTimeout: null,
      authDir: wsAuthDir
    };

    // Load persisted metadata if workspace.json exists
    loadWorkspaceMetadata(session);

    workspaceSessions.set(id, session);
  }

  if (workspaceNameRaw && workspaceNameRaw.trim() && session.name !== workspaceNameRaw.trim()) {
    session.name = workspaceNameRaw.trim();
    saveWorkspaceMetadata(session);
  }

  session.lastActiveAt = new Date().toISOString();
  return session;
}

function extractWorkspace(req: express.Request): WorkspaceSession {
  const wsHeader = req.headers['x-workspace-id'] as string;
  const wsQuery = req.query.workspaceId as string;
  const wsBody = req.body?.workspaceId as string;
  const wsNameBody = req.body?.workspaceName as string;

  const targetId = wsHeader || wsQuery || wsBody || 'default';
  return getWorkspaceSession(targetId, wsNameBody);
}

// Resolve correct WhatsApp JID
async function resolveJidForWhatsApp(phone: string, sock?: WASocket | null, connectionStatus?: string): Promise<string> {
  let clean = phone.replace(/\D/g, '');
  
  const isBrazilian = phone.trim().startsWith('+55') || 
                      (clean.startsWith('55') && clean.length >= 12) || 
                      (!phone.trim().startsWith('+') && clean.length <= 11);

  if (!isBrazilian) {
    return `${clean}@s.whatsapp.net`;
  }

  if (clean.startsWith('55') && clean.length > 10) {
    clean = clean.substring(2);
  }
  
  if (clean.length < 10) {
    return `55${clean}@s.whatsapp.net`;
  }
  
  const ddd = parseInt(clean.substring(0, 2), 10);
  let number = clean.substring(2);
  
  let number9 = number;
  let number8 = number;
  
  if (number.length === 9 && number.startsWith('9')) {
    number8 = number.substring(1);
  } else if (number.length === 8) {
    number9 = '9' + number;
  }
  
  const jid9 = `55${ddd}${number9}@s.whatsapp.net`;
  const jid8 = `55${ddd}${number8}@s.whatsapp.net`;
  
  const firstDigit = number.charAt(0);
  const isLandline = firstDigit === '2' || firstDigit === '3' || firstDigit === '4' || firstDigit === '5';
  
  const isInsideSpRjEs = ddd >= 11 && ddd <= 28;
  let heuristicJid = jid8;
  if (isLandline) {
    heuristicJid = jid8;
  } else if (isInsideSpRjEs) {
    heuristicJid = jid9;
  } else {
    heuristicJid = jid9; 
  }

  const primaryJid = isLandline ? jid8 : jid9;
  const secondaryJid = isLandline ? jid9 : jid8;

  if (sock && connectionStatus === 'connected') {
    try {
      const results = await sock.onWhatsApp(primaryJid);
      if (results && results.length > 0 && results[0].exists) {
        return results[0].jid;
      }
    } catch (e) {
      console.warn(`WhatsApp server query for primary JID ${primaryJid} failed:`, e);
    }

    try {
      const results = await sock.onWhatsApp(secondaryJid);
      if (results && results.length > 0 && results[0].exists) {
        return results[0].jid;
      }
    } catch (e) {
      console.warn(`WhatsApp server query for secondary JID ${secondaryJid} failed:`, e);
    }
  }
  
  return heuristicJid;
}

// Initialize WhatsApp connection per workspace session
async function connectToWhatsApp(session: WorkspaceSession) {
  if (session.sock) {
    try {
      session.sock.ev.removeAllListeners('connection.update');
      session.sock.ev.removeAllListeners('creds.update');
      session.sock.end(undefined);
    } catch (e) {
      console.error(`[WS:${session.id}] Error ending previous WhatsApp socket:`, e);
    }
  }

  session.connectionStatus = 'connecting';
  session.qrCodeDataUrl = null;
  console.log(`[WS:${session.id}] Initializing WhatsApp connection...`);

  let authState;
  const useMultiFileAuthState = getBaileysExport('useMultiFileAuthState');
  try {
    authState = await useMultiFileAuthState(session.authDir);
  } catch (authErr) {
    console.error(`[WS:${session.id}] Error loading Baileys auth state, cleaning directory and retrying...`, authErr);
    try {
      fs.rmSync(session.authDir, { recursive: true, force: true });
    } catch (rmErr) {
      console.error(`[WS:${session.id}] Failed to clean auth directory:`, rmErr);
    }
    authState = await useMultiFileAuthState(session.authDir);
  }

  const { state, saveCreds } = authState;

  try {
    let version: any = [2, 3000, 1017531287];
    const fetchLatestBaileysVersion = getBaileysExport('fetchLatestBaileysVersion');
    if (typeof fetchLatestBaileysVersion === 'function') {
      try {
        const latest = await fetchLatestBaileysVersion();
        version = latest.version;
        console.log(`[WS:${session.id}] Fetched latest Baileys version: ${version}`);
      } catch (err) {
        console.warn(`[WS:${session.id}] Could not fetch latest Baileys version, using stable fallback:`, err);
      }
    }

    const Browsers = getBaileysExport('Browsers');
    const socketOptions: any = {
      printQRInTerminal: true,
      auth: state,
      logger: pino({ level: 'silent' }),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      browser: Browsers ? Browsers.appropriate('Desktop') : ['Windows', 'Chrome', '125.0.0.0'],
    };
    if (version) {
      socketOptions.version = version;
    }

    session.sock = createWASocket(socketOptions);

    session.sock.ev.on('creds.update', saveCreds);

    session.sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        session.connectionStatus = 'qr';
        try {
          session.qrCodeDataUrl = await QRCode.toDataURL(qr);
          console.log(`[WS:${session.id}] New WhatsApp QR code generated.`);
        } catch (err) {
          console.error(`[WS:${session.id}] Failed to generate QR data URL:`, err);
        }
      }

      if (connection === 'close') {
        session.qrCodeDataUrl = null;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const errMsg = lastDisconnect?.error?.message || (lastDisconnect?.error as any)?.output?.payload?.message || 'Conexão encerrada.';
        session.lastConnectionError = `Fechado. Código: ${statusCode || 'N/A'}. Motivo: ${errMsg}`;
        
        const DisconnectReason = getBaileysExport('DisconnectReason');
        const loggedOutCode = DisconnectReason?.loggedOut ?? 401;
        const shouldReconnect = statusCode !== loggedOutCode && statusCode !== 402 && statusCode !== 403 && statusCode !== 405;

        console.log(`[WS:${session.id}] WhatsApp connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          session.connectionStatus = 'connecting';
          setTimeout(() => connectToWhatsApp(session), 5000);
        } else {
          session.connectionStatus = 'disconnected';
          session.connectedUser = null;
          console.log(`[WS:${session.id}] WhatsApp logged out or bad session. Cleaning credentials...`);
          try {
            fs.rmSync(session.authDir, { recursive: true, force: true });
          } catch (err) {
            console.error(`[WS:${session.id}] Error cleaning up auth credentials:`, err);
          }
          setTimeout(() => connectToWhatsApp(session), 2000);
        }
      } else if (connection === 'open') {
        session.connectionStatus = 'connected';
        session.qrCodeDataUrl = null;
        session.lastConnectionError = null;
        const user = session.sock?.user;
        session.connectedUser = user ? { id: user.id, name: user.name } : null;
        console.log(`[WS:${session.id}] WhatsApp connection successfully established with user:`, user);
      }
    });
  } catch (err: any) {
    console.error(`[WS:${session.id}] Failed to connect to WhatsApp:`, err);
    session.connectionStatus = 'disconnected';
    session.lastConnectionError = err.message || String(err);
  }
}

// Background sender worker step per workspace session
async function executeJobStep(session: WorkspaceSession) {
  const { activeJob } = session;
  if (activeJob.status !== 'running') return;
  if (activeJob.currentIndex >= activeJob.contacts.length) {
    activeJob.status = 'completed';
    console.log(`[WS:${session.id}] Bulk messaging job completed.`);
    return;
  }

  const contact = activeJob.contacts[activeJob.currentIndex];
  contact.status = 'sending';

  try {
    if (!session.sock || session.connectionStatus !== 'connected') {
      throw new Error('WhatsApp não está conectado neste workspace.');
    }

    const jid = await resolveJidForWhatsApp(contact.phone, session.sock, session.connectionStatus);

    {
      let selectedTemplate = activeJob.text;
      if (activeJob.texts && activeJob.texts.length > 0) {
        const validTemplates = activeJob.texts.filter(t => t && t.trim() !== '');
        if (validTemplates.length > 0) {
          const randomIndex = Math.floor(Math.random() * validTemplates.length);
          selectedTemplate = validTemplates[randomIndex];
        }
      }

      let personalizedText = selectedTemplate;
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

      if (activeJob.attachments && activeJob.attachments.length > 0) {
        const captionCarrier = activeJob.attachments.find(a => a.type.startsWith('image/') || a.type.startsWith('video/'));
        
        if (captionCarrier) {
          const base64Data = captionCarrier.data.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          if (captionCarrier.type.startsWith('image/')) {
            await session.sock.sendMessage(jid, { image: buffer, caption: personalizedText });
          } else {
            await session.sock.sendMessage(jid, { video: buffer, caption: personalizedText });
          }

          for (const att of activeJob.attachments) {
            if (att === captionCarrier) continue;
            const attBase64 = att.data.split(',')[1];
            const attBuffer = Buffer.from(attBase64, 'base64');
            
            if (att.type.startsWith('image/')) {
              await session.sock.sendMessage(jid, { image: attBuffer });
            } else if (att.type.startsWith('video/')) {
              await session.sock.sendMessage(jid, { video: attBuffer });
            } else if (att.type.startsWith('audio/')) {
              await session.sock.sendMessage(jid, { audio: attBuffer, mimetype: att.type });
            } else {
              await session.sock.sendMessage(jid, { document: attBuffer, mimetype: att.type, fileName: att.name });
            }
          }
        } else {
          if (personalizedText && personalizedText.trim() !== '') {
            await session.sock.sendMessage(jid, { text: personalizedText });
          }
          
          for (const att of activeJob.attachments) {
            const attBase64 = att.data.split(',')[1];
            const attBuffer = Buffer.from(attBase64, 'base64');
            
            if (att.type.startsWith('image/')) {
              await session.sock.sendMessage(jid, { image: attBuffer });
            } else if (att.type.startsWith('video/')) {
              await session.sock.sendMessage(jid, { video: attBuffer });
            } else if (att.type.startsWith('audio/')) {
              await session.sock.sendMessage(jid, { audio: attBuffer, mimetype: att.type });
            } else {
              await session.sock.sendMessage(jid, { document: attBuffer, mimetype: att.type, fileName: att.name });
            }
          }
        }
      } else {
        if (personalizedText && personalizedText.trim() !== '') {
          await session.sock.sendMessage(jid, { text: personalizedText });
        }
      }
      contact.status = 'sent';
      contact.sentAt = new Date().toISOString();
      console.log(`[WS:${session.id}] Successfully sent message to ${contact.phone}`);
    }
  } catch (err: any) {
    console.error(`[WS:${session.id}] Error sending message to ${contact.phone}:`, err);
    contact.status = 'failed';
    contact.error = err.message || 'Erro desconhecido ao enviar mensagem';
  }

  activeJob.currentIndex++;

  if (activeJob.currentIndex < activeJob.contacts.length && activeJob.status === 'running') {
    const batchSize = activeJob.batchSize || 0;
    const batchPauseSeconds = activeJob.batchPauseSeconds || 0;

    if (batchSize > 0 && batchPauseSeconds > 0 && activeJob.currentIndex % batchSize === 0) {
      console.log(`[WS:${session.id}] Batch boundary reached (${activeJob.currentIndex} msgs). Pausing for ${batchPauseSeconds}s...`);
      activeJob.isBatchPausing = true;
      activeJob.batchPauseResumeAt = new Date(Date.now() + batchPauseSeconds * 1000).toISOString();

      session.jobTimeout = setTimeout(() => {
        activeJob.isBatchPausing = false;
        activeJob.batchPauseResumeAt = undefined;
        executeJobStep(session);
      }, batchPauseSeconds * 1000);
    } else {
      activeJob.isBatchPausing = false;
      activeJob.batchPauseResumeAt = undefined;
      
      let nextDelay = activeJob.delayMs;
      if (activeJob.minDelayMs !== undefined && activeJob.maxDelayMs !== undefined) {
        const min = Math.min(activeJob.minDelayMs, activeJob.maxDelayMs);
        const max = Math.max(activeJob.minDelayMs, activeJob.maxDelayMs);
        nextDelay = Math.floor(Math.random() * (max - min + 1)) + min;
      }
      session.jobTimeout = setTimeout(() => executeJobStep(session), nextDelay);
    }
  } else if (activeJob.currentIndex >= activeJob.contacts.length) {
    activeJob.status = 'completed';
    activeJob.isBatchPausing = false;
    activeJob.batchPauseResumeAt = undefined;
  }
}

// REST API Endpoints

// Workspaces List & Creation
app.get("/api/workspaces", (req, res) => {
  const list = Array.from(workspaceSessions.values()).map(ws => ({
    id: ws.id,
    name: ws.name,
    createdAt: ws.createdAt,
    lastActiveAt: ws.lastActiveAt,
    status: ws.connectionStatus,
    connectedUser: ws.connectedUser,
    hasPin: !!ws.pin
  }));
  res.json(list);
});

app.post("/api/workspaces/create", (req, res) => {
  const { name, pin } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "O nome do workspace é obrigatório." });
  }

  if (!isValidNumericPin(pin)) {
    return res.status(400).json({ error: "O PIN é obrigatório e deve conter apenas números com no mínimo 4 dígitos (ex: 1234)." });
  }

  const cleanPin = String(pin).trim();
  const session = getWorkspaceSession(name, name);

  if (session.pin && session.pin !== cleanPin) {
    return res.status(401).json({ error: "PIN incorreto para este workspace." });
  }

  session.pin = cleanPin;
  saveWorkspaceMetadata(session);

  res.json({
    id: session.id,
    name: session.name,
    createdAt: session.createdAt,
    lastActiveAt: session.lastActiveAt,
    status: session.connectionStatus,
    connectedUser: session.connectedUser,
    hasPin: true
  });
});

app.post("/api/workspaces/verify-pin", (req, res) => {
  const { workspaceId, pin } = req.body || {};
  if (!workspaceId) {
    return res.status(400).json({ error: "ID do workspace é obrigatório." });
  }

  const session = workspaceSessions.get(slugifyWorkspace(workspaceId));
  if (!session) {
    return res.status(404).json({ error: "Workspace não encontrado." });
  }

  const cleanPin = pin ? String(pin).trim() : '';

  if (!session.pin) {
    if (isValidNumericPin(cleanPin)) {
      session.pin = cleanPin;
      saveWorkspaceMetadata(session);
      return res.json({
        success: true,
        workspace: {
          id: session.id,
          name: session.name,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
          status: session.connectionStatus,
          connectedUser: session.connectedUser,
          hasPin: true
        }
      });
    }
    return res.status(400).json({ error: "Defina um PIN numérico de no mínimo 4 dígitos para este workspace." });
  }

  if (cleanPin !== session.pin) {
    return res.status(401).json({ error: "PIN incorreto. Digite os 4 ou mais dígitos cadastrados para este workspace." });
  }

  res.json({
    success: true,
    workspace: {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      status: session.connectionStatus,
      connectedUser: session.connectedUser,
      hasPin: true
    }
  });
});

app.get("/api/workspaces/cleanup-status", (req, res) => {
  res.json({
    lastCleanupAt,
    nextCleanupAt
  });
});

app.post("/api/workspaces/cleanup-now", (req, res) => {
  runDailyCleanupRoutine();
  res.json({
    success: true,
    message: "Rotina de limpeza dos workspaces às 00h executada com sucesso.",
    lastCleanupAt,
    nextCleanupAt
  });
});

app.get("/api/whatsapp/status", (req, res) => {
  const ws = extractWorkspace(req);
  res.json({
    workspaceId: ws.id,
    workspaceName: ws.name,
    status: ws.connectionStatus,
    qr: ws.qrCodeDataUrl,
    user: ws.connectedUser,
    error: ws.lastConnectionError
  });
});

app.post("/api/whatsapp/connect", async (req, res) => {
  const ws = extractWorkspace(req);
  const { force } = req.body || {};
  if (force || (ws.connectionStatus !== 'connected' && ws.connectionStatus !== 'connecting')) {
    connectToWhatsApp(ws);
  }
  res.json({ workspaceId: ws.id, status: ws.connectionStatus });
});

app.post("/api/whatsapp/send-test", async (req, res) => {
  const ws = extractWorkspace(req);
  const { phone, text } = req.body;
  if (!phone || !text) {
    return res.status(400).json({ error: "Telefone e texto de teste são obrigatórios." });
  }

  if (!ws.sock || ws.connectionStatus !== 'connected') {
    return res.status(400).json({ error: "WhatsApp não está conectado neste workspace." });
  }

  try {
    const jid = await resolveJidForWhatsApp(phone, ws.sock, ws.connectionStatus);
    await ws.sock.sendMessage(jid, { text });
    res.json({ success: true, message: `Mensagem de teste enviada com sucesso!` });
  } catch (err: any) {
    console.error(`[WS:${ws.id}] Error sending test message:`, err);
    res.status(500).json({ error: err.message || 'Erro ao enviar mensagem de teste' });
  }
});

app.post("/api/whatsapp/generate-variations", async (req, res) => {
  const { message, count } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "A mensagem base é obrigatória para gerar variações." });
  }

  const numVariations = Math.max(1, Math.min(10, Number(count) || 3));

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "O recurso de IA não está configurado. Verifique se a variável GEMINI_API_KEY está definida nos segredos." });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gere exatamente ${numVariations} variações diferentes da mensagem a seguir, para serem enviadas pelo WhatsApp.

Mensagem original:
"${message}"

REQUISITOS IMPORTANTES:
1. Mantenha todas as variáveis dinâmicas (como {nome}, {var1}, {var2}, {var3}, etc.) intactas e nos locais correspondentes das frases para que a substituição de dados continue funcionando normalmente.
2. Altere as saudações (ex: "Olá", "Oi", "Tudo bem?", "Como vai?", "E aí"), a ordem das palavras, use sinônimos e mude a formatação e pontuação levemente para que as mensagens fiquem o mais diferentes possível entre si (para evitar detecção de spam e banimento no WhatsApp).
3. Preserve exatamente o mesmo significado principal e tom da mensagem original (seja profissional, amigável, cobrança, suporte, etc.).
4. Não inclua numeração, nem explicações nas respostas. Retorne apenas as mensagens finais no formato solicitado.`,
      config: {
        systemInstruction: "Você é um especialista em redação e marketing conversacional, especializado em evitar filtros de spam do WhatsApp diversificando as mensagens sem perder o tom e os marcadores dinâmicos. Você SEMPRE retorna a resposta exatamente como uma lista/array JSON de strings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta da IA vazia.");
    }

    const variations = JSON.parse(text.trim());
    res.json({ variations });
  } catch (err: any) {
    console.error('Erro ao gerar variações com Gemini:', err);
    res.status(500).json({ error: "Erro ao gerar variações com IA: " + (err.message || err) });
  }
});

app.post("/api/whatsapp/disconnect", async (req, res) => {
  const ws = extractWorkspace(req);
  console.log(`[WS:${ws.id}] Disconnecting WhatsApp...`);
  ws.connectionStatus = 'disconnected';
  ws.qrCodeDataUrl = null;
  ws.connectedUser = null;

  if (ws.sock) {
    try {
      ws.sock.ev.removeAllListeners('connection.update');
      ws.sock.ev.removeAllListeners('creds.update');
      ws.sock.logout();
      ws.sock.end(undefined);
    } catch (e) {
      console.error(`[WS:${ws.id}] Error logging out from socket:`, e);
    }
    ws.sock = null;
  }

  try {
    fs.rmSync(ws.authDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`[WS:${ws.id}] Error cleaning up auth credentials:`, err);
  }

  res.json({ workspaceId: ws.id, status: 'disconnected' });
});

// Bulk Messaging Endpoints
app.get("/api/whatsapp/bulk-status", (req, res) => {
  const ws = extractWorkspace(req);
  res.json(ws.activeJob);
});

app.post("/api/whatsapp/bulk-start", (req, res) => {
  const ws = extractWorkspace(req);
  const { text, texts, attachments, contacts, delayMs, minDelayMs, maxDelayMs, batchSize, batchPauseSeconds } = req.body;

  const hasDefaultText = typeof text === 'string' && text.trim() !== '';
  const hasTextVariations = Array.isArray(texts) && texts.some(t => typeof t === 'string' && t.trim() !== '');
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if ((!hasDefaultText && !hasTextVariations && !hasAttachments) || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: "Parâmetros inválidos. É necessário pelo menos uma mensagem de texto, imagem, anexo ou variação, e lista de contatos." });
  }

  if (ws.connectionStatus !== 'connected') {
    return res.status(400).json({ error: "WhatsApp não está conectado neste workspace." });
  }

  if (ws.jobTimeout) {
    clearTimeout(ws.jobTimeout);
    ws.jobTimeout = null;
  }

  const jobContacts: ContactProgress[] = contacts.map(c => ({
    phone: c.phone,
    name: c.name || '',
    variables: c.variables || [],
    status: 'pending'
  }));

  ws.activeJob = {
    id: Math.random().toString(36).substring(7),
    text: text || (texts ? texts[0] : ''),
    texts: Array.isArray(texts) ? texts : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    contacts: jobContacts,
    status: 'running',
    currentIndex: 0,
    delayMs: delayMs ? parseInt(delayMs) : 4000,
    minDelayMs: minDelayMs ? parseInt(minDelayMs) : undefined,
    maxDelayMs: maxDelayMs ? parseInt(maxDelayMs) : undefined,
    batchSize: batchSize ? parseInt(batchSize) : undefined,
    batchPauseSeconds: batchPauseSeconds ? parseInt(batchPauseSeconds) : undefined,
    isBatchPausing: false,
    createdAt: new Date().toISOString()
  };

  console.log(`[WS:${ws.id}] Starting bulk messaging job ${ws.activeJob.id} for ${contacts.length} contacts...`);
  executeJobStep(ws);

  res.json(ws.activeJob);
});

app.post("/api/whatsapp/bulk-pause", (req, res) => {
  const ws = extractWorkspace(req);
  if (ws.activeJob.status === 'running') {
    ws.activeJob.status = 'paused';
    if (ws.jobTimeout) {
      clearTimeout(ws.jobTimeout);
      ws.jobTimeout = null;
    }
    console.log(`[WS:${ws.id}] Bulk messaging job paused.`);
  }
  res.json(ws.activeJob);
});

app.post("/api/whatsapp/bulk-resume", (req, res) => {
  const ws = extractWorkspace(req);
  if (ws.activeJob.status === 'paused') {
    ws.activeJob.status = 'running';
    ws.activeJob.isBatchPausing = false;
    ws.activeJob.batchPauseResumeAt = undefined;
    console.log(`[WS:${ws.id}] Resuming bulk messaging job...`);
    executeJobStep(ws);
  }
  res.json(ws.activeJob);
});

app.post("/api/whatsapp/bulk-stop", (req, res) => {
  const ws = extractWorkspace(req);
  ws.activeJob.status = 'stopped';
  if (ws.jobTimeout) {
    clearTimeout(ws.jobTimeout);
    ws.jobTimeout = null;
  }
  console.log(`[WS:${ws.id}] Bulk messaging job stopped.`);
  res.json(ws.activeJob);
});

// Auto-discovery and migration of workspace directories
try {
  if (!fs.existsSync(baseAuthDir)) {
    fs.mkdirSync(baseAuthDir, { recursive: true });
  }

  // Legacy single session migration
  const legacyCreds = path.join(baseAuthDir, 'creds.json');
  const defaultWsDir = path.join(baseAuthDir, 'ws_default');
  if (fs.existsSync(legacyCreds) && !fs.existsSync(defaultWsDir)) {
    console.log('Migrating legacy single-session WhatsApp auth to default workspace directory...');
    fs.mkdirSync(defaultWsDir, { recursive: true });
    const items = fs.readdirSync(baseAuthDir);
    for (const item of items) {
      if (item.startsWith('ws_')) continue;
      const oldPath = path.join(baseAuthDir, item);
      const newPath = path.join(defaultWsDir, item);
      try {
        fs.renameSync(oldPath, newPath);
      } catch (e) {
        console.warn('Migration file move warning:', e);
      }
    }
  }

  // Scan all ws_* folders to register workspaces
  const entries = fs.readdirSync(baseAuthDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('ws_')) {
      const wsSlug = entry.name.replace(/^ws_/, '');
      const wsSession = getWorkspaceSession(wsSlug);
      console.log(`Discovered saved workspace: ${wsSession.name} (${wsSession.id})`);
      if (fs.existsSync(path.join(wsSession.authDir, 'creds.json'))) {
        console.log(`Auto-connecting workspace ${wsSession.id}...`);
        connectToWhatsApp(wsSession);
      }
    }
  }
} catch (e) {
  console.error('Error during workspace directory auto-discovery:', e);
}


// Start Server & Vite Integration
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Fatal error starting server:", error);
  }
}

startServer();
