import * as path from 'path';
import * as fs from '@syrflover/fs';
import * as mimetypes from 'mime-types';
import * as prettyBytes from 'pretty-bytes';
import { getRepository } from 'typeorm';
import { Context } from 'koa';

import { router } from '../router';
import { logger } from '../logger';
import File from '../entity/File';
import { env } from '../env';
import { catcher } from './lib/catcher';
import { parseFilePathFromContext } from '../lib/parseFilePathFromURL';
import { busboy } from './lib/busboy';
import { v1 } from './lib/regURL';

router.post(v1, validate, async (ctx) => {
    const { filepath, contentType } = ctx.state;

    const fileRepo = getRepository(File);

    const now = new Date();

    const newFile = new File();
    newFile.path = filepath;
    newFile.content_type = contentType;
    newFile.created_at = now;
    newFile.updated_at = now;

    try {
        const saveFilePath = path.join(env.BASE_PATH, filepath);
        const saveDirectory = path.dirname(saveFilePath);

        logger.debug('save_file_path =', saveFilePath);
        logger.debug('save_directory =', saveDirectory);

        await fs.mkdir(saveDirectory, { recursive: true });

        const { size } = await busboy(saveFilePath, ctx.req);
        logger.debug('pretty size =', prettyBytes(size));
        logger.debug('       size =', size);

        newFile.content_length = size;

        await fileRepo.save(newFile);

        ctx.status = 204;
    } catch (error) {
        catcher(error, ctx);
    }
});

async function validate(ctx: Context, next: () => Promise<any>) {
    const filepath = parseFilePathFromContext(ctx);
    const contentType = mimetypes.lookup(filepath);

    logger.debug('env.BASE_PATH =', env.BASE_PATH);
    logger.debug('filepath      =', filepath);
    logger.debug('content-type  =', contentType);
    // logger.debug('ctx.request.body =', ctx.request.body);

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
