import { UserProfile } from '../types';
import { wipeFirestoreDatabase } from './firebase';
import { DEFAULT_AVATARS, getRandomDefaultAvatar } from './defaultAvatars';

export const CLEAN_SLATE_USER: UserProfile = {
  id: '',
  name: '',
  username: '',
  email: '',
  recoveryEmail: '',
  role: 'editor',
  idDocumentName: null,
  hasVerifiedBadge: false,
  badgePurchasedAt: undefined,
  badgeExpiresAt: undefined,
  avatar: DEFAULT_AVATARS[0].svgDataUri,
  kycStatus: 'unverified',
  walletBalance: 0,
};

// Known demo / mock identifiers that must never be retained
const DEMO_USER_IDS = new Set(['user-001', 'client-aarav', 'guest-001', 'demo-editor', 'demo-creator']);
const DEMO_EMAILS = new Set(['kabir.vfx@verilance.io', 'demo.creator@verilance.io', 'aarav.client@verilance.io']);
const DEMO_USERNAMES = new Set(['kabir_vfx', 'aarav_cuts', 'tech_aarav', 'vikram_cuts']);
const DEMO_DEAL_IDS = new Set(['TRW-849201', 'deal-sample', 'deal-001']);

/**
 * Checks if a given user profile is a legacy demo or mock account
 */
export function isDemoUser(user: Partial<UserProfile> | null | undefined): boolean {
  if (!user) return false;
  if (user.id && (DEMO_USER_IDS.has(user.id) || user.id.startsWith('guest-'))) return true;
  if (user.email && DEMO_EMAILS.has(user.email.toLowerCase())) return true;
  if (user.username && DEMO_USERNAMES.has(user.username.toLowerCase())) return true;
  if (user.name === 'Kabir Verma' || user.name === 'Aarav Sharma') return true;
  // If avatar is old unsplash demo avatar
  if (user.avatar && user.avatar.includes('unsplash.com')) return true;
  return false;
}

/**
 * Clears all LocalStorage and SessionStorage keys related to authentication,
 * user sessions, cached deals, and profiles.
 */
export function clearAllStorageData(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();

    // Mark that fresh clean slate v6 has been initialized
    localStorage.setItem('verilance_wipe_v6_clean', 'true');
    console.log('[DataReset] Browser local/session storage completely wiped. Clean-slate initialized.');
  } catch (e) {
    console.warn('[DataReset] Storage clearance warning:', e);
  }
}

/**
 * Initializes and validates user session on app launch.
 * Forces complete clean slate (0 users, 0 active deals, 0 profiles).
 */
export function initializeCleanSlateAuth(): {
  initialUser: UserProfile;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
} {
  try {
    // Check if clean-slate wipe v6 has already been completed
    const hasReset = localStorage.getItem('verilance_wipe_v6_clean') === 'true';
    if (!hasReset) {
      // First boot with new wipe: purge all storage completely
      clearAllStorageData();
      return {
        initialUser: { ...CLEAN_SLATE_USER, avatar: getRandomDefaultAvatar().svgDataUri },
        isAuthenticated: false,
        isAuthModalOpen: true,
      };
    }

    const storedUserStr = localStorage.getItem('verilance_auth_user');
    const isAuth = localStorage.getItem('verilance_auth_completed') === 'true';

    if (storedUserStr && isAuth) {
      const parsed = JSON.parse(storedUserStr) as UserProfile;
      if (isDemoUser(parsed) || !parsed.email || parsed.email.trim() === '' || !parsed.username || parsed.username.trim() === '') {
        // Discard invalid / demo accounts
        clearAllStorageData();
        return {
          initialUser: { ...CLEAN_SLATE_USER, avatar: getRandomDefaultAvatar().svgDataUri },
          isAuthenticated: false,
          isAuthModalOpen: true,
        };
      }

      // Valid freshly registered non-demo user
      return {
        initialUser: parsed,
        isAuthenticated: true,
        isAuthModalOpen: false,
      };
    }
  } catch (e) {
    console.warn('[DataReset] Error verifying session:', e);
  }

  // Default clean start: strictly unauthenticated on fresh load
  return {
    initialUser: { ...CLEAN_SLATE_USER, avatar: getRandomDefaultAvatar().svgDataUri },
    isAuthenticated: false,
    isAuthModalOpen: true,
  };
}

/**
 * Executes a full database wipe across Firestore and clears all browser state
 */
export async function executeFullDatabaseWipe(): Promise<{ success: boolean; deletedCount: number }> {
  clearAllStorageData();
  const res = await wipeFirestoreDatabase();
  localStorage.setItem('verilance_wipe_v6_clean', 'true');
  sessionStorage.setItem('verilance_firestore_wiped_v6', 'true');
  return res;
}
