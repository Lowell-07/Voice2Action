/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';
import { AuthProvider } from '@/context/auth-context';
import { ProblemProvider } from '@/context/problem-context';

// Mock the useProblems hook
jest.mock('@/context/problem-context', () => ({
  ...jest.requireActual('@/context/problem-context'),
  useProblems: () => ({
    problems: [],
    voteOnProblem: jest.fn(),
  }),
}));

describe('Page', () => {
  it('renders a heading', () => {
    render(
        <AuthProvider>
            <ProblemProvider>
                <Page />
            </ProblemProvider>
        </AuthProvider>
    );

    const heading = screen.getByRole('heading', {
      name: /Dashboard/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
