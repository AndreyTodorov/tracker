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

export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> => {
  const name = displayName.trim();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update profile with display name
  await updateProfile(user, { displayName: name });

  // Create user document in Realtime Database
  const shareCode = await generateUniqueShareCode();
  const userDoc: User = {
    id: user.uid,
    email: user.email!,
    displayName: name,
    createdAt: Date.now(),
    shareCode,
    sharedPortfolios: {},
  };

  await set(ref(db, `users/${user.uid}`), userDoc);
  // Public, PII-free lookup entry so others can resolve the code to a portfolio.
  await set(ref(db, `shareCodeIndex/${shareCode}`), {
    uid: user.uid,
    displayName: name,
  });

  return user;
};

export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
