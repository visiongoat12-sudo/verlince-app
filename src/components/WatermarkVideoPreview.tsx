import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface WatermarkVideoPreviewProps {
  delivery: WorkDelivery;
  isClient: boolean;
  onApproveAndRelease: () => void;
  isApproved: boolean;
  deadlineString: string;
}

export const WatermarkVideoPreview: React.FC<WatermarkVideoPreviewProps> = ({
  delivery,
  isClient,
  onApproveAndRelease,
  isApproved,
  deadlineString,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(38);
  const totalDuration = 600; // 10 minutes in seconds

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!isApproved) return;
    const blob = new Blob(
      ['VERILANCE ESCROW CERTIFIED: 4K Master Video Cut - Render Completed Successfully.'], 
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = delivery.fileName.replace('.mp4', '_UNWATERMARKED_MASTER_4K.mp4');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      id="watermarked-work-preview-card"
      className="rounded-2xl border border-cyan-500/30 bg-[#0d1118] overflow-hidden shadow-2xl transition-all"
    >
      {/* Top Banner Status */}
      <div className="px-4 py-2.5 bg-[#121722] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <FileVideo className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              {delivery.fileName}
            </h4>
            <p className="text-[11px] text-slate-400">
              {delivery.resolution} • {delivery.duration} • {delivery.fileSize}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            isApproved
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {isApproved ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-400" />
                Raw Master Unlocked
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                Watermarked Draft (Protected)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Interactive Video Container with Watermark Overlay */}
      <div className="relative aspect-video w-full bg-[#05070a] flex items-center justify-center overflow-hidden select-none group">
        {/* Mock Cinematic Video Frame Graphics */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-[#121c2c] flex items-center justify-center">
          {/* Simulated Video Content Preview Elements */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Ambient Background Waveform / Graphic */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative z-10 space-y-2">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </div>
              <p className="text-xs font-mono tracking-widest text-cyan-300 uppercase">
                {isPlaying ? 'Simulated Video Playback Active' : 'Click to Play Draft Cut Preview'}
              </p>
              <p className="text-[11px] text-slate-400">
                Audio mix: Stereo Mastered • Color graded: Rec.709
              </p>
            </div>
          </div>
        </div>

        {/* SEMI-TRANSPARENT DIAGONAL WATERMARK OVERLAY (When not yet approved) */}
        {!isApproved && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-around py-4 z-20 overflow-hidden rotate-[-18deg] scale-125 opacity-75">
            <div className="flex justify-around whitespace-nowrap text-cyan-300/40 text-xs sm:text-sm font-black tracking-widest uppercase py-1 border-y border-cyan-400/20 bg-cyan-950/40 backdrop-blur-[1px] shadow-sm">
              <span>⚠️ VERILANCE ESCROW PROTECTED</span>
              <span>•</span>
              <span>DRAFT ONLY — UNRELEASED</span>
              <span>•</span>
              <span>NON-DOWNLOADABLE MASTER</span>
            </div>
            <div className="flex justify-around whitespace-nowrap text-amber-300/40 text-xs sm:text-sm font-black tracking-widest uppercase py-1 border-y border-amber-400/20 bg-amber-950/40 backdrop-blur-[1px] shadow-sm">
              <span>🔒 FUNDS IN ESCROW REQUIRED</span>
              <span>•</span>
              <span>WATERMARKED DRAFT</span>
              <span>•</span>
              <span>ANTI-SCAM VERIFIED</span>
            </div>
            <div className="flex justify-around whitespace-nowrap text-cyan-300/40 text-xs sm:text-sm font-black tracking-widest uppercase py-1 border-y border-cyan-400/20 bg-cyan-950/40 backdrop-blur-[1px] shadow-sm">
              <span>⚠️ VERILANCE ESCROW PROTECTED</span>
              <span>•</span>
              <span>DRAFT ONLY — UNRELEASED</span>
              <span>•</span>
              <span>VERIFIED EDITOR WORK</span>
            </div>
          </div>
        )}

        {/* Full Unlocked Master Seal (When approved) */}
        {isApproved && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>FULL RESOLUTION UNLOCKED (4K MASTER)</span>
          </div>
        )}

        {/* Video Player Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 flex flex-col gap-1.5">
          {/* Progress bar */}
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              setCurrentTime(Math.round(pos * totalDuration));
            }}
            className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer group/bar relative"
          >
            <div 
              className="h-full bg-cyan-400 rounded-full transition-all"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleTogglePlay}
                className="hover:text-cyan-400 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="font-mono text-[11px] text-slate-400">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>

            <div className="text-[11px] font-mono text-cyan-400">
              ProRes 422HQ • 3840x2160
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Metadata & Deadline Mapping */}
      <div className="p-4 bg-[#10141d] border-t border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Delivery Timestamp:</strong> {delivery.formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{delivery.deadlineComparison} (Target: {deadlineString})</span>
          </div>
        </div>

        {/* Notice for Client vs Freelancer */}
        {!isApproved ? (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Raw Download Locked to Protect Freelancer
              </p>
              <p className="text-[11px] text-slate-300">
                Review the watermarked preview. Click "Approve & Release Funds" to release ₹1,940 to the editor and immediately unlock the clean 4K export.
              </p>
            </div>

            <button
              id="btn-approve-release-funds"
              onClick={onApproveAndRelease}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approve & Release Funds</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Funds Released & Watermark Permanently Cleared
              </p>
              <p className="text-[11px] text-slate-300">
                The editor has received the ₹1,940 payout in their verified wallet. Master 4K video is ready for high-speed download.
              </p>
            </div>

            <button
              id="btn-download-master-work"
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Master 4K Video</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
