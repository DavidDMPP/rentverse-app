/**
 * Jest Setup File
 * 
 * Mocks for React Native and Expo modules that don't work in Node environment
 */

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-native Platform to avoid importing real react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: () => null },
}));

// Provide a minimal localStorage polyfill for tests running in Node
if (typeof global.localStorage === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = new Map();
  // @ts-ignore
  global.localStorage = {
    getItem: jest.fn((key) => (storage.has(key) ? storage.get(key) : null)),
    setItem: jest.fn((key, value) => storage.set(key, String(value))),
    removeItem: jest.fn((key) => storage.delete(key)),
    clear: jest.fn(() => storage.clear()),
  };
}
