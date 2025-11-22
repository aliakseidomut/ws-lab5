const request = require("supertest");

const appUrl = "https://my-auth-app-staging.onrender.com";

describe("Auth API - Integration Tests against Live Server", () => {
  describe("POST /api/register", () => {
    const testUser = `testuser_${Date.now()}`;

    it("should register a new user successfully", async () => {
      const res = await request(appUrl)
        .post("/api/registerhukkh") /////////
        .send({ username: testUser, password: "password123" });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Пользователь успешно зарегистрирован.");
    });

    it("should fail if username already exists", async () => {
      await request(appUrl)
        .post("/api/register")
        .send({ username: testUser, password: "password123" });

      const res = await request(appUrl)
        .post("/api/register")
        .send({ username: testUser, password: "password123" });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe(
        "Пользователь с таким именем уже существует."
      );
    });
  });

  describe("POST /api/login", () => {
    const testUser = `loginuser_${Date.now()}`;
    const testPassword = "password123";

    it("should login the user and return tokens", async () => {
      await request(appUrl)
        .post("/api/register")
        .send({ username: testUser, password: testPassword });

      const res = await request(appUrl)
        .post("/api/login")
        .send({ username: testUser, password: testPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });
  });
});
