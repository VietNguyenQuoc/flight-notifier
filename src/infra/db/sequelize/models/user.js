module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING
    },
    googleId: {
      type: DataTypes.STRING
    }
  });

  return User;
};
