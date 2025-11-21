import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../config/firebase';
import type { User } from '../types';
import { generateShareCode } from '../utils/calculations';

export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update profile with display name
  await updateProfile(user, { displayName });

  // Create user document in Realtime Database
  const shareCode = generateShareCode();
  const userDoc: User = {
    id: user.uid,
    email: user.email!,
    displayName,
    createdAt: Date.now(),
    shareCode,
    sharedPortfolios: [],
  };

  await set(ref(db, `users/${user.uid}`), userDoc);

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
