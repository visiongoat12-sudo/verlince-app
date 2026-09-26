import React, { useState } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle, 
  Sliders, 
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  getGracePeriodInfo, 
  setSimulatedDayOverride, 
  getSimulatedDayOverride, 
  GRACE_PERIOD_DAYS 
} from '../lib/kycGracePeriod';
import { soundEffects } from '../lib/soundEffects';

interface KycGracePeriodBannerProps {
  currentUser: UserProfile;
  onRequestVerification: () => void;
  onRefreshGraceInfo?: () => void;
}

export const KycGracePeriodBanner: React.FC<KycGracePeriodBannerProps> = ({
  currentUser,
  onRequestVerification,
  onRefreshGraceInfo,
}) => {
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [, setRerender] = useState(0);

  const graceInfo = getGracePeriodInfo(currentUser);

  // If user has already filled their verification, the grace period is satisfied!
  if (graceInfo.hasFilledVerification) {
    return null;
  }

  const handleSetSimDay = (days: number | null) => {
    soundEffects.playSubTabClick();
    setSimulatedDayOverride(days);
    setShowSimMenu(false);
    setRerender((v) => v + 1);
    if (onRefreshGraceInfo) onRefreshGraceInfo();
  };

  const isExpired = graceInfo.isGracePeriodExpired;

  return (
    <div 
      id="kyc-grace-period-banner"
      className={`w-full border-b px-4 py-2.5 transition-colors relative z-20 flex flex-wrap items-center justify-between gap-3 text-xs ${
        isExpired
          ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
          : graceInfo.daysRemaining <= 3
          ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
          : 'bg-[#0f1422] border-cyan-500/30 text-cyan-200'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
        {isExpired ? (
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        )}

        <div className="leading-tight">
          {isExpired ? (
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>⚠️ 15-Day Unverified Access Limit Reached</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 border border-rose-400/30 text-rose-200 uppercase font-black">
                Trading Locked
              </span>
            </p>
          ) : (
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>⏱️ Verification Grace Period Active</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-black">
                {graceInfo.daysRemaining} {graceInfo.daysRemaining === 1 ? 'Day' : 'Days'} Left
              </span>
            </p>
          )}

          <p className="text-[11px] opacity-90 mt-0.5">
            {isExpired ? (
              <span>Your account exceeded the 15-day unverified window. You must submit identity verification before you can trade with other users.</span>
            ) : (
              <span>Unverified accounts can be accessed for only 15 days. After 15 days, verification is mandatory to trade with other users.</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Verification Action Button */}
        <button
          id="btn-grace-period-verify-now"
          onClick={() => {
            soundEffects.playTabClick();
            onRequestVerification();
          }}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-md ${
            isExpired
              ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20 animate-pulse'
              : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-400/20'
          }`}
        >
          <span>{isExpired ? 'Submit Verification Now' : 'Verify Account'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Simulation / Testing Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowSimMenu((prev) => !prev)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
            title="Test / Simulate Grace Period Days"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {showSimMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0c101a] border border-white/15 p-2 shadow-2xl z-50 text-left space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-white/10">
                Simulate Account Age
              </div>
              <button
                onClick={() => handleSetSimDay(1)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 transition flex items-center justify-between"
              >
                <span>Day 1 (14 days left)</span>
                <span className="text-[10px] font-mono text-cyan-400">Normal</span>
              </button>
              <button
                onClick={() => handleSetSimDay(14)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-amber-500/15 hover:text-amber-300 transition flex items-center justify-between"
              >
                <span>Day 14 (1 day left)</span>
                <span className="text-[10px] font-mono text-amber-400">Warning</span>
              </button>
              <button
                onClick={() => handleSetSimDay(16)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-rose-500/15 hover:text-rose-300 transition flex items-center justify-between"
              >
                <span>Day 16 (Expired)</span>
                <span className="text-[10px] font-mono text-rose-400">Locked</span>
              </button>
              <button
                onClick={() => handleSetSimDay(null)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-white/5 hover:text-white transition border-t border-white/10 mt-1"
              >
                <span>Reset to Real Account Date</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
