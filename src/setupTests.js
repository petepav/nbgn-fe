import '@testing-library/jest-dom';

Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
  writable: true,
});

jest.mock('ethers', () => ({
  ethers: {
    providers: {
      Web3Provider: jest.fn(),
    },
    Contract: jest.fn(),
    utils: {
      parseEther: jest.fn(),
      formatEther: jest.fn(),
    },
  },
}));