"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add payment_gateway & order_id column to identify which gateway was used for the payment
    await queryInterface.addColumn("payments", "payment_gateway", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("payments", "order_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 2. Rename existing Stripe specific columns to generic gateway columns
    await queryInterface.renameColumn(
      "payments",
      "stripe_session_id",
      "session_id"
    );
    await queryInterface.renameColumn(
      "payments",
      "stripe_payment_intent_id",
      "payment_intent_id"
    );
    await queryInterface.renameColumn(
      "payments",
      "stripe_client_secret",
      "client_secret"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse renames
    await queryInterface.renameColumn(
      "payments",
      "session_id",
      "stripe_session_id"
    );
    await queryInterface.renameColumn(
      "payments",
      "payment_intent_id",
      "stripe_payment_intent_id"
    );
    await queryInterface.renameColumn(
      "payments",
      "client_secret",
      "stripe_client_secret"
    );

    // Remove added columns
    await queryInterface.removeColumn("payments", "payment_gateway");
    await queryInterface.removeColumn("payments", "order_id");
  },
};
