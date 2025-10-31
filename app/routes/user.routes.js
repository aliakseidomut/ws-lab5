import { authJwt } from "../middleware";
import { userBoard } from "../controllers/user.controller";

export default function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/user", [authJwt.verifyToken], userBoard);
  app.get("/api/test/session", [authJwt.verifySession], userBoard);
  app.get("/api/test/hybrid", [authJwt.hybridAuth], userBoard);
}
