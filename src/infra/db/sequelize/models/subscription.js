module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define("Subscription", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    flightId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled')
    },
  });

  Subscription.associate = function (models) {
    Subscription.belongsTo(models.Flight, { foreignKey: 'flightId' });
    Subscription.belongsTo(models.User, { foreignKey: 'userId' });
  }

  return Subscription;
};
