import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  X, 
  Video, 
  Film, 
  Lock, 
  ArrowRight,
  FileCheck,
  AlertCircle,
  Loader2,
  Check,
  Mail,
  User,
  AtSign
} from 'lucide-react';

const TAKEN_USERNAMES = new Set([
  'john_doe',
  'kabir_vfx',
  'aarav_tech',
  'rohit_visuals',
  'priya_films',
  'verilance',
  'admin',
  'vakra_ai',
  'supereditor',
  'creator_hub'
]);

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username || 'kabir_vfx');
  const [recoveryEmail, setRecoveryEmail] = useState(user.recoveryEmail || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('available');
  const [usernameFeedback, setUsernameFeedback] = useState('');
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole>(user.role);
  const [idDocName, setIdDocName] = useState<string | null>(user.idDocumentName || 'Aadhaar_Govt_Card_Verified.pdf');
  const [isUploading, setIsUploading] = useState(false);
  const [hasPurchasedBadge, setHasPurchasedBadge] = useState(user.hasVerifiedBadge);
  const [badgeSuccessMessage, setBadgeSuccessMessage] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Live availability checker
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      setSuggestedUsernames([]);
      return;
    }

    const validRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!validRegex.test(trimmed)) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Must be 3-20 characters (alphanumeric and _ only)');
      setSuggestedUsernames([]);
      return;
    }

    setUsernameStatus('checking');
    setUsernameFeedback('Checking username availability...');

    const timer = setTimeout(() => {
      if (TAKEN_USERNAMES.has(trimmed) && trimmed !== user.username?.toLowerCase()) {
        setUsernameStatus('taken');
        setUsernameFeedback('Username already taken, please choose another');
        setSuggestedUsernames([`${trimmed}_pro`, `${trimmed}_vfx`, `real_${trimmed}`].filter(u => !TAKEN_USERNAMES.has(u)));
      } else {
        setUsernameStatus('available');
        setUsernameFeedback(`@${trimmed} is available!`);
        setSuggestedUsernames([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, user.username]);

  if (!isOpen) return null;

  const handleSimulateIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setTimeout(() => {
        setIdDocName(e.target.files![0].name);
        setIsUploading(false);
      }, 700);
    }
  };

  const handleSimulateBadgePurchase = () => {
    setHasPurchasedBadge(true);
    setBadgeSuccessMessage(true);
    setTimeout(() => setBadgeSuccessMessage(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      return;
    }

    if (recoveryEmail.trim() && recoveryEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
      setRecoveryError('Recovery email must be different from primary email');
      return;
    }

    onSaveProfile({
      name,
      username: username.trim().toLowerCase(),
      email,
      recoveryEmail: recoveryEmail.trim() || undefined,
      role,
      idDocumentName: idDocName,
      hasVerifiedBadge: hasPurchasedBadge,
      kycStatus: idDocName ? 'verified' : 'pending',
      badgeExpiresAt: hasPurchasedBadge ? '2026-12-19' : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="onboarding-modal-card"
        className="relative w-full max-w-2xl bg-[#101318] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8"
      >
        {/* Close Button */}
        <button 
          id="btn-close-onboarding"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                Aesthetic Profile & KYC
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                Personal Memoranda
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Strict anti-scam authentication with unique profile names, recovery channels, and verified escrow badges.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Legal Name <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-onboarding-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Kabir Verma"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#161a22] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Primary Email Address <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-onboarding-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., kabir@youtubecreators.in"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#161a22] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition"
                />
              </div>
            </div>
          </div>

          {/* Unique Username & Recovery Email System */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unique Profile Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Unique Profile Username <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">@</span>
                <input
                  id="input-onboarding-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className={`w-full pl-8 pr-9 py-2.5 bg-[#161a22] border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                    usernameStatus === 'available'
                      ? 'border-emerald-500/60 focus:ring-emerald-500/50'
                      : usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'border-red-500/60 focus:ring-red-500/50'
                      : 'border-white/10 focus:border-cyan-500/60'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
                  {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {usernameStatus === 'taken' && <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>

              {usernameFeedback && (
                <p className={`text-[11px] mt-1 font-medium ${
                  usernameStatus === 'available' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {usernameFeedback}
                </p>
              )}

              {suggestedUsernames.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400">Available:</span>
                  {suggestedUsernames.map(alt => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => setUsername(alt)}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 text-cyan-300 font-mono"
                    >
                      @{alt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recovery Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Secondary / Recovery Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-onboarding-recovery-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => {
                    setRecoveryEmail(e.target.value);
                    setRecoveryError(null);
                  }}
                  placeholder="backup.recovery@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#161a22] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition"
                />
              </div>
              {recoveryError ? (
                <p className="text-[11px] text-red-400 mt-1">{recoveryError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Used for emergency escrow freeze & OTPs</p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Explicit Role <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="role-creator-btn"
                onClick={() => setRole('creator')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 ${
                  role === 'creator'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/5'
                    : 'bg-[#151921] border-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${role === 'creator' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    Content Creator / Client
                    {role === 'creator' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Paying client funding video edits, locking escrow deposits safely, and approving finished cuts.
                  </p>
                </div>
              </button>

              <button
                type="button"
                id="role-editor-btn"
                onClick={() => setRole('editor')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 ${
                  role === 'editor'
                    ? 'bg-teal-500/10 border-teal-500/50 text-white shadow-lg shadow-teal-500/5'
                    : 'bg-[#151921] border-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${role === 'editor' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-slate-400'}`}>
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    Video Editor / Freelancer
                    {role === 'editor' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Receives guaranteed escrow payouts, submits watermarked drafts, and downloads final release funds.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Government ID Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Government ID Verification (Aadhaar / PAN Placeholder) <span className="text-cyan-400">*</span>
            </label>
            <div className="relative border border-dashed border-white/15 rounded-xl p-3.5 bg-[#141820]/70 hover:bg-[#141820] transition flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                  {idDocName ? <FileCheck className="w-5 h-5 text-teal-400" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">
                    {idDocName ? idDocName : 'Upload Aadhaar Card / PAN Card (PDF/PNG)'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {idDocName ? '✅ Verification Passed — Anti-Fraud Hash Matched' : 'Max 10MB • End-to-end encrypted'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label 
                  htmlFor="id-upload-input-modal" 
                  className="cursor-pointer text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Validating...' : idDocName ? 'Replace Document' : 'Select ID File'}
                </label>
                <input
                  id="id-upload-input-modal"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleSimulateIdUpload}
                />
              </div>
            </div>
          </div>

          {/* Premium Verification Badge Card */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#131728] via-[#101420] to-[#17122b] p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[11px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    Premium Trust Badge
                  </div>
                  <span className="text-xs text-indigo-300 font-medium">₹2,000 / 3 Months</span>
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Gold-Tier Verified Escrow Protection
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Permanent Blue/Purple gradient Trust Shield on your profile, zero-fee fast dispute triage, and 100% anti-chargeback guarantee.
                </p>
              </div>

              <button
                type="button"
                id="btn-purchase-badge"
                onClick={handleSimulateBadgePurchase}
                className={`px-4 py-2.5 rounded-xl font-medium text-xs tracking-wide transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${
                  hasPurchasedBadge
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-white text-black hover:bg-slate-200'
                }`}
              >
                {hasPurchasedBadge ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    Badge Activated
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Activate for ₹2,000 / 3 mo
                  </>
                )}
              </button>
            </div>

            {badgeSuccessMessage && (
              <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Simulated payment received via UPI Escrow: Blue/Purple Trust Badge permanently attached to your profile!</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              id="btn-complete-onboarding"
              disabled={usernameStatus === 'taken' || usernameStatus === 'invalid'}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>Save & Update Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
