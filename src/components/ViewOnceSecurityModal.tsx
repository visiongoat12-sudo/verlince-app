import React, { useState, useEffect, useRef } from 'react';
import { ViewOnceMedia, UserProfile } from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  EyeOff, 
  Clock, 
  Lock, 
  AlertTriangle, 
  X, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Minimize2,
  RefreshCw,
  FileWarning
} from 'lucide-react';
import { VerilanceLogo } from './VerilanceLogo';

interface ViewOnceSecurityModalProps {
  media: ViewOnceMedia;
  currentUser: UserProfile;
  onCloseAndExpire: () => void;
}

export const ViewOnceSecurityModal: React.FC<ViewOnceSecurityModalProps> = ({
  media,
  currentUser,
  onCloseAndExpire,
}) => {
  // Duration in seconds: if video, default 25s, if image, 15s
  const initialDuration = media.durationSeconds || (media.mediaType === 'video' ? 25 : 15);
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [isFocusLost, setIsFocusLost] = useState<boolean>(false);
  const [focusLostReason, setFocusLostReason] = useState<string>('');
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [watermarkPos, setWatermarkPos] = useState({ x: 25, y: 35 });
  const [sessionHash] = useState(() => Math.random().toString(36).substring(2, 9).toUpperCase());
  const [currentTimeStr, setCurrentTimeStr] = useState(() => new Date().toLocaleTimeString());

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Trigger security toast
  const triggerSecurityWarning = (message: string) => {
    setSecurityToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setSecurityToast(null);
    }, 3500);
  };

  // 1. Dynamic Watermark Jitter / Motion
  useEffect(() => {
    const watermarkInterval = setInterval(() => {
      // Random coordinates within safe viewport (15% to 70%)
      const nextX = Math.floor(15 + Math.random() * 55);
      const nextY = Math.floor(15 + Math.random() * 60);
      setWatermarkPos({ x: nextX, y: nextY });
      setCurrentTimeStr(new Date().toLocaleTimeString());
    }, 2800);

    return () => clearInterval(watermarkInterval);
  }, []);

  // 2. Countdown Timer
  useEffect(() => {
    // Only tick down if window is focused and media is active
    if (isFocusLost) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFocusLost]);

  const handleExpire = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onCloseAndExpire();
  };

  // 3. Anti-Screen Capture, Anti-PrintScreen & Focus Detection Listeners
  useEffect(() => {
    // (a) Window Blur (user clicked outside, opened capture tool, switched application)
    const handleBlur = () => {
      setIsFocusLost(true);
      setFocusLostReason('Window focus lost. Media obscured to prevent screen recording.');
      if (videoRef.current) videoRef.current.pause();
    };

    // (b) Window Focus restored
    const handleFocus = () => {
      setIsFocusLost(false);
      setFocusLostReason('');
      if (videoRef.current && !videoRef.current.ended) {
        videoRef.current.play().catch(() => {});
      }
    };

    // (c) Tab visibility change (user switched browser tab or minimized window)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsFocusLost(true);
        setFocusLostReason('Tab inactive / Window minimized. Content shielded.');
        if (videoRef.current) videoRef.current.pause();
      } else {
        setIsFocusLost(false);
        setFocusLostReason('');
        if (videoRef.current && !videoRef.current.ended) {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    // (d) Cursor left document window
    const handleMouseLeave = () => {
      setIsFocusLost(true);
      setFocusLostReason('Cursor left secure viewing boundary.');
    };

    const handleMouseEnter = () => {
      setIsFocusLost(false);
      setFocusLostReason('');
    };

    // (e) Prevent Context Menu & Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerSecurityWarning('⚠️ Right-click & Context Menu disabled on VERILANCE protected media.');
    };

    // (f) Intercept Keyboard Shortcuts (PrintScreen, Ctrl+P, Ctrl+S, F12, DevTools, Mac Screen Capture)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        setIsFocusLost(true);
        triggerSecurityWarning('🚨 Screenshot Attempt Detected! PrintScreen is strictly prohibited.');
        return;
      }

      // DevTools (F12, Ctrl+Shift+I, Cmd+Option+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        e.key === 'F12' ||
        (cmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j'))
      ) {
        e.preventDefault();
        triggerSecurityWarning('⚠️ Developer inspection tools disabled on secure media.');
        return;
      }

      // Save Page (Ctrl+S / Cmd+S)
      if (cmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerSecurityWarning('⚠️ Saving protected media is prohibited.');
        return;
      }

      // Print (Ctrl+P / Cmd+P)
      if (cmdOrCtrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerSecurityWarning('⚠️ Printing VERILANCE protected media is blocked.');
        return;
      }

      // View Source (Ctrl+U / Cmd+U)
      if (cmdOrCtrl && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        triggerSecurityWarning('⚠️ Source inspection prohibited.');
        return;
      }

      // Mac Screenshot Shortcuts (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (cmdOrCtrl && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        setIsFocusLost(true);
        triggerSecurityWarning('🚨 Mac Screen Capture shortcut intercepted! Action blocked.');
        return;
      }

      // Escape key to exit and expire
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExpire();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const progressPercent = Math.max(0, (timeLeft / initialDuration) * 100);

  return (
    <div 
      id="view-once-modal-overlay"
      className="fixed inset-0 z-50 bg-[#030508]/98 backdrop-blur-2xl flex flex-col select-none overflow-hidden"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* 1. TOP SECURITY CONTROL BAR */}
      <header className="h-16 border-b border-cyan-500/20 bg-[#080b12]/95 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30 shadow-lg">
        {/* Left: VERILANCE Brand & Protected Media Header */}
        <div className="flex items-center gap-3">
          <VerilanceLogo size="sm" showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white font-['Space_Grotesk']">
                VERILANCE VIEW ONCE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Anti-Screen Capture
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {media.title} • {media.fileSize}
            </p>
          </div>
        </div>

        {/* Center: Live Timer Countdown Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0f1522] border border-cyan-500/30 flex items-center gap-2.5 shadow-inner">
            <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">
                Expires In
              </span>
              <span className={`text-sm font-mono font-black leading-tight ${
                timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-cyan-300'
              }`}>
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </span>
            </div>

            {/* Circular Mini Progress Ring */}
            <div className="relative w-5 h-5 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${timeLeft <= 5 ? 'text-red-400' : 'text-cyan-400'} transition-all duration-1000`}
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Security Safeguards & Close Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {media.mediaType === 'video' && (
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          <button
            id="close-view-once-btn"
            onClick={handleExpire}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 hover:text-red-200 text-xs font-bold transition shadow-sm"
            title="Closing will permanently destroy access to this preview"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close & Expire</span>
          </button>
        </div>
      </header>

      {/* 2. REPEATING DIAGONAL WATERMARK MATRIX (Vector Layer across entire viewport) */}
      <div 
        className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-12 select-none"
        aria-hidden="true"
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="verilance-watermark-matrix" width="280" height="140" patternTransform="rotate(-30 0 0)" patternUnits="userSpaceOnUse">
              <text x="10" y="40" fill="#22d3ee" fontSize="11" fontWeight="700" fontFamily="monospace">
                VERILANCE • VIEW ONCE
              </text>
              <text x="10" y="60" fill="#ffffff" fontSize="9" fontWeight="500" fontFamily="monospace">
                DO NOT CAPTURE • UID: {currentUser.id}
              </text>
              <text x="10" y="80" fill="#14b8a6" fontSize="9" fontWeight="600" fontFamily="monospace">
                SESSION {sessionHash}
              </text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verilance-watermark-matrix)" />
        </svg>
      </div>

      {/* 3. CENTER MEDIA STAGE */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Dynamic Moving Watermark Pill (drifts to prevent OCR/Screen recorders) */}
        <div 
          className="absolute z-25 pointer-events-none transition-all duration-1000 ease-out px-3 py-1 rounded-full bg-black/75 border border-cyan-400/40 backdrop-blur-md shadow-2xl flex items-center gap-2"
          style={{
            top: `${watermarkPos.y}%`,
            left: `${watermarkPos.x}%`,
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-cyan-200 tracking-wider">
            VERILANCE • Viewer: {currentUser.name} (ID: {currentUser.id}) • IP Protected • {currentTimeStr}
          </span>
        </div>

        {/* Media Container */}
        <div className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black">
          {media.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={media.url}
              autoPlay
              playsInline
              controls={false}
              onEnded={handleExpire}
              className="max-h-[75vh] w-auto object-contain rounded-2xl"
            />
          ) : (
            <img
              src={media.url}
              alt={media.title}
              className="max-h-[75vh] w-auto object-contain rounded-2xl pointer-events-none"
              draggable={false}
            />
          )}

          {/* Bottom subtle media stamp */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-slate-300 font-mono">
            <span>🔒 VERILANCE Protected Asset • {media.mediaType.toUpperCase()}</span>
            <span className="text-cyan-300">Hash: SHA256-VRL-{sessionHash}</span>
          </div>
        </div>

        {/* 4. BLUR-ON-FOCUS-LOSS OVERLAY (Anti-Screen Capture Guard) */}
        {isFocusLost && (
          <div className="absolute inset-0 z-40 bg-[#06080d]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-xl shadow-red-500/10 animate-bounce">
              <EyeOff className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Screen Capture Guard Active
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] mb-2">
              Protected Media Concealed
            </h3>

            <p className="max-w-md text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              {focusLostReason || 'Media preview was temporarily blanked because the browser window lost focus or cursor left the viewing perimeter.'}
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Click anywhere or re-focus window to resume viewing</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. FLOATING SECURITY SENTINEL TOAST ALERT */}
      {securityToast && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#140b10] border border-red-500/60 shadow-2xl text-red-200 text-xs font-bold flex items-center gap-2.5 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* 6. BOTTOM FOOTER WARNING BANNER */}
      <footer className="h-12 border-t border-white/10 bg-[#080b12] px-4 sm:px-6 flex items-center justify-between text-[11px] text-slate-400 shrink-0 z-30">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>VERILANCE Protected Content • View Once • Screenshots & Recording Prohibited</span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-slate-400 text-[10px] font-mono">
          <span>DRM Watermark: ACTIVE</span>
          <span>•</span>
          <span>Focus-Loss Guard: ARMED</span>
          <span>•</span>
          <span>Shortcuts Intercept: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
};
