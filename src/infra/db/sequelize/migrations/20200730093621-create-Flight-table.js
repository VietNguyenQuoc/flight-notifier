"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Flights", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      externalId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      departureTime: {
        type: Sequelize.STRING,
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false
      },
      destination: {
        type: Sequelize.STRING,
        allowNull: false
      },
      info: {
        type: Sequelize.JSON
      },
      code: {
        type: Sequelize.STRING
      },
      jobRunning: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    return await Promise.all([
      queryInterface.addIndex('Flights', { fields: ["source", "destination", "departureTime", "code"] }),
      queryInterface.addIndex('Flights', { fields: ["externalId"] }),
    ]);
  },
  down: (queryInterface, ) => {
    return queryInterface.dropTable("Flights");
  }
};
