import * as path from 'path';
import { router } from '../router';
import { parseFilePathFromContext } from '../lib/parseFilePath';
import { getRepository } from 'typeorm';

import File from '../entity/File';

import { env } from '../env';
import { catcher } from './lib/catcher';
import { v1 } from './lib/regURL';
import { serve } from './lib/serve';

router.get(v1, async (ctx) => {
    const filepath = parseFilePathFromContext(ctx);

    const fileRepo = getRepository(File);

    try {
        const file = await fileRepo.findOne({ path: filepath });

        if (!file) {
            ctx.status = 404;
            return;
        }

        await serve(ctx, path.join(env.BASE_PATH, file.path), file, { maxAge: 3600 * 24 * 14 });
    } catch (error) {
        catcher(error, ctx);
    }
});
