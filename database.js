const Sequelize = require('sequelize');

const key = process.env.KEY;

//sequelize connects to root user at localhost by default, looking for a schema 'users'
const sequelize = new Sequelize('users', 'root', key, {
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;