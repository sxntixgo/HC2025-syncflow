module.exports = {
  projects: [
    {
      displayName: 'server',
      testMatch: ['<rootDir>/server/**/*.test.js'],
      testEnvironment: 'node',
      collectCoverageFrom: [
        'server/**/*.js',
        '!server/node_modules/**',
        '!server/index.js'
      ]
    },
    {
      displayName: 'client',
      testMatch: ['<rootDir>/client/src/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.js'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }]
      },
      collectCoverageFrom: [
        'client/src/**/*.js',
        '!client/src/index.js',
        '!client/src/reportWebVitals.js'
      ]
    }
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    'client/src/**/*.js',
    '!**/node_modules/**',
    '!server/index.js',
    '!client/src/index.js',
    '!client/src/reportWebVitals.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};