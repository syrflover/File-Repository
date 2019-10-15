import { Context } from 'koa';
import { logger } from '../../logger';

export const catcher = (error: any, ctx: Context) => {
    logger.trace('catcher()');
    const status = 500;
    const body = error.message || 'unknown error';

    ctx.status = status;
    ctx.body = body;

    logger.error(ctx.request.originalUrl, ctx.request, error);
};
