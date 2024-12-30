// // models/File.js
// const { DataTypes } = require("sequelize");
// const { sequelize } = require("../config/db"); // Import sequelize instance from db.js


// const File = sequelize.define("File", {
//   fileName: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   filePath: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   signerName: {
//     type: DataTypes.STRING,
//     allowNull: true, // Signer name can be null until the file is signed
//   },
//   signedFilePath: {
//     type: DataTypes.STRING,
//     allowNull: true, // Path of signed PDF, will be null for unsigned files
//   },
//   signedAt: {
//     type: DataTypes.DATE,
//     allowNull: true, // Will be null until signed
//   },
// });

// module.exports = File;




// models/File.js
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
});

module.exports = File;

//