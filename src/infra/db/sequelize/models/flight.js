module.exports = (sequelize, DataTypes) => {
  const Flight = sequelize.define("Flight", {
    externalId: {
      type: DataTypes.STRING
    },
    date: {
      type: DataTypes.DATEONLY
    },
    departureTime: {
      type: DataTypes.STRING,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false
    },
    info: {
      type: DataTypes.JSON
    },
    code: {
      type: DataTypes.STRING
    },
    jobRunning: {
      type: DataTypes.BOOLEAN
    }
  });

  Flight.associate = function (models) {
    Flight.belongsToMany(models.User, { through: models.Subscription, foreignKey: 'flightId' });
    Flight.hasMany(models.Subscription, { foreignKey: 'flightId' });
  }

  return Flight;
};
