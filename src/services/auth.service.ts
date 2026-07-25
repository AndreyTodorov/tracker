import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { ref, set, get, onValue } from 'firebase/database';
import { auth, db } from '../config/firebase';
import type { User } from '../types';
import { generateShareCode } from '../utils/calculations';

// Generate a share code that isn't already in use by another user.
// Uniqueness is checked against the shareCodeIndex (per-code lookups only,
// since the users node is not readable by other accounts).
const generateUniqueShareCode = async (): Promise<string> => {
  let shareCode = generateShareCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await get(ref(db, `shareCodeIndex/${shareCode}`));
    if (!existing.exists()) {
      return shareCode;
    }
    shareCode = generateShareCode();
    attempts += 1;
  }
  return shareCode;
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
