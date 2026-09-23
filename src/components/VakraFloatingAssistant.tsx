import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  AlertTriangle, 
  Lock, 
  X, 
  Minimize2, 
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  HelpCircle,
  Scale,
  ArrowRight,
  Volume2
} from 'lucide-react';
import { soundEffects } from '../lib/soundEffects';
import { GoogleGenAI } from '@google/genai';

interface VakraFloatingAssistantProps {
  onAutoDraftAgreement: (suggestedDeal: {
    serviceType: string;
    amount: number;
    deadline: string;
    description: string;
  }) => void;
  onOpenDealModal?: () => void;
}

interface AIMessage {
  id: string;
  sender: 'user' | 'vakra';
  text: string;
  timestamp: string;
  draftProposal?: {
    serviceType: string;
    amount: number;
    deadline: string;
    description: string;
  };
  isAlert?: boolean;
}

export const VakraFloatingAssistant: React.FC<VakraFloatingAssistantProps> = ({
  onAutoDraftAgreement,
  onOpenDealModal,
}) => {
  // Floating widget position states
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUnreadAlert, setHasUnreadAlert] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'vakra-welcome',
      sender: 'vakra',
      text: "⚡ Greetings! I'm VAKRA AI, your autonomous cyber escrow sentinel. I assist with smart contract drafting, dispute mitigation, 3% escrow calculations, and scam threat detection. How can I protect your deal today?",
      timestamp: 'Active Now',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);

  // Drag tracking refs
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize responsive default position (Bottom Right, avoiding bottom navigation dock)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDefaultPos = () => {
      const isMobile = window.innerWidth < 768;
      const fabSize = isMobile ? 54 : 62;
      const paddingRight = isMobile ? 18 : 32;
      const paddingBottom = isMobile ? 86 : 36; // 86px clears mobile bottom bar

      const x = window.innerWidth - fabSize - paddingRight;
      const y = window.innerHeight - fabSize - paddingBottom;

      setPosition((prev) => {
        if (!prev) return { x, y };
        // Clamp existing position to current window bounds
        return {
          x: Math.min(Math.max(12, prev.x), window.innerWidth - fabSize - 12),
          y: Math.min(Math.max(12, prev.y), window.innerHeight - fabSize - 12),
        };
      });
    };

    updateDefaultPos();
    window.addEventListener('resize', updateDefaultPos);
    return () => window.removeEventListener('resize', updateDefaultPos);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen, isTyping]);

  // Handle Drag Pointer Events (Desktop mouse & Mobile touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary pointer button
    if (e.button !== 0) return;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const currentX = position ? position.x : window.innerWidth - 80;
    const currentY = position ? position.y : window.innerHeight - 100;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      hasMoved: false,
    };

    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.hasMoved = true;
    }

    const fabSize = window.innerWidth < 768 ? 54 : 62;
    const newX = Math.min(
      Math.max(10, dragRef.current.initialX + deltaX),
      window.innerWidth - fabSize - 10
    );
    const newY = Math.min(
      Math.max(10, dragRef.current.initialY + deltaY),
      window.innerHeight - fabSize - 10
    );

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // If pointer didn't move significantly, it is a CLICK!
    if (!dragRef.current.hasMoved) {
      toggleAssistant();
    }
  };

  const toggleAssistant = () => {
    soundEffects.playTabClick();
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasUnreadAlert(false);
      }
      return next;
    });
  };

  // Preset Fast-Prompt Suggestions
  const handleSelectQuickPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Send user message and get VAKRA AI response
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    soundEffects.playSubTabClick();

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 1. Check if user is asking to draft an agreement
      const isDraftRequest = /draft|contract|agreement|milestone|proposal|hire|terms/i.test(query);
      const isCommissionRequest = /commission|3%|fee|cut|payout|charges|razorpay|stripe/i.test(query);
      const isDisputeRequest = /dispute|refund|cheat|scam|stolen|unpaid|cancel|arbitration/i.test(query);
      const isViewOnceRequest = /view once|1 time|one time|drm|screenshot|blur|timer/i.test(query);

      let aiResponseText = '';
      let draftPayload: AIMessage['draftProposal'] | undefined;
      let isThreatAlert = false;

      // Try calling real Gemini SDK if key is configured
      const apiKey = 
        (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
        (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY);

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const result = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: query,
            config: {
              systemInstruction: `You are VAKRA AI, the authoritative cyber security and escrow AI assistant embedded in VERILANCE. 
VERILANCE is an anti-scam freelance marketplace with:
1) Strict 3% Escrow Commission (Client deposits ₹X into escrow; VERILANCE holds 3% as insurance fund; Editor receives 97% instantly upon approval). Supports Razorpay UPI, Stripe, PayPal.
2) View Once 1-Time media cut proofs without any timers or timeline expiration: proofs remain shielded with DRM blur, anti-screenshot blackout on tab switch or window blur, and vanish permanently once closed.
3) Watermarked delivery with diagonal preview safeguard until funds are approved.
4) Anti-Scam Protocol: Flags off-platform contact (Telegram, WhatsApp, Direct UPI) as high risk.
5) 1 Email = 1 Account policy for verified trust.
Keep your answers razor-sharp, cyberpunk-themed, helpful, professional, and concise (under 120 words). If user asks for an agreement or draft, provide clear milestones.`
            }
          });
          if (result.text) {
            aiResponseText = result.text;
          }
        } catch (err) {
          console.warn('[VAKRA AI] Gemini API call bypassed, switching to cyber engine:', err);
        }
      }

      // If no response from external SDK, generate authoritative instant response
      if (!aiResponseText) {
        if (isDraftRequest) {
          draftPayload = {
            serviceType: 'YouTube 4K Video Editing & Color Grade',
            amount: 3500,
            deadline: '2026-09-28',
            description: '10-minute dynamic YouTube cut with SFX, motion graphics, 2 revision cycles, and watermarked proof safeguard.',
          };
          aiResponseText = `🛡️ [VAKRA CONTRACT SYNTHESIZER]\nI have constructed a secure Smart Escrow Agreement for you:\n• Service: YouTube 4K Video Editing\n• Total Escrow: ₹3,500 (Editor Payout: ₹3,395 after 3% insurance fee ₹105)\n• Delivery: 28 September 2026\n• Guardrails: Watermarked draft delivery + View Once preview proof.\n\nClick "Apply to Escrow Deal" below to populate the contract builder immediately.`;
        } else if (isCommissionRequest) {
          aiResponseText = `⚡ [VERILANCE ESCROW PROTOCOL]\nOur platform operates on a transparent 3% Flat Insurance Commission:\n• Client deposits ₹10,000 into Escrow.\n• 3% Commission (₹300) guarantees fraud coverage, mediator dispute resolution, and encrypted DRM delivery.\n• Freelancer receives ₹9,700 (97%) direct to their bank via Razorpay Instant Payouts or Stripe upon client approval.\n• Zero hidden fees or withdrawal taxes.`;
        } else if (isDisputeRequest) {
          isThreatAlert = true;
          aiResponseText = `🚨 [DISPUTE & ANTI-SCAM RADAR]\nIf a client refuses to release escrow or an editor fails milestone criteria:\n1. Open Dispute from the workspace sidebar.\n2. Funds remain 100% frozen in secure RBI-compliant Trustway escrow vault.\n3. The platform mediator inspects unwatermarked timestamps, chat logs, and View Once audit trails within 24 hours.\n4. Ghosting is impossible because funds are pre-locked.`;
        } else if (isViewOnceRequest) {
          aiResponseText = `🔒 [VIEW ONCE 1-TIME SECURITY]\nVERILANCE uses proprietary 1-Time Protected Previews with ZERO countdown timers:\n• The draft video or image can only be viewed in 1 continuous session.\n• If the user switches browser tabs, minimizes the window, or attempts screenshot capture, the screen immediately blacks out.\n• Once closed, the buffer is permanently purged from memory to prevent file theft before payment.`;
        } else {
          aiResponseText = `🤖 [VAKRA SENTINEL RESPONSE]\nYour query is logged in VERILANCE Security node. Whether you are drafting milestone scopes, checking 3% escrow splits, verifying KYC badges, or shielding high-res renders, I am monitoring conversation parameters in real time. Never take payment off-platform!`;
        }
      }

      // Add AI response to dialogue
      const vakraReply: AIMessage = {
        id: `v-${Date.now()}`,
        sender: 'vakra',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        draftProposal: draftPayload,
        isAlert: isThreatAlert,
      };

      setMessages((prev) => [...prev, vakraReply]);
      
      // Play cool cyber notification sound effect!
      if (isThreatAlert) {
        soundEffects.playAlertWarningSound();
      } else {
        soundEffects.playNotificationSound();
      }

    } catch (error) {
      console.error('[VAKRA AI Error]', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'vakra',
          text: '⚡ Cyber link reset: Sentinel systems remain active in background mode. All escrow balances secured.',
          timestamp: 'Just now',
        }
      ]);
      soundEffects.playNotificationSound();
    } finally {
      setIsTyping(false);
    }
  };

  const handleApplyDraft = (draft: NonNullable<AIMessage['draftProposal']>) => {
    soundEffects.playTabClick();
    onAutoDraftAgreement(draft);
    if (onOpenDealModal) {
      onOpenDealModal();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    soundEffects.playSubTabClick();
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  // If initial position hasn't calculated yet, don't render off-screen
  if (!position) return null;

  return (
    <>
      {/* 1. FLOATING & MOVEABLE ACTION BUTTON (FAB) */}
      <div
        id="vakra-floating-fab-root"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          touchAction: 'none',
        }}
        className={`fixed top-0 left-0 z-50 select-none transition-transform ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'
        }`}
        title="VAKRA AI Sentinel (Drag anywhere / Click to chat)"
      >
        <div className="relative group">
          {/* Futuristic Multi-layer Neon Pulsing Rings */}
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-purple-600 rounded-full blur-md opacity-70 group-hover:opacity-100 animate-pulse transition duration-500" />
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-full opacity-90" />

          {/* Core Sleek Floating AI Disc */}
          <div className="relative w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#0a0d14] border-2 border-cyan-400/80 p-0.5 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.45)]">
            {/* Inner Cyber Graphic: Stylized V Neural Network Emblem */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0e1422] via-[#090d16] to-[#120f24] flex items-center justify-center overflow-hidden relative">
              {/* Subtle tech grid background lines */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:6px_6px]" />

              {/* Modern Stylized 'V' Neural Icon */}
              <svg 
                viewBox="0 0 36 36" 
                className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M7 8L18 29L29 8" 
                  stroke="url(#vakra-gradient)" 
                  strokeWidth="3.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M12 8L18 20L24 8" 
                  stroke="#a855f7" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  opacity="0.85"
                />
                {/* Neural Network Core Vertex Dots */}
                <circle cx="18" cy="29" r="2.2" fill="#22d3ee" className="animate-ping origin-center" />
                <circle cx="18" cy="29" r="1.8" fill="#ffffff" />
                <circle cx="7" cy="8" r="1.6" fill="#38bdf8" />
                <circle cx="29" cy="8" r="1.6" fill="#c084fc" />
                <circle cx="18" cy="20" r="1.5" fill="#f43f5e" />

                <defs>
                  <linearGradient id="vakra-gradient" x1="7" y1="8" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#06b6d4" />
                    <stop offset="0.5" stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Active Breathing Neural Indicator */}
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0d14] animate-pulse" />
            </div>
          </div>

          {/* Micro Tooltip Pill */}
          <div className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow-lg">
              VAKRA AI • DRAG / CLICK
            </div>
          </div>

          {/* Unread Alert Beacon */}
          {hasUnreadAlert && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#0a0d14] animate-bounce" />
          )}
        </div>
      </div>

      {/* 2. SLIDE-OVER / POPUP CHAT INTERFACE FOR VAKRA AI */}
      {isOpen && (
        <div 
          id="vakra-ai-chat-window"
          className="fixed z-50 bottom-24 right-4 sm:right-8 w-[calc(100vw-32px)] sm:w-[420px] max-h-[82vh] h-[580px] rounded-3xl bg-[#0b0f17]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header Bar */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#0d1424] via-[#111827] to-[#15102a] border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-0.5 shadow-md shadow-cyan-500/30">
                <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center text-cyan-300">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk'] flex items-center gap-1.5">
                    VAKRA AI
                    <span className="text-[10px] px-1.5 py-0.2 font-mono font-semibold tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded uppercase">
                      Sentinel v2.4
                    </span>
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3% Escrow & Anti-Scam Shield Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundEffects.playNotificationSound();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition"
                title="Test Holographic Chime"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                title="Close VAKRA AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Prompt Chips */}
          <div className="px-3 py-2 bg-[#080b11] border-b border-white/5 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleSelectQuickPrompt('How does the 3% Escrow Commission work?')}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              3% Escrow Calc
            </button>
            <button
              onClick={() => handleSelectQuickPrompt('Draft a smart agreement for a YouTube Video Edit project.')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              Draft Contract
            </button>
            <button
              onClick={() => handleSelectQuickPrompt('How does View Once 1-Time media cut protection work?')}
              className="px-2.5 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-blue-400" />
              View Once DRM
            </button>
            <button
              onClick={() => handleSelectQuickPrompt('How does VAKRA protect me against disputes and fraud?')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1"
            >
              <Scale className="w-3 h-3 text-amber-400" />
              Disputes
            </button>
          </div>

          {/* Conversation Stream */}
          <div 
            ref={chatContainerRef}
            className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 scroll-smooth"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'vakra' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 p-0.5 shrink-0 mt-0.5">
                    <div className="w-full h-full bg-[#0a0d14] rounded-[6px] flex items-center justify-center text-cyan-400 text-xs font-bold font-mono">
                      V
                    </div>
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-medium rounded-tr-none'
                        : msg.isAlert
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tl-none'
                        : 'bg-[#121722] border border-white/10 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* If VAKRA returned a draft agreement proposal */}
                  {msg.draftProposal && (
                    <div className="rounded-xl bg-[#0e1420] border border-cyan-500/30 p-3 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-cyan-300 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          Auto-Generated Escrow Terms
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          ₹{msg.draftProposal.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 space-y-1 bg-black/30 p-2 rounded-lg border border-white/5 font-mono">
                        <div><strong className="text-white">Role:</strong> {msg.draftProposal.serviceType}</div>
                        <div><strong className="text-white">Deadline:</strong> {msg.draftProposal.deadline}</div>
                        <div><strong className="text-white">Escrow Fee:</strong> 3% (₹{Math.round(msg.draftProposal.amount * 0.03)})</div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleApplyDraft(msg.draftProposal!)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-cyan-500/20"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Apply to Escrow Deal</span>
                        </button>
                        <button
                          onClick={() => handleCopyText(msg.id, JSON.stringify(msg.draftProposal, null, 2))}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
                          title="Copy JSON"
                        >
                          {copiedDraftId === msg.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 px-1 font-mono block">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>VAKRA neural engine synthesizing response...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[#0d121c] border-t border-white/10 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask VAKRA (e.g., Draft escrow agreement, check 3% fee)..."
                className="flex-1 bg-[#141926] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 transition shadow-md shadow-cyan-500/20 shrink-0"
                title="Send query to VAKRA AI"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
