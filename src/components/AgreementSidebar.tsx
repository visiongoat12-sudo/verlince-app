import React, { useState } from 'react';
import { DealAgreement, UserProfile, UserRole } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  AlertOctagon, 
  Clock, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight, 
  CreditCard, 
  FileText, 
  HelpCircle, 
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ExternalLink,
  DollarSign
} from 'lucide-react';

interface AgreementSidebarProps {
  deal: DealAgreement | null;
  currentUser: UserProfile;
  onOpenCreateDeal: () => void;
  onSubmitWork: () => void;
  onApproveAndRelease: () => void;
  onRaiseDispute: (reason: string) => void;
  onResolveDispute: () => void;
  isWorkSubmitted: boolean;
}

export const AgreementSidebar: React.FC<AgreementSidebarProps> = ({
  deal,
  currentUser,
  onOpenCreateDeal,
  onSubmitWork,
  onApproveAndRelease,
  onRaiseDispute,
  onResolveDispute,
  isWorkSubmitted,
}) => {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Editor submitted cuts missing agreed audio mastering and second revision items.');
  const [paymentChannel, setPaymentChannel] = useState<'UPI' | 'PayPal' | 'Card'>('UPI');

  const handleConfirmDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    onRaiseDispute(disputeReason);
    setShowDisputeModal(false);
  };

  const isFreelancer = currentUser.role === 'editor';
  const isClient = currentUser.role === 'creator';

  return (
    <aside 
      id="right-agreement-sidebar"
      className="w-full lg:w-96 bg-[#0c0f15] border-l border-white/10 flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-5"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide font-['Space_Grotesk']">
              Digital Escrow Agreement
            </h2>
            <p className="text-[11px] text-slate-400">
              Cryptographically Enforced Contract
            </p>
          </div>
        </div>

        {deal && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            {deal.id}
          </span>
        )}
      </div>

      {/* If No Active Deal Yet */}
      {!deal ? (
        <div className="p-6 rounded-2xl bg-[#121620] border border-dashed border-white/15 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <span className="text-2xl">🤝</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              No Active Escrow Locked
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never start work or send renders without an active deal. Click below to initialize a secured escrow deal.
            </p>
          </div>
          <button
            id="btn-sidebar-create-deal"
            onClick={onOpenCreateDeal}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-cyan-500/20 hover:opacity-90 transition flex items-center justify-center gap-1.5"
          >
            <span>Initialize Deal Form</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* ACTIVE DIGITAL AGREEMENT WIDGET */
        <div className="space-y-4">
          {/* Main Deal Card */}
          <div className="rounded-2xl bg-[#11151e] border border-white/10 p-4 space-y-3.5 shadow-xl relative overflow-hidden">
            {/* Dynamic Status Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Agreement
              </span>
              
              {/* Dynamic Escrow State Badge */}
              {deal.status === 'disputed' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 flex items-center gap-1 animate-pulse">
                  🚨 Under Investigation by VERILANCE Support
                </span>
              ) : deal.status === 'released' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Funds Released & Completed
                </span>
              ) : deal.status === 'work_submitted' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Work Delivered (Reviewing)
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Funds Secured in Escrow
                </span>
              )}
            </div>

            {/* Service & Role Routing Information */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                {deal.serviceType}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                {deal.description}
              </p>
            </div>

            {/* Sender & Receiver Mapping */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-[#161c28] border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                  Sender (Client)
                </span>
                <span className="text-xs font-semibold text-white truncate block">
                  {deal.senderRole === 'client' ? deal.senderName : deal.receiverName}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Funding Party
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#161c28] border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block">
                  Receiver (Editor)
                </span>
                <span className="text-xs font-semibold text-white truncate block">
                  {deal.senderRole === 'client' ? deal.receiverName : deal.senderName}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Beneficiary Party
                </span>
              </div>
            </div>

            {/* Automated Split Logic Display */}
            <div className="p-3 rounded-xl bg-[#0a0d13] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Deal Value:</span>
                <span className="font-bold text-white">₹{deal.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-cyan-400">
                <span className="flex items-center gap-1">
                  Trustway Commission (3% Fee):
                  <HelpCircle className="w-3 h-3 text-cyan-400/70" />
                </span>
                <span className="font-semibold">-₹{deal.commissionFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">Net Payout to Freelancer:</span>
                <span className="text-sm font-extrabold text-cyan-400">₹{deal.netPayout.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Target Milestone Deadline */}
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Agreed Deadline:
              </span>
              <span className="font-semibold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {deal.deadline || '25 September 2026'}
              </span>
            </div>

            {/* Multi-Channel Payment Channels Indicator */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Escrow Settlement Vault Channel
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['UPI', 'PayPal', 'Card'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentChannel(method)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition border ${
                      paymentChannel === method
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                        : 'bg-[#151a24] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method === 'UPI' ? '⚡ UPI / GPay' : method === 'PayPal' ? '🅿️ PayPal' : '💳 Cards'}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span>Vault State:</span>
                <span className="text-teal-400 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-teal-400" />
                  {deal.status === 'disputed' 
                    ? 'Funds Frozen by Security Bot' 
                    : deal.status === 'released' 
                    ? 'Disbursed to Bank Account' 
                    : 'Secured in VERILANCE Multi-Sig'}
                </span>
              </div>
            </div>

            {/* Action Buttons: Submit Work (Freelancer) or Approve & Release (Client) */}
            <div className="pt-2 space-y-2">
              {/* If user is Editor / Freelancer and work not yet submitted */}
              {deal.status !== 'released' && deal.status !== 'disputed' && (
                <button
                  id="btn-submit-work-action"
                  onClick={onSubmitWork}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-md ${
                    isWorkSubmitted 
                      ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-cyan-500/20'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isWorkSubmitted ? 'Upload Revised Cut' : 'Submit Work (Watermarked)'}</span>
                </button>
              )}

              {/* If work is submitted and not released yet */}
              {isWorkSubmitted && deal.status !== 'released' && deal.status !== 'disputed' && (
                <button
                  id="btn-sidebar-approve-release"
                  onClick={onApproveAndRelease}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Release Funds (₹{deal.netPayout})</span>
                </button>
              )}

              {/* Dispute Button */}
              {deal.status !== 'released' && (
                deal.status === 'disputed' ? (
                  <button
                    id="btn-resolve-dispute-action"
                    onClick={onResolveDispute}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Unfreeze & Resume Normal Escrow</span>
                  </button>
                ) : (
                  <button
                    id="btn-raise-dispute"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Raise Dispute (Freeze Funds)</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Dispute Case Information (If Active) */}
          {deal.status === 'disputed' && deal.dispute && (
            <div className="rounded-2xl bg-red-950/20 border border-red-500/40 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-red-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Dispute Case {deal.dispute.caseId}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                  Funds Frozen
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Reason:</strong> {deal.dispute.reason}
              </p>
              <div className="text-[10px] text-slate-400">
                VERILANCE Arbitration Team has paused payouts. File timeline and chat transcripts are archived for mediator inspection.
              </div>
            </div>
          )}

          {/* Transaction History Log */}
          <div className="rounded-2xl bg-[#11151e] border border-white/10 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Transaction History Log</span>
              <span className="text-[10px] text-cyan-400 font-normal">Real-Time Audit</span>
            </h4>

            <div className="space-y-3 relative pl-3 border-l border-white/10 text-xs">
              {deal.history.map((event) => (
                <div key={event.id} className="relative space-y-0.5">
                  {/* Bullet */}
                  <span className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ring-2 ring-[#11151e] ${
                    event.type === 'disputed' 
                      ? 'bg-red-400' 
                      : event.type === 'released' 
                      ? 'bg-cyan-400' 
                      : event.type === 'submitted' 
                      ? 'bg-cyan-400' 
                      : 'bg-teal-400'
                  }`} />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-[11px]">
                      {event.title}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {event.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {event.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Raise Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#10141c] border border-red-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                  Raise Escrow Dispute
                </h3>
                <p className="text-xs text-slate-400">
                  Immediately freezes funds in escrow and triggers support mediation.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  State Specific Dispute Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g., Unresponsive after second revision request, or unrendered files submitted."
                  className="w-full bg-[#161c28] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40 transition leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
                ⚠️ Once triggered, the escrow payment indicator badge switches to:
                <strong className="block mt-1 text-red-200">
                  "🚨 Under Investigation by VERILANCE Support"
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-dispute-submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Freeze Funds & Open Case</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
