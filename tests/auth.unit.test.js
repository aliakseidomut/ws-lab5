const jwt = require("jsonwebtoken");
const authService = require("../auth.service");

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret";

describe("Auth Service - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("verifyAccessToken", () => {
    it("should return payload if token is valid", () => {
      const mockPayload = { userId: "123", username: "test" };
      const token = "valid_token";

      jwt.verify.mockImplementation(() => mockPayload);

      const payload = authService.verifyAccessToken(token);

      expect(payload).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );
    });

    it("should return null if token is invalid", () => {
      const token = "invalid_token";

      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const payload = authService.verifyAccessToken(token);

      expect(payload).toBeNull();
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );
    });
  });

  describe("generateTokens", () => {
    it("should generate both access and refresh tokens", () => {
      const user = { id: "user-1", username: "testuser" };
      const sessionId = "session-1";

      jwt.sign
        .mockImplementationOnce(() => "mock_access_token")
        .mockImplementationOnce(() => "mock_refresh_token");

      const tokens = authService.generateTokens(user, sessionId);

      expect(tokens).toEqual({
        accessToken: "mock_access_token",
        refreshToken: "mock_refresh_token",
      });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });
});
