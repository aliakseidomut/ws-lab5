import {
  dialect as _dialect,
  storage as _storage,
  logging as _logging,
  pool as _pool,
  DB,
  USER,
  PASSWORD,
  HOST,
} from "../config/db.config.js";
import Sequelize from "sequelize";

let sequelize;
if (_dialect === "sqlite") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: _storage,
    logging: _logging,
    pool: _pool,
  });
} else {
  sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: HOST,
    dialect: _dialect,
    pool: _pool,
  });
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = require("./user.model.js").default(sequelize, Sequelize);

export default db;
