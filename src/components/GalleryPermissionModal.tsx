import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Film, 
  ShieldCheck, 
  Lock, 
  X, 
  Check, 
  Sparkles, 
  AlertCircle,
  Smartphone,
  ChevronRight
} from 'lucide-react';

export type GalleryPermissionStatus = 'prompt' | 'granted' | 'limited' | 'denied';

interface GalleryPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: (mode: 'full' | 'limited') => void;
  mediaType?: 'image' | 'video' | 'document' | 'all';
  sourceTitle?: string;
}

export const GalleryPermissionModal: React.FC<GalleryPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
  mediaType = 'all',
  sourceTitle = 'Media Upload',
}) => {
  const [selectedOption, setSelectedOption] = useState<'full' | 'limited'>('full');

  if (!isOpen) return null;

  const handleAllowFull = () => {
    try {
      localStorage.setItem('verilance_gallery_permission', 'granted');
      localStorage.setItem('verilance_gallery_permission_timestamp', new Date().toISOString());
    } catch (e) {
      console.warn('Storage permission error', e);
    }
    onPermissionGranted('full');
    onClose();
  };

  const handleAllowLimited = () => {
    try {
      localStorage.setItem('verilance_gallery_permission', 'limited');
      localStorage.setItem('verilance_gallery_permission_timestamp', new Date().toISOString());
    } catch (e) {
      console.warn('Storage permission error', e);
    }
    onPermissionGranted('limited');
    onClose();
  };

  const handleDeny = () => {
    try {
      localStorage.setItem('verilance_gallery_permission', 'denied');
    } catch (e) {
      console.warn('Storage permission error', e);
    }
    onClose();
  };

  return (
    <div 
      id="gallery-permission-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="gallery-permission-dialog"
        className="w-full sm:max-w-md bg-[#12151E] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-perm-title"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden mb-1 shrink-0" />

        {/* Dialog Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
              <div className="relative">
                <Image className="w-6 h-6" />
                <Film className="w-3.5 h-3.5 absolute -bottom-1 -right-1 text-teal-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                  <Smartphone className="w-2.5 h-2.5" /> Mobile Media Access
                </span>
              </div>
              <h3 
                id="gallery-perm-title" 
                className="text-base sm:text-lg font-bold text-white mt-1 leading-tight font-['Space_Grotesk']"
              >
                Access Your Media & Photos
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            aria-label="Close permission dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Purpose Description */}
        <div className="p-3.5 rounded-xl bg-[#171B26] border border-white/5 text-xs text-slate-300 space-y-2">
          <p className="leading-relaxed">
            <strong className="text-cyan-300">VERILANCE</strong> requires photo & media gallery access for <span className="font-semibold text-white">{sourceTitle}</span> to attach deliverables, preview encrypted watermarked cuts, or upload verification documents.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero-knowledge storage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>SHA-256 encrypted</span>
            </div>
          </div>
        </div>

        {/* Permission Options */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectedOption('full')}
            className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
              selectedOption === 'full'
                ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                selectedOption === 'full' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-500'
              }`}>
                {selectedOption === 'full' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Allow Access to All Photos & Videos</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold">Recommended</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Quickly browse and upload creative cuts, raw footage, or ID cards anytime.
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOption('limited')}
            className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
              selectedOption === 'limited'
                ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                selectedOption === 'limited' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-500'
              }`}>
                {selectedOption === 'limited' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Select Specific Media Files
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Pick individual items each time you submit a video or document.
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            id="btn-allow-gallery-perm"
            onClick={selectedOption === 'full' ? handleAllowFull : handleAllowLimited}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Grant Gallery Permission & Open</span>
          </button>

          <button
            type="button"
            id="btn-deny-gallery-perm"
            onClick={handleDeny}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition text-center"
          >
            Don't Allow
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-[10px] text-slate-500 text-center">
          You can revoke or adjust media permissions anytime in your device or browser settings.
        </p>
      </div>
    </div>
  );
};
