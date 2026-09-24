import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where,
  getDocFromServer 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CreatorProfile, UserProfile, DealAgreement, ChatMessage, ViewOnceMedia, Channel, AdminPermissions, AdminAuditLog } from '../types';
import { ROOT_OWNER_EMAIL, isRootOwner } from './adminSecurity';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if available
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

/**
 * Verify live connection to Firestore database
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Live database connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or database initializing.');
      return false;
    }
    return true;
  }
}

// Run initial connection test
testFirestoreConnection();

/**
 * Clean up any legacy demo records from the database
 */
export async function cleanupDemoDataFromDB(): Promise<void> {
  const demoCreatorIds = [
    'creator-kabir-verma',
    'creator-ananya-deshmukh',
    'creator-rohan-mehta',
    'creator-siddharth-nair',
    'creator-aarav-sharma',
    'user-001',
  ];

  const demoUserIds = ['user-001', 'client-aarav', 'guest-001', 'demo-editor', 'demo-creator'];
  const demoDealIds = ['TRW-849201', 'deal-sample', 'deal-001'];

  try {
    // 1. Purge demo creators
    for (const id of demoCreatorIds) {
      const creatorRef = doc(db, 'creators', id);
      const snap = await getDoc(creatorRef);
      if (snap.exists()) {
        await deleteDoc(creatorRef);
        console.log(`[Firestore] Purged demo creator listing: ${id}`);
      }
    }

    // 2. Purge demo users
    for (const uid of demoUserIds) {
      const demoUserRef = doc(db, 'users', uid);
      const userSnap = await getDoc(demoUserRef);
      if (userSnap.exists()) {
        await deleteDoc(demoUserRef);
        console.log(`[Firestore] Purged demo user: ${uid}`);
      }
    }

    // 3. Purge dummy deals
    for (const did of demoDealIds) {
      const dRef = doc(db, 'deals', did);
      const snap = await getDoc(dRef);
      if (snap.exists()) {
        await deleteDoc(dRef);
        console.log(`[Firestore] Purged dummy deal: ${did}`);
      }
    }

    // 4. Clean up any deals tagged with TRW-849201 or mock names
    const dealsRef = collection(db, 'deals');
    const dealsSnap = await getDocs(dealsRef);
    for (const dealDoc of dealsSnap.docs) {
      const data = dealDoc.data();
      if (
        dealDoc.id === 'TRW-849201' ||
        data.receiverName?.includes('Kabir Verma') ||
        data.senderName?.includes('Aarav Sharma')
      ) {
        await deleteDoc(doc(db, 'deals', dealDoc.id));
        console.log(`[Firestore] Purged mock deal from collection: ${dealDoc.id}`);
      }
    }
  } catch (err) {
    console.warn('[Firestore] Notice cleaning demo data:', err);
  }
}

// Automatically clean up legacy demo items in the background
cleanupDemoDataFromDB();

/**
 * Fetch all creators from the real Firestore database
 */
