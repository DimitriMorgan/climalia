/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  // 'node' env is used for the API/store tests because jsdom strips Node 22's fetch globals.
  // Component tests (Section 3+) will switch to jsdom per-file via @jest-environment docblock.
  testEnvironment: 'node',
  // NOTE: plan said 'setupFilesAfterEach' — Jest's actual option is 'setupFilesAfterEnv'
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.test.json',
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
