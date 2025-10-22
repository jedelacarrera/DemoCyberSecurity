"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("posts", [
      {
        title: "Public Post",
        content: "This is a public post visible to everyone.",
        userId: 2, // user
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Alice Private Post",
        content: "This is Alice's private post.",
        userId: 3, // alice
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Bob Secret Post",
        content: "This is Bob's secret post with confidential information.",
        userId: 4, // bob
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Admin Announcement",
        content: "This is an admin announcement.",
        userId: 1, // admin
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("posts", null, {});
  },
};
