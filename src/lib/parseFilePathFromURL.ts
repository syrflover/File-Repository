import * as path from 'path';
import { Context } from 'koa';

export const parseFilePathFromContext = (ctx: Context) =>
    path
        .join(`./${ctx.request.path.replace(/^\/v1\//, '')}`)
        .toLowerCase()
        .trim();
