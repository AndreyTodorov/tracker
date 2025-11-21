import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Investment } from '../types';

export const addInvestment = async (
  userId: string,
  userName: string,
  assetName: string,
  assetSymbol: string,
  buyPrice: number,
  investmentAmount: number
): Promise<string> => {
  const quantity = investmentAmount / buyPrice;

  const investmentData = {
    userId,
    userName,
    assetName,
    assetSymbol,
    buyPrice,
    investmentAmount,
    quantity,
    purchaseDate: Timestamp.now(),
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'investments'), investmentData);
  return docRef.id;
};

export const updateInvestment = async (
  investmentId: string,
  updates: Partial<Investment>
): Promise<void> => {
  const investmentRef = doc(db, 'investments', investmentId);
  await updateDoc(investmentRef, updates);
};

export const deleteInvestment = async (investmentId: string): Promise<void> => {
  const investmentRef = doc(db, 'investments', investmentId);
  await deleteDoc(investmentRef);
};

export const subscribeToUserInvestments = (
  userId: string,
  callback: (investments: Investment[]) => void
): (() => void) => {
  const q = query(collection(db, 'investments'), where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const investments: Investment[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Investment[];

    callback(investments);
  });
};

export const subscribeToSharedInvestments = (
  shareCodes: string[],
  callback: (investments: Investment[]) => void
): (() => void) => {
  if (shareCodes.length === 0) {
    callback([]);
    return () => {};
  }

  // First get user IDs from share codes
  const getUserIdsFromShareCodes = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('shareCode', 'in', shareCodes));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.id);
  };

  getUserIdsFromShareCodes().then((userIds) => {
    if (userIds.length === 0) {
      callback([]);
      return;
    }

    const q = query(collection(db, 'investments'), where('userId', 'in', userIds));

    return onSnapshot(q, (snapshot) => {
      const investments: Investment[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Investment[];

      callback(investments);
    });
  });

  return () => {};
};

export const subscribeToAllInvestments = (
  callback: (investments: Investment[]) => void
): (() => void) => {
  const q = query(collection(db, 'investments'));

  return onSnapshot(q, (snapshot) => {
    const investments: Investment[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Investment[];

    callback(investments);
  });
};

export const addSharedPortfolio = async (
  userId: string,
  shareCode: string
): Promise<boolean> => {
  // Verify share code exists
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('shareCode', '==', shareCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return false;
  }

  // Add to user's shared portfolios
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    sharedPortfolios: arrayUnion(shareCode),
  });

  return true;
};

export const getUserByShareCode = async (shareCode: string): Promise<string | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('shareCode', '==', shareCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const userData = snapshot.docs[0].data();
  return userData.displayName || userData.email;
};
