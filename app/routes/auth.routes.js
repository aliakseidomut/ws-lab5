import { verifySignUp } from "../middleware";
import controller from "../controllers/auth.controller";

export default function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  const controller = require("../controllers/auth.controller");
  const { hybridAuth } = require("../middleware/authJwt").default;
  app.post("/api/auth/register", controller.register);
  app.post("/api/auth/login", controller.login);
  app.post("/api/auth/refresh", controller.refresh);
  app.post("/api/auth/logout", controller.logout);
  app.get("/api/auth/me", hybridAuth, controller.me);
}
