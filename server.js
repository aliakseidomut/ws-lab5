require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { initDb } = require("./database");
const authController = require("./auth.controller");
const { verifyAccessToken } = require("./auth.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.post("/api/register", authController.register);
app.post("/api/login", authController.login);
app.post("/api/refresh", authController.refresh);
app.post("/api/logout", authController.logout);

app.get("/api/profile", verifyAccessToken, authController.getProfile);

app.get("/", (req, res) => {
  res.send("Goods");
});

const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Сервер запущен на порту ${PORT}. Ожидание подключений...`);
    });
  } catch (error) {
    console.error("Не удалось запустить сервер:", error);
    process.exit(1);
  }
};

startServer();
