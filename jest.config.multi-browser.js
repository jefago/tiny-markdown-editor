module.exports = {
  projects: [
    {
      displayName: 'chromium',
      testEnvironment: 'node',
      globalSetup: './jest/util/jest-global-setup.js',
      globalTeardown: './jest/util/jest-global-teardown.js',
      setupFiles: [
        "./jest/util/test-helpers.js"
      ],
      setupFilesAfterEnv: [
        "./jest/util/multi-browser-setup.js"
      ],
      testMatch: ['<rootDir>/jest/**/*.test.js'],
      globals: {
        BROWSER_TYPE: 'chromium'
      }
    },
    {
      displayName: 'firefox',
      testEnvironment: 'node',
      globalSetup: './jest/util/jest-global-setup.js',
      globalTeardown: './jest/util/jest-global-teardown.js',
      setupFiles: [
        "./jest/util/test-helpers.js"
      ],
      setupFilesAfterEnv: [
        "./jest/util/multi-browser-setup.js"
      ],
      testMatch: ['<rootDir>/jest/**/*.test.js'],
      globals: {
        BROWSER_TYPE: 'firefox'
      }
    },
    {
      displayName: 'webkit',
      testEnvironment: 'node',
      globalSetup: './jest/util/jest-global-setup.js',
      globalTeardown: './jest/util/jest-global-teardown.js',
      setupFiles: [
        "./jest/util/test-helpers.js"
      ],
      setupFilesAfterEnv: [
        "./jest/util/multi-browser-setup.js"
      ],
      testMatch: ['<rootDir>/jest/**/*.test.js'],
      globals: {
        BROWSER_TYPE: 'webkit'
      }
    }
  ]
};