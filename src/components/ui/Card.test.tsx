import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Card } from './Card';

describe('Card Component', () => {
  it('should render card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should apply default variant', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toMatch(/bg-slate-900/);
    expect(card.className).toMatch(/border-slate-700/);
  });

  it('should apply strong variant', () => {
    render(<Card variant="strong" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toMatch(/bg-slate-800/);
    expect(card.className).toMatch(/border-slate-600/);
  });

  it('should apply hover effect when hover prop is true', () => {
    render(<Card hover data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toMatch(/hover:bg-slate-800/);
    expect(card.className).toMatch(/hover:shadow-lg/);
  });

  it('should not apply hover effect by default', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).not.toMatch(/hover:bg-slate-800/);
  });

  it('should accept custom className', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('custom-class');
  });

  it('should forward ref correctly', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should accept standard HTML div attributes', () => {
    render(
      <Card id="test-card" data-custom="value" data-testid="card">
        Content
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'test-card');
    expect(card).toHaveAttribute('data-custom', 'value');
  });

  it('should render nested content correctly', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should have rounded corners', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toMatch(/rounded-xl/);
  });

  it('should have transition animation', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toMatch(/transition-all/);
    expect(card.className).toMatch(/duration-300/);
  });
});
