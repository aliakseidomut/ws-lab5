const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }
  const exists = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
  if (exists) {
    return res.status(409).json({ message: "Username or email already exists" });
  }
  const hash = bcrypt.hashSync(password, 8);
  const sessionId = crypto.randomBytes(32).toString("hex");
  try {
    const user = await User.create({
      username,
      email,
      password: hash,
      sessionId,
      isSessionActive: true
    });
    const accessToken = jwt.sign({ id: user.id }, config.secret, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, config.refreshSecret, { expiresIn: "7d" });
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.update({ refreshToken, refreshTokenExpires: expires });
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      accessToken,
      refreshToken,
      sessionId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, email, password } = req.body;
  if ((!username && !email) || !password) {
    return res.status(400).json({ message: "Username/email and password required" });
  }
  const user = await User.findOne({
    where: username ? { username } : { email },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  const bcrypt = require("bcryptjs");
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const jwt = require("jsonwebtoken");
  const config = require("../config/auth.config");
  const sessionId = crypto.randomBytes(32).toString("hex");
  const accessToken = jwt.sign({ id: user.id }, config.secret, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user.id }, config.refreshSecret, { expiresIn: "7d" });
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.update({ refreshToken, refreshTokenExpires: expires, sessionId, isSessionActive: true });
  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    accessToken,
    refreshToken,
    sessionId
  });
};

exports.refresh = async (req, res) => {
  const { refreshToken, sessionId } = req.body;
  if (!refreshToken || !sessionId) {
    return res.status(400).json({ message: "refreshToken и sessionId обязательны" });
  }
  const jwt = require("jsonwebtoken");
  const config = require("../config/auth.config");
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.refreshSecret);
  } catch {
    return res.status(401).json({ message: "Refresh token невалиден" });
  }
  const user = await User.findOne({ where: { id: payload.id, sessionId, isSessionActive: true } });
  if (!user || user.refreshToken !== refreshToken || new Date() > user.refreshTokenExpires) {
    return res.status(401).json({ message: "Неверная или просроченная сессия/refreshToken" });
  }
  
  const newSessionId = crypto.randomBytes(32).toString("hex");
  const accessToken = jwt.sign({ id: user.id }, config.secret, { expiresIn: "15m" });
  const newRefreshToken = jwt.sign({ id: user.id }, config.refreshSecret, { expiresIn: "7d" });
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.update({ refreshToken: newRefreshToken, refreshTokenExpires: expires, sessionId: newSessionId, isSessionActive: true });
  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    accessToken,
    refreshToken: newRefreshToken,
    sessionId: newSessionId
  });
};

exports.logout = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ message: "sessionId required" });
  const user = await User.findOne({ where: { sessionId } });
  if (!user || !user.isSessionActive) return res.status(400).json({ message: "Сессия не найдена" });
  await user.update({
    refreshToken: null,
    refreshTokenExpires: null,
    sessionId: null,
    isSessionActive: false
  });
  res.status(200).json({ message: "Logout ok" });
};

exports.me = async (req, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "Not found" });
  const { id, username, email, sessionId } = user;
  res.json({ id, username, email, sessionId });
};
