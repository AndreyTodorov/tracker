import { useState, useEffect, useMemo } from 'react';
import type { Investment, TabType } from '../types';
import {
  subscribeToUserInvestments,
  subscribeToSharedInvestments,
  subscribeToPublicInvestments,
} from '../services/investment.service';
import { useAuth } from '../context/AuthContext';

export const useInvestments = (tab: TabType) => {
  // The tab is stored alongside its data so a switch can be detected during
  // render. Tracking loading alone is not enough: the effect that resets it
  // runs after the render that follows the switch, so that render would
  // otherwise present the previous tab's investments as this tab's content.
  const [state, setState] = useState<{ tab: TabType; investments: Investment[] }>({
    tab,
    investments: [],
  });
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const uid = currentUser?.uid;

  // Stable key so the subscription restarts only when the joined portfolios
  // actually change, rather than on every unrelated userData update.
  const sharedOwnersKey = useMemo(
    () => Object.keys(userData?.sharedPortfolios || {}).sort().join(','),
    [userData]
  );

  useEffect(() => {
    if (!uid) {
      // Reset state when user logs out
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ tab, investments: [] });
      setLoading(false);
      return;
    }

    setLoading(true);

    const receive = (investments: Investment[]) => {
      setState({ tab, investments });
      setLoading(false);
    };

    let unsubscribe: (() => void) | undefined;

    if (tab === 'my') {
      unsubscribe = subscribeToUserInvestments(uid, receive);
    } else if (tab === 'shared') {
      const ownerUids = sharedOwnersKey ? sharedOwnersKey.split(',') : [];
      unsubscribe = subscribeToSharedInvestments(ownerUids, receive);
    } else {
      unsubscribe = subscribeToPublicInvestments(receive);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [uid, sharedOwnersKey, tab]);

  const isStale = state.tab !== tab;

  return {
    investments: isStale ? [] : state.investments,
    loading: isStale || loading,
  };
};
