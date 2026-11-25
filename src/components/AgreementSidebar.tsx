import React, { useState } from 'react';
import { DealAgreement, UserProfile } from '../types';
import {
  ShieldCheck,
  Lock,
  AlertOctagon,
  Clock,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  FileText,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Layers,
  MessageSquarePlus,
} from 'lucide-react';

interface AgreementSidebarProps {
  deal: DealAgreement | null;
  currentUser: UserProfile;
  onOpenCreateDeal: () => void;
  onFundEscrow?: () => void;
  onSubmitWork: () => void;
  onApproveAndRelease: () => void;
  onRequestRevision?: (note: string) => void;
  onToggleMilestoneApproval?: (milestoneId: string) => void;
  onRaiseDispute: (reason: string) => void;
  onResolveDispute: () => void;
  isWorkSubmitted: boolean;
}

const DEAL_STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'funded', label: 'Funded' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'review', label: 'Review' },
  { key: 'released', label: 'Released' },
] as const;

export const AgreementSidebar: React.FC<AgreementSidebarProps> = ({
  deal,
  currentUser,
  onOpenCreateDeal,
  onFundEscrow,
  onSubmitWork,
  onApproveAndRelease,
  onRequestRevision,
  onToggleMilestoneApproval,
  onRaiseDispute,
  onResolveDispute,
  isWorkSubmitted,
}) => {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState(
    'Editor submitted cuts missing agreed audio mastering and second revision items.'
  );
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [paymentChannel, setPaymentChannel] = useState<'UPI' | 'PayPal' | 'Card'>('UPI');

  const isClient = currentUser.role === 'creator';

  const getStageIndex = (): number => {
    if (!deal) return -1;
    if (deal.status === 'released') return 4;
    if (deal.status === 'revision_requested' || deal.status === 'work_submitted' || isWorkSubmitted)
      return 3;
    if (deal.status === 'escrow_secured') return 1;
    return 0; // draft / pending_funding / pending
  };

  const stageIndex = getStageIndex();
  const revUsed = deal?.revisionsUsed ?? 0;
  const revLimit = deal?.revisionLimit ?? 2;
  const revisionsExhausted = revLimit < 99 && revUsed >= revLimit;

  const handleConfirmDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    onRaiseDispute(disputeReason);
    setShowDisputeModal(false);
  };

  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim() || !onRequestRevision) return;
    onRequestRevision(revisionNote.trim());
    setRevisionNote('');
    setShowRevisionModal(false);
  };

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
            <p className="text-[11px] text-slate-400">Cryptographically Enforced Contract</p>
          </div>
        </div>

        {deal && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            {deal.id}
          </span>
        )}
      </div>

      {!deal ? (
        <div className="p-6 rounded-2xl bg-[#121620] border border-dashed border-white/15 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <span className="text-2xl">🤝</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Active Escrow Locked</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never start work or send raw renders without an active deal. Click below to create a milestone escrow agreement.
            </p>
          </div>
          <button
            type="button"
            id="btn-sidebar-create-deal"
            onClick={onOpenCreateDeal}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-cyan-500/20 hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Initialize Deal Form</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 5-Stage State Machine Stepper */}
          <div className="rounded-2xl bg-[#11151e] border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>Escrow Lifecycle</span>
              <span className={deal.status === 'disputed' ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'}>
                {deal.status === 'disputed' ? 'DISPUTE FROZEN' : `Stage ${stageIndex + 1}/5`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {DEAL_STAGES.map((st, idx) => {
                const done = deal.status !== 'disputed' && idx <= stageIndex;
                return (
                  <div key={st.key} className="space-y-1 text-center">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        deal.status === 'disputed'
                          ? 'bg-red-500/40'
                          : done
                          ? 'bg-gradient-to-r from-cyan-400 to-teal-400'
                          : 'bg-white/10'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-semibold block truncate ${
                        done ? 'text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Deal Card */}
          <div className="rounded-2xl bg-[#11151e] border border-white/10 p-4 space-y-3.5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {deal.category || 'Active Agreement'}
              </span>

              {deal.status === 'disputed' ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300">
                  Disputed • Frozen
                </span>
              ) : deal.status === 'draft' ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-400/40 text-slate-300">
                  Draft • Unfunded
                </span>
              ) : deal.status === 'pending_funding' || deal.status === 'pending' ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending Funding
                </span>
              ) : deal.status === 'revision_requested' ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  Revision Requested
                </span>
              ) : deal.status === 'released' ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Released
                </span>
              ) : deal.status === 'work_submitted' ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                  Under Review
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Escrow Secured
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">{deal.serviceType}</h3>
              <p className="text-xs text-slate-400 line-clamp-3">{deal.description}</p>
            </div>

            {/* Sender & Receiver */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-[#161c28] border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                  Sender (Client)
                </span>
                <span className="text-xs font-semibold text-white truncate block">
                  {deal.senderRole === 'client' ? deal.senderName : deal.receiverName}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#161c28] border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block">
                  Receiver (Editor)
                </span>
                <span className="text-xs font-semibold text-white truncate block">
                  {deal.senderRole === 'client' ? deal.receiverName : deal.senderName}
                </span>
              </div>
            </div>

            {/* Deliverables & Milestones */}
            {(deal.deliverables?.length || deal.milestones?.length) && (
              <div className="p-3 rounded-xl bg-[#0a0d13] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Milestones & Deliverables
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    Revisions: {revUsed}/{revLimit >= 99 ? '∞' : revLimit}
                  </span>
                </div>

                {deal.deliverables && deal.deliverables.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {deal.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-teal-400 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {deal.milestones && deal.milestones.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    {deal.milestones.map((ms) => {
                      const isMsApproved = ms.status === 'approved' || ms.status === 'released' || deal.status === 'released';
                      return (
                        <div
                          key={ms.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#121722] border border-white/5 text-[11px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {onToggleMilestoneApproval && deal.status !== 'released' && (
                              <input
                                type="checkbox"
                                checked={isMsApproved}
                                onChange={() => onToggleMilestoneApproval(ms.id)}
                                className="accent-cyan-400 cursor-pointer"
                                title="Verify milestone completion"
                              />
                            )}
                            <span className="truncate font-semibold text-white">{ms.title}</span>
                          </div>
                          <span className="font-mono text-cyan-300 shrink-0">
                            {ms.percentage}% (₹{ms.amount.toLocaleString('en-IN')})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2% Split Logic Display */}
            <div className="p-3 rounded-xl bg-[#0a0d13] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Deal Value:</span>
                <span className="font-bold text-white">₹{deal.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-cyan-400">
                <span className="flex items-center gap-1">
                  VERILANCE Escrow Fee (2%):
                  <HelpCircle className="w-3 h-3 text-cyan-400/70" />
                </span>
                <span className="font-semibold">-₹{deal.commissionFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">Net Payout (98%):</span>
                <span className="text-sm font-extrabold text-cyan-400">
                  ₹{deal.netPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Agreed Deadline:
              </span>
              <span className="font-semibold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {deal.deadline}
              </span>
            </div>

            {/* Payment Channel */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Escrow Settlement Vault Channel
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['UPI', 'PayPal', 'Card'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPaymentChannel(method)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                      paymentChannel === method
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                        : 'bg-[#151a24] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method === 'UPI' ? 'UPI' : method === 'PayPal' ? 'PayPal' : 'Cards'}
                  </button>
                ))}
              </div>
            </div>

            {/* Role-Aware Next Actions */}
            <div className="pt-2 space-y-2">
              {(deal.status === 'draft' ||
                deal.status === 'pending_funding' ||
                deal.status === 'pending') &&
                onFundEscrow && (
                  <button
                    type="button"
                    id="btn-sidebar-fund-escrow"
                    onClick={onFundEscrow}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Fund Escrow via Razorpay (₹{deal.amount.toLocaleString('en-IN')})</span>
                  </button>
                )}

              {deal.status !== 'released' &&
                deal.status !== 'disputed' &&
                deal.status !== 'draft' &&
                deal.status !== 'pending_funding' &&
                deal.status !== 'pending' && (
                  <button
                    type="button"
                    id="btn-submit-work-action"
                    onClick={onSubmitWork}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                      isWorkSubmitted
                        ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-cyan-500/20'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>
                      {deal.status === 'revision_requested'
                        ? 'Upload Revised Cut (Watermarked)'
                        : isWorkSubmitted
                        ? 'Upload Revised Cut'
                        : 'Submit Work (Watermarked)'}
                    </span>
                  </button>
                )}

              {isWorkSubmitted && deal.status !== 'released' && deal.status !== 'disputed' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    id="btn-sidebar-approve-release"
                    onClick={onApproveAndRelease}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Release Funds (₹{deal.netPayout.toLocaleString('en-IN')})</span>
                  </button>

                  {onRequestRevision && (
                    <button
                      type="button"
                      id="btn-sidebar-request-revision"
                      disabled={revisionsExhausted}
                      onClick={() => setShowRevisionModal(true)}
                      className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-400/35 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span>
                        {revisionsExhausted
                          ? `Revision Limit Reached (${revUsed}/${revLimit})`
                          : `Request Revision (${revUsed}/${revLimit >= 99 ? '∞' : revLimit})`}
                      </span>
                    </button>
                  )}

                  {isClient && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>Requires KYC Verified account for release</span>
                    </div>
                  )}
                </div>
              )}

              {deal.status !== 'released' &&
                (deal.status === 'disputed' ? (
                  <button
                    type="button"
                    id="btn-resolve-dispute-action"
                    onClick={onResolveDispute}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Unfreeze & Resume Normal Escrow</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-raise-dispute"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Raise Dispute (Freeze Funds)</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Dispute Case Info */}
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
                  <span
                    className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ring-2 ring-[#11151e] ${
                      event.type === 'disputed'
                        ? 'bg-red-400'
                        : event.type === 'released' || event.type === 'submitted'
                        ? 'bg-cyan-400'
                        : 'bg-teal-400'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-[11px]">{event.title}</span>
                    <span className="text-[10px] text-slate-500">{event.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{event.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#10141c] border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                  Request Milestone Revision
                </h3>
                <p className="text-xs text-slate-400">
                  Revision {revUsed + 1} of {revLimit >= 99 ? 'Unlimited' : revLimit} included in deal
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmRevision} className="space-y-4">
              <textarea
                required
                rows={3}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Describe exact timestamp changes, audio normalization, or color tweaks..."
                className="w-full bg-[#161c28] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
                >
                  Send Revision Request
                </button>
              </div>
            </form>
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
                  className="w-full bg-[#161c28] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60"
                />
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