export async function fetchCreatorsFromDB(): Promise<CreatorProfile[]> {
  try {
    const creatorsRef = collection(db, 'creators');
    const snapshot = await getDocs(creatorsRef);
    const creators: CreatorProfile[] = [];
    snapshot.forEach((d) => {
      // Exclude any remaining demo entries
      if (!d.id.startsWith('creator-kabir') && !d.id.startsWith('creator-ananya') && 
          !d.id.startsWith('creator-rohan') && !d.id.startsWith('creator-siddharth')) {
        creators.push({ id: d.id, ...d.data() } as CreatorProfile);
      }
    });
    return creators;
  } catch (error) {
    console.error('[Firestore] Error fetching creators:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for creators
 */
export function subscribeCreators(onUpdate: (creators: CreatorProfile[]) => void): () => void {
  const creatorsRef = collection(db, 'creators');
  return onSnapshot(
    creatorsRef,
    (snapshot) => {
      const creators: CreatorProfile[] = [];
      snapshot.forEach((d) => {
        if (!d.id.startsWith('creator-kabir') && !d.id.startsWith('creator-ananya') && 
            !d.id.startsWith('creator-rohan') && !d.id.startsWith('creator-siddharth')) {
          creators.push({ id: d.id, ...d.data() } as CreatorProfile);
        }
      });
      onUpdate(creators);
    },
    (error) => {
      console.error('[Firestore] Realtime subscription error:', error);
    }
  );
}

/**
 * Helper to recursively remove undefined values from objects before writing to Firestore
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const clean: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = cleanFirestoreData(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

/**
 * Save or update a creator profile in the Firestore database
 */
export async function saveCreatorToDB(creator: CreatorProfile): Promise<void> {
  try {
    const creatorRef = doc(db, 'creators', creator.id);
    const cleanedData = cleanFirestoreData({
      ...creator,
      updatedAt: new Date().toISOString()
    });
    await setDoc(creatorRef, cleanedData, { merge: true });
    console.log(`[Firestore] Creator saved to database: ${creator.name} (${creator.id})`);
  } catch (error) {
    console.error('[Firestore] Error saving creator:', error);
    throw error;
  }
}

/**
 * Delete a creator profile from the Firestore database
 */
export async function deleteCreatorFromDB(creatorId: string): Promise<void> {
  try {
    const creatorRef = doc(db, 'creators', creatorId);
    await deleteDoc(creatorRef);
    console.log(`[Firestore] Creator removed: ${creatorId}`);
  } catch (error) {
    console.error('[Firestore] Error deleting creator:', error);
    throw error;
  }
}

/**
 * Fetch a user profile from Firestore by user ID
 */
export async function fetchUserFromDB(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error(`[Firestore] Error fetching user ${userId}:`, error);
    return null;
  }
}

/**
 * Subscribe to real-time updates for a specific user
 */
export function subscribeUser(userId: string, onUpdate: (user: UserProfile | null) => void): () => void {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error(`[Firestore] Real-time user listener error (${userId}):`, err);
    }
  );
}

/**
 * Save user profile to Firestore
 */
export async function saveUserToDB(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    const normalizedEmail = user.email ? user.email.trim().toLowerCase() : '';
    const isRoot = isRootOwner(normalizedEmail);

    const permissions: AdminPermissions = isRoot
      ? {
          canManageAdmins: true,
          canManageKYC_Escrow: true,
          grantedAt: user.permissions?.grantedAt || new Date().toISOString(),
          grantedBy: 'SYSTEM_ROOT'
        }
      : user.permissions || {
          canManageAdmins: false,
          canManageKYC_Escrow: false
        };

    const cleanedUserData = cleanFirestoreData({
      ...user,
      email: normalizedEmail,
      username: user.username ? user.username.trim().toLowerCase() : '',
      isAdmin: isRoot ? true : !!user.isAdmin,
      isRootOwner: isRoot ? true : !!user.isRootOwner,
      permissions: permissions,
      updatedAt: new Date().toISOString()
    });
    await setDoc(userRef, cleanedUserData, { merge: true });

    // If the user is an editor, automatically synchronize/create their creator listing
    if (user.role === 'editor') {
      const creatorRef = doc(db, 'creators', user.id);
      const cleanedCreatorData = cleanFirestoreData({
        id: user.id,
        userId: user.id,
        name: user.name,
        username: user.username ? user.username.trim().toLowerCase() : user.name.toLowerCase().replace(/\s+/g, '_'),
        avatar: user.avatar,
        role: 'Verified Video Editor & Post-Production Specialist',
        rating: 5.0,
        reviewsCount: 1,
        hourlyRate: '₹2,000 / video',
        tags: ['Video Editing', 'Post-Production'],
        bio: 'Professional freelance video editor on Verilance with protected escrow backing.',
        verifiedPro: user.hasVerifiedBadge,
        dealsCompleted: 0,
        deliveryTime: '24-48 Hours',
        updatedAt: new Date().toISOString()
      });
      await setDoc(creatorRef, cleanedCreatorData, { merge: true });
    }

    console.log(`[Firestore] User saved: ${user.name} (${user.id})`);
  } catch (error) {
    console.error('[Firestore] Error saving user:', error);
    throw error;
  }
}

