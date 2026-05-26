module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  clearMocks: true,
};