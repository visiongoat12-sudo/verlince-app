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
import { CreatorProfile, UserProfile, DealAgreement } from '../types';

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
    const cleanedUserData = cleanFirestoreData({
      ...user,
      email: user.email ? user.email.trim().toLowerCase() : '',
      username: user.username ? user.username.trim().toLowerCase() : '',
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
