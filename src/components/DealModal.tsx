import React, { useState, useEffect } from 'react';
import { DealAgreement } from '../types';
import { 
  X, 
  Handshake, 
  ShieldCheck, 
  Calendar, 
  ArrowRight, 
  Check, 
  Lock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { soundEffects } from '../lib/soundEffects';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeal: (deal: DealAgreement, triggerPaymentImmediately?: boolean) => void;
  initialValues?: {
    serviceType?: string;
    amount?: number;
    deadline?: string;
    description?: string;
    senderRole?: 'client' | 'freelancer';
  };
  clientName: string;
  freelancerName: string;
}

export const DealModal: React.FC<DealModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeal,
  initialValues,
  clientName,
  freelancerName,
}) => {
  // Compute default deadline (7 days from today)
  const defaultDeadline = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Sender = Client paying funds; Receiver = Freelancer receiving funds
  const [senderRole, setSenderRole] = useState<'client' | 'freelancer'>(
    initialValues?.senderRole || 'client'
  );
  const [serviceType, setServiceType] = useState(
    initialValues?.serviceType || ''
  );
  const [amountRaw, setAmountRaw] = useState<string>(
    initialValues?.amount ? String(initialValues.amount) : ''
  );
  const [deadline, setDeadline] = useState(
    initialValues?.deadline || defaultDeadline
  );
  const [description, setDescription] = useState(
    initialValues?.description || ''
  );

  // Synchronize when initialValues change (e.g. from VAKRA auto-draft)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.serviceType) setServiceType(initialValues.serviceType);
      if (initialValues.amount) setAmountRaw(String(initialValues.amount));
      if (initialValues.deadline) setDeadline(initialValues.deadline);
      if (initialValues.description) setDescription(initialValues.description);
      if (initialValues.senderRole) setSenderRole(initialValues.senderRole);
    }
  }, [initialValues]);

  if (!isOpen) return null;

  const parsedAmount = Math.max(0, parseFloat(amountRaw.replace(/[^0-9.]/g, '')) || 0);
  const commissionFee = Math.round(parsedAmount * 0.05 * 100) / 100;
  const netPayout = Math.max(0, parsedAmount - commissionFee);

  const createDealObject = (): DealAgreement => {
    const senderDisplayName = senderRole === 'client' ? clientName : freelancerName;
    const receiverDisplayName = senderRole === 'client' ? freelancerName : clientName;

    return {
      id: `TRW-${Math.floor(100000 + Math.random() * 900000)}`,
      title: serviceType,
      senderRole: senderRole,
      senderName: senderDisplayName,
      receiverName: receiverDisplayName,
      serviceType: serviceType,
      amount: parsedAmount,
      commissionFee: commissionFee,
      netPayout: netPayout,
      deadline: deadline,
      description: description,
      paymentMethod: 'UPI',
      status: 'pending_funding',
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}-1`,
          title: 'Escrow Agreement Drafted (Pending Funding)',
          detail: `Contract drafted between ${senderDisplayName} and ${receiverDisplayName}. Awaiting ₹${parsedAmount.toLocaleString('en-IN')} escrow funding.`,
          timestamp: 'Just now',
          type: 'neutral',
        },
      ],
    };
  };

  const handleCreateAndFund = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playTabClick();
    const deal = createDealObject();
    onConfirmDeal(deal, true);
    onClose();
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEffects.playSubTabClick();
    const deal = createDealObject();
    onConfirmDeal(deal, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="create-deal-modal"
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto custom-scrollbar bg-[#0f131a] border border-cyan-500/30 rounded-2xl p-4 sm:p-7 shadow-2xl text-slate-100 my-auto"
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="btn-close-deal-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md">
            <span className="text-2xl">🤝</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                CREATE DEAL
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold tracking-wider uppercase">
                Escrow Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lock funds in digital escrow before any video editing or production begins.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateAndFund} className="space-y-4">
          {/* Field 1: My Role (Radio selection: Sender vs Receiver) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              My Role in this Transaction <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  senderRole === 'client'
                    ? 'bg-cyan-500/10 border-cyan-500/60 text-white shadow-sm shadow-cyan-500/10'
                    : 'bg-[#141820] border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="deal-role"
                  value="client"
                  checked={senderRole === 'client'}
                  onChange={() => {
                    soundEffects.playTabClick();
                    setSenderRole('client');
                  }}
                  className="accent-cyan-400 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold block text-white">Sender (Client)</span>
                  <span className="text-[11px] text-slate-400">Paying funds into Escrow</span>
                </div>
              </label>

              <label 
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  senderRole === 'freelancer'
                    ? 'bg-teal-500/10 border-teal-500/60 text-white shadow-sm shadow-teal-500/10'
                    : 'bg-[#141820] border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="deal-role"
                  value="freelancer"
                  checked={senderRole === 'freelancer'}
                  onChange={() => {
                    soundEffects.playTabClick();
                    setSenderRole('freelancer');
                  }}
                  className="accent-teal-400 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold block text-white">Receiver (Freelancer)</span>
                  <span className="text-[11px] text-slate-400">Receiving funds upon release</span>
                </div>
              </label>
            </div>
          </div>

          {/* Field 2 & 3: Service Type & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Service Type <span className="text-cyan-400">*</span>
              </label>
              <input
                id="input-service-type"
                type="text"
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g., YouTube Video Editing"
                className="w-full bg-[#151a24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Amount Field (INR) <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  id="input-deal-amount"
                  type="text"
                  required
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(e.target.value)}
                  placeholder="2,000"
                  className="w-full bg-[#151a24] border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
                />
              </div>
            </div>
          </div>

          {/* Field 4: Deadline Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Deadline Picker <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                id="input-deal-deadline"
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#151a24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Example target milestone: 25 September 2026. Automatic late penalties and milestone verification apply.
            </p>
          </div>

          {/* Field 5: Description Box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description & Agreement Clauses <span className="text-cyan-400">*</span>
            </label>
            <textarea
              id="input-deal-description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Edit 10-minute video, includes up to 2 revisions, raw footage provided via Drive."
              className="w-full bg-[#151a24] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition leading-relaxed"
            />
          </div>

          {/* Dynamic Split Breakdown Calculation Card */}
          <div className="rounded-xl bg-[#0b0e14] border border-white/10 p-3.5 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Financial Escrow Breakdown</span>
              <span className="text-[10px] text-cyan-400 font-mono">Automated Split Engine</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-[#12161f] p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Total Deal Value</span>
                <span className="text-sm font-bold text-white">₹{parsedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-[#12161f] p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-cyan-400 block">5% VERILANCE Fee</span>
                <span className="text-sm font-bold text-cyan-400">₹{commissionFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-[#12161f] p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-cyan-300 block">Net Payout to Editor (95%)</span>
                <span className="text-sm font-bold text-cyan-300">₹{netPayout.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Field 6: Permanent Status Label */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold tracking-wide">
              🔒 Protected Payment (5% Fee Managed by VERILANCE)
            </span>
          </div>

          {/* Field 7: Action Buttons (Fund via Razorpay or Save Pending) */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              id="btn-confirm-deal-continue"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Fund Escrow via Razorpay (₹{parsedAmount.toLocaleString('en-IN')})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-save-deal-pending"
              onClick={handleSaveAsDraft}
              className="w-full py-2.5 rounded-xl bg-[#141824] hover:bg-[#182030] border border-white/10 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Save Agreement as Pending (Fund Later)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
