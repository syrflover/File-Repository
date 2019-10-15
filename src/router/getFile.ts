import * as path from 'path';
import { router } from '../router';
import { parseFilePathFromContext } from '../lib/parseFilePathFromURL';
import { getRepository } from 'typeorm';
import * as koaSend from 'koa-send';

import File from '../entity/File';

import { env } from '../env';
import { catcher } from './lib/catcher';

router.get(/\/v1\/.+\.[a-z]+/i, async (ctx) => {
    const filepath = parseFilePathFromContext(ctx);

    const fileRepo = getRepository(File);

    try {
        const file = await fileRepo.findOne({ path: filepath });

        if (!file) {
            ctx.status = 404;
            return;
        }

        await koaSend(ctx, path.join(env.BASE_PATH, file.path), {
            setHeaders: (res) =>
                res.setHeader('Content-Type', file.content_type),
        });
    } catch (error) {
        catcher(error, ctx);
    }
});
