import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Bot, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  ArrowRight,
  EyeOff
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'safe' | 'threat_detected' | 'idle';
    message: string;
    suggestions: string[];
    riskScore: number;
    timestamp?: string;
  }>({
    status: 'threat_detected',
    message: 'Active Anti-Fraud Monitor: Detected external contact request in conversation history.',
    suggestions: [
      'Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system!',
      'Heads up: Off-platform transfers (Telegram / Direct UPI) void your 100% Escrow insurance guarantee.',
      'Suggested: Lock funds in Trustway Escrow before sending high-res assets or project files.',
    ],
    riskScore: 68,
    timestamp: 'Just now',
  });

  const [hasDraftRecommendation, setHasDraftRecommendation] = useState(true);

  const handleScanChat = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScanResult({
        status: 'threat_detected',
        message: 'Scan Completed: 2 high-risk scam triggers flagged in dialogue.',
        suggestions: [
          'Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system!',
          'Notice: Client requested full project file without upfront escrow confirmation.',
          'Recommendation: Use Trustway Watermarked Preview to guarantee payment before delivery.',
        ],
        riskScore: 74,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      if (onScanAlertTriggered) {
        onScanAlertTriggered('Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system!');
      }
    }, 1200);
  };

  const handleApplyAutoDraft = () => {
    onAutoDraftAgreement({
      serviceType: 'YouTube Video Editing',
      amount: 2000,
      deadline: '2026-09-25',
      description: 'Full 10-minute YouTube video edit, sound design, dynamic zooms, color grading, and up to 2 revisions.',
    });
  };

  return (
    <div 
      id="vakra-ai-panel"
      className="relative rounded-2xl border border-cyan-500/30 bg-[#0c1017]/85 backdrop-blur-md p-3.5 sm:p-4 shadow-xl shadow-cyan-950/20 text-slate-100 transition-all overflow-hidden"
    >
      {/* Background Cyber Ambient Radial Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 p-0.5 shadow-md shadow-cyan-500/30">
              <div className="w-full h-full bg-[#0d121b] rounded-[10px] flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            {/* Online Cyber Aura indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c1017] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk'] flex items-center gap-1.5">
                VAKRA
                <span className="text-[10px] px-1.5 py-0.2 font-medium tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded uppercase">
                  Cyber AI Shield
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous Escrow Sentinel & Anti-Scam Inspector
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label="Toggle Vakra Panel"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-white/5 space-y-3">
          {/* Action Quick Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-vakra-scan-scams"
              onClick={handleScanChat}
              disabled={isScanning}
              className="px-3 py-2 rounded-xl bg-[#141a24] hover:bg-[#1a2332] border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : 'text-cyan-400'}`} />
              <span>{isScanning ? 'Scanning Feed...' : 'Scan Chat for Scams'}</span>
            </button>

            <button
              id="btn-vakra-auto-draft"
              onClick={handleApplyAutoDraft}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-teal-300" />
              <span>Auto-Draft Agreement</span>
            </button>
          </div>

          {/* VAKRA Automated Safety Alert Callout */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-amber-400 font-medium">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                Anti-Scam Protocol Notice
              </span>
              <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Risk Rating: {lastScanResult.riskScore}%
              </span>
            </div>

            <p className="text-amber-200/90 leading-relaxed font-semibold">
              Warning: Never share raw, unwatermarked files outside the secure "Submit Work" system!
            </p>

            <ul className="text-slate-300/90 text-[11px] space-y-1 list-disc list-inside">
              <li>Clients must secure deposits into Escrow before final render handoff.</li>
              <li>Ghosting / non-payment is blocked when funds are verified in escrow.</li>
            </ul>
          </div>

          {/* Baseline Smart Recommendation Card */}
          {hasDraftRecommendation && (
            <div className="rounded-xl bg-[#131923] border border-white/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>Contextual AI Contract Preset</span>
                </div>
                <div className="text-xs font-semibold text-white">
                  YouTube Video Editing • ₹2,000 (Deadline: 25 Sep)
                </div>
                <div className="text-[10px] text-slate-400">
                  Includes: 10m edit + 2 revisions + watermark safeguard
                </div>
              </div>

              <button
                id="btn-apply-preset"
                onClick={handleApplyAutoDraft}
                className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow"
              >
                <span>Load into Deal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
