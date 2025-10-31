const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

let sequelize;
if (config.dialect === "sqlite") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: config.storage,
    logging: config.logging,
    pool: config.pool
  });
} else {
  sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    dialect: config.dialect,
    pool: config.pool,
  });
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = require("./user.model.js")(sequelize, Sequelize);

module.exports = db;
