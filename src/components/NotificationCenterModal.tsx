import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  Eye, 
  ExternalLink,
  Layers,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { soundEffects } from '../lib/soundEffects';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'alert' | 'escrow' | 'security';
  timestamp: string;
  read: boolean;
  actionView?: 'marketplace' | 'profile' | 'escrow';
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClearAll: () => void;
  onMarkAllAsRead: () => void;
  onSelectAction?: (view: 'marketplace' | 'profile' | 'escrow') => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkAllAsRead,
  onSelectAction,
}) => {
  const [filter, setFilter] = useState<'all' | 'escrow' | 'security' | 'alerts'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === 'escrow') return n.type === 'escrow';
    if (filter === 'security') return n.type === 'security' || n.type === 'alert';
    if (filter === 'alerts') return n.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div 
      id="notification-center-overlay"
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEffects.playSubTabClick();
          onClose();
        }
      }}
    >
      <div 
        id="notification-center-drawer"
        className="w-full max-w-md h-full bg-[#0b0e17]/95 border-l border-cyan-500/30 shadow-[-15px_0_40px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] flex flex-col text-slate-100 animate-in slide-in-from-right duration-250 relative"
      >
        {/* Futuristic Cyber Accent Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Space_Grotesk'] tracking-tight">
                  Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Escrow & Sentinel Signals</span>
                <span className="text-slate-600">•</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[9px] border border-white/10">
                  Ctrl+N
                </kbd>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundEffects.playSubTabClick();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
              title="Close notification center (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills & Actions Bar */}
        <div className="p-3 border-b border-white/5 bg-[#0e121e]/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {(['all', 'escrow', 'security'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  soundEffects.playTabClick();
                  setFilter(f);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition capitalize ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  soundEffects.playTabClick();
                  onMarkAllAsRead();
                }}
                className="px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  soundEffects.playToggleSound();
                  onClearAll();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-300 font-['Space_Grotesk']">
                  No notifications yet
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Escrow deposits, View-Once alerts, and VAKRA threat detections will appear here in real time.
                </p>
              </div>
            </div>
          ) : (
            filtered.map((item) => {
              const isAlert = item.type === 'alert';
              const isEscrow = item.type === 'escrow';
              const isSuccess = item.type === 'success';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.actionView && onSelectAction) {
                      soundEffects.playNavTabClick();
                      onSelectAction(item.actionView);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                    isAlert
                      ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 hover:border-amber-500/50'
                      : isEscrow
                      ? 'bg-cyan-500/10 hover:bg-cyan-500/15 border-cyan-500/30 hover:border-cyan-400/50'
                      : isSuccess
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-400/50'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                      isAlert
                        ? 'bg-amber-500/20 text-amber-400'
                        : isEscrow
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : isSuccess
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {isAlert ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isEscrow ? (
                        <Lock className="w-4 h-4" />
                      ) : isSuccess ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white font-['Space_Grotesk'] group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                      {item.actionView && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                          <span>View in {item.actionView}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer with Hotkey Info */}
        <div className="p-3 border-t border-white/10 bg-[#080b12] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-300">Firebase Sentinel Online</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <span>Toggle:</span>
            <kbd className="px-1 py-0.2 rounded bg-white/10 text-slate-300 border border-white/10 font-bold">
              Ctrl+N
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
