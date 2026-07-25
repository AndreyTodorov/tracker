import {
  ref,
  push,
  set,
  remove,
  onValue,
  get,
  update,
} from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import { db } from '../config/firebase';
import { SUPPORTED_CURRENCY_CODES } from '../utils/currencies';
import type { Investment } from '../types';

// PII-free entry in the shareCodeIndex node (code -> owner lookup)
interface ShareCodeEntry {
  uid: string;
  displayName: string;
}

const VALID_CURRENCIES = SUPPORTED_CURRENCY_CODES;

// Input validation helper
const validateInvestmentInput = (
  buyPrice: number,
  investmentAmount: number,
  quantity: number,
  currency: string
): void => {
  if (buyPrice <= 0) {
    throw new Error('Buy price must be greater than 0');
  }
  if (investmentAmount <= 0) {
    throw new Error('Investment amount must be greater than 0');
  }
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if (!VALID_CURRENCIES.includes(currency.toUpperCase())) {
    throw new Error(`Invalid currency. Supported currencies: ${VALID_CURRENCIES.join(', ')}`);
  }
};

// Read all investments stored under a single user's node.
const snapshotToInvestments = (snapshot: DataSnapshot): Investment[] => {
  const investments: Investment[] = [];
  snapshot.forEach((childSnapshot) => {
    investments.push({
      id: childSnapshot.key!,
      ...childSnapshot.val(),
    } as Investment);
  });
  return investments;
};

const lookupShareCode = async (shareCode: string): Promise<ShareCodeEntry | null> => {
  const snapshot = await get(ref(db, `shareCodeIndex/${shareCode}`));
  return snapshot.exists() ? (snapshot.val() as ShareCodeEntry) : null;
};

export const addInvestment = async (
  userId: string,
  userName: string,
  assetName: string,
  assetSymbol: string,
  coinId: string,
  buyPrice: number,
  investmentAmount: number,
  quantity: number,
  currency: string,
  name?: string
): Promise<string> => {
  // Validate inputs
  if (!userId || !userName || !assetName || !assetSymbol || !coinId) {
    throw new Error('Missing required fields');
  }
  validateInvestmentInput(buyPrice, investmentAmount, quantity, currency);

  const investmentData = {
    userId,
    userName,
    assetName,
    assetSymbol,
    coinId,
    buyPrice,
    investmentAmount,
    quantity,
    currency: currency.toUpperCase(),
    purchaseDate: Date.now(),
    createdAt: Date.now(),
    ...(name && { name }), // Only include name if provided
  };

  const newInvestmentRef = push(ref(db, `investments/${userId}`));
  await set(newInvestmentRef, investmentData);
  return newInvestmentRef.key!;
};

export const updateInvestment = async (
  userId: string,
  investmentId: string,
  updates: Partial<Investment>
): Promise<void> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!investmentId) {
    throw new Error('Investment ID is required');
  }

  // Validate numeric fields if provided
  if (updates.buyPrice !== undefined && updates.buyPrice <= 0) {
    throw new Error('Buy price must be greater than 0');
  }
  if (updates.investmentAmount !== undefined && updates.investmentAmount <= 0) {
    throw new Error('Investment amount must be greater than 0');
  }
  if (updates.quantity !== undefined && updates.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if (updates.currency !== undefined && !VALID_CURRENCIES.includes(updates.currency.toUpperCase())) {
    throw new Error(`Invalid currency. Supported currencies: ${VALID_CURRENCIES.join(', ')}`);
  }

  // Normalize currency to uppercase if provided
  const normalizedUpdates = {
    ...updates,
    ...(updates.currency && { currency: updates.currency.toUpperCase() }),
  };

  const investmentRef = ref(db, `investments/${userId}/${investmentId}`);
  await update(investmentRef, normalizedUpdates);
};

export const deleteInvestment = async (userId: string, investmentId: string): Promise<void> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!investmentId) {
    throw new Error('Investment ID is required');
  }

  const investmentRef = ref(db, `investments/${userId}/${investmentId}`);
  await remove(investmentRef);
};

export const subscribeToUserInvestments = (
  userId: string,
  callback: (investments: Investment[]) => void
): (() => void) => {
  const investmentsRef = ref(db, `investments/${userId}`);

  return onValue(investmentsRef, (snapshot) => {
    callback(snapshotToInvestments(snapshot));
  });
};

