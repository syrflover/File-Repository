import * as path from 'path';
import * as fs from '@syrflover/fs';
import * as mimetypes from 'mime-types';
import { router } from '../router';
import { logger } from '../logger';
import File from '../entity/File';
import { getRepository } from 'typeorm';
import { Context } from 'koa';
import { env } from '../env';
import { catcher } from './lib/catcher';
import { parseFilePathFromContext } from '../lib/parseFilePathFromURL';

// TODO: implement multipart upload
router.post(/\/v1\/.+\.[a-z]+/i, validate, async (ctx) => {
    const { filepath, contentType } = ctx.state;

    const fileRepo = getRepository(File);

    const now = new Date();

    const newFile = new File();
    newFile.path = filepath;
    newFile.content_type = contentType;
    newFile.created_at = now;
    newFile.updated_at = now;

    try {
        await fileRepo.save(newFile);

        const file = Buffer.from(ctx.request.body.data);

        const saveFilePath = path.join(env.BASE_PATH, filepath);

        logger.debug('saveFilePath =', saveFilePath);

        await fs.mkdir(path.dirname(saveFilePath), { recursive: true });

        await fs.writeFile(saveFilePath, file);

        ctx.status = 204;
        // ctx.response.set('Content-Type', contentType);
        // ctx.body = file;
    } catch (error) {
        catcher(error, ctx);
    }
});

async function validate(ctx: Context, next: () => Promise<any>) {
    const filepath = parseFilePathFromContext(ctx);
    const contentType = mimetypes.lookup(filepath);

    logger.debug('\nenv.BASE_PATH =', env.BASE_PATH);
    logger.debug('\nfilepath =', filepath);
    logger.debug('\ncontent-type =', contentType);
    logger.debug('\nctx.request.body =', ctx.request.body);

    const fileRepo = getRepository(File);

    const conflictFile = await fileRepo.findOne({ path: filepath });

    if (conflictFile) {
        ctx.status = 409;
        return;
    }

    if (!contentType) {
        ctx.status = 400;
        return;
    }

    ctx.state = {
        filepath,
        contentType,
    };

    return next();
}
