import React from 'react';
import { 
  X, 
  Keyboard, 
  Command, 
  Sparkles, 
  Handshake, 
  Bell, 
  Store, 
  MessageSquare, 
  User, 
  Zap,
  Crown 
} from 'lucide-react';
import { soundEffects } from '../lib/soundEffects';

interface HotkeyCheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (action: string) => void;
}

export const HotkeyCheatsheetModal: React.FC<HotkeyCheatsheetModalProps> = ({
  isOpen,
  onClose,
  onTriggerAction,
}) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      action: 'Post Deal',
      keyCombo: `${modKey} + D`,
      description: 'Open escrow transaction creator to lock funds and set milestones',
      icon: Handshake,
      actionId: 'post_deal',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/30',
    },
    {
      action: 'Open Notifications',
      keyCombo: `${modKey} + N`,
      description: 'Open real-time notification drawer for escrow & security events',
      icon: Bell,
      actionId: 'notifications',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
    },
    {
      action: 'Go to Marketplace',
      keyCombo: `${modKey} + M`,
      description: 'Switch to the video editor and creator freelance directory',
      icon: Store,
      actionId: 'marketplace',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
    },
    {
      action: 'Escrow & Chat',
      keyCombo: `${modKey} + E`,
      description: 'Open active deal workspace, encrypted chat & View-Once previews',
      icon: MessageSquare,
      actionId: 'escrow',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      action: 'Profile & KYC',
      keyCombo: `${modKey} + P`,
      description: 'Access Aadhaar/PAN verification, bank details, and trust badge',
      icon: User,
      actionId: 'profile',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      action: 'Admin Delegation HUD',
      keyCombo: `${modKey} + A`,
      description: 'Toggle Multi-Tiered Admin Panel & Role Delegation matrix (Root/Admins)',
      icon: Crown,
      actionId: 'admin',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      action: 'Why VERILANCE & Calculator',
      keyCombo: `${modKey} + W`,
      description: 'Interactive 5% platform fee calculator vs 20% other platform fees',
      icon: Sparkles,
      actionId: 'why_verilance',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      action: 'Keyboard Shortcuts',
      keyCombo: '?',
      description: 'Show or hide this global hotkey reference overlay',
      icon: Keyboard,
      actionId: 'cheatsheet',
      color: 'text-slate-300',
      bg: 'bg-white/5 border-white/10',
    },
    {
      action: 'Close Any Modal',
      keyCombo: 'Esc',
      description: 'Instantly dismiss any open dialog, slide-over or preview',
      icon: X,
      actionId: 'close',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
    },
  ];

  return (
    <div 
      id="hotkey-cheatsheet-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEffects.playSubTabClick();
          onClose();
        }
      }}
    >
      <div 
        id="hotkey-cheatsheet-modal"
        className="w-full max-w-2xl bg-[#0c101a]/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(6,182,212,0.2)] text-slate-100 relative overflow-hidden my-auto"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
                  Global Command Hotkeys
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  Linear x Apple
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Navigate the entire cyber-escrow protocol at lightspeed with standard keyboard listeners
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playSubTabClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
            title="Close cheatsheet (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6 relative z-10 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.action}
                onClick={() => {
                  if (onTriggerAction && s.actionId !== 'cheatsheet' && s.actionId !== 'close') {
                    soundEffects.playTabClick();
                    onTriggerAction(s.actionId);
                    onClose();
                  } else if (s.actionId === 'close') {
                    onClose();
                  }
                }}
                className="p-3.5 rounded-2xl bg-[#111624]/90 hover:bg-[#161c2d] border border-white/10 hover:border-cyan-500/40 transition-all flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors font-['Space_Grotesk']">
                      {s.action}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {s.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <kbd className="px-2 py-1 rounded-lg bg-black/60 border border-white/20 text-cyan-300 font-mono text-[11px] font-bold shadow-inner shadow-cyan-500/10 group-hover:border-cyan-400/50 transition-colors">
                    {s.keyCombo}
                  </kbd>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">
              Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] border border-white/10">?</kbd> anywhere to summon this menu
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            VERILANCE 5% Cyber-Escrow Protocol
          </span>
        </div>
      </div>
    </div>
  );
};
