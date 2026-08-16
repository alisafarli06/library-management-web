import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

afterEach(() => {
  cleanup();
});
