const authService = require("./auth.service");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Имя пользователя и пароль обязательны." });
  }
  try {
    const existingUser = await authService.findUserByUsername(username);
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Пользователь с таким именем уже существует." });
    }
    const user = await authService.createUser(username, password);
    res.status(201).json({
      message: "Пользователь успешно зарегистрирован.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера." });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Имя пользователя и пароль обязательны." });
  }

  try {
    const user = await authService.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Неверные учетные данные." });
    }

    const isPasswordValid = await authService.comparePasswords(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Неверные учетные данные." });
    }

    const sessionId = uuidv4();

    const { accessToken, refreshToken } = authService.generateTokens(
      user,
      sessionId
    );

    await authService.createSession(
      user.id,
      sessionId,
      refreshToken,
      req.headers["user-agent"] || "unknown"
    );

    res.cookie("jwt", refreshToken, cookieOptions);
    res.json({
      message: "Вход выполнен успешно.",
      accessToken,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Ошибка входа:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера." });
  }
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies.jwt;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh-токен не найден." });
  }

  try {
    const payload = authService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ message: "Невалидный refresh-токен." });
    }

    const session = await authService.findSessionById(payload.sessionId);
    if (!session || session.userId !== payload.userId) {
      return res
        .status(403)
        .json({ message: "Сессия не найдена или недействительна." });
    }

    if (session.expiresAt < Date.now()) {
      return res.status(403).json({ message: "Сессия истекла." });
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash
    );
    if (!isTokenValid) {
      return res
        .status(403)
        .json({ message: "Несоответствие токена. Вход невозможен." });
    }

    const user = await authService.findUserById(payload.userId);
    if (!user) {
      return res
        .status(403)
        .json({ message: "Пользователь сессии не найден." });
    }

    const { accessToken } = authService.generateTokens(user, session.id);

    res.json({
      message: "Access-токен успешно обновлен.",
      accessToken,
    });
  } catch (error) {
    console.error("Ошибка обновления токена:", error);
    res.status(403).json({ message: "Ошибка при обновлении токена." });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.jwt;
  if (!refreshToken) {
    return res.status(204).send();
  }

  try {
    const payload = authService.verifyRefreshToken(refreshToken);

    if (payload && payload.sessionId) {
      await authService.deleteSession(payload.sessionId);
    }
  } catch (error) {}

  res.clearCookie("jwt", cookieOptions);
  res.json({ message: "Выход выполнен успешно." });
};

const getProfile = (req, res) => {
  res.json({
    message: "Доступ к защищенному ресурсу получен.",
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
};
