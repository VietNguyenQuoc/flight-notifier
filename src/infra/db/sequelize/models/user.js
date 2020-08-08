module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING
    },
    googleId: {
      type: DataTypes.STRING
    }
  });

  User.associate = function (models) {
    User.belongsToMany(models.Flight, { through: models.Subscription, foreignKey: 'userId' });
    User.hasMany(models.Subscription, { foreignKey: 'userId' });
  }

  return User;
};
