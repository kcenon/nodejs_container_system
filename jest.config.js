module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Lower branch threshold for value_store.ts due to defensive error handling
    // that is difficult to trigger in normal test conditions
    './src/core/value_store.ts': {
      branches: 50,
      functions: 100,
      lines: 95,
      statements: 95
    },
    // Lower branch threshold for wire_protocol.ts due to complex parsing logic
    // with defensive error handling for malformed input
    './src/core/wire_protocol.ts': {
      branches: 75,
      functions: 100,
      lines: 80,
      statements: 80
    }
  }
};
