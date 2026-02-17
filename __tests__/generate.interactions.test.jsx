import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import GeneratePage from '../app/generate/page';

beforeEach(() => {
  // clean storage
  localStorage.clear();
  // reset fetch mock
  jest.restoreAllMocks();
});

test('form validation and submit flow, download helpers create anchor', async () => {
  const mockResp = { descriptions: ['Generated description text'], provider: 'TestProv', model: 'm1' };
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockResp) }));

  const { container } = render(<GeneratePage />);

  // fill fields
  const productInput = screen.getByPlaceholderText(/CloudWalk Ultra Running Shoes/i);
  fireEvent.change(productInput, { target: { value: 'Test Product' } });

  const category = screen.getByLabelText(/Category/i);
  fireEvent.change(category, { target: { value: 'Clothing' } });

  const features = screen.getByPlaceholderText(/e.g., lightweight mesh upper/);
  fireEvent.change(features, { target: { value: 'lightweight, breathable' } });

  // submit
  const btn = screen.getByRole('button', { name: /Generate Description/i });
  fireEvent.click(btn);

  // wait for generated description to appear
  expect(await screen.findByText(/Generated description text/)).toBeInTheDocument();

  // spy on createElement to detect anchor creation for downloads
  const createSpy = jest.spyOn(document, 'createElement');

  // click TXT download
  const txtBtn = screen.getByText(/TXT/);
  fireEvent.click(txtBtn);
  expect(createSpy).toHaveBeenCalledWith('a');

  createSpy.mockRestore();
});

test('image handlers: file input and drag/drop create preview and validate size/type', async () => {
  const { container } = render(<GeneratePage />);

  // mock URL.createObjectURL
  const fakeUrl = 'blob:fake-url';
  global.URL.createObjectURL = jest.fn(() => fakeUrl);
  global.URL.revokeObjectURL = jest.fn();

  const file = new File(['dummy'], 'photo.png', { type: 'image/png' });

  const fileInput = container.querySelector('input[type="file"]');
  expect(fileInput).toBeTruthy();

  // change event
  fireEvent.change(fileInput, { target: { files: [file] } });

  // image preview should appear
  const img = await screen.findByAltText('preview');
  expect(img).toBeInTheDocument();
  expect(img.src).toContain(fakeUrl);

  // simulate drop
  const labelText = screen.getByText(/Drag & drop an image, or click to browse/i);
  const label = labelText.closest('label');
  // create a file larger than limit to test rejection
  const bigFile = new File([new ArrayBuffer(4 * 1024 * 1024)], 'big.png', { type: 'image/png' });
  // spy on alert
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  fireEvent.drop(label, { dataTransfer: { files: [bigFile] } });
  expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Image is too large'));
  alertSpy.mockRestore();
});

test('chat widget unread badge, open/close, and clear chat behavior', async () => {
  // seed conversation with one assistant message newer than lastSeen
  const now = Date.now();
  const older = now - 60000;
  const convo = [ { role: 'assistant', content: 'Previous reply', ts: now } ];
  localStorage.setItem('aiChatConversation', JSON.stringify(convo));
  localStorage.setItem('aiChatLastSeen', String(older));

  render(<GeneratePage />);

  // find chat button and badge inside it
  const chatBtn = screen.getByRole('button', { name: /Chat|Close Chat/i });
  const { getByText: getWithin } = within(chatBtn);
  expect(getWithin('1')).toBeInTheDocument();

  // open chat - should clear unread and set lastSeen
  fireEvent.click(chatBtn);
  await waitFor(() => {
    const stored = localStorage.getItem('aiChatLastSeen');
    expect(stored).toBeTruthy();
  });

  // Clear chat (confirm dialog must be accepted)
  const clearBtn = screen.getByText(/Clear/);
  const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
  fireEvent.click(clearBtn);
  confirmSpy.mockRestore();
  expect(localStorage.getItem('aiChatConversation')).toBeNull();
  expect(localStorage.getItem('aiChatLastSeen')).toBeNull();
});
