import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewOnceMedia, UserProfile } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  EyeOff,
  Lock,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { VerilanceLogo } from './VerilanceLogo';
import { resolveChunkedMediaUrl } from '../lib/mediaUpload';

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
  const [isShieldLatched, setIsShieldLatched] = useState<boolean>(false);
  const [shieldReason, setShieldReason] = useState<string>('');
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(media.url || '');
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [sessionHash] = useState(() =>
    Math.random().toString(36).substring(2, 9).toUpperCase()
  );

  // Direct-DOM GPU refs for zero-lag blackout & watermark drift (no React re-render delay)
  const shieldOverlayRef = useRef<HTMLDivElement>(null);
  const mediaStageRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWindowSizeRef = useRef({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Resolve chunked Firestore media if needed (e.g. recipient viewing a video/large photo)
  useEffect(() => {
    let active = true;
    const needsChunkResolution =
      !!media.chunkedMediaId && (!media.url || media.url.startsWith('blob:'));

    if (!needsChunkResolution) {
      setResolvedUrl(media.url);
      setMediaLoadError(null);
      return;
    }

    setIsLoadingMedia(true);
    setMediaLoadError(null);
    resolveChunkedMediaUrl(media.chunkedMediaId!, media.mimeType)
      .then((url) => {
        if (active) {
          setResolvedUrl(url);
          setIsLoadingMedia(false);
        }
      })
      .catch((err) => {
        if (active) {
          setMediaLoadError(err?.message || 'Protected media could not be decrypted.');
          setIsLoadingMedia(false);
        }
      });

    return () => {
      active = false;
    };
  }, [media.chunkedMediaId, media.mimeType, media.url]);

  const triggerSecurityWarning = useCallback((message: string) => {
    setSecurityToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setSecurityToast(null);
    }, 3200);
  }, []);

  // Synchronous, zero-lag DOM blackout before React state even flushes
  const activateInstantShield = useCallback((reason: string, warnToast?: string) => {
    if (mediaStageRef.current) {
      mediaStageRef.current.style.visibility = 'hidden';
      mediaStageRef.current.style.opacity = '0';
    }
    if (shieldOverlayRef.current) {
      shieldOverlayRef.current.style.opacity = '1';
      shieldOverlayRef.current.style.pointerEvents = 'auto';
      shieldOverlayRef.current.style.visibility = 'visible';
    }
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    setShieldReason(reason);
    setIsShieldLatched(true);
    if (warnToast) {
      triggerSecurityWarning(warnToast);
    }
  }, [triggerSecurityWarning]);

  const handleResumeProtectedView = useCallback(() => {
    if (document.hidden || !document.hasFocus()) {
      window.focus();
    }
    if (shieldOverlayRef.current) {
      shieldOverlayRef.current.style.opacity = '0';
      shieldOverlayRef.current.style.pointerEvents = 'none';
      shieldOverlayRef.current.style.visibility = 'hidden';
    }
    if (mediaStageRef.current) {
      mediaStageRef.current.style.visibility = 'visible';
      mediaStageRef.current.style.opacity = '1';
    }
    setIsShieldLatched(false);
    setShieldReason('');
    if (videoRef.current && !videoRef.current.ended) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleExpire = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    onCloseAndExpire();
  }, [onCloseAndExpire]);

  // 1. GPU-composited rAF Watermark Drift (0 React re-renders)
  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const step = (now: number) => {
      if (watermarkRef.current) {
        const t = (now - start) / 1000;
        // Smooth Lissajous drift kept inside visible media perimeter
        const offsetX = Math.sin(t * 0.7) * 90;
        const offsetY = Math.cos(t * 0.55) * 65;
        watermarkRef.current.style.transform = `translate3d(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px, 0)`;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 2. Synchronous Anti-Capture, Burst-Shot & Screen-Record Listeners
  useEffect(() => {
    const handleBlur = () => {
      activateInstantShield(
        'Window focus lost (e.g. OS screenshot tool, switcher, or external capture). Media blacked out.'
      );
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState !== 'visible') {
        activateInstantShield('Tab inactive or window minimized. Media obscured.');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        activateInstantShield('Cursor exited the secure viewing viewport.');
      }
    };

    const handleResize = () => {
      const dw = Math.abs(window.innerWidth - lastWindowSizeRef.current.w);
      const dh = Math.abs(window.innerHeight - lastWindowSizeRef.current.h);
      lastWindowSizeRef.current = { w: window.innerWidth, h: window.innerHeight };
      if (dw > 120 || dh > 120) {
        activateInstantShield('Viewport geometry changed unexpectedly (screen split / capture detected).');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerSecurityWarning('Right-click & context menu disabled on protected View Once media.');
    };

    const handleKeyGuard = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const keyLower = (e.key || '').toLowerCase();

      // PrintScreen (often fires only on keyup on Windows/Linux)
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        activateInstantShield(
          'PrintScreen attempt intercepted. Protected frame concealed.',
          'Screenshot Attempt Blocked: PrintScreen is prohibited on View Once media.'
        );
        return;
      }

      // Windows Snipping Tool (Win+Shift+S / Meta+Shift+S) & Mac Capture (Cmd+Shift+3/4/5/6)
      if (
        (e.metaKey && e.shiftKey && ['s', '3', '4', '5', '6'].includes(keyLower)) ||
        (cmdOrCtrl && e.shiftKey && ['s', '3', '4', '5', '6'].includes(keyLower))
      ) {
        e.preventDefault();
        e.stopPropagation();
        activateInstantShield(
          'Screen capture shortcut intercepted. Protected frame concealed.',
          'Screen Capture Shortcut Intercepted! Protected frame blacked out.'
        );
        return;
      }

      // DevTools & Inspection Shortcuts
      if (
        e.key === 'F12' ||
        (cmdOrCtrl && e.shiftKey && ['i', 'c', 'j'].includes(keyLower))
      ) {
        e.preventDefault();
        activateInstantShield(
          'Developer inspection shortcut intercepted.',
          'Inspection shortcuts are disabled during View Once playback.'
        );
        return;
      }

      // Save / Print / View Source
      if (cmdOrCtrl && ['s', 'p', 'u'].includes(keyLower)) {
        e.preventDefault();
        activateInstantShield(
          'Save/Print/Source action blocked.',
          'Saving, printing, or exporting View Once media is prohibited.'
        );
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleExpire();
      }
    };

    const handleBeforePrint = () => {
      activateInstantShield('Printing prohibited on View Once protected media.');
    };

    window.addEventListener('blur', handleBlur, true);
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyGuard, true);
    window.addEventListener('keyup', handleKeyGuard, true);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      window.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyGuard, true);
      window.removeEventListener('keyup', handleKeyGuard, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [activateInstantShield, handleExpire, triggerSecurityWarning]);

  return (
    <div
      id="view-once-modal-overlay"
      className="fixed inset-0 z-50 bg-[#030508] flex flex-col select-none overflow-hidden transform-gpu"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* 1. TOP SECURITY CONTROL BAR */}
      <header className="h-16 border-b border-cyan-500/20 bg-[#080b12] px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <VerilanceLogo size="sm" showText={false} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white font-['Space_Grotesk'] truncate">
                VERILANCE VIEW ONCE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Anti-Capture Shield
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              {media.title} • {media.fileSize}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0f1522] border border-cyan-500/30 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center text-[10px] font-black font-mono text-cyan-300">
              1
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold leading-none">
                1-Time Protected Msg
              </span>
              <span className="text-[11px] font-semibold text-slate-300 leading-tight">
                Destroys On Exit
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {media.mediaType === 'video' && (
            <button
              type="button"
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
            type="button"
            id="close-view-once-btn"
            onClick={handleExpire}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 hover:text-red-200 text-xs font-bold transition shadow-sm cursor-pointer"
            title="Closing permanently expires this View Once preview"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close & Expire</span>
          </button>
        </div>
      </header>

      {/* 2. REPEATING DIAGONAL WATERMARK MATRIX */}
      <div
        className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-15 select-none"
        aria-hidden="true"
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="verilance-watermark-matrix"
              width="280"
              height="140"
              patternTransform="rotate(-30 0 0)"
              patternUnits="userSpaceOnUse"
            >
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
        {/* Moving GPU-Accelerated Watermark Pill (zero React re-renders) */}
        <div
          ref={watermarkRef}
          className="absolute z-25 pointer-events-none px-3 py-1 rounded-full bg-black/80 border border-cyan-400/45 shadow-xl flex items-center gap-2 will-change-transform"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold text-cyan-200 tracking-wider whitespace-nowrap">
            VERILANCE • Viewer: {currentUser.name} ({currentUser.id}) • {sessionHash}
          </span>
        </div>

        {/* Media Container (Hidden synchronously on capture triggers) */}
        <div
          ref={mediaStageRef}
          className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black transition-none"
          style={{ willChange: 'opacity, visibility' }}
        >
          {isLoadingMedia ? (
            <div className="w-80 sm:w-96 h-64 flex flex-col items-center justify-center gap-3 bg-[#090c12] text-cyan-300 text-xs p-6">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              <span>Decrypting protected 1-Time media stream...</span>
            </div>
          ) : mediaLoadError ? (
            <div className="w-80 sm:w-96 h-64 flex flex-col items-center justify-center gap-2 bg-[#090c12] text-red-300 text-xs p-6 text-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
              <span className="font-bold">Protected Media Unavailable</span>
              <span className="text-slate-400">{mediaLoadError}</span>
            </div>
          ) : media.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={resolvedUrl}
              autoPlay
              playsInline
              controls={false}
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              onEnded={handleExpire}
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[75vh] w-auto object-contain rounded-2xl pointer-events-none"
            />
          ) : (
            <img
              src={resolvedUrl}
              alt={media.title}
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[75vh] w-auto object-contain rounded-2xl pointer-events-none"
              draggable={false}
            />
          )}

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/80 border border-white/10 text-[10px] text-slate-300 font-mono">
            <span>VERILANCE Protected Asset • {media.mediaType.toUpperCase()}</span>
            <span className="text-cyan-300">SHA256-VRL-{sessionHash}</span>
          </div>
        </div>

        {/* 4. PRE-MOUNTED ZERO-LAG OPAQUE BLACKOUT SHIELD (No heavy blur delay) */}
        <div
          ref={shieldOverlayRef}
          id="view-once-capture-shield"
          onClick={handleResumeProtectedView}
          className="absolute inset-0 z-40 bg-[#030508] flex flex-col items-center justify-center p-6 text-center cursor-pointer"
          style={{
            opacity: isShieldLatched ? 1 : 0,
            pointerEvents: isShieldLatched ? 'auto' : 'none',
            visibility: isShieldLatched ? 'visible' : 'hidden',
            willChange: 'opacity',
          }}
        >
          <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 shadow-xl shadow-red-500/15">
            <EyeOff className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Anti-Capture Blackout Shield Active
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] mb-2">
            Protected Media Concealed
          </h3>

          <p className="max-w-md text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
            {shieldReason ||
              'Preview was instantly blacked out because focus left the viewing perimeter or a capture key was detected.'}
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResumeProtectedView();
            }}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Resume Protected View</span>
          </button>
        </div>
      </div>

      {/* 5. FLOATING SECURITY SENTINEL TOAST */}
      {securityToast && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#140b10] border border-red-500/60 shadow-2xl text-red-200 text-xs font-bold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* 6. BOTTOM FOOTER */}
      <footer className="h-12 border-t border-white/10 bg-[#080b12] px-4 sm:px-6 flex items-center justify-between text-[11px] text-slate-400 shrink-0 z-30">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>VERILANCE Protected Content • View Once • Screenshots & Recording Blocked</span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-slate-400 text-[10px] font-mono">
          <span>GPU Blackout Shield: ARMED</span>
          <span>•</span>
          <span>Shortcuts Intercept: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
};