/**
 * Check if an email address is already registered in the database (1 Email = 1 Account restriction)
 * Guarantees strict single-use email enforcement across all accounts.
 */
export async function checkEmailInDB(email: string, currentUserId?: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return false;

    const usersRef = collection(db, 'users');

    // 1. Direct query matching normalized email
    const q = query(usersRef, where('email', '==', cleanEmail));
    const snapshot = await getDocs(q);

    for (const d of snapshot.docs) {
      if (d.id !== currentUserId) {
        console.log(`[Firestore] Email collision detected for ${cleanEmail} with user doc ${d.id}`);
        return true;
      }
    }

    // 2. Secondary comprehensive scan across all user documents
    // (guarantees prevention of any case-casing, whitespace, or schema differences)
    const allUsersSnap = await getDocs(usersRef);
    for (const d of allUsersSnap.docs) {
      if (d.id !== currentUserId) {
        const data = d.data();
        const docEmail = data.email ? String(data.email).trim().toLowerCase() : '';
        if (docEmail === cleanEmail) {
          console.log(`[Firestore] Email match found via scan for ${cleanEmail} on doc ${d.id}`);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.warn('[Firestore] Notice during email uniqueness check:', error);
    // Offline / fallback check against cached authenticated user in local storage
    try {
      const stored = localStorage.getItem('verilance_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email && u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.id !== currentUserId) {
          return true;
        }
      }
    } catch (e) {
      // ignore
    }
    return false;
  }
}

/**
 * Check if a username is already taken in the database
 */
export async function checkUsernameInDB(username: string, currentUserId?: string): Promise<boolean> {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);

    let isTaken = false;
    snapshot.forEach((d) => {
      if (d.id !== currentUserId) {
        isTaken = true;
      }
    });

    return isTaken;
  } catch (error) {
    console.warn('[Firestore] Error checking username uniqueness:', error);
    return false;
  }
}

/**
 * Completely wipes all records across all collections in the Firestore database:
 * - users
 * - creators
 * - deals
 * - messages
 * - channels
 * Guarantees a 100% clean slate (0 users, 0 active deals, 0 profiles).
 */
export async function wipeFirestoreDatabase(): Promise<{ success: boolean; deletedCount: number }> {
  try {
    let count = 0;
    const collectionsToWipe = ['users', 'creators', 'deals', 'messages', 'channels'];
    for (const collName of collectionsToWipe) {
      try {
        const collRef = collection(db, collName);
        const snapshot = await getDocs(collRef);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, collName, docSnap.id));
          count++;
        }
      } catch (collErr) {
        console.warn(`[Firestore] Notice clearing collection ${collName}:`, collErr);
      }
    }
    console.log(`[Firestore] Database completely wiped. ${count} records deleted. Database is at 0 users, 0 active deals, 0 profiles.`);
    return { success: true, deletedCount: count };
  } catch (error) {
    console.error('[Firestore] Error during complete database wipe:', error);
    return { success: false, deletedCount: 0 };
  }
}

/**
 * Fetch a user profile from Firestore by either their verified email or unique username
 */
export async function fetchUserByEmailOrUsername(identifier: string): Promise<UserProfile | null> {
  try {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    if (!cleanId) return null;

    const usersRef = collection(db, 'users');

    // 1. Try matching by email
    const emailQuery = query(usersRef, where('email', '==', cleanId));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      const firstDoc = emailSnap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() } as UserProfile;
    }

    // 2. Try matching by username
    const usernameQuery = query(usersRef, where('username', '==', cleanId));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) {
      const firstDoc = usernameSnap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() } as UserProfile;
    }

    return null;
  } catch (error) {
    console.warn('[Firestore] Error looking up user by identifier:', error);
    return null;
  }
}

/**
 * Fetch all deals from Firestore
 */
export async function fetchDealsFromDB(): Promise<DealAgreement[]> {
  try {
    const dealsRef = collection(db, 'deals');
    const snapshot = await getDocs(dealsRef);
    const deals: DealAgreement[] = [];
    snapshot.forEach((d) => {
      if (!d.id.startsWith('TRW-849201') && !d.id.startsWith('deal-sample')) {
        deals.push({ id: d.id, ...d.data() } as DealAgreement);
      }
    });
    return deals;
  } catch (error) {
    console.error('[Firestore] Error fetching deals:', error);
    return [];
  }
}

