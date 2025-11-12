const { db } = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, user) => {
        if (err) return reject(err);
        resolve(user);
      }
    );
  });
};

const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
};

const createUser = async (username, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
      [userId, username, hashedPassword],
      function (err) {
        if (err) return reject(err);
        resolve({ id: userId, username });
      }
    );
  });
};

const comparePasswords = (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};

const createSession = async (userId, sessionId, refreshToken, userAgent) => {
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  const createdAt = Date.now();
  const expiresAt = createdAt + 7 * 24 * 60 * 60 * 1000;

  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO sessions (id, userId, refreshTokenHash, expiresAt, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [sessionId, userId, hashedToken, expiresAt, userAgent, createdAt],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

const findSessionById = (sessionId) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM sessions WHERE id = ?",
      [sessionId],
      (err, session) => {
        if (err) return reject(err);
        resolve(session);
      }
    );
  });
};

const deleteSession = (sessionId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM sessions WHERE id = ?", [sessionId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

const generateTokens = (user, sessionId) => {
  const accessTokenPayload = {
    userId: user.id,
    username: user.username,
    sessionId: sessionId,
  };

  const refreshTokenPayload = {
    userId: user.id,
    sessionId: sessionId,
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  findUserByUsername,
  findUserById,
  createUser,
  comparePasswords,
  createSession,
  findSessionById,
  deleteSession,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