// Subscribe to the investments of a set of portfolio owners, merging updates
// from each owner's node into a single list.
const subscribeToInvestmentsByOwners = (
  ownerUids: string[],
  callback: (investments: Investment[]) => void
): (() => void) => {
  if (ownerUids.length === 0) {
    callback([]);
    return () => {};
  }

  const investmentsByUser = new Map<string, Investment[]>();
  const unsubscribers = ownerUids.map((ownerUid) =>
    onValue(
      ref(db, `investments/${ownerUid}`),
      (snapshot) => {
        investmentsByUser.set(ownerUid, snapshotToInvestments(snapshot));
        callback(Array.from(investmentsByUser.values()).flat());
      },
      (error) => {
        // A single owner going private shouldn't break the whole view.
        console.error(`Error subscribing to investments of ${ownerUid}:`, error);
        investmentsByUser.set(ownerUid, []);
        callback(Array.from(investmentsByUser.values()).flat());
      }
    )
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};

export const subscribeToSharedInvestments = (
  ownerUids: string[],
  callback: (investments: Investment[]) => void
): (() => void) => {
  return subscribeToInvestmentsByOwners(ownerUids, callback);
};

// Investments of everyone who opted in to public listing (publicProfiles node).
export const subscribeToPublicInvestments = (
  callback: (investments: Investment[]) => void
): (() => void) => {
  let cancelled = false;
  let unsubscribe: (() => void) | undefined;

  get(ref(db, 'publicProfiles'))
    .then((snapshot) => {
      if (cancelled) {
        return;
      }
      const ownerUids = snapshot.exists() ? Object.keys(snapshot.val()) : [];
      unsubscribe = subscribeToInvestmentsByOwners(ownerUids, callback);
    })
    .catch((error) => {
      console.error('Error fetching public profiles:', error);
      callback([]);
    });

  return () => {
    cancelled = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

// Whether the user's portfolio is listed on the Everyone tab.
export const getPortfolioVisibility = async (userId: string): Promise<boolean> => {
  const snapshot = await get(ref(db, `publicProfiles/${userId}`));
  return snapshot.exists();
};

export const setPortfolioVisibility = async (
  userId: string,
  displayName: string,
  isPublic: boolean
): Promise<void> => {
  const profileRef = ref(db, `publicProfiles/${userId}`);
  if (isPublic) {
    await set(profileRef, { displayName: displayName || 'Anonymous' });
  } else {
    await remove(profileRef);
  }
};

export const addSharedPortfolio = async (
  userId: string,
  shareCode: string
): Promise<boolean> => {
  // Validate inputs
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!shareCode) {
    throw new Error('Share code is required');
  }

  const entry = await lookupShareCode(shareCode);
  if (!entry) {
    return false;
  }

  // Joining is recorded per owner uid so database rules can grant read access.
  await set(ref(db, `users/${userId}/sharedPortfolios/${entry.uid}`), shareCode);
  return true;
};

export const removeSharedPortfolio = async (
  userId: string,
  ownerUid: string
): Promise<void> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!ownerUid) {
    throw new Error('Owner ID is required');
  }

  await remove(ref(db, `users/${userId}/sharedPortfolios/${ownerUid}`));
};

export const getUserByShareCode = async (shareCode: string): Promise<string | null> => {
  if (!shareCode) {
    throw new Error('Share code is required');
  }

  const entry = await lookupShareCode(shareCode);
  return entry ? entry.displayName || 'Anonymous' : null;
};

export const getPublicPortfolio = async (
  shareCode: string,
  viewerUid: string
): Promise<{ investments: Investment[]; ownerName: string } | null> => {
  try {
    if (!shareCode) {
      throw new Error('Share code is required');
    }
    if (!viewerUid) {
      throw new Error('Viewer ID is required');
    }

    const entry = await lookupShareCode(shareCode);
    if (!entry) {
      return null;
    }

    // Knowing the code grants access: join the portfolio so database rules
    // allow reading the owner's investments (idempotent).
    if (entry.uid !== viewerUid) {
      await set(ref(db, `users/${viewerUid}/sharedPortfolios/${entry.uid}`), shareCode);
    }

    const investmentsSnapshot = await get(ref(db, `investments/${entry.uid}`));

    return {
      investments: snapshotToInvestments(investmentsSnapshot),
      ownerName: entry.displayName || 'Anonymous',
    };
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    return null;
  }
};