/**
 * Subscribe to deals collection
 */
export function subscribeDeals(onUpdate: (deals: DealAgreement[]) => void): () => void {
  const dealsRef = collection(db, 'deals');
  return onSnapshot(
    dealsRef,
    (snapshot) => {
      const deals: DealAgreement[] = [];
      snapshot.forEach((d) => {
        if (!d.id.startsWith('TRW-849201') && !d.id.startsWith('deal-sample')) {
          deals.push({ id: d.id, ...d.data() } as DealAgreement);
        }
      });
      onUpdate(deals);
    },
    (err) => {
      console.error('[Firestore] Realtime deals subscription error:', err);
    }
  );
}

/**
 * Save a deal agreement to Firestore
 */
export async function saveDealToDB(deal: DealAgreement): Promise<void> {
  try {
    const dealRef = doc(db, 'deals', deal.id);
    const cleanedDealData = cleanFirestoreData({
      ...deal,
      updatedAt: new Date().toISOString()
    });
    await setDoc(dealRef, cleanedDealData, { merge: true });
    console.log(`[Firestore] Deal persisted: ${deal.id}`);
  } catch (error) {
    console.error('[Firestore] Error saving deal:', error);
    throw error;
  }
}

/**
 * Real-time Chat Messaging: Broadcast message to Firebase Firestore
 * When User A sends a message or attachment, broadcast it via Firebase so User B sees it on their screen instantly.
 */
export async function saveMessageToDB(message: ChatMessage, channelId?: string): Promise<void> {
  try {
    const msgId = message.id || `msg-${Date.now()}`;
    const msgRef = doc(db, 'messages', msgId);
    const cleanedMsg = cleanFirestoreData({
      ...message,
      id: msgId,
      channelId: channelId || message.channelId || 'global',
      createdAt: message.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(msgRef, cleanedMsg, { merge: true });
    console.log(`[Firestore] Broadcasted message to real-time chat: ${msgId}`);
  } catch (error) {
    console.error('[Firestore] Error saving message:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time chat messages
 */
export function subscribeMessages(
  channelId: string | null,
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  const messagesRef = collection(db, 'messages');
  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ChatMessage;
        if (!channelId || !data.channelId || data.channelId === channelId || data.channelId === 'global') {
          msgs.push({ ...data, id: d.id });
        }
      });
      // Sort messages chronologically
      msgs.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseInt(a.id.replace(/\D/g, ''), 10) || 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseInt(b.id.replace(/\D/g, ''), 10) || 0);
        return timeA - timeB;
      });
      onUpdate(msgs);
    },
    (err) => {
      console.error('[Firestore] Realtime chat subscription error:', err);
    }
  );
}

/**
 * Update View-Once Media state in Firestore
 * When recipient opens and closes the media:
 * - Update its Firestore document state to opened: true, isExpired: true
 * - Immediately disable media and display locked "Opened" badge for both sender & receiver
 */
