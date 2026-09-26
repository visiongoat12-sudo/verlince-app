import React from 'react';
import { 
  X, 
  MessageSquare, 
  Handshake, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Film, 
  Clock, 
  Lock, 
  Award, 
  Share2,
  Play,
  Layers,
  FileCheck
} from 'lucide-react';
import { UserProfile, CreatorProfile } from '../types';
import { KycBadge } from './KycBadge';
import { AdminBadge } from './AdminBadge';
import { isRootOwner } from '../lib/adminSecurity';
import { soundEffects } from '../lib/soundEffects';
import { EditingAppsSelector } from './EditingAppsSelector';

export interface UserPfpTarget {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
  role?: string;
  bio?: string;
  kycStatus?: 'verified' | 'pending' | 'unverified' | 'rejected' | string;
  hasVerifiedBadge?: boolean;
  rating?: number;
  reviewsCount?: number;
  hourlyRate?: string;
  tags?: string[];
  dealsCompleted?: number;
  deliveryTime?: string;
  sampleVideoTitle?: string;
  portfolioUrl?: string;
  isAdmin?: boolean;
  isRootOwner?: boolean;
  permissions?: any;
  editingApps?: string[];
  createdAt?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserPfpTarget | null;
  currentUser?: UserProfile | null;
  onOpenChat?: (userName: string) => void;
  onOpenDeal?: (prefill: { freelancerName?: string; serviceType?: string; amount?: number }) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUser,
  onOpenChat,
  onOpenDeal,
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!isOpen || !user) return null;

  const isSelf = currentUser && (
    (user.id && user.id === currentUser.id) ||
    (user.email && currentUser.email && user.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const displayName = user.name || 'VERILANCE Member';
  const displayUsername = user.username || (user.name ? user.name.toLowerCase().replace(/\s+/g, '_') : 'member');
  const userRating = user.rating || 5.0;
  const userDeals = user.dealsCompleted ?? 12;
  const userBio = user.bio || (
    user.role === 'creator'
      ? 'Content Creator & Executive Producer commissioning high-impact digital video projects under protected 2% escrow.'
      : 'Professional Freelance Video Editor & Colorist specializing in high-retention cyber edits with DRM watermarking.'
  );

  const tags = user.tags && user.tags.length > 0 
    ? user.tags 
    : ['High-Retention Edits', 'Color Grading', 'Sound Design', '4K Master'];

  const handleCopyProfile = () => {
    soundEffects.playTabClick();
    navigator.clipboard?.writeText(window.location.origin + `/@${displayUsername}`).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDirectMessage = () => {
    soundEffects.playNavTabClick();
    onClose();
    if (onOpenChat && user.name) {
      onOpenChat(user.name);
    }
  };

  const handleHireDeal = () => {
    soundEffects.playTabClick();
    onClose();
    if (onOpenDeal) {
      onOpenDeal({
        freelancerName: user.name,
        serviceType: user.role === 'creator' ? 'Client Project' : 'Video Editing & Production',
        amount: 5000,
      });
    }
  };

  return (
    <div 
      id="user-pfp-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0c101a] border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] text-slate-100 p-6 overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Futuristic Ambient Glow Rings */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition z-10"
          title="Close profile drawer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. HERO PFP & HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-5 border-b border-white/10 relative z-10">
          {/* Enlarged High-Res Avatar with Glowing Halo */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-2 ring-cyan-400/50 p-1 bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-teal-500/30 shadow-xl shadow-cyan-500/20">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                alt={displayName}
                className="w-full h-full rounded-xl object-cover"
              />
            </div>
            {/* Online Status Dot */}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-[#0c101a] shadow-sm animate-pulse" />
          </div>

          {/* User Identifiers & Badges */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Space_Grotesk']">
                {displayName}
              </h2>
              {/* Admin / Root Authority Badge */}
              <AdminBadge user={user} size="sm" />
            </div>

            <div className="text-xs text-cyan-400 font-mono flex items-center justify-center sm:justify-start gap-2 mb-2.5">
              <span>@{displayUsername}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-sans">
                {user.role === 'creator' ? '🎬 Content Creator (Client)' : '✂️ Professional Video Editor'}
              </span>
            </div>

            {/* Badges Row: Explicit KYC Verification Badge + Verified Pro */}
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              {/* REQUIREMENT: Public KYC Verification Status Badge */}
              <KycBadge
                status={user.kycStatus}
                isAdminVerified={user.hasVerifiedBadge}
                size="sm"
              />

              {user.hasVerifiedBadge && (
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-purple-500/40 text-purple-300 text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Verified Pro</span>
                </span>
              )}

              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{userRating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({userDeals} deals)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATS & REPUTATION BAR */}
        <div className="grid grid-cols-3 gap-2.5 py-4 border-b border-white/10 text-center relative z-10">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono block">Escrow Completed</span>
            <span className="text-sm font-black text-white font-mono">{userDeals} Deals</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono block">Delivery Time</span>
            <span className="text-sm font-black text-cyan-300 font-mono">{user.deliveryTime || '24-48 Hours'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono block">Platform Rate</span>
            <span className="text-sm font-black text-emerald-300 font-mono">{user.hourlyRate || '₹2,500 / video'}</span>
          </div>
        </div>

        {/* 3. BIO & CAPABILITIES */}
        <div className="py-4 space-y-3 relative z-10">
          <div>
            <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              About & Experience
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {userBio}
            </p>
          </div>

          {/* Skill Tags */}
          <div>
            <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Verified Core Competencies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Editing Apps Used (Shown strictly if role is editor) */}
          {user.role === 'editor' && (
            <div className="p-3 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-1.5">
              <h4 className="text-[11px] font-mono text-teal-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Film className="w-3.5 h-3.5 text-teal-400" />
                <span>Editing Software & Apps Used</span>
              </h4>
              <EditingAppsSelector
                selectedApps={user.editingApps && user.editingApps.length > 0 ? user.editingApps : ['Adobe Premiere Pro', 'Adobe After Effects', 'DaVinci Resolve']}
                onChange={() => {}}
                readOnly={true}
              />
            </div>
          )}

          {/* Escrow Guarantee Pill */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-transparent border border-teal-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="text-[11px] text-slate-300">
                <span className="font-bold text-teal-300">Verilance 2% Escrow Guaranteed:</span> Funds are held in multisig vault until milestone approval.
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-teal-400 shrink-0 px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30">
              98% Payout
            </span>
          </div>
        </div>

        {/* 4. ACTION BUTTONS: MESSAGE OR HIRE */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-white/10 relative z-10">
          <button
            onClick={handleCopyProfile}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition flex items-center justify-center shrink-0"
            title="Copy Public Profile URL"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {!isSelf ? (
            <>
              <button
                id="btn-profile-modal-message"
                onClick={handleDirectMessage}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition flex items-center justify-center gap-2 hover:border-cyan-500/40"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Message</span>
              </button>

              <button
                id="btn-profile-modal-hire"
                onClick={handleHireDeal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <Handshake className="w-4 h-4 text-slate-950" />
                <span>Hire (2% Escrow)</span>
              </button>
            </>
          ) : (
            <div className="flex-1 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-center text-xs">
              Your Public Profile Preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
