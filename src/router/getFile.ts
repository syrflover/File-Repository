import * as path from 'path';
import { router } from '../router';
import { parseFilePathFromContext } from '../lib/parseFilePath';
import { getRepository, Like } from 'typeorm';

import File from '../entity/File';

import { env } from '../env';
import { catcher } from './lib/catcher';
import { v1 } from './lib/regURL';
import { serve } from './lib/serve';
import { logger } from '../logger';

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

        await serve(ctx, path.join(env.BASE_PATH, file.path), file, { maxAge: 3600 * 24 * 14 });
    } catch (error) {
        catcher(error, ctx);
    }
});
