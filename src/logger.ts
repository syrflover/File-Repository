import { getLogger } from 'log4js';

export const logger = getLogger('file-repository');
logger.level = process.env.LOG_LEVEL || 'info';
