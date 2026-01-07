// Setup file for Jest tests

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock window object
global.window = global;

// Mock AudioContext for Node.js environment
global.AudioContext = jest.fn();
global.webkitAudioContext = jest.fn();

// Mock prompt and alert
global.prompt = jest.fn();
global.alert = jest.fn();

// Mock fetch if needed
global.fetch = jest.fn();
