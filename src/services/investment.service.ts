import {
  ref,
  push,
  set,
  remove,
  onValue,
  get,
  query,
  orderByChild,
  equalTo,
  update,
} from 'firebase/database';
import { db } from '../config/firebase';
import type { Investment } from '../types';

// Type for user data from database
interface UserData {
  email: string;
  displayName: string;
  shareCode?: string;
  sharedPortfolios?: string[];
}

// Supported currencies
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

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

  const newInvestmentRef = push(ref(db, 'investments'));
  await set(newInvestmentRef, investmentData);
  return newInvestmentRef.key!;
};

export const updateInvestment = async (
  investmentId: string,
  updates: Partial<Investment>
): Promise<void> => {
  // Validate investmentId
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

  const investmentRef = ref(db, `investments/${investmentId}`);
  await update(investmentRef, normalizedUpdates);
};

export const deleteInvestment = async (investmentId: string): Promise<void> => {
  if (!investmentId) {
    throw new Error('Investment ID is required');
  }

  const investmentRef = ref(db, `investments/${investmentId}`);
  await remove(investmentRef);
};

export const subscribeToUserInvestments = (
  userId: string,
  callback: (investments: Investment[]) => void
): (() => void) => {
  const investmentsRef = ref(db, 'investments');
  const userQuery = query(investmentsRef, orderByChild('userId'), equalTo(userId));

  return onValue(userQuery, (snapshot) => {
    const investments: Investment[] = [];
    snapshot.forEach((childSnapshot) => {
      investments.push({
        id: childSnapshot.key!,
        ...childSnapshot.val(),
      } as Investment);
    });
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

  // Get user IDs from share codes
  const getUserIdsFromShareCodes = async () => {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const userIds: string[] = [];

    if (snapshot.exists()) {
      const users = snapshot.val() as Record<string, { shareCode?: string }>;
      Object.entries(users).forEach(([userId, userData]) => {
        if (userData.shareCode && shareCodes.includes(userData.shareCode)) {
          userIds.push(userId);
        }
      });
    }

    return userIds;
  };

  let cancelled = false;
  const unsubscribers: (() => void)[] = [];

  getUserIdsFromShareCodes().then((userIds) => {
    // Don't set up subscriptions if already cancelled
    if (cancelled) {
      return;
    }

    if (userIds.length === 0) {
      callback([]);
      return;
    }

    const investmentsRef = ref(db, 'investments');
    // One indexed query per user (uses .indexOn "userId") instead of scanning
    // the whole table. Keep each user's latest result and merge on any update.
    const investmentsByUser = new Map<string, Investment[]>();

    userIds.forEach((userId) => {
      const userQuery = query(investmentsRef, orderByChild('userId'), equalTo(userId));
      const unsubscribe = onValue(userQuery, (snapshot) => {
        const userInvestments: Investment[] = [];
        snapshot.forEach((childSnapshot) => {
          userInvestments.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          } as Investment);
        });
        investmentsByUser.set(userId, userInvestments);
        callback(Array.from(investmentsByUser.values()).flat());
      });
      unsubscribers.push(unsubscribe);
    });
  }).catch((error) => {
    console.error('Error fetching user IDs from share codes:', error);
  });

  return () => {
    cancelled = true;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};

export const subscribeToAllInvestments = (
  callback: (investments: Investment[]) => void
): (() => void) => {
  const investmentsRef = ref(db, 'investments');

  return onValue(investmentsRef, (snapshot) => {
    const investments: Investment[] = [];
    snapshot.forEach((childSnapshot) => {
      investments.push({
        id: childSnapshot.key!,
        ...childSnapshot.val(),
      } as Investment);
    });
    callback(investments);
  });
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

  // Verify share code exists
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return false;
  }

  const users = snapshot.val() as Record<string, { shareCode?: string }>;
  const shareCodeExists = Object.values(users).some(
    (user) => user.shareCode === shareCode
  );

  if (!shareCodeExists) {
    return false;
  }

  // Get current user data
  const userRef = ref(db, `users/${userId}`);
  const userSnapshot = await get(userRef);

  if (!userSnapshot.exists()) {
    return false;
  }

  const userData = userSnapshot.val();
  const sharedPortfolios = userData.sharedPortfolios || [];

  // Add share code if not already present
  if (!sharedPortfolios.includes(shareCode)) {
    await update(userRef, {
      sharedPortfolios: [...sharedPortfolios, shareCode],
    });
  }

  return true;
};

export const removeSharedPortfolio = async (
  userId: string,
  shareCode: string
): Promise<void> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!shareCode) {
    throw new Error('Share code is required');
  }

  const userRef = ref(db, `users/${userId}`);
  const userSnapshot = await get(userRef);

  if (!userSnapshot.exists()) {
    return;
  }

  const userData = userSnapshot.val();
  const sharedPortfolios: string[] = userData.sharedPortfolios || [];

  await update(userRef, {
    sharedPortfolios: sharedPortfolios.filter((code) => code !== shareCode),
  });
};

export const getUserByShareCode = async (shareCode: string): Promise<string | null> => {
  if (!shareCode) {
    throw new Error('Share code is required');
  }

  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return null;
  }

  const users = snapshot.val() as Record<string, UserData>;
  for (const user of Object.values(users)) {
    if (user.shareCode === shareCode) {
      return user.displayName || user.email;
    }
  }

  return null;
};

export const getPublicPortfolio = async (
  shareCode: string
): Promise<{ investments: Investment[]; ownerName: string } | null> => {
  try {
    if (!shareCode) {
      throw new Error('Share code is required');
    }

    // Find user by share code
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return null;
    }

    const users = usersSnapshot.val() as Record<string, UserData>;
    let targetUserId: string | null = null;
    let ownerName = '';

    // Find the user with matching share code
    for (const [userId, userData] of Object.entries(users)) {
      if (userData.shareCode === shareCode) {
        targetUserId = userId;
        ownerName = userData.displayName || userData.email;
        break;
      }
    }

    if (!targetUserId) {
      return null;
    }

    // Get investments for this user
    const investmentsRef = ref(db, 'investments');
    const investmentsQuery = query(investmentsRef, orderByChild('userId'), equalTo(targetUserId));
    const investmentsSnapshot = await get(investmentsQuery);

    const investments: Investment[] = [];
    if (investmentsSnapshot.exists()) {
      investmentsSnapshot.forEach((childSnapshot) => {
        investments.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        } as Investment);
      });
    }

    return { investments, ownerName };
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    return null;
  }
};
