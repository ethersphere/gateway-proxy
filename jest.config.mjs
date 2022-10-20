/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default async () => {
  return {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',

    // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: false,

    // This will setup the prerequisites for the tests to run
    globalSetup: './jest/postage-setup.js',

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: ['/node_modules/'],

    // An array of directory names to be searched recursively up from the requiring module's location
    moduleDirectories: ['node_modules'],

    // The root directory that Jest should scan for tests and modules within
    rootDir: 'test',

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: ['/node_modules/'],

    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
      '^.+\\.m?[tj]sx?$': [
        'ts-jest',
        {
          useESM: true,
        },
      ],
    },
  }
}
