import { UserProfile, AdminPermissions } from '../types';

/**
 * ROOT OWNER SECURITY CONFIGURATION:
 * visiongoat12@gmail.com is hardcoded as the permanent "Root Owner" (highest authority tier).
 * The Root Owner cannot be demoted, revoked, or altered by any delegated admin.
 */
export const ROOT_OWNER_EMAIL = 'visiongoat12@gmail.com';

/**
 * Validates whether the email matches the permanent Root Owner
 */
export function isRootOwner(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ROOT_OWNER_EMAIL.toLowerCase();
}

/**
 * Determines whether a given user profile is an Admin (either Root Owner or Delegated Admin)
 */
export function isUserAdmin(user?: Partial<UserProfile> | null): boolean {
  if (!user) return false;
  if (isRootOwner(user.email)) return true;
  return !!user.isAdmin;
}

/**
 * Granular Check: Can this user manage and delegate other admins?
 * Allowed ONLY for:
 * 1. Root Owner (visiongoat12@gmail.com)
 * 2. Delegated Admins whose `canManageAdmins` toggle has been explicitly set to TRUE by Root Owner
 */
export function canManageAdmins(user?: Partial<UserProfile> | null): boolean {
  if (!user) return false;
  if (isRootOwner(user.email)) return true;
  return !!(user.isAdmin && user.permissions?.canManageAdmins);
}

/**
 * Granular Check: Can this user review/approve KYC submissions and perform Escrow overrides?
 * Allowed for:
 * 1. Root Owner (visiongoat12@gmail.com)
 * 2. Delegated Admins whose `canManageKYC_Escrow` toggle has been set to TRUE
 */
export function canManageKYCEscrow(user?: Partial<UserProfile> | null): boolean {
  if (!user) return false;
  if (isRootOwner(user.email)) return true;
  return !!(user.isAdmin && user.permissions?.canManageKYC_Escrow);
}

/**
 * Returns human-readable authority tier
 */
export function getAdminTier(user?: Partial<UserProfile> | null): {
  tierName: string;
  badgeLabel: string;
  tierLevel: 0 | 1 | 2 | 3;
  canDelegate: boolean;
  canKYC: boolean;
} {
  if (isRootOwner(user?.email)) {
    return {
      tierName: 'Permanent Root Owner',
      badgeLabel: 'Root Owner',
      tierLevel: 0,
      canDelegate: true,
      canKYC: true,
    };
  }

  if (user?.isAdmin) {
    const canDelegate = !!user.permissions?.canManageAdmins;
    const canKYC = !!user.permissions?.canManageKYC_Escrow;

    if (canDelegate) {
      return {
        tierName: 'Delegated Admin (Full Delegation)',
        badgeLabel: 'Delegated Admin',
        tierLevel: 1,
        canDelegate: true,
        canKYC: canKYC,
      };
    }

    return {
      tierName: 'Delegated Admin (Operational)',
      badgeLabel: 'Delegated Admin',
      tierLevel: 2,
      canDelegate: false,
      canKYC: canKYC,
    };
  }

  return {
    tierName: 'Standard Member',
    badgeLabel: 'User',
    tierLevel: 3,
    canDelegate: false,
    canKYC: false,
  };
}
