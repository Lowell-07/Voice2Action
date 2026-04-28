/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';
jest.mock('@/app/dashboard-client', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-client">Dashboard</div>,
}));

describe('Page', () => {
  it('renders a heading', () => {
    render(<Page />);
    expect(screen.getByTestId('dashboard-client')).toHaveTextContent('Dashboard');
  });
});
