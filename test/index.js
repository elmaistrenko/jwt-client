require('dotenv').config();
const { actualFormatted: token } = require('../index');

const options = {
    loginUrl: process.env.LOGIN_URL,
    credentials: {
        email: process.env.EMAIL,
        password: process.env.PASSWORD,
    },
    refreshUrl: process.env.REFRESH_URL,
    keys: {},
};

token(options).then(console.log).catch(console.log);

setTimeout(() => token(options).then(console.log).catch(console.log), 1000);

setTimeout(() => token(options).then(console.log).catch(console.log), 300*1000);

setTimeout(() => token(options).then(console.log).catch(console.log), 43200*1000);
