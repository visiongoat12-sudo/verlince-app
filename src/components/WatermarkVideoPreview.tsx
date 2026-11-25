import React, { useState, useEffect, useRef } from 'react';
import { WorkDelivery } from '../types';
import {
  Play,
  Pause,
  Download,
  CheckCircle,
  ShieldCheck,
  Clock,
  FileVideo,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  EyeOff,
  HardDrive,
  Radio,
} from 'lucide-react';

interface WatermarkVideoPreviewProps {
  delivery: WorkDelivery;
  isClient: boolean;
  onApproveAndRelease: () => void;
  isApproved: boolean;
  deadlineString: string;
  netPayout?: number;
}

export const WatermarkVideoPreview: React.FC<WatermarkVideoPreviewProps> = ({
  delivery,
  onApproveAndRelease,
  isApproved,
  deadlineString,
  netPayout = 1960,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSecs, setDurationSecs] = useState(600);
  const [streamQuality, setStreamQuality] = useState<'Auto' | '1080p' | '720p' | '480p'>('Auto');
  const [isShielded, setIsShielded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const shieldRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasLiveStream = !!delivery.previewStreamUrl;

  useEffect(() => {
    if (isApproved) {
      setIsShielded(false);
      return;
    }
    const triggerShield = () => {
      if (shieldRef.current) {
        shieldRef.current.style.opacity = '1';
        shieldRef.current.style.pointerEvents = 'auto';
      }
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      setIsShielded(true);
      setIsPlaying(false);
    };
    const onVis = () => {
      if (document.hidden) triggerShield();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        triggerShield();
      }
    };
    window.addEventListener('blur', triggerShield);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('keyup', onKey, true);
    return () => {
      window.removeEventListener('blur', triggerShield);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('keyup', onKey, true);
    };
  }, [isApproved]);

  const formatTime = (secs: number) => {
    const safe = Math.max(0, Math.floor(secs || 0));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = () => {
    if (hasLiveStream && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }
    setIsPlaying((p) => !p);
  };

  const handleSeek = (ratio: number) => {
    const target = Math.max(0, Math.min(durationSecs, ratio * durationSecs));
    setCurrentTime(target);
    if (hasLiveStream && videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const handleDownloadMaster = async () => {
    if (!isApproved) return;
    setDownloadError(null);

    if (delivery.masterVaultUrl) {
      try {
        // Verify vault unlock status first so errors surface cleanly
        const headCheck = await fetch(delivery.masterVaultUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
        });
        if (!headCheck.ok && headCheck.status !== 206) {
          const errBody = await headCheck.json().catch(() => ({}));
          setDownloadError(
            errBody?.error || 'Escrow Vault verification failed. Please retry release.'
          );
          return;
        }
        const a = document.createElement('a');
        a.href = delivery.masterVaultUrl;
        a.download = delivery.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        setDownloadError('Connection interrupted while starting Master Vault download.');
      }
      return;
    }

    const blob = new Blob(
      [`VERILANCE ESCROW MASTER RELEASED: ${delivery.fileName} (${delivery.fileSize})`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = delivery.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div
      id="watermarked-work-preview-card"
      className="rounded-2xl border border-cyan-500/30 bg-[#0d1118] overflow-hidden shadow-2xl transition-all"
      onContextMenu={(e) => {
        if (!isApproved) e.preventDefault();
      }}
    >
      {/* Top Banner Status */}
      <div className="px-4 py-2.5 bg-[#121722] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <FileVideo className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white tracking-wide truncate max-w-[240px] sm:max-w-md">
              {delivery.fileName}
            </h4>
            <p className="text-[11px] text-slate-400">
              {delivery.resolution} • {delivery.duration} • Master Size: {delivery.fileSize}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isApproved && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
              <Radio className="w-3 h-3" />
              Stream-Only Preview ({streamQuality})
            </span>
          )}
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isApproved ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-400" />
                Master Vault Unlocked
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                Master Locked in Vault
              </>
            )}
          </span>
        </div>
      </div>

      {/* Stream-Only Interactive Video Container with Watermark Overlay */}
      <div className="relative aspect-video w-full bg-[#05070a] flex items-center justify-center overflow-hidden select-none group">
        {hasLiveStream ? (
          <video
            ref={videoRef}
            src={delivery.previewStreamUrl}
            playsInline
            preload="metadata"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onClick={handleTogglePlay}
            onLoadedMetadata={() => {
              if (videoRef.current?.duration) {
                setDurationSecs(videoRef.current.duration);
              }
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain bg-black cursor-pointer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-[#121c2c] flex items-center justify-center">
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10 space-y-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </button>
                <p className="text-xs font-mono tracking-widest text-cyan-300 uppercase">
                  {delivery.mimeType?.startsWith('video/')
                    ? isPlaying
                      ? 'Adaptive Preview Stream Active'
                      : 'Click to Stream Watermarked Cut'
                    : 'Project Archive Sealed in Escrow Master Vault'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {delivery.fileSize} Master Package • Zero 5 GB download required during review
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SEMI-TRANSPARENT DIAGONAL WATERMARK OVERLAY (GPU composited, zero blur lag) */}
        {!isApproved && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-around py-4 z-20 overflow-hidden rotate-[-18deg] scale-125 opacity-75 transform-gpu">
            <div className="flex justify-around whitespace-nowrap text-cyan-300/45 text-xs sm:text-sm font-black tracking-widest uppercase py-1 border-y border-cyan-400/20 bg-cyan-950/45 shadow-sm">
              <span>VERILANCE ESCROW PROTECTED</span>
              <span>•</span>
              <span>STREAM PREVIEW ONLY</span>
              <span>•</span>
              <span>5 GB MASTER LOCKED</span>
            </div>
            <div className="flex justify-around whitespace-nowrap text-amber-300/45 text-xs sm:text-sm font-black tracking-widest uppercase py-1 border-y border-amber-400/20 bg-amber-950/45 shadow-sm">
              <span>PAYMENT RELEASE REQUIRED</span>
              <span>•</span>
              <span>WATERMARKED STREAM</span>
              <span>•</span>
              <span>ANTI-SCAM VERIFIED</span>
            </div>
            <div className="flex justify-around whitespace-nowrap text-cyan-300/45 text-xs sm:text-sm font-black tracking-widest uppercase py-1 border-y border-cyan-400/20 bg-cyan-950/45 shadow-sm">
              <span>VERILANCE ESCROW PROTECTED</span>
              <span>•</span>
              <span>STREAM PREVIEW ONLY</span>
              <span>•</span>
              <span>VERIFIED EDITOR WORK</span>
            </div>
          </div>
        )}

        {/* Pre-mounted Instant Blackout Curtain when focus lost / capture key detected */}
        {!isApproved && (
          <div
            ref={shieldRef}
            onClick={() => {
              if (shieldRef.current) {
                shieldRef.current.style.opacity = '0';
                shieldRef.current.style.pointerEvents = 'none';
              }
              setIsShielded(false);
            }}
            className="absolute inset-0 z-35 bg-[#04060b] flex flex-col items-center justify-center p-4 text-center cursor-pointer"
            style={{
              opacity: isShielded ? 1 : 0,
              pointerEvents: isShielded ? 'auto' : 'none',
            }}
          >
            <EyeOff className="w-7 h-7 text-red-400 mb-2" />
            <p className="text-xs font-bold text-white">Draft Stream Concealed (Focus Guard Active)</p>
            <span className="mt-2 px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[11px] font-bold">
              Click to Resume Stream Preview
            </span>
          </div>
        )}

        {/* Full Unlocked Master Seal (When approved) */}
        {isApproved && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>MASTER VAULT UNLOCKED ({delivery.fileSize})</span>
          </div>
        )}

        {/* Stream Player Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 flex flex-col gap-1.5">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              handleSeek(pos);
            }}
            className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer group/bar relative"
          >
            <div
              className="h-full bg-cyan-400 rounded-full transition-all"
              style={{ width: `${durationSecs > 0 ? (currentTime / durationSecs) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="hover:text-cyan-400 transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="font-mono text-[11px] text-slate-400">
                {formatTime(currentTime)} / {formatTime(durationSecs)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={streamQuality}
                onChange={(e) => setStreamQuality(e.target.value as 'Auto' | '1080p' | '720p' | '480p')}
                className="bg-black/70 border border-white/15 rounded px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 focus:outline-none"
                title="Adaptive Preview Bitrate"
              >
                <option value="Auto">Auto (Adaptive)</option>
                <option value="1080p">1080p Stream</option>
                <option value="720p">720p Fast</option>
                <option value="480p">480p Saver</option>
              </select>
              <span className="text-[11px] font-mono text-cyan-400 hidden sm:inline">
                {delivery.resolution}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Separated Escrow Master Vault Metadata & Actions */}
      <div className="p-4 bg-[#10141d] border-t border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Delivered:</strong> {delivery.formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Escrow Vault: {delivery.fileSize} (Target: {deadlineString})</span>
          </div>
        </div>

        {downloadError && (
          <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 text-red-200 text-xs">
            {downloadError}
          </div>
        )}

        {!isApproved ? (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                5 GB Master File Locked in Private Escrow Vault
              </p>
              <p className="text-[11px] text-slate-300">
                Review the watermarked stream preview above without downloading 5 GB. Click "Approve &amp; Release Funds" to release ₹{netPayout.toLocaleString('en-IN')} and unlock the clean original master download.
              </p>
            </div>

            <button
              type="button"
              id="btn-approve-release-funds"
              onClick={onApproveAndRelease}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approve &amp; Release Funds</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Payment Verified • Master Vault Unlocked ({delivery.fileSize})
              </p>
              <p className="text-[11px] text-slate-300">
                ₹{netPayout.toLocaleString('en-IN')} released to editor. Your unwatermarked original master file is ready for high-speed byte-range download.
              </p>
            </div>

            <button
              type="button"
              id="btn-download-master-work"
              onClick={handleDownloadMaster}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Master ({delivery.fileSize})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
