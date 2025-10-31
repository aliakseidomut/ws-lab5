export default (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    refreshToken: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    refreshTokenExpires: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    sessionId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isSessionActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return User;
};
