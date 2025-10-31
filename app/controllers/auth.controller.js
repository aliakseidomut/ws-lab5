import { user as _user } from "../models";
import { secret, refreshSecret } from "../config/auth.config";
const User = _user;

import { sign, verify } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { Op } from "sequelize";

// --- REGISTER ---
export async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required." });
  }

  const exists = await User.findOne({
    where: { [Op.or]: [{ username }, { email }] },
  });
  if (exists) {
    return res
      .status(400)
      .json({ message: "Username or email already exists" });
  }

  const sessionId = randomBytes(32).toString("hex");

  try {
    const user = await User.create({
      username,
      email,
      password, // ← храним пароль как есть (без bcrypt)
      sessionId,
      isSessionActive: true,
    });

    console.log("[REGISTER]:", user.toJSON());

    const accessToken = sign({ id: user.id }, secret, { expiresIn: "15m" });
    const refreshToken = sign({ id: user.id }, refreshSecret, {
      expiresIn: "7d",
    });

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.update({ refreshToken, refreshTokenExpires: expires });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      accessToken,
      refreshToken,
      sessionId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// --- LOGIN ---
export async function login(req, res) {
  const { username, email, password } = req.body;
  if ((!username && !email) || !password) {
    return res
      .status(400)
      .json({ message: "Username/email and password required" });
  }

  const user = await User.findOne({
    where: username ? { username } : { email },
  });
  if (!user) return res.status(404).json({ message: "User not found" });

  // обычное сравнение строк вместо bcrypt
  if (password !== user.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const sessionId = randomBytes(32).toString("hex");
  const accessToken = sign({ id: user.id }, secret, { expiresIn: "15m" });
  const refreshToken = sign({ id: user.id }, refreshSecret, {
    expiresIn: "7d",
  });

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.update({
    refreshToken,
    refreshTokenExpires: expires,
    sessionId,
    isSessionActive: true,
  });

  console.log(
    "[LOGIN]:",
    user.id,
    "sessionId:",
    sessionId,
    "isSessionActive:",
    user.isSessionActive
  );

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    accessToken,
    refreshToken,
    sessionId,
  });
}

// --- REFRESH ---
export async function refresh(req, res) {
  const { refreshToken, sessionId } = req.body;
  if (!refreshToken || !sessionId) {
    return res
      .status(400)
      .json({ message: "refreshToken и sessionId обязательны" });
  }

  let payload;
  try {
    payload = verify(refreshToken, refreshSecret);
  } catch {
    return res.status(401).json({ message: "Refresh token невалиден" });
  }

  const user = await User.findOne({
    where: { id: payload.id, sessionId, isSessionActive: true },
  });

  if (
    !user ||
    user.refreshToken !== refreshToken ||
    new Date() > user.refreshTokenExpires
  ) {
    return res
      .status(401)
      .json({ message: "Неверная или просроченная сессия/refreshToken" });
  }

  const newSessionId = randomBytes(32).toString("hex");
  const accessToken = sign({ id: user.id }, secret, { expiresIn: "15m" });
  const newRefreshToken = sign({ id: user.id }, refreshSecret, {
    expiresIn: "7d",
  });

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.update({
    refreshToken: newRefreshToken,
    refreshTokenExpires: expires,
    sessionId: newSessionId,
    isSessionActive: true,
  });

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    accessToken,
    refreshToken: newRefreshToken,
    sessionId: newSessionId,
  });
}

// --- LOGOUT ---
export async function logout(req, res) {
  const { sessionId } = req.body;
  if (!sessionId)
    return res.status(400).json({ message: "sessionId required" });

  const user = await User.findOne({ where: { sessionId } });
  if (!user || !user.isSessionActive)
    return res.status(400).json({ message: "Сессия не найдена" });

  await user.update({
    refreshToken: null,
    refreshTokenExpires: null,
    sessionId: null,
    isSessionActive: false,
  });

  res.status(200).json({ message: "Logout ok" });
}

// --- ME ---
export async function me(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "Not found" });
  const { id, username, email, sessionId } = user;
  res.json({ id, username, email, sessionId });
}
