const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const dbPath = process.env.DATABASE_PATH || "auth.db";
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )
            `,
        (err) => {
          if (err) {
            console.error("Ошибка при создании таблицы 'users':", err.message);
            return reject(err);
          }
          console.log("Таблица 'users' успешно готова.");
        }
      );

      db.run(
        `
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    userId TEXT NOT NULL,
                    refreshTokenHash TEXT NOT NULL,
                    expiresAt INTEGER NOT NULL,
                    userAgent TEXT,
                    createdAt INTEGER NOT NULL,
                    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
                )
            `,
        (err) => {
          if (err) {
            console.error(
              "Ошибка при создании таблицы 'sessions':",
              err.message
            );
            return reject(err);
          }
          console.log("Таблица 'sessions' успешно готова.");
          resolve();
        }
      );
    });
  });
};

module.exports = { db, initDb };
