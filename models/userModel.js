

// models/userModel.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db"); // Import sequelize instance from db.js

// Define User model
const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
});

// Export the User model
module.exports = User;
