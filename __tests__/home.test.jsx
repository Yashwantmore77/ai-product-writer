import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../app/page';

describe('Home page', () => {
  test('renders hero heading and CTA', () => {
    render(<Home />);
    expect(screen.getByText(/Write product descriptions that actually sell/i)).toBeInTheDocument();
    // CTA link to /generate
    const cta = screen.getAllByText(/Get Started/i)[0];
    expect(cta).toBeInTheDocument();
  });
});
