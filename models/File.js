const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db"); // Import sequelize instance from db.js

const File = sequelize.define("File", {
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    signedFilePath: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    signerName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    signedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Set to true if uploads are allowed without user association
        references: {
            model: "Users", // Name of the User table in the database
            key: "id", // Column in the User table to reference
        },
    },
});

module.exports = File;
