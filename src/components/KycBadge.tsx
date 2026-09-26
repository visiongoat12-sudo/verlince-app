import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, XCircle, Shield } from 'lucide-react';

export interface KycBadgeProps {
  status?: 'verified' | 'pending' | 'unverified' | 'rejected' | string;
  isAdminVerified?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const KycBadge: React.FC<KycBadgeProps> = ({
  status = 'unverified',
  isAdminVerified = false,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  const isVerified = status === 'verified';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  // Size styling maps
  const sizeClasses = {
    xs: 'px-1.5 py-0.2 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  // Admin Verified Highlight
  if (isVerified && isAdminVerified) {
    return (
      <span
        className={`inline-flex items-center font-mono font-bold tracking-tight rounded-full border shadow-sm ${sizeClasses} bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/20 border-cyan-400/50 text-cyan-300 shadow-cyan-500/10 ${className}`}
        title="Admin-Verified Identity & Escrow Custody Cleared"
      >
        <ShieldCheck className={`${iconSizes} text-cyan-400`} />
        {showLabel && <span>Admin Verified</span>}
      </span>
    );
  }

  // Standard KYC Verified
  if (isVerified) {
    return (
      <span
        className={`inline-flex items-center font-mono font-bold tracking-tight rounded-full border shadow-sm ${sizeClasses} bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10 ${className}`}
        title="Government ID and Bank Payout Verified"
      >
        <CheckCircle2 className={`${iconSizes} text-emerald-400`} />
        {showLabel && <span>KYC Verified</span>}
      </span>
    );
  }

  // KYC Pending
  if (isPending) {
    return (
      <span
        className={`inline-flex items-center font-mono font-bold tracking-tight rounded-full border ${sizeClasses} bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse ${className}`}
        title="Identity Documents Submitted - Pending Verification"
      >
        <Clock className={`${iconSizes} text-amber-400`} />
        {showLabel && <span>KYC Pending</span>}
      </span>
    );
  }

  // KYC Rejected
  if (isRejected) {
    return (
      <span
        className={`inline-flex items-center font-mono font-medium rounded-full border ${sizeClasses} bg-rose-500/15 border-rose-500/40 text-rose-300 ${className}`}
        title="Identity Documents Rejected - Needs Re-submission"
      >
        <XCircle className={`${iconSizes} text-rose-400`} />
        {showLabel && <span>KYC Rejected</span>}
      </span>
    );
  }

  // Not Verified
  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border ${sizeClasses} bg-slate-800/80 border-slate-700/80 text-slate-400 ${className}`}
      title="Identity Not Verified - Escrow Payouts Restricted"
    >
      <AlertTriangle className={`${iconSizes} text-slate-500`} />
      {showLabel && <span>Not Verified</span>}
    </span>
  );
};
