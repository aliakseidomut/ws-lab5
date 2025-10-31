let config;
if (process.env.NODE_ENV === 'test') {
  config = {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  };
} else {
  config = {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || '11112',
    DB: process.env.DB_NAME || 'ws-lab4',
    dialect: 'postgres',
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  };
}
module.exports = config;
