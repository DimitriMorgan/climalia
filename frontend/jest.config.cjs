/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  // NOTE: plan said 'setupFilesAfterEach' — Jest's actual option is 'setupFilesAfterEnv'
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: { jsx: 'react-jsx', module: 'ESNext', target: 'ES2022', moduleResolution: 'node' },
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
