import React, { useState, useRef } from 'react';
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
  Filter,
  Camera,
  Building,
  RefreshCw,
  XCircle,
  Eye,
  Crown,
  Film,
  Sliders
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { subscribeDeals } from '../lib/firebase';
import { GalleryPermissionModal } from './GalleryPermissionModal';
import { isMobileDevice, hasGalleryAccess } from '../lib/galleryPermission';
import { DEFAULT_AVATARS, getAvatarUrl } from '../lib/defaultAvatars';
import { soundEffects } from '../lib/soundEffects';
import { AdminBadge } from './AdminBadge';
import { isRootOwner, isUserAdmin } from '../lib/adminSecurity';
import { EditingAppsSelector } from './EditingAppsSelector';
import { getGracePeriodInfo, setSimulatedDayOverride, GRACE_PERIOD_DAYS } from '../lib/kycGracePeriod';

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
  onResetData?: () => void;
  onOpenAdminPanel?: () => void;
}

export const ProfileVerificationDashboard: React.FC<ProfileVerificationDashboardProps> = ({
  currentUser,
  onUpdateProfile,
  onOpenAuthGate,
  onOpenEditModal,
  onResetData,
  onOpenAdminPanel,
}) => {
  // 1. HERO PROFILE STATE (Dynamic from real user)
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [recoveryEmail, setRecoveryEmail] = useState(currentUser?.recoveryEmail || '');
  const [role, setRole] = useState<UserRole>(currentUser?.role || 'editor'); // 'editor' vs 'creator'
  const [editingApps, setEditingApps] = useState<string[]>(
    currentUser?.editingApps && currentUser.editingApps.length > 0
      ? currentUser.editingApps
      : ['Adobe Premiere Pro', 'Adobe After Effects', 'DaVinci Resolve']
  );
  const [isVerifiedPro, setIsVerifiedPro] = useState(currentUser?.hasVerifiedBadge ?? false);
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>(currentUser?.kycStatus || 'unverified');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || DEFAULT_AVATARS[0].svgDataUri);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateEditingApps = (newApps: string[]) => {
    setEditingApps(newApps);
    if (onUpdateProfile) {
      onUpdateProfile({ editingApps: newApps });
    }
  };

  const handleSelectDefaultAvatar = (svgUri: string) => {
    soundEffects.playSubTabClick();
    setAvatarUrl(svgUri);
    if (onUpdateProfile) {
      onUpdateProfile({ avatar: svgUri });
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newUri = event.target.result as string;
          setAvatarUrl(newUri);
          if (onUpdateProfile) {
            onUpdateProfile({ avatar: newUri });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Keep state synced with currentUser if it changes
  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      if (currentUser.username) setUsername(currentUser.username);
      setEmail(currentUser.email || '');
      if (currentUser.recoveryEmail) setRecoveryEmail(currentUser.recoveryEmail);
      setRole(currentUser.role || 'editor');
      if (currentUser.editingApps && currentUser.editingApps.length > 0) {
        setEditingApps(currentUser.editingApps);
      }
      setIsVerifiedPro(currentUser.hasVerifiedBadge ?? false);
      setKycStatus(currentUser.kycStatus || 'unverified');
      if (currentUser.avatar) setAvatarUrl(currentUser.avatar);
      if (currentUser.name) setLegalName(currentUser.name);
    }
  }, [currentUser]);

  // 2. PERSONAL MEMORANDA & KYC ONBOARDING STATE
  const [legalName, setLegalName] = useState(currentUser?.kycData?.legalName || currentUser?.name || '');
  const [idType, setIdType] = useState(currentUser?.kycData?.idType || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(currentUser?.kycData?.idNumber || '');
  const [docFrontName, setDocFrontName] = useState<string | null>(currentUser?.kycData?.docFrontPreview ? 'id_document_front.jpg' : null);
  const [docBackName, setDocBackName] = useState<string | null>(currentUser?.kycData?.docBackPreview ? 'id_document_back.jpg' : null);
  const [selfieName, setSelfieName] = useState<string | null>(currentUser?.kycData?.selfiePreview ? 'live_selfie.jpg' : null);
  const [bankAccount, setBankAccount] = useState(currentUser?.kycData?.bankAccount || '');
  const [bankHolderName, setBankHolderName] = useState(currentUser?.kycData?.bankHolderName || currentUser?.name || '');
  const [bankIfsc, setBankIfsc] = useState(currentUser?.kycData?.bankIfsc || '');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(currentUser?.idDocumentName || null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [verificationSubmittedDate, setVerificationSubmittedDate] = useState<string | null>(currentUser?.kycData?.submittedAt || null);
  const [kycError, setKycError] = useState<string | null>(null);

  // 3. CHECKOUT MODAL STATE
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'paypal'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  // 4. TRANSACTION HISTORY TABLE DATA (Dynamic from Firestore)
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // Subscribe to real deals from Firestore
  React.useEffect(() => {
    const unsubscribe = subscribeDeals((liveDeals) => {
      const txs: TransactionItem[] = liveDeals.map((d) => {
        let statusDisplay: TransactionItem['status'] = 'Secured in Escrow';
        if (d.status === 'released') statusDisplay = 'Escrow Released';
        else if (d.status === 'disputed') statusDisplay = 'Disputed';
        else if (d.status === 'work_submitted') statusDisplay = 'Completed';

        const isUserSender = currentUser?.name === d.senderName;
        const counterpartName = isUserSender ? d.receiverName : d.senderName;
        const counterpartRole = isUserSender ? 'Receiver / Freelancer' : 'Payer / Client';

        return {
          id: d.id,
          dealId: d.id,
          date: d.createdAt 
            ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : 'Recently',
          counterpartName: counterpartName || 'Escrow Partner',
          counterpartRole: counterpartRole,
          amount: d.amount,
          status: statusDisplay,
          rating: 5.0,
        };
      });
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [tableFilter, setTableFilter] = useState<'all' | 'Completed' | 'Escrow Released' | 'Disputed'>('all');

  // File and Camera Upload Refs for KYC
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFrontInputRef = useRef<HTMLInputElement>(null);
  const docBackInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryPermModalOpen, setIsGalleryPermModalOpen] = useState(false);

  const handleTriggerUpload = () => {
    if (isMobileDevice() && !hasGalleryAccess()) {
      setIsGalleryPermModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleGalleryPermGranted = () => {
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 150);
  };

  // Handlers
  const handleToggleRole = () => {
    soundEffects.playToggleSound();
    setRole((prev) => (prev === 'editor' ? 'creator' : 'editor'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      if (!docFrontName) setDocFrontName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      if (!docFrontName) setDocFrontName(file.name);
    }
  };

  const handleDocFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocFrontName(e.target.files[0].name);
    }
  };

  const handleDocBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocBackName(e.target.files[0].name);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelfieName(e.target.files[0].name);
    }
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setKycError(null);

    // Validation for ID Number format
    const trimmedId = idNumber.trim().toUpperCase();
    if (idType === 'Aadhaar Card') {
      const cleanAadhaar = trimmedId.replace(/[\s-]/g, '');
      if (cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
        setKycError('Invalid Aadhaar Number: Must be exactly 12 numeric digits.');
        return;
      }
    } else if (idType === 'PAN Card') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(trimmedId)) {
        setKycError('Invalid PAN Format: Must follow standard 10-char format (e.g. ABCDE1234F).');
        return;
      }
    } else if (idType === 'Passport') {
      if (trimmedId.length < 8) {
        setKycError('Invalid Passport Number: Must contain at least 8 alphanumeric characters.');
        return;
      }
    }

    if (bankIfsc) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(bankIfsc.trim().toUpperCase())) {
        setKycError('Invalid IFSC Code: Format must be 11 characters (e.g. HDFC0001234).');
        return;
      }
    }

    soundEffects.playNotificationSound();
    if (!uploadedFileName && !docFrontName) {
      setUploadedFileName(`${idType.replace(/\s+/g, '_')}_Verified_Doc.pdf`);
      setUploadedFileSize('2.15 MB');
    }

    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setKycStatus('pending');
    setVerificationSubmittedDate(timestamp);

    if (onUpdateProfile) {
      onUpdateProfile({
        kycStatus: 'pending',
        idDocumentName: uploadedFileName || docFrontName || 'Govt_ID_Document.pdf',
        kycData: {
          legalName,
          idType,
          idNumber: trimmedId,
          docFrontPreview: docFrontName || 'Front_Proof.jpg',
          docBackPreview: docBackName || 'Back_Proof.jpg',
          selfiePreview: selfieName || 'Live_Selfie.jpg',
          bankAccount,
          bankHolderName,
          bankIfsc: bankIfsc.toUpperCase(),
          submittedAt: timestamp,
        }
      });
    }
  };

  const handleSimulateKycApproval = () => {
    soundEffects.playNotificationSound();
    setKycStatus('verified');
    if (onUpdateProfile) {
      onUpdateProfile({
        kycStatus: 'verified',
        hasVerifiedBadge: true,
      });
    }
  };

  const handleSimulateKycRejection = () => {
    soundEffects.playToggleSound();
    setKycStatus('rejected');
    if (onUpdateProfile) {
      onUpdateProfile({
        kycStatus: 'rejected',
        kycData: {
          rejectionReason: 'Document image was blurry or mismatched legal name with govt database hash.',
        }
      });
    }
  };

  const handleSimulatePaymentSuccess = () => {
    soundEffects.playNotificationSound();
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
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar Preview with Status Ring & 3 Minimal Dark Eye Options */}
            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-white/10 shadow-xl bg-black"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 ring-4 ring-[#121216]" />
              </div>

              {/* 3 Minimal Dark-Aesthetic Eye Avatars Quick-Switch */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10" title="Switch default minimal dark eye avatar">
                {DEFAULT_AVATARS.map((av, idx) => {
                  const isCurrent = avatarUrl === av.svgDataUri || avatarUrl === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectDefaultAvatar(av.svgDataUri)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border p-0.5 transition bg-black ${
                        isCurrent ? 'border-cyan-400 ring-1 ring-cyan-400 scale-105' : 'border-white/20 hover:border-white/40'
                      }`}
                      title={`${av.name} (${av.subtitle})`}
                    >
                      <img src={av.svgDataUri} alt={av.name} className="w-full h-full object-contain" />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
                  title="Upload custom profile picture"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                </button>
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomAvatarUpload}
                />
              </div>
            </div>

            {/* Name, Verified Badge Space, Email & Rating */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Space_Grotesk']">
                  {fullName}
                </h1>

                {/* Authority Tier Badge distinguishing Root Owner from Delegated Admins */}
                <AdminBadge user={currentUser} size="md" showDetails />

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
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                  kycStatus === 'verified'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : kycStatus === 'pending'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
                    : kycStatus === 'rejected'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-white/[0.04] border-white/10 text-slate-400'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${
                    kycStatus === 'verified' ? 'text-emerald-400' : kycStatus === 'pending' ? 'text-amber-400' : kycStatus === 'rejected' ? 'text-rose-400' : 'text-slate-500'
                  }`} />
                  <span>
                    KYC:{' '}
                    {kycStatus === 'verified'
                      ? 'Verified ✓'
                      : kycStatus === 'pending'
                      ? 'Pending Verification'
                      : kycStatus === 'rejected'
                      ? 'Rejected'
                      : 'Not Verified'}
                  </span>
                </div>
              </div>

              {/* Editing Apps Used (Shown ONLY if role is editor) */}
              {role === 'editor' && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] font-mono text-teal-400 font-bold flex items-center gap-1">
                    <Film className="w-3 h-3 text-teal-400" />
                    <span>Editing Software:</span>
                  </span>
                  {editingApps.length > 0 ? (
                    editingApps.map((app) => (
                      <span
                        key={app}
                        className="px-2 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[11px] font-mono font-medium shadow-sm"
                      >
                        {app}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No editing software selected</span>
                  )}
                </div>
              )}
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

            {/* Quick Interactive Role Toggle Button & Admin Access */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {(isRootOwner(currentUser?.email) || isUserAdmin(currentUser)) && onOpenAdminPanel && (
                <button
                  id="btn-open-admin-hud-profile"
                  onClick={() => {
                    soundEffects.playTabClick();
                    onOpenAdminPanel();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/40 text-xs font-bold text-amber-200 transition flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                  title="Open Admin Delegation HUD & Role Controls"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin HUD</span>
                </button>
              )}

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

              {onResetData && (
                <button
                  id="btn-reset-data-profile"
                  onClick={onResetData}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-300 transition flex items-center gap-1"
                  title="Reset all data and storage for a clean fresh slate"
                >
                  <span>Reset All Data</span>
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
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                kycStatus === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
                  : kycStatus === 'verified'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : kycStatus === 'rejected'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-white/[0.04] border-white/10 text-slate-400'
              }`}>
                {kycStatus === 'pending'
                  ? '⏳ Verification Pending Review'
                  : kycStatus === 'verified'
                  ? '🛡️ KYC Verified'
                  : kycStatus === 'rejected'
                  ? '❌ Verification Rejected'
                  : '⚠️ Unverified'}
              </span>
            </div>
          </div>

          {/* KYC Status Banner & Fast-Track Controls */}
          {(() => {
            const graceInfo = getGracePeriodInfo(currentUser);
            if (graceInfo.hasFilledVerification) return null;
            return (
              <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                graceInfo.isGracePeriodExpired
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-[#151c2c] border-cyan-500/40 text-cyan-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${graceInfo.isGracePeriodExpired ? 'text-rose-400' : 'text-cyan-400'}`} />
                    <span className="font-bold text-white">
                      15-Day Unverified Access Grace Window
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase border ${
                    graceInfo.isGracePeriodExpired
                      ? 'bg-rose-500/30 border-rose-400/40 text-rose-200 animate-pulse'
                      : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                  }`}>
                    {graceInfo.isGracePeriodExpired ? '⚠️ EXPIRED (Trading Locked)' : `⏱️ ${graceInfo.daysRemaining} Days Left`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {graceInfo.isGracePeriodExpired ? (
                    <span className="text-rose-300 font-medium">
                      Your account was registered on {graceInfo.formattedCreatedDate} ({graceInfo.daysActive} days ago). Because the 15-day unverified access limit has passed, escrow trading, deals, and payouts are restricted. Submit your verification information below to unlock trading with other users.
                    </span>
                  ) : (
                    <span>
                      Unverified accounts can be accessed for only 15 days from registration ({graceInfo.formattedCreatedDate}). You are currently on <strong>Day {graceInfo.daysActive} of 15</strong>. Complete identity verification below before day 15 to maintain uninterrupted trading access.
                    </span>
                  )}
                </p>
              </div>
            );
          })()}

          {kycStatus === 'verified' && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-emerald-200">KYC Account Verified</p>
                  <p className="text-[11px] text-slate-300">Your legal identity and payout bank account are 100% verified. Escrow releases unlocked.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                ACTIVE TIER 1
              </span>
            </div>
          )}

          {kycStatus === 'rejected' && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">Verification Incomplete or Rejected</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {currentUser?.kycData?.rejectionReason || 'Document details could not be matched. Please ensure all four corners of ID are visible and legal name matches your bank account.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmitVerification} className="space-y-5">
            {/* Field 1: Full Legal Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Full Legal Name (as per Govt ID) <span className="text-cyan-400">*</span>
              </label>
              <input
                id="input-legal-name"
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Arjun Sharma"
                className="w-full bg-[#0e0e13] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition"
              />
            </div>

            {/* Field 2: Government ID Type & Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Government ID Number <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="input-id-number"
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={
                    idType === 'Aadhaar Card'
                      ? '12-digit number (e.g. 5482 1234 9876)'
                      : idType === 'PAN Card'
                      ? '10-char PAN (e.g. ABCDE1234F)'
                      : 'Passport Number'
                  }
                  className="w-full bg-[#0e0e13] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition font-mono"
                />
              </div>
            </div>

            {/* Field 3: Front & Back Document Photo Attachments */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Document Photo Attachments (Front & Back) <span className="text-cyan-400">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Front Photo */}
                <div 
                  onClick={() => docFrontInputRef.current?.click()}
                  className={`p-4 rounded-xl border border-dashed cursor-pointer transition text-center flex flex-col items-center justify-center gap-1.5 ${
                    docFrontName
                      ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200'
                      : 'border-white/15 bg-[#0e0e13] hover:border-white/30 hover:bg-[#141620]'
                  }`}
                >
                  <input
                    ref={docFrontInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocFrontUpload}
                    className="hidden"
                  />
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {docFrontName ? docFrontName : 'Upload Document Front'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {docFrontName ? 'Front captured ✓' : 'JPG, PNG, or PDF'}
                  </span>
                </div>

                {/* Back Photo */}
                <div 
                  onClick={() => docBackInputRef.current?.click()}
                  className={`p-4 rounded-xl border border-dashed cursor-pointer transition text-center flex flex-col items-center justify-center gap-1.5 ${
                    docBackName
                      ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200'
                      : 'border-white/15 bg-[#0e0e13] hover:border-white/30 hover:bg-[#141620]'
                  }`}
                >
                  <input
                    ref={docBackInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocBackUpload}
                    className="hidden"
                  />
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {docBackName ? docBackName : 'Upload Document Back'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {docBackName ? 'Back captured ✓' : 'Address & barcode side'}
                  </span>
                </div>
              </div>
            </div>

            {/* Field 4: Live Selfie / Profile Photo Capture */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Live Selfie / Liveness Proof <span className="text-cyan-400">*</span>
              </label>
              <div 
                onClick={() => selfieInputRef.current?.click()}
                className={`p-4 rounded-xl border border-dashed cursor-pointer transition text-center flex items-center justify-between px-5 ${
                  selfieName
                    ? 'border-teal-500/50 bg-teal-950/20 text-teal-200'
                    : 'border-white/15 bg-[#0e0e13] hover:border-white/30 hover:bg-[#141620]'
                }`}
              >
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">
                      {selfieName ? selfieName : 'Take or Upload Live Selfie'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Must be well-lit face portrait without sunglasses
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/[0.08] text-teal-300">
                  {selfieName ? 'Change Photo' : 'Capture Selfie'}
                </span>
              </div>
            </div>

            {/* Field 5: Bank Account Details for Payout Releases */}
            <div className="p-4 rounded-2xl bg-[#090d14] border border-cyan-500/20 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300">
                <Building className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Bank Account Payout Details (For Escrow Releases)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    placeholder="Legal name on bank passbook"
                    className="w-full bg-[#111724] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 50100293847120"
                    className="w-full bg-[#111724] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-400 text-[11px] block mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    placeholder="e.g. HDFC0001234 or SBIN0000300"
                    className="w-full bg-[#111724] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {kycError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{kycError}</span>
              </div>
            )}

            {/* Submit Verification Data Button (Glow Accent) */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                id="btn-submit-verification-data"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm tracking-wide shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Submit KYC Documents & Payout Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Fast-Track Simulation Tools for Evaluation */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span>Compliance Sandbox Actions:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateKycApproval}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold transition"
                  >
                    Simulate Approve (Verified)
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateKycRejection}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold transition"
                  >
                    Simulate Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Status Feedback Notice */}
            {verificationSubmittedDate && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                  <Clock className="w-4 h-4" />
                  <span>Verification Pending Manual Review</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Submitted on {verificationSubmittedDate}. Trustway compliance team is reviewing the UID/Govt database hash matching your legal name and bank record.
                </p>
              </div>
            )}
          </form>
        </section>

        {/* 3. PREMIUM VERIFICATION BADGE SUBSCRIPTION & EDITOR TOOLING - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Editing Software Suite Card (Shown ONLY if user role is Editor) */}
          {role === 'editor' && (
            <section 
              id="editor-apps-suite-card"
              className="rounded-3xl bg-[#12151e] border border-teal-500/30 p-6 sm:p-7 shadow-xl space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight font-['Space_Grotesk']">
                      Editing Software Suite
                    </h2>
                    <p className="text-xs text-slate-400">
                      What editing apps do you use? (Shown on your profile)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                  Editor
                </span>
              </div>

              <div className="relative z-10">
                <EditingAppsSelector
                  selectedApps={editingApps}
                  onChange={handleUpdateEditingApps}
                  readOnly={false}
                />
              </div>
            </section>
          )}

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
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold block">Permanent Verified Pro Status Active</span>
                  <span className="text-[11px] text-cyan-400/80">Trust Shield permanently displayed on your hero header.</span>
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
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
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
                onClick={() => {
                  soundEffects.playSubTabClick();
                  setTableFilter(filter);
                }}
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Clock className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No escrow transactions recorded yet</p>
                      <p className="text-xs text-slate-500 max-w-md">
                        Once deals are locked and milestones are completed or released on the platform, your cryptographically verified ledger will automatically display them here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
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
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : tx.status === 'Escrow Released'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : tx.status === 'Disputed'
                          ? 'bg-red-500/10 text-red-300 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tx.status === 'Completed'
                            ? 'bg-cyan-400'
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
                ))
              )}
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
                  onClick={() => {
                    soundEffects.playTabClick();
                    setPaymentMethod('upi');
                  }}
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
                  onClick={() => {
                    soundEffects.playTabClick();
                    setPaymentMethod('card');
                  }}
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
                  onClick={() => {
                    soundEffects.playTabClick();
                    setPaymentMethod('paypal');
                  }}
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
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
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

      {/* Mobile Gallery Permission Dialog */}
      <GalleryPermissionModal
        isOpen={isGalleryPermModalOpen}
        onClose={() => setIsGalleryPermModalOpen(false)}
        onPermissionGranted={handleGalleryPermGranted}
        mediaType="document"
        sourceTitle="Government ID Document Upload"
      />
    </div>
  );
};
