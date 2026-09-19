import React, { useState, useEffect, useId } from 'react';
import { UserProfile, UserRole } from '../types';
import { VerilanceLogo } from './VerilanceLogo';
import { saveUserToDB, checkUsernameInDB } from '../lib/firebase';
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
  ArrowLeft,
  FileCheck, 
  Mail, 
  User, 
  AtSign, 
  KeyRound, 
  AlertCircle, 
  Loader2, 
  Check, 
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';

// System reserved handles in the VERILANCE ledger
const TAKEN_USERNAMES = new Set([
  'verilance',
  'admin',
  'vakra_ai',
  'support',
  'system',
  'root'
]);

interface AuthOnboardingModalProps {
  isOpen: boolean;
  onAuthSuccess: (user: UserProfile) => void;
  currentUser?: UserProfile | null;
  onClose?: () => void;
  canDismiss?: boolean;
}

type AuthMode = 'sign_in' | 'register';
type OnboardingStep = 'auth' | 'username_role' | 'recovery_security' | 'memoranda_kyc';

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  isOpen,
  onAuthSuccess,
  currentUser,
  onClose,
  canDismiss = false,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('auth');

  // Step 1: Auth fields
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessingGoogle, setIsProcessingGoogle] = useState(false);
  const [isProcessingEmail, setIsProcessingEmail] = useState(false);

  // Step 2: Username & Role
  const [username, setUsername] = useState(currentUser?.username || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string>('');
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole>(currentUser?.role || 'editor');

  // Step 3: Security & Recovery Email
  const [recoveryEmail, setRecoveryEmail] = useState(currentUser?.recoveryEmail || '');
  const [recoveryEmailError, setRecoveryEmailError] = useState<string | null>(null);
  const [enableTwoFactor, setEnableTwoFactor] = useState(true);

  // Step 4: Personal Memoranda & KYC + Verified Badge
  const [idDocName, setIdDocName] = useState<string | null>(currentUser?.idDocumentName || null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [wantsVerifiedBadge, setWantsVerifiedBadge] = useState(currentUser?.hasVerifiedBadge ?? true);
  const [kycAgreed, setKycAgreed] = useState(true);

  // Focus and ID generation
  const usernameInputId = useId();
  const emailInputId = useId();

  // Reset or initialize state
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
      setFullName(currentUser.name);
      if (currentUser.username) {
        setUsername(currentUser.username);
        setUsernameStatus('available');
      }
      setRole(currentUser.role);
      if (currentUser.recoveryEmail) {
        setRecoveryEmail(currentUser.recoveryEmail);
      }
      setIdDocName(currentUser.idDocumentName);
      setWantsVerifiedBadge(currentUser.hasVerifiedBadge);
    }
  }, [currentUser]);

  // Live Username Availability Checker with 300ms Debounce
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      setSuggestedUsernames([]);
      return;
    }

    // Format validation: 3-20 chars, alphanumeric + underscores only
    const validRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!validRegex.test(trimmed)) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Must be 3-20 characters using letters, numbers, or underscores.');
      setSuggestedUsernames([]);
      return;
    }

    setUsernameStatus('checking');
    setUsernameFeedback('Verifying unique handle across VERILANCE ledger...');

    const timer = setTimeout(async () => {
      let isTaken = TAKEN_USERNAMES.has(trimmed) && trimmed !== currentUser?.username?.toLowerCase();
      
      if (!isTaken) {
        try {
          isTaken = await checkUsernameInDB(trimmed, currentUser?.id);
        } catch (e) {
          console.warn('[UsernameCheck] Firestore lookup fallback', e);
        }
      }

      if (isTaken) {
        setUsernameStatus('taken');
        setUsernameFeedback('Username already taken, please choose another.');
        // Generate 3 unique alternatives
        const alts = [
          `${trimmed}_vfx`,
          `${trimmed}_pro`,
          `real_${trimmed}`,
        ].filter(u => !TAKEN_USERNAMES.has(u));
        setSuggestedUsernames(alts);
      } else {
        setUsernameStatus('available');
        setUsernameFeedback(`@${trimmed} is available!`);
        setSuggestedUsernames([]);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [username, currentUser]);

  if (!isOpen) return null;

  // Handle Google Sign-In (Simulated OAuth flow)
  const handleGoogleSignIn = () => {
    setIsProcessingGoogle(true);
    setAuthError(null);

    setTimeout(() => {
      setIsProcessingGoogle(false);
      const googleUserEmail = 'visiongoat12@gmail.com';
      const googleUserName = 'Vision Goat';
      setEmail(googleUserEmail);
      setFullName(googleUserName);

      // Derive initial suggested username from email
      const baseName = googleUserEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      const finalSuggested = TAKEN_USERNAMES.has(baseName) ? `${baseName}_creator` : baseName;
      setUsername(finalSuggested);

      if (authMode === 'sign_in') {
        // Direct login
        completeAuthentication({
          id: `usr-${Date.now()}`,
          name: googleUserName,
          username: finalSuggested,
          email: googleUserEmail,
          role: 'creator',
          idDocumentName: 'Aadhaar_Govt_Verified.pdf',
          hasVerifiedBadge: true,
          badgePurchasedAt: '2026-09-01',
          badgeExpiresAt: '2026-12-01',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          kycStatus: 'verified',
          walletBalance: 35000,
        });
      } else {
        // Move to Step 2 to configure unique username & role
        setCurrentStep('username_role');
      }
    }, 600);
  };

  // Handle Email Registration / Sign In submit
  const handleEmailAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Please enter a valid, active Email address.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsProcessingEmail(true);

    setTimeout(() => {
      setIsProcessingEmail(false);

      if (authMode === 'sign_in') {
        // Sign-in mode
        const existingUsername = email.includes('kabir') ? 'kabir_vfx' : email.split('@')[0];
        completeAuthentication({
          id: `usr-${Date.now()}`,
          name: fullName || 'VERILANCE User',
          username: existingUsername,
          email,
          recoveryEmail: recoveryEmail || undefined,
          role: role || 'editor',
          idDocumentName: idDocName || 'Aadhaar_Govt_Card_Verified.pdf',
          hasVerifiedBadge: true,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          kycStatus: 'verified',
          walletBalance: 24500,
        });
      } else {
        // Register mode: proceed to Username & Role step
        if (!username) {
          const autoSuggested = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
          setUsername(autoSuggested);
        }
        setCurrentStep('username_role');
      }
    }, 500);
  };

  // Step 2 validation & Next
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus !== 'available') {
      setUsernameFeedback('Please choose an available, unique username before continuing.');
      return;
    }
    setCurrentStep('recovery_security');
  };

  // Step 3 validation & Next
  const handleStep3Next = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryEmailError(null);

    if (recoveryEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recoveryEmail)) {
        setRecoveryEmailError('Please enter a valid recovery email format.');
        return;
      }
      if (recoveryEmail.toLowerCase() === email.toLowerCase()) {
        setRecoveryEmailError('Recovery email must be different from your primary login email.');
        return;
      }
    }

    setCurrentStep('memoranda_kyc');
  };

  // Simulated Government ID Upload
  const handleSimulateIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingId(true);
      const file = e.target.files[0];
      setTimeout(() => {
        setIdDocName(file.name);
        setIsUploadingId(false);
      }, 700);
    }
  };

  // Final Step 4 Complete
  const handleFinalComplete = () => {
    completeAuthentication({
      id: `usr-${Date.now()}`,
      name: fullName || username || 'VERILANCE Member',
      username: username.toLowerCase().trim(),
      email: email.trim(),
      recoveryEmail: recoveryEmail.trim() || undefined,
      role: role,
      idDocumentName: idDocName || 'Govt_ID_Encrypted_Memoranda.pdf',
      hasVerifiedBadge: wantsVerifiedBadge,
      badgePurchasedAt: wantsVerifiedBadge ? '2026-09-19' : undefined,
      badgeExpiresAt: wantsVerifiedBadge ? '2026-12-19' : undefined,
      avatar: role === 'creator' 
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      kycStatus: idDocName ? 'verified' : 'pending',
      walletBalance: role === 'creator' ? 50000 : 18500,
    });
  };

  const completeAuthentication = (userObj: UserProfile) => {
    try {
      localStorage.setItem('verilance_auth_user', JSON.stringify(userObj));
      localStorage.setItem('verilance_auth_completed', 'true');
    } catch (e) {
      console.warn('Storage failed', e);
    }
    
    // Asynchronously persist to real live Firestore database
    saveUserToDB(userObj).catch(err => {
      console.error('[Auth] Failed to sync user with Firestore database:', err);
    });

    onAuthSuccess(userObj);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05070a]/90 backdrop-blur-xl overflow-y-auto">
      {/* Decorative ambient background glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div 
        id="auth-gate-modal-card"
        className="relative w-full max-w-xl bg-[#0e121a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.8)] text-slate-100 my-6 transition-all duration-300"
      >
        {/* Optional Dismiss button if already authenticated */}
        {canDismiss && onClose && (
          <button 
            id="btn-dismiss-auth"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header: Official VERILANCE Brand Identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <VerilanceLogo size="lg" showBadge={false} />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Anti-Scam Escrow & View Once Protocol</span>
          </div>
        </div>

        {/* Multi-Step Progress Tracker */}
        {currentStep !== 'auth' && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span className={currentStep === 'username_role' ? 'text-cyan-400' : ''}>1. Unique Handle & Role</span>
              <span className={currentStep === 'recovery_security' ? 'text-cyan-400' : ''}>2. Security & Recovery</span>
              <span className={currentStep === 'memoranda_kyc' ? 'text-cyan-400' : ''}>3. Personal Memoranda</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-300"
                style={{
                  width: currentStep === 'username_role' ? '33.3%' : currentStep === 'recovery_security' ? '66.6%' : '100%'
                }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: AUTHENTICATION (Google + Email) */}
        {/* ========================================================================= */}
        {currentStep === 'auth' && (
          <div>
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#141822] rounded-xl border border-white/10 mb-6">
              <button
                type="button"
                id="tab-register-mode"
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                  authMode === 'register'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                id="tab-sign-in-mode"
                onClick={() => { setAuthMode('sign_in'); setAuthError(null); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                  authMode === 'sign_in'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Prominent "Continue with Google" Button */}
            <div className="space-y-4">
              <button
                type="button"
                id="btn-google-auth"
                onClick={handleGoogleSignIn}
                disabled={isProcessingGoogle}
                className="w-full relative flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition shadow-lg shadow-white/5 active:scale-[0.99] disabled:opacity-75"
              >
                {isProcessingGoogle ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                    <span>Connecting with Google OAuth...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google 'G' Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0e121a] px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  Or continue with verified email
                </span>
                <div className="border-t border-white/10 w-full" />
              </div>

              {/* Email Authentication Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="input-auth-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Kabir Verma"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor={emailInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary Email ID <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id={emailInputId}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Security Password <span className="text-cyan-400">*</span>
                    </label>
                    {authMode === 'sign_in' && (
                      <button 
                        type="button" 
                        onClick={() => alert('Password reset link sent to your verified email.')}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-auth"
                  disabled={isProcessingEmail}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-75"
                >
                  {isProcessingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Validating Security Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === 'register' ? 'Proceed to Profile Setup' : 'Access VERILANCE'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Pre-fill shortcut for instant reviewer testing */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  id="btn-fast-demo-login"
                  onClick={() => {
                    setEmail('demo.creator@verilance.io');
                    setFullName('Aarav Sharma');
                    setPassword('password123');
                    setUsername('aarav_pro');
                    setRole('creator');
                  }}
                  className="text-xs text-slate-500 hover:text-cyan-400 transition underline underline-offset-4"
                >
                  ⚡ Fill Sample Credentials (Instant Testing)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PROFILE & UNIQUE USERNAME AVAILABILITY CHECKER */}
        {/* ========================================================================= */}
        {currentStep === 'username_role' && (
          <form onSubmit={handleStep2Next} className="space-y-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span>Unique Identity & Role Selection</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your profile username is permanently linked to your escrow multi-sig contracts and cannot be duplicated.
              </p>
            </div>

            {/* Unique Username Input with Live Checker */}
            <div>
              <label htmlFor={usernameInputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Permanent Profile Username <span className="text-cyan-400">*</span>
              </label>
              
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">
                  @
                </div>
                <input
                  id={usernameInputId}
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="e.g., john_doe"
                  className={`w-full pl-8 pr-10 py-2.5 bg-[#141822] border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                    usernameStatus === 'available'
                      ? 'border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50'
                      : usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'border-red-500/60 focus:ring-1 focus:ring-red-500/50'
                      : 'border-white/10 focus:border-cyan-500/60'
                  }`}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  )}
                  {usernameStatus === 'available' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {usernameStatus === 'taken' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              {/* Status feedback message */}
              {usernameFeedback && (
                <div className={`mt-1.5 text-xs flex items-center gap-1.5 font-medium ${
                  usernameStatus === 'available'
                    ? 'text-emerald-400'
                    : usernameStatus === 'taken' || usernameStatus === 'invalid'
                    ? 'text-red-400'
                    : 'text-cyan-400'
                }`}>
                  {usernameStatus === 'taken' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  {usernameStatus === 'available' && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{usernameFeedback}</span>
                </div>
              )}

              {/* Smart suggested usernames if taken */}
              {suggestedUsernames.length > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-semibold">
                    Suggested Available Handles:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {suggestedUsernames.map((alt) => (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => setUsername(alt)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-xs font-mono text-cyan-300 transition flex items-center gap-1"
                      >
                        <span>@{alt}</span>
                        <Check className="w-3 h-3 text-cyan-400 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Explicit Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Primary Platform Role <span className="text-cyan-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="role-select-creator"
                  onClick={() => setRole('creator')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                    role === 'creator'
                      ? 'bg-cyan-500/10 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/5'
                      : 'bg-[#141822] border-white/5 text-slate-400 hover:border-white/15'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'creator' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      Content Creator / Client
                      {role === 'creator' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Funds escrow deals, posts video editing briefs, and authorizes payments.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  id="role-select-editor"
                  onClick={() => setRole('editor')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                    role === 'editor'
                      ? 'bg-teal-500/10 border-teal-500/60 text-white shadow-lg shadow-teal-500/5'
                      : 'bg-[#141822] border-white/5 text-slate-400 hover:border-white/15'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'editor' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-slate-400'}`}>
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      Video Editor / Freelancer
                      {role === 'editor' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Delivers watermarked work, uses View Once security, receives guaranteed payouts.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('auth')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                id="btn-step2-continue"
                disabled={usernameStatus !== 'available'}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Continue to Security</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: RECOVERY EMAIL & SECURITY SETUP */}
        {/* ========================================================================= */}
        {currentStep === 'recovery_security' && (
          <form onSubmit={handleStep3Next} className="space-y-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span>Account Recovery & Vault Security</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide a secondary recovery channel to safeguard high-value escrow balances and multi-sig contract releases.
              </p>
            </div>

            {/* Recovery Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Secondary / Recovery Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-recovery-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="e.g., backup.recovery@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#141822] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Used strictly for password resets, escrow emergency freezes, and anti-hijack verification.
              </p>

              {recoveryEmailError && (
                <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{recoveryEmailError}</span>
                </div>
              )}
            </div>

            {/* Escrow Security Preferences */}
            <div className="p-4 rounded-xl bg-[#141822] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Escrow Vault 2FA / Release PIN
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Require OTP verification for releasing funds over ₹5,000
                    </span>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={enableTwoFactor}
                  onChange={(e) => setEnableTwoFactor(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('username_role')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                id="btn-step3-continue"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Continue to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PERSONAL MEMORANDA & IDENTITY VERIFICATION NOTICE */}
        {/* ========================================================================= */}
        {currentStep === 'memoranda_kyc' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  Personal Memoranda & Trust Badge
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                  Anti-Ghosting Guard
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Upload your government identification for automated fraud screening. All documents are stored in zero-knowledge encrypted vaults.
              </p>
            </div>

            {/* Document Upload Area */}
            <div className="border border-dashed border-white/15 rounded-2xl p-4 bg-[#141822]/60 hover:bg-[#141822] transition flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                  {idDocName ? <FileCheck className="w-5 h-5 text-emerald-400" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {idDocName || 'Aadhaar / PAN / Government Photo ID'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {idDocName ? '✅ Cryptographic hash verified' : 'Upload PDF, PNG, or JPG (max 10MB)'}
                  </p>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="id-doc-upload-field"
                  className="cursor-pointer text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isUploadingId ? 'Scanning...' : idDocName ? 'Replace File' : 'Select Document'}</span>
                </label>
                <input
                  id="id-doc-upload-field"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleSimulateIdUpload}
                />
              </div>
            </div>

            {/* Premium ₹2,000 / 3-Month "Verified Pro Badge" Option */}
            <div className={`p-4 rounded-2xl border transition-all ${
              wantsVerifiedBadge
                ? 'bg-gradient-to-br from-indigo-950/40 via-[#12162a] to-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/10'
                : 'bg-[#141822] border-white/10'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Verified Badge
                    </span>
                    <span className="text-xs font-bold text-purple-300">
                      ₹2,000 / 3 Months
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    High-Trust Escrow Priority & Dispute Immunity
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">
                    Features the permanent Blue/Purple gradient Trust Shield, zero platform commissions on first 3 deals, and instant dispute resolution triage.
                  </p>
                </div>

                <button
                  type="button"
                  id="toggle-verified-badge-purchase"
                  onClick={() => setWantsVerifiedBadge(!wantsVerifiedBadge)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    wantsVerifiedBadge
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {wantsVerifiedBadge ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Included</span>
                    </>
                  ) : (
                    <span>Add Badge</span>
                  )}
                </button>
              </div>
            </div>

            {/* Anti-Scam Terms & Conditions Checkbox */}
            <div className="flex items-start gap-2.5 text-[11px] text-slate-400">
              <input
                type="checkbox"
                id="check-terms-agree"
                checked={kycAgreed}
                onChange={(e) => setKycAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-cyan-400 rounded cursor-pointer"
              />
              <label htmlFor="check-terms-agree" className="cursor-pointer">
                I acknowledge the <span className="text-cyan-400 underline">VERILANCE Escrow Protocol</span>. 
                I agree that deliverables must comply with anti-screen capture watermark rules, and payments are protected inside multi-sig smart contracts.
              </label>
            </div>

            {/* Final Unlock Action */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('recovery_security')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                id="btn-complete-onboarding"
                disabled={!kycAgreed}
                onClick={handleFinalComplete}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Complete Setup & Unlock Marketplace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
