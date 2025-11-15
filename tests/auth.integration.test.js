const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const { initDb, db } = require("../database");
const authController = require("../auth.controller");
const { verifyAccessToken } = require("../auth.middleware");

process.env.DATABASE_PATH = ":memory:";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.post("/api/register", authController.register);
app.post("/api/login", authController.login);
app.post("/api/refresh", authController.refresh);
app.post("/api/logout", authController.logout);
app.get("/api/profile", verifyAccessToken, authController.getProfile);

describe("Auth API - Integration Tests", () => {
  beforeAll(async () => {
    await initDb();
  });

  afterAll((done) => {
    db.close(done);
  });

  beforeEach(async () => {
    await new Promise((resolve) => db.run("DELETE FROM sessions", resolve));
    await new Promise((resolve) => db.run("DELETE FROM users", resolve));
  });

  describe("POST /api/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/register")
        .send({ username: "testuser", password: "password123" });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Пользователь успешно зарегистрирован.");
    });

    it("should fail if username already exists", async () => {
      await request(app)
        .post("/api/register")
        .send({ username: "testuser", password: "password123" });

      const res = await request(app)
        .post("/api/register")
        .send({ username: "testuser", password: "password123" });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe(
        "Пользователь с таким именем уже существует."
      );
    });
  });

  describe("POST /api/login", () => {
    let userCredentials = { username: "loginuser", password: "password123" };

    beforeEach(async () => {
      await request(app).post("/api/register").send(userCredentials);
    });

    it("should login the user and return tokens", async () => {
      const res = await request(app).post("/api/login").send(userCredentials);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Вход выполнен успешно.");
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.username).toBe(userCredentials.username);
      expect(res.headers["set-cookie"][0]).toContain("jwt=");
    });

    it("should fail with wrong credentials", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ username: "loginuser", password: "wrongpassword" });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Неверные учетные данные.");
    });
  });
});
