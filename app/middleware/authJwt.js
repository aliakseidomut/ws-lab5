const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const User = require("../models").user;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!",
    });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized! Token is invalid or expired",
      });
    }
    req.userId = decoded.id;
    next();
  });
};

verifySession = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    return next();
  }
  res.status(401).send({ message: "Unauthorized! No session." });
};

const hybridAuth = async (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];
  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7);
  }
  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (!err && decoded && decoded.id) {
        req.userId = decoded.id;
        return next();
      }
      trySession();
    });
  } else {
    trySession();
  }

  async function trySession() {
    const sessionId =
      req.headers["x-session-id"] ||
      req.cookies?.sessionId ||
      req.body.sessionId;
    if (!sessionId) {
      return res
        .status(401)
        .send({ message: "Unauthorized: no JWT nor session." });
    }
    const user = await User.findOne({ where: { sessionId } });
    console.log(
      "HybridAuth_Middleware: sessionId:",
      sessionId,
      "user:",
      user && user.toJSON && user.toJSON()
    );
    if (
      !user ||
      !(
        user.isSessionActive === true ||
        user.isSessionActive === 1 ||
        user.isSessionActive === "true"
      )
    ) {
      return res.status(401).send({ message: "Session invalid." });
    }
    req.userId = user.id;
    const newToken = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: "15m",
    });
    res.setHeader("x-new-access-token", newToken);
    return next();
  }
};

const authJwt = {
  verifyToken: verifyToken,
  verifySession: verifySession,
};
authJwt.hybridAuth = hybridAuth;
module.exports = authJwt;
