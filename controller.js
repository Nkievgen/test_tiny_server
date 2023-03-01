const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./model');

const SECRET = 'tinyserversecret';

const validateTokenAndGetUser = async (token, next) => {
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, SECRET);
    } catch (error) {
        return false;
    }
    const userId = decodedToken.userId;
    const user = await User.findOne({
        where: {
            id: userId
        }
    });
    return user;
};

const getSubordinates = async (user) => {
    const userList = [];

    const subordinates = await User.findAll({
        where: {
            boss_id: user.id
        }
    });
    for (const subordinate of subordinates) {
        userList.push({
            username: subordinate.username,
            boss: user.username
        });
        const subSubordinates = await getSubordinates(subordinate);
        for (const subSubordinate of subSubordinates) {
            userList.push({
                username: subSubordinate.username,
                boss: subSubordinate.boss
            });
        }
    }
    return userList;
}

const register = async (req, res, next) => {
    const username = req.query.username;
    const password = req.query.password;

    if (!username && !password) {
        return next(new Error('Please provide a password and a username'));
    }

    if (!username) {
        return next(new Error('Please provide a username'));
    }

    if (!password) {
        return next(new Error('Please provide a password'));
    }

    const existingUser = await User.findOne({
        where: {
            username: username
        }
    });

    if (existingUser) {
        const error = new Error('User with this username already exists');
        return next(error);
    }

    const hash = await bcrypt.hash(password, 12);
    await User.create({
        username: username,
        password_hash: hash,
        admin: false
    });
    res.status(200).json({
        message: `User ${username} registered successfully.`
    });
};

const login = async (req, res, next) => {
    const username = req.query.username;
    const password = req.query.password;

    if (!username && !password) {
        return next(new Error('Please provide a password and a username'));
    }

    if (!username) {
        return next(new Error('Please provide a username'));
    }

    if (!password) {
        return next(new Error('Please provide a password'));
    }

    const foundUser = await User.findOne({
        where: {
            username: username
        }
    });

    if (!foundUser) {
        const error = new Error('User not found');
        return next(error);
    }

    const hash = foundUser.password_hash;
    const passwordCheckResult = await bcrypt.compare(password, hash);
    if (passwordCheckResult === false) {
        const error = new Error('Wrong password');
        return next(error);
    }
    const userId = foundUser.id;
    const token = jwt.sign({userId: userId}, SECRET, {expiresIn: '24h'});
    res.status(200).json({
        message: 'Authorization successful.',
        token: token
    });
};

const list = async (req, res, next) => {
    const user = await validateTokenAndGetUser(req.query.token, next);
    if (!user) {
        const error = new Error('Authorization failed');
        return next(error);
    }
    let userList;

    if (user.admin) {
        const users = await User.findAll();
        userList = users.map(user => {
            const username = user.username;
            const boss = users.find(bossUser => {
                return bossUser.id === user.boss_id;
            });
            const bossUsername = boss ? boss.username : null;
            return {username: username, boss: bossUsername};
        });
    } else {
        const boss = await User.findOne({
            where: {
                id: user.boss_id
            }
        });
        console.log('boss: ', boss);
        const bossName = boss ? boss.username : null;
        userList = [];
        userList.push({
            username: user.username,
            boss: bossName
        });
        const subordinates = await getSubordinates(user);
        for (const subordinate of subordinates) {
            userList.push({
                username: subordinate.username,
                boss: subordinate.boss
            });
        }
    }
    console.log('userlist: ', userList);
    res.status(200).json({
        message: 'List of users fetched successfully.',
        data: userList
    });
};

const assign = async (req, res, next) => {
    const assigneeName = req.query.assignee;
    const bossName = req.query.boss;
    const user = await validateTokenAndGetUser(req.query.token, next);

    if (!user) {
        const error = new Error('Authorization failed');
        return next(error);
    }
    
    const assignee = await User.findOne({
        where: {
            username: assigneeName
        }
    });
    const boss = await User.findOne({
        where: {
            username: bossName
        }
    });
    
    if (!assignee && !boss) {
        const error = new Error(`Users ${assigneeName} and ${bossName} are not found`);
        return next(error);
    }
    if (!assignee) {
        const error = new Error(`User ${assigneeName} not found`);
        return next(error);
    }
    if (!boss) {
        const error = new Error(`User ${bossName} not found`);
        return next(error);
    }

    if (!user.admin) {
        const subordinates = await getSubordinates(user);
        if (subordinates.length === 0) {
            const error = new Error('You are not authorized to assign anyone as you have no subordinates');
            return next(error);
        }
        const foundSubordinateAssignee = subordinates.find(subordinate => {
            return subordinate.username === assigneeName;
        });
        const foundSubordinateBoss = subordinates.find(subordinate => {
            return subordinate.username === bossName;
        });
        if (!foundSubordinateAssignee && !foundSubordinateBoss) {
            const error = new Error(`Users ${assigneeName} and ${bossName} are not your subordinates`);
            return next(error);
        }
        if (!foundSubordinateBoss) {
            const error = new Error(`User ${bossName} is not your subordinate`);
            return next(error);
        }
        if (!foundSubordinateAssignee) {
            const error = new Error(`User ${assigneeName} is not your subordinate`);
            return next(error);
        }
    }
    
    assignee.boss_id = boss.id;
    await assignee.save();

    res.status(200).json({
        message: `Assignment succesfull: ${assigneeName} is now a subordinate of ${bossName}.`
    });
};

module.exports = {register, login, list, assign};