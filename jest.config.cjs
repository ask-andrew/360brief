module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^__tests__/(.*)$': '<rootDir>/__tests__/$1',
    '^@auth0/nextjs-auth0$': '<rootDir>/__mocks__/next-auth0.js',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'services/**/*.ts',
    'pages/api/**/*.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setupTests.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@google-cloud/secret-manager|@auth0/nextjs-auth0)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
  ],
  moduleDirectories: [
    'node_modules',
    '<rootDir>',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },
};
