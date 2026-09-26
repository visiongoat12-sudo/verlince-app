import React from 'react';
import { Crown, Shield, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { isRootOwner, getAdminTier } from '../lib/adminSecurity';

interface AdminBadgeProps {
  user?: {
    email?: string | null;
    isAdmin?: boolean;
    isRootOwner?: boolean;
    role?: any;
    permissions?: any;
    [key: string]: any;
  } | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  user,
  size = 'md',
  showDetails = false,
  className = '',
}) => {
  if (!user) return null;

  const isRoot = isRootOwner(user.email);
  const isAdmin = isRoot || !!user.isAdmin;

  if (!isAdmin) return null;

  const tier = getAdminTier(user);

  if (isRoot) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div
          className={`relative inline-flex items-center gap-1.5 rounded-full font-mono font-black tracking-wider uppercase transition shadow-lg ${
            size === 'sm'
              ? 'px-2 py-0.5 text-[9px] bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 border border-amber-400/50 shadow-amber-500/20'
              : size === 'lg'
              ? 'px-3.5 py-1.5 text-xs bg-gradient-to-r from-amber-500/30 via-yellow-400/25 to-orange-500/30 text-amber-200 border border-amber-400/60 shadow-amber-500/30'
              : 'px-2.5 py-1 text-[10px] bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 text-amber-300 border border-amber-400/50 shadow-amber-500/20'
          }`}
          title="Root Owner: visiongoat12@gmail.com (Permanent Highest Authority Tier)"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
          <Crown className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} text-amber-400`} />
          <span className="font-extrabold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 bg-clip-text text-transparent">
            Root Owner
          </span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold hidden sm:inline">
            Tier-0
          </span>
        </div>
        {showDetails && (
          <span className="text-[10px] text-amber-400/80 font-mono hidden md:inline">
            Permanent Highest Authority
          </span>
        )}
      </div>
    );
  }

  // Delegated Admin
  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <div
        className={`relative inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wide uppercase transition shadow-md ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[9px] bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-cyan-500/10'
            : size === 'lg'
            ? 'px-3 py-1.5 text-xs bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/20 text-cyan-200 border border-cyan-400/50 shadow-cyan-500/20'
            : 'px-2.5 py-1 text-[10px] bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-teal-500/20 text-cyan-300 border border-cyan-400/40 shadow-cyan-500/15'
        }`}
        title={`Delegated Admin: Authority Tier ${tier.tierLevel}`}
      >
        <ShieldCheck className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-400`} />
        <span className="font-bold text-cyan-300">
          Delegated Admin
        </span>
        <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
          Tier-{tier.tierLevel}
        </span>
      </div>

      {showDetails && (
        <div className="flex items-center gap-1">
          {tier.canDelegate && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono" title="Granted authority to assign admin roles">
              canManageAdmins
            </span>
          )}
          {tier.canKYC && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono" title="Granted authority to approve KYC & override escrow">
              canKYC_Escrow
            </span>
          )}
        </div>
      )}
    </div>
  );
};
