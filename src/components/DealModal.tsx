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

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeal: (deal: DealAgreement) => void;
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
  // Sender = Client paying funds; Receiver = Freelancer receiving funds
  const [senderRole, setSenderRole] = useState<'client' | 'freelancer'>(
    initialValues?.senderRole || 'client'
  );
  const [serviceType, setServiceType] = useState(
    initialValues?.serviceType || 'YouTube Video Editing'
  );
  const [amountRaw, setAmountRaw] = useState<string>(
    initialValues?.amount ? String(initialValues.amount) : '2000'
  );
  const [deadline, setDeadline] = useState(
    initialValues?.deadline || '2026-09-25'
  );
  const [description, setDescription] = useState(
    initialValues?.description || 'Edit 10-minute video, includes up to 2 revisions and 4K color export.'
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
  const commissionFee = Math.round(parsedAmount * 0.03 * 100) / 100;
  const netPayout = Math.max(0, parsedAmount - commissionFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const senderDisplayName = senderRole === 'client' ? clientName : freelancerName;
    const receiverDisplayName = senderRole === 'client' ? freelancerName : clientName;

    const newDeal: DealAgreement = {
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
      status: 'escrow_secured',
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}-1`,
          title: 'Escrow Agreement Initialized',
          detail: `Deal contract signed between ${senderDisplayName} and ${receiverDisplayName}.`,
          timestamp: 'Just now',
          type: 'neutral',
        },
        {
          id: `h-${Date.now()}-2`,
          title: 'Funds Secured in Escrow 🔒',
          detail: `₹${parsedAmount.toLocaleString('en-IN')} locked in VERILANCE Multi-Sig Vault. 3% platform commission allocated.`,
          timestamp: 'Just now',
          type: 'secure',
        },
      ],
    };

    onConfirmDeal(newDeal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="create-deal-modal"
        className="relative w-full max-w-xl bg-[#0f131a] border border-cyan-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-100 my-6"
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={() => setSenderRole('client')}
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
                  onChange={() => setSenderRole('freelancer')}
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
                <span className="text-[10px] text-cyan-400 block">3% VERILANCE Fee</span>
                <span className="text-sm font-bold text-cyan-400">₹{commissionFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-[#12161f] p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-emerald-400 block">Net Payout to Editor</span>
                <span className="text-sm font-bold text-emerald-400">₹{netPayout.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Field 6: Permanent Status Label */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold tracking-wide">
              🔒 Protected Payment (3% Fee Managed by VERILANCE)
            </span>
          </div>

          {/* Field 7: Prominent CONTINUE Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-confirm-deal-continue"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
