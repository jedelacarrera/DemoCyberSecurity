"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sessions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "{}",
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("sessions", ["userId"]);
    await queryInterface.addIndex("sessions", ["token"]);
    await queryInterface.addIndex("sessions", ["expiresAt"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("sessions");
  },
};
