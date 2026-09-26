import { UserProfile } from '../types';

export const GRACE_PERIOD_DAYS = 15;

const SIMULATION_KEY = 'verilance_kyc_simulated_days_offset';

/**
 * Checks whether the user has provided/filled their verification information.
 * Returns true if status is verified or pending, or if identity details/documents have been submitted.
 */
export function hasUserFilledVerification(user?: Partial<UserProfile> | null): boolean {
  if (!user) return false;
  
  // Status check
  if (user.kycStatus === 'verified' || user.kycStatus === 'pending') {
    return true;
  }

  // Submitted document name or submitted timestamp
  if (user.idDocumentName && user.idDocumentName.trim().length > 0) {
    return true;
  }

  // Submitted KYC Data fields
  if (user.kycData?.submittedAt && user.kycData.submittedAt.trim().length > 0) {
    return true;
  }

  if (user.kycData?.idNumber && user.kycData.idNumber.trim().length > 0) {
    return true;
  }

  return false;
}

/**
 * Retrieves the simulated days override for testing (if any).
 */
export function getSimulatedDayOverride(): number | null {
  try {
    const val = localStorage.getItem(SIMULATION_KEY);
    if (val !== null && !isNaN(Number(val))) {
      return Number(val);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

/**
 * Sets or clears the simulated days override for instant reviewer/user testing.
 */
export function setSimulatedDayOverride(days: number | null): void {
  try {
    if (days === null) {
      localStorage.removeItem(SIMULATION_KEY);
    } else {
      localStorage.setItem(SIMULATION_KEY, String(days));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Resolves or establishes an immutable account creation date for the user.
 */
export function getAccountCreationDate(user?: Partial<UserProfile> | null): Date {
  if (!user) return new Date();

  // 1. If user object has an explicit createdAt string
  if (user.createdAt) {
    const parsed = new Date(user.createdAt);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // 2. Check localStorage cache for this user ID
  if (user.id) {
    try {
      const stored = localStorage.getItem(`verilance_created_${user.id}`);
      if (stored) {
        const parsed = new Date(stored);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } else {
        const nowIso = new Date().toISOString();
        localStorage.setItem(`verilance_created_${user.id}`, nowIso);
        return new Date(nowIso);
      }
    } catch {
      // Fallback
    }
  }

  return new Date();
}

/**
 * Computes the complete 15-day grace period status for an account.
 */
export interface GracePeriodInfo {
  daysActive: number;
  daysRemaining: number;
  hasFilledVerification: boolean;
  isGracePeriodExpired: boolean;
  canTrade: boolean;
  formattedCreatedDate: string;
  isSimulated: boolean;
}

export function getGracePeriodInfo(user?: Partial<UserProfile> | null): GracePeriodInfo {
  const hasFilled = hasUserFilledVerification(user);
  const createdDate = getAccountCreationDate(user);
  
  // Check if reviewer or user enabled simulation
  const simDays = getSimulatedDayOverride();
  let daysActive: number;
  let isSimulated = false;

  if (simDays !== null) {
    daysActive = Math.max(0, simDays);
    isSimulated = true;
  } else {
    const diffMs = Date.now() - createdDate.getTime();
    daysActive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const daysRemaining = Math.max(0, GRACE_PERIOD_DAYS - daysActive);
  
  // If user has not filled verification, their account can be accessed for only 15 days.
  // After 15 days, it must ask for verification, and trading is locked until verification is given.
  const isGracePeriodExpired = !hasFilled && daysActive >= GRACE_PERIOD_DAYS;
  const canTrade = hasFilled || !isGracePeriodExpired;

  const formattedCreatedDate = createdDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return {
    daysActive,
    daysRemaining,
    hasFilledVerification: hasFilled,
    isGracePeriodExpired,
    canTrade,
    formattedCreatedDate,
    isSimulated
  };
}
