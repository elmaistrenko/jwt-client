const fetch = require('node-fetch');

let token = {};

const processFetchResult = async (res, store) => {
    const json = await res.json();
    if (!res.ok)
        throw new Error(json.error.message);
    await store({...json, creationTs: +new Date()});
};

const loginLow = async (url, options, store) => {
    const res = await fetch(url, options());
    await processFetchResult(res, store);
};

const refresh = async (url, options, store) => {
    const res = await fetch(url, options(token));
    await processFetchResult(res, store);
};

class LoginRequiredError extends Error {
    constructor () {
        super('Login required');
    }
}

const loginOptionsDefault = credentials => (() => ({
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
}));

const storeDefault = value => {
    if (value)
        token = {...value};
    return {...token};
};

const actualFormatted = async ({
    allowLogin = true,
    loginUrl,
    credentials,
    refreshUrl,
    header = 'authorization',
    defaultTokenType = '',
    keys: {
        accessToken='accessToken',
        refreshToken='refreshToken',
        accessExpiresIn='accessExpiresIn',
        refreshExpiresIn='refreshExpiresIn',
        tokenType='tokenType',
    }={},
    loginOptions = loginOptionsDefault(credentials),
    refreshBody = token => ({ token: token[refreshToken] }),
    refreshOptions = token => ({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(refreshBody(token)),
    }),
    result = token => {
        let tokenTypePart = token[tokenType] || defaultTokenType;
        if (tokenTypePart)
            tokenTypePart += ' ';

        return { [header]: tokenTypePart + token[accessToken] };
    },
    store = storeDefault,
}) => {
    const token = await store();
    if (
        token[accessToken] &&
        token[accessExpiresIn] &&
        token.creationTs &&
        token.creationTs + token[accessExpiresIn]*1000 - 60000 > +new Date()
    ) {
        // Have actual access token
    } else if (
        token[refreshToken] &&
        token[refreshExpiresIn] &&
        token.creationTs &&
        token.creationTs + token[refreshExpiresIn]*1000 - 60000 > +new Date()
    ) {
        await refresh(refreshUrl, refreshOptions, store);
    } else {
        if (!allowLogin)
            throw new LoginRequiredError();
        await loginLow(loginUrl, loginOptions, store);
    }

    return result(await store());
};

const login = async ({ url, credentials, options=loginOptionsDefault(credentials), store=storeDefault }) => {
    return await loginLow(url, options, store);
};

module.exports = {
    actualFormatted,
    login,
    LoginRequiredError,
};
