import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Star, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  ArrowRight, 
  ExternalLink, 
  Lock, 
  X, 
  FileCheck, 
  Check, 
  Zap, 
  QrCode, 
  Smartphone, 
  Globe, 
  DollarSign, 
  ChevronRight,
  UserCheck,
  Award,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface TransactionItem {
  id: string;
  dealId: string;
  date: string;
  counterpartName: string;
  counterpartRole: string;
  amount: number;
  status: 'Completed' | 'Escrow Released' | 'Disputed' | 'Secured in Escrow';
  rating?: number;
}

interface ProfileVerificationDashboardProps {
  currentUser?: UserProfile;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  onOpenAuthGate?: () => void;
  onOpenEditModal?: () => void;
}

export const ProfileVerificationDashboard: React.FC<ProfileVerificationDashboardProps> = ({
  currentUser,
  onUpdateProfile,
  onOpenAuthGate,
  onOpenEditModal,
}) => {
  // 1. HERO PROFILE STATE
  const [fullName, setFullName] = useState(currentUser?.name || 'Kabir Verma');
  const [username, setUsername] = useState(currentUser?.username || 'kabir_vfx');
  const [email, setEmail] = useState(currentUser?.email || 'kabir.vfx@verilance.io');
  const [recoveryEmail, setRecoveryEmail] = useState(currentUser?.recoveryEmail || 'kabir.recovery@gmail.com');
  const [role, setRole] = useState<UserRole>(currentUser?.role || 'editor'); // 'editor' vs 'creator'
  const [isVerifiedPro, setIsVerifiedPro] = useState(currentUser?.hasVerifiedBadge ?? false);
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified'>(currentUser?.kycStatus || 'verified');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');

  // Keep state synced with currentUser if it changes
  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name);
      if (currentUser.username) setUsername(currentUser.username);
      setEmail(currentUser.email);
      if (currentUser.recoveryEmail) setRecoveryEmail(currentUser.recoveryEmail);
      setRole(currentUser.role);
      setIsVerifiedPro(currentUser.hasVerifiedBadge);
      setKycStatus(currentUser.kycStatus);
      setAvatarUrl(currentUser.avatar);
    }
  }, [currentUser]);

  // 2. PERSONAL MEMORANDA (Verification Form) STATE
  const [legalName, setLegalName] = useState('Kabir Verma');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [portfolioLink, setPortfolioLink] = useState('https://youtube.com/@kabiredits_official');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [verificationSubmittedDate, setVerificationSubmittedDate] = useState<string | null>(null);

  // 3. CHECKOUT MODAL STATE
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'paypal'>('upi');
  const [upiId, setUpiId] = useState('kabir@oksbi');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4291');
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  // 4. TRANSACTION HISTORY TABLE DATA
  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: 'tx-1',
      dealId: 'TRW-849201',
      date: '18 Sep 2026',
      counterpartName: 'Aarav Sharma',
      counterpartRole: 'Content Creator',
      amount: 2000,
      status: 'Escrow Released',
      rating: 5.0,
    },
    {
      id: 'tx-2',
      dealId: 'TRW-729104',
      date: '12 Sep 2026',
      counterpartName: 'TechVision Studios',
      counterpartRole: 'Production Agency',
      amount: 14500,
      status: 'Completed',
      rating: 4.9,
    },
    {
      id: 'tx-3',
      dealId: 'TRW-619420',
      date: '29 Aug 2026',
      counterpartName: 'NeonVerse Editing Crew',
      counterpartRole: 'Creator Collective',
      amount: 8000,
      status: 'Escrow Released',
      rating: 5.0,
    },
    {
      id: 'tx-4',
      dealId: 'TRW-504192',
      date: '15 Aug 2026',
      counterpartName: 'Priya Creative Media',
      counterpartRole: 'Channel Manager',
      amount: 22000,
      status: 'Completed',
      rating: 4.8,
    },
    {
      id: 'tx-5',
      dealId: 'TRW-482019',
      date: '02 Aug 2026',
      counterpartName: 'Devansh Motovlogs',
      counterpartRole: 'YouTuber',
      amount: 4500,
      status: 'Disputed',
      rating: 4.2,
    },
  ]);

  const [tableFilter, setTableFilter] = useState<'all' | 'Completed' | 'Escrow Released' | 'Disputed'>('all');

  // Handlers
  const handleToggleRole = () => {
    setRole((prev) => (prev === 'editor' ? 'creator' : 'editor'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFileName) {
      setUploadedFileName('Aadhaar_Govt_Issued_National_Card.pdf');
      setUploadedFileSize('1.84 MB');
    }
    setKycStatus('pending');
    setVerificationSubmittedDate(new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }));
  };

  const handleSimulatePaymentSuccess = () => {
    setIsVerifiedPro(true);
    setIsCheckoutOpen(false);
    setShowCelebrationBanner(true);
    setTimeout(() => setShowCelebrationBanner(false), 5000);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (tableFilter === 'all') return true;
    return tx.status === tableFilter;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 bg-[#0A0B10] text-slate-100 min-h-screen">
      {/* Toast Notification when Verified Pro activated */}
      {showCelebrationBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 via-purple-900/60 to-indigo-900/60 border border-purple-500/50 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                🎉 Verified Pro Status Activated!
              </p>
              <p className="text-xs text-purple-200">
                Permanent Blue/Purple gradient Trust Shield applied to your profile. Valid for 3 months.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCelebrationBanner(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HERO PROFILE SECTION */}
      <section 
        id="hero-profile-section"
        className="rounded-3xl bg-[#121216] border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar Placeholder with Status Ring */}
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-white/10 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-[#121216]" />
            </div>

            {/* Name, Verified Badge Space, Email & Rating */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                  {fullName}
                </h1>

                {/* Unique Profile Username Pill */}
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1">
                  <span>@{username}</span>
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                </span>

                {/* VISIBLE SPACE FOR VERIFIED PRO BADGE (Greyed out until verified) */}
                {isVerifiedPro ? (
                  <span 
                    id="hero-verified-pro-badge"
                    className="px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-white text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-400/40 animate-pulse-subtle"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                    <span>VERIFIED PRO</span>
                  </span>
                ) : (
                  <span 
                    id="hero-unverified-pro-badge-placeholder"
                    className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-500 text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5"
                    title="Unlock Verified Pro Status via Subscription"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Not Verified (Pro Available)</span>
                  </span>
                )}
              </div>

              {/* Email & Secondary Recovery Email Details */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span>{email}</span>
                </span>
                {recoveryEmail && (
                  <span className="flex items-center gap-1 text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    <span className="text-slate-500">Recovery:</span>
                    <span className="text-slate-300">{recoveryEmail}</span>
                  </span>
                )}
                {onOpenEditModal && (
                  <button
                    onClick={onOpenEditModal}
                    className="text-cyan-400 hover:text-cyan-300 underline font-sans text-xs"
                  >
                    Edit Info
                  </button>
                )}
              </div>

              {/* Star Rating Display Component */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>⭐ 4.9 (24 Deals Completed)</span>
                </div>

                {/* KYC Verification State Pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${
                    kycStatus === 'verified'
                      ? 'bg-emerald-400'
                      : kycStatus === 'pending'
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-amber-400'
                  }`} />
                  <span>
                    KYC:{' '}
                    {kycStatus === 'verified'
                      ? 'Approved'
                      : kycStatus === 'pending'
                      ? 'Pending Manual Review'
                      : 'Not Submitted'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Badge & Quick Switcher */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            {/* Dynamic Prominent Role Badge */}
            <div 
              id="hero-prominent-role-badge"
              className={`px-4 py-2.5 rounded-2xl border text-sm font-bold tracking-wide flex items-center gap-2.5 shadow-lg ${
                role === 'editor'
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-teal-500/5'
                  : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-cyan-500/5'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${role === 'editor' ? 'bg-teal-400' : 'bg-cyan-400'} animate-pulse`} />
              <span>
                {role === 'editor' ? 'Role: Video Editor' : 'Role: Content Creator'}
              </span>
            </div>

            {/* Quick Interactive Role Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-hero-role"
                onClick={handleToggleRole}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
                title="Switch active role between Video Editor and Content Creator"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Switch to {role === 'editor' ? 'Content Creator' : 'Video Editor'}</span>
              </button>

              {onOpenAuthGate && (
                <button
                  id="btn-switch-account-profile"
                  onClick={onOpenAuthGate}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-300 transition flex items-center gap-1"
                  title="Switch Account or Sign Out"
                >
                  <span>Switch User</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GRID LAYOUT FOR SECTION 2, 3 & VAKRA AI ADVISOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 2. PERSONAL MEMORANDA (Verification Form Card) - 7 cols */}
        <section 
          id="personal-memoranda-card"
          className="lg:col-span-7 rounded-3xl bg-[#121216] border border-white/[0.08] p-6 sm:p-7 shadow-xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight font-['Space_Grotesk']">
                  Personal Memoranda
                </h2>
                <p className="text-xs text-slate-400">
                  Mandatory Anti-Scam Identity Verification
                </p>
              </div>
            </div>

            {/* Live Status Pill */}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              kycStatus === 'pending'
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse'
                : kycStatus === 'verified'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-white/[0.04] border-white/10 text-slate-400'
            }`}>
              {kycStatus === 'pending'
                ? '⏳ Verification Pending Manual Review'
                : kycStatus === 'verified'
                ? '✅ Identity Verified'
                : 'Action Required'}
            </span>
          </div>

          <form onSubmit={handleSubmitVerification} className="space-y-5">
            {/* Field 1: Full Legal Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Full Legal Name <span className="text-cyan-400">*</span>
              </label>
              <input
                id="input-legal-name"
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="As per Government Identification Document"
                className="w-full bg-[#0e0e13] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition"
              />
            </div>

            {/* Field 2: Government ID Type Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Government ID Type <span className="text-cyan-400">*</span>
              </label>
              <select
                id="select-id-type"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full bg-[#0e0e13] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition"
              >
                <option value="Aadhaar Card">Aadhaar Card (UIDAI Verified)</option>
                <option value="PAN Card">PAN Card (NSDL Verified)</option>
                <option value="Passport">Passport (International Travel ID)</option>
              </select>
            </div>

            {/* Field 3: Stylized Drag & Drop or Click to Upload ID file zone box */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Upload Government ID Document <span className="text-cyan-400">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : uploadedFileName
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-white/15 bg-[#0e0e13] hover:border-white/30 hover:bg-[#121217]'
                }`}
              >
                <input
                  id="id-file-upload-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    uploadedFileName
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.06] text-slate-400'
                  }`}>
                    {uploadedFileName ? <FileCheck className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      {uploadedFileName ? uploadedFileName : 'Drag & Drop or Click to Upload ID'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {uploadedFileSize ? `File Size: ${uploadedFileSize} • Uploaded & Stored Securely` : 'Supported formats: PDF, PNG, JPG (Max 15MB)'}
                    </p>
                  </div>

                  {!uploadedFileName && (
                    <span className="mt-1 text-[11px] font-semibold px-3 py-1 rounded-lg bg-white/[0.08] text-cyan-300">
                      Browse Files
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Field 4: Portfolio / Social Media Link */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Portfolio / Social Media Link <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-portfolio-link"
                  type="url"
                  required
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  placeholder="e.g., https://youtube.com/@mychannel or https://behance.net/portfolio"
                  className="w-full bg-[#0e0e13] border border-white/[0.09] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition font-mono text-xs"
                />
              </div>
            </div>

            {/* Submit Verification Data Button (Glow Accent) */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-verification-data"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm tracking-wide shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Submit Verification Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status Feedback Notice */}
            {verificationSubmittedDate && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                  <Clock className="w-4 h-4" />
                  <span>Verification Pending Manual Review</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Submitted on {verificationSubmittedDate}. Trustway compliance team is reviewing the UID/Govt database hash matching your legal name.
                </p>
              </div>
            )}
          </form>
        </section>

        {/* 3. PREMIUM VERIFICATION BADGE SUBSCRIPTION - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <section 
            id="premium-subscription-card"
            className="rounded-3xl bg-gradient-to-b from-[#18152b] via-[#131120] to-[#0e0d16] border border-purple-500/40 p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-6"
          >
            {/* Subtle Cyber Glow effect */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Elite Security Tier Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Elite Security Tier</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Space_Grotesk']">
                Upgrade to Trusted Pro Status
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Guarantee 100% anti-fraud protection, maximum client trust, and priority escrow arbitration.
              </p>
            </div>

            {/* Pricing Display */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                  ₹2,000
                </span>
                <span className="text-xs font-semibold text-purple-300">
                  / every 3 months
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auto-renews every quarter • Cancel anytime with 1-click
              </p>
            </div>

            {/* Features Checklist */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Pro Member Advantages
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Boosted visibility in global searches</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Higher trust rating score</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Dedicated dispute support speed priority</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>100% Escrow chargeback protection shield</span>
                </li>
              </ul>
            </div>

            {/* Purchase Premium Badge Button (Glow Accent) */}
            <div className="pt-2">
              <button
                id="btn-purchase-premium-badge"
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-sm tracking-wide shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Purchase Premium Badge</span>
              </button>
            </div>

            {/* Permanent Active State Badge If Subscribed */}
            {isVerifiedPro && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">Permanent Verified Pro Status Active</span>
                  <span className="text-[11px] text-emerald-400/80">Trust Shield permanently displayed on your hero header.</span>
                </div>
              </div>
            )}
          </section>

          {/* 4. VAKRA AI SIMULATION SIDE ASSISTANT CARD */}
          <div 
            id="vakra-identity-side-assistant"
            className="rounded-3xl bg-[#121216] border border-cyan-500/30 p-5 space-y-3 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  V
                </div>
                <div>
                  <span className="text-xs font-bold text-white">VAKRA AI Sentinel</span>
                  <span className="text-[10px] text-cyan-400 block font-mono">KYC & Anti-Scam Verification Mode</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="p-3 rounded-xl bg-[#0c0e14] border border-white/[0.06] text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Identity Protection Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All uploaded documents are SHA-256 encrypted before verification hash comparison. Government IDs are never exposed to clients or third parties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TRANSACTION HISTORY & RATING LOGS */}
      <section 
        id="transaction-history-section"
        className="rounded-3xl bg-[#121214] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight font-['Space_Grotesk']">
                Transaction History & Rating Logs
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographic Escrow Ledgers & Peer Verification Records
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#18181b] rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
            {(['all', 'Completed', 'Escrow Released', 'Disputed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTableFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  tableFilter === filter
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'All Transactions' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Minimalist, Clean Transaction Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">Date</th>
                <th className="py-3.5 px-4 font-bold">Deal ID</th>
                <th className="py-3.5 px-4 font-bold">Client / Freelancer</th>
                <th className="py-3.5 px-4 font-bold">Amount (₹)</th>
                <th className="py-3.5 px-4 font-bold">Rating</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTransactions.map((tx) => (
                <tr 
                  key={tx.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Date */}
                  <td className="py-4 px-4 text-slate-300 font-mono whitespace-nowrap">
                    {tx.date}
                  </td>

                  {/* Deal ID */}
                  <td className="py-4 px-4 font-mono font-semibold text-cyan-400 whitespace-nowrap">
                    #{tx.dealId}
                  </td>

                  {/* Client / Freelancer Name */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-white text-xs">
                      {tx.counterpartName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {tx.counterpartRole}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4 font-bold text-white text-xs font-mono whitespace-nowrap">
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </td>

                  {/* Rating */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{tx.rating}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      tx.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : tx.status === 'Escrow Released'
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : tx.status === 'Disputed'
                        ? 'bg-red-500/10 text-red-300 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        tx.status === 'Completed'
                          ? 'bg-emerald-400'
                          : tx.status === 'Escrow Released'
                          ? 'bg-cyan-400'
                          : tx.status === 'Disputed'
                          ? 'bg-red-400'
                          : 'bg-amber-400'
                      }`} />
                      <span>{tx.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. SIMULATED CHECKOUT OVERLAY MODAL (UPI, CARDS, PAYPAL) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div 
            id="checkout-overlay-card"
            className="relative w-full max-w-md bg-[#101013] border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8 space-y-6"
          >
            {/* Close Button */}
            <button
              id="btn-close-checkout"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  Subscribe to Verified Pro
                </h3>
                <p className="text-xs text-purple-300">
                  ₹2,000 / every 3 months • Instant Shield Unlock
                </p>
              </div>
            </div>

            {/* Payment Method Selector (UPI, Cards, PayPal) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Select Multi-Channel Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="checkout-method-upi"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'upi'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                      : 'bg-[#18181c] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  id="checkout-method-card"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                      : 'bg-[#18181c] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Credit / Debit</span>
                </button>

                <button
                  type="button"
                  id="checkout-method-paypal"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'paypal'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                      : 'bg-[#18181c] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>PayPal</span>
                </button>
              </div>
            </div>

            {/* Form Fields based on Payment Method */}
            {paymentMethod === 'upi' && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#16161a] border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Virtual Payment Address (VPA)</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Verified
                  </span>
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400">
                  Instant webhook will verify transaction and apply the Blue/Purple gradient Verified Pro badge to your account.
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#16161a] border border-white/5 text-xs">
                <label className="text-slate-400 block">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    defaultValue="12/29"
                    className="bg-[#1e1e24] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-center font-mono"
                  />
                  <input
                    type="text"
                    defaultValue="•••"
                    className="bg-[#1e1e24] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-center font-mono"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="p-3.5 rounded-2xl bg-[#16161a] border border-white/5 text-xs text-slate-300 space-y-1 text-center">
                <p className="font-semibold text-white">Global Express PayPal Gateway</p>
                <p className="text-[11px] text-slate-400">
                  One-click sandbox authorization mapped to ₹2,000 INR conversion.
                </p>
              </div>
            )}

            {/* Total Summary */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Subscription Fee:</span>
              <span className="text-base font-extrabold text-white font-mono">
                ₹2,000.00
              </span>
            </div>

            {/* Simulate Success Button */}
            <button
              type="button"
              id="btn-simulate-payment-success"
              onClick={handleSimulatePaymentSuccess}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simulate Success & Unlock Badge</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
