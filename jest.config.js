module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  roots: ["<rootDir>/test"],
  setupFiles: ["dotenv/config"],
  testEnvironmentOptions: {
    env: {
      NODE_ENV: "test"
    }
  }
};
