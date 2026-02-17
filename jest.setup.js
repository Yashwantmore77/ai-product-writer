// jest-dom v6+ exports matchers from the package root
import '@testing-library/jest-dom';

// Minimal global fetch mock if not available — tests will override as needed
if (!global.fetch) {
  global.fetch = () => Promise.resolve({ ok: true, json: async () => ({}) });
}
