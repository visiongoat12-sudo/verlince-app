import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  getDocFromServer,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CreatorProfile,
  UserProfile,
  DealAgreement,
  ChatMessage,
  ViewOnceMedia,
  Channel,
  AdminPermissions,
  AdminAuditLog,
} from '../types';
import { isRootOwner, isProfileRootOwner, canActorModifyTargetAdmin } from './adminSecurity';
import { deleteChunkedMedia } from './mediaUpload';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if available
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

/**
 * Compute one-way SHA-256 hash of a normalized email address for private lookup index
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return '';
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic FNV-1a hex if crypto.subtle unavailable
  let h = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv_${(h >>> 0).toString(16)}`;
}

/**
 * Verify live connection to Firestore database
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or database initializing.');
      return false;
    }
    return true;
  }
}

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
    for (const id of demoCreatorIds) {
      const creatorRef = doc(db, 'creators', id);
      const snap = await getDoc(creatorRef);
      if (snap.exists()) {
        await deleteDoc(creatorRef);
      }
    }

    for (const uid of demoUserIds) {
      const demoUserRef = doc(db, 'users', uid);
      const userSnap = await getDoc(demoUserRef);
      if (userSnap.exists()) {
        await deleteDoc(doc(db, 'users', uid, 'private', 'sensitiveData')).catch(() => {});
        await deleteDoc(demoUserRef);
      }
    }

    for (const did of demoDealIds) {
      const dRef = doc(db, 'deals', did);
      const snap = await getDoc(dRef);
      if (snap.exists()) {
        await deleteDoc(dRef);
      }
    }

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
      }
    }
  } catch (err) {
    console.warn('[Firestore] Notice cleaning demo data:', err);
  }
}

cleanupDemoDataFromDB();

/**
 * Fetch all creators from the real Firestore database (no emails ever attached)
 */
