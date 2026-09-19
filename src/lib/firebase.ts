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
    'creator-siddharth-nair'
  ];

  try {
    for (const id of demoCreatorIds) {
      const creatorRef = doc(db, 'creators', id);
      const snap = await getDoc(creatorRef);
      if (snap.exists()) {
        await deleteDoc(creatorRef);
        console.log(`[Firestore] Purged demo creator listing: ${id}`);
      }
    }

    const demoUserRef = doc(db, 'users', 'user-001');
    const userSnap = await getDoc(demoUserRef);
    if (userSnap.exists()) {
      await deleteDoc(demoUserRef);
      console.log('[Firestore] Purged demo user: user-001');
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
 * Save or update a creator profile in the Firestore database
 */
export async function saveCreatorToDB(creator: CreatorProfile): Promise<void> {
  try {
    const creatorRef = doc(db, 'creators', creator.id);
    await setDoc(creatorRef, {
      ...creator,
      updatedAt: new Date().toISOString()
    }, { merge: true });
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
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // If the user is an editor, automatically synchronize/create their creator listing
    if (user.role === 'editor') {
      const creatorRef = doc(db, 'creators', user.id);
      await setDoc(creatorRef, {
        id: user.id,
        userId: user.id,
        name: user.name,
        username: user.username || user.name.toLowerCase().replace(/\s+/g, '_'),
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
      }, { merge: true });
    }

    console.log(`[Firestore] User saved: ${user.name} (${user.id})`);
  } catch (error) {
    console.error('[Firestore] Error saving user:', error);
    throw error;
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
 * Fetch all deals from Firestore
 */
export async function fetchDealsFromDB(): Promise<DealAgreement[]> {
  try {
    const dealsRef = collection(db, 'deals');
    const snapshot = await getDocs(dealsRef);
    const deals: DealAgreement[] = [];
    snapshot.forEach((d) => {
      deals.push({ id: d.id, ...d.data() } as DealAgreement);
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
        deals.push({ id: d.id, ...d.data() } as DealAgreement);
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
    await setDoc(dealRef, {
      ...deal,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firestore] Deal persisted: ${deal.id}`);
  } catch (error) {
    console.error('[Firestore] Error saving deal:', error);
    throw error;
  }
}
