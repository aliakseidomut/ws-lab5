const authService = require("./auth.service");

const verifyAccessToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Токен не предоставлен или имеет неверный формат" });
  }

  const token = authHeader.split(" ")[1];

  const payload = authService.verifyAccessToken(token);
  if (!payload) {
    return res
      .status(401)
      .json({ message: "Невалидный или просроченный access-токен." });
  }

  try {
    const session = await authService.findSessionById(payload.sessionId);

    if (!session || session.userId !== payload.userId) {
      return res.status(401).json({
        message: "Сессия недействительна (возможно, выполнен выход).",
      });
    }

    if (session.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Сессия истекла." });
    }

    req.user = {
      id: payload.userId,
      username: payload.username,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    console.error("Ошибка проверки middleware:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера." });
  }
};

module.exports = {
  verifyAccessToken,
};
