const express = require('express');

const {register, login, list, assign} = require('./controller');
const error = require('./error-handler');
const sequelize = require('./database');
const User = require('./model');
const bcrypt = require('bcrypt');

const app = express();

User.hasMany(User, {foreignKey: {
    name: 'boss_id',
    allowNull: true
}});

app.get('/register', register);
app.get('/login', login);
app.get('/list', list);
app.get('/assign', assign);
app.use(error);

sequelize.sync().then(async ()=> {
    //On first server startup when there are no users in the DB, it creates an admin user with 111111 password
    const adminUser = await User.findOne({
        where: {
            id: 1
        }
    });
    if (!adminUser) {
        const adminHash = await bcrypt.hash('111111', 12);
        await User.create({
            username: 'admin',
            password_hash: adminHash,
            admin: true
        });
    }
    app.listen(3000);
});
