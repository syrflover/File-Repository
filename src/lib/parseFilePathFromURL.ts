import * as path from 'path';
import { Context } from 'koa';

export const parseFilePathFromContext = (ctx: Context) => {
    const r = path
        .join(`./${ctx.request.path.replace(/^\/v1\//, '')}`)
        .toLowerCase()
        .trim();

    try {
        const decoded = decodeURIComponent(r);
        return decoded;
    } catch {
        return r;
    }
};
