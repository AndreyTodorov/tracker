import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { LegalLinks } from './LegalLinks';

describe('LegalLinks', () => {
  it('links to the static Impressum and privacy pages', () => {
    render(<LegalLinks />);

    // Plain hrefs, not router paths: both pages live in public/, outside the app.
    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum/');
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
  });
});
