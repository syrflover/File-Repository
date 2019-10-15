import * as path from 'path';
import * as dotenv from 'dotenv';
import { logger } from './logger';

export interface IEnv extends NodeJS.ProcessEnv {
    BASE_PATH: string;
}

const getEnv = () => {
    dotenv.config();

    if (!process.env.BASE_PATH) {
        logger.error('Require BASE_PATH in Environment Varaibles');
        process.exit(1);
    }

    return {
        ...process.env,
        BASE_PATH: path.join(process.env.BASE_PATH!),
        PORT: parseInt(process.env.PORT || '30001', 10),
        isDev: process.env.NODE_ENV === 'development',
    } as any;
};

export const env = getEnv();
