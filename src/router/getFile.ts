import * as path from 'path';
import * as fs from 'fs';

import { router } from '../router';
import { parseFilePathFromContext } from '../lib/parseFilePath';
import { getRepository, Like } from 'typeorm';

import File from '../entity/File';

import { env } from '../env';
import { catcher } from './lib/catcher';
import { v1 } from './lib/regURL';
import { serve } from './lib/serve';
import { logger } from '../logger';

/* const readFile = (p: string): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        fs.readFile(p, (err, buf) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(buf);
        });
    }); */

const readDir = (p: string): Promise<string[]> =>
    new Promise((resolve, reject) => {
        fs.readdir(p, (err, xs) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(xs);
        });
    });

const extRegexp = /\.[a-z0-9]+$/i;

router.get(v1, async (ctx) => {
    const filepath = parseFilePathFromContext(ctx);

    const fileRepo = getRepository(File);

    try {
        let file: File | undefined;

        // Request URL Path에 파일 확장자가 명시되어 있지 않은 경우에는
        // Like으로 파일을 찾은 후,
        // 파일 이름이 같은지 확인하고 같지 않으면 404, 같으면 정상적으로 보냄
        if (!extRegexp.test(filepath)) {
            file = await fileRepo.findOne({ path: Like(`${filepath}%`) });

            const isSame = file?.path.replace(extRegexp, '').replace(filepath, '');

            if (isSame?.length ?? 0 <= 0) {
                file = undefined;
            }
        } else {
            file = await fileRepo.findOne({ path: filepath });
        }

        if (!file) {
            ctx.status = 404;
            return;
        }

        const joinedFilePath = path.join(env.BASE_PATH, file.path);

        if (
            (file.path.endsWith('image_list') || file.path.endsWith('image_list.txt')) &&
            ('x-madome-2022' in ctx.headers || 'madome-2022' in ctx.request.query)
        ) {
            const imageList = (await readDir(path.dirname(joinedFilePath))).filter(
                (x) => !x.endsWith('.txt') && !x.endsWith('image_list'),
            );

            if (imageList.length <= 0) {
                ctx.status = 404;
                return;
            }

            ctx.status = 200;
            ctx.body = imageList;
            return;
        }

        await serve(ctx, joinedFilePath, file, { maxAge: 3600 * 24 * 14 });
    } catch (error) {
        catcher(error, ctx);
    }
});
