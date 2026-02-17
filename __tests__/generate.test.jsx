import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeneratePage from '../app/generate/page';

describe('GeneratePage basic render', () => {
  test('renders form header', () => {
    render(<GeneratePage />);
    const matches = screen.getAllByText(/Product Details/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('Chat widget', () => {
  beforeEach(() => {
    // ensure localStorage is clean between tests
    localStorage.removeItem('aiChatConversation');
    localStorage.removeItem('aiChatLastSeen');
  });

  test('chat button shows and opens widget; sending message calls /api/chat', async () => {
    // mock fetch for /api/chat
    const mockFetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ reply: 'Hello from AI', provider: 'TestProvider' }) }));
    global.fetch = mockFetch;

    render(<GeneratePage />);

    const chatButton = screen.getByRole('button', { name: /Chat|Close Chat/i });
    expect(chatButton).toBeInTheDocument();

    // Open chat
    fireEvent.click(chatButton);

    // Input should be present
    const input = screen.getByPlaceholderText(/Ask about product/i);
    expect(input).toBeInTheDocument();

    // Type and send message
    fireEvent.change(input, { target: { value: 'Hi AI' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    // Assistant reply should appear
    expect(await screen.findByText(/Hello from AI/)).toBeInTheDocument();
  });
});
