import './router.mod';

import { server } from './server';
import { logger } from './logger';
import { createConnection } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { env } from './env';

const main = async () => {
    const { PORT } = env;

    try {
        const p =
            process.env.NODE_ENV === 'development'
                ? '../ormconfig.development.json'
                : '../ormconfig.json';
        const ormconfig = (await import(p)) as PostgresConnectionOptions;

        await createConnection(ormconfig);
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }

    server.on('listening', async () => {
        logger.info(`Listening on ${PORT}`);
    });

    server.on('error', (error) => logger.error('Server Error', error));

    server.listen(parseInt(PORT!, 10));
};

main();
