"use strict";
const bcrypt = require("bcrypt");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);

    await queryInterface.bulkInsert("users", [
      {
        username: "admin",
        email: "admin@example.com",
        password: await bcrypt.hash("admin123", salt),
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "user",
        email: "user@example.com",
        password: await bcrypt.hash("user123", salt),
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "alice",
        email: "alice@example.com",
        password: await bcrypt.hash("alice123", salt),
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "bob",
        email: "bob@example.com",
        password: await bcrypt.hash("bob123", salt),
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};
