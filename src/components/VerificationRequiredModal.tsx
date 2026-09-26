import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  X,
  CreditCard,
  Building,
  User,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { soundEffects } from '../lib/soundEffects';
import { getGracePeriodInfo } from '../lib/kycGracePeriod';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser: UserProfile;
  onSaveVerification: (updated: Partial<UserProfile>) => void;
  canDismiss?: boolean;
}

export const VerificationRequiredModal: React.FC<VerificationRequiredModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveVerification,
  canDismiss = false,
}) => {
  const graceInfo = getGracePeriodInfo(currentUser);

  const [legalName, setLegalName] = useState(currentUser.kycData?.legalName || currentUser.name || '');
  const [idType, setIdType] = useState(currentUser.kycData?.idType || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(currentUser.kycData?.idNumber || '');
  const [bankAccount, setBankAccount] = useState(currentUser.kycData?.bankAccount || '');
  const [bankIfsc, setBankIfsc] = useState(currentUser.kycData?.bankIfsc || '');
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(currentUser.idDocumentName || null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedDocName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanLegal = legalName.trim();
    if (!cleanLegal) {
      setError('Please enter your full legal name as per government ID.');
      return;
    }

    const cleanId = idNumber.trim().toUpperCase();
    if (!cleanId) {
      setError('Please provide your Government ID number.');
      return;
    }

    // Format check for Aadhaar / PAN
    if (idType === 'Aadhaar Card') {
      const cleanDigits = cleanId.replace(/[\s-]/g, '');
      if (cleanDigits.length !== 12 || !/^\d{12}$/.test(cleanDigits)) {
        setError('Invalid Aadhaar Number: Must be exactly 12 numeric digits.');
        return;
      }
    } else if (idType === 'PAN Card') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(cleanId)) {
        setError('Invalid PAN Format: Must follow standard 10-char format (e.g. ABCDE1234F).');
        return;
      }
    }

    setIsSubmitting(true);
    soundEffects.playNotificationSound();

    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const docName = uploadedDocName || `${idType.replace(/\s+/g, '_')}_Document.pdf`;

    setTimeout(() => {
      onSaveVerification({
        kycStatus: 'pending',
        idDocumentName: docName,
        kycData: {
          legalName: cleanLegal,
          idType,
          idNumber: cleanId,
          bankAccount: bankAccount.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
          submittedAt: timestamp,
          docFrontPreview: docName,
        }
      });
      setIsSubmitting(false);
      setSuccessSubmitted(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1800);
    }, 600);
  };

  return (
    <div 
      id="verification-required-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300"
    >
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#0d111a] border border-amber-500/40 shadow-[0_20px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.2)] text-slate-100 p-6 sm:p-7 overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing cyber aura */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {canDismiss && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition z-10"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-white/10 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold tracking-wider uppercase border border-amber-500/30">
                15-Day Limit Reached
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Day {graceInfo.daysActive} of 15
              </span>
            </div>
            <h2 className="text-xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              Identity Verification Required to Trade
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unverified accounts can only be accessed for 15 days. Submit your details below to immediately unlock escrow deals, hiring, and trading with other users.
            </p>
          </div>
        </div>

        {/* Success Screen if just submitted */}
        {successSubmitted ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Verification Information Submitted!</h3>
              <p className="text-xs text-emerald-300 max-w-sm mx-auto">
                Your verification documents have been received into the queue. Trading with other creators and editors has been unlocked!
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Escrow & Deal Functions Online</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4 relative z-10">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Field: Full Legal Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Legal Name (Matching Govt ID) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Kabir Verma"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition"
                />
              </div>
            </div>

            {/* Field: Govt ID Type & ID Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  ID Type <span className="text-amber-400">*</span>
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition cursor-pointer"
                >
                  <option value="Aadhaar Card" className="bg-[#141822] text-white">Aadhaar Card</option>
                  <option value="PAN Card" className="bg-[#141822] text-white">PAN Card</option>
                  <option value="Passport" className="bg-[#141822] text-white">Passport</option>
                  <option value="Voter ID" className="bg-[#141822] text-white">Voter ID</option>
                  <option value="Driver License" className="bg-[#141822] text-white">Driver's License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  ID Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={idType === 'Aadhaar Card' ? '1234 5678 9012' : 'ABCDE1234F'}
                  className="w-full px-3.5 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition uppercase"
                />
              </div>
            </div>

            {/* Field: Payout UPI or Bank Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Payout UPI / Bank A/C
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="user@okhdfcbank or A/C"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  IFSC / Bank Code
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    placeholder="HDFC0001234"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload Button */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                ID Document Proof (Optional)
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-dashed border-white/15">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300 truncate flex-1">
                  {uploadedDocName || 'Upload photo or PDF of your document'}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  <span>{uploadedDocName ? 'Change' : 'Select'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.99] text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Verification...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Submit Verification & Unlock Trading</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
