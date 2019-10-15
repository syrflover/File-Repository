import * as http from 'http';

import * as Koa from 'koa';
import * as koaLogger from 'koa-logger';
import * as koaBodyparser from 'koa-bodyparser';

import { router } from './router';

const app = new Koa();
export const server = http.createServer(app.callback());

app.use(koaLogger());

app.use(
    koaBodyparser({
        formLimit: '100mb',
    }),
);

app.use(router.routes()).use(router.allowedMethods());
