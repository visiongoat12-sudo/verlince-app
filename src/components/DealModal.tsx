import React, { useState, useEffect, useMemo } from 'react';
import { DealAgreement, DealMilestone } from '../types';
import {
  X,
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  CheckCircle2,
  RotateCcw,
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
    counterpartyName?: string;
    counterpartyId?: string;
  };
  clientName: string;
  freelancerName: string;
}

const CATEGORY_PRESETS: Record<
  string,
  { label: string; defaultService: string; deliverables: string[] }
> = {
  youtube: {
    label: 'YouTube Long-Form',
    defaultService: 'YouTube Retention Video Edit (8–12 Min)',
    deliverables: [
      '4K 60fps Master Timeline Edit + Hook Intro',
      'SFX Mixing, J/L-Cuts & Dynamic Motion Captions',
      'Rec.709 Color Grade + Project Export',
    ],
  },
  reels: {
    label: 'Reels / Shorts Pack',
    defaultService: 'High-Retention Vertical Shorts Pack',
    deliverables: [
      'Vertical 9:16 Cuts (1080x1920 60fps)',
      'Animated Kinetic Subtitles & Viral B-Roll',
      'Clean Audio Mastering (-14 LUFS)',
    ],
  },
  vfx: {
    label: 'Documentary & VFX',
    defaultService: '3D Motion Graphics & Documentary Cut',
    deliverables: [
      'Story Assembly & Narrative Pacing Cut',
      'Custom After Effects 3D Callouts & Maps',
      'Final 4K ProRes / H.265 Export',
    ],
  },
  thumbnail: {
    label: 'Thumbnail & Motion',
    defaultService: 'CTR Thumbnail Suite & Intro Motion',
    deliverables: [
      '3 High-Contrast Thumbnail Concepts (PSD + PNG)',
      'Custom Brand Motion Intro / Lower Thirds',
    ],
  },
  custom: {
    label: 'Custom Production',
    defaultService: '',
    deliverables: ['Primary Milestone Master Deliverable'],
  },
};

const RISKY_KEYWORDS = [
  'telegram',
  'whatsapp',
  'direct upi',
  'paytm',
  'gpay',
  'outside escrow',
  'off platform',
  'raw first',
  'without escrow',
];

