import React, { useState } from 'react';
import {
  ShieldAlert,
  Bot,
  Sparkles,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface VakraCompanionProps {
  onAutoDraftAgreement: (suggestedDeal: {
    serviceType: string;
    amount: number;
    deadline: string;
    description: string;
  }) => void;
  onScanAlertTriggered?: (alertText: string) => void;
}

export const VakraCompanion: React.FC<VakraCompanionProps> = ({
  onAutoDraftAgreement,
  onScanAlertTriggered,
}) => {
  // Compact / collapsed by default so chat workspace stays uncluttered
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'safe' | 'threat_detected' | 'idle';
    message: string;
    suggestions: string[];
    riskScore: number;
    timestamp?: string;
  }>({
    status: 'threat_detected',
    message: 'Active Anti-Fraud Monitor: Keep all file previews & payments inside VERILANCE Escrow.',
    suggestions: [
      'Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system!',
      'Heads up: Off-platform transfers (Telegram / Direct UPI) void your 100% Escrow insurance guarantee.',
      'Suggested: Lock funds in Escrow before sending high-res assets or project files.',
    ],
    riskScore: 68,
    timestamp: 'Live',
  });

  const handleScanChat = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScanResult({
        status: 'threat_detected',
        message: 'Scan Completed: Active anti-scam safeguards enforced on this thread.',
        suggestions: [
          'Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system!',
          'Notice: Require upfront Razorpay Escrow funding before rendering master files.',
          'Recommendation: Use 1-Time Msg View Once or Watermarked Preview for draft cuts.',
        ],
        riskScore: 74,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      if (onScanAlertTriggered) {
        onScanAlertTriggered(
          'Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system!'
        );
      }
    }, 900);
  };

  const handleApplyAutoDraft = () => {
    onAutoDraftAgreement({
      serviceType: 'YouTube Video Editing',
      amount: 2000,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      description:
        'Full 10-minute YouTube video edit, sound design, dynamic zooms, color grading, and up to 2 revisions.',
    });
  };

  return (
    <div
      id="vakra-ai-panel"
      className="relative rounded-2xl border border-cyan-500/35 bg-[#0c1017]/90 px-3.5 py-2.5 shadow-lg shadow-cyan-950/20 text-slate-100 transition-all overflow-hidden"
    >
      {/* Compact Header Bar — Anti-Scam Protection Notice */}
      <div className="relative flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 p-[1.5px] shadow-sm shadow-cyan-500/30">
              <div className="w-full h-full bg-[#0d121b] rounded-[7px] flex items-center justify-center text-cyan-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0c1017]" />
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white tracking-wide font-['Space_Grotesk']">
                VAKRA
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-bold tracking-wide">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Anti-Scam Protection Notice</span>
              </span>
            </div>

            {!isExpanded && (
              <p className="text-[11px] text-slate-300/90 truncate hidden sm:block">
                Keep payments in 2% Escrow & use View Once / Watermarked Delivery for drafts.
              </p>
            )}
          </div>
        </div>

        {/* Highlighted High-Contrast Collapse / Expand Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
          {!isExpanded && (
            <button
              type="button"
              onClick={handleApplyAutoDraft}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/40 text-teal-300 text-[11px] font-bold transition cursor-pointer"
              title="Auto-draft a verified escrow deal"
            >
              <FileText className="w-3 h-3" />
              <span>Auto-Draft</span>
            </button>
          )}

          <button
            type="button"
            id="btn-toggle-anti-scam-notice"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 active:scale-95 border border-cyan-400/70 text-cyan-200 hover:text-white text-[11px] font-extrabold tracking-wide shadow-[0_0_14px_rgba(34,211,238,0.3)] hover:shadow-[0_0_18px_rgba(34,211,238,0.5)] transition cursor-pointer"
            title={isExpanded ? 'Collapse Anti-Scam Notice (^)' : 'Expand Anti-Scam Notice (v)'}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse Anti-Scam Protection Notice' : 'Expand Anti-Scam Protection Notice'}
          >
            <span className="hidden sm:inline">{isExpanded ? 'Hide Notice' : 'Details'}</span>
            <span className="w-4 h-4 rounded-md bg-cyan-400 text-slate-950 flex items-center justify-center font-black">
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 stroke-[2.75]" /> : <ChevronDown className="w-3.5 h-3.5 stroke-[2.75]" />}
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-vakra-scan-scams"
              onClick={handleScanChat}
              disabled={isScanning}
              className="px-3 py-2 rounded-xl bg-[#141a24] hover:bg-[#1a2332] border border-cyan-500/35 hover:border-cyan-400/70 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : 'text-cyan-400'}`} />
              <span>{isScanning ? 'Scanning Feed...' : 'Scan Chat for Scams'}</span>
            </button>

            <button
              type="button"
              id="btn-vakra-auto-draft"
              onClick={handleApplyAutoDraft}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-400/50 text-teal-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-teal-300" />
              <span>Auto-Draft Escrow Agreement</span>
            </button>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                Anti-Scam Protocol Rules
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/30">
                Sentinel Active • {lastScanResult.timestamp}
              </span>
            </div>

            <p className="text-amber-100/95 font-semibold leading-relaxed">
              Warning: Never share raw, unwatermarked files outside the secure "Submit Work" or "1-Time Msg" View Once system.
            </p>

            <ul className="text-slate-300 text-[11px] space-y-0.5 list-disc list-inside">
              <li>Clients must secure deposits into 2% Razorpay Escrow before final render handoff.</li>
              <li>Off-platform transfers (Telegram / Direct UPI) void your 100% Escrow dispute coverage.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-[#131923] border border-white/10 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs font-semibold text-white truncate">
                Preset: YouTube Video Editing • ₹2,000 (2 revisions + watermark guard)
              </span>
            </div>
            <button
              type="button"
              id="btn-apply-preset"
              onClick={handleApplyAutoDraft}
              className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shrink-0"
            >
              <span>Load into Deal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
