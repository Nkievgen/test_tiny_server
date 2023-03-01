const Sequelize = require('sequelize');
const key = require('./key');

const sequelize = new Sequelize('users', 'root', key, {
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;