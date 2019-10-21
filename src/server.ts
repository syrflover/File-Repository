import * as http from 'http';

import { of } from '@syrflover/of';
import axios from 'axios';

import * as Koa from 'koa';
import * as koaLogger from 'koa-logger';
import * as koaBodyparser from 'koa-bodyparser';

import { router } from './router';
import { env } from './env';
import { logger } from './logger';
import { checkLocalHost } from './lib/checkLocalHost';

const app = new Koa();
export const server = http.createServer(app.callback());

app.use(koaLogger());

app.use(authChecker);

app.use(
    koaBodyparser({
        formLimit: '100mb',
    }),
);

app.use(router.routes()).use(router.allowedMethods());

async function authChecker(ctx: Koa.Context, next: () => Promise<any>) {
    const remoteFamily = ctx.req.connection.remoteFamily;
    const remoteAddress = ctx.req.connection.remoteAddress || '';

    logger.debug('localAddress  =', ctx.req.connection.localAddress);
    logger.debug('remoteAddress =', remoteAddress);
    // logger.debug('localFamily =', ctx.req.connection.local)
    logger.debug('remoteFamily  =', remoteFamily);
    logger.debug('ctx.request.headers =', ctx.request.headers);

    /* if (env.NODE_ENV === 'development') {
        return next();
    } */

    const isLocal = await checkLocalHost(remoteAddress);
    logger.debug('isLocal =', isLocal);

    if (isLocal) {
        return next();
    }

    const token =
        ctx.request.headers.authorization ||
        ctx.request.query.authorization ||
        '';

    const [res, error] = await of(tokenValidate(token));

    if (error) {
        // logger.error(error);
        if (error.response && error.response.status) {
            ctx.status = error.response.status;
            ctx.body = error.response.data || 'Unknown Error';
            return;
        }
        ctx.status = 500;
        ctx.body = error.message || 'Unknown Error';
        return;
    }

    // only developer
    if (res.data.role <= 0) {
        ctx.status = 403;
        ctx.body = 'Permission Denied';
        return;
    }

    return next();
}

function tokenValidate(token: string) {
    return axios.get('https://api.madome.app/v2/auth/token', {
        params: {
            token_type: 'auth_code',
        },
        headers: { Authorization: token },
    });
}
