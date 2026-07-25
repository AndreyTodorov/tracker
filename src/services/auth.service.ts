import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { ref, set, get, update, onValue } from 'firebase/database';
import { auth, db } from '../config/firebase';
import type { User } from '../types';
import { generateShareCode } from '../utils/calculations';

// Mirrors the limit enforced by database rules, so an over-long name fails
// with a readable message instead of a permission error.
export const MAX_DISPLAY_NAME_LENGTH = 64;

// Generate a share code that isn't already in use by another user.
// Uniqueness is checked against the shareCodeIndex (per-code lookups only,
// since the users node is not readable by other accounts).
const generateUniqueShareCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const shareCode = generateShareCode();
    const existing = await get(ref(db, `shareCodeIndex/${shareCode}`));
    if (!existing.exists()) {
      return shareCode;
    }
  }
  // Returning a known-colliding code used to hand out a share code whose index
  // entry belongs to somebody else. Failing is recoverable: the next sign-in
  // repairs the account with a freshly generated code.
  throw new Error('Could not generate an unused share code. Please try again.');
};

/**
 * Guarantees the database records backing an account exist.
 *
 * Account creation is several writes after the Firebase auth account itself,
 * and a failure in any of them used to leave an account that could sign in but
 * had no record: no display name, no share code, unable to add investments,
 * and impossible to re-register because the email was taken. Running this
 * check on every sign-in repairs those accounts, and makes signup safe to
 * interrupt.
 *
 * Idempotent: a healthy account performs reads only.
 */
export const ensureUserRecord = async (
  user: FirebaseUser,
  displayNameHint?: string
): Promise<void> => {
  const snapshot = await get(ref(db, `users/${user.uid}`));
  const existing = snapshot.exists() ? (snapshot.val() as User) : null;

  const displayName =
    (existing?.displayName || displayNameHint || user.displayName || '').trim() || 'Anonymous';
  const shareCode = existing?.shareCode || (await generateUniqueShareCode());

  if (!existing) {
    const userDoc: User = {
      id: user.uid,
      email: user.email ?? '',
      displayName,
      createdAt: Date.now(),
      shareCode,
      sharedPortfolios: {},
    };
    await set(ref(db, `users/${user.uid}`), userDoc);
  }

  // Checked separately: the record can exist while the lookup entry that makes
  // the share code usable does not.
  const indexSnapshot = await get(ref(db, `shareCodeIndex/${shareCode}`));
  if (!indexSnapshot.exists()) {
    // Public, PII-free lookup entry so others can resolve the code to a portfolio.
    await set(ref(db, `shareCodeIndex/${shareCode}`), {
      uid: user.uid,
      displayName,
    });
  }
};

export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> => {
  const name = displayName.trim();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });
  await ensureUserRecord(user, name);

  return user;
};

/**
 * Renames a user everywhere the name is stored.
 *
 * The display name is denormalised into the share-code index, the public
 * profile and every investment the user owns, because none of those readers
 * can see the private users node. Without this they drift permanently: an old
 * name would keep showing to everyone viewing a shared portfolio.
 *
 * All database copies go in one multi-path update, which Firebase applies
 * atomically, so a failure cannot leave the copies disagreeing. The Firebase
 * auth profile is a separate system and is updated after.
 */
export const updateDisplayName = async (
  user: FirebaseUser,
  displayName: string
): Promise<void> => {
  const name = displayName.trim();
  if (!name) {
    throw new Error('Display name is required');
  }
  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new Error(`Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer`);
  }

  const userSnapshot = await get(ref(db, `users/${user.uid}`));
  if (!userSnapshot.exists()) {
    throw new Error('Your account record is missing. Please sign out and back in.');
  }
  const existing = userSnapshot.val() as User;

  const updates: Record<string, unknown> = {
    [`users/${user.uid}/displayName`]: name,
  };

  if (existing.shareCode) {
    // Written as a whole entry rather than just the displayName child: the
    // rule guarding this node inspects the uid being written, so supplying it
    // explicitly avoids depending on how a partial write is merged.
    updates[`shareCodeIndex/${existing.shareCode}`] = {
      uid: user.uid,
      displayName: name,
    };
  }

  // Only listed users have a public profile, and writing one would silently
  // opt them in to the Everyone tab.
  const publicProfile = await get(ref(db, `publicProfiles/${user.uid}`));
  if (publicProfile.exists()) {
    updates[`publicProfiles/${user.uid}`] = { displayName: name };
  }

  const investments = await get(ref(db, `investments/${user.uid}`));
  if (investments.exists()) {
    Object.keys(investments.val() as Record<string, unknown>).forEach((investmentId) => {
      updates[`investments/${user.uid}/${investmentId}/userName`] = name;
    });
  }

  await update(ref(db), updates);
  await updateProfile(user, { displayName: name });
};

export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // Repairs accounts left incomplete by an interrupted signup. A failure here
  // must not keep out a user whose account is already fine, so it is logged
  // rather than thrown.
  await ensureUserRecord(userCredential.user).catch((error) => {
    console.error('Could not verify user record:', error);
  });

  return userCredential.user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getUserData = async (userId: string): Promise<User | null> => {
  const userSnapshot = await get(ref(db, `users/${userId}`));

  if (userSnapshot.exists()) {
    return userSnapshot.val() as User;
  }

  return null;
};

// Subscribe to live updates of a user's document (e.g. so joining/leaving a
// shared portfolio is reflected without a page reload).
export const subscribeToUserData = (
  userId: string,
  callback: (user: User | null) => void
): (() => void) => {
  const userRef = ref(db, `users/${userId}`);
  return onValue(
    userRef,
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.val() as User) : null);
    },
    (error) => {
      console.error('Error subscribing to user data:', error);
      callback(null);
    }
  );
};
