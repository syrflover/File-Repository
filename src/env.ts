import * as path from 'path';
import * as dotenv from 'dotenv';
import { logger } from './logger';

export interface IEnv extends NodeJS.ProcessEnv {
    BASE_PATH: string;
    NODE_ENV: 'development' | 'production' | 'none';
    INTERNAL_IP: string;
}

const getEnv = (): IEnv => {
    dotenv.config();

    if (!process.env.BASE_PATH) {
        logger.error('Require BASE_PATH in Environment Varaibles');
        process.exit(1);
    }

    return {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'none',
        PORT: process.env.PORT || '30001',
        BASE_PATH: path.join(process.env.BASE_PATH!),
        INTERNAL_IP: process.env.INTERNAL_IP || '',
    } as IEnv;
};

export const env = getEnv();
