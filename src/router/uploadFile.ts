import * as path from 'path';
import { createWriteStream } from 'fs';
import * as fs from '@syrflover/fs';
import * as mimetypes from 'mime-types';
import * as Busboy from 'busboy';
import { router } from '../router';
import { logger } from '../logger';
import File from '../entity/File';
import { getRepository } from 'typeorm';
import { Context } from 'koa';
import { env } from '../env';
import { catcher } from './lib/catcher';
import { parseFilePathFromContext } from '../lib/parseFilePathFromURL';
import { IncomingMessage } from 'http';

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
        // const file = Buffer.from(ctx.request.body.data);

        const saveFilePath = path.join(env.BASE_PATH, filepath);
        const saveDirectory = path.dirname(saveFilePath);

        logger.debug('\nsave_file_path =', saveFilePath);
        logger.debug('\nsave_directory =', saveDirectory);

        logger.trace('fs.mkdir()');
        await fs.mkdir(saveDirectory, { recursive: true });

        // await fs.writeFile(saveFilePath, file);
        await busboy(saveFilePath, ctx.req);

        await fileRepo.save(newFile);

        ctx.status = 204;
        // ctx.response.set('Content-Type', contentType);
        // ctx.body = file;
    } catch (error) {
        catcher(error, ctx);
    }
});

const busboy = (savePath: string, req: IncomingMessage): Promise<void> =>
    new Promise((resolve, reject) => {
        const parser = new Busboy({ headers: req.headers });

        parser.on('file', (fieldName, file, fileName, encoding, mimeType) => {
            logger.debug(
                '\nfield_name =',
                fieldName,
                '\nfile_name =',
                fileName,
                '\nencoding =',
                encoding,
                '\nmime_type =',
                mimeType,
            );

            parser.on('finish', () => {
                logger.trace('parser end');
                resolve();
            });

            file.pipe(createWriteStream(savePath));
        });

        parser.on('error', (error: any) => {
            reject(error);
        });

        req.pipe(parser);
    });

async function validate(ctx: Context, next: () => Promise<any>) {
    const filepath = parseFilePathFromContext(ctx);
    const contentType = mimetypes.lookup(filepath);

    logger.debug('\nenv.BASE_PATH =', env.BASE_PATH);
    logger.debug('\nfilepath =', filepath);
    logger.debug('\ncontent-type =', contentType);
    // logger.debug('\nctx.request.body =', ctx.request.body);

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