export const DealModal: React.FC<DealModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeal,
  initialValues,
  clientName,
  freelancerName,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDeadline = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [senderRole, setSenderRole] = useState<'client' | 'freelancer'>(
    initialValues?.senderRole || 'client'
  );
  const [categoryKey, setCategoryKey] = useState<string>('youtube');
  const [counterpartyName, setCounterpartyName] = useState<string>(
    initialValues?.counterpartyName ||
      (senderRole === 'client' ? freelancerName : clientName)
  );
  const [serviceType, setServiceType] = useState(
    initialValues?.serviceType || CATEGORY_PRESETS.youtube.defaultService
  );
  const [amountRaw, setAmountRaw] = useState<string>(
    initialValues?.amount ? String(initialValues.amount) : ''
  );
  const [deadline, setDeadline] = useState(initialValues?.deadline || defaultDeadline);
  const [description, setDescription] = useState(initialValues?.description || '');
  const [revisionLimit, setRevisionLimit] = useState<number>(2);
  const [deliverables, setDeliverables] = useState<string[]>(
    CATEGORY_PRESETS.youtube.deliverables
  );
  const [newDeliverableInput, setNewDeliverableInput] = useState('');

  // Milestone mode: single (100%) vs split (2 or 3 milestones)
  const [scheduleMode, setScheduleMode] = useState<'single' | 'milestones'>('single');
  const [milestoneDrafts, setMilestoneDrafts] = useState<
    Array<{ id: string; title: string; deliverable: string; percentage: number; dueDate: string }>
  >([
    {
      id: 'ms-1',
      title: 'Milestone 1: First Assembly & Rough Cut',
      deliverable: 'Watermarked rough timeline cut for pacing sign-off',
      percentage: 40,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    },
    {
      id: 'ms-2',
      title: 'Milestone 2: Final 4K Master & Revisions',
      deliverable: 'Color graded, sound mastered final 4K export',
      percentage: 60,
      dueDate: defaultDeadline,
    },
  ]);

  const [safeguardAck, setSafeguardAck] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.serviceType) setServiceType(initialValues.serviceType);
      if (initialValues.amount) setAmountRaw(String(initialValues.amount));
      if (initialValues.deadline) setDeadline(initialValues.deadline);
      if (initialValues.description) setDescription(initialValues.description);
      if (initialValues.senderRole) setSenderRole(initialValues.senderRole);
      if (initialValues.counterpartyName) {
        setCounterpartyName(initialValues.counterpartyName);
      }
    }
  }, [initialValues]);

  const parsedAmount = Math.max(
    0,
    parseFloat(amountRaw.replace(/[^0-9.]/g, '')) || 0
  );
  const commissionFee = Math.round(parsedAmount * 0.02 * 100) / 100;
  const netPayout = Math.max(0, Math.round((parsedAmount - commissionFee) * 100) / 100);

  const totalMilestonePct = useMemo(
    () => milestoneDrafts.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0),
    [milestoneDrafts]
  );

  // Real-time off-platform / scam keyword detection
  const detectedRiskKeywords = useMemo(() => {
    const combined = `${serviceType} ${description} ${deliverables.join(' ')}`.toLowerCase();
    return RISKY_KEYWORDS.filter((kw) => combined.includes(kw));
  }, [serviceType, description, deliverables]);

  if (!isOpen) return null;

  const handleSelectCategory = (key: string) => {
    soundEffects.playSubTabClick();
    setCategoryKey(key);
    const preset = CATEGORY_PRESETS[key];
    if (preset) {
      if (preset.defaultService) setServiceType(preset.defaultService);
      setDeliverables([...preset.deliverables]);
    }
  };

  const handleAddDeliverable = () => {
    const clean = newDeliverableInput.trim();
    if (!clean) return;
    setDeliverables((prev) => [...prev, clean]);
    setNewDeliverableInput('');
  };

  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateDeal = (): string | null => {
    if (!counterpartyName.trim()) {
      return 'Please enter the counterparty name or @username.';
    }
    if (!serviceType.trim()) {
      return 'Please specify the service title or project name.';
    }
    if (parsedAmount < 100) {
      return 'Minimum escrow deal amount is ₹100.';
    }
    if (!deadline || deadline < todayStr) {
      return 'Delivery deadline cannot be in the past.';
    }
    if (!description.trim()) {
      return 'Please enter clear project scope and agreement clauses.';
    }
    if (scheduleMode === 'milestones' && Math.abs(totalMilestonePct - 100) > 0.01) {
      return `Milestone percentages must total exactly 100% (currently ${totalMilestonePct}%).`;
    }
    if (detectedRiskKeywords.length > 0 && !safeguardAck) {
      return 'Please acknowledge the Off-Platform Safeguard warning before proceeding.';
    }
    return null;
  };

  const createDealObject = (isDraftOnly: boolean): DealAgreement => {
    const myDisplayName = senderRole === 'client' ? clientName : freelancerName;
    const partnerName = counterpartyName.trim() || (senderRole === 'client' ? freelancerName : clientName);

    const senderDisplayName = myDisplayName;
    const receiverDisplayName = partnerName;

    const milestones: DealMilestone[] =
      scheduleMode === 'single'
        ? [
            {
              id: `ms-single-${Date.now()}`,
              title: serviceType.trim(),
              deliverable: deliverables[0] || serviceType.trim(),
              percentage: 100,
              amount: parsedAmount,
              dueDate: deadline,
              status: 'pending',
            },
          ]
        : milestoneDrafts.map((m, idx) => ({
            id: `${m.id}-${idx}`,
            title: m.title.trim() || `Milestone ${idx + 1}`,
            deliverable: m.deliverable.trim() || 'Milestone deliverable',
            percentage: m.percentage,
            amount: Math.round(parsedAmount * (m.percentage / 100) * 100) / 100,
            dueDate: m.dueDate || deadline,
            status: 'pending',
          }));

    return {
      id: `TRW-${Math.floor(100000 + Math.random() * 900000)}`,
      title: serviceType.trim(),
      category: CATEGORY_PRESETS[categoryKey]?.label || 'Custom Production',
      senderRole,
      receiverId: initialValues?.counterpartyId,
      senderName: senderDisplayName,
      receiverName: receiverDisplayName,
      serviceType: serviceType.trim(),
      scopeSummary: description.trim(),
      deliverables: deliverables.filter(Boolean),
      milestones,
      revisionLimit,
      revisionsUsed: 0,
      offPlatformSafeguardAccepted: true,
      amount: parsedAmount,
      commissionFee,
      netPayout,
      deadline,
      description: description.trim(),
      paymentMethod: 'UPI',
      status: isDraftOnly ? 'draft' : 'pending_funding',
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}-1`,
          title: isDraftOnly
            ? 'Escrow Agreement Saved as Draft'
            : 'Escrow Agreement Created (Pending Razorpay Deposit)',
          detail: `${senderDisplayName} & ${receiverDisplayName} • ${milestones.length} milestone(s) • ${revisionLimit === 99 ? 'Unlimited' : revisionLimit} revision(s) • ₹${parsedAmount.toLocaleString('en-IN')}.`,
          timestamp: 'Just now',
          type: 'neutral',
        },
      ],
    };
  };

  const handleCreateAndFund = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateDeal();
    if (err) {
      setValidationError(err);
      soundEffects.playAlertWarningSound();
      return;
    }
    setValidationError(null);
    soundEffects.playTabClick();
    const deal = createDealObject(false);
    onConfirmDeal(deal, true);
    onClose();
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    const err = validateDeal();
    if (err) {
      setValidationError(err);
      soundEffects.playAlertWarningSound();
      return;
    }
    setValidationError(null);
    soundEffects.playSubTabClick();
    const deal = createDealObject(true);
    onConfirmDeal(deal, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="create-deal-modal"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar bg-[#0f131a] border border-cyan-500/35 rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-100 my-auto"
      >
        <button
          type="button"
          id="btn-close-deal-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shrink-0">
            <span className="text-xl">🤝</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                CREATE ESCROW DEAL
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold tracking-wider uppercase">
                2% Multi-Sig Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Define structured deliverables, milestones, revision limits, and lock funds securely before work begins.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateAndFund} className="space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Role & Counterparty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                My Role <span className="text-cyan-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTabClick();
                    setSenderRole('client');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    senderRole === 'client'
                      ? 'bg-cyan-500/15 border-cyan-400 text-white'
                      : 'bg-[#141820] border-white/10 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold block">Client</span>
                  <span className="text-[10px] text-slate-400">Funding Escrow</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playTabClick();
                    setSenderRole('freelancer');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    senderRole === 'freelancer'
                      ? 'bg-teal-500/15 border-teal-400 text-white'
                      : 'bg-[#141820] border-white/10 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold block">Editor</span>
                  <span className="text-[10px] text-slate-400">Receiving Payout</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Counterparty Name / @Handle <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder={senderRole === 'client' ? 'Editor name or @username' : 'Client name or @username'}
                className="w-full bg-[#151a24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* 2. Category Presets */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Project Preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    categoryKey === key
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-[#141923] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Service Title, Amount, Deadline, Revision Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Deal / Project Title <span className="text-cyan-400">*</span>
              </label>
              <input
                id="input-service-type"
                type="text"
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g., YouTube Video Editing"
                className="w-full bg-[#151a24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Total Escrow Amount (INR) <span className="text-cyan-400">*</span>
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
                  className="w-full bg-[#151a24] border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Delivery Deadline <span className="text-cyan-400">*</span>
              </label>
              <input
                id="input-deal-deadline"
                type="date"
                required
                min={todayStr}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#151a24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Included Revisions
              </label>
              <select
                value={revisionLimit}
                onChange={(e) => setRevisionLimit(Number(e.target.value))}
                className="w-full bg-[#151a24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/60"
              >
                <option value={1}>1 Revision Round</option>
                <option value={2}>2 Revision Rounds (Standard)</option>
                <option value={3}>3 Revision Rounds</option>
                <option value={99}>Unlimited Minor Tweaks</option>
              </select>
            </div>
          </div>

          {/* 4. Structured Deliverables Checklist */}
          <div className="rounded-xl bg-[#0b0e14] border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Structured Deliverables Checklist ({deliverables.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {deliverables.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#141923] border border-white/5 text-xs text-slate-200"
                >
                  <span className="truncate">
                    {idx + 1}. {item}
                  </span>
                  {deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(idx)}
                      className="text-slate-500 hover:text-red-400 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDeliverableInput}
                onChange={(e) => setNewDeliverableInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDeliverable();
                  }
                }}
                placeholder="Add another deliverable (e.g., Separate stems audio track)"
                className="flex-1 bg-[#151a24] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* 5. Single vs Multi-Milestone Payment Schedule */}
          <div className="rounded-xl bg-[#0b0e14] border border-white/10 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                Escrow Release Schedule
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-[#141923] border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => setScheduleMode('single')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    scheduleMode === 'single'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Release (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('milestones')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    scheduleMode === 'milestones'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Multi-Milestone Split
                </button>
              </div>
            </div>

            {scheduleMode === 'milestones' && (
              <div className="space-y-2 pt-1">
                {milestoneDrafts.map((ms, idx) => (
                  <div
                    key={ms.id}
                    className="grid grid-cols-12 gap-2 items-center bg-[#141923] p-2 rounded-lg border border-white/5 text-xs"
                  >
                    <input
                      type="text"
                      value={ms.title}
                      onChange={(e) =>
                        setMilestoneDrafts((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, title: e.target.value } : item))
                        )
                      }
                      className="col-span-6 bg-[#0d1119] border border-white/10 rounded-md px-2 py-1 text-white"
                      placeholder="Milestone title"
                    />
                    <div className="col-span-2 flex items-center gap-1">
                      <input
                        type="number"
                        min={5}
                        max={95}
                        value={ms.percentage}
                        onChange={(e) =>
                          setMilestoneDrafts((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, percentage: Number(e.target.value) || 0 } : item
                            )
                          )
                        }
                        className="w-full bg-[#0d1119] border border-white/10 rounded-md px-2 py-1 text-white text-center font-mono"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                    <div className="col-span-4 text-right font-mono text-cyan-300 font-bold">
                      ₹{Math.round(parsedAmount * (ms.percentage / 100)).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={
                      Math.abs(totalMilestonePct - 100) < 0.01
                        ? 'text-emerald-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                    }
                  >
                    Allocation Total: {totalMilestonePct}% {Math.abs(totalMilestonePct - 100) < 0.01 ? '(Valid)' : '(Must equal 100%)'}
                  </span>
                  {milestoneDrafts.length < 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setMilestoneDrafts([
                          {
                            id: 'ms-1',
                            title: 'Milestone 1: Rough Cut',
                            deliverable: 'Storyline assembly draft',
                            percentage: 30,
                            dueDate: todayStr,
                          },
                          {
                            id: 'ms-2',
                            title: 'Milestone 2: Fine Cut + VFX',
                            deliverable: 'Sound FX + motion graphics pass',
                            percentage: 40,
                            dueDate: deadline,
                          },
                          {
                            id: 'ms-3',
                            title: 'Milestone 3: Final 4K Master',
                            deliverable: 'Final color & unwatermarked export',
                            percentage: 30,
                            dueDate: deadline,
                          },
                        ])
                      }
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      + Switch to 3 Milestones
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setMilestoneDrafts((prev) => [
                          { ...prev[0], percentage: 40 },
                          { ...prev[2], percentage: 60 },
                        ])
                      }
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>2 Milestones</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 6. Agreement Clauses & Off-Platform Safeguard */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Scope & Agreement Clauses <span className="text-cyan-400">*</span>
            </label>
            <textarea
              id="input-deal-description"
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Edit 10-minute video with dynamic captions, raw footage via Drive, watermarked proof required before release."
              className="w-full bg-[#151a24] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 leading-relaxed"
            />
          </div>

          {detectedRiskKeywords.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/50 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Off-Platform Risk Detected: "{detectedRiskKeywords.join('", "')}"
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90">
                Payments or unwatermarked master transfers outside VERILANCE void Escrow & Arbitration coverage.
              </p>
              <label className="flex items-center gap-2 text-[11px] text-white font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={safeguardAck}
                  onChange={(e) => setSafeguardAck(e.target.checked)}
                  className="accent-amber-400"
                />
                <span>I confirm all payments and approvals will remain inside VERILANCE Escrow.</span>
              </label>
            </div>
          )}

          {/* 7. Live 2% Fee / 98% Payout Transparency Card */}
          <div className="rounded-xl bg-[#0b0e14] border border-white/10 p-3.5 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                2% Escrow Protection Summary
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {revisionLimit === 99 ? 'Unlimited' : revisionLimit} Revisions • {scheduleMode === 'single' ? '1 Stage' : `${milestoneDrafts.length} Milestones`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-[#12161f] p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block">Escrow Deposit</span>
                <span className="text-sm font-bold text-white">
                  ₹{parsedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-[#12161f] p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-cyan-400 block">2% Platform Fee</span>
                <span className="text-sm font-bold text-cyan-400">
                  ₹{commissionFee.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-[#12161f] p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-teal-300 block">Editor Net (98%)</span>
                <span className="text-sm font-bold text-teal-300">
                  ₹{netPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* 8. Action Buttons */}
          <div className="pt-1 space-y-2">
            <button
              type="submit"
              id="btn-confirm-deal-continue"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Create & Fund Escrow via Razorpay (₹{parsedAmount.toLocaleString('en-IN')})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-save-deal-pending"
              onClick={handleSaveAsDraft}
              className="w-full py-2.5 rounded-xl bg-[#141824] hover:bg-[#182030] border border-white/10 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Save as Draft (Fund Later)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