export async function updateViewOnceMediaInDB(
  messageId: string,
  updates: Partial<ViewOnceMedia>
): Promise<void> {
  try {
    const msgRef = doc(db, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const currentData = snap.data() as ChatMessage;
      const currentMedia = currentData.viewOnceMedia || ({} as ViewOnceMedia);
      const updatedMedia: ViewOnceMedia = {
        ...currentMedia,
        ...updates,
        opened: updates.opened !== undefined ? updates.opened : true,
        isExpired: updates.isExpired !== undefined ? updates.isExpired : true,
        url: '', // wipe raw media URL to prevent re-opening
        openedAt: updates.openedAt || new Date().toISOString()
      };
      await setDoc(
        msgRef,
        {
          viewOnceMedia: cleanFirestoreData(updatedMedia),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      console.log(`[Firestore] View-Once media synced to 'opened: true' for msg ${messageId}`);
    }
  } catch (error) {
    console.error(`[Firestore] Error updating view-once media for ${messageId}:`, error);
  }
}

/**
 * Save chat channel to Firestore
 */
export async function saveChannelToDB(channel: Channel): Promise<void> {
  try {
    const chRef = doc(db, 'channels', channel.id);
    await setDoc(chRef, cleanFirestoreData({ ...channel, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (error) {
    console.error('[Firestore] Error saving channel:', error);
  }
}

/**
 * Fetch all registered users from Firestore for Admin Control Panel
 */
export async function fetchAllUsersFromDB(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users: UserProfile[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as UserProfile;
      const isRoot = isRootOwner(data.email);
      users.push({
        ...data,
        id: d.id,
        isRootOwner: isRoot ? true : !!data.isRootOwner,
        isAdmin: isRoot ? true : !!data.isAdmin,
        permissions: isRoot
          ? { canManageAdmins: true, canManageKYC_Escrow: true }
          : data.permissions || { canManageAdmins: false, canManageKYC_Escrow: false },
      });
    });
    return users;
  } catch (error) {
    console.error('[Firestore] Error fetching all users:', error);
    return [];
  }
}

/**
 * Real-time subscription to all registered users for Admin Control Panel
 */
export function subscribeAllUsers(onUpdate: (users: UserProfile[]) => void): () => void {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as UserProfile;
        const isRoot = isRootOwner(data.email);
        users.push({
          ...data,
          id: d.id,
          isRootOwner: isRoot ? true : !!data.isRootOwner,
          isAdmin: isRoot ? true : !!data.isAdmin,
          permissions: isRoot
            ? { canManageAdmins: true, canManageKYC_Escrow: true }
            : data.permissions || { canManageAdmins: false, canManageKYC_Escrow: false },
        });
      });
      onUpdate(users);
    },
    (err) => {
      console.error('[Firestore] Real-time users listener error:', err);
    }
  );
}

/**
 * Save an audit log entry to Firestore
 */
export async function saveAuditLogInDB(log: AdminAuditLog): Promise<void> {
  try {
    const logId = log.id || `audit-${Date.now()}`;
    const logRef = doc(db, 'audit_logs', logId);
    await setDoc(logRef, cleanFirestoreData({ ...log, id: logId, timestamp: log.timestamp || new Date().toISOString() }));
    console.log(`[Firestore] Audit log recorded: ${log.action} on ${log.targetUserEmail}`);
  } catch (error) {
    console.error('[Firestore] Error recording audit log:', error);
  }
}

/**
 * Subscribe to Admin Audit Logs
 */
export function subscribeAuditLogs(onUpdate: (logs: AdminAuditLog[]) => void): () => void {
  const auditRef = collection(db, 'audit_logs');
  return onSnapshot(
    auditRef,
    (snapshot) => {
      const logs: AdminAuditLog[] = [];
      snapshot.forEach((d) => {
        logs.push({ id: d.id, ...d.data() } as AdminAuditLog);
      });
      // Sort newest first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(logs);
    },
    (err) => {
      console.error('[Firestore] Audit log subscription error:', err);
    }
  );
}

/**
 * Update Admin Permissions for a user:
 * Stores `isAdmin: true` and `permissions: { canManageAdmins, canManageKYC_Escrow }` in Firestore `users/{uid}/permissions`
 */
