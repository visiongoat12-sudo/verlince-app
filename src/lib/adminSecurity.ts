import { UserProfile, AdminPermissions } from '../types';

/**
 * ROOT OWNER SECURITY CONFIGURATION:
 * visiongoat12@gmail.com is hardcoded as the permanent "Root Owner" (highest authority tier).
 * The Root Owner cannot be demoted, revoked, or altered by any delegated admin.
 */
export const ROOT_OWNER_EMAIL = 'visiongoat12@gmail.com';

export type SafeUserReference = {
  id?: string;
  email?: string | null;
  isAdmin?: boolean;
  isRootOwner?: boolean;
  role?: any;
  permissions?: AdminPermissions | null;
  [key: string]: any;
};

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
export function isUserAdmin(user?: SafeUserReference | null): boolean {
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
export function canManageAdmins(user?: SafeUserReference | null): boolean {
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
export function canManageKYCEscrow(user?: SafeUserReference | null): boolean {
  if (!user) return false;
  if (isRootOwner(user.email)) return true;
  return !!(user.isAdmin && user.permissions?.canManageKYC_Escrow);
}

/**
 * Returns human-readable authority tier
 */
export function getAdminTier(user?: SafeUserReference | null): {
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

/**
 * Checks if target profile matches the actor's own account
 */
export function isSelfAccount(
  actor?: SafeUserReference | null,
  target?: SafeUserReference | null
): boolean {
  if (!actor || !target) return false;
  if (actor.id && target.id && actor.id === target.id) return true;
  if (
    actor.email &&
    target.email &&
    actor.email.trim().toLowerCase() === target.email.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

/**
 * Absolute Rule Engine: Can this actor modify or alter permissions for the target user?
 */
export function canActorModifyTargetAdmin(
  actor?: SafeUserReference | null,
  target?: SafeUserReference | null
): { allowed: boolean; reason?: string } {
  if (!actor || !target) {
    return { allowed: false, reason: 'Authentication context required.' };
  }

  // 1. Root Owner Immunity
  if (isRootOwner(target.email)) {
    return {
      allowed: false,
      reason: 'Root Owner Immunity: The permanent Root Owner (visiongoat12@gmail.com) has immutable tier-0 custody.',
    };
  }

  const actorIsRoot = isRootOwner(actor.email);

  // 2. Self-Revocation & Self-Modification Block
  if (isSelfAccount(actor, target)) {
    if (!actorIsRoot) {
      return {
        allowed: false,
        reason: 'Self-Revocation Block: Delegated Admins cannot revoke, demote, or modify their own role.',
      };
    }
  }

  // 3. If target is already an Admin, only Root Owner can modify them
  const targetIsAdmin = target.isAdmin || isRootOwner(target.email);
  if (targetIsAdmin && !actorIsRoot) {
    return {
      allowed: false,
      reason: 'Non-Root Admin Restriction: Delegated Admins cannot modify or alter permissions for existing Admins.',
    };
  }

  // 4. Standard User promotion: allowed if Root Owner or actor has canManageAdmins
  if (!actorIsRoot && !canManageAdmins(actor)) {
    return {
      allowed: false,
      reason: 'Access denied: You do not possess the `canManageAdmins` authorization.',
    };
  }

  return { allowed: true };
}

/**
 * Absolute Rule Engine: Can this actor revoke an Admin?
 */
export function canActorRevokeTargetAdmin(
  actor?: SafeUserReference | null,
  target?: SafeUserReference | null
): { allowed: boolean; reason?: string } {
  if (!actor || !target) {
    return { allowed: false, reason: 'Authentication context required.' };
  }

  // Root Owner Immunity
  if (isRootOwner(target.email)) {
    return {
      allowed: false,
      reason: 'Critical Security Constraint: The Root Owner cannot be revoked under any circumstances.',
    };
  }

  // Only Root Owner can revoke
  if (!isRootOwner(actor.email)) {
    return {
      allowed: false,
      reason: 'Security Restriction: Only the permanent Root Owner (visiongoat12@gmail.com) possesses revocation authority.',
    };
  }

  return { allowed: true };
}
