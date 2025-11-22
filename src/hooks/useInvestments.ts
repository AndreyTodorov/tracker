import { useState, useEffect } from 'react';
import type { Investment, TabType } from '../types';
import {
  subscribeToUserInvestments,
  subscribeToSharedInvestments,
  subscribeToAllInvestments,
} from '../services/investment.service';
import { useAuth } from '../context/AuthContext';

export const useInvestments = (tab: TabType) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: (() => void) | undefined;

    if (tab === 'my') {
      unsubscribe = subscribeToUserInvestments(currentUser.uid, (data) => {
        setInvestments(data);
        setLoading(false);
      });
    } else if (tab === 'shared') {
      const shareCodes = userData?.sharedPortfolios || [];
      unsubscribe = subscribeToSharedInvestments(shareCodes, (data) => {
        setInvestments(data);
        setLoading(false);
      });
    } else {
      unsubscribe = subscribeToAllInvestments((data) => {
        setInvestments(data);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, userData, tab]);

  return { investments, loading };
};