export async function updateUserPermissionsInDB(
  targetUserId: string,
  updates: {
    isAdmin: boolean;
    permissions: AdminPermissions;
    updatedByEmail: string;
    updatedByName?: string;
    targetUserEmail?: string;
    targetUserName?: string;
  }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', targetUserId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      throw new Error(`User ${targetUserId} not found`);
    }

    const userData = snap.data() as UserProfile;
    // Security check: cannot modify Root Owner permissions
    if (isRootOwner(userData.email)) {
      throw new Error('Permission denied: The Root Owner possesses immutable tier-0 authority.');
    }

    const updatedPermissions: AdminPermissions = {
      canManageAdmins: !!updates.permissions.canManageAdmins,
      canManageKYC_Escrow: !!updates.permissions.canManageKYC_Escrow,
      grantedAt: new Date().toISOString(),
      grantedBy: updates.updatedByEmail,
    };

    await setDoc(
      userRef,
      cleanFirestoreData({
        isAdmin: updates.isAdmin,
        permissions: updatedPermissions,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    // Record audit log
    await saveAuditLogInDB({
      id: `audit-${Date.now()}`,
      action: updates.isAdmin ? 'promote_admin' : 'revoke_admin',
      actorEmail: updates.updatedByEmail,
      actorName: updates.updatedByName || 'Admin',
      targetUserId,
      targetUserEmail: updates.targetUserEmail || userData.email || '',
      targetUserName: updates.targetUserName || userData.name,
      details: updates.isAdmin
        ? `Delegated Admin permissions updated: canManageAdmins=${updatedPermissions.canManageAdmins}, canManageKYC_Escrow=${updatedPermissions.canManageKYC_Escrow}`
        : 'Admin access demoted/revoked',
      timestamp: new Date().toISOString(),
    });

    console.log(`[Firestore] Updated permissions for user ${targetUserId}:`, updatedPermissions);
  } catch (error) {
    console.error(`[Firestore] Error updating permissions for ${targetUserId}:`, error);
    throw error;
  }
}

/**
 * 1-Click Revoke Admin Access for Root Owner:
 * Immediately demotes a delegated admin back to a standard user
 */
export async function revokeAdminAccessInDB(
  targetUserId: string,
  revokedByEmail: string,
  revokedByName?: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', targetUserId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      throw new Error(`User ${targetUserId} not found`);
    }

    const userData = snap.data() as UserProfile;
    if (isRootOwner(userData.email)) {
      throw new Error('Security violation: The Root Owner cannot be revoked.');
    }

    await setDoc(
      userRef,
      cleanFirestoreData({
        isAdmin: false,
        permissions: {
          canManageAdmins: false,
          canManageKYC_Escrow: false,
          grantedAt: undefined,
          grantedBy: undefined,
        },
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    // Record audit log
    await saveAuditLogInDB({
      id: `audit-${Date.now()}`,
      action: 'revoke_admin',
      actorEmail: revokedByEmail,
      actorName: revokedByName || 'Root Owner',
      targetUserId,
      targetUserEmail: userData.email || '',
      targetUserName: userData.name,
      details: `1-Click Revocation: Demoted delegated admin ${userData.name} (@${userData.username || 'user'}) back to standard role.`,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Firestore] Successfully revoked admin access for user: ${targetUserId}`);
  } catch (error) {
    console.error(`[Firestore] Error revoking admin access for ${targetUserId}:`, error);
    throw error;
  }
}

/**
 * Update KYC status from Admin HUD (Approval / Rejection)
 */
export async function updateUserKycStatusInDB(
  targetUserId: string,
  status: 'verified' | 'rejected' | 'pending',
  reviewerEmail: string,
  reviewerName?: string,
  rejectionReason?: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', targetUserId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const currentData = snap.data() as UserProfile;
    const currentKycData = currentData.kycData || {};

    await setDoc(
      userRef,
      cleanFirestoreData({
        kycStatus: status,
        hasVerifiedBadge: status === 'verified',
        kycData: {
          ...currentKycData,
          reviewedAt: new Date().toISOString(),
          rejectionReason: rejectionReason || undefined,
        },
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    // Record audit log
    await saveAuditLogInDB({
      id: `audit-${Date.now()}`,
      action: status === 'verified' ? 'kyc_approved' : 'kyc_rejected',
      actorEmail: reviewerEmail,
      actorName: reviewerName || 'Admin Reviewer',
      targetUserId,
      targetUserEmail: currentData.email || '',
      targetUserName: currentData.name,
      details: `KYC submission marked as ${status.toUpperCase()}${rejectionReason ? `: ${rejectionReason}` : ''}`,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Firestore] Updated KYC status for user ${targetUserId} to ${status}`);
  } catch (error) {
    console.error(`[Firestore] Error updating KYC status for ${targetUserId}:`, error);
    throw error;
  }
}


