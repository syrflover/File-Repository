import * as http from 'http';

import { of } from '@syrflover/of';
import axios from 'axios';

import * as Koa from 'koa';
import * as koaLogger from 'koa-logger';
import * as koaBodyparser from 'koa-bodyparser';

import { router } from './router';

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
    const [res, error] = await of(
        tokenValidate(ctx.request.headers.Authorization),
    );

    if (error) {
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
