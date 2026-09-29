import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Crown, 
  Layers, 
  Eye, 
  EyeOff, 
  ChevronRight,
  MessageSquare,
  FileCheck,
  Clock,
  Sparkles,
  Shield
} from 'lucide-react';
import { isRootOwner, isUserAdmin } from '../lib/adminSecurity';
import { AdminBadge } from './AdminBadge';
import { soundEffects } from '../lib/soundEffects';

interface GoogleStyleProfileMenuProps {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  onNavigate: (view: 'marketplace' | 'profile' | 'escrow' | 'admin') => void;
  onOpenKyc: () => void;
  onSignOut: () => void;
  onOpenSignIn: () => void;
}

export const GoogleStyleProfileMenu: React.FC<GoogleStyleProfileMenuProps> = ({
  currentUser,
  isAuthenticated,
  onNavigate,
  onOpenKyc,
  onSignOut,
  onOpenSignIn,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPrivateEmail, setShowPrivateEmail] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isRoot = isRootOwner(currentUser.email);
  const isAdmin = isRoot || isUserAdmin(currentUser);
  const isKycVerified = currentUser.kycStatus === 'verified' || isRoot || isAdmin;

  // Mask user's email: e.g. "visiongoat12@gmail.com" -> "v•••••••••••@gmail.com"
  const maskEmail = (emailStr: string): string => {
    if (!emailStr || !emailStr.includes('@')) return '••••••••';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 2) return `${local[0]}•@${domain}`;
    return `${local[0]}${'•'.repeat(Math.max(4, local.length - 2))}${local[local.length - 1]}@${domain}`;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isAuthenticated) {
    return (
      <button
        id="top-left-google-login-btn"
        onClick={() => {
          soundEffects.playNavTabClick();
          onOpenSignIn();
        }}
        className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 hover:from-cyan-500/30 hover:to-teal-400/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 transition shadow-md shadow-cyan-500/10 shrink-0 cursor-pointer"
        title="Sign In with Google / Email"
      >
        <User className="w-4 h-4 text-cyan-300" />
      </button>
    );
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Sleek, circular profile avatar button (Google Account style) */}
      <button
        id="top-left-google-avatar-btn"
        onClick={() => {
          soundEffects.playToggleSound();
          setIsOpen((prev) => !prev);
        }}
        className="relative group p-0.5 rounded-full transition-transform active:scale-95 focus:outline-none cursor-pointer"
        title={`Account: ${currentUser.name || 'Member'} (${currentUser.email || ''})`}
        aria-expanded={isOpen}
      >
        {/* Glowing ring halo on hover / active */}
        <div className={`w-9 h-9 rounded-full p-0.5 transition-all ${
          isOpen
            ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            : 'ring-1 ring-white/20 group-hover:ring-cyan-400/80 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
        } bg-gradient-to-tr from-cyan-500/30 via-purple-500/20 to-teal-500/30`}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name || 'User'}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        {/* Glowing status indicator dot */}
        <span
          id="google-avatar-status-dot"
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#0a0d13] ${
            isKycVerified
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
              : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
          }`}
          title={isKycVerified ? 'Status: KYC Verified' : 'Status: 15-Day Trial / KYC Pending'}
        />
      </button>

      {/* Glassmorphic Quick Account Drawer / Dropdown */}
      {isOpen && (
        <div
          id="top-left-google-account-drawer"
          className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-3xl bg-[#0c101a]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(6,182,212,0.2)] text-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* 1. Header: Profile Info */}
          <div className="flex items-center gap-3.5 pb-3.5 border-b border-white/10 relative z-10">
            <div className="relative group shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name || 'User'}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-cyan-500/40 p-0.5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-[#0c101a] ${
                  isKycVerified ? 'bg-emerald-400 shadow-sm' : 'bg-amber-400'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-white tracking-tight truncate font-['Space_Grotesk']">
                  {currentUser.name || 'VERILANCE Member'}
                </h4>
                <AdminBadge user={currentUser} size="sm" />
              </div>

              <div className="flex items-center gap-1 text-[11px] text-cyan-400/90 font-mono mt-0.5">
                <span>@{currentUser.username || 'user'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-sans capitalize">
                  {currentUser.role === 'creator' ? '🎬 Creator' : '✂️ Video Editor'}
                </span>
              </div>

              {/* KYC Status Badge */}
              <div className="mt-1 flex items-center gap-1">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                  isKycVerified
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}>
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {isKycVerified ? 'KYC Verified' : '15-Day Trial / KYC Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Privacy Guard: Toggle Show/Hide Private Email */}
          <div className="py-2.5 px-3 my-2.5 rounded-2xl bg-white/[0.03] border border-white/5 relative z-10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Private Identity Guard</span>
              </span>

              {/* Toggle Switch */}
              <button
                type="button"
                id="toggle-private-email-visibility"
                onClick={() => {
                  soundEffects.playToggleSound();
                  setShowPrivateEmail((prev) => !prev);
                }}
                className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                title="Toggle visibility of your email to yourself"
              >
                {showPrivateEmail ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Email</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Show Email</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs font-mono text-slate-300 truncate">
              {showPrivateEmail ? currentUser.email : maskEmail(currentUser.email)}
            </div>

            {currentUser.recoveryEmail && showPrivateEmail && (
              <div className="text-[11px] font-mono text-slate-400 truncate pt-0.5 border-t border-white/5">
                <span className="text-slate-500">Recovery:</span> {currentUser.recoveryEmail}
              </div>
            )}
            
            <p className="text-[9.5px] text-slate-500 italic">
              * Visible strictly to you and Root Owner. Hidden on all public views.
            </p>
          </div>

          {/* 3. Quick Navigation Links */}
          <div className="space-y-1 relative z-10 pt-1 pb-2">
            <button
              onClick={() => {
                soundEffects.playNavTabClick();
                setIsOpen(false);
                onNavigate('profile');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Profile Settings</span>
                  <span className="text-[10px] text-slate-400">Bio, Avatar & Editor Software Stack</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => {
                soundEffects.playTabClick();
                setIsOpen(false);
                onOpenKyc();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">KYC Status & Document Upload</span>
                  <span className="text-[10px] text-slate-400">Aadhaar/PAN & Bank Account Verification</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => {
                soundEffects.playNavTabClick();
                setIsOpen(false);
                onNavigate('escrow');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white transition group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Active Escrow Contracts</span>
                  <span className="text-[10px] text-slate-400">Milestones, Payouts & DRM View Once</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
            </button>

            {/* Admin Control Panel link (if Root Owner or Admin) */}
            {isAdmin && (
              <button
                onClick={() => {
                  soundEffects.playNavTabClick();
                  setIsOpen(false);
                  onNavigate('admin');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-cyan-500/10 hover:from-amber-500/25 border border-amber-500/30 text-amber-200 transition group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                    {isRoot ? (
                      <Crown className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-cyan-300" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white flex items-center gap-1.5">
                      <span>Admin Control Panel</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        {isRoot ? 'ROOT' : 'ADMIN'}
                      </span>
                    </span>
                    <span className="text-[10px] text-amber-300/80">Role Delegation, Escrow & Audit Logs</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
              </button>
            )}
          </div>

          {/* 4. One-Click Log Out Action Button */}
          <div className="pt-2.5 border-t border-white/10 relative z-10 flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-slate-500">
              v1.0 • Verilance Cloud
            </span>

            <button
              id="google-drawer-logout-btn"
              onClick={() => {
                soundEffects.playToggleSound();
                setIsOpen(false);
                onSignOut();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Sign out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
