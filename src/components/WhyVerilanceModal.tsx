import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Bot, 
  CheckCircle2, 
  Percent, 
  EyeOff, 
  Eye, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Scale, 
  AlertTriangle, 
  DollarSign, 
  UserCheck, 
  ShieldAlert, 
  FileCheck2,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { soundEffects } from '../lib/soundEffects';
import { VerilanceLogo } from './VerilanceLogo';

interface WhyVerilanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDealModal?: () => void;
  onOpenKyc?: () => void;
}

export const WhyVerilanceModal: React.FC<WhyVerilanceModalProps> = ({
  isOpen,
  onClose,
  onOpenDealModal,
  onOpenKyc,
}) => {
  // Interactive Live 3% Fee Calculator state
  const [calculatorBudget, setCalculatorBudget] = useState<number>(10000);
  const [activeTab, setActiveTab] = useState<'usps' | 'calculator' | 'comparison'>('usps');

  if (!isOpen) return null;

  // Fee calculations
  const verilanceFeeRate = 0.03; // 3%
  const traditionalFeeRate = 0.20; // 20% typical Upwork/Fiverr commission

  const verilanceFee = Math.round(calculatorBudget * verilanceFeeRate);
  const verilancePayout = calculatorBudget - verilanceFee;

  const traditionalFee = Math.round(calculatorBudget * traditionalFeeRate);
  const traditionalPayout = calculatorBudget - traditionalFee;

  const totalSaved = traditionalFee - verilanceFee;

  return (
    <div 
      id="why-verilance-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        id="why-verilance-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto custom-scrollbar bg-[#0b0f17]/95 border border-cyan-500/30 rounded-3xl p-5 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(6,182,212,0.2)] text-slate-100 my-auto"
      >
        {/* Futuristic Ambient Glow Accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-cyan-500/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-teal-500/10 via-cyan-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="btn-close-why-verilance"
          onClick={() => {
            soundEffects.playSubTabClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition z-20 cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Verilance Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                The Cyber-Escrow Protocol
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                Live 3% Guarantee
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk'] mt-1">
              Why Choose VERILANCE?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Engineered exclusively for video editors, VFX artists, and high-growth YouTube creators tired of 20% platform gouging, stolen preview cuts, and non-payment scams.
            </p>
          </div>

          {/* Interactive Mode Pills */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#121724] border border-white/10 text-xs font-bold shrink-0">
            <button
              onClick={() => {
                soundEffects.playTabClick();
                setActiveTab('usps');
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'usps'
                  ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Core USPs
            </button>
            <button
              onClick={() => {
                soundEffects.playTabClick();
                setActiveTab('calculator');
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3 h-3" />
              <span>3% Calculator</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playTabClick();
                setActiveTab('comparison');
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'comparison'
                  ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vs Traditional
            </button>
          </div>
        </div>

        {/* TAB 1: 4 CORE USPs */}
        {activeTab === 'usps' && (
          <div className="py-6 space-y-6 relative z-10 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* USP 1: 3% Commission */}
              <div className="p-5 rounded-2xl bg-[#0f1422] border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-3 group shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Percent className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                    3% vs 20%
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk'] group-hover:text-cyan-300 transition-colors">
                    1. Ultra-Low 3% Platform Fee
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Keep <strong>97% of your hard-earned creative payout</strong>. Unlike traditional freelance platforms that seize 15% to 20% of every deal plus withdrawal surcharges, VERILANCE runs lean on a transparent 3% escrow fee.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Traditional: ₹2,000 lost on ₹10,000</span>
                  <span className="text-cyan-300 font-bold">VERILANCE: Only ₹300</span>
                </div>
              </div>

              {/* USP 2: Anti-Screen Capture & View Once */}
              <div className="p-5 rounded-2xl bg-[#0f1422] border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-3 group shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold">
                    Zero Leaks
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk'] group-hover:text-teal-300 transition-colors">
                    2. Anti-Screenshot & View-Once Media
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Share raw rushes, confidential rough cuts, or color proofs without anxiety. Our <strong>View Once engine</strong> auto-destroys previews on close with zero progress timers, blocking screen recorders, PrintScreen, and inspect elements.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Dynamic Watermarking Layer</span>
                  <span className="text-teal-300 font-bold">Instant Buffer Purge</span>
                </div>
              </div>

              {/* USP 3: Moveable VAKRA AI */}
              <div className="p-5 rounded-2xl bg-[#0f1422] border border-purple-500/20 hover:border-purple-500/40 transition-all space-y-3 group shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                    Autonomous Sentinel
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk'] group-hover:text-purple-300 transition-colors">
                    3. Floating VAKRA AI Contract Sentinel
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Your moveable personal cyber arbitrator. VAKRA monitors milestone clauses in real-time, auto-drafts agreements in 1 click, analyzes scope creep, and prevents unfair disputes before funds leave escrow.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Real-Time Agreement Scans</span>
                  <span className="text-purple-300 font-bold">Fair Multi-Sig Resolution</span>
                </div>
              </div>

              {/* USP 4: KYC-Backed Guaranteed Escrow */}
              <div className="p-5 rounded-2xl bg-[#0f1422] border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-3 group shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    RBI & UIDAI Compliant
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk'] group-hover:text-emerald-300 transition-colors">
                    4. KYC-Verified Guaranteed Payouts
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Zero ghosting and zero stolen work. Clients lock funds via official <strong>Razorpay Multi-Sig Escrow</strong> before the first keyframe is cut. Payout releases instantly to Aadhaar/PAN and bank-verified IFSC accounts.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>100% Upfront Deposit</span>
                  <span className="text-emerald-300 font-bold">Direct Payout to Bank</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE LIVE 3% FEE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="py-6 space-y-6 relative z-10 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-cyan-500/30 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Set Deal Amount (INR)
                  </span>
                  <span className="text-2xl font-black font-['Space_Grotesk'] text-cyan-400">
                    ₹{calculatorBudget.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="500"
                  value={calculatorBudget}
                  onChange={(e) => setCalculatorBudget(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>₹1,000 (Shorts Edit)</span>
                  <span>₹50,000 (Full Channel Retainer)</span>
                  <span>₹1,00,000 (Commercial Master)</span>
                </div>
              </div>

              {/* Live Side-by-Side Savings Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Traditional Platform Box */}
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                  <span className="text-xs font-bold text-red-300 uppercase tracking-wider block">
                    Traditional Platforms (20% Fee)
                  </span>
                  <div className="text-sm font-semibold text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gross Contract:</span>
                      <span className="text-white">₹{calculatorBudget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Platform Commission:</span>
                      <span>-₹{traditionalFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 border-t border-red-500/20 flex justify-between font-bold text-base text-red-300">
                      <span>Editor Receives:</span>
                      <span>₹{traditionalPayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* VERILANCE Protocol Box */}
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-400/50 space-y-2 shadow-lg shadow-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider block">
                      VERILANCE (3% Transparent)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      97% PAYOUT
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gross Contract:</span>
                      <span className="text-white">₹{calculatorBudget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-cyan-300">
                      <span>VERILANCE 3% Fee:</span>
                      <span>-₹{verilanceFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 border-t border-cyan-500/30 flex justify-between font-bold text-base text-emerald-400">
                      <span>Editor Receives:</span>
                      <span>₹{verilancePayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Extra Savings Callout */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-emerald-200">
                      You save ₹{totalSaved.toLocaleString('en-IN')} extra in your pocket!
                    </span>
                    <p className="text-[11px] text-slate-300">
                      On a single project, that covers software subscriptions, sound effect libraries, or color grading LUTs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FEATURE MATRIX COMPARISON */}
        {activeTab === 'comparison' && (
          <div className="py-6 space-y-4 relative z-10 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0d111a]">
              <div className="grid grid-cols-12 bg-[#121622] p-3 text-xs font-bold text-slate-300 border-b border-white/10">
                <div className="col-span-5 sm:col-span-6">Security & Financial Feature</div>
                <div className="col-span-3 sm:col-span-3 text-center text-slate-400">Traditional Sites</div>
                <div className="col-span-4 sm:col-span-3 text-center text-cyan-300 font-extrabold">VERILANCE</div>
              </div>

              <div className="divide-y divide-white/5 text-xs">
                {[
                  { feature: 'Commission Take-Rate', trad: '15% - 20% Cut', verilance: '3% Transparent Fee', win: true },
                  { feature: 'Preview Protection', trad: 'Downloadable links (leaks)', verilance: 'View-Once & Anti-Screen Capture', win: true },
                  { feature: 'Dispute Arbitration', trad: 'Weeks-long email back-and-forth', verilance: 'Autonomous VAKRA AI Sentinel', win: true },
                  { feature: 'Deposit Upfront', trad: 'Partial or discretionary', verilance: '100% Locked in Multi-Sig Escrow', win: true },
                  { feature: 'Payout Identity Verification', trad: 'Basic email verification', verilance: 'Govt UIDAI/PAN & Bank IFSC KYC', win: true },
                  { feature: 'Timerless View-Once Review', trad: 'Not Supported', verilance: 'Permanent Lock on Exit', win: true },
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-3 sm:p-3.5 items-center hover:bg-white/[0.02] transition">
                    <div className="col-span-5 sm:col-span-6 font-medium text-slate-200">
                      {row.feature}
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-center text-slate-400 text-[11px]">
                      {row.trad}
                    </div>
                    <div className="col-span-4 sm:col-span-3 text-center font-bold text-cyan-300 text-[11px] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{row.verilance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Encrypted escrow backed by Razorpay & UIDAI standard KYC.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenKyc && (
              <button
                id="btn-why-verilance-kyc"
                onClick={() => {
                  soundEffects.playSubTabClick();
                  onClose();
                  onOpenKyc();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition"
              >
                Complete KYC
              </button>
            )}

            {onOpenDealModal && (
              <button
                id="btn-why-verilance-start-deal"
                onClick={() => {
                  soundEffects.playTabClick();
                  onClose();
                  onOpenDealModal();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Create 3% Escrow Deal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