export async function fetchCreatorsFromDB(): Promise<CreatorProfile[]> {
  try {
    const creatorsRef = collection(db, 'creators');
    const snapshot = await getDocs(creatorsRef);
    const creators: CreatorProfile[] = [];
    snapshot.forEach((d) => {
      if (
        !d.id.startsWith('creator-kabir') &&
        !d.id.startsWith('creator-ananya') &&
        !d.id.startsWith('creator-rohan') &&
        !d.id.startsWith('creator-siddharth')
      ) {
        const raw = d.data() as Record<string, unknown>;
        const { email: _e, recoveryEmail: _r, ...publicCreator } = raw;
        creators.push({ id: d.id, ...publicCreator } as CreatorProfile);
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
        if (
          !d.id.startsWith('creator-kabir') &&
          !d.id.startsWith('creator-ananya') &&
          !d.id.startsWith('creator-rohan') &&
          !d.id.startsWith('creator-siddharth')
        ) {
          const raw = d.data() as Record<string, unknown>;
          const { email: _e, recoveryEmail: _r, ...publicCreator } = raw;
          creators.push({ id: d.id, ...publicCreator } as CreatorProfile);
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
 * Save or update a creator profile in the Firestore database (strictly strips email)
 */
export async function saveCreatorToDB(creator: CreatorProfile): Promise<void> {
  try {
    const creatorRef = doc(db, 'creators', creator.id);
    const rawCopy = { ...creator } as Record<string, unknown>;
    delete rawCopy.email;
    delete rawCopy.recoveryEmail;

    const cleanedData = cleanFirestoreData({
      ...rawCopy,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(creatorRef, cleanedData, { merge: true });
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
  } catch (error) {
    console.error('[Firestore] Error deleting creator:', error);
    throw error;
  }
}

/**
 * Fetch the logged-in user's own profile (merges public /users/{id} + private /users/{id}/private/sensitiveData)
 */
export async function fetchUserFromDB(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const publicData = userSnap.data() as Record<string, any>;
    let privateData: Record<string, any> = {};
    try {
      const privSnap = await getDoc(doc(db, 'users', userId, 'private', 'sensitiveData'));
      if (privSnap.exists()) {
        privateData = privSnap.data() as Record<string, any>;
      }
    } catch {
      // ignore if private doc absent
    }

    const email = privateData.email || publicData.email || '';
    const isRoot = !!publicData.isRootOwner || isRootOwner(email);

    return {
      ...publicData,
      id: userSnap.id,
      email,
      recoveryEmail: privateData.recoveryEmail || '',
      kycData: privateData.kycData || publicData.kycData,
      idDocumentName: privateData.idDocumentName ?? publicData.idDocumentName ?? null,
      isRootOwner: isRoot,
      isAdmin: isRoot ? true : !!publicData.isAdmin,
      permissions: isRoot
        ? {
            canManageAdmins: true,
            canManageKYC_Escrow: true,
            grantedAt: publicData.permissions?.grantedAt || new Date().toISOString(),
            grantedBy: 'SYSTEM_ROOT',
          }
        : publicData.permissions || { canManageAdmins: false, canManageKYC_Escrow: false },
    } as UserProfile;
  } catch (error) {
    console.error(`[Firestore] Error fetching user ${userId}:`, error);
    return null;
  }
}

/**
 * Fetch private KYC inspection fields ONLY (strictly excludes email & recoveryEmail)
 */
export async function fetchPrivateKycForReview(userId: string): Promise<{
  kycData?: UserProfile['kycData'];
  idDocumentName?: string | null;
} | null> {
  try {
    const privSnap = await getDoc(doc(db, 'users', userId, 'private', 'sensitiveData'));
    if (!privSnap.exists()) return null;
    const priv = privSnap.data() as Record<string, any>;
    return {
      kycData: priv.kycData,
      idDocumentName: priv.idDocumentName ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Subscribe to real-time updates for the logged-in owner's user document
 */
export function subscribeUser(userId: string, onUpdate: (user: UserProfile | null) => void): () => void {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const full = await fetchUserFromDB(docSnap.id);
        onUpdate(full);
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
 * Save user profile to Firestore using Public/Private subcollection split:
 * - /users/{uid} holds ONLY non-PII public fields (no email, recoveryEmail, or raw kycData)
 * - /users/{uid}/private/sensitiveData holds email, recoveryEmail, and kycData
 * - /email_index/{sha256(email)} holds { userId } for duplicate check & sign-in
 */
export async function saveUserToDB(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    const normalizedEmail = user.email ? user.email.trim().toLowerCase() : '';
    const isRoot = !!user.isRootOwner || isRootOwner(normalizedEmail);

    const permissions: AdminPermissions = isRoot
      ? {
          canManageAdmins: true,
          canManageKYC_Escrow: true,
          grantedAt: user.permissions?.grantedAt || new Date().toISOString(),
          grantedBy: 'SYSTEM_ROOT',
        }
      : user.permissions || {
          canManageAdmins: false,
          canManageKYC_Escrow: false,
        };

    // 1. Public non-PII profile payload
    const publicPayload = cleanFirestoreData({
      id: user.id,
      name: user.name,
      username: user.username ? user.username.trim().toLowerCase() : '',
      role: user.role,
      isAdmin: isRoot ? true : !!user.isAdmin,
      isRootOwner: isRoot,
      permissions,
      hasVerifiedBadge: !!user.hasVerifiedBadge,
      badgePurchasedAt: user.badgePurchasedAt,
      badgeExpiresAt: user.badgeExpiresAt,
      avatar: user.avatar,
      kycStatus: user.kycStatus,
      walletBalance: user.walletBalance ?? 0,
      editingApps: user.editingApps,
      createdAt: user.createdAt || new Date().toISOString(),
      idDocumentName: user.idDocumentName ?? null,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(
      userRef,
      {
        ...publicPayload,
        email: deleteField(),
        recoveryEmail: deleteField(),
        kycData: deleteField(),
      },
      { merge: true }
    );

    // 2. Private subcollection payload (Owner-only sensitive fields)
    const privatePayload = cleanFirestoreData({
      email: normalizedEmail || undefined,
      recoveryEmail: user.recoveryEmail ? user.recoveryEmail.trim().toLowerCase() : undefined,
      kycData: user.kycData,
      idDocumentName: user.idDocumentName ?? null,
      updatedAt: new Date().toISOString(),
    });

    if (Object.keys(privatePayload).length > 0) {
      await setDoc(doc(db, 'users', user.id, 'private', 'sensitiveData'), privatePayload, { merge: true });
    }

    // 3. Hashed email lookup index (no plaintext email stored)
    if (normalizedEmail) {
      const emailHash = await hashEmail(normalizedEmail);
      if (emailHash) {
        await setDoc(
          doc(db, 'email_index', emailHash),
          {
            userId: user.id,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    // 4. Synchronize creator listing (strictly no email)
    if (user.role === 'editor') {
      const creatorRef = doc(db, 'creators', user.id);
      const cleanedCreatorData = cleanFirestoreData({
        id: user.id,
        userId: user.id,
        name: user.name,
        username: user.username
          ? user.username.trim().toLowerCase()
          : user.name.toLowerCase().replace(/\s+/g, '_'),
        avatar: user.avatar,
        role: 'Verified Video Editor & Post-Production Specialist',
        rating: 5.0,
        reviewsCount: 1,
        hourlyRate: '₹2,000 / video',
        tags: ['Video Editing', 'Post-Production'],
        bio: 'Professional freelance video editor on Verilance with protected escrow backing.',
        verifiedPro: user.hasVerifiedBadge,
        editingApps: user.editingApps,
        dealsCompleted: 0,
        deliveryTime: '24-48 Hours',
        updatedAt: new Date().toISOString(),
      });
      await setDoc(creatorRef, cleanedCreatorData, { merge: true });
    }
  } catch (error) {
    console.error('[Firestore] Error saving user:', error);
    throw error;
  }
}

/**
 * Check if an email address is already registered via the hashed email_index (never queries plaintext emails)
 */
export async function checkEmailInDB(email: string, currentUserId?: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return false;

    const emailHash = await hashEmail(cleanEmail);
    if (!emailHash) return false;

    const indexSnap = await getDoc(doc(db, 'email_index', emailHash));
    if (indexSnap.exists()) {
      const data = indexSnap.data() as { userId?: string };
      if (data.userId && data.userId !== currentUserId) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn('[Firestore] Notice during email uniqueness check:', error);
    try {
      const stored = localStorage.getItem('verilance_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email && u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.id !== currentUserId) {
          return true;
        }
      }
    } catch {
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
 * Completely wipes all records across collections in the Firestore database
 */
export async function wipeFirestoreDatabase(): Promise<{ success: boolean; deletedCount: number }> {
  try {
    let count = 0;
    // Clear private subcollections for users first
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const uDoc of usersSnap.docs) {
        await deleteDoc(doc(db, 'users', uDoc.id, 'private', 'sensitiveData')).catch(() => {});
      }
    } catch {
      // ignore
    }

    const collectionsToWipe = [
      'users',
      'email_index',
      'creators',
      'deals',
      'messages',
      'channels',
      'media_chunks',
      'audit_logs',
    ];
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
    return { success: true, deletedCount: count };
  } catch (error) {
    console.error('[Firestore] Error during complete database wipe:', error);
    return { success: false, deletedCount: 0 };
  }
}

/**
 * Fetch a signing-in user's profile via hashed email lookup or unique username.
 * Merges their own /private/sensitiveData document for the sign-in session.
 */
export async function fetchUserByEmailOrUsername(identifier: string): Promise<UserProfile | null> {
  try {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    if (!cleanId) return null;

    // 1. Try hashed email lookup if it contains '@'
    if (cleanId.includes('@')) {
      const emailHash = await hashEmail(cleanId);
      if (emailHash) {
        const indexSnap = await getDoc(doc(db, 'email_index', emailHash));
        if (indexSnap.exists()) {
          const { userId } = indexSnap.data() as { userId?: string };
          if (userId) {
            return await fetchUserFromDB(userId);
          }
        }
      }
    }

    // 2. Try matching by username
    const usersRef = collection(db, 'users');
    const usernameQuery = query(usersRef, where('username', '==', cleanId));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) {
      return await fetchUserFromDB(usernameSnap.docs[0].id);
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
      updatedAt: new Date().toISOString(),
    });
    await setDoc(dealRef, cleanedDealData, { merge: true });
  } catch (error) {
    console.error('[Firestore] Error saving deal:', error);
    throw error;
  }
}

/**
 * Real-time Chat Messaging: Broadcast message to Firebase Firestore
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
      updatedAt: new Date().toISOString(),
    });
    await setDoc(msgRef, cleanedMsg, { merge: true });
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
        if (!channelId || !data.channelId || data.channelId === channelId) {
          msgs.push({ ...data, id: d.id });
        }
      });
      msgs.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b.id.replace(/\D/g, ''), 10) || 0;
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
 * Update View-Once Media state in Firestore & purge chunks on expiry
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
      const chunkIdToPurge = currentMedia.chunkedMediaId;

      const updatedMedia: ViewOnceMedia = {
        ...currentMedia,
        ...updates,
        opened: updates.opened !== undefined ? updates.opened : true,
        isExpired: updates.isExpired !== undefined ? updates.isExpired : true,
        url: '',
        chunkedMediaId: '',
        openedAt: updates.openedAt || new Date().toISOString(),
      };
      await setDoc(
        msgRef,
        {
          viewOnceMedia: cleanFirestoreData(updatedMedia),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (chunkIdToPurge) {
        deleteChunkedMedia(chunkIdToPurge).catch(() => {});
      }
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
 * Subscribe to chat channels in real time
 */
export function subscribeChannels(onUpdate: (channels: Channel[]) => void): () => void {
  const chRef = collection(db, 'channels');
  return onSnapshot(
    chRef,
    (snapshot) => {
      const list: Channel[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Channel);
      });
      onUpdate(list);
    },
    (err) => {
      console.error('[Firestore] Realtime channels subscription error:', err);
    }
  );
}

function sanitizePublicUserRecord(docId: string, raw: Record<string, any>): UserProfile {
  const { email: _e, recoveryEmail: _r, kycData: _k, ...publicRest } = raw;
  const isRoot = !!publicRest.isRootOwner;
  return {
    ...publicRest,
    id: docId,
    email: '', // Strictly redacted for non-owner queries
    recoveryEmail: '',
    isRootOwner: isRoot,
    isAdmin: isRoot ? true : !!publicRest.isAdmin,
    permissions: isRoot
      ? { canManageAdmins: true, canManageKYC_Escrow: true }
      : publicRest.permissions || { canManageAdmins: false, canManageKYC_Escrow: false },
  } as UserProfile;
}

/**
 * Fetch all registered users (STRICT PRIVACY: never returns email, recoveryEmail, or raw kycData)
 */
export async function fetchAllUsersFromDB(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users: UserProfile[] = [];
    snapshot.forEach((d) => {
      users.push(sanitizePublicUserRecord(d.id, d.data()));
    });
    return users;
  } catch (error) {
    console.error('[Firestore] Error fetching all users:', error);
    return [];
  }
}

/**
 * Real-time subscription to all registered users (STRICT PRIVACY: never returns emails)
 */
export function subscribeAllUsers(onUpdate: (users: UserProfile[]) => void): () => void {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((d) => {
        users.push(sanitizePublicUserRecord(d.id, d.data()));
      });
      onUpdate(users);
    },
    (err) => {
      console.error('[Firestore] Real-time users listener error:', err);
    }
  );
}

/**
 * Save an audit log entry to Firestore (redacts target email)
 */
export async function saveAuditLogInDB(log: AdminAuditLog): Promise<void> {
  try {
    const logId = log.id || `audit-${Date.now()}`;
    const logRef = doc(db, 'audit_logs', logId);
    const { targetUserEmail: _redacted, ...safeLog } = log;
    await setDoc(
      logRef,
      cleanFirestoreData({
        ...safeLog,
        id: logId,
        timestamp: log.timestamp || new Date().toISOString(),
      })
    );
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
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(logs);
    },
    (err) => {
      console.error('[Firestore] Audit log subscription error:', err);
    }
  );
}

/**
 * Update Admin Permissions for a user
 */
export async function updateUserPermissionsInDB(
  targetUserId: string,
  updates: {
    isAdmin: boolean;
    permissions: AdminPermissions;
    updatedByEmail: string;
    updatedByName?: string;
    targetUserName?: string;
  }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', targetUserId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      throw new Error(`User ${targetUserId} not found`);
    }

    const userData = sanitizePublicUserRecord(snap.id, snap.data());

    const actorProfile: Partial<UserProfile> = {
      email: updates.updatedByEmail,
      name: updates.updatedByName,
      isRootOwner: isRootOwner(updates.updatedByEmail),
    };

    const check = canActorModifyTargetAdmin(actorProfile, userData);
    if (!check.allowed) {
      throw new Error(check.reason || 'Permission denied: Action blocked by security hierarchy.');
    }

    const updatedPermissions: AdminPermissions = {
      canManageAdmins: !!updates.permissions.canManageAdmins,
      canManageKYC_Escrow: !!updates.permissions.canManageKYC_Escrow,
      grantedAt: new Date().toISOString(),
      grantedBy: updates.updatedByName || 'Admin',
    };

    await setDoc(
      userRef,
      {
        ...cleanFirestoreData({
          isAdmin: updates.isAdmin,
          permissions: updatedPermissions,
          updatedAt: new Date().toISOString(),
        }),
        email: deleteField(),
        recoveryEmail: deleteField(),
        kycData: deleteField(),
      },
      { merge: true }
    );

    await saveAuditLogInDB({
      id: `audit-${Date.now()}`,
      action: updates.isAdmin ? 'promote_admin' : 'revoke_admin',
      actorEmail: updates.updatedByEmail,
      actorName: updates.updatedByName || 'Admin',
      targetUserId,
      targetUserName: updates.targetUserName || userData.name,
      details: updates.isAdmin
        ? `Delegated Admin permissions updated for ${userData.name} (@${userData.username || 'user'}): canManageAdmins=${updatedPermissions.canManageAdmins}, canManageKYC_Escrow=${updatedPermissions.canManageKYC_Escrow}`
        : `Admin access demoted/revoked for ${userData.name} (@${userData.username || 'user'})`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[Firestore] Error updating permissions for ${targetUserId}:`, error);
    throw error;
  }
}

/**
 * 1-Click Revoke Admin Access for Root Owner
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

    const userData = sanitizePublicUserRecord(snap.id, snap.data());
    if (isProfileRootOwner(userData)) {
      throw new Error('Security violation: The Root Owner cannot be revoked.');
    }

    await setDoc(
      userRef,
      {
        ...cleanFirestoreData({
          isAdmin: false,
          permissions: {
            canManageAdmins: false,
            canManageKYC_Escrow: false,
          },
          updatedAt: new Date().toISOString(),
        }),
        email: deleteField(),
        recoveryEmail: deleteField(),
        kycData: deleteField(),
      },
      { merge: true }
    );

    await saveAuditLogInDB({
      id: `audit-${Date.now()}`,
      action: 'revoke_admin',
      actorEmail: revokedByEmail,
      actorName: revokedByName || 'Root Owner',
      targetUserId,
      targetUserName: userData.name,
      details: `1-Click Revocation: Demoted delegated admin ${userData.name} (@${userData.username || 'user'}) back to standard role.`,
      timestamp: new Date().toISOString(),
    });
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

    const currentData = sanitizePublicUserRecord(snap.id, snap.data());
    const privSnap = await getDoc(doc(db, 'users', targetUserId, 'private', 'sensitiveData'));
    const currentKycData = privSnap.exists() ? (privSnap.data()?.kycData || {}) : {};

    await setDoc(
      userRef,
      {
        ...cleanFirestoreData({
          kycStatus: status,
          hasVerifiedBadge: status === 'verified',
          updatedAt: new Date().toISOString(),
        }),
        email: deleteField(),
        recoveryEmail: deleteField(),
        kycData: deleteField(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'users', targetUserId, 'private', 'sensitiveData'),
      cleanFirestoreData({
        kycData: {
          ...currentKycData,
          reviewedAt: new Date().toISOString(),
          rejectionReason: rejectionReason || undefined,
        },
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    await saveAuditLogInDB({
      id: `audit-${Date.now()}`,
      action: status === 'verified' ? 'kyc_approved' : 'kyc_rejected',
      actorEmail: reviewerEmail,
      actorName: reviewerName || 'Admin Reviewer',
      targetUserId,
      targetUserName: currentData.name,
      details: `KYC submission for ${currentData.name} (@${currentData.username || 'user'}) marked as ${status.toUpperCase()}${
        rejectionReason ? `: ${rejectionReason}` : ''
      }`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[Firestore] Error updating KYC status for ${targetUserId}:`, error);
    throw error;
  }
}
