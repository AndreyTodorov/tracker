import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useInvestments } from './useInvestments';
import {
  subscribeToUserInvestments,
  subscribeToPublicInvestments,
  subscribeToSharedInvestments,
} from '../services/investment.service';
import { mockInvestment } from '../test/test-utils';
import type { Investment, TabType } from '../types';

vi.mock('../services/investment.service', () => ({
  subscribeToUserInvestments: vi.fn(),
  subscribeToPublicInvestments: vi.fn(),
  subscribeToSharedInvestments: vi.fn(),
}));

// Stable references, as the real AuthContext provides. Returning fresh object
// literals here would retrigger the subscription effect on every render and
// mask the very behaviour these tests check.
const AUTH = {
  currentUser: { uid: 'me' },
  userData: { sharedPortfolios: {} },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => AUTH,
}));

// Records what the hook exposed on *every* render, including the intermediate
// one between a tab switch and the effect that resubscribes. That render is
// where stale data leaks into the new tab, and act() would otherwise hide it.
interface RenderRecord {
  tab: TabType;
  ids: string[];
  loading: boolean;
}

const renders: RenderRecord[] = [];

const Probe = ({ tab }: { tab: TabType }) => {
  const { investments, loading } = useInvestments(tab);
  renders.push({ tab, ids: investments.map((i) => i.id), loading });
  return null;
};

describe('useInvestments', () => {
  let emitPublic: (data: Investment[]) => void;
  let emitUser: (data: Investment[]) => void;

  beforeEach(() => {
    renders.length = 0;
    vi.mocked(subscribeToPublicInvestments).mockImplementation((cb) => {
      emitPublic = cb;
      return () => {};
    });
    vi.mocked(subscribeToUserInvestments).mockImplementation((_uid, cb) => {
      emitUser = cb;
      return () => {};
    });
    vi.mocked(subscribeToSharedInvestments).mockImplementation(() => () => {});
  });

  it('never exposes another tab\'s investments as loaded data', () => {
    const { rerender } = render(<Probe tab="all" />);

    act(() => {
      emitPublic([mockInvestment({ id: 'someone-else' }) as Investment]);
    });

    rerender(<Probe tab="my" />);

    const leaked = renders.filter(
      (r) => r.tab === 'my' && !r.loading && r.ids.includes('someone-else')
    );
    expect(leaked).toEqual([]);
  });

  it('shows the new tab\'s investments once they arrive', () => {
    const { rerender } = render(<Probe tab="all" />);

    act(() => {
      emitPublic([mockInvestment({ id: 'someone-else' }) as Investment]);
    });

    rerender(<Probe tab="my" />);
    act(() => {
      emitUser([mockInvestment({ id: 'mine' }) as Investment]);
    });

    const last = renders[renders.length - 1];
    expect(last).toEqual({ tab: 'my', ids: ['mine'], loading: false });
  });
});
